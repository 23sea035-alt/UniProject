'use client';

import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertOctagon,
  PowerOff,
  Radio,
  WifiOff,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { BillStatusType, ValveStatusType, DeviceOnlineStatus, ConnectionStatusType } from '../../types';

interface StatusBadgeProps {
  type: 'bill' | 'valve' | 'device' | 'connection' | 'command';
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, size = 'sm' }) => {
  const sizeClasses = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  // Bill Statuses
  if (type === 'bill') {
    switch (status as BillStatusType) {
      case 'PAID':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 ${sizeClasses}`}>
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            PAID
          </span>
        );
      case 'PENDING':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/60 ${sizeClasses}`}>
            <Clock className="w-3 h-3 text-blue-400" />
            PENDING
          </span>
        );
      case 'OVERDUE':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 ${sizeClasses}`}>
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            OVERDUE
          </span>
        );
      case 'RED_BILL':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-red-950 text-red-200 border border-red-700 animate-pulse ${sizeClasses}`}>
            <AlertOctagon className="w-3 h-3 text-red-400" />
            RED BILL
          </span>
        );
      case 'DISCONNECTED':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
            <PowerOff className="w-3 h-3 text-slate-400" />
            DISCONNECTED
          </span>
        );
    }
  }

  // Valve Status
  if (type === 'valve') {
    if (status === 'OPEN') {
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 ${sizeClasses}`}>
          <Unlock className="w-3 h-3 text-emerald-400" />
          VALVE OPEN
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-rose-950 text-rose-300 border border-rose-700 ${sizeClasses}`}>
        <Lock className="w-3 h-3 text-rose-400" />
        VALVE CLOSED
      </span>
    );
  }

  // Device Online Status
  if (type === 'device') {
    if (status === 'ONLINE') {
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-teal-950 text-teal-300 border border-teal-700/60 ${sizeClasses}`}>
          <Radio className="w-3 h-3 text-teal-400 animate-pulse" />
          ONLINE
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
        <WifiOff className="w-3 h-3 text-slate-400" />
        OFFLINE
      </span>
    );
  }

  // Default fallback
  return (
    <span className={`inline-flex items-center gap-1 rounded bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
      {status}
    </span>
  );
};
