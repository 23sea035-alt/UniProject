'use client';

import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Radio,
  Save,
  CheckCircle2,
  Database,
  Smartphone,
  Flame,
  Download,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function SettingsPage() {
  const { simulationActive, toggleSimulation, users, bills, payments } = useData();

  const [gracePeriodDays, setGracePeriodDays] = useState(14);
  const [smsGateway, setSmsGateway] = useState('DIALOG_AXIATA_GOV_SMS');
  const [smsSenderId, setSmsSenderId] = useState('NWSDB_SL');
  const [firebaseProject, setFirebaseProject] = useState('sl-smart-water-nwsdb');
  const [leakThresholdLpm, setLeakThresholdLpm] = useState(1.2);
  const [burstThresholdLpm, setBurstThresholdLpm] = useState(35.0);
  const [savedFeedback, setSavedFeedback] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedFeedback('System configuration parameters saved and updated across all operational modules!');
    setTimeout(() => setSavedFeedback(''), 5000);
  };

  const handleExportFullStateJson = () => {
    const fullState = {
      exportedAt: new Date().toISOString(),
      system: 'National Water Supply & Drainage Board - Smart Meter Grid',
      usersCount: users.length,
      billsCount: bills.length,
      paymentsCount: payments.length,
      users,
      bills,
      payments,
    };

    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NWSDB_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>National System Configuration & IoT Simulation Settings</span>
          </h1>
          <p className="text-xs text-slate-400">
            Configure Firebase IoT endpoints, Sri Lankan SMS gateways, anomaly threshold triggers, and backup state
          </p>
        </div>

        <button
          onClick={handleExportFullStateJson}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Full JSON Database Backup</span>
        </button>
      </div>

      {savedFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: IoT Simulation & Hardware Engine */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-100">ESP32 IoT Telemetry Simulation Engine</h3>
                <p className="text-xs text-slate-400">Simulate real-time flow rate pulses, sensor heartbeats, and fault states</p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSimulation}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                simulationActive
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {simulationActive ? 'SIMULATION ACTIVE (LIVE JITTER)' : 'SIMULATION PAUSED'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Nocturnal Micro-leak Threshold (L/min)</label>
              <input
                type="number"
                step="0.1"
                value={leakThresholdLpm}
                onChange={(e) => setLeakThresholdLpm(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Flow between 01:00 AM - 04:00 AM triggering warning SMS</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Pipe Burst Emergency Alert Threshold (L/min)</label>
              <input
                type="number"
                step="1.0"
                value={burstThresholdLpm}
                onChange={(e) => setBurstThresholdLpm(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Continuous high-rate flow triggering immediate officer alert</p>
            </div>
          </div>
        </div>

        {/* Section 2: Policy & Automated Enforcement */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100">National Red-Bill & Grace Period Policy</h3>
              <p className="text-xs text-slate-400">Rules governing automated solenoid valve shut-offs for unpaid utility bills</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Default Grace Period (Days Post-Due Date)</label>
              <input
                type="number"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Accounts remain active with warning notifications during grace days before automated disconnection.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-slate-200 block">Automatic Reopening Rule:</span>
              <p className="leading-relaxed">
                When a payment is verified by LankaPay/GovPay and the outstanding balance reaches 0.00 LKR, the backend automatically issues an <span className="font-mono text-emerald-400">OPEN_VALVE</span> command to the ESP32 smart meter.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: SMS Gateway Provider Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100">Sri Lankan Telco SMS Gateway Integration</h3>
              <p className="text-xs text-slate-400">Configure provider endpoints for Dialog Axiata, Mobitel, or SLT</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Primary SMS Provider</label>
              <select
                value={smsGateway}
                onChange={(e) => setSmsGateway(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
              >
                <option value="DIALOG_AXIATA_GOV_SMS">Dialog Axiata Government SMS API</option>
                <option value="MOBITEL_ENTERPRISE">Mobitel Enterprise SMS Gateway</option>
                <option value="SLT_REST_GATEWAY">Sri Lanka Telecom (SLT) REST Gateway</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Official Sender ID / Mask</label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
