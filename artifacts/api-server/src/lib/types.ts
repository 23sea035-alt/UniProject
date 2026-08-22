// ============================================
// FIRESTORE DATA MODELS
// ============================================

// --- User/Customer ---
export interface UserProfile {
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
  role: 'user' | 'field_officer' | 'billing_officer' | 'customer_service' | 'district_officer' | 'regional_manager' | 'iot_engineer' | 'admin' | 'super_admin' | 'auditor';
  accountNumber?: string;
  meterId?: string;
  deviceId?: string;
  status: 'active' | 'suspended' | 'inactive';
  serviceStatus: 'active' | 'grace_period' | 'payment_restricted' | 'valve_closed' | 'restoration_pending';
  valveLocked: boolean;
  valveLockReason?: string;
  gracePeriodDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

// --- Meter ---
export interface Meter {
  meterId: string;          // e.g., "WM-00124"
  accountNumber: string;    // e.g., "CUS-000124"
  userId: string;           // Firebase UID of assigned customer
  deviceId: string;         // Associated ESP32 device ID
  status: 'active' | 'inactive' | 'maintenance' | 'replaced';
  type: 'residential' | 'commercial' | 'industrial';
  installationDate?: Date;
  lastSeen?: Date;
  firmwareVersion?: string;
  calibrationFactor: number;
  region?: string;
  district?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Device (ESP32) ---
export interface Device {
  deviceId: string;         // e.g., "ESP-WM-00124"
  meterId: string;          // Associated meter
  userId?: string;          // Assigned customer
  status: 'online' | 'offline' | 'error' | 'maintenance';
  firmwareVersion?: string;
  lastSeen?: Date;
  ipAddress?: string;
  wifiSignal?: number;      // RSSI in dBm
  batteryLevel?: number;    // Percentage
  batteryVoltage?: number;
  hydroVoltage?: number;
  uptime?: number;          // seconds
  totalReadings?: number;
  errorCount?: number;
  calibrationFactor: number;
  region?: string;
  district?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Reading (from ESP32) ---
export interface Reading {
  readingId: string;
  meterId: string;
  deviceId: string;
  pulseCount: number;
  flowRate: number;         // L/min
  totalLitres: number;
  totalCubicMetres: number;
  pressure1?: number;       // kPa
  pressure2?: number;       // kPa
  batteryLevel?: number;    // Percentage
  batteryVoltage?: number;
  hydroVoltage?: number;
  valveStatus: 'open' | 'closed';
  online: boolean;
  wifiSignal?: number;
  type: 'reading' | 'heartbeat' | 'command_response';
  recordedAt: Date;
  createdAt: Date;
}

// --- Bill Calculation ---
export interface BillCalculation {
  variableCharge: number;
  fixedCharge: number;
  systemLevy: number;
  stampDuty: number;
  total: number;
}

// --- Bill ---
export interface Bill {
  billId: string;
  billNumber: string;       // Human-readable, e.g., "BILL-2026-08-00124"
  userId: string;
  meterId: string;
  billingPeriodStart: string;  // YYYY-MM-DD
  billingPeriodEnd: string;
  consumptionCubicMetres: number;
  consumptionLitres: number;
  variableCharge: number;
  fixedCharge: number;
  systemLevy: number;
  stampDuty: number;
  totalAmount: number;
  status: 'draft' | 'generated' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAmount?: number;
  paidAt?: Date;
  paymentId?: string;
  gracePeriodDays: number;
  gracePeriodEnd?: string;
  notificationSent: {
    issued: boolean;
    reminder1: boolean;
    reminder2: boolean;
    finalWarning: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// --- Payment ---
export interface Payment {
  paymentId: string;
  transactionId: string;    // Gateway transaction ID
  billId: string;
  userId: string;
  meterId: string;
  amount: number;
  currency: string;         // "LKR"
  method: 'card' | 'bank_transfer' | 'mobile_wallet' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  gatewayRef?: string;
  verifiedAt?: Date;
  verifiedBy?: string;      // 'webhook' | userId
  createdAt: Date;
  updatedAt: Date;
}

// --- Valve Command ---
export interface ValveCommand {
  commandId: string;
  meterId: string;
  deviceId: string;
  userId: string;
  action: 'open' | 'close' | 'led_on' | 'led_off';
  reason: 'manual_officer' | 'manual_admin' | 'overdue_bill' | 'payment_restoration' | 'maintenance' | 'emergency' | 'led_test';
  source: 'manual' | 'automatic_billing' | 'automatic_payment' | 'government_override';
  requestedBy: string;      // userId or 'system'
  status: 'pending' | 'sent' | 'executed' | 'failed' | 'expired';
  executedAt?: Date;
  acknowledgedAt?: Date;
  esp32Response?: {
    success: boolean;
    actualValveState: 'open' | 'closed';
    timestamp: Date;
  };
  reasonNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Notification ---
export interface Notification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: 'bill_generated' | 'payment_reminder' | 'final_warning' | 'valve_closed' | 'payment_successful' | 'water_restored' | 'device_offline' | 'high_usage' | 'complaint_update' | 'system';
  severity: 'info' | 'warning' | 'critical';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- Complaint ---
export interface Complaint {
  complaintId: string;
  complaintNumber: string;
  userId: string;
  meterId?: string;
  category: 'leakage' | 'billing' | 'meter' | 'valve' | 'water_quality' | 'pressure' | 'other';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
  district?: string;
  region?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Field Task ---
export interface FieldTask {
  taskId: string;
  taskNumber: string;
  complaintId?: string;
  customerId: string;
  customerName: string;
  address: string;
  problem: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  dueDate: string;
  status: 'new' | 'assigned' | 'in_progress' | 'resolved';
  notes?: string;
  meterReading?: number;
  createdAt: Date;
  updatedAt: Date;
}

// --- Tariff ---
export interface Tariff {
  tariffId: string;
  category: string;
  tierName: string;
  minUnits: number;
  maxUnits: number | null;
  ratePerUnit: number;
  fixedCharge: number;
  systemLevy: number;
  stampDuty: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- Audit Log ---
export interface AuditLog {
  auditId: string;
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
  result: 'success' | 'failure';
  createdAt: Date;
}

// --- System Config ---
export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  updatedAt: Date;
}

// --- Valve State Machine ---
export type ValveState = 'NORMAL' | 'GRACE_PERIOD' | 'PAYMENT_RESTRICTED' | 'VALVE_CLOSED' | 'RESTORATION_PENDING';

export interface ValveStateTransition {
  from: ValveState;
  to: ValveState;
  trigger: string;
  timestamp: Date;
  reason?: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ValveCommandRequest {
  meterId: string;
  action: 'open' | 'close';
  reason: string;
  reasonNote?: string;
}

export interface PaymentWebhookPayload {
  transactionId: string;
  status: 'completed' | 'failed';
  amount: number;
  timestamp: string;
  signature: string;
}
