'use client';

import React from 'react';
import { AlertOctagon, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useData } from '../../context/DataContext';

export const LeakageAlertBanner: React.FC = () => {
  const { telemetry, users } = useData();

  const leakingDevices = Object.values(telemetry).filter((t) => t.leakAlert || t.burstAlert);

  if (leakingDevices.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-slate-900 border border-rose-800/80 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-200">
              Active Water Leakage & Pipe Burst Alerts ({leakingDevices.length} Detected)
            </h4>
            <p className="text-xs text-rose-300/80">
              Algorithmic continuous-flow & nocturnal micro-leak patterns flagged by smart meter sensors
            </p>
          </div>
        </div>

        <Link
          href="/monitoring"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 transition-colors"
        >
          <span>Investigate Grid</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {leakingDevices.map((dev) => {
          const user = users.find((u) => u.esp32DeviceId === dev.deviceId);
          return (
            <div
              key={dev.deviceId}
              className="p-2.5 rounded-xl bg-slate-950/90 border border-rose-900/60 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-semibold text-slate-100">{user?.fullName || dev.deviceId}</p>
                <p className="text-[11px] text-slate-400">
                  {user?.district} • Conn: {user?.connectionNumber}
                </p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono font-bold text-[11px] border border-rose-800">
                  {dev.flowRateLpm.toFixed(1)} L/min
                </span>
                <p className="text-[10px] text-rose-400 mt-0.5">
                  {dev.burstAlert ? 'HIGH BURST' : 'NOCTURNAL LEAK'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
