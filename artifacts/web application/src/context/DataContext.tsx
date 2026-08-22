'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  WaterUser,
  DeviceTelemetry,
  Bill,
  PaymentTransaction,
  ValveCommand,
  AuditLog,
  TariffConfig,
  NotificationRecord,
  DashboardSummary,
  ValveCommandType,
  PaymentMethod,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_TELEMETRY,
  INITIAL_BILLS,
  INITIAL_PAYMENTS,
  INITIAL_VALVE_COMMANDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../lib/mockData';
import { DEFAULT_SRI_LANKA_TARIFFS, calculateWaterBill } from '../lib/tariffEngine';
import { AuditLogger } from '../lib/auditLogger';
import { notificationService } from '../lib/notificationService';
import { valveCommandService } from '../lib/valveCommandService';
import { useAuth } from './AuthContext';
import { subscribeToFirestore } from '../lib/firebaseSync';

interface DataContextType {
  users: WaterUser[];
  telemetry: Record<string, DeviceTelemetry>;
  bills: Bill[];
  payments: PaymentTransaction[];
  valveCommands: ValveCommand[];
  auditLogs: AuditLog[];
  notifications: NotificationRecord[];
  tariffs: TariffConfig[];
  summary: DashboardSummary;
  simulationActive: boolean;
  toggleSimulation: () => void;
  // Actions
  executeValveCommand: (
    userId: string,
    commandType: ValveCommandType,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;
  recordPayment: (params: {
    billId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference: string;
    notes?: string;
  }) => Promise<{ success: boolean; receiptNumber: string }>;
  generateMonthlyBills: () => Promise<number>;
  triggerRedBillEnforcement: () => Promise<{ cutOffCount: number; warnedCount: number }>;
  updateTariff: (tariff: TariffConfig) => void;
  sendCustomNotification: (params: {
    customerId: string;
    title: string;
    message: string;
    channel?: 'SMS' | 'PUSH' | 'BOTH';
  }) => Promise<void>;
  updateUserDetails: (userId: string, partial: Partial<WaterUser>) => void;
  injectLeakage: (deviceId: string) => void;
  toggleDevicePower: (deviceId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { officer } = useAuth();

  const [users, setUsers] = useState<WaterUser[]>(INITIAL_USERS);
  const [telemetry, setTelemetry] = useState<Record<string, DeviceTelemetry>>(INITIAL_TELEMETRY);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [payments, setPayments] = useState<PaymentTransaction[]>(INITIAL_PAYMENTS);
  const [valveCommands, setValveCommands] = useState<ValveCommand[]>(INITIAL_VALVE_COMMANDS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(INITIAL_NOTIFICATIONS);
  const [tariffs, setTariffs] = useState<TariffConfig[]>(DEFAULT_SRI_LANKA_TARIFFS);
  const [simulationActive, setSimulationActive] = useState<boolean>(true);

  // Live sync from Firebase — replaces mock data with real Firestore records
  useEffect(() => {
    const cleanup = subscribeToFirestore(setUsers, setBills, setPayments, setValveCommands, setAuditLogs, setNotifications);
    return cleanup;
  }, []);

  // Compute live dashboard summary
  const summary: DashboardSummary = React.useMemo(() => {
    const totalUsers = users.length;
    const activeConns = users.filter((u) => u.status === 'ACTIVE').length;
    const onlineDevs = Object.values(telemetry).filter((t) => {
      const user = users.find((u) => u.esp32DeviceId === t.deviceId);
      return user ? user.espStatus === 'ONLINE' : true;
    }).length;
    const offlineDevs = totalUsers - onlineDevs;
    const redBills = users.filter((u) => u.billStatus === 'RED_BILL').length;
    const pendingPayCount = users.filter((u) => u.billStatus === 'PENDING' || u.billStatus === 'OVERDUE').length;
    const todayWater = users.reduce((acc, u) => acc + (u.currentMonthUsageLiters / 30), 0);
    const todayRev = payments.reduce((acc, p) => acc + p.amount, 0);
    const closedValves = users.filter((u) => u.valveStatus === 'CLOSED').length;
    const openValves = users.filter((u) => u.valveStatus === 'OPEN').length;
    const leakCount = Object.values(telemetry).filter((t) => t.leakAlert || t.burstAlert).length;

    return {
      totalRegisteredUsers: totalUsers,
      activeConnections: activeConns,
      esp32OnlineCount: onlineDevs,
      esp32OfflineCount: offlineDevs,
      redBillUsersCount: redBills,
      pendingPaymentsCount: pendingPayCount,
      todayWaterConsumptionLiters: Math.round(todayWater),
      todayRevenueLKR: todayRev,
      closedValvesCount: closedValves,
      openValvesCount: openValves,
      abnormalLeakageCount: leakCount,
    };
  }, [users, telemetry, payments]);

  // Real-time telemetry simulation ticker
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((deviceId) => {
          const item = next[deviceId];
          const user = users.find((u) => u.esp32DeviceId === deviceId);
          if (user && user.valveStatus === 'OPEN' && user.espStatus === 'ONLINE') {
            // Jitter flow rate slightly
            const flowDelta = (Math.random() - 0.48) * 0.2;
            const newFlow = Math.max(0, Math.min(25, item.flowRateLpm + flowDelta));
            const volumeInc = (newFlow / 60) * 3; // 3-second increment
            next[deviceId] = {
              ...item,
              flowRateLpm: parseFloat(newFlow.toFixed(2)),
              totalVolumeLiters: parseFloat((item.totalVolumeLiters + volumeInc).toFixed(2)),
              pulseCount: item.pulseCount + Math.round(volumeInc * 7.5),
              lastPing: new Date().toISOString(),
            };
          }
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [simulationActive, users]);

  const toggleSimulation = () => setSimulationActive((prev) => !prev);

  // 1. VALVE COMMAND WORKFLOW
  const executeValveCommand = async (
    userId: string,
    commandType: ValveCommandType,
    reason: string
  ): Promise<{ success: boolean; message: string }> => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'User not found' };
    if (!officer) return { success: false, message: 'Officer not authenticated' };

    // Create Initial Command
    const command = valveCommandService.createCommand({
      deviceId: user.esp32DeviceId,
      meterId: user.meterId,
      userId: user.id,
      customerName: user.fullName,
      connectionNumber: user.connectionNumber,
      commandType,
      officer,
      reason,
    });

    setValveCommands((prev) => [command, ...prev]);

    // Execute IoT Handshake Machine
    await valveCommandService.executeCommandHandshake(command, (status, details) => {
      setValveCommands((prev) =>
        prev.map((c) => (c.id === command.id ? { ...c, status, ...details } : c))
      );
    });

    // Update User & Telemetry
    const targetStatus = commandType === 'OPEN_VALVE' ? 'OPEN' : 'CLOSED';
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              valveStatus: targetStatus,
              status: targetStatus === 'OPEN' ? 'ACTIVE' : 'DISCONNECTED',
            }
          : u
      )
    );

    setTelemetry((prev) => {
      if (!prev[user.esp32DeviceId]) return prev;
      return {
        ...prev,
        [user.esp32DeviceId]: {
          ...prev[user.esp32DeviceId],
          valveStatus: targetStatus,
          flowRateLpm: targetStatus === 'OPEN' ? 4.5 : 0.0,
        },
      };
    });

    // Create Audit Log
    const audit = AuditLogger.createLog({
      officer,
      action: commandType === 'OPEN_VALVE' ? 'REMOTE_VALVE_OPEN' : 'REMOTE_VALVE_CLOSE',
      actionCategory: 'VALVE_CONTROL',
      targetEntity: 'WaterUser',
      targetId: user.id,
      previousValue: user.valveStatus,
      newValue: targetStatus,
      status: 'SUCCESS',
      details: `Manual valve command executed by ${officer.name}. Reason: ${reason}`,
    });
    setAuditLogs((prev) => [audit, ...prev]);

    // Send SMS & Push
    const notif = await notificationService.dispatchNotification({
      recipientCustomerId: user.id,
      recipientName: user.fullName,
      recipientPhone: user.phone,
      type: commandType === 'OPEN_VALVE' ? 'VALVE_REOPENED' : 'VALVE_CLOSED',
      channel: 'BOTH',
      title: commandType === 'OPEN_VALVE' ? 'Water Valve Opened' : 'Water Valve Closed',
      message:
        commandType === 'OPEN_VALVE'
          ? `Your water supply (Conn #${user.connectionNumber}) is now active.`
          : `Your water supply (Conn #${user.connectionNumber}) has been closed. Reason: ${reason}`,
    });
    setNotifications((prev) => [notif, ...prev]);

    return { success: true, message: `Valve command successfully completed for ${user.fullName}` };
  };

  // 2. PAYMENT CONFIRMATION & AUTO-REOPEN WORKFLOW
  const recordPayment = async (params: {
    billId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference: string;
    notes?: string;
  }): Promise<{ success: boolean; receiptNumber: string }> => {
    const bill = bills.find((b) => b.id === params.billId);
    if (!bill) return { success: false, receiptNumber: '' };
    const user = users.find((u) => u.id === bill.customerId);

    const receiptNumber = `REC-NWSDB-${Math.floor(10000 + Math.random() * 90000)}`;
    const timestamp = new Date().toISOString();

    const newPaidAmount = bill.paidAmount + params.amount;
    const newOutstanding = Math.max(0, bill.totalAmount - newPaidAmount);
    const newBillStatus = newOutstanding === 0 ? 'PAID' : 'PENDING';

    const shouldAutoReopen = user && user.valveStatus === 'CLOSED' && newOutstanding === 0;

    const payment: PaymentTransaction = {
      id: `PAY-${Date.now()}`,
      receiptNumber,
      billId: bill.id,
      billNumber: bill.billNumber,
      customerId: bill.customerId,
      customerName: bill.customerName,
      connectionNumber: bill.connectionNumber,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      transactionReference: params.transactionReference,
      timestamp,
      verifiedByOfficerId: officer?.id,
      verifiedByOfficerName: officer?.name || 'Verified Government Gateway',
      status: 'SUCCESS',
      autoValveReopened: shouldAutoReopen || false,
      notes: params.notes,
    };

    setPayments((prev) => [payment, ...prev]);

    // Update Bill
    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? {
              ...b,
              paidAmount: newPaidAmount,
              outstandingBalance: newOutstanding,
              status: newBillStatus,
              paidAt: timestamp,
              paymentReference: params.transactionReference,
            }
          : b
      )
    );

    // Update User
    setUsers((prev) =>
      prev.map((u) =>
        u.id === bill.customerId
          ? {
              ...u,
              outstandingBalance: newOutstanding,
              billStatus: newBillStatus,
              lastPaymentDate: timestamp,
              valveStatus: shouldAutoReopen ? 'OPEN' : u.valveStatus,
              status: shouldAutoReopen ? 'ACTIVE' : u.status,
            }
          : u
      )
    );

    if (shouldAutoReopen && user) {
      // Create auto reopen command
      const openCmd = valveCommandService.createCommand({
        deviceId: user.esp32DeviceId,
        meterId: user.meterId,
        userId: user.id,
        customerName: user.fullName,
        connectionNumber: user.connectionNumber,
        commandType: 'OPEN_VALVE',
        officer: officer || {
          id: 'SYS-AUTOPAY',
          name: 'Payment Reconciliation Gateway',
          email: 'pay@waterboard.gov.lk',
          badgeNumber: 'NWSDB-SYS',
          department: 'Treasury',
          role: 'SUPER_ADMIN',
          phone: '',
          active: true,
        },
        reason: `Automated reopening after full payment clearance (Receipt #${receiptNumber})`,
      });
      setValveCommands((prev) => [openCmd, ...prev]);
    }

    // Audit Log
    if (officer) {
      const audit = AuditLogger.createLog({
        officer,
        action: 'RECORD_PAYMENT',
        actionCategory: 'PAYMENT',
        targetEntity: 'Bill',
        targetId: bill.id,
        previousValue: `Outstanding: LKR ${bill.outstandingBalance}`,
        newValue: `Outstanding: LKR ${newOutstanding} (Paid: LKR ${params.amount})`,
        status: 'SUCCESS',
        details: `Payment recorded via ${params.paymentMethod}. Receipt #${receiptNumber}`,
      });
      setAuditLogs((prev) => [audit, ...prev]);
    }

    return { success: true, receiptNumber };
  };

  // 3. GENERATE MONTHLY BILLS
  const generateMonthlyBills = async (): Promise<number> => {
    let createdCount = 0;
    const now = new Date();
    const periodName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const dueDateStr = new Date(now.getTime() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const graceEndStr = new Date(now.getTime() + 34 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const newBills: Bill[] = [];

    users.forEach((user) => {
      const tariff = tariffs.find((t) => t.category === user.tariffCategory) || tariffs[0];
      const calc = calculateWaterBill(user.currentMonthUsageLiters, tariff);
      const billId = `BILL-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

      const bill: Bill = {
        id: billId,
        billNumber: `NWSDB-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        customerId: user.id,
        customerName: user.fullName,
        connectionNumber: user.connectionNumber,
        meterId: user.meterId,
        billingPeriod: periodName,
        consumptionM3: calc.consumptionM3,
        consumptionLiters: calc.consumptionLiters,
        previousReadingLiters: user.currentConsumptionLiters - user.currentMonthUsageLiters,
        currentReadingLiters: user.currentConsumptionLiters,
        slabBreakdown: calc.slabBreakdown,
        consumptionCharge: calc.consumptionCharge,
        fixedCharge: calc.fixedCharge,
        taxesAmount: calc.taxesAmount,
        totalAmount: calc.totalAmount,
        paidAmount: 0,
        outstandingBalance: calc.totalAmount,
        generatedDate: now.toISOString().split('T')[0],
        dueDate: dueDateStr,
        gracePeriodEndDate: graceEndStr,
        status: 'PENDING',
      };

      newBills.push(bill);
      createdCount++;
    });

    setBills((prev) => [...newBills, ...prev]);

    if (officer) {
      const audit = AuditLogger.createLog({
        officer,
        action: 'BATCH_BILL_GENERATION',
        actionCategory: 'BILLING',
        targetEntity: 'BillingRun',
        targetId: periodName,
        status: 'SUCCESS',
        details: `Generated ${createdCount} utility bills for billing period ${periodName}`,
      });
      setAuditLogs((prev) => [audit, ...prev]);
    }

    return createdCount;
  };

  // 4. AUTOMATED RED-BILL & GRACE PERIOD ENFORCEMENT RUNNER
  const triggerRedBillEnforcement = async (): Promise<{ cutOffCount: number; warnedCount: number }> => {
    let cutOffCount = 0;
    let warnedCount = 0;

    const updatedBills = [...bills];
    const updatedUsers = [...users];

    for (let i = 0; i < updatedBills.length; i++) {
      const b = updatedBills[i];
      if (b.status === 'PENDING' || b.status === 'OVERDUE') {
        const u = updatedUsers.find((user) => user.id === b.customerId);
        if (!u) continue;

        const tariff = tariffs.find((t) => t.category === u.tariffCategory) || tariffs[0];
        const graceDays = tariff.gracePeriodDays || 14;

        // Force expiration for overdue accounts in simulation
        if (b.status === 'OVERDUE' || Math.random() > 0.5) {
          b.status = 'RED_BILL';
          u.billStatus = 'RED_BILL';
          u.valveStatus = 'CLOSED';
          u.status = 'DISCONNECTED';
          cutOffCount++;

          // Actuate valve close
          if (officer) {
            const audit = AuditLogger.createLog({
              officer,
              action: 'AUTOMATED_RED_BILL_CUTOFF',
              actionCategory: 'VALVE_CONTROL',
              targetEntity: 'WaterUser',
              targetId: u.id,
              previousValue: 'OPEN',
              newValue: 'CLOSED',
              details: `Automated valve shutoff for overdue bill #${b.billNumber} after ${graceDays} days grace period.`,
            });
            setAuditLogs((prev) => [audit, ...prev]);
          }

          const notif = await notificationService.dispatchNotification({
            recipientCustomerId: u.id,
            recipientName: u.fullName,
            recipientPhone: u.phone,
            type: 'VALVE_CLOSED',
            channel: 'BOTH',
            title: 'Water Cut-off Enforced',
            message: `Water supply closed due to unpaid Red Bill #${b.billNumber} (LKR ${b.outstandingBalance}). Please settle via app.`,
          });
          setNotifications((prev) => [notif, ...prev]);
        } else {
          b.status = 'OVERDUE';
          u.billStatus = 'OVERDUE';
          warnedCount++;
        }
      }
    }

    setBills(updatedBills);
    setUsers(updatedUsers);

    return { cutOffCount, warnedCount };
  };

  // 5. UPDATE TARIFF
  const updateTariff = (tariff: TariffConfig) => {
    const old = tariffs.find((t) => t.id === tariff.id);
    setTariffs((prev) => prev.map((t) => (t.id === tariff.id ? tariff : t)));

    if (officer) {
      const audit = AuditLogger.createLog({
        officer,
        action: 'UPDATE_TARIFF_CONFIGURATION',
        actionCategory: 'TARIFF',
        targetEntity: 'TariffConfig',
        targetId: tariff.id,
        previousValue: old ? JSON.stringify(old.slabs) : '',
        newValue: JSON.stringify(tariff.slabs),
        status: 'SUCCESS',
        details: `Updated volumetric slabs and charges for ${tariff.name}`,
      });
      setAuditLogs((prev) => [audit, ...prev]);
    }
  };

  // 6. CUSTOM NOTIFICATION
  const sendCustomNotification = async (params: {
    customerId: string;
    title: string;
    message: string;
    channel?: 'SMS' | 'PUSH' | 'BOTH';
  }) => {
    const user = users.find((u) => u.id === params.customerId);
    if (!user) return;

    const notif = await notificationService.dispatchNotification({
      recipientCustomerId: user.id,
      recipientName: user.fullName,
      recipientPhone: user.phone,
      type: 'SYSTEM_ALERT',
      channel: params.channel || 'BOTH',
      title: params.title,
      message: params.message,
    });

    setNotifications((prev) => [notif, ...prev]);

    if (officer) {
      const audit = AuditLogger.createLog({
        officer,
        action: 'DISPATCH_NOTIFICATION',
        actionCategory: 'NOTIFICATION',
        targetEntity: 'WaterUser',
        targetId: user.id,
        status: 'SUCCESS',
        details: `Sent custom announcement to ${user.fullName}: "${params.title}"`,
      });
      setAuditLogs((prev) => [audit, ...prev]);
    }
  };

  // 7. USER DETAILS UPDATE
  const updateUserDetails = (userId: string, partial: Partial<WaterUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...partial } : u)));
  };

  // 8. SIMULATION HELPERS
  const injectLeakage = (deviceId: string) => {
    setTelemetry((prev) => {
      const dev = prev[deviceId];
      if (!dev) return prev;
      return {
        ...prev,
        [deviceId]: {
          ...dev,
          leakAlert: !dev.leakAlert,
          flowRateLpm: !dev.leakAlert ? 1.4 : 0.0,
        },
      };
    });
  };

  const toggleDevicePower = (deviceId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.esp32DeviceId === deviceId
          ? { ...u, espStatus: u.espStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE' }
          : u
      )
    );
  };

  return (
    <DataContext.Provider
      value={{
        users,
        telemetry,
        bills,
        payments,
        valveCommands,
        auditLogs,
        notifications,
        tariffs,
        summary,
        simulationActive,
        toggleSimulation,
        executeValveCommand,
        recordPayment,
        generateMonthlyBills,
        triggerRedBillEnforcement,
        updateTariff,
        sendCustomNotification,
        updateUserDetails,
        injectLeakage,
        toggleDevicePower,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
