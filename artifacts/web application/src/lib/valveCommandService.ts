import { ValveCommand, ValveCommandType, ValveCommandStatus, GovernmentOfficer } from '../types';

export interface CreateValveCommandOptions {
  deviceId: string;
  meterId: string;
  userId: string;
  customerName: string;
  connectionNumber: string;
  commandType: ValveCommandType;
  officer: GovernmentOfficer;
  reason: string;
  supervisorApproved?: boolean;
  supervisorName?: string;
}

export class ValveCommandService {
  /**
   * Generates a new valve command with initial PENDING state and audit parameters
   */
  public createCommand(options: CreateValveCommandOptions): ValveCommand {
    const id = `VCMD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const timestamp = new Date().toISOString();

    return {
      id,
      deviceId: options.deviceId,
      meterId: options.meterId,
      userId: options.userId,
      customerName: options.customerName,
      connectionNumber: options.connectionNumber,
      commandType: options.commandType,
      requestedByOfficerId: options.officer.id,
      requestedByOfficerName: options.officer.name,
      reason: options.reason,
      timestamp,
      status: 'PENDING',
      supervisorApproved: options.supervisorApproved ?? (options.officer.role === 'SUPER_ADMIN' || options.officer.role === 'SUPERVISOR'),
      supervisorName: options.supervisorName || (options.officer.role === 'SUPERVISOR' ? options.officer.name : undefined),
    };
  }

  /**
   * Simulates the 2-way IoT handshake with ESP32 device
   * PENDING -> SENT -> ACKNOWLEDGED -> COMPLETED
   */
  public async executeCommandHandshake(
    command: ValveCommand,
    onStatusChange: (status: ValveCommandStatus, details?: Partial<ValveCommand>) => void
  ): Promise<ValveCommand> {
    // Step 1: SENT to Firebase/ESP32
    await new Promise((resolve) => setTimeout(resolve, 600));
    command.status = 'SENT';
    onStatusChange('SENT');

    // Step 2: ESP32 ACKNOWLEDGED
    await new Promise((resolve) => setTimeout(resolve, 800));
    command.status = 'ACKNOWLEDGED';
    command.esp32AckTimestamp = new Date().toISOString();
    onStatusChange('ACKNOWLEDGED', { esp32AckTimestamp: command.esp32AckTimestamp });

    // Step 3: Solenoid Physical Actuation COMPLETED
    await new Promise((resolve) => setTimeout(resolve, 1000));
    command.status = 'COMPLETED';
    command.completedTimestamp = new Date().toISOString();
    onStatusChange('COMPLETED', { completedTimestamp: command.completedTimestamp });

    return command;
  }
}

export const valveCommandService = new ValveCommandService();
