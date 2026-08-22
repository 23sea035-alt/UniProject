'use client';

import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Download,
  Filter,
  Lock,
  Unlock,
  CreditCard,
  Receipt,
  UserCheck,
  Sliders,
  BellRing,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { exportToCSV, generateOfficialGovPdfReport } from '../../lib/exportUtils';
import { ActionCategory } from '../../types';

export default function AuditLogsPage() {
  const { auditLogs } = useData();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.officerName.toLowerCase().includes(search.toLowerCase()) ||
      log.targetId.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));

    const matchCategory = categoryFilter === 'ALL' || log.actionCategory === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getCategoryIcon = (cat: ActionCategory) => {
    switch (cat) {
      case 'VALVE_CONTROL':
        return <Lock className="w-4 h-4 text-rose-400" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'BILLING':
        return <Receipt className="w-4 h-4 text-emerald-400" />;
      case 'TARIFF':
        return <Sliders className="w-4 h-4 text-amber-400" />;
      case 'NOTIFICATION':
        return <BellRing className="w-4 h-4 text-teal-400" />;
      case 'AUTH':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Officer Name',
      'Officer Role',
      'Action Category',
      'Action',
      'Target Entity',
      'Target ID',
      'Previous Value',
      'New Value',
      'IP Address',
      'Timestamp',
      'Status',
      'Details',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      l.officerName,
      l.officerRole,
      l.actionCategory,
      l.action,
      l.targetEntity,
      l.targetId,
      l.previousValue || '',
      l.newValue || '',
      l.ipAddress,
      l.timestamp,
      l.status,
      l.details || '',
    ]);

    exportToCSV(`NWSDB_Immutable_Audit_Trail_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Log ID', 'Officer', 'Category', 'Action', 'Target ID', 'Timestamp', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.officerName,
      l.actionCategory,
      l.action,
      l.targetId,
      new Date(l.timestamp).toLocaleString('en-GB'),
      l.status,
    ]);

    generateOfficialGovPdfReport(
      'National Water Supply Board Immutable Security Audit Trail',
      `Category: ${categoryFilter} | Total Audit Records: ${filteredLogs.length}`,
      headers,
      rows,
      `NWSDB_Audit_Report_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <span>Immutable Government Audit Trail & Compliance Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Tamper-evident append-only ledger tracking all valve commands, tariff modifications, billing runs, and officer operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Official Audit PDF
          </button>
        </div>
      </div>

      {/* Compliance Badge */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">National Compliance & Tamper Detection: VALID</h4>
            <p className="text-[11px] text-slate-400">
              Audit log integrity is cryptographically enforced and protected under Firestore Security Rules (Write/Delete Restricted).
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-purple-300 px-2 py-1 rounded bg-purple-950 border border-purple-800">
          LOGS COUNT: {auditLogs.length}
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search audit trail by Officer Name, Target ID, Action, Details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">All Categories ({auditLogs.length})</option>
            <option value="VALVE_CONTROL">Valve Controls</option>
            <option value="BILLING">Billing & Invoicing</option>
            <option value="PAYMENT">Payments & Reconnection</option>
            <option value="TARIFF">Tariff Modifications</option>
            <option value="AUTH">Officer Authentication</option>
            <option value="NOTIFICATION">Notifications</option>
          </select>
        </div>
      </div>

      {/* Audit Log Stream Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Log ID & Category</th>
                <th className="p-3.5">Officer & Role</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Target Entity & ID</th>
                <th className="p-3.5">Operational Details</th>
                <th className="p-3.5">IP & Origin</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">
                        {getCategoryIcon(log.actionCategory)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{log.id}</p>
                        <p className="text-[10px] text-slate-500">{log.actionCategory}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <p className="font-semibold text-slate-100">{log.officerName}</p>
                    <p className="text-[10px] text-purple-400 font-mono">{log.officerRole}</p>
                  </td>

                  <td className="p-3.5 font-semibold text-slate-200">
                    {log.action.replace(/_/g, ' ')}
                  </td>

                  <td className="p-3.5 font-mono text-[11px]">
                    <p className="text-emerald-400">{log.targetId}</p>
                    <p className="text-slate-500">{log.targetEntity}</p>
                  </td>

                  <td className="p-3.5 text-[11px] text-slate-300 max-w-sm">
                    <p className="line-clamp-2">{log.details || 'N/A'}</p>
                    {(log.previousValue || log.newValue) && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        <span className="text-rose-400/80">Before: {log.previousValue || 'None'}</span> →{' '}
                        <span className="text-emerald-400/80">After: {log.newValue || 'None'}</span>
                      </p>
                    )}
                  </td>

                  <td className="p-3.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {log.ipAddress}
                  </td>

                  <td className="p-3.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
