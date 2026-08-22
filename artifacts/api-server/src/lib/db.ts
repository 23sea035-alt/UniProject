import admin from './firebase.js';
import type { UserProfile, Meter, Device, Reading, Bill, Payment, ValveCommand, Notification, Complaint, FieldTask, Tariff, AuditLog, SystemConfig } from './types.js';

const firestore = admin.firestore();

// ============================================
// COLLECTION REFERENCES
// ============================================
export const usersCol = firestore.collection('users');
export const metersCol = firestore.collection('meters');
export const devicesCol = firestore.collection('devices');
export const readingsCol = firestore.collection('readings');
export const billsCol = firestore.collection('bills');
export const paymentsCol = firestore.collection('payments');
export const valveCommandsCol = firestore.collection('valveCommands');
export const notificationsCol = firestore.collection('notifications');
export const complaintsCol = firestore.collection('complaints');
export const fieldTasksCol = firestore.collection('fieldTasks');
export const tariffsCol = firestore.collection('tariffs');
export const auditLogsCol = firestore.collection('auditLogs');
export const systemConfigCol = firestore.collection('systemConfig');
export const valveStateCol = firestore.collection('valveStates');

// ============================================
// GENERIC HELPERS
// ============================================

export async function getDoc<T>(collection: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await firestore.collection(collection).doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } as T & { id: string } : null;
}

export async function listDocs<T>(
  collection: string,
  filters?: { field: string; op: string; value: any }[],
  orderBy?: { field: string; direction?: 'asc' | 'desc' },
  limit?: number,
): Promise<(T & { id: string })[]> {
  let q: FirebaseFirestore.Query = firestore.collection(collection);
  if (filters) {
    for (const f of filters) {
      q = q.where(f.field, f.op as FirebaseFirestore.WhereFilterOp, f.value);
    }
  }
  if (orderBy) {
    q = q.orderBy(orderBy.field, orderBy.direction ?? 'asc');
  }
  if (limit) {
    q = q.limit(limit);
  }
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T & { id: string }));
}

export async function createDoc<T>(collection: string, data: Record<string, any>, id?: string): Promise<T & { id: string }> {
  const ref = id ? firestore.collection(collection).doc(id) : firestore.collection(collection).doc();
  const cleaned = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  const doc = { ...cleaned, createdAt: new Date(), updatedAt: new Date() };
  await ref.set(doc);
  return { id: ref.id, ...doc } as any;
}

export async function updateDoc<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
  const cleaned = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  await firestore.collection(collection).doc(id).update({ ...cleaned, updatedAt: new Date() });
}

export async function mergeUpdateDoc(collection: string, id: string, data: Record<string, any>): Promise<void> {
  const cleaned = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  await firestore.collection(collection).doc(id).set(cleaned, { merge: true });
}

export async function deleteDoc(collection: string, id: string): Promise<void> {
  await firestore.collection(collection).doc(id).delete();
}

// Batch operations
export function createBatch() {
  return firestore.batch();
}

// Transaction
export async function runTransaction<T>(fn: (transaction: FirebaseFirestore.Transaction) => Promise<T>): Promise<T> {
  return firestore.runTransaction(fn);
}
