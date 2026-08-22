import { metersCol, getDoc, listDocs, createDoc, updateDoc, readingsCol } from '../lib/db.js';
import type { Meter } from '../lib/types.js';
import { logger } from '../lib/logger.js';
import { getDevice } from './device.js';

export async function createMeter(data: {
  meterId: string;
  deviceId: string;
  userId?: string;
  type?: Meter['type'];
  region?: string;
  district?: string;
}) {
  const existing = await metersCol.where('deviceId', '==', data.deviceId).limit(1).get();
  if (!existing.empty) throw new Error('Device ID already registered');

  const meter = await createDoc<Meter>('meters', {
    meterId: data.meterId,
    accountNumber: '',
    userId: (data.userId || null) as any,
    deviceId: data.deviceId,
    status: 'active',
    type: data.type || 'residential',
    calibrationFactor: 450,
    region: data.region,
    district: data.district,
  } as any);

  logger.info({ meterId: data.meterId, deviceId: data.deviceId }, 'Meter created');
  return meter;
}

export async function getMeter(meterId: string) {
  return getDoc<Meter & { id: string }>('meters', meterId);
}

export async function getMeterByDeviceId(deviceId: string) {
  const snap = await metersCol.where('deviceId', '==', deviceId).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Meter & { id: string };
}

export async function listMeters(filters?: { region?: string; district?: string; status?: string }) {
  const queryFilters: any[] = [];
  if (filters?.region) queryFilters.push({ field: 'region', op: '==', value: filters.region });
  if (filters?.district) queryFilters.push({ field: 'district', op: '==', value: filters.district });
  if (filters?.status) queryFilters.push({ field: 'status', op: '==', value: filters.status });

  return listDocs<Meter & { id: string }>('meters', queryFilters.length > 0 ? queryFilters : undefined);
}

export async function getMeterStatus(meterId: string) {
  const meter = await getDoc<Meter & { id: string }>('meters', meterId);
  if (!meter) return null;

  const readingsSnap = await readingsCol
    .where('meterId', '==', meterId)
    .limit(10)
    .get();

  let latestReading = null;
  if (!readingsSnap.empty) {
    const sorted = readingsSnap.docs.sort((a, b) => {
      const aTime = a.data().recordedAt?.toMillis?.() ?? 0;
      const bTime = b.data().recordedAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
    latestReading = { id: sorted[0].id, ...sorted[0].data() };
  }

  let online = false;
  if (meter.deviceId) {
    const device = await getDevice(meter.deviceId);
    if (device) {
      online = device.status === 'online';
    }
  }

  return {
    meter: {
      id: meter.id,
      meterId: meter.meterId,
      deviceId: meter.deviceId,
      status: meter.status,
      lastSeen: meter.lastSeen,
      firmwareVersion: meter.firmwareVersion,
    },
    online,
    latestReading,
  };
}

export async function updateMeterLastSeen(meterId: string) {
  await updateDoc('meters', meterId, { lastSeen: new Date() } as any);
}

export async function updateMeterStatus(meterId: string, status: Meter['status']) {
  await updateDoc('meters', meterId, { status } as any);
}
