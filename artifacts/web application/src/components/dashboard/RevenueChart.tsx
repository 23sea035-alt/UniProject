'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Banknote, TrendingUp } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const RevenueChart: React.FC = () => {
  const { users, bills, payments } = useData();

  const paidCount = users.filter((u) => u.billStatus === 'PAID').length;
  const pendingCount = users.filter((u) => u.billStatus === 'PENDING').length;
  const overdueCount = users.filter((u) => u.billStatus === 'OVERDUE').length;
  const redBillCount = users.filter((u) => u.billStatus === 'RED_BILL').length;

  const pieData = [
    { name: 'Paid Bills', value: paidCount || 1, color: '#10b981' },
    { name: 'Pending Bills', value: pendingCount || 1, color: '#3b82f6' },
    { name: 'Overdue (Grace)', value: overdueCount || 1, color: '#f59e0b' },
    { name: 'Red Bills (Cutoff)', value: redBillCount || 1, color: '#e11d48' },
  ];

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalArrears = bills.reduce((acc, b) => acc + b.outstandingBalance, 0);

  const revenueComparison = [
    { category: 'Collected (LKR)', amount: Math.round(totalCollected) },
    { category: 'Arrears (LKR)', amount: Math.round(totalArrears) },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Revenue & Bill Status Breakdown</h3>
            <p className="text-xs text-slate-400">Paid settlement vs unpaid arrears distribution</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Pie Chart: Bill Status Proportion */}
        <div className="h-56 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-slate-400 mb-2">Bill Distribution Ratio</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 text-[11px] mt-1 text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Paid ({paidCount})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Pending ({pendingCount})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Overdue ({overdueCount})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Red Bill ({redBillCount})</span>
          </div>
        </div>

        {/* Bar Chart: Revenue Comparison */}
        <div className="h-56 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-slate-400 mb-2">Collected vs Outstanding (LKR)</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueComparison} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="category" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
