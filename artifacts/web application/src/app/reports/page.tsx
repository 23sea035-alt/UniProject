'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Activity,
  Droplets,
  Receipt,
  AlertOctagon,
  Power,
  Cpu,
  Search,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { exportToCSV, generateOfficialGovPdfReport } from '../../lib/exportUtils';

export default function ReportsPage() {
  const { users, bills, payments, valveCommands, telemetry, summary } = useData();

  const [selectedReportType, setSelectedReportType] = useState<'WATER_AUDIT' | 'REVENUE' | 'RED_BILLS' | 'VALVE_OPS' | 'LEAKAGES'>('WATER_AUDIT');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  // Filtered by District
  const filteredUsers = users.filter((u) => selectedDistrict === 'ALL' || u.district === selectedDistrict);

  // 1. Water Audit & Non-Revenue Water (NRW) Report
  const handleExportWaterAuditPdf = () => {
    const headers = ['Consumer Name', 'NIC', 'District', 'Connection #', 'Meter ID', 'Tariff', 'Billed Volume (m³)', 'Liters Consumed'];
    const rows = filteredUsers.map((u) => [
      u.fullName,
      u.nic,
      u.district,
      u.connectionNumber,
      u.meterId,
      u.tariffCategory,
      (u.currentMonthUsageLiters / 1000).toFixed(2),
      u.currentMonthUsageLiters.toLocaleString(),
    ]);

    generateOfficialGovPdfReport(
      'National Water Production vs Billed Consumption Audit',
      `District: ${selectedDistrict} | Meter Fleet: ${filteredUsers.length}`,
      headers,
      rows,
      `NWSDB_Water_Audit_${selectedDistrict}_${new Date().toISOString().split('T')[0]}`
    );
  };

  // 2. Revenue & Arrears Aging Report
  const handleExportRevenuePdf = () => {
    const headers = ['Bill Number', 'Customer Name', 'District', 'Connection #', 'Total Billed (LKR)', 'Paid (LKR)', 'Outstanding (LKR)', 'Status'];
    const rows = bills.map((b) => [
      b.billNumber,
      b.customerName,
      users.find((u) => u.id === b.customerId)?.district || 'Western',
      b.connectionNumber,
      b.totalAmount.toFixed(2),
      b.paidAmount.toFixed(2),
      b.outstandingBalance.toFixed(2),
      b.status,
    ]);

    generateOfficialGovPdfReport(
      'Revenue Collection & Arrears Aging Audit',
      `Total Invoiced: LKR ${bills.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}`,
      headers,
      rows,
      `NWSDB_Revenue_Audit_${new Date().toISOString().split('T')[0]}`
    );
  };

  // 3. Red Bills & Disconnected Consumers Report
  const handleExportRedBillsPdf = () => {
    const redUsers = filteredUsers.filter((u) => u.billStatus === 'RED_BILL' || u.valveStatus === 'CLOSED');
    const headers = ['Customer ID', 'Customer Name', 'NIC', 'District', 'Connection #', 'Overdue Amount (LKR)', 'Valve State', 'Status'];
    const rows = redUsers.map((u) => [
      u.customerId,
      u.fullName,
      u.nic,
      u.district,
      u.connectionNumber,
      u.currentBillAmount.toFixed(2),
      u.valveStatus,
      u.billStatus,
    ]);

    generateOfficialGovPdfReport(
      'Enforced Red-Bill Disconnections & Delinquency Report',
      `Total Cut-off Accounts: ${redUsers.length}`,
      headers,
      rows,
      `NWSDB_Red_Bills_Audit_${new Date().toISOString().split('T')[0]}`
    );
  };

  // 4. Solenoid Valve Operations Audit
  const handleExportValveOpsPdf = () => {
    const headers = ['Command ID', 'Customer Name', 'Connection #', 'Device ID', 'Action', 'Officer / Trigger', 'Status', 'Timestamp'];
    const rows = valveCommands.map((c) => [
      c.id,
      c.customerName,
      c.connectionNumber,
      c.deviceId,
      c.commandType,
      c.requestedByOfficerName,
      c.status,
      new Date(c.timestamp).toLocaleString('en-GB'),
    ]);

    generateOfficialGovPdfReport(
      'Remote Solenoid Valve IoT Operations Log',
      `Total Actuations: ${valveCommands.length}`,
      headers,
      rows,
      `NWSDB_Valve_Operations_Audit_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Official Government Water Utility Reports & NRW Analytics</span>
          </h1>
          <p className="text-xs text-slate-400">
            Exportable regulatory compliance reports, water production audits, and revenue collection assessments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">All Island Districts</option>
            <option value="Colombo">Colombo</option>
            <option value="Kandy">Kandy</option>
            <option value="Galle">Galle</option>
            <option value="Jaffna">Jaffna</option>
            <option value="Gampaha">Gampaha</option>
          </select>
        </div>
      </div>

      {/* Report Type Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setSelectedReportType('WATER_AUDIT')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedReportType === 'WATER_AUDIT'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-lg'
              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Droplets className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400 font-bold">AUDIT #1</span>
          </div>
          <p className="text-xs font-bold text-slate-100 mt-2">Water Audit & NRW Loss</p>
          <p className="text-[11px] text-slate-400 mt-1">Consumption telemetry & non-revenue estimates</p>
        </button>

        <button
          onClick={() => setSelectedReportType('REVENUE')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedReportType === 'REVENUE'
              ? 'bg-blue-950/60 border-blue-500 text-blue-200 shadow-lg'
              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Receipt className="w-5 h-5 text-blue-400" />
            <span className="text-[10px] font-mono text-blue-400 font-bold">AUDIT #2</span>
          </div>
          <p className="text-xs font-bold text-slate-100 mt-2">Revenue & Arrears Aging</p>
          <p className="text-[11px] text-slate-400 mt-1">Collections, outstanding balances & taxes</p>
        </button>

        <button
          onClick={() => setSelectedReportType('RED_BILLS')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedReportType === 'RED_BILLS'
              ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-lg'
              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <span className="text-[10px] font-mono text-rose-400 font-bold">AUDIT #3</span>
          </div>
          <p className="text-xs font-bold text-slate-100 mt-2">Red-Bills & Cut-offs</p>
          <p className="text-[11px] text-slate-400 mt-1">Grace period expired delinquent accounts</p>
        </button>

        <button
          onClick={() => setSelectedReportType('VALVE_OPS')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedReportType === 'VALVE_OPS'
              ? 'bg-teal-950/60 border-teal-500 text-teal-200 shadow-lg'
              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Power className="w-5 h-5 text-teal-400" />
            <span className="text-[10px] font-mono text-teal-400 font-bold">AUDIT #4</span>
          </div>
          <p className="text-xs font-bold text-slate-100 mt-2">Valve Actuation Log</p>
          <p className="text-[11px] text-slate-400 mt-1">2-way IoT command history & reasons</p>
        </button>
      </div>

      {/* Active Report Preview & Export Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-100">
              {selectedReportType === 'WATER_AUDIT' && 'National Water Production & Consumption Audit'}
              {selectedReportType === 'REVENUE' && 'Revenue Collection & Billing Arrears Aging Report'}
              {selectedReportType === 'RED_BILLS' && 'Delinquent Red-Bill Consumer & Cut-off Register'}
              {selectedReportType === 'VALVE_OPS' && 'Remote Solenoid Valve Actuations & Handshakes'}
            </h3>
            <p className="text-xs text-slate-400">Security Classification: RESTRICTED / OFFICIAL UTILITY DOCUMENT</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedReportType === 'WATER_AUDIT') handleExportWaterAuditPdf();
                if (selectedReportType === 'REVENUE') handleExportRevenuePdf();
                if (selectedReportType === 'RED_BILLS') handleExportRedBillsPdf();
                if (selectedReportType === 'VALVE_OPS') handleExportValveOpsPdf();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Report (PDF)</span>
            </button>
          </div>
        </div>

        {/* Live Report Preview Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Reference / Customer</th>
                <th className="p-3">Connection & District</th>
                <th className="p-3 text-right">Metrics / Volume</th>
                <th className="p-3 text-right">Amount (LKR)</th>
                <th className="p-3 text-center">Status / State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.slice(0, 7).map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="p-3">
                    <p className="font-semibold text-slate-200">{u.fullName}</p>
                    <p className="text-[10px] font-mono text-slate-500">NIC: {u.nic}</p>
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    <p className="text-slate-300">{u.connectionNumber}</p>
                    <p className="text-slate-500">{u.district} District</p>
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span className="font-bold text-slate-200">{u.currentMonthUsageLiters.toLocaleString()} L</span>
                    <span className="text-[10px] text-slate-500 block">({(u.currentMonthUsageLiters / 1000).toFixed(1)} m³)</span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    {u.currentBillAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                      {u.billStatus}
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
