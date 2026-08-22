import { notificationsCol, createDoc, updateDoc, getDoc } from '../lib/db.js';
import type { Notification } from '../lib/types.js';
import { logger } from '../lib/logger.js';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  severity: Notification['severity'] = 'info',
  data?: Record<string, any>,
) {
  const notification = await createDoc<Notification>('notifications', {
    userId,
    title,
    message,
    type,
    severity,
    data,
    read: false,
  } as any);

  logger.info({ notificationId: notification.id, userId, type }, 'Notification created');

  // In production, send FCM push notification here
  // await sendPushNotification(userId, title, message, data);

  return notification;
}

export async function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>) {
  // Firebase Cloud Messaging integration
  // In production, use admin.messaging().send() with the user's FCM token
  logger.info({ userId, title }, 'Push notification sent (simulated)');
}

export async function markAsRead(notificationId: string) {
  await updateDoc('notifications', notificationId, { read: true } as any);
}

export async function markAllAsRead(userId: string) {
  const snap = await notificationsCol.where('userId', '==', userId).where('read', '==', false).get();
  const batch = (await import('../lib/firebase.js')).firestore.batch();
  for (const doc of snap.docs) {
    batch.update(doc.ref, { read: true, updatedAt: new Date() });
  }
  await batch.commit();
}

export async function listNotifications(userId: string, unreadOnly: boolean = false) {
  let q: any = notificationsCol.where('userId', '==', userId);
  if (unreadOnly) q = q.where('read', '==', false);
  q = q.limit(100);
  const snap = await q.get();
  const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  docs.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return docs;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const snap = await notificationsCol.where('userId', '==', userId).where('read', '==', false).count().get();
  return snap.data().count;
}
