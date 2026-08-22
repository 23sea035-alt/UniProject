'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  colorTheme?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorTheme = 'emerald',
  onClick,
}) => {
  const themeStyles = {
    emerald: {
      bg: 'bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-900/50',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      valueColor: 'text-emerald-400',
    },
    blue: {
      bg: 'bg-blue-950/20 hover:bg-blue-950/30 border-blue-900/50',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      valueColor: 'text-blue-400',
    },
    amber: {
      bg: 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-900/50',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      valueColor: 'text-amber-400',
    },
    red: {
      bg: 'bg-red-950/20 hover:bg-red-950/30 border-red-900/50',
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
      valueColor: 'text-red-400',
    },
    purple: {
      bg: 'bg-purple-950/20 hover:bg-purple-950/30 border-purple-900/50',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      valueColor: 'text-purple-400',
    },
    slate: {
      bg: 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800',
      iconBg: 'bg-slate-800 text-slate-400 border-slate-700',
      valueColor: 'text-slate-200',
    },
  }[colorTheme];

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
        themeStyles.bg
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</p>
          <p className={`text-2xl font-bold mt-1 tracking-tight ${themeStyles.valueColor}`}>{value}</p>
        </div>

        <div className={`p-2.5 rounded-lg border ${themeStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-800/80 pt-2 text-slate-400">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`flex items-center gap-1 font-medium ${
                trend.isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
