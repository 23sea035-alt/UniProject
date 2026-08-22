// Sri Lankan Government Smart Water Meter Management Portal - Core Types

export type OfficerRole = 'SUPER_ADMIN' | 'OFFICER' | 'SUPERVISOR';

export interface GovernmentOfficer {
  id: string;
  name: string;
  email: string;
  badgeNumber: string;
  department: string;
  role: OfficerRole;
  phone: string;
  active: boolean;
  lastLogin?: string;
  avatarUrl?: string;
}

export type TariffCategoryType = 'DOMESTIC' | 'COMMERCIAL' | 'INDUSTRIAL' | 'RELIGIOUS';
export type ValveStatusType = 'OPEN' | 'CLOSED';
export type DeviceOnlineStatus = 'ONLINE' | 'OFFLINE';
export type BillStatusType = 'PAID' | 'PENDING' | 'OVERDUE' | 'RED_BILL' | 'DISCONNECTED';
export type ConnectionStatusType = 'ACTIVE' | 'DISCONNECTED' | 'SUSPENDED' | 'PENDING_APPROVAL';

export interface WaterUser {
  id: string;
  customerId: string;
  fullName: string;
  nic: string; // Sri Lankan National Identity Card (e.g. 199012345678 or 851234567V)
  phone: string;
  email: string;
  address: string;
  district: string; // Colombo, Gampaha, Kandy, Galle, Jaffna, etc.
  province: string; // Western, Central, Southern, Northern, etc.
  connectionNumber: string; // e.g. WTR-CMB-048291
  meterId: string; // e.g. SWM-2026-8841
  esp32DeviceId: string; // e.g. ESP32-WTR-99A1
  installationDate: string;
  status: ConnectionStatusType;
  tariffCategory: TariffCategoryType;
  valveStatus: ValveStatusType;
  espStatus: DeviceOnlineStatus;
  currentConsumptionLiters: number;
  currentMonthUsageLiters: number;
  currentBillAmount: number;
  outstandingBalance: number;
  billStatus: BillStatusType;
  lastReadingDate: string;
  lastPaymentDate?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DeviceTelemetry {
  deviceId: string;
  meterId: string;
  userId: string;
  timestamp: string;
  flowRateLpm: number; // Liters per minute
  totalVolumeLiters: number;
  pulseCount: number;
  signalStrengthDbm: number; // RSSI: -40 (Great) to -90 (Poor)
  batteryLevel: number; // Percentage
  mainsPowered: boolean;
  valveStatus: ValveStatusType;
  tamperDetected: boolean;
  burstAlert: boolean;
  leakAlert: boolean;
  reverseFlowAlert: boolean;
  firmwareVersion: string;
  lastPing: string;
}

export interface TariffSlab {
  minM3: number;
  maxM3: number | null; // null for above top tier (e.g. >30 m3)
  ratePerM3: number; // Sri Lankan Rupees (LKR)
}

export interface TariffConfig {
  id: string;
  category: TariffCategoryType;
  name: string;
  description: string;
  effectiveDate: string;
  slabs: TariffSlab[];
  fixedCharge: number; // Fixed monthly service charge in LKR
  vatPercentage: number;
  ssclPercentage: number; // Social Security Contribution Levy
  gracePeriodDays: number; // Days after due date before Red Bill / Valve cutoff
}

export interface BillSlabDetail {
  slab: string;
  volumeM3: number;
  unitRate: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  connectionNumber: string;
  meterId: string;
  billingPeriod: string; // e.g., "August 2026"
  consumptionM3: number;
  consumptionLiters: number;
  previousReadingLiters: number;
  currentReadingLiters: number;
  slabBreakdown: BillSlabDetail[];
  consumptionCharge: number;
  fixedCharge: number;
  taxesAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  generatedDate: string;
  dueDate: string;
  gracePeriodEndDate: string;
  status: BillStatusType;
  paymentReference?: string;
  paidAt?: string;
}

export type PaymentMethod = 'GOV_PAY' | 'LANKA_PAY' | 'MOBILE_APP' | 'COUNTER' | 'ONLINE_BANKING';

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  billId: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  connectionNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  timestamp: string;
  verifiedByOfficerId?: string;
  verifiedByOfficerName?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  autoValveReopened: boolean;
  notes?: string;
}

export type ValveCommandType = 'OPEN_VALVE' | 'CLOSE_VALVE';
export type ValveCommandStatus = 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export interface ValveCommand {
  id: string;
  deviceId: string;
  meterId: string;
  userId: string;
  customerName: string;
  connectionNumber: string;
  commandType: ValveCommandType;
  requestedByOfficerId: string;
  requestedByOfficerName: string;
  reason: string;
  timestamp: string;
  status: ValveCommandStatus;
  supervisorApproved: boolean;
  supervisorName?: string;
  esp32AckTimestamp?: string;
  completedTimestamp?: string;
  failureReason?: string;
}

export type ActionCategory = 
  | 'VALVE_CONTROL' 
  | 'BILLING' 
  | 'PAYMENT' 
  | 'USER_MGMT' 
  | 'TARIFF' 
  | 'AUTH' 
  | 'SYSTEM' 
  | 'NOTIFICATION';

export interface AuditLog {
  id: string;
  officerId: string;
  officerName: string;
  officerRole: OfficerRole;
  action: string;
  actionCategory: ActionCategory;
  targetEntity: string;
  targetId: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILURE';
  details?: string;
}

export type NotificationType =
  | 'BILL_GENERATED'
  | 'PAYMENT_DUE_REMINDER'
  | 'OVERDUE_WARNING'
  | 'RED_BILL_WARNING'
  | 'VALVE_CLOSING_ALERT'
  | 'VALVE_CLOSED'
  | 'PAYMENT_CONFIRMATION'
  | 'VALVE_REOPENED'
  | 'LEAKAGE_DETECTED'
  | 'METER_OFFLINE'
  | 'SYSTEM_ALERT';

export interface NotificationRecord {
  id: string;
  recipientCustomerId: string;
  recipientName: string;
  recipientPhone: string;
  type: NotificationType;
  channel: 'SMS' | 'PUSH' | 'BOTH';
  title: string;
  message: string;
  sentTimestamp: string;
  deliveryStatus: 'DELIVERED' | 'SENT' | 'FAILED' | 'PENDING';
  errorReason?: string;
  gatewayProvider: string;
}

export interface DashboardSummary {
  totalRegisteredUsers: number;
  activeConnections: number;
  esp32OnlineCount: number;
  esp32OfflineCount: number;
  redBillUsersCount: number;
  pendingPaymentsCount: number;
  todayWaterConsumptionLiters: number;
  todayRevenueLKR: number;
  closedValvesCount: number;
  openValvesCount: number;
  abnormalLeakageCount: number;
}
