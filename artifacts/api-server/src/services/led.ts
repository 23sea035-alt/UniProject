import { valveCommandsCol, metersCol, createDoc, updateDoc } from '../lib/db.js';
import { logger } from '../lib/logger.js';

export type LedAction = 'led_on' | 'led_off';

// Queue an LED command for a device (delivered to ESP32 via pendingCommand
// in the next POST /readings response)
export async function createLedCommand(
  meterId: string,
  on: boolean,
  requestedBy: string,
  userId: string,
): Promise<{ id: string; action: LedAction; status: string }> {
  const meterSnap = await metersCol.doc(meterId).get();
  if (!meterSnap.exists) throw new Error('Meter not found');
  const deviceId = meterSnap.data()!.deviceId;
  if (!deviceId) throw new Error('Meter has no device registered');

  const action: LedAction = on ? 'led_on' : 'led_off';

  // Prevent duplicate queued commands of the same type
  const existing = await valveCommandsCol
    .where('deviceId', '==', deviceId)
    .where('action', '==', action)
    .where('status', 'in', ['pending', 'sent'])
    .limit(1)
    .get();

  if (!existing.empty) {
    return { id: existing.docs[0].id, action, status: existing.docs[0].data().status };
  }

  const command = await createDoc<any>('valveCommands', {
    meterId,
    deviceId,
    userId,
    action,
    reason: 'led_test',
    source: 'manual',
    requestedBy,
    status: 'pending',
  });

  logger.info({ commandId: command.id, meterId, deviceId, action }, 'LED command created');
  return { id: command.id, action, status: command.status };
}

// Current LED state derived from the latest executed led_on/led_off command
export async function getLedState(meterId: string): Promise<{ on: boolean | null }> {
  const snap = await valveCommandsCol
    .where('meterId', '==', meterId)
    .where('action', 'in', ['led_on', 'led_off'])
    .where('status', '==', 'executed')
    .limit(10)
    .get();

  if (snap.empty) return { on: null };

  const sorted = snap.docs.sort((a, b) => {
    const aTime = a.data().executedAt?.toMillis?.() ?? 0;
    const bTime = b.data().executedAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });

  return { on: sorted[0].data().action === 'led_on' };
}

// ESP32 confirms it applied the command
export async function acknowledgeLedCommand(commandId: string, success: boolean) {
  const updates: Record<string, any> = {
    status: success ? 'executed' : 'failed',
    executedAt: new Date(),
    acknowledgedAt: new Date(),
    updatedAt: new Date(),
  };
  await updateDoc('valveCommands', commandId, updates);
  logger.info({ commandId, success }, 'LED command acknowledged');
  return updates;
}
