'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Download,
  Search,
  Plus,
  CheckCircle2,
  Banknote,
  QrCode,
  Building,
  Smartphone,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PaymentMethod } from '../../types';
import { exportToCSV, generateOfficialGovPdfReport } from '../../lib/exportUtils';
import confetti from 'canvas-confetti';

export default function PaymentsPage() {
  const { payments, bills, users, recordPayment } = useData();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState(bills.find((b) => b.status !== 'PAID')?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('GOV_PAY');
  const [reference, setReference] = useState(`LP-SL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [notes, setNotes] = useState('Payment collected at government regional counter');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.connectionNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionReference.toLowerCase().includes(search.toLowerCase());

    const matchMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchSearch && matchMethod;
  });

  const unpaidBills = bills.filter((b) => b.outstandingBalance > 0);

  const handleSelectBill = (bId: string) => {
    setSelectedBillId(bId);
    const bill = bills.find((b) => b.id === bId);
    if (bill) {
      setAmount(bill.outstandingBalance);
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId || amount <= 0) return;

    setIsProcessing(true);
    const res = await recordPayment({
      billId: selectedBillId,
      amount,
      paymentMethod,
      transactionReference: reference,
      notes,
    });
    setIsProcessing(false);
    setIsCollectModalOpen(false);
    setFeedback(`Payment confirmed! Official Receipt #${res.receiptNumber} issued. Outstanding bill balance cleared.`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setFeedback(''), 6000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Receipt Number',
      'Bill Number',
      'Customer Name',
      'Connection #',
      'Amount (LKR)',
      'Payment Method',
      'Transaction Ref',
      'Timestamp',
      'Verified By',
    ];

    const rows = filteredPayments.map((p) => [
      p.receiptNumber,
      p.billNumber,
      p.customerName,
      p.connectionNumber,
      p.amount,
      p.paymentMethod,
      p.transactionReference,
      p.timestamp,
      p.verifiedByOfficerName || 'LankaPay Gateway',
    ]);

    exportToCSV(`NWSDB_Payments_Ledger_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Receipt #', 'Customer', 'Conn #', 'Amount (LKR)', 'Method', 'Reference', 'Time'];
    const rows = filteredPayments.map((p) => [
      p.receiptNumber,
      p.customerName,
      p.connectionNumber,
      p.amount.toFixed(2),
      p.paymentMethod,
      p.transactionReference,
      new Date(p.timestamp).toLocaleDateString('en-GB'),
    ]);

    generateOfficialGovPdfReport(
      'National Water Revenue & Payment Transactions Ledger',
      `Total Collected: LKR ${totalRevenue.toLocaleString()} | Verified Receipts: ${payments.length}`,
      headers,
      rows,
      `NWSDB_Payments_Summary_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Government Payment Reconciliation & Digital Gateway</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time settlement verification, LankaPay/GovPay transactions, and automated supply reconnection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (unpaidBills.length > 0) {
                handleSelectBill(unpaidBills[0].id);
              }
              setIsCollectModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Over-The-Counter Payment</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Official PDF
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Total Verified Collections</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            LKR {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{payments.length} successful transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Digital Mobile App (LankaQR)</span>
          <p className="text-2xl font-bold text-teal-400 mt-1 font-mono">
            {payments.filter((p) => p.paymentMethod === 'MOBILE_APP').length}
          </p>
          <p className="text-[11px] text-teal-400 mt-1">Instant mobile app settlements</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">GovPay & LankaPay Gateway</span>
          <p className="text-2xl font-bold text-blue-400 mt-1 font-mono">
            {payments.filter((p) => p.paymentMethod === 'GOV_PAY' || p.paymentMethod === 'LANKA_PAY').length}
          </p>
          <p className="text-[11px] text-blue-400 mt-1">Direct interbank clearing</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Counter Cashier Collections</span>
          <p className="text-2xl font-bold text-slate-100 mt-1 font-mono">
            {payments.filter((p) => p.paymentMethod === 'COUNTER').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Regional water board centers</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Receipt #, Customer Name, Reference, Connection #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">All Payment Gateways</option>
            <option value="MOBILE_APP">React Native Mobile App</option>
            <option value="GOV_PAY">GovPay Digital Service</option>
            <option value="LANKA_PAY">LankaPay National Switch</option>
            <option value="COUNTER">Counter Cashier</option>
          </select>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Official Receipt #</th>
                <th className="p-3.5">Bill Reference & Connection</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Amount Paid (LKR)</th>
                <th className="p-3.5">Gateway Reference</th>
                <th className="p-3.5">Verified Timestamp</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    No verified payment transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-200">{p.receiptNumber}</td>

                    <td className="p-3.5 font-mono text-[11px]">
                      <p className="text-emerald-400 font-semibold">{p.billNumber}</p>
                      <p className="text-slate-400">Conn: {p.connectionNumber}</p>
                    </td>

                    <td className="p-3.5 font-semibold text-slate-100">{p.customerName}</td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px] border border-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                      {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">{p.transactionReference}</td>

                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {new Date(p.timestamp).toLocaleString('en-GB')}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Counter Payment Modal */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>Record Over-The-Counter Water Utility Payment</span>
            </h3>

            <form onSubmit={handleCollectPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Outstanding Customer Bill</label>
                <select
                  value={selectedBillId}
                  onChange={(e) => handleSelectBill(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                  required
                >
                  <option value="">-- Select Unpaid Bill --</option>
                  {unpaidBills.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.customerName} - {b.billNumber} (Due: LKR {b.outstandingBalance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                  >
                    <option value="COUNTER">Counter Cash</option>
                    <option value="GOV_PAY">GovPay Portal</option>
                    <option value="LANKA_PAY">LankaPay POS / Debit</option>
                    <option value="ONLINE_BANKING">Direct Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Amount Collected (LKR)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono font-bold focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Bank / Receipt Transaction Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cashier Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300">
                <span className="font-bold">AUTOMATED RECONNECTION POLICY:</span> If this account's water supply valve was closed due to Red-Bill non-payment, confirming this full payment will automatically dispatch an <span className="font-mono text-white">OPEN_VALVE</span> command to the ESP32 smart meter.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40"
                >
                  {isProcessing ? 'Verifying...' : 'Issue Verified Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
