'use client';

import React from 'react';
import {
  Activity,
  CreditCard,
  Lock,
  Unlock,
  WifiOff,
  BellRing,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useData } from '../../context/DataContext';

export const LiveActivityFeed: React.FC = () => {
  const { auditLogs } = useData();

  const getActionIcon = (action: string) => {
    if (action.includes('VALVE_CLOSE') || action.includes('CUTOFF'))
      return <Lock className="w-3.5 h-3.5 text-rose-400" />;
    if (action.includes('VALVE_OPEN') || action.includes('REOPEN'))
      return <Unlock className="w-3.5 h-3.5 text-emerald-400" />;
    if (action.includes('PAYMENT'))
      return <CreditCard className="w-3.5 h-3.5 text-blue-400" />;
    if (action.includes('USER') || action.includes('REGISTER'))
      return <UserPlus className="w-3.5 h-3.5 text-teal-400" />;
    if (action.includes('NOTIFICATION'))
      return <BellRing className="w-3.5 h-3.5 text-amber-400" />;
    return <Activity className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-100">Live National Activity Stream</h3>
        </div>
        <Link
          href="/audit-logs"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
        >
          View Full Audit <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {auditLogs.slice(0, 6).map((log) => (
          <div
            key={log.id}
            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition-colors"
          >
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
              {getActionIcon(log.action)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-200 truncate">{log.action.replace(/_/g, ' ')}</p>
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{log.details || log.targetEntity}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                <span>By: {log.officerName}</span>
                <span>•</span>
                <span className="text-emerald-500 font-medium">{log.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
