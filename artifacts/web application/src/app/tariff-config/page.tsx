'use client';

import React, { useState } from 'react';
import { Sliders, ShieldCheck, FileText, Info } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { TariffSlabEditor } from '../../components/billing/TariffSlabEditor';
import { TariffConfig } from '../../types';

export default function TariffConfigPage() {
  const { tariffs, updateTariff } = useData();
  const [selectedTariffId, setSelectedTariffId] = useState(tariffs[0]?.id || 'tariff-domestic-std');

  const currentTariff = tariffs.find((t) => t.id === selectedTariffId) || tariffs[0];

  const handleSaveTariff = (updated: TariffConfig) => {
    updateTariff(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Sri Lankan National Water Tariff Policy Configuration</span>
          </h1>
          <p className="text-xs text-slate-400">
            Gazetted volumetric tiered slab tariffs, fixed monthly operational charges, taxes, and grace period settings
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Restricted to Authorized Government Officers</span>
        </div>
      </div>

      {/* Regulatory Info Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-slate-100">National Water Utility Tariff Formula Guidelines</p>
          <p className="text-slate-400 leading-relaxed">
            Rates are configurable per cubic meter (m³) by volumetric consumption tiers. The system automatically computes progressive slab billing, applies fixed service charges, adds statutory Social Security Contribution Levy (SSCL), and enforces the configured grace period before triggering automated Red-Bill valve shut-offs.
          </p>
        </div>
      </div>

      {/* Tariff Category Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tariffs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTariffId(t.id)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedTariffId === t.id
                ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 shadow-lg shadow-emerald-950/30'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <p className="text-xs font-bold text-slate-100">{t.name}</p>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{t.description}</p>
            <div className="mt-3 flex items-center justify-between text-[10px] font-mono border-t border-slate-800/80 pt-2 text-slate-500">
              <span>Grace: {t.gracePeriodDays} days</span>
              <span className="text-emerald-400 font-bold">LKR {t.fixedCharge} Fixed</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Tariff Configuration Editor */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-6">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100">{currentTariff.name} Configuration</h3>
            <p className="text-xs text-slate-400">Effective Date: {currentTariff.effectiveDate}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">
            {currentTariff.category}
          </span>
        </div>

        <TariffSlabEditor
          key={currentTariff.id}
          tariff={currentTariff}
          onSave={handleSaveTariff}
        />
      </div>
    </div>
  );
}
