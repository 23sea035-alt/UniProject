import { devicesCol, metersCol, usersCol, getDoc, listDocs, createDoc, updateDoc, mergeUpdateDoc } from '../lib/db.js';
import type { Device } from '../lib/types.js';
import { logger } from '../lib/logger.js';

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function registerDevice(data: {
  deviceId: string;
  meterId: string;
  userId?: string;
  region?: string;
  district?: string;
}) {
  const existing = await getDoc('devices', data.deviceId);
  if (existing) throw new Error('Device already registered');

  const device = await createDoc<Device>('devices', {
    deviceId: data.deviceId,
    meterId: data.meterId,
    userId: (data.userId || null) as any,
    status: 'online',
    calibrationFactor: 450,
    region: data.region,
    district: data.district,
    totalReadings: 0,
    errorCount: 0,
  } as any, data.deviceId);

  // Update meter with device reference
  await updateDoc('meters', data.meterId, { deviceId: data.deviceId } as any);

  logger.info({ deviceId: data.deviceId, meterId: data.meterId }, 'Device registered');
  return device;
}

export async function getDevice(deviceId: string) {
  return getDoc<Device & { id: string }>('devices', deviceId);
}

export async function listDevices(filters?: { status?: string; region?: string }) {
  const queryFilters: any[] = [];
  if (filters?.status) queryFilters.push({ field: 'status', op: '==', value: filters.status });
  if (filters?.region) queryFilters.push({ field: 'region', op: '==', value: filters.region });

  return listDocs<Device & { id: string }>('devices', queryFilters.length > 0 ? queryFilters : undefined);
}

export async function updateDeviceHeartbeat(
  deviceId: string,
  data: {
    ipAddress?: string;
    wifiSignal?: number;
    batteryLevel?: number;
    batteryVoltage?: number;
    hydroVoltage?: number;
    uptime?: number;
    firmwareVersion?: string;
  },
) {
  const updates: any = {
    lastSeen: new Date(),
    status: 'online',
  };
  if (data.ipAddress) updates.ipAddress = data.ipAddress;
  if (data.wifiSignal !== undefined) updates.wifiSignal = data.wifiSignal;
  if (data.batteryLevel !== undefined) updates.batteryLevel = data.batteryLevel;
  if (data.batteryVoltage !== undefined) updates.batteryVoltage = data.batteryVoltage;
  if (data.hydroVoltage !== undefined) updates.hydroVoltage = data.hydroVoltage;
  if (data.uptime !== undefined) updates.uptime = data.uptime;
  if (data.firmwareVersion) updates.firmwareVersion = data.firmwareVersion;

  await updateDoc('devices', deviceId, updates);
}

export async function incrementReadingCount(deviceId: string) {
  const deviceRef = devicesCol.doc(deviceId);
  await deviceRef.update({
    totalReadings: (await deviceRef.get()).data()?.totalReadings ?? 0 + 1,
    lastSeen: new Date(),
    status: 'online',
  } as any);
}

export async function checkOfflineDevices() {
  const threshold = new Date(Date.now() - OFFLINE_THRESHOLD_MS);
  const snap = await devicesCol.where('status', '==', 'online').get();

  let count = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.lastSeen && data.lastSeen.toDate() < threshold) {
      await doc.ref.update({ status: 'offline', updatedAt: new Date() });

      try {
        const meterSnap = await metersCol.where('deviceId', '==', doc.id).limit(1).get();
        if (!meterSnap.empty) {
          const meterData = meterSnap.docs[0].data();
          if (meterData.userId) {
            await mergeUpdateDoc('users', meterData.userId, {
              sensorData: { online: false },
            });
          }
        }
      } catch {}

      count++;
    }
  }

  if (count > 0) {
    logger.warn({ count }, 'Devices went offline');
  }
}

export async function updateDeviceStatus(deviceId: string, status: Device['status']) {
  await updateDoc('devices', deviceId, { status } as any);
}
