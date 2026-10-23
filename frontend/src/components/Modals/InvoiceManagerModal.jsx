import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  X,
  Printer,
  Trash2,
  CheckCircle,
  FileText,
  RotateCcw,
  IndianRupee,
  Layers
} from 'lucide-react';

export default function InvoiceManagerModal({
  isOpen,
  onClose,
  invoices = [],
  onSelectInvoice,
  onPrintInvoice,
  onDeleteInvoice,
}) {
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  if (!isOpen) return null;

  // Filter invoices based on Date Range, Payment Mode, and Search Query
  const filteredInvoices = invoices.filter(inv => {
    // Payment mode filter
    if (paymentModeFilter !== 'ALL') {
      const mode = (inv.paymentMode || inv.payment_mode || '').toUpperCase();
      if (mode !== paymentModeFilter) return false;
    }

    // Search query filter (Bill No, Table, Customer Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const bNo = String(inv.invoiceNo || inv.invoice_no || '').toLowerCase();
      const tbl = String(inv.tableName || inv.table_name || '').toLowerCase();
      const cust = String(inv.customerName || inv.customer_name || '').toLowerCase();
      if (!bNo.includes(q) && !tbl.includes(q) && !cust.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Calculate totals matching Photo 3 footer
  const totals = filteredInvoices.reduce(
    (acc, inv) => {
      const amt = Number(inv.grandTotal || inv.grand_total || inv.subtotal || 0);
      const disc = Number(inv.discount || 0);
      const mode = (inv.paymentMode || inv.payment_mode || '').toUpperCase();

      acc.count += 1;
      acc.totalAmount += amt;
      acc.totalDiscount += disc;

      if (mode === 'CASH') {
        acc.cashPayment += amt;
      } else if (mode === 'CREDIT') {
        acc.creditPayment += amt;
      } else {
        acc.customerPayment += amt;
      }
      return acc;
    },
    {
      count: 0,
      totalAmount: 0,
      cashTips: 0,
      creditTips: 0,
      totalDiscount: 0,
      cashPayment: 0,
      creditPayment: 0,
      customerPayment: 0,
    }
  );

  const selectedInvoice = filteredInvoices.find(
    inv => (inv.id === selectedInvoiceId || inv.invoiceNo === selectedInvoiceId)
  );

  const handleSelect = () => {
    if (selectedInvoice && onSelectInvoice) {
      onSelectInvoice(selectedInvoice);
      onClose();
    }
  };

  const handlePrint = () => {
    if (selectedInvoice && onPrintInvoice) {
      onPrintInvoice(selectedInvoice);
    }
  };

  const handleDelete = () => {
    if (!selectedInvoice) return;
    if (window.confirm(`Are you sure you want to delete Invoice #${selectedInvoice.invoiceNo || selectedInvoice.invoice_no}?`)) {
      onDeleteInvoice?.(selectedInvoice.id || selectedInvoice.invoiceNo);
      setSelectedInvoiceId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar matching Photo 3 */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white">
                Restaura's [Restaurant Billing & Management System] - View Bills
              </h2>
              <div className="text-[11px] text-slate-400">
                Search, Review, Select, Print and Manage Settled Invoices
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close View"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Box matching Photo 3 */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-700">Search :</span>

            {/* Date From */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-500 font-semibold">Date From :</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="font-mono text-xs text-slate-800 outline-none"
              />
            </div>

            {/* Date To */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-500 font-semibold">Date To :</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="font-mono text-xs text-slate-800 outline-none"
              />
            </div>

            {/* Payment Mode */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-500 font-semibold">Payment Mode :</span>
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="font-bold text-xs text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="ALL">All Modes</option>
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="CREDIT">CREDIT</option>
              </select>
            </div>

            {/* Free Search Input */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Bill No, Table, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* Reset / Search button */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPaymentModeFilter('ALL');
              }}
              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Invoices Grid Table matching Photo 3 */}
        <div className="flex-1 overflow-auto p-3">
          <table className="w-full text-left text-xs border border-slate-300 border-collapse select-text">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="border border-slate-300 py-2 px-2.5 w-24">Date</th>
                <th className="border border-slate-300 py-2 px-2.5 w-20">BillNo</th>
                <th className="border border-slate-300 py-2 px-2 w-16 text-center">Table</th>
                <th className="border border-slate-300 py-2 px-2 w-12 text-center">Pax</th>
                <th className="border border-slate-300 py-2 px-2.5 text-right font-mono">Amount</th>
                <th className="border border-slate-300 py-2 px-2 text-right font-mono">Cash Tips</th>
                <th className="border border-slate-300 py-2 px-2 text-right font-mono">Credit Tips</th>
                <th className="border border-slate-300 py-2 px-2 text-right font-mono">Discount</th>
                <th className="border border-slate-300 py-2 px-2.5 text-right font-mono">Cash Payment</th>
                <th className="border border-slate-300 py-2 px-2.5 text-right font-mono">Credit Payment</th>
                <th className="border border-slate-300 py-2 px-2.5 text-right font-mono">Customer Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-medium border border-slate-300">
                    No invoices found for selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoiceId === (inv.id || inv.invoiceNo);
                  const amt = Number(inv.grandTotal || inv.grand_total || inv.subtotal || 0);
                  const disc = Number(inv.discount || 0);
                  const mode = (inv.paymentMode || inv.payment_mode || '').toUpperCase();
                  const cashPay = mode === 'CASH' ? amt : 0;
                  const creditPay = mode === 'CREDIT' ? amt : 0;
                  const custPay = (mode !== 'CASH' && mode !== 'CREDIT') ? amt : 0;

                  return (
                    <tr
                      key={inv.id || inv.invoiceNo}
                      onClick={() => setSelectedInvoiceId(inv.id || inv.invoiceNo)}
                      className={`cursor-pointer transition border border-slate-300 ${
                        isSelected
                          ? 'bg-amber-100/90 font-semibold text-slate-900 border-amber-400'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="border border-slate-300 py-1.5 px-2.5 font-mono">
                        {inv.date || '-'}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 font-mono font-bold text-brand-orange">
                        {inv.invoiceNo || inv.invoice_no}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-bold">
                        {inv.tableName || inv.table_name || 'Counter'}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-center font-mono">
                        {inv.pax || 1}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                        {amt.toFixed(2)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-500">
                        0.00
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-500">
                        0.00
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono text-slate-500">
                        {disc.toFixed(2)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 text-right font-mono font-semibold">
                        {cashPay.toFixed(2)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 text-right font-mono font-semibold">
                        {creditPay.toFixed(2)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2.5 text-right font-mono font-semibold">
                        {custPay.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Summary Totals Row matching Photo 3 */}
            {filteredInvoices.length > 0 && (
              <tfoot className="bg-slate-100 font-mono font-bold text-slate-900 sticky bottom-0 border-t-2 border-slate-400">
                <tr>
                  <td className="border border-slate-300 py-2 px-2.5 text-center font-sans font-black">
                    Total
                  </td>
                  <td className="border border-slate-300 py-2 px-2.5 text-center text-brand-orange font-bold">
                    {totals.count}
                  </td>
                  <td colSpan={2} className="border border-slate-300 py-2 px-2"></td>
                  <td className="border border-slate-300 py-2 px-2.5 text-right text-emerald-700 font-black">
                    {totals.totalAmount.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-right">0.00</td>
                  <td className="border border-slate-300 py-2 px-2 text-right">0.00</td>
                  <td className="border border-slate-300 py-2 px-2 text-right">
                    {totals.totalDiscount.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 py-2 px-2.5 text-right">
                    {totals.cashPayment.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 py-2 px-2.5 text-right">
                    {totals.creditPayment.toFixed(2)}
                  </td>
                  <td className="border border-slate-300 py-2 px-2.5 text-right">
                    {totals.customerPayment.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Bottom Actions Bar matching Photo 3 buttons: [select] [cancel] + Print & Delete */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedInvoice ? (
              <span className="text-xs text-slate-600">
                Selected: <strong className="text-brand-orange">#{selectedInvoice.invoiceNo || selectedInvoice.invoice_no}</strong> ({selectedInvoice.tableName || selectedInvoice.table_name}) - ₹{Number(selectedInvoice.grandTotal || selectedInvoice.grand_total || 0).toFixed(2)}
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Click any row in the table to select an invoice
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Delete button */}
            {selectedInvoice && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                title="Delete invoice"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete</span>
              </button>
            )}

            {/* Print button */}
            {selectedInvoice && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                title="Print invoice receipt"
              >
                <Printer className="w-3.5 h-3.5 text-sky-600" />
                <span>Print</span>
              </button>
            )}

            {/* Select button */}
            <button
              type="button"
              disabled={!selectedInvoice}
              onClick={handleSelect}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                selectedInvoice
                  ? 'bg-brand-orange hover:bg-brand-orange/90 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Select</span>
            </button>

            {/* Cancel button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
