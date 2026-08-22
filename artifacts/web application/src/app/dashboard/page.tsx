'use client';

import React, { useState } from 'react';
import {
  Users,
  Activity,
  Cpu,
  Receipt,
  AlertOctagon,
  Power,
  Banknote,
  Droplet,
  Sparkles,
  FileSpreadsheet,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatCard } from '../../components/common/StatCard';
import { LeakageAlertBanner } from '../../components/monitoring/LeakageAlertBanner';
import { ConsumptionChart } from '../../components/dashboard/ConsumptionChart';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { LiveActivityFeed } from '../../components/dashboard/LiveActivityFeed';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { generateOfficialGovPdfReport } from '../../lib/exportUtils';
import confetti from 'canvas-confetti';

export default function DashboardPage() {
  const { summary, users, bills, payments, generateMonthlyBills, triggerRedBillEnforcement } = useData();

  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isRedBillModalOpen, setIsRedBillModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const handleRunBilling = async () => {
    setIsLoadingAction(true);
    const count = await generateMonthlyBills();
    setIsLoadingAction(false);
    setIsBillingModalOpen(false);
    setActionFeedback(`Successfully generated ${count} monthly utility bills based on active tariff slabs!`);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => setActionFeedback(''), 5000);
  };

  const handleRunRedBillEnforcement = async () => {
    setIsLoadingAction(true);
    const res = await triggerRedBillEnforcement();
    setIsLoadingAction(false);
    setIsRedBillModalOpen(false);
    setActionFeedback(
      `Red-Bill automated sweep complete! ${res.cutOffCount} valve(s) actuated closed due to grace period expiration. ${res.warnedCount} warning notices dispatched.`
    );
    setTimeout(() => setActionFeedback(''), 6000);
  };

  const handleExportQuickAudit = () => {
    const headers = ['Customer ID', 'Customer Name', 'NIC', 'Connection #', 'Usage (L)', 'Bill (LKR)', 'Status', 'Valve'];
    const rows = users.map((u) => [
      u.customerId,
      u.fullName,
      u.nic,
      u.connectionNumber,
      u.currentMonthUsageLiters.toLocaleString(),
      u.currentBillAmount.toFixed(2),
      u.billStatus,
      u.valveStatus,
    ]);

    generateOfficialGovPdfReport(
      'Daily National Smart Water Audit Summary',
      `All Districts • Registered Meters: ${users.length}`,
      headers,
      rows,
      `NWSDB_Daily_Audit_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>National Smart Water Command Center</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              LIVE GRID
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time IoT telemetry, solenoid actuation, automated billing & Red-Bill enforcement overview
          </p>
        </div>

        {/* Quick Operations Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBillingModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Generate Monthly Bills</span>
          </button>

          <button
            onClick={() => setIsRedBillModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Enforce Red-Bill Cutoffs</span>
          </button>

          <button
            onClick={handleExportQuickAudit}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Daily Audit PDF</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Pipe Burst & Leakage Warning Widget */}
      <LeakageAlertBanner />

      {/* Key Metric Summary Cards (10 Core Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Total Registered"
          value={summary.totalRegisteredUsers}
          subtitle="All Municipal Sectors"
          icon={Users}
          colorTheme="blue"
        />

        <StatCard
          title="Active Connections"
          value={summary.activeConnections}
          subtitle={`${summary.totalRegisteredUsers - summary.activeConnections} Suspended`}
          icon={Droplet}
          colorTheme="emerald"
        />

        <StatCard
          title="ESP32 Online"
          value={summary.esp32OnlineCount}
          subtitle={`${summary.esp32OfflineCount} Devices Offline`}
          icon={Cpu}
          colorTheme="slate"
        />

        <StatCard
          title="Red-Bill Users"
          value={summary.redBillUsersCount}
          subtitle="Grace Period Exceeded"
          icon={AlertOctagon}
          colorTheme="red"
        />

        <StatCard
          title="Closed Valves"
          value={summary.closedValvesCount}
          subtitle={`${summary.openValvesCount} Valves Open`}
          icon={Power}
          colorTheme="amber"
        />

        <StatCard
          title="Today's Water"
          value={`${(summary.todayWaterConsumptionLiters / 1000).toFixed(1)} m³`}
          subtitle={`${summary.todayWaterConsumptionLiters.toLocaleString()} Liters`}
          icon={Activity}
          colorTheme="emerald"
        />

        <StatCard
          title="Revenue Collected"
          value={`LKR ${summary.todayRevenueLKR.toLocaleString()}`}
          subtitle={`${payments.length} Verified Receipts`}
          icon={Banknote}
          colorTheme="blue"
        />

        <StatCard
          title="Pending Payments"
          value={summary.pendingPaymentsCount}
          subtitle="Overdue & Invoices"
          icon={Receipt}
          colorTheme="amber"
        />

        <StatCard
          title="Grid Leak Alerts"
          value={summary.abnormalLeakageCount}
          subtitle="Sensor Continuous Flow"
          icon={AlertOctagon}
          colorTheme={summary.abnormalLeakageCount > 0 ? 'red' : 'emerald'}
        />

        <StatCard
          title="Audit Trail Logs"
          value={bills.length + payments.length + 12}
          subtitle="Immutable History"
          icon={Sparkles}
          colorTheme="purple"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConsumptionChart />
        <RevenueChart />
      </div>

      {/* Live National Activity Feed */}
      <LiveActivityFeed />

      {/* Batch Billing Confirmation Dialog */}
      <ConfirmModal
        isOpen={isBillingModalOpen}
        title="Execute Monthly Batch Utility Billing"
        description="This operation will calculate volumetric tiered bills for all active consumers according to current Sri Lankan tariff slabs, generate official invoice numbers, and send SMS notices."
        confirmText="Generate All Bills"
        requireReason={false}
        isLoading={isLoadingAction}
        onConfirm={handleRunBilling}
        onClose={() => setIsBillingModalOpen(false)}
      />

      {/* Red-Bill Enforcement Confirmation Dialog */}
      <ConfirmModal
        isOpen={isRedBillModalOpen}
        title="Execute Automated Red-Bill & Grace Period Sweep"
        description="The system will inspect all unpaid bills past due date + configured grace period (14 days), flag accounts as RED BILL, and dispatch remote CLOSE_VALVE commands to the respective ESP32 smart meters."
        confirmText="Enforce Valve Cut-offs"
        isDangerous={true}
        requireReason={true}
        isLoading={isLoadingAction}
        onConfirm={handleRunRedBillEnforcement}
        onClose={() => setIsRedBillModalOpen(false)}
      />
    </div>
  );
}
