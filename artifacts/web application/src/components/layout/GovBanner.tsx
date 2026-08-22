'use client';

import React from 'react';
import { ShieldCheck, Radio } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const GovBanner: React.FC = () => {
  const { simulationActive, toggleSimulation } = useData();

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 select-none">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="font-semibold text-emerald-400">DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA</span>
        <span className="text-slate-500">|</span>
        <span className="hidden sm:inline text-slate-400">National Water Supply & Drainage Board (NWSDB)</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-medium text-amber-300">RESTRICTED - OFFICIAL USE ONLY</span>
        </div>

        <button
          onClick={toggleSimulation}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
            simulationActive
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
          title="Toggle real-time IoT pulse & telemetry simulation"
        >
          <Radio className={`w-3 h-3 ${simulationActive ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />
          <span>IoT Telemetry: {simulationActive ? 'LIVE SIMULATION' : 'STATIC'}</span>
        </button>
      </div>
    </div>
  );
};
