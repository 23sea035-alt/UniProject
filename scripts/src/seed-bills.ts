import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccountPath = resolve(process.cwd(), '..', 'artifacts', 'api-server', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

function daysAgo(d: number): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt;
}

function daysFromNow(d: number): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt;
}

async function main() {
  // Get all customer users
  const usersSnap = await db.collection('users').get();
  const users = usersSnap.docs.filter(d => {
    const role = (d.data().role || '').toLowerCase();
    return role !== 'government' && role !== 'admin' && role !== 'officer';
  });

  console.log(`Found ${users.length} customer users`);

  if (users.length === 0) {
    console.log('No customers found. Aborting.');
    process.exit(0);
  }

  const now = new Date();
  const periodName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Create bills for each user with different statuses
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const ud = user.data();
    const meterId = ud.meterId || `WM-TEST-${i}`;
    const fullName = [ud.firstName, ud.lastName].filter(Boolean).join(' ') || ud.email || 'Unknown';

    let billStatus: string;
    let billDueDate: string;
    let billGraceEnd: string;
    let serviceStatus: string;
    let valveStatus: string;
    let outstanding: number;
    let consumptionM3: number;
    let notificationType: string;

    if (i % 4 === 0) {
      // PAID bill — all good
      billStatus = 'paid';
      billDueDate = daysAgo(20).toISOString().split('T')[0];
      billGraceEnd = daysAgo(6).toISOString().split('T')[0];
      serviceStatus = 'active';
      valveStatus = 'Open';
      outstanding = 0;
      consumptionM3 = 12.5;
      notificationType = 'payment_confirmed';
    } else if (i % 4 === 1) {
      // OVERDUE — due date passed but still in grace period
      billStatus = 'overdue';
      billDueDate = daysAgo(10).toISOString().split('T')[0];
      billGraceEnd = daysFromNow(4).toISOString().split('T')[0];
      serviceStatus = 'grace_period';
      valveStatus = 'Open';
      outstanding = 2850;
      consumptionM3 = 18.3;
      notificationType = 'payment_reminder';
    } else if (i % 4 === 2) {
      // RED_BILL — grace period expired, valve closed!
      billStatus = 'red_bill';
      billDueDate = daysAgo(30).toISOString().split('T')[0];
      billGraceEnd = daysAgo(16).toISOString().split('T')[0];
      serviceStatus = 'payment_restricted';
      valveStatus = 'Closed';
      outstanding = 4200;
      consumptionM3 = 25.7;
      notificationType = 'valve_closed';
    } else {
      // ISSUED — new bill, not yet due
      billStatus = 'issued';
      billDueDate = daysFromNow(14).toISOString().split('T')[0];
      billGraceEnd = daysFromNow(28).toISOString().split('T')[0];
      serviceStatus = 'active';
      valveStatus = 'Open';
      outstanding = 1500;
      consumptionM3 = 8.2;
      notificationType = 'bill_generated';
    }

    // ── BILL ─────────────────────────────────────────────────────
    const billRef = db.collection('bills').doc();
    await billRef.set({
      billNumber: `BILL-2026-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(5, '0')}`,
      userId: user.id,
      meterId,
      customerId: user.id,
      customerName: fullName,
      connectionNumber: meterId,
      billingPeriod: periodName,
      billingPeriodStart: daysAgo(30).toISOString().split('T')[0],
      billingPeriodEnd: daysAgo(0).toISOString().split('T')[0],
      consumptionCubicMetres: consumptionM3,
      consumptionLitres: consumptionM3 * 1000,
      consumptionM3,
      variableCharge: Math.round(consumptionM3 * 150),
      fixedCharge: 250,
      systemLevy: 50,
      stampDuty: 25,
      totalAmount: Math.round(consumptionM3 * 150 + 325),
      paidAmount: billStatus === 'paid' ? Math.round(consumptionM3 * 150 + 325) : 0,
      outstandingBalance: outstanding,
      status: billStatus,
      dueDate: billDueDate,
      gracePeriodDays: 14,
      gracePeriodEnd: billGraceEnd,
      generatedDate: daysAgo(32).toISOString().split('T')[0],
      paidDate: billStatus === 'paid' ? daysAgo(5).toISOString().split('T')[0] : null,
      tariffCategory: 'DOMESTIC',
      notificationSent: {
        issued: true,
        reminder1: billStatus !== 'issued',
        reminder2: billStatus === 'red_bill' || billStatus === 'overdue',
        finalWarning: billStatus === 'red_bill',
      },
      createdAt: daysAgo(32),
      updatedAt: new Date(),
    });

    // ── Update user doc ──────────────────────────────────────────
    await db.collection('users').doc(user.id).update({
      serviceStatus,
      valveLocked: billStatus === 'red_bill',
      valveLockReason: billStatus === 'red_bill' ? `Outstanding water bill of Rs. ${outstanding}` : null,
      currentBillAmount: Math.round(consumptionM3 * 150 + 325),
      outstandingBalance: outstanding,
      currentUnits: consumptionM3,
      tariffCategory: 'DOMESTIC',
      updatedAt: new Date(),
    });

    // Also update sensorData for red_bill users
    if (billStatus === 'red_bill') {
      await db.collection('users').doc(user.id).update({
        'sensorData.valveStatus': 'Closed',
        'sensorData.hydroStatus': 'Inactive',
      });
    }

    // ── VALVE COMMAND (for red_bill users) ───────────────────────
    if (billStatus === 'red_bill') {
      const cmdRef = db.collection('valveCommands').doc();
      await cmdRef.set({
        meterId,
        deviceId: ud.deviceId || meterId,
        userId: user.id,
        userName: fullName,
        action: 'close',
        reason: 'overdue_bill',
        reasonNote: `Automatic water shutoff — unpaid bill after ${14} days grace period`,
        source: 'automatic_billing',
        requestedBy: 'system',
        status: 'executed',
        executedAt: daysAgo(15),
        createdAt: daysAgo(16),
        updatedAt: new Date(),
      });

      // ── AUDIT LOG ─────────────────────────────────────────────
      const auditRef = db.collection('auditLogs').doc();
      await auditRef.set({
        userId: 'system',
        userName: 'Automated Billing System',
        userRole: 'system',
        action: 'VALVE_CLOSE',
        actionCategory: 'VALVE_CONTROL',
        resource: 'valveCommands',
        resourceId: cmdRef.id,
        customerId: user.id,
        meterId,
        deviceId: ud.deviceId || meterId,
        previousValue: 'Open',
        newValue: 'Closed',
        ipAddress: '10.0.0.1',
        result: 'success',
        details: `Automatic valve shutoff for ${fullName} — unpaid bill #${billRef.id.slice(0, 8)} after grace period expired`,
        createdAt: daysAgo(15),
      });
    }

    // ── NOTIFICATION ─────────────────────────────────────────────
    const notifRef = db.collection('notifications').doc();
    const messages: Record<string, { title: string; msg: string; channel: string; notifType: string }> = {
      bill_generated: {
        title: 'New Water Bill',
        msg: `Your water bill for ${periodName} is Rs. ${Math.round(consumptionM3 * 150 + 325)}. Due: ${billDueDate}`,
        channel: 'BOTH',
        notifType: 'BILL_GENERATED',
      },
      payment_reminder: {
        title: 'Payment Overdue',
        msg: `Your water bill of Rs. ${outstanding} is overdue. Please pay immediately to avoid supply disruption.`,
        channel: 'BOTH',
        notifType: 'PAYMENT_DUE_REMINDER',
      },
      valve_closed: {
        title: 'Water Service Suspended',
        msg: `Your water supply has been suspended due to unpaid bill of Rs. ${outstanding}. Please clear dues via app to restore service.`,
        channel: 'BOTH',
        notifType: 'VALVE_CLOSED',
      },
      payment_confirmed: {
        title: 'Payment Confirmed',
        msg: `Your payment of Rs. ${Math.round(consumptionM3 * 150 + 325)} has been received. Thank you.`,
        channel: 'SMS',
        notifType: 'PAYMENT_CONFIRMATION',
      },
    };

    const n = messages[notificationType];
    await notifRef.set({
      userId: user.id,
      recipientName: fullName,
      recipientPhone: ud.phone || '',
      type: n.notifType,
      channel: n.channel,
      title: n.title,
      message: n.msg,
      status: 'delivered',
      sentAt: daysAgo(billStatus === 'red_bill' ? 15 : billStatus === 'overdue' ? 8 : 30),
      createdAt: daysAgo(billStatus === 'red_bill' ? 15 : billStatus === 'overdue' ? 8 : 30),
    });
  }

  console.log(`\n✅ Seeded ${users.length} bills with red bill, overdue, paid, and issued statuses`);
  console.log(`✅ Created valve commands + audit logs for red_bill users`);
  console.log(`✅ Created notifications for all users`);

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
