'use client';

import React, { useState } from 'react';
import {
  Activity,
  Droplets,
  AlertOctagon,
  AlertTriangle,
  Radio,
  Search,
  Cpu,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { FlowGauge } from '../../components/monitoring/FlowGauge';
import { LeakageAlertBanner } from '../../components/monitoring/LeakageAlertBanner';
import { HardwareSimulatorModal } from '../../components/devices/HardwareSimulatorModal';

const LIVE_FLOW_TELEMETRY_SERIES = [
  { time: '10:00:00', totalFlowLpm: 42.5, normalFlow: 45.0 },
  { time: '10:00:10', totalFlowLpm: 48.2, normalFlow: 45.0 },
  { time: '10:00:20', totalFlowLpm: 46.8, normalFlow: 45.0 },
  { time: '10:00:30', totalFlowLpm: 58.4, normalFlow: 45.0 },
  { time: '10:00:40', totalFlowLpm: 65.1, normalFlow: 45.0 },
  { time: '10:00:50', totalFlowLpm: 52.0, normalFlow: 45.0 },
  { time: '10:01:00', totalFlowLpm: 49.3, normalFlow: 45.0 },
];

export default function MonitoringPage() {
  const { users, telemetry, summary, injectLeakage } = useData();

  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedDeviceModal, setSelectedDeviceModal] = useState<string | null>(null);

  const activeTelemetryList = users.map((u) => {
    const t = telemetry[u.esp32DeviceId] || {
      deviceId: u.esp32DeviceId,
      meterId: u.meterId,
      userId: u.id,
      flowRateLpm: u.valveStatus === 'OPEN' ? 4.5 : 0.0,
      totalVolumeLiters: u.currentConsumptionLiters,
      pulseCount: u.currentConsumptionLiters * 7.5,
      signalStrengthDbm: -65,
      batteryLevel: 95,
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

  const filteredMeters = activeTelemetryList.filter((item) => {
    return selectedDistrict === 'ALL' || item.user.district === selectedDistrict;
  });

  const totalGridFlowRate = activeTelemetryList.reduce(
    (acc, curr) => acc + (curr.user.valveStatus === 'OPEN' && curr.user.espStatus === 'ONLINE' ? curr.telemetry.flowRateLpm : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Real-Time Water Telemetry & Grid Anomaly Monitor</span>
          </h1>
          <p className="text-xs text-slate-400">
            Continuous pulse counter analysis, pipe burst detection, and nocturnal micro-leak surveillance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">Total Grid Flow:</span>
            <span className="font-mono font-bold text-emerald-400">{totalGridFlowRate.toFixed(1)} L/min</span>
          </div>
        </div>
      </div>

      {/* Active Leakage Warning Banner */}
      <LeakageAlertBanner />

      {/* High-Level Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Aggregated Flow Rate</span>
            <Droplets className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {totalGridFlowRate.toFixed(1)} <span className="text-xs font-normal text-slate-400">L/min</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across all {summary.openValvesCount} open connections</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Total Consumption</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-teal-400 mt-1 font-mono">
            {summary.todayWaterConsumptionLiters.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">~{(summary.todayWaterConsumptionLiters / 1000).toFixed(1)} m³ volumetric</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Flagged Anomalies</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">
            {summary.abnormalLeakageCount}
          </p>
          <p className="text-[11px] text-rose-400/80 mt-1">Nocturnal flow & burst alerts</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ESP32 Fleet Health</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">
            {summary.esp32OnlineCount} / {summary.totalRegisteredUsers}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">
            {Math.round((summary.esp32OnlineCount / summary.totalRegisteredUsers) * 100)}% Online Connectivity
          </p>
        </div>
      </div>

      {/* Real-Time Live Wave Graph */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm text-slate-100">Live Grid Flow Rate Telemetry Stream</h3>
              <p className="text-xs text-slate-400">Aggregated pulses received every 10 seconds via Firebase</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            10s REFRESH INTERVAL
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={LIVE_FLOW_TELEMETRY_SERIES} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="liveFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
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
                dataKey="totalFlowLpm"
                name="Total Flow (L/min)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#liveFlow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Meter Fleet Telemetry List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-100">Live Meter Telemetry Directory</h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="py-1.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Districts</option>
              <option value="Colombo">Colombo</option>
              <option value="Kandy">Kandy</option>
              <option value="Galle">Galle</option>
              <option value="Jaffna">Jaffna</option>
              <option value="Gampaha">Gampaha</option>
              <option value="Kurunegala">Kurunegala</option>
              <option value="Batticaloa">Batticaloa</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Customer & Location</th>
                <th className="p-3">Meter & Device ID</th>
                <th className="p-3 text-right">Current Flow Rate</th>
                <th className="p-3 text-right">Total Cumulative (L)</th>
                <th className="p-3 text-center">Signal & Battery</th>
                <th className="p-3 text-center">Anomaly Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredMeters.map(({ user, telemetry: t }) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <p className="font-semibold text-slate-200">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400">{user.district} • Conn: {user.connectionNumber}</p>
                  </td>

                  <td className="p-3 font-mono text-[11px]">
                    <p className="text-slate-200">{user.meterId}</p>
                    <p className="text-slate-500">{user.esp32DeviceId}</p>
                  </td>

                  <td className="p-3 text-right font-mono">
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
                    <span className="text-[10px] text-slate-500 block">L/min</span>
                  </td>

                  <td className="p-3 text-right font-mono">
                    <span className="font-bold text-slate-100">
                      {t.totalVolumeLiters.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {(t.totalVolumeLiters / 1000).toFixed(1)} m³
                    </span>
                  </td>

                  <td className="p-3 text-center text-[11px] font-mono">
                    <p className="text-slate-300">{t.signalStrengthDbm} dBm</p>
                    <p className="text-emerald-400">{t.batteryLevel}%</p>
                  </td>

                  <td className="p-3 text-center">
                    {t.burstAlert ? (
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold text-[10px] border border-rose-800 animate-pulse">
                        PIPE BURST
                      </span>
                    ) : t.leakAlert ? (
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold text-[10px] border border-amber-800 animate-pulse">
                        NOCTURNAL LEAK
                      </span>
                    ) : user.espStatus === 'OFFLINE' ? (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                        DEVICE OFFLINE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold text-[10px]">
                        NORMAL FLOW
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedDeviceModal(user.esp32DeviceId)}
                        className="px-2 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-700/60 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Cpu className="w-3.5 h-3.5" /> Bench
                      </button>
                      <Link
                        href={`/users/${user.id}`}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardware Simulator Drawer */}
      {selectedDeviceModal && (
        <HardwareSimulatorModal
          deviceId={selectedDeviceModal}
          isOpen={!!selectedDeviceModal}
          onClose={() => setSelectedDeviceModal(null)}
        />
      )}
    </div>
  );
}
