import { valveCommandsCol, metersCol, usersCol, getDoc, createDoc, updateDoc } from '../lib/db.js';
import type { ValveCommand, ValveState } from '../lib/types.js';
import { createNotification } from './notification.js';
import { logAudit } from './audit.js';
import { logger } from '../lib/logger.js';

// Get current valve state for a meter
export async function getValveState(meterId: string): Promise<{
  state: ValveState;
  lastCommand: ValveCommand | null;
  pendingCommands: number;
}> {
  const completedSnap = await valveCommandsCol
    .where('meterId', '==', meterId)
    .where('status', '==', 'executed')
    .limit(10)
    .get();

  let lastCommand: ValveCommand | null = null;
  if (!completedSnap.empty) {
    const sorted = completedSnap.docs.sort((a, b) => {
      const aTime = a.data().executedAt?.toMillis?.() ?? 0;
      const bTime = b.data().executedAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
    lastCommand = { id: sorted[0].id, ...sorted[0].data() } as any as ValveCommand;
  }

  const pendingSnap = await valveCommandsCol
    .where('meterId', '==', meterId)
    .where('status', 'in', ['pending', 'sent'])
    .limit(10)
    .get();

  let state: ValveState = 'NORMAL';
  if (lastCommand) {
    if (lastCommand.action === 'close' && lastCommand.reason === 'overdue_bill') {
      state = 'PAYMENT_RESTRICTED';
    }
    if (lastCommand.action === 'close' && lastCommand.reason === 'maintenance') {
      state = 'PAYMENT_RESTRICTED';
    }
  }

  if (lastCommand) {
    const userDoc = await getDoc<any>('users', lastCommand.userId);
    if (userDoc) {
      if (userDoc.serviceStatus === 'payment_restricted') state = 'PAYMENT_RESTRICTED';
      if (userDoc.serviceStatus === 'grace_period') state = 'GRACE_PERIOD';
      if (userDoc.serviceStatus === 'restoration_pending') state = 'RESTORATION_PENDING';
    }
  }

  return { state, lastCommand, pendingCommands: pendingSnap.size };
}

// Create a valve command with authorization check
export async function createValveCommand(
  meterId: string,
  action: 'open' | 'close',
  reason: ValveCommand['reason'],
  source: ValveCommand['source'],
  requestedBy: string,
  userId: string,
  reasonNote?: string,
): Promise<ValveCommand & { id: string }> {
  const meterSnap = await metersCol.doc(meterId).get();
  if (!meterSnap.exists) throw new Error('Meter not found');
  const meterData = meterSnap.data()!;
  const deviceId = meterData.deviceId;

  // Check for duplicate pending command
  const existingPending = await valveCommandsCol
    .where('meterId', '==', meterId)
    .where('action', '==', action)
    .where('status', 'in', ['pending', 'sent'])
    .limit(1)
    .get();

  if (!existingPending.empty) {
    logger.warn({ meterId, action }, 'Duplicate command prevented');
    return { id: existingPending.docs[0].id, ...existingPending.docs[0].data() } as any;
  }

  // Authorization check for customer-initiated requests
  if (source === 'manual' && reason !== 'manual_officer' && reason !== 'manual_admin') {
    // Check if service is restricted
    const userDoc = await getDoc<any>('users', userId);
    if (userDoc && userDoc.serviceStatus === 'payment_restricted' && action === 'open') {
      throw new Error('PAYMENT_REQUIRED');
    }
  }

  const command = await createDoc<ValveCommand>('valveCommands', {
    meterId,
    deviceId,
    userId,
    action,
    reason,
    source,
    requestedBy,
    status: 'pending',
    reasonNote,
  } as any);

  logger.info({ commandId: command.id, meterId, action, reason, source }, 'Valve command created');

  // Audit log
  await logAudit({
    userId: requestedBy,
    userRole: source === 'manual' ? 'government' : 'system',
    userName: source === 'manual' ? 'Government Officer' : 'System',
    action: `VALVE_${action.toUpperCase()}`,
    resource: 'valveCommands',
    resourceId: command.id,
    customerId: userId,
    meterId,
    deviceId,
    newValue: { action, reason, source },
    result: 'success',
  });

  return command;
}

// Get next pending command for a device
export async function getNextCommand(deviceId: string): Promise<(ValveCommand & { id: string }) | null> {
  const snap = await valveCommandsCol
    .where('deviceId', '==', deviceId)
    .where('status', '==', 'pending')
    .limit(5)
    .get();

  if (snap.empty) return null;

  const docs = snap.docs.sort((a, b) => {
    const aTime = a.data().createdAt?.toMillis?.() ?? 0;
    const bTime = b.data().createdAt?.toMillis?.() ?? 0;
    return aTime - bTime;
  });

  const doc = docs[0];
  await doc.ref.update({ status: 'sent', updatedAt: new Date() });

  return { id: doc.id, ...doc.data() } as ValveCommand & { id: string };
}

// Acknowledge command execution from ESP32
export async function acknowledgeCommand(
  commandId: string,
  success: boolean,
  actualValveState?: 'open' | 'closed',
): Promise<ValveCommand & { id: string }> {
  const doc = await getDoc<ValveCommand & { id: string }>('valveCommands', commandId);
  if (!doc) throw new Error('Command not found');

  const updates: Partial<ValveCommand> = {
    status: success ? 'executed' : 'failed',
    executedAt: new Date(),
    acknowledgedAt: new Date(),
  };

  if (actualValveState) {
    updates.esp32Response = {
      success,
      actualValveState,
      timestamp: new Date(),
    };
  }

  await updateDoc('valveCommands', commandId, updates);

  // Update user service status based on command result
  if (success) {
    const userDoc = await getDoc('users', doc.userId);
    if (userDoc) {
      if (doc.action === 'open' && doc.reason === 'payment_restoration') {
        await usersCol.doc(doc.userId).update({
          serviceStatus: 'active',
          updatedAt: new Date(),
        });
        // Notify customer
        await createNotification(
          doc.userId,
          'Water Service Restored',
          'Your water service has been restored. The valve has been opened.',
          'water_restored',
          'info',
          { commandId },
        );
      }
      if (doc.action === 'close' && doc.reason === 'overdue_bill') {
        await usersCol.doc(doc.userId).update({
          serviceStatus: 'valve_closed',
          valveLocked: true,
          updatedAt: new Date(),
        });
      }
    }
  }

  logger.info({ commandId, success, actualValveState }, 'Command acknowledged');
  return { ...doc, id: commandId, ...updates } as any;
}

// Government override - open a restricted valve
export async function governmentOverride(
  meterId: string,
  action: 'open' | 'close',
  requestedBy: string,
  reasonNote: string,
) {
  const meterSnap = await metersCol.doc(meterId).get();
  if (!meterSnap.exists) throw new Error('Meter not found');
  const meterData = meterSnap.data()!;

  return createValveCommand(
    meterId,
    action,
    action === 'open' ? 'manual_officer' : 'manual_admin',
    'manual',
    requestedBy,
    meterData.userId || '',
    reasonNote,
  );
}

// Get pending commands for a meter
export async function getPendingCommandsForMeter(meterId: string) {
  const snap = await valveCommandsCol
    .where('meterId', '==', meterId)
    .where('status', 'in', ['pending', 'sent'])
    .limit(20)
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get command history for a meter
export async function getCommandHistory(meterId: string, limit: number = 50) {
  const snap = await valveCommandsCol
    .where('meterId', '==', meterId)
    .limit(limit)
    .get();

  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}

// Get all valve commands (admin view)
export async function getAllCommands(filters?: { status?: string; action?: string }) {
  let q: any = valveCommandsCol;
  if (filters?.status) q = q.where('status', '==', filters.status);
  if (filters?.action) q = q.where('action', '==', filters.action);
  q = q.orderBy('createdAt', 'desc').limit(200);
  const snap = await q.get();
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
}
