'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  WifiOff,
  Signal,
  Battery,
  Zap,
  Search,
  Download,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { HardwareSimulatorModal } from '../../components/devices/HardwareSimulatorModal';
import { exportToCSV, generateOfficialGovPdfReport } from '../../lib/exportUtils';

export default function DevicesPage() {
  const { users, telemetry, summary } = useData();

  const [search, setSearch] = useState('');
  const [filterOnline, setFilterOnline] = useState('ALL');
  const [selectedDeviceBench, setSelectedDeviceBench] = useState<string | null>(null);

  const deviceList = users.map((u) => {
    const t = telemetry[u.esp32DeviceId] || {
      deviceId: u.esp32DeviceId,
      meterId: u.meterId,
      userId: u.id,
      flowRateLpm: u.valveStatus === 'OPEN' ? 4.5 : 0.0,
      totalVolumeLiters: u.currentConsumptionLiters,
      pulseCount: u.currentConsumptionLiters * 7.5,
      signalStrengthDbm: -65,
      batteryLevel: 94,
      mainsPowered: true,
      valveStatus: u.valveStatus,
      tamperDetected: false,
      burstAlert: false,
      leakAlert: false,
      reverseFlowAlert: false,
      firmwareVersion: 'v2.4.2-SL-GOV',
      lastPing: new Date().toISOString(),
    };
    return { user: u, telemetry: t };
  });

  const filteredDevices = deviceList.filter((item) => {
    const matchSearch =
      item.telemetry.deviceId.toLowerCase().includes(search.toLowerCase()) ||
      item.user.meterId.toLowerCase().includes(search.toLowerCase()) ||
      item.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.user.connectionNumber.toLowerCase().includes(search.toLowerCase());

    const matchOnline = filterOnline === 'ALL' || item.user.espStatus === filterOnline;
    return matchSearch && matchOnline;
  });

  const handleExportCSV = () => {
    const headers = [
      'Device ID',
      'Meter ID',
      'Customer',
      'District',
      'Connection #',
      'Online Status',
      'Signal (dBm)',
      'Battery (%)',
      'Flow Rate (L/min)',
      'Cumulative Volume (L)',
      'Pulse Count',
      'Valve State',
      'Firmware',
    ];

    const rows = filteredDevices.map(({ user, telemetry: t }) => [
      t.deviceId,
      user.meterId,
      user.fullName,
      user.district,
      user.connectionNumber,
      user.espStatus,
      t.signalStrengthDbm,
      t.batteryLevel,
      t.flowRateLpm,
      t.totalVolumeLiters,
      t.pulseCount,
      t.valveStatus,
      t.firmwareVersion,
    ]);

    exportToCSV(`NWSDB_ESP32_Fleet_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <span>ESP32 Smart Meter Device Fleet & Firmware Hub</span>
          </h1>
          <p className="text-xs text-slate-400">
            Hardware node monitoring, pulse counter diagnostics, WiFi RSSI strength, and firmware telemetry
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <Download className="w-3.5 h-3.5" /> Export Fleet CSV
        </button>
      </div>

      {/* Fleet Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">ESP32 Online Nodes</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {summary.esp32OnlineCount}
          </p>
          <p className="text-[11px] text-emerald-500 mt-1">Real-time Firebase telemetry active</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Offline / Power Lost</span>
          <p className="text-2xl font-bold text-slate-400 mt-1 font-mono">
            {summary.esp32OfflineCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Operating in offline pulse buffer</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Solenoid Actuators Normal</span>
          <p className="text-2xl font-bold text-teal-400 mt-1 font-mono">
            {summary.openValvesCount} / {summary.totalRegisteredUsers}
          </p>
          <p className="text-[11px] text-teal-400 mt-1">Relay state validated</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Firmware Standard</span>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">v2.4.2</p>
          <p className="text-[11px] text-slate-400 mt-1">SL-GOV RTDB Protocol</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Device ID, Meter ID, Customer Name, Connection #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterOnline}
            onChange={(e) => setFilterOnline(e.target.value)}
            className="py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">All Connectivity States</option>
            <option value="ONLINE">ONLINE ({summary.esp32OnlineCount})</option>
            <option value="OFFLINE">OFFLINE ({summary.esp32OfflineCount})</option>
          </select>
        </div>
      </div>

      {/* Device Fleet Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Device Node & Meter ID</th>
                <th className="p-3.5">Customer & District</th>
                <th className="p-3.5 text-center">WiFi Signal (RSSI)</th>
                <th className="p-3.5 text-right">Flow Rate (L/min)</th>
                <th className="p-3.5 text-right">Sensor Pulses</th>
                <th className="p-3.5 text-center">Relay Solenoid</th>
                <th className="p-3.5 text-center">Connectivity</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredDevices.map(({ user, telemetry: t }) => (
                <tr key={t.deviceId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono">
                    <p className="font-bold text-teal-400">{t.deviceId}</p>
                    <p className="text-[11px] text-slate-400">Meter: {user.meterId}</p>
                    <p className="text-[10px] text-slate-500">{t.firmwareVersion}</p>
                  </td>

                  <td className="p-3.5">
                    <p className="font-semibold text-slate-100">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400">{user.district} • Conn: {user.connectionNumber}</p>
                  </td>

                  <td className="p-3.5 text-center font-mono">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800">
                      <Signal className={`w-3.5 h-3.5 ${t.signalStrengthDbm > -70 ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span className="text-slate-200">{t.signalStrengthDbm} dBm</span>
                    </div>
                  </td>

                  <td className="p-3.5 text-right font-mono">
                    <span
                      className={`font-bold text-sm ${
                        user.espStatus === 'OFFLINE'
                          ? 'text-slate-500'
                          : t.flowRateLpm > 25
                          ? 'text-rose-400'
                          : t.flowRateLpm > 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {user.espStatus === 'ONLINE' ? t.flowRateLpm.toFixed(1) : '0.0'}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-mono text-slate-300">
                    {t.pulseCount.toLocaleString()}
                  </td>

                  <td className="p-3.5 text-center">
                    <StatusBadge type="valve" status={t.valveStatus} />
                  </td>

                  <td className="p-3.5 text-center">
                    <StatusBadge type="device" status={user.espStatus} />
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedDeviceBench(t.deviceId)}
                      className="px-2.5 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-700/60 font-semibold text-xs transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Test Bench</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator Modal */}
      {selectedDeviceBench && (
        <HardwareSimulatorModal
          deviceId={selectedDeviceBench}
          isOpen={!!selectedDeviceBench}
          onClose={() => setSelectedDeviceBench(null)}
        />
      )}
    </div>
  );
}
