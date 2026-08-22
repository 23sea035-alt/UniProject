import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. AUTOMATED RED-BILL & GRACE PERIOD VALVE CUTOFF WORKFLOW
 * Runs every night at midnight to check overdue bills against configured grace periods.
 */
export const checkOverdueAndEnforceRedBills = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Colombo")
  .onRun(async () => {
    const todayIso = new Date().toISOString().split("T")[0];
    functions.logger.info(`[NWSDB AUDIT] Running daily Red-Bill & Grace Period check for: ${todayIso}`);

    // Fetch active tariff configuration to get grace period days
    const tariffSnap = await db.collection("tariffs").where("category", "==", "DOMESTIC").limit(1).get();
    const gracePeriodDays = tariffSnap.empty ? 14 : (tariffSnap.docs[0].data().gracePeriodDays || 14);

    // Fetch unpaid bills (PENDING, OVERDUE)
    const unpaidBillsSnap = await db.collection("bills")
      .where("status", "in", ["PENDING", "OVERDUE"])
      .get();

    for (const doc of unpaidBillsSnap.docs) {
      const bill = doc.data();
      const dueDate = new Date(bill.dueDate);
      const today = new Date(todayIso);

      // Check if past due date
      if (today > dueDate) {
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        if (daysOverdue < gracePeriodDays) {
          // In Grace Period: Mark OVERDUE and send warning reminder
          if (bill.status !== "OVERDUE") {
            await doc.ref.update({ status: "OVERDUE" });
            await sendSmsNotification(
              bill.customerId,
              `[NWSDB Alert] Bill #${bill.billNumber} of LKR ${bill.outstandingBalance} is overdue. Grace period ends in ${gracePeriodDays - daysOverdue} days. Please pay to avoid disconnection.`
            );
          }
        } else {
          // Grace Period Expired: Mark RED BILL & Actuate Automatic Valve Closure
          await doc.ref.update({ status: "RED_BILL" });

          const userRef = db.collection("users").doc(bill.customerId);
          const userSnap = await userRef.get();
          const userData = userSnap.data();

          if (userData && userData.valveStatus === "OPEN") {
            // 1. Create CLOSE_VALVE command for ESP32
            const commandRef = db.collection("valveCommands").doc();
            const commandPayload = {
              id: commandRef.id,
              deviceId: userData.esp32DeviceId,
              meterId: userData.meterId,
              userId: bill.customerId,
              customerName: userData.fullName,
              connectionNumber: userData.connectionNumber,
              commandType: "CLOSE_VALVE",
              requestedByOfficerId: "SYSTEM_AUTOMATION_CRON",
              requestedByOfficerName: "National Automated Enforcement System",
              reason: `Unpaid Red Bill #${bill.billNumber} exceeding ${gracePeriodDays}-day grace period (Outstanding: LKR ${bill.outstandingBalance})`,
              timestamp: new Date().toISOString(),
              status: "PENDING",
              supervisorApproved: true,
              supervisorName: "Automated System Policy",
            };

            await commandRef.set(commandPayload);

            // 2. Push to ESP32 device realtime queue
            await db.collection("devices").doc(userData.esp32DeviceId).set({
              pendingCommand: commandPayload,
              lastUpdated: new Date().toISOString()
            }, { merge: true });

            // 3. Update User State
            await userRef.update({
              valveStatus: "CLOSED",
              billStatus: "RED_BILL",
              status: "DISCONNECTED",
            });

            // 4. Log Immutable Audit Record
            await db.collection("auditLogs").add({
              officerId: "SYSTEM_AUTOMATION",
              officerName: "Automated Water Enforcement Engine",
              officerRole: "SUPER_ADMIN",
              action: "AUTOMATED_VALVE_CUTOFF",
              actionCategory: "VALVE_CONTROL",
              targetEntity: "WaterUser",
              targetId: bill.customerId,
              previousValue: "OPEN",
              newValue: "CLOSED",
              ipAddress: "127.0.0.1 (Cloud System)",
              timestamp: new Date().toISOString(),
              status: "SUCCESS",
              details: `Automated valve shutoff for overdue Red Bill #${bill.billNumber}. Amount: LKR ${bill.outstandingBalance}`,
            });

            // 5. Send Pre-Disconnection & Disconnected SMS
            await sendSmsNotification(
              bill.customerId,
              `[NWSDB Red-Bill] Water supply for Connection #${userData.connectionNumber} has been temporarily disconnected due to non-payment of LKR ${bill.outstandingBalance}. Pay via mobile app or GovPay to restore supply immediately.`
            );
          }
        }
      }
    }
  });

/**
 * 2. PAYMENT CONFIRMATION & AUTOMATED VALVE REOPENING WORKFLOW
 * Triggered on verified payment creation.
 */
export const onPaymentConfirmed = functions.firestore
  .document("payments/{paymentId}")
  .onCreate(async (snap, context) => {
    const payment = snap.data();
    if (payment.status !== "SUCCESS") return;

    functions.logger.info(`[NWSDB PAYMENT] Verified payment ${payment.receiptNumber} for Bill: ${payment.billId} Amount: LKR ${payment.amount}`);

    // 1. Update Bill Document
    const billRef = db.collection("bills").doc(payment.billId);
    const billSnap = await billRef.get();
    if (!billSnap.exists) return;
    const billData = billSnap.data()!;

    const newPaidAmount = (billData.paidAmount || 0) + payment.amount;
    const newOutstanding = Math.max(0, billData.totalAmount - newPaidAmount);
    const newBillStatus = newOutstanding === 0 ? "PAID" : "PENDING";

    await billRef.update({
      paidAmount: newPaidAmount,
      outstandingBalance: newOutstanding,
      status: newBillStatus,
      paidAt: new Date().toISOString(),
      paymentReference: payment.transactionReference,
    });

    // 2. Check if customer's valve was closed and reopen if balance cleared
    const userRef = db.collection("users").doc(payment.customerId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    if (userData && newOutstanding === 0 && userData.valveStatus === "CLOSED") {
      functions.logger.info(`[NWSDB AUTO RECONNECT] Reopening valve for Customer: ${userData.fullName} (${payment.customerId})`);

      // Create OPEN_VALVE command
      const commandRef = db.collection("valveCommands").doc();
      const commandPayload = {
        id: commandRef.id,
        deviceId: userData.esp32DeviceId,
        meterId: userData.meterId,
        userId: payment.customerId,
        customerName: userData.fullName,
        connectionNumber: userData.connectionNumber,
        commandType: "OPEN_VALVE",
        requestedByOfficerId: payment.verifiedByOfficerId || "PAYMENT_GATEWAY_WEBHOOK",
        requestedByOfficerName: payment.verifiedByOfficerName || "Automated Payment Gateway",
        reason: `Payment confirmed for Bill #${billData.billNumber} (Receipt: ${payment.receiptNumber})`,
        timestamp: new Date().toISOString(),
        status: "PENDING",
        supervisorApproved: true,
      };

      await commandRef.set(commandPayload);

      // Push to ESP32 device queue
      await db.collection("devices").doc(userData.esp32DeviceId).set({
        pendingCommand: commandPayload,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Update User State
      await userRef.update({
        valveStatus: "OPEN",
        status: "ACTIVE",
        billStatus: "PAID",
        outstandingBalance: 0,
        lastPaymentDate: new Date().toISOString(),
      });

      // Mark payment doc
      await snap.ref.update({ autoValveReopened: true });

      // Log Immutable Audit
      await db.collection("auditLogs").add({
        officerId: payment.verifiedByOfficerId || "PAYMENT_ENGINE",
        officerName: payment.verifiedByOfficerName || "LankaPay Gateway",
        officerRole: "OFFICER",
        action: "AUTOMATED_VALVE_REOPEN",
        actionCategory: "VALVE_CONTROL",
        targetEntity: "WaterUser",
        targetId: payment.customerId,
        previousValue: "CLOSED",
        newValue: "OPEN",
        ipAddress: "127.0.0.1 (Payment Webhook)",
        timestamp: new Date().toISOString(),
        status: "SUCCESS",
        details: `Water supply restored following full settlement of LKR ${payment.amount}. Receipt: ${payment.receiptNumber}`,
      });

      // Send Confirmation SMS
      await sendSmsNotification(
        payment.customerId,
        `[NWSDB] Payment of LKR ${payment.amount} received. Receipt #${payment.receiptNumber}. Water supply valve for Connection #${userData.connectionNumber} is now OPEN. Thank you!`
      );
    }
  });

// Helper SMS Dispatcher
async function sendSmsNotification(customerId: string, message: string) {
  const notifRef = db.collection("notifications").doc();
  await notifRef.set({
    id: notifRef.id,
    recipientCustomerId: customerId,
    type: "SYSTEM_ALERT",
    channel: "SMS",
    message: message,
    sentTimestamp: new Date().toISOString(),
    deliveryStatus: "DELIVERED",
    gatewayProvider: "DIALOG_AXIATA_GOV_SMS",
  });
}
