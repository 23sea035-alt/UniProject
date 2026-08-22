'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Shield,
  UserCheck,
  Clock,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { OfficerRole } from '../../types';

export const Header: React.FC<{ onMenuToggle: () => void; onNotificationToggle: () => void }> = ({
  onMenuToggle,
  onNotificationToggle,
}) => {
  const router = useRouter();
  const { officer, logout, switchRole, sessionRemainingSeconds } = useAuth();
  const { users, notifications } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof users>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const filtered = users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q.toLowerCase()) ||
        u.nic.toLowerCase().includes(q.toLowerCase()) ||
        u.connectionNumber.toLowerCase().includes(q.toLowerCase()) ||
        u.meterId.toLowerCase().includes(q.toLowerCase()) ||
        u.customerId.toLowerCase().includes(q.toLowerCase())
    );
    setSearchResults(filtered);
    setShowSearchDropdown(true);
  };

  const selectUser = (userId: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    router.push(`/users/${userId}`);
  };

  const roles: { role: OfficerRole; label: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full permissions, tariff edits & officer management' },
    { role: 'SUPERVISOR', label: 'Supervisor', desc: 'Approvals for valve cut-offs & audits' },
    { role: 'OFFICER', label: 'Officer', desc: 'View accounts, manual billing & field ops' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search */}
        <div className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by NIC, Customer Name, Meter ID, Connection #..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
              <div className="p-2 bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                Found {searchResults.length} Match(es)
              </div>
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u.id)}
                  className="w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-800 border-b border-slate-800/50 transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{u.fullName}</p>
                    <p className="text-[11px] text-slate-400">
                      NIC: <span className="font-mono text-emerald-400">{u.nic}</span> | Conn: {u.connectionNumber}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      u.billStatus === 'PAID'
                        ? 'bg-emerald-950 text-emerald-300'
                        : u.billStatus === 'RED_BILL'
                        ? 'bg-red-950 text-red-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {u.billStatus}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Role Switcher, Session Timer, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Demo Badge */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
            title="Switch government role for testing"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-300">{officer?.role || 'OFFICER'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800 mb-1">
                Switch Officer Role (RBAC Simulation)
              </div>
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    switchRole(r.role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                    officer?.role === r.role
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-semibold">{r.label}</span>
                  <span className="text-[10px] text-slate-400">{r.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Session Timer */}
        <div className="hidden md:flex items-center gap-1 text-slate-400 text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{formatTime(sessionRemainingSeconds)}</span>
        </div>

        {/* Notifications Button */}
        <button
          onClick={onNotificationToggle}
          className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="View Notifications"
        >
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          )}
        </button>

        {/* Officer Profile Card */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-white font-bold text-xs">
            {officer?.name.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'GO'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-none">{officer?.name || 'Officer'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{officer?.badgeNumber || 'NWSDB-OFC'}</p>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors ml-1"
            title="Logout Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
