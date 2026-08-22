import { tariffsCol, systemConfigCol, billsCol, metersCol, readingsCol, notificationsCol, usersCol } from '../lib/db.js';
import type { Bill, BillCalculation } from '../lib/types.js';
import { createValveCommand } from './valve.js';
import { createNotification } from './notification.js';
import { logger } from '../lib/logger.js';

export async function calculateBill(consumptionM3: number): Promise<BillCalculation> {
  const tariffs = await getActiveTariffs();
  const fixedCharge = await getConfigValue('fixed_charge', 250);
  const systemLevy = await getConfigValue('system_levy', 50);
  const stampDuty = await getConfigValue('stamp_duty', 25);

  let variableCharge = 0;
  let remaining = consumptionM3;

  for (const tier of tariffs as any[]) {
    if (remaining <= 0) break;
    const tierMax = tier.maxUnits ?? Infinity;
    const tierCapacity = tierMax - tier.minUnits;
    const unitsInTier = Math.min(remaining, tierCapacity);
    variableCharge += unitsInTier * tier.ratePerUnit;
    remaining -= unitsInTier;
  }

  variableCharge = Math.round(variableCharge * 100) / 100;

  return {
    variableCharge,
    fixedCharge,
    systemLevy,
    stampDuty,
    total: Math.round((variableCharge + fixedCharge + systemLevy + stampDuty) * 100) / 100,
  };
}

async function getActiveTariffs() {
  const snap = await tariffsCol.where('isActive', '==', true).get();
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a: any, b: any) => (a.minUnits ?? 0) - (b.minUnits ?? 0));
  return results;
}

async function getConfigValue(key: string, defaultValue: number): Promise<number> {
  const snap = await systemConfigCol.doc(key).get();
  if (!snap.exists) return defaultValue;
  const data = snap.data()!;
  const parsed = parseFloat(data.value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export async function generateBillForMeter(meterId: string, periodStart: string, periodEnd: string) {
  const meterSnap = await metersCol.doc(meterId).get();
  if (!meterSnap.exists) throw new Error('Meter not found');
  const meter = meterSnap.data()!;
  if (!meter.userId) throw new Error('Meter has no assigned user');

  // Check for duplicate bill
  const existingSnap = await billsCol
    .where('meterId', '==', meterId)
    .where('billingPeriodStart', '==', periodStart)
    .where('billingPeriodEnd', '==', periodEnd)
    .limit(1)
    .get();
  if (!existingSnap.empty) throw new Error('Bill already exists for this period');

  // Calculate consumption from readings
  const readingsSnap = await readingsCol
    .where('meterId', '==', meterId)
    .where('recordedAt', '>=', new Date(periodStart))
    .where('recordedAt', '<=', new Date(periodEnd))
    .get();

  const readings = readingsSnap.docs.map(d => d.data()).sort((a, b) => {
    const aTime = a.recordedAt?.toMillis?.() ?? 0;
    const bTime = b.recordedAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });
  let consumptionM3 = 0;
  let consumptionLitres = 0;

  if (readings.length > 0) {
    const first = readings[0];
    const last = readings[readings.length - 1];
    if (first.totalCubicMetres != null && last.totalCubicMetres != null) {
      consumptionM3 = Math.max(0, last.totalCubicMetres - first.totalCubicMetres);
      consumptionLitres = consumptionM3 * 1000;
    }
  }

  const calculation = await calculateBill(consumptionM3);
  const gracePeriodDays = await getConfigValue('grace_period_days', 2);

  const dueDate = new Date(periodEnd);
  dueDate.setDate(dueDate.getDate() + 14);
  const gracePeriodEnd = new Date(dueDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

  // Generate bill number
  const countSnap = await billsCol.count().get();
  const billNumber = `BILL-${new Date(periodStart).getFullYear()}-${String(new Date(periodStart).getMonth() + 1).padStart(2, '0')}-${String(countSnap.data().count + 1).padStart(5, '0')}`;

  const billData: Record<string, any> = {
    billNumber,
    userId: meter.userId,
    meterId,
    billingPeriodStart: periodStart,
    billingPeriodEnd: periodEnd,
    consumptionCubicMetres: consumptionM3,
    consumptionLitres,
    variableCharge: calculation.variableCharge,
    fixedCharge: calculation.fixedCharge,
    systemLevy: calculation.systemLevy,
    stampDuty: calculation.stampDuty,
    totalAmount: calculation.total,
    status: 'issued',
    dueDate: dueDate.toISOString().split('T')[0],
    gracePeriodDays,
    gracePeriodEnd: gracePeriodEnd.toISOString().split('T')[0],
    notificationSent: {
      issued: true,
      reminder1: false,
      reminder2: false,
      finalWarning: false,
    },
  };

  const billRef = billsCol.doc();
  await billRef.set({ ...billData, createdAt: new Date(), updatedAt: new Date() });

  // Send bill notification
  await createNotification(
    meter.userId,
    'New Water Bill',
    `Your water bill for ${periodStart} to ${periodEnd} is Rs. ${calculation.total.toFixed(2)}. Due date: ${dueDate.toISOString().split('T')[0]}`,
    'bill_generated',
    'info',
    { billId: billRef.id, amount: calculation.total },
  );

  logger.info({ billId: billRef.id, meterId, amount: calculation.total }, 'Bill generated');
  return { id: billRef.id, ...billData };
}

export async function markOverdueBills() {
  const today = new Date().toISOString().split('T')[0];
  const issuedSnap = await billsCol.where('status', '==', 'issued').get();

  let count = 0;
  for (const billDoc of issuedSnap.docs) {
    const data = billDoc.data();
    if (data.dueDate && data.dueDate <= today) {
      await billsCol.doc(billDoc.id).update({ status: 'overdue', updatedAt: new Date() });
      count++;

      // Send overdue notification
      if (!data.notificationSent?.reminder1) {
        await createNotification(
          data.userId,
          'Payment Overdue',
          `Your water bill of Rs. ${data.totalAmount?.toFixed(2)} is now overdue. Please pay immediately to avoid supply disruption.`,
          'payment_reminder',
          'warning',
          { billId: billDoc.id, amount: data.totalAmount },
        );
        await billsCol.doc(billDoc.id).update({
          'notificationSent.reminder1': true,
          updatedAt: new Date(),
        });
      }
    }
  }

  if (count > 0) {
    logger.info({ count }, 'Bills marked as overdue');
  }
}

export async function checkGracePeriods() {
  const today = new Date().toISOString().split('T')[0];
  const overdueSnap = await billsCol.where('status', '==', 'overdue').get();

  for (const billDoc of overdueSnap.docs) {
    const data = billDoc.data();

    // Check if grace period has expired
    if (data.gracePeriodEnd && data.gracePeriodEnd <= today) {
      // Update bill status
      await billsCol.doc(billDoc.id).update({
        status: 'overdue',
        updatedAt: new Date(),
      });

      // Send final warning if not sent
      if (!data.notificationSent?.finalWarning) {
        await createNotification(
          data.userId,
          'FINAL NOTICE - Water Service Suspension',
          `Your water bill of Rs. ${data.totalAmount?.toFixed(2)} remains unpaid. Water service will be suspended after the grace period.`,
          'final_warning',
          'critical',
          { billId: billDoc.id, amount: data.totalAmount },
        );
        await billsCol.doc(billDoc.id).update({
          'notificationSent.finalWarning': true,
          updatedAt: new Date(),
        });
      }

      // Restrict service and close valve
      await restrictService(data.userId, data.meterId, billDoc.id, data.totalAmount);
    } else if (data.gracePeriodEnd) {
      // Still in grace period - send reminder if not sent
      const daysUntilClose = Math.ceil((new Date(data.gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilClose <= 1 && !data.notificationSent?.reminder2) {
        await createNotification(
          data.userId,
          'Payment Reminder',
          `Your water bill of Rs. ${data.totalAmount?.toFixed(2)} remains unpaid. Your water service may be suspended soon.`,
          'payment_reminder',
          'warning',
          { billId: billDoc.id, amount: data.totalAmount },
        );
        await billsCol.doc(billDoc.id).update({
          'notificationSent.reminder2': true,
          updatedAt: new Date(),
        });
      }
    }
  }
}

async function restrictService(userId: string, meterId: string, billId: string, amount: number) {
  // Update user service status
  await usersCol.doc(userId).update({
    serviceStatus: 'payment_restricted',
    valveLocked: true,
    valveLockReason: `Outstanding water bill of Rs. ${amount?.toFixed(2)}`,
    updatedAt: new Date(),
  });

  // Create valve CLOSE command
  const meterSnap = await metersCol.doc(meterId).get();
  if (meterSnap.exists) {
    const meterData = meterSnap.data()!;
    await createValveCommand(
      meterId,
      'close',
      'overdue_bill',
      'automatic_billing',
      'system',
      meterData.userId || userId,
      `Automatic close due to unpaid bill ${billId}`,
    );
  }

  // Notify customer
  await createNotification(
    userId,
    'Water Service Suspended',
    `Your water service has been suspended due to an outstanding bill of Rs. ${amount?.toFixed(2)}. Please clear your dues to restore service.`,
    'valve_closed',
    'critical',
    { billId, amount },
  );

  logger.info({ userId, meterId, billId, amount }, 'Service restricted due to overdue bill');
}

export async function getBillsForUser(userId: string) {
  const snap = await billsCol.where('userId', '==', userId).limit(50).get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  docs.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return docs;
}

export async function getCurrentBill(userId: string) {
  const snap = await billsCol
    .where('userId', '==', userId)
    .where('status', 'in', ['issued', 'overdue'])
    .limit(5)
    .get();
  if (snap.empty) return null;
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  docs.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return docs[0];
}

export async function getAllBills(filters?: { status?: string; region?: string }) {
  const snap = await billsCol.limit(200).get();
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  docs.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return docs;
}
