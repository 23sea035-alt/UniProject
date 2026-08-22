'use client';

import React from 'react';
import { Activity, Droplet, Radio } from 'lucide-react';

interface FlowGaugeProps {
  flowRateLpm: number;
  maxFlowLpm?: number;
  totalVolumeLiters: number;
  pulseCount: number;
  isOnline: boolean;
}

export const FlowGauge: React.FC<FlowGaugeProps> = ({
  flowRateLpm,
  maxFlowLpm = 30,
  totalVolumeLiters,
  pulseCount,
  isOnline,
}) => {
  const percentage = Math.min(100, Math.round((flowRateLpm / maxFlowLpm) * 100));

  const getFlowColor = () => {
    if (!isOnline) return 'text-slate-500';
    if (flowRateLpm > 25) return 'text-rose-400';
    if (flowRateLpm > 15) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-3">
      <div className="flex items-center justify-between w-full text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          Real-time Flow Rate
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px]">
          <Radio className={`w-3 h-3 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          {isOnline ? 'PULSING' : 'IDLE'}
        </span>
      </div>

      {/* Circular Flow Rate Visual */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            className="text-slate-800"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            className={flowRateLpm > 25 ? 'text-rose-500' : 'text-emerald-500'}
            strokeWidth="8"
            strokeDasharray={264}
            strokeDashoffset={264 - (percentage / 100) * 264}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className={`text-2xl font-black tracking-tight ${getFlowColor()}`}>
            {isOnline ? flowRateLpm.toFixed(1) : '0.0'}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400">Liters / Min</span>
        </div>
      </div>

      {/* Meter Counters */}
      <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-slate-800/80 text-left text-xs">
        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
          <p className="text-[10px] uppercase text-slate-500 font-semibold">Total Volume</p>
          <p className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
            {totalVolumeLiters.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span>
          </p>
        </div>
        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
          <p className="text-[10px] uppercase text-slate-500 font-semibold">Sensor Pulses</p>
          <p className="text-sm font-bold text-slate-100 mt-0.5 font-mono">
            {pulseCount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
