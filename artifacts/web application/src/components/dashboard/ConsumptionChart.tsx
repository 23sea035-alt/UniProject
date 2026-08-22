'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Droplets, Calendar } from 'lucide-react';

const HOURLY_DATA = [
  { time: '00:00', liters: 450, normal: 500 },
  { time: '02:00', liters: 280, normal: 300 },
  { time: '04:00', liters: 320, normal: 350 },
  { time: '06:00', liters: 1850, normal: 1700 },
  { time: '08:00', liters: 3420, normal: 3200 },
  { time: '10:00', liters: 2150, normal: 2000 },
  { time: '12:00', liters: 2400, normal: 2300 },
  { time: '14:00', liters: 1980, normal: 1900 },
  { time: '16:00', liters: 2200, normal: 2100 },
  { time: '18:00', liters: 3650, normal: 3400 },
  { time: '20:00', liters: 2900, normal: 2800 },
  { time: '22:00', liters: 1100, normal: 1000 },
];

const MONTHLY_DATA = [
  { month: 'Jan', consumptionM3: 420, targetM3: 400 },
  { month: 'Feb', consumptionM3: 390, targetM3: 400 },
  { month: 'Mar', consumptionM3: 480, targetM3: 450 },
  { month: 'Apr', consumptionM3: 510, targetM3: 470 },
  { month: 'May', consumptionM3: 460, targetM3: 450 },
  { month: 'Jun', consumptionM3: 440, targetM3: 430 },
  { month: 'Jul', consumptionM3: 475, targetM3: 450 },
  { month: 'Aug (Est)', consumptionM3: 490, targetM3: 460 },
];

export const ConsumptionChart: React.FC = () => {
  const [viewMode, setViewMode] = useState<'HOURLY' | 'MONTHLY'>('HOURLY');

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">National Water Consumption Analytics</h3>
            <p className="text-xs text-slate-400">Telemetry aggregated across all connected ESP32 smart meters</p>
          </div>
        </div>

        {/* Toggle View */}
        <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('HOURLY')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'HOURLY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Today (Hourly Liters)
          </button>
          <button
            onClick={() => setViewMode('MONTHLY')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'MONTHLY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly Trend (m³)
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'HOURLY' ? (
            <AreaChart data={HOURLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
                dataKey="liters"
                name="Actual Liters"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorLiters)"
              />
            </AreaChart>
          ) : (
            <BarChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="consumptionM3" name="Consumption (m³)" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
