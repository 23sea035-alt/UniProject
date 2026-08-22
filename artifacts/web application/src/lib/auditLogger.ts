import { AuditLog, ActionCategory, GovernmentOfficer } from '../types';

export interface CreateAuditParams {
  officer: GovernmentOfficer;
  action: string;
  actionCategory: ActionCategory;
  targetEntity: string;
  targetId: string;
  previousValue?: string;
  newValue?: string;
  status?: 'SUCCESS' | 'WARNING' | 'FAILURE';
  details?: string;
  ipAddress?: string;
}

export class AuditLogger {
  public static createLog(params: CreateAuditParams): AuditLog {
    const id = `AUDIT-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const timestamp = new Date().toISOString();

    const log: AuditLog = {
      id,
      officerId: params.officer.id,
      officerName: params.officer.name,
      officerRole: params.officer.role,
      action: params.action,
      actionCategory: params.actionCategory,
      targetEntity: params.targetEntity,
      targetId: params.targetId,
      previousValue: params.previousValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress || '192.168.1.104 (Gov-WAN Colombo)',
      timestamp,
      status: params.status || 'SUCCESS',
      details: params.details,
    };

    console.log(`[IMMUTABLE AUDIT LOG] [${log.actionCategory}] ${log.action} by ${log.officerName} (${log.officerRole}) on ${log.targetEntity}:${log.targetId}`);
    return log;
  }
}
