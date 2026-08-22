'use client';

import React, { useState } from 'react';
import { AlertTriangle, Lock, X, CheckCircle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  requireReason?: boolean;
  isLoading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm Operation',
  cancelText = 'Cancel',
  isDangerous = false,
  requireReason = true,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Please provide an official reason for the audit log.');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div
          className={`p-4 flex items-center justify-between border-b ${
            isDangerous
              ? 'bg-rose-950/40 border-rose-900/50 text-rose-200'
              : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isDangerous ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <Lock className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="font-bold text-sm tracking-wide">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">{description}</p>

          {isDangerous && (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-[11px] text-rose-300">
              <span className="font-bold">GOVERNMENT REGULATORY NOTICE:</span> This action directly impacts customer water supply and will be permanently recorded in the National Water Utility Audit Trail.
            </div>
          )}

          {requireReason && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Official Justification / Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="E.g., Non-payment exceeding 14-day grace period, scheduled pipe maintenance..."
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {error && <p className="text-[11px] text-rose-400">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
