'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Activity,
  Receipt,
  Sliders,
  Power,
  CreditCard,
  Cpu,
  BellRing,
  FileSpreadsheet,
  ShieldAlert,
  History,
  Settings,
  Droplets,
  AlertTriangle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { summary } = useData();

  const navItems = [
    {
      label: 'Main Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'User Management',
      href: '/users',
      icon: Users,
      badge: summary.totalRegisteredUsers,
    },
    {
      label: 'Water Monitoring',
      href: '/monitoring',
      icon: Activity,
      alertBadge: summary.abnormalLeakageCount > 0 ? `${summary.abnormalLeakageCount} Leak` : undefined,
    },
    {
      label: 'Billing & Invoices',
      href: '/billing',
      icon: Receipt,
      redBadge: summary.redBillUsersCount > 0 ? `${summary.redBillUsersCount} Red` : undefined,
    },
    {
      label: 'Tariff Configuration',
      href: '/tariff-config',
      icon: Sliders,
    },
    {
      label: 'Valve Control Hub',
      href: '/valve-control',
      icon: Power,
      closedBadge: summary.closedValvesCount > 0 ? `${summary.closedValvesCount} Cut` : undefined,
    },
    {
      label: 'Payments Reconciliation',
      href: '/payments',
      icon: CreditCard,
    },
    {
      label: 'ESP32 Device Fleet',
      href: '/devices',
      icon: Cpu,
      offlineBadge: summary.esp32OfflineCount > 0 ? `${summary.esp32OfflineCount} Off` : undefined,
    },
    {
      label: 'Notification Center',
      href: '/notifications',
      icon: BellRing,
    },
    {
      label: 'Government Reports',
      href: '/reports',
      icon: FileSpreadsheet,
    },
    {
      label: 'Officers & RBAC',
      href: '/officers',
      icon: ShieldAlert,
    },
    {
      label: 'Audit Trail Logs',
      href: '/audit-logs',
      icon: History,
    },
    {
      label: 'System Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wide text-sm">NWSDB SRI LANKA</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">Smart Water Meter Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Government Operations
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.alertBadge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                      {item.alertBadge}
                    </span>
                  )}
                  {item.redBadge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-950 text-red-300 border border-red-800 animate-pulse">
                      {item.redBadge}
                    </span>
                  )}
                  {item.closedBadge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {item.closedBadge}
                    </span>
                  )}
                  {item.offlineBadge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.offlineBadge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Security & System Info Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Grid Protocol:</span>
            <span className="font-mono text-emerald-400">ESP-IoT v2.4</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Enforcement Mode:</span>
            <span className="text-amber-400 font-medium">Automatic (14d)</span>
          </div>
        </div>
      </aside>
    </>
  );
};
