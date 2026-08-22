'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Power,
  Unlock,
  Lock,
  Plus,
  ArrowUpDown,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { exportToCSV, generateOfficialGovPdfReport } from '../../lib/exportUtils';
import { WaterUser, BillStatusType, ValveStatusType, DeviceOnlineStatus } from '../../types';

export default function UsersPage() {
  const { users, executeValveCommand, updateUserDetails } = useData();

  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [billFilter, setBillFilter] = useState('ALL');
  const [valveFilter, setValveFilter] = useState('ALL');
  const [deviceFilter, setDeviceFilter] = useState('ALL');
  const [sortField, setSortField] = useState<keyof WaterUser>('fullName');
  const [sortAsc, setSortAsc] = useState(true);

  // Valve Control Modal State
  const [selectedUserForValve, setSelectedUserForValve] = useState<WaterUser | null>(null);
  const [isValveModalOpen, setIsValveModalOpen] = useState(false);
  const [valveActionType, setValveActionType] = useState<'OPEN_VALVE' | 'CLOSE_VALVE'>('CLOSE_VALVE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Extract unique districts
  const districts = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.district)));
  }, [users]);

  // Filter & Sort
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        const matchesSearch =
          u.fullName.toLowerCase().includes(search.toLowerCase()) ||
          u.nic.toLowerCase().includes(search.toLowerCase()) ||
          u.connectionNumber.toLowerCase().includes(search.toLowerCase()) ||
          u.meterId.toLowerCase().includes(search.toLowerCase()) ||
          u.customerId.toLowerCase().includes(search.toLowerCase()) ||
          u.phone.includes(search);

        const matchesDistrict = districtFilter === 'ALL' || u.district === districtFilter;
        const matchesBill = billFilter === 'ALL' || u.billStatus === billFilter;
        const matchesValve = valveFilter === 'ALL' || u.valveStatus === valveFilter;
        const matchesDevice = deviceFilter === 'ALL' || u.espStatus === deviceFilter;

        return matchesSearch && matchesDistrict && matchesBill && matchesValve && matchesDevice;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [users, search, districtFilter, billFilter, valveFilter, deviceFilter, sortField, sortAsc]);

  const handleSort = (field: keyof WaterUser) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleOpenValveModal = (user: WaterUser, type: 'OPEN_VALVE' | 'CLOSE_VALVE') => {
    setSelectedUserForValve(user);
    setValveActionType(type);
    setIsValveModalOpen(true);
  };

  const handleExecuteValveCommand = async (reason: string) => {
    if (!selectedUserForValve) return;
    setIsProcessing(true);
    const res = await executeValveCommand(selectedUserForValve.id, valveActionType, reason);
    setIsProcessing(false);
    setIsValveModalOpen(false);
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(''), 5000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'NIC',
      'Phone',
      'Address',
      'District',
      'Connection #',
      'Meter ID',
      'Tariff',
      'Consumption (L)',
      'Current Bill (LKR)',
      'Bill Status',
      'Valve Status',
      'ESP32 Status',
    ];

    const rows = filteredUsers.map((u) => [
      u.customerId,
      u.fullName,
      u.nic,
      u.phone,
      u.address,
      u.district,
      u.connectionNumber,
      u.meterId,
      u.tariffCategory,
      u.currentMonthUsageLiters,
      u.currentBillAmount,
      u.billStatus,
      u.valveStatus,
      u.espStatus,
    ]);

    exportToCSV(`NWSDB_Users_Directory_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Cust ID', 'Name', 'NIC', 'District', 'Connection #', 'Usage (L)', 'Bill (LKR)', 'Status', 'Valve'];
    const rows = filteredUsers.map((u) => [
      u.customerId,
      u.fullName,
      u.nic,
      u.district,
      u.connectionNumber,
      u.currentMonthUsageLiters.toLocaleString(),
      u.currentBillAmount.toFixed(2),
      u.billStatus,
      u.valveStatus,
    ]);

    generateOfficialGovPdfReport(
      'Registered Smart Water Meter Consumers Directory',
      `Filter: District (${districtFilter}) | Status (${billFilter})`,
      headers,
      rows,
      `NWSDB_Consumers_Report_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Water Consumers & Smart Meter Directory</span>
          </h1>
          <p className="text-xs text-slate-400">
            Registered accounts from mobile app, live telemetry readings, and remote solenoid actuator states
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
            <Download className="w-3.5 h-3.5" /> Official PDF Report
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Name, NIC, Mobile, Connection #, Meter ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* District Filter */}
          <div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Districts ({districts.length})</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Bill Status Filter */}
          <div>
            <select
              value={billFilter}
              onChange={(e) => setBillFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Bill Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="RED_BILL">RED BILL</option>
            </select>
          </div>

          {/* Valve Filter */}
          <div>
            <select
              value={valveFilter}
              onChange={(e) => setValveFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Valve States</option>
              <option value="OPEN">Valve OPEN</option>
              <option value="CLOSED">Valve CLOSED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th onClick={() => handleSort('customerId')} className="p-3.5 cursor-pointer hover:text-slate-200">
                  <div className="flex items-center gap-1">
                    <span>Customer / NIC</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('fullName')} className="p-3.5 cursor-pointer hover:text-slate-200">
                  <div className="flex items-center gap-1">
                    <span>Full Name & Contact</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Connection & Meter</th>
                <th onClick={() => handleSort('currentMonthUsageLiters')} className="p-3.5 text-right cursor-pointer hover:text-slate-200">
                  <div className="flex items-center justify-end gap-1">
                    <span>Usage (L)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('currentBillAmount')} className="p-3.5 text-right cursor-pointer hover:text-slate-200">
                  <div className="flex items-center justify-end gap-1">
                    <span>Bill (LKR)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">ESP32 & Valve</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    No registered water consumers found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono">
                      <p className="font-bold text-slate-200">{user.customerId}</p>
                      <p className="text-[11px] text-emerald-400">NIC: {user.nic}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-slate-100">{user.fullName}</p>
                      <p className="text-[11px] text-slate-400">{user.phone}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{user.address}</p>
                    </td>

                    <td className="p-3.5 font-mono text-[11px]">
                      <p className="text-slate-200">Conn: <span className="font-semibold">{user.connectionNumber}</span></p>
                      <p className="text-slate-400">Meter: {user.meterId}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{user.tariffCategory}</p>
                    </td>

                    <td className="p-3.5 text-right font-mono">
                      <span className="font-bold text-slate-100 text-sm">
                        {user.currentMonthUsageLiters.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {(user.currentMonthUsageLiters / 1000).toFixed(1)} m³
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-mono">
                      <span className="font-bold text-emerald-400 text-sm">
                        {user.currentBillAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {user.outstandingBalance > 0 && (
                        <span className="text-[10px] text-rose-400 block font-semibold">
                          Due: {user.outstandingBalance.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <StatusBadge type="bill" status={user.billStatus} />
                    </td>

                    <td className="p-3.5 text-center space-y-1">
                      <div><StatusBadge type="device" status={user.espStatus} /></div>
                      <div><StatusBadge type="valve" status={user.valveStatus} /></div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/users/${user.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors"
                          title="Open 360° Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {user.valveStatus === 'OPEN' ? (
                          <button
                            onClick={() => handleOpenValveModal(user, 'CLOSE_VALVE')}
                            className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 transition-colors"
                            title="Shut Off Solenoid Valve"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenValveModal(user, 'OPEN_VALVE')}
                            className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800 transition-colors"
                            title="Open Solenoid Valve"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredUsers.length} of {users.length} registered water consumers</span>
          <span className="text-[11px] text-slate-500">Auto-synced from React Native mobile registrations</span>
        </div>
      </div>

      {/* Valve Actuation Confirmation Modal */}
      {selectedUserForValve && (
        <ConfirmModal
          isOpen={isValveModalOpen}
          title={
            valveActionType === 'CLOSE_VALVE'
              ? `Remote Solenoid Shut-off: ${selectedUserForValve.fullName}`
              : `Remote Solenoid Reconnection: ${selectedUserForValve.fullName}`
          }
          description={`You are executing a 2-way IoT command to ${
            valveActionType === 'CLOSE_VALVE' ? 'CLOSE' : 'OPEN'
          } the water valve on Smart Meter ${selectedUserForValve.meterId} (Conn #${selectedUserForValve.connectionNumber}).`}
          confirmText={valveActionType === 'CLOSE_VALVE' ? 'Execute Valve Shut-off' : 'Restore Water Supply'}
          isDangerous={valveActionType === 'CLOSE_VALVE'}
          requireReason={true}
          isLoading={isProcessing}
          onConfirm={handleExecuteValveCommand}
          onClose={() => setIsValveModalOpen(false)}
        />
      )}
    </div>
  );
}
