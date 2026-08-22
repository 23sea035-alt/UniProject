'use client';

import React from 'react';
import { Bill } from '../../types';
import { X, Printer, Download, Droplets, CheckCircle, AlertTriangle } from 'lucide-react';
import { generateOfficialGovPdfReport } from '../../lib/exportUtils';

interface InvoiceModalProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ bill, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    const headers = ['Consumption Slab', 'Volume (m³)', 'Unit Rate (LKR)', 'Subtotal (LKR)'];
    const rows = bill.slabBreakdown.map((s) => [
      s.slab,
      s.volumeM3.toFixed(2),
      s.unitRate.toFixed(2),
      s.amount.toFixed(2),
    ]);

    rows.push(['Fixed Service Charge', '-', '-', bill.fixedCharge.toFixed(2)]);
    rows.push(['Taxes & SSCL Levy', '-', '-', bill.taxesAmount.toFixed(2)]);
    rows.push(['Total Net Payable', '-', '-', bill.totalAmount.toFixed(2)]);

    generateOfficialGovPdfReport(
      `Water Bill #${bill.billNumber}`,
      `Customer: ${bill.customerName} | Conn: ${bill.connectionNumber}`,
      headers,
      rows,
      `NWSDB_Bill_${bill.billNumber}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header Controls */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">National Water Utility Bill Statement</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Bill Paper */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-100 font-sans space-y-6">
          {/* Official Letterhead */}
          <div className="border-b-2 border-emerald-600 pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-wide text-white">NATIONAL WATER SUPPLY & DRAINAGE BOARD</h2>
                <p className="text-[11px] text-emerald-400">Government of the Democratic Socialist Republic of Sri Lanka</p>
                <p className="text-[10px] text-slate-400">Head Office: Galle Road, Ratmalana | Hotline: 1939</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Bill Number</span>
              <p className="font-mono text-sm font-bold text-emerald-400">{bill.billNumber}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Period: {bill.billingPeriod}</p>
            </div>
          </div>

          {/* Customer & Connection Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold">Customer Name</span>
              <p className="font-semibold text-slate-200 mt-0.5">{bill.customerName}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold">Connection #</span>
              <p className="font-mono text-slate-200 mt-0.5">{bill.connectionNumber}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold">Smart Meter ID</span>
              <p className="font-mono text-slate-200 mt-0.5">{bill.meterId}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold">Bill Status</span>
              <p className="font-bold text-emerald-400 mt-0.5">{bill.status}</p>
            </div>
          </div>

          {/* Meter Readings Comparison */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Previous Reading</span>
              <span className="text-slate-300 font-bold">{bill.previousReadingLiters.toLocaleString()} L</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Current Reading</span>
              <span className="text-emerald-400 font-bold">{bill.currentReadingLiters.toLocaleString()} L</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Consumed Volume</span>
              <span className="text-teal-300 font-bold">{bill.consumptionM3} m³</span>
            </div>
          </div>

          {/* Slab Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Volumetric Tariff Calculation Breakdown
            </h4>
            <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2">Consumption Slab</th>
                  <th className="p-2 text-right">Volume (m³)</th>
                  <th className="p-2 text-right">Unit Rate (LKR)</th>
                  <th className="p-2 text-right">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bill.slabBreakdown.map((slab, i) => (
                  <tr key={i} className="hover:bg-slate-900/50">
                    <td className="p-2 text-slate-300">{slab.slab}</td>
                    <td className="p-2 text-right font-mono">{slab.volumeM3.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{slab.unitRate.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono font-semibold text-slate-200">{slab.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="p-2 text-slate-400">Fixed Monthly Service Charge</td>
                  <td className="p-2 text-right font-mono text-slate-200">{bill.fixedCharge.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-2 text-slate-400">SSCL & Statutory Taxes</td>
                  <td className="p-2 text-right font-mono text-slate-200">{bill.taxesAmount.toFixed(2)}</td>
                </tr>
                <tr className="bg-emerald-950/40 text-emerald-300 font-bold border-t-2 border-emerald-800">
                  <td colSpan={3} className="p-2.5 text-sm">Total Net Amount Payable</td>
                  <td className="p-2.5 text-right font-mono text-base text-emerald-400">
                    LKR {bill.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Due Dates & Grace Period Warnings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="text-slate-400 block font-semibold">Payment Due Date:</span>
              <span className="font-mono text-slate-100 font-bold">{bill.dueDate}</span>
            </div>
            <div>
              <span className="text-rose-400 block font-semibold">Grace Period Expiration:</span>
              <span className="font-mono text-rose-300 font-bold">{bill.gracePeriodEndDate}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Official Document generated by National Smart Water Grid</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
