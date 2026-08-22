'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Cpu,
  Power,
  Unlock,
  Lock,
  Receipt,
  CreditCard,
  Activity,
  Droplet,
  Radio,
  WifiOff,
  AlertTriangle,
  History,
  CheckCircle2,
  FileSpreadsheet,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useData } from '../../../context/DataContext';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { FlowGauge } from '../../../components/monitoring/FlowGauge';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { InvoiceModal } from '../../../components/billing/InvoiceModal';
import { HardwareSimulatorModal } from '../../../components/devices/HardwareSimulatorModal';
import { Bill } from '../../../types';

const HISTORICAL_DAILY_DATA = [
  { day: 'Mon', liters: 480 },
  { day: 'Tue', liters: 520 },
  { day: 'Wed', liters: 410 },
  { day: 'Thu', liters: 690 },
  { day: 'Fri', liters: 550 },
  { day: 'Sat', liters: 780 },
  { day: 'Sun', liters: 620 },
];

const HISTORICAL_MONTHLY_DATA = [
  { month: 'Mar', m3: 13.5 },
  { month: 'Apr', m3: 16.2 },
  { month: 'May', m3: 14.8 },
  { month: 'Jun', m3: 15.1 },
  { month: 'Jul', m3: 14.2 },
  { month: 'Aug', m3: 14.9 },
];

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const {
    users,
    telemetry,
    bills,
    payments,
    valveCommands,
    auditLogs,
    executeValveCommand,
    sendCustomNotification,
    recordPayment,
  } = useData();

  const user = users.find((u) => u.id === userId);

  // States
  const [isValveModalOpen, setIsValveModalOpen] = useState(false);
  const [valveActionType, setValveActionType] = useState<'OPEN_VALVE' | 'CLOSE_VALVE'>('CLOSE_VALVE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  const [selectedBillForInvoice, setSelectedBillForInvoice] = useState<Bill | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // SMS Modal State
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');

  // Payment settlement state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBillToPay, setSelectedBillToPay] = useState<Bill | null>(null);

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Water Consumer Profile Not Found</h2>
        <p className="text-xs text-slate-400">The requested customer record does not exist or has been archived.</p>
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Directory
        </Link>
      </div>
    );
  }

  const deviceTelemetry = telemetry[user.esp32DeviceId] || {
    deviceId: user.esp32DeviceId,
    meterId: user.meterId,
    userId: user.id,
    flowRateLpm: user.valveStatus === 'OPEN' ? 4.5 : 0.0,
    totalVolumeLiters: user.currentConsumptionLiters,
    pulseCount: user.currentConsumptionLiters * 7.5,
    signalStrengthDbm: -64,
    batteryLevel: 94,
    mainsPowered: true,
    valveStatus: user.valveStatus,
    tamperDetected: false,
    burstAlert: false,
    leakAlert: false,
    reverseFlowAlert: false,
    firmwareVersion: 'v2.4.2-SL-GOV',
    lastPing: new Date().toISOString(),
  };

  const userBills = bills.filter((b) => b.customerId === user.id);
  const userPayments = payments.filter((p) => p.customerId === user.id);
  const userCommands = valveCommands.filter((c) => c.userId === user.id);
  const userAudits = auditLogs.filter((a) => a.targetId === user.id);

  const handleOpenValveModal = (type: 'OPEN_VALVE' | 'CLOSE_VALVE') => {
    setValveActionType(type);
    setIsValveModalOpen(true);
  };

  const handleExecuteValve = async (reason: string) => {
    setIsProcessing(true);
    const res = await executeValveCommand(user.id, valveActionType, reason);
    setIsProcessing(false);
    setIsValveModalOpen(false);
    setActionFeedback(res.message);
    setTimeout(() => setActionFeedback(''), 5000);
  };

  const handleSendCustomSms = async () => {
    if (!smsMessage.trim()) return;
    await sendCustomNotification({
      customerId: user.id,
      title: 'Official NWSDB Utility Notice',
      message: smsMessage,
      channel: 'BOTH',
    });
    setIsSmsModalOpen(false);
    setSmsMessage('');
    setActionFeedback(`Official notice dispatched via SMS and Push to ${user.phone}`);
    setTimeout(() => setActionFeedback(''), 5000);
  };

  const handleSettleBill = async () => {
    if (!selectedBillToPay) return;
    setIsProcessing(true);
    const res = await recordPayment({
      billId: selectedBillToPay.id,
      amount: selectedBillToPay.outstandingBalance,
      paymentMethod: 'GOV_PAY',
      transactionReference: `GOVPAY-PORTAL-${Date.now()}`,
      notes: 'Officer counter settlement via Government Web Portal',
    });
    setIsProcessing(false);
    setIsPayModalOpen(false);
    setActionFeedback(`Bill settled! Receipt #${res.receiptNumber}. If previously disconnected, valve auto-reopen command was sent.`);
    setTimeout(() => setActionFeedback(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            href="/users"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{user.fullName}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {user.customerId}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              NIC: <span className="font-mono text-emerald-400">{user.nic}</span> • {user.district} District • Conn: {user.connectionNumber}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSmsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>Send Direct SMS</span>
          </button>

          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>ESP32 Test Bench</span>
          </button>

          {user.valveStatus === 'OPEN' ? (
            <button
              onClick={() => handleOpenValveModal('CLOSE_VALVE')}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/30 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Shut Off Solenoid Valve</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenValveModal('OPEN_VALVE')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Reopen Solenoid Valve</span>
            </button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Grid Overview: Personal Info, Device Telemetry, and Flow Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Personal & Connection Metadata */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Consumer & Account Details</span>
            </h3>
            <StatusBadge type="bill" status={user.billStatus} />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Full Legal Name</span>
              <p className="font-semibold text-slate-200 mt-0.5">{user.fullName}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">NIC Number</span>
                <p className="font-mono font-bold text-emerald-400 mt-0.5">{user.nic}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Contact Phone</span>
                <p className="font-mono text-slate-200 mt-0.5">{user.phone}</p>
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Service Address</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{user.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Connection No</span>
                <p className="font-mono text-slate-200 font-bold">{user.connectionNumber}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Tariff Slab</span>
                <p className="font-semibold text-teal-400">{user.tariffCategory}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Installation Date</span>
                <p className="text-slate-400 font-mono">{user.installationDate}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Connection Status</span>
                <p className="font-bold text-emerald-400">{user.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: ESP32 IoT Device Health & Diagnostics */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>ESP32 Hardware Telemetry</span>
            </h3>
            <StatusBadge type="device" status={user.espStatus} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Smart Meter ID</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">{user.meterId}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold">ESP32 Device Node</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">{user.esp32DeviceId}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Signal (WiFi RSSI)</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">{deviceTelemetry.signalStrengthDbm} dBm</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Battery / Power</span>
              <p className="font-bold text-emerald-400 mt-0.5">{deviceTelemetry.batteryLevel}% (Mains)</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Solenoid Actuator State:</span>
              <StatusBadge type="valve" status={user.valveStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Flow Sensor Interrupts:</span>
              <span className="font-mono text-slate-200 font-bold">{deviceTelemetry.pulseCount.toLocaleString()} pulses</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Firmware Build:</span>
              <span className="font-mono text-emerald-400">{deviceTelemetry.firmwareVersion}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900 pt-1.5">
              <span>Last Ping Sync:</span>
              <span className="font-mono">{new Date(deviceTelemetry.lastPing).toLocaleTimeString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Real-Time Flow Visualizer */}
        <FlowGauge
          flowRateLpm={deviceTelemetry.flowRateLpm}
          totalVolumeLiters={deviceTelemetry.totalVolumeLiters}
          pulseCount={deviceTelemetry.pulseCount}
          isOnline={user.espStatus === 'ONLINE' && user.valveStatus === 'OPEN'}
        />
      </div>

      {/* Historical Usage Analytics */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">Water Consumption Historical Profile</h3>
          </div>
          <div className="text-xs text-slate-400">
            Total Billed: <strong className="text-emerald-400">{(user.currentMonthUsageLiters / 1000).toFixed(1)} m³</strong> this cycle
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Daily 7-day Area Chart */}
          <div className="h-60 flex flex-col">
            <p className="text-xs font-semibold text-slate-400 mb-2">Past 7 Days Consumption (Liters / Day)</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HISTORICAL_DAILY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userLiters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="liters"
                  name="Liters"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#userLiters)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 6-Month Bar Chart */}
          <div className="h-60 flex flex-col">
            <p className="text-xs font-semibold text-slate-400 mb-2">Past 6 Months Consumption (Cubic Meters - m³)</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HISTORICAL_MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="m3" name="Volume (m³)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Invoicing Ledger & Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Invoices */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">Billing & Invoice Ledger</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {userBills.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No bills generated yet.</p>
            ) : (
              userBills.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">{b.billNumber}</span>
                      <StatusBadge type="bill" status={b.status} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Period: {b.billingPeriod} • Consumed: {b.consumptionM3} m³
                    </p>
                    <p className="text-[10px] text-slate-500">Due: {b.dueDate} | Grace: {b.gracePeriodEndDate}</p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-mono font-bold text-sm text-emerald-400">
                      LKR {b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedBillForInvoice(b)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-semibold"
                      >
                        View Bill
                      </button>
                      {b.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setSelectedBillToPay(b);
                            setIsPayModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-600 text-[11px] text-emerald-300 hover:text-white border border-emerald-800 font-semibold"
                        >
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments History */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-slate-100">Verified Payment Transactions</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {userPayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No verified payment records found.</p>
            ) : (
              userPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">{p.receiptNumber}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold text-[10px]">
                        {p.paymentMethod}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Ref: {p.transactionReference}</p>
                    <p className="text-[10px] text-slate-500">{new Date(p.timestamp).toLocaleString('en-GB')}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-emerald-400">
                      LKR {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-emerald-500 font-medium">Verified & Settled</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Valve Command & Audit History */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-100">Valve Actuation & Account Audit Log</h3>
          </div>
        </div>

        <div className="space-y-2">
          {userAudits.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">No audit entries recorded for this account.</p>
          ) : (
            userAudits.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between text-xs hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{a.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">{a.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.details}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Officer: {a.officerName} ({a.officerRole}) • IP: {a.ipAddress}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                  {new Date(a.timestamp).toLocaleString('en-GB')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Valve Actuation Confirmation Modal */}
      <ConfirmModal
        isOpen={isValveModalOpen}
        title={
          valveActionType === 'CLOSE_VALVE'
            ? `Remote Solenoid Cut-off: ${user.fullName}`
            : `Remote Solenoid Reconnect: ${user.fullName}`
        }
        description={`Are you sure you want to execute a remote IoT command to ${
          valveActionType === 'CLOSE_VALVE' ? 'CLOSE' : 'OPEN'
        } the solenoid valve on meter ${user.meterId}?`}
        confirmText={valveActionType === 'CLOSE_VALVE' ? 'Execute Valve Shut-off' : 'Restore Water Supply'}
        isDangerous={valveActionType === 'CLOSE_VALVE'}
        requireReason={true}
        isLoading={isProcessing}
        onConfirm={handleExecuteValve}
        onClose={() => setIsValveModalOpen(false)}
      />

      {/* Bill Settlement Confirmation Modal */}
      {selectedBillToPay && (
        <ConfirmModal
          isOpen={isPayModalOpen}
          title={`Settle Bill #${selectedBillToPay.billNumber}`}
          description={`Confirm manual payment collection of LKR ${selectedBillToPay.outstandingBalance.toLocaleString()} for ${user.fullName}. If this account was disconnected due to Red Bill non-payment, the solenoid valve will automatically be sent an OPEN_VALVE command.`}
          confirmText="Confirm Payment & Clear Balance"
          requireReason={false}
          isLoading={isProcessing}
          onConfirm={handleSettleBill}
          onClose={() => setIsPayModalOpen(false)}
        />
      )}

      {/* Direct SMS Modal */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Dispatch Official SMS Notice</span>
            </h3>
            <p className="text-xs text-slate-400">
              Recipient: <strong className="text-slate-200">{user.fullName} ({user.phone})</strong>
            </p>

            <textarea
              rows={3}
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Enter official SMS notification message..."
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsSmsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustomSms}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Dispatch SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedBillForInvoice && (
        <InvoiceModal
          bill={selectedBillForInvoice}
          isOpen={!!selectedBillForInvoice}
          onClose={() => setSelectedBillForInvoice(null)}
        />
      )}

      {/* ESP32 Hardware Simulator Modal */}
      <HardwareSimulatorModal
        deviceId={user.esp32DeviceId}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
