import { readingsCol, metersCol, usersCol, createDoc, valveCommandsCol, mergeUpdateDoc, getDoc } from '../lib/db.js';
import type { Reading } from '../lib/types.js';
import { updateDeviceHeartbeat, incrementReadingCount } from './device.js';
import { updateMeterLastSeen } from './meter.js';
import { logger } from '../lib/logger.js';

export async function processReading(data: {
  meterId: string;
  deviceId: string;
  pulseCount: number;
  flowRate?: number;
  totalLitres?: number;
  totalCubicMetres?: number;
  pressure1?: number;
  pressure2?: number;
  batteryLevel?: number;
  batteryVoltage?: number;
  hydroVoltage?: number;
  valveStatus?: string;
  online?: boolean;
  wifiSignal?: number;
  type?: string;
  recordedAt: Date;
  uptime?: number;
  ipAddress?: string;
}) {
  // Store the reading
  const reading = await createDoc<Reading>('readings', {
    readingId: '',
    meterId: data.meterId,
    deviceId: data.deviceId,
    pulseCount: data.pulseCount,
    flowRate: data.flowRate ?? 0,
    totalLitres: data.totalLitres ?? 0,
    totalCubicMetres: data.totalCubicMetres ?? 0,
    pressure1: data.pressure1,
    pressure2: data.pressure2,
    batteryLevel: data.batteryLevel,
    batteryVoltage: data.batteryVoltage,
    hydroVoltage: data.hydroVoltage,
    valveStatus: (data.valveStatus as any) ?? 'open',
    online: data.online ?? true,
    wifiSignal: data.wifiSignal,
    type: (data.type as any) ?? 'reading',
    recordedAt: data.recordedAt,
  } as any);

  // Update device heartbeat
  await updateDeviceHeartbeat(data.deviceId, {
    wifiSignal: data.wifiSignal,
    batteryLevel: data.batteryLevel,
    batteryVoltage: data.batteryVoltage,
    hydroVoltage: data.hydroVoltage,
    uptime: data.uptime,
    ipAddress: data.ipAddress,
  });
  await incrementReadingCount(data.deviceId);

  // Update meter last seen
  await updateMeterLastSeen(data.meterId);

  // Sync sensor data to ALL user documents linked to this meter (meter.userId
  // plus every account whose meterId matches) so realtime listeners stay live
  try {
    const userIds = new Set<string>();

    // Meter may be keyed by doc ID == meterId or carry a meterId field
    const [byField, byId] = await Promise.all([
      metersCol.where('meterId', '==', data.meterId).limit(1).get(),
      getDoc<any>('meters', data.meterId),
    ] as const);
    const meterData: any = !byField.empty ? byField.docs[0].data() : byId;
    if (meterData?.userId) userIds.add(meterData.userId);

    const linkedUsers = await usersCol.where('meterId', '==', data.meterId).limit(50).get();
    linkedUsers.forEach(d => userIds.add(d.id));

    if (userIds.size > 0) {
      const sensorPayload = {
        sensorData: {
          flowRate: data.flowRate ?? 0,
          pressure1: data.pressure1 ?? 0,
          pressure2: data.pressure2 ?? 0,
          battery: data.batteryLevel ?? 0,
          hydroVoltage: data.hydroVoltage ?? 0,
          hydroStatus: (data.hydroVoltage ?? 0) > 0 ? 'Active' : 'Inactive',
          valveStatus: data.valveStatus === 'open' ? 'Open' : 'Closed',
          totalUnits: data.totalCubicMetres ?? 0,
          online: true,
          lastSync: new Date(),
          wifiSignal: data.wifiSignal ?? 0,
        },
      };
      await Promise.all(
        Array.from(userIds).map(uid => mergeUpdateDoc('users', uid, sensorPayload))
      );
    }
  } catch (err) {
    logger.error({ err, meterId: data.meterId }, 'Failed to sync sensor data to users');
  }

  return reading;
}

export async function getPendingCommands(deviceId: string) {
  const snap = await valveCommandsCol
    .where('deviceId', '==', deviceId)
    .where('status', '==', 'pending')
    .limit(10)
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getReadings(meterId: string, options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  let q: any = readingsCol.where('meterId', '==', meterId);
  if (options?.startDate) q = q.where('recordedAt', '>=', new Date(options.startDate));
  if (options?.endDate) q = q.where('recordedAt', '<=', new Date(options.endDate));
  q = q.limit(options?.limit ?? 100);

  const snap = await q.get();
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}
