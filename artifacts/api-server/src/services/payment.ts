import { paymentsCol, billsCol, usersCol, metersCol, createDoc, updateDoc, getDoc } from '../lib/db.js';
import type { Payment } from '../lib/types.js';
import { createValveCommand } from './valve.js';
import { createNotification } from './notification.js';
import { logAudit } from './audit.js';
import { logger } from '../lib/logger.js';

export async function createPaymentSession(billId: string, userId: string, amount: number) {
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const payment = await createDoc<Payment>('payments', {
    transactionId,
    billId,
    userId,
    meterId: '',
    amount,
    currency: 'LKR',
    method: 'card',
    status: 'pending',
  } as any);

  logger.info({ paymentId: payment.id, billId, amount }, 'Payment session created');
  return { payment, transactionId };
}

export async function processWebhook(payload: any, signature: string) {
  // In production, verify signature with payment gateway secret
  // For now, simulate verification
  const { transactionId, status, amount } = payload;

  if (!transactionId) throw new Error('Missing transactionId');

  const paymentSnap = await paymentsCol.where('transactionId', '==', transactionId).limit(1).get();
  if (paymentSnap.empty) throw new Error('Payment not found');

  const paymentDoc = paymentSnap.docs[0];
  const paymentData = paymentDoc.data();

  if (status === 'completed') {
    // Verify amount matches
    if (amount !== paymentData.amount) {
      logger.error({ transactionId, expected: paymentData.amount, received: amount }, 'Payment amount mismatch');
      throw new Error('Amount mismatch');
    }

    // Mark payment as completed
    await paymentsCol.doc(paymentDoc.id).update({
      status: 'completed',
      verifiedAt: new Date(),
      verifiedBy: 'webhook',
      gatewayRef: payload.gatewayRef,
      updatedAt: new Date(),
    });

    // Process the payment success
    await handlePaymentSuccess(paymentDoc.id);
  } else {
    // Mark as failed
    await paymentsCol.doc(paymentDoc.id).update({
      status: 'failed',
      updatedAt: new Date(),
    });
  }

  logger.info({ transactionId, status }, 'Webhook processed');
}

export async function handlePaymentSuccess(paymentId: string) {
  const paymentDoc = await getDoc<Payment & { id: string }>('payments', paymentId);
  if (!paymentDoc) throw new Error('Payment not found');

  // Update bill status
  await billsCol.doc(paymentDoc.billId).update({
    status: 'paid',
    paidAmount: paymentDoc.amount,
    paidAt: new Date(),
    paymentId,
    updatedAt: new Date(),
  });

  // Get user info for service restoration
  const userDoc = await getDoc<any>('users', paymentDoc.userId);
  if (userDoc && userDoc.serviceStatus === 'payment_restricted') {
    // Restore service
    await usersCol.doc(paymentDoc.userId).update({
      serviceStatus: 'restoration_pending',
      valveLocked: false,
      valveLockReason: '',
      updatedAt: new Date(),
    });

    // Find the meter and create OPEN command
    const metersSnap = await metersCol.where('userId', '==', paymentDoc.userId).limit(1).get();
    if (!metersSnap.empty) {
      const meterData = metersSnap.docs[0].data();
      await createValveCommand(
        metersSnap.docs[0].id,
        'open',
        'payment_restoration',
        'automatic_payment',
        'system',
        paymentDoc.userId,
        `Automatic open after payment ${paymentId}`,
      );

      // Update meter reference
      await paymentsCol.doc(paymentId).update({ meterId: metersSnap.docs[0].id } as any);
    }

    // Notify customer
    await createNotification(
      paymentDoc.userId,
      'Payment Successful',
      `Your payment of Rs. ${paymentDoc.amount.toFixed(2)} has been verified. Water service restoration is in progress.`,
      'payment_successful',
      'info',
      { paymentId, amount: paymentDoc.amount },
    );

    logger.info({ paymentId, userId: paymentDoc.userId }, 'Payment verified, service restoration initiated');
  }

  // Audit log
  await logAudit({
    userId: 'system',
    userRole: 'system',
    userName: 'Payment Gateway',
    action: 'PAYMENT_VERIFIED',
    resource: 'payments',
    resourceId: paymentId,
    customerId: paymentDoc.userId,
    meterId: paymentDoc.meterId,
    newValue: { status: 'completed', amount: paymentDoc.amount },
    result: 'success',
  });
}

export async function getPaymentHistory(userId: string) {
  const snap = await paymentsCol
    .where('userId', '==', userId)
    .limit(50)
    .get();
  const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  docs.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return docs;
}

export async function getAllPayments(filters?: { status?: string }) {
  let q: any = paymentsCol;
  if (filters?.status) q = q.where('status', '==', filters.status);
  q = q.limit(200);
  const snap = await q.get();
  const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  docs.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return docs;
}
