'use client';

import React, { useState } from 'react';
import { TariffConfig, TariffSlab } from '../../types';
import { calculateWaterBill } from '../../lib/tariffEngine';
import { Plus, Trash2, Save, Calculator, CheckCircle2 } from 'lucide-react';

interface TariffSlabEditorProps {
  tariff: TariffConfig;
  onSave: (updatedTariff: TariffConfig) => void;
}

export const TariffSlabEditor: React.FC<TariffSlabEditorProps> = ({ tariff, onSave }) => {
  const [formData, setFormData] = useState<TariffConfig>({ ...tariff });
  const [testConsumptionLiters, setTestConsumptionLiters] = useState<number>(18000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSlabChange = (index: number, field: keyof TariffSlab, value: any) => {
    const updatedSlabs = [...formData.slabs];
    updatedSlabs[index] = {
      ...updatedSlabs[index],
      [field]: field === 'maxM3' && value === '' ? null : Number(value),
    };
    setFormData({ ...formData, slabs: updatedSlabs });
  };

  const addSlab = () => {
    const lastSlab = formData.slabs[formData.slabs.length - 1];
    const newMin = lastSlab ? (lastSlab.maxM3 ? lastSlab.maxM3 + 1 : lastSlab.minM3 + 10) : 0;
    const newSlab: TariffSlab = {
      minM3: newMin,
      maxM3: newMin + 5,
      ratePerM3: lastSlab ? lastSlab.ratePerM3 + 40 : 100,
    };
    setFormData({ ...formData, slabs: [...formData.slabs, newSlab] });
  };

  const removeSlab = (index: number) => {
    if (formData.slabs.length <= 1) return;
    const updatedSlabs = formData.slabs.filter((_, i) => i !== index);
    setFormData({ ...formData, slabs: updatedSlabs });
  };

  const handleSave = () => {
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const previewCalc = calculateWaterBill(testConsumptionLiters, formData);

  return (
    <div className="space-y-6">
      {/* Configuration Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Fixed Monthly Charge (LKR)</label>
          <input
            type="number"
            value={formData.fixedCharge}
            onChange={(e) => setFormData({ ...formData, fixedCharge: Number(e.target.value) })}
            className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Grace Period (Days)</label>
          <input
            type="number"
            value={formData.gracePeriodDays}
            onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
            className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500"
          />
          <p className="text-[10px] text-slate-500 mt-1">Days post-due date before Red-Bill valve cut-off</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">SSCL Levy (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.ssclPercentage}
            onChange={(e) => setFormData({ ...formData, ssclPercentage: Number(e.target.value) })}
            className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Volumetric Slabs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Volumetric Consumption Slabs
            </h4>
            <p className="text-[11px] text-slate-400">Define tiered rates in Sri Lankan Rupees per cubic meter (m³)</p>
          </div>
          <button
            onClick={addSlab}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Slab Tier
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Tier #</th>
                <th className="p-3">Min Volume (m³)</th>
                <th className="p-3">Max Volume (m³)</th>
                <th className="p-3">Unit Rate (LKR / m³)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {formData.slabs.map((slab, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-mono text-slate-400">Tier {idx + 1}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={slab.minM3}
                      onChange={(e) => handleSlabChange(idx, 'minM3', e.target.value)}
                      className="w-24 p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      placeholder="Infinity"
                      value={slab.maxM3 ?? ''}
                      onChange={(e) => handleSlabChange(idx, 'maxM3', e.target.value)}
                      className="w-24 p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-mono">LKR</span>
                      <input
                        type="number"
                        step="0.5"
                        value={slab.ratePerM3}
                        onChange={(e) => handleSlabChange(idx, 'ratePerM3', e.target.value)}
                        className="w-28 p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono font-bold text-xs"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => removeSlab(idx)}
                      disabled={formData.slabs.length <= 1}
                      className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Interactive Tariff Preview Calculator */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <h5 className="text-xs font-bold text-slate-200">Interactive Tariff Verification Sandbox</h5>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Simulated Monthly Usage: <strong className="text-slate-200">{previewCalc.consumptionM3} m³ ({testConsumptionLiters.toLocaleString()} Liters)</strong></span>
            <span className="font-mono text-emerald-400 font-bold">Total Bill: LKR {previewCalc.totalAmount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="0"
            max="60000"
            step="500"
            value={testConsumptionLiters}
            onChange={(e) => setTestConsumptionLiters(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 pt-1">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Water Charge: LKR {previewCalc.consumptionCharge.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Fixed Service: LKR {previewCalc.fixedCharge}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Taxes & SSCL: LKR {previewCalc.taxesAmount}
          </span>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {savedSuccess ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Tariff configuration updated & audit logged!
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">Changes will be logged in the Government Audit Log</span>
        )}

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
        >
          <Save className="w-4 h-4" />
          Save & Publish Tariff
        </button>
      </div>
    </div>
  );
};
