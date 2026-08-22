'use client';

import React, { useState } from 'react';
import {
  Power,
  Unlock,
  Lock,
  Zap,
  Radio,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Cpu,
  History,
  ShieldAlert,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ValveCommandType, WaterUser } from '../../types';

export default function ValveControlPage() {
  const { users, valveCommands, executeValveCommand, triggerRedBillEnforcement, summary } = useData();

  const [search, setSearch] = useState('');
  const [filterValve, setFilterValve] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<WaterUser | null>(null);
  const [actionType, setActionType] = useState<ValveCommandType>('CLOSE_VALVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedBillSweepOpen, setIsRedBillSweepOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.nic.toLowerCase().includes(search.toLowerCase()) ||
      u.connectionNumber.toLowerCase().includes(search.toLowerCase()) ||
      u.meterId.toLowerCase().includes(search.toLowerCase());

    const matchValve = filterValve === 'ALL' || u.valveStatus === filterValve;
    return matchSearch && matchValve;
  });

  const handleOpenModal = (user: WaterUser, type: ValveCommandType) => {
    setSelectedUser(user);
    setActionType(type);
    setIsModalOpen(true);
  };

  const handleExecuteValve = async (reason: string) => {
    if (!selectedUser) return;
    setIsProcessing(true);
    const res = await executeValveCommand(selectedUser.id, actionType, reason);
    setIsProcessing(false);
    setIsModalOpen(false);
    setFeedback(res.message);
    setTimeout(() => setFeedback(''), 5000);
  };

  const handleRunRedBillSweep = async () => {
    setIsProcessing(true);
    const res = await triggerRedBillEnforcement();
    setIsProcessing(false);
    setIsRedBillSweepOpen(false);
    setFeedback(`Automated Red-Bill sweep complete: ${res.cutOffCount} solenoid valves closed due to expired grace period. ${res.warnedCount} warning notices dispatched.`);
    setTimeout(() => setFeedback(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Power className="w-5 h-5 text-emerald-400" />
            <span>Remote Solenoid Valve Control & Enforcement Hub</span>
          </h1>
          <p className="text-xs text-slate-400">
            2-Way IoT command handshake, automated Red-Bill cut-offs, and emergency supply management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRedBillSweepOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Run Red-Bill Auto-Cutoff Sweep</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Open Solenoid Valves</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{summary.openValvesCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Water supply active</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Closed Valves (Disconnected)</span>
          <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">{summary.closedValvesCount}</p>
          <p className="text-[11px] text-rose-400/80 mt-1">Red-Bill & maintenance shut-offs</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Red-Bill Grace Expired</span>
          <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">{summary.redBillUsersCount}</p>
          <p className="text-[11px] text-amber-500 mt-1">Eligible for remote cut-off</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">IoT Command State Machine</span>
          <p className="text-2xl font-bold text-teal-400 mt-1 font-mono">2-Way ACK</p>
          <p className="text-[11px] text-teal-400/80 mt-1">Pending → Sent → ACK → Complete</p>
        </div>
      </div>

      {/* 2-Way IoT Handshake Command History Stream */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm text-slate-100">ESP32 IoT Valve Command Handshake Stream</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Total Commands: {valveCommands.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Command ID</th>
                <th className="p-3">Target Customer & Conn #</th>
                <th className="p-3">ESP32 Device Node</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Requested By</th>
                <th className="p-3">Official Reason</th>
                <th className="p-3 text-center">Handshake Status</th>
                <th className="p-3 text-right">Timestamps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {valveCommands.slice(0, 8).map((cmd) => (
                <tr key={cmd.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-200">{cmd.id}</td>

                  <td className="p-3">
                    <p className="font-semibold text-slate-100">{cmd.customerName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{cmd.connectionNumber}</p>
                  </td>

                  <td className="p-3 font-mono text-slate-300">{cmd.deviceId}</td>

                  <td className="p-3">
                    {cmd.commandType === 'OPEN_VALVE' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">
                        OPEN VALVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold text-[10px] border border-rose-800">
                        CLOSE VALVE
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-slate-300">{cmd.requestedByOfficerName}</td>

                  <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">{cmd.reason}</td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        cmd.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : cmd.status === 'ACKNOWLEDGED'
                          ? 'bg-teal-950 text-teal-300 border border-teal-800 animate-pulse'
                          : cmd.status === 'SENT'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {cmd.status}
                    </span>
                  </td>

                  <td className="p-3 text-right font-mono text-[10px] text-slate-500">
                    <p>{new Date(cmd.timestamp).toLocaleTimeString('en-GB')}</p>
                    {cmd.completedTimestamp && (
                      <p className="text-emerald-500">ACK: {new Date(cmd.completedTimestamp).toLocaleTimeString('en-GB')}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Valve Actuation Controls Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-100">National Valve Fleet Operations</h3>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Customer, Connection #, Meter ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500"
              />
            </div>

            <select
              value={filterValve}
              onChange={(e) => setFilterValve(e.target.value)}
              className="py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-emerald-500"
            >
              <option value="ALL">All Valves ({users.length})</option>
              <option value="OPEN">Valves OPEN ({summary.openValvesCount})</option>
              <option value="CLOSED">Valves CLOSED ({summary.closedValvesCount})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Customer & Location</th>
                <th className="p-3">Connection & Meter</th>
                <th className="p-3">Bill Status</th>
                <th className="p-3 text-right">Outstanding (LKR)</th>
                <th className="p-3 text-center">Valve State</th>
                <th className="p-3 text-right">Manual Remote Actuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <p className="font-semibold text-slate-100">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400">{user.district} • NIC: {user.nic}</p>
                  </td>

                  <td className="p-3 font-mono text-[11px]">
                    <p className="text-slate-200">Conn: {user.connectionNumber}</p>
                    <p className="text-slate-500">Meter: {user.meterId}</p>
                  </td>

                  <td className="p-3">
                    <StatusBadge type="bill" status={user.billStatus} />
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-slate-200">
                    {user.outstandingBalance > 0 ? (
                      <span className="text-rose-400">{user.outstandingBalance.toLocaleString()}</span>
                    ) : (
                      <span className="text-emerald-400">0.00</span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <StatusBadge type="valve" status={user.valveStatus} />
                  </td>

                  <td className="p-3 text-right">
                    {user.valveStatus === 'OPEN' ? (
                      <button
                        onClick={() => handleOpenModal(user, 'CLOSE_VALVE')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 ml-auto shadow-sm transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Cut Off Supply</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenModal(user, 'OPEN_VALVE')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 ml-auto shadow-sm transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Reopen Supply</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Valve Actuation Modal */}
      {selectedUser && (
        <ConfirmModal
          isOpen={isModalOpen}
          title={
            actionType === 'CLOSE_VALVE'
              ? `Remote Solenoid Cut-off: ${selectedUser.fullName}`
              : `Remote Solenoid Reconnection: ${selectedUser.fullName}`
          }
          description={`Confirm dispatching a remote IoT command to ${
            actionType === 'CLOSE_VALVE' ? 'CLOSE' : 'OPEN'
          } the solenoid valve on meter ${selectedUser.meterId} (Conn #${selectedUser.connectionNumber}).`}
          confirmText={actionType === 'CLOSE_VALVE' ? 'Execute Valve Shut-off' : 'Restore Water Supply'}
          isDangerous={actionType === 'CLOSE_VALVE'}
          requireReason={true}
          isLoading={isProcessing}
          onConfirm={handleExecuteValve}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Red-Bill Automated Sweep Modal */}
      <ConfirmModal
        isOpen={isRedBillSweepOpen}
        title="Execute Island-Wide Red-Bill & Grace Period Sweep"
        description="The system will identify all unpaid utility bills that have exceeded the 14-day grace period, upgrade the status to RED BILL, dispatch pre-disconnection warnings, and actuate remote CLOSE_VALVE commands."
        confirmText="Execute Automated Sweep"
        isDangerous={true}
        requireReason={true}
        isLoading={isProcessing}
        onConfirm={handleRunRedBillSweep}
        onClose={() => setIsRedBillSweepOpen(false)}
      />
    </div>
  );
}
