import { usersCol, metersCol, getDoc, listDocs, createDoc, updateDoc } from '../lib/db.js';
import type { UserProfile } from '../lib/types.js';
import { logger } from '../lib/logger.js';

export async function createCustomer(data: {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  nic?: string;
  phone?: string;
  address?: string;
  region?: string;
  district?: string;
  serviceArea?: string;
}): Promise<UserProfile & { id: string }> {
  const countSnap = await usersCol.where('role', '==', 'user').count().get();
  const accountNumber = `CUS-${String(countSnap.data().count + 1).padStart(5, '0')}`;

  const customer = await createDoc<UserProfile>('users', {
    uid: data.uid,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    nic: data.nic,
    phone: data.phone,
    address: data.address,
    region: data.region,
    district: data.district,
    serviceArea: data.serviceArea,
    role: 'user',
    accountNumber,
    meterId: null as any,
    deviceId: null as any,
    status: 'active',
    serviceStatus: 'active',
    valveLocked: false,
    gracePeriodDays: 2,
  } as any, data.uid);

  logger.info({ uid: data.uid, accountNumber }, 'Customer created');
  return customer;
}

export async function getCustomer(uid: string) {
  return getDoc<UserProfile & { id: string }>('users', uid);
}

export async function getCustomerByAccountNumber(accountNumber: string) {
  const snap = await usersCol.where('accountNumber', '==', accountNumber).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile & { id: string };
}

export async function updateCustomer(uid: string, data: Partial<UserProfile>) {
  await updateDoc('users', uid, data);
  logger.info({ uid, fields: Object.keys(data) }, 'Customer updated');
}

export async function listCustomers(filters?: {
  region?: string;
  district?: string;
  status?: string;
}, limit?: number) {
  const queryFilters: any[] = [];
  if (filters?.region) queryFilters.push({ field: 'region', op: '==', value: filters.region });
  if (filters?.district) queryFilters.push({ field: 'district', op: '==', value: filters.district });
  if (filters?.status) queryFilters.push({ field: 'status', op: '==', value: filters.status });

  return listDocs<UserProfile & { id: string }>(
    'users',
    queryFilters.length > 0 ? queryFilters : undefined,
    { field: 'createdAt', direction: 'desc' },
    limit,
  );
}

export async function assignMeter(uid: string, meterId: string) {
  await updateDoc('users', uid, { meterId } as any);
  await updateDoc('meters', meterId, { userId: uid } as any);
  logger.info({ uid, meterId }, 'Meter assigned to customer');
}

export async function updateServiceStatus(uid: string, status: UserProfile['serviceStatus']) {
  await updateDoc('users', uid, { serviceStatus: status } as any);
  logger.info({ uid, status }, 'Service status updated');
}

export async function suspendCustomer(uid: string, reason: string) {
  await updateDoc('users', uid, { status: 'suspended', serviceStatus: 'valve_closed' } as any);
  logger.info({ uid, reason }, 'Customer suspended');
}

export async function activateCustomer(uid: string) {
  await updateDoc('users', uid, { status: 'active', serviceStatus: 'active' } as any);
  logger.info({ uid }, 'Customer activated');
}
