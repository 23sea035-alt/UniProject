'use client';

import React, { useState } from 'react';
import {
  Cpu,
  X,
  Radio,
  Power,
  Droplets,
  AlertTriangle,
  Flame,
  CheckCircle,
  Code,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface HardwareSimulatorModalProps {
  deviceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareSimulatorModal: React.FC<HardwareSimulatorModalProps> = ({
  deviceId,
  isOpen,
  onClose,
}) => {
  const { telemetry, users, toggleDevicePower, injectLeakage } = useData();

  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'PAYLOAD'>('CONTROLS');

  if (!isOpen) return null;

  const currentTelemetry = telemetry[deviceId] || {
    deviceId,
    meterId: 'SWM-TEST',
    userId: 'USR-TEST',
    flowRateLpm: 0,
    totalVolumeLiters: 0,
    pulseCount: 0,
    signalStrengthDbm: -65,
    batteryLevel: 95,
    mainsPowered: true,
    valveStatus: 'OPEN',
    tamperDetected: false,
    burstAlert: false,
    leakAlert: false,
    reverseFlowAlert: false,
    firmwareVersion: 'v2.4.2-SL-GOV',
    lastPing: new Date().toISOString(),
  };

  const user = users.find((u) => u.esp32DeviceId === deviceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">ESP32 Hardware Test Bench</h3>
              <p className="text-[11px] text-slate-400 font-mono">Device: {deviceId} | Meter: {user?.meterId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-4 text-xs font-medium bg-slate-900/50">
          <button
            onClick={() => setActiveTab('CONTROLS')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'CONTROLS'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Hardware Injections & Sensors
          </button>
          <button
            onClick={() => setActiveTab('PAYLOAD')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'PAYLOAD'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Firebase Telemetry JSON
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'CONTROLS' ? (
            <>
              {/* Quick Status Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Connectivity</span>
                  <p className={`font-bold mt-0.5 ${user?.espStatus === 'ONLINE' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {user?.espStatus}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Relay Solenoid</span>
                  <p className={`font-bold mt-0.5 ${currentTelemetry.valveStatus === 'OPEN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentTelemetry.valveStatus}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Flow Sensor</span>
                  <p className="font-bold text-teal-400 mt-0.5 font-mono">
                    {currentTelemetry.flowRateLpm.toFixed(1)} L/min
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Signal (RSSI)</span>
                  <p className="font-bold text-slate-300 mt-0.5 font-mono">
                    {currentTelemetry.signalStrengthDbm} dBm
                  </p>
                </div>
              </div>

              {/* Injections & Simulation Controls */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Fault Injection Actions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleDevicePower(deviceId)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Toggle WiFi Connection</p>
                      <p className="text-[11px] text-slate-500">Simulate cell/gateway power drop</p>
                    </div>
                    <Power className={`w-5 h-5 ${user?.espStatus === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`} />
                  </button>

                  <button
                    onClick={() => injectLeakage(deviceId)}
                    className={`p-3 rounded-xl border text-left transition-colors flex items-center justify-between ${
                      currentTelemetry.leakAlert
                        ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Inject Nocturnal Leakage</p>
                      <p className="text-[11px] text-slate-500">Continuous 1.2 L/min flow rate</p>
                    </div>
                    <Droplets className={`w-5 h-5 ${currentTelemetry.leakAlert ? 'text-rose-400' : 'text-slate-500'}`} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Real-time JSON payload synchronized with Firebase Firestore & RTDB node <span className="font-mono text-emerald-400">/devices/{deviceId}/telemetry</span>
              </p>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto">
                {JSON.stringify(currentTelemetry, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close Bench
          </button>
        </div>
      </div>
    </div>
  );
};
