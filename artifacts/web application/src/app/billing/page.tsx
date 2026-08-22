'use client';

import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Download,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  Calendar,
  Banknote,
  AlertOctagon,
  FileSpreadsheet,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { InvoiceModal } from '../../components/billing/InvoiceModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { exportToCSV, generateOfficialGovPdfReport } from '../../lib/exportUtils';
import { Bill } from '../../types';
import confetti from 'canvas-confetti';

export default function BillingPage() {
  const { bills, generateMonthlyBills, recordPayment } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBillForInvoice, setSelectedBillForInvoice] = useState<Bill | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBillToPay, setSelectedBillToPay] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const totalBilled = bills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalPaid = bills.reduce((acc, b) => acc + b.paidAmount, 0);
  const totalOutstanding = bills.reduce((acc, b) => acc + b.outstandingBalance, 0);
  const redBillsCount = bills.filter((b) => b.status === 'RED_BILL').length;

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchSearch =
        b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.connectionNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.meterId.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bills, search, statusFilter]);

  const handleRunBatchBilling = async () => {
    setIsLoading(true);
    const count = await generateMonthlyBills();
    setIsLoading(false);
    setIsGenerateModalOpen(false);
    setFeedback(`Generated ${count} new water utility bills based on current volumetric slab tariffs.`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => setFeedback(''), 5000);
  };

  const handleSettleBill = async () => {
    if (!selectedBillToPay) return;
    setIsLoading(true);
    const res = await recordPayment({
      billId: selectedBillToPay.id,
      amount: selectedBillToPay.outstandingBalance,
      paymentMethod: 'COUNTER',
      transactionReference: `COUNTER-NWSDB-${Date.now()}`,
      notes: 'Counter payment settled at regional water board cashier',
    });
    setIsLoading(false);
    setIsPayModalOpen(false);
    setFeedback(`Bill #${selectedBillToPay.billNumber} paid in full. Receipt #${res.receiptNumber}`);
    setTimeout(() => setFeedback(''), 5000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Bill Number',
      'Customer Name',
      'Connection #',
      'Meter ID',
      'Period',
      'Consumption (m3)',
      'Fixed Charge (LKR)',
      'Taxes (LKR)',
      'Total Amount (LKR)',
      'Paid Amount (LKR)',
      'Outstanding (LKR)',
      'Due Date',
      'Grace Expiry',
      'Status',
    ];

    const rows = filteredBills.map((b) => [
      b.billNumber,
      b.customerName,
      b.connectionNumber,
      b.meterId,
      b.billingPeriod,
      b.consumptionM3,
      b.fixedCharge,
      b.taxesAmount,
      b.totalAmount,
      b.paidAmount,
      b.outstandingBalance,
      b.dueDate,
      b.gracePeriodEndDate,
      b.status,
    ]);

    exportToCSV(`NWSDB_Bills_Report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Bill #', 'Customer', 'Conn #', 'Period', 'Vol (m³)', 'Total (LKR)', 'Due Date', 'Status'];
    const rows = filteredBills.map((b) => [
      b.billNumber,
      b.customerName,
      b.connectionNumber,
      b.billingPeriod,
      b.consumptionM3.toFixed(1),
      b.totalAmount.toFixed(2),
      b.dueDate,
      b.status,
    ]);

    generateOfficialGovPdfReport(
      'National Water Supply Billing & Arrears Ledger',
      `Filter: ${statusFilter} Bills | Total Records: ${filteredBills.length}`,
      headers,
      rows,
      `NWSDB_Billing_Ledger_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>Government Billing & Invoicing Center</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated volumetric slab calculations, due date tracking, and grace period reconciliation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Monthly Billing Run</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Total Billed Net</span>
          <p className="text-xl font-bold text-slate-100 mt-1 font-mono">
            LKR {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{bills.length} total issued invoices</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Total Collected Revenue</span>
          <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">
            LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-500 mt-1">
            {totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0}% Collection Rate
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Outstanding Arrears</span>
          <p className="text-xl font-bold text-amber-400 mt-1 font-mono">
            LKR {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-amber-500 mt-1">Pending & Overdue Balances</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <span className="text-xs text-slate-400">Enforced Red-Bills</span>
          <p className="text-xl font-bold text-rose-400 mt-1 font-mono">
            {redBillsCount}
          </p>
          <p className="text-[11px] text-rose-400 mt-1">Grace Period Exceeded</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Bill #, Customer Name, Connection #, Meter ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-emerald-500"
          >
            <option value="ALL">All Statuses ({bills.length})</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="RED_BILL">RED BILL</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Bill Number & Customer</th>
                <th className="p-3.5">Connection & Meter</th>
                <th className="p-3.5">Billing Period</th>
                <th className="p-3.5 text-right">Volume (m³)</th>
                <th className="p-3.5 text-right">Total Net (LKR)</th>
                <th className="p-3.5 text-right">Outstanding (LKR)</th>
                <th className="p-3.5">Due & Grace Dates</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                    No utility bills found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-slate-200">{bill.billNumber}</p>
                      <p className="text-[11px] text-slate-400">{bill.customerName}</p>
                    </td>

                    <td className="p-3.5 font-mono text-[11px]">
                      <p className="text-slate-300">Conn: {bill.connectionNumber}</p>
                      <p className="text-slate-500">Meter: {bill.meterId}</p>
                    </td>

                    <td className="p-3.5 font-medium text-slate-300">
                      {bill.billingPeriod}
                    </td>

                    <td className="p-3.5 text-right font-mono">
                      <span className="font-bold text-slate-100">{bill.consumptionM3} m³</span>
                      <span className="text-[10px] text-slate-500 block">({bill.consumptionLiters.toLocaleString()} L)</span>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                      {bill.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="p-3.5 text-right font-mono">
                      <span className={`font-bold ${bill.outstandingBalance > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {bill.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="p-3.5 text-[11px] font-mono">
                      <p className="text-slate-300">Due: {bill.dueDate}</p>
                      <p className="text-rose-400/90 text-[10px]">Grace: {bill.gracePeriodEndDate}</p>
                    </td>

                    <td className="p-3.5 text-center">
                      <StatusBadge type="bill" status={bill.status} />
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBillForInvoice(bill)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          title="Open Printable Bill"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        {bill.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setSelectedBillToPay(bill);
                              setIsPayModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800 text-[11px] font-semibold transition-colors"
                            title="Collect & Settle Payment"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {selectedBillForInvoice && (
        <InvoiceModal
          bill={selectedBillForInvoice}
          isOpen={!!selectedBillForInvoice}
          onClose={() => setSelectedBillForInvoice(null)}
        />
      )}

      {/* Batch Bill Generation Confirm */}
      <ConfirmModal
        isOpen={isGenerateModalOpen}
        title="Execute Batch Monthly Utility Billing Run"
        description="This will calculate volumetric water bills for all active connections according to official slab tariffs and generate official serial invoice records."
        confirmText="Execute Billing Run"
        requireReason={false}
        isLoading={isLoading}
        onConfirm={handleRunBatchBilling}
        onClose={() => setIsGenerateModalOpen(false)}
      />

      {/* Settle Bill Modal */}
      {selectedBillToPay && (
        <ConfirmModal
          isOpen={isPayModalOpen}
          title={`Settle Invoice #${selectedBillToPay.billNumber}`}
          description={`Confirm manual payment collection of LKR ${selectedBillToPay.outstandingBalance.toLocaleString()} for ${selectedBillToPay.customerName}. Upon verification, if the valve was cut off due to Red Bill status, it will be automatically sent an OPEN_VALVE command.`}
          confirmText="Confirm Payment & Restore Supply"
          requireReason={false}
          isLoading={isLoading}
          onConfirm={handleSettleBill}
          onClose={() => setIsPayModalOpen(false)}
        />
      )}
    </div>
  );
}
