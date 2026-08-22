'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Shield,
  CheckCircle2,
  Lock,
  Search,
  Check,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import { MOCK_OFFICERS } from '../../lib/mockData';
import { GovernmentOfficer, OfficerRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function OfficersPage() {
  const { officer: currentOfficer } = useAuth();
  const [officers, setOfficers] = useState<GovernmentOfficer[]>(MOCK_OFFICERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [department, setDepartment] = useState('Operations Directorate');
  const [role, setRole] = useState<OfficerRole>('OFFICER');
  const [phone, setPhone] = useState('+94 77 ');
  const [feedback, setFeedback] = useState('');

  const handleAddOfficer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !badgeNumber) return;

    const newOfficer: GovernmentOfficer = {
      id: `OFFICER-00${officers.length + 1}`,
      name,
      email,
      badgeNumber,
      department,
      role,
      phone,
      active: true,
      lastLogin: new Date().toISOString(),
    };

    setOfficers([...officers, newOfficer]);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setBadgeNumber('');
    setFeedback(`Successfully registered authorized officer: ${name} (${role})`);
    setTimeout(() => setFeedback(''), 5000);
  };

  const permissionsMatrix = [
    { feature: 'View All Users & Telemetry', admin: true, supervisor: true, officer: true },
    { feature: 'Remote Valve Actuation (Single Account)', admin: true, supervisor: true, officer: true },
    { feature: 'Batch Red-Bill Island-Wide Sweep', admin: true, supervisor: true, officer: false },
    { feature: 'Update Volumetric Tariff Slabs', admin: true, supervisor: false, officer: false },
    { feature: 'Manage Government Officers & RBAC', admin: true, supervisor: false, officer: false },
    { feature: 'Export Classified Water Audits & PDF', admin: true, supervisor: true, officer: true },
    { feature: 'Review Immutable Audit Logs', admin: true, supervisor: true, officer: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>Government Officers Directory & RBAC Security Matrix</span>
          </h1>
          <p className="text-xs text-slate-400">
            Role-based authorization for utility operations, sensitive valve control, and audit compliance
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register New Officer</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Officer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {officers.map((off) => (
          <div
            key={off.id}
            className={`p-4 rounded-2xl border transition-all ${
              currentOfficer?.id === off.id
                ? 'bg-emerald-950/40 border-emerald-600/80 shadow-lg'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-white font-bold text-xs">
                {off.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  off.role === 'SUPER_ADMIN'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : off.role === 'SUPERVISOR'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {off.role.replace('_', ' ')}
              </span>
            </div>

            <p className="font-bold text-slate-100 text-xs mt-3">{off.name}</p>
            <p className="text-[11px] text-emerald-400 font-mono mt-0.5">{off.badgeNumber}</p>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{off.department}</p>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {off.email}</p>
              <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {off.phone}</p>
            </div>
          </div>
        ))}
      </div>

      {/* RBAC Permissions Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-100">National Role-Based Access Control (RBAC) Permissions Matrix</h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Security Feature & Capability</th>
                <th className="p-3.5 text-center">Super Admin</th>
                <th className="p-3.5 text-center">Supervisor</th>
                <th className="p-3.5 text-center">Field Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50">
                  <td className="p-3.5 font-medium text-slate-200">{item.feature}</td>
                  <td className="p-3.5 text-center">
                    {item.admin ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {item.supervisor ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {item.officer ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Officer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Register Authorized Government Officer</span>
            </h3>

            <form onSubmit={handleAddOfficer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Eng. D. M. Perera"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Government Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="perera.dm@waterboard.gov.lk"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Officer Badge #</label>
                  <input
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="NWSDB-OFC-8821"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as OfficerRole)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                  >
                    <option value="OFFICER">Field Officer</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Directorate / Regional Division</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40"
                >
                  Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
