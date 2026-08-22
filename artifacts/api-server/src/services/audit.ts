import { auditLogsCol, createDoc } from '../lib/db.js';
import type { AuditLog } from '../lib/types.js';
import { logger } from '../lib/logger.js';

export async function logAudit(params: {
  userId: string;
  userRole: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  customerId?: string;
  meterId?: string;
  deviceId?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
  result?: 'success' | 'failure';
}) {
  const log = await createDoc<AuditLog>('auditLogs', {
    userId: params.userId,
    userRole: params.userRole,
    userName: params.userName,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    customerId: params.customerId,
    meterId: params.meterId,
    deviceId: params.deviceId,
    oldValue: params.oldValue,
    newValue: params.newValue,
    reason: params.reason,
    ipAddress: params.ipAddress,
    result: params.result || 'success',
  } as any);

  logger.info({ auditId: log.id, action: params.action, resource: params.resource }, 'Audit log created');
  return log;
}

export async function listAuditLogs(filters?: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  let q: any = auditLogsCol;

  if (filters?.userId) q = q.where('userId', '==', filters.userId);
  if (filters?.action) q = q.where('action', '==', filters.action);
  if (filters?.resource) q = q.where('resource', '==', filters.resource);

  q = q.limit(filters?.limit ?? 100);
  const snap = await q.get();
  const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  docs.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
  return docs;
}
