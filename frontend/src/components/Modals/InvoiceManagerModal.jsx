import React, { useState } from 'react';
import {
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  Save,
  RotateCcw,
  Trash2,
  Printer,
  LogOut,
  Eye,
  X
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
    return today.toLocaleDateString('en-GB'); // dd/mm/yyyy
  });
  const [dateTo, setDateTo] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-GB'); // dd/mm/yyyy
  });
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  if (!isOpen) return null;

  // Filter invoices based on Payment Mode
  const filteredInvoices = invoices.filter(inv => {
    if (paymentModeFilter !== 'ALL') {
      const mode = (inv.paymentMode || inv.payment_mode || '').toUpperCase();
      if (paymentModeFilter === 'CREDIT') {
        if (mode !== 'CREDIT' && mode !== 'CARD') return false;
      } else if (mode !== paymentModeFilter) {
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

  const handleRowDoubleClick = (inv) => {
    if (inv && onSelectInvoice) {
      onSelectInvoice(inv);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 select-none">
      {/* Outer Window Box with Windows Style Frame */}
      <div className="bg-[#f0cfbe] w-full max-w-5xl border-2 border-[#ba8775] flex flex-col max-h-[92vh] overflow-hidden shadow-2xl text-slate-800 font-sans">
        
        {/* 1. TOP WINDOW TITLE BAR matching Param Infotech (media_1792731575798.jpg) */}
        <div className="bg-[#0055ea] text-white px-2 py-0.5 flex items-center justify-between text-xs font-bold border-b border-blue-900 select-none">
          <div className="flex items-center space-x-1 truncate">
            <span className="font-semibold text-white/90">Restaura's [Restaurant Billing & Management System]</span>
            <span className="text-white">ALINEA RESTAURANT - [Bill]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-4 bg-[#e81123] hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center text-xs font-bold cursor-pointer transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* 2. WINDOW MENU BAR */}
        <div className="bg-[#f0f0f0] border-b border-[#a0a0a0] px-2 py-0.5 flex items-center space-x-3 text-xs text-slate-800 select-none">
          <span className="hover:bg-blue-100 px-1 cursor-pointer">Action</span>
          <span className="hover:bg-blue-100 px-1 cursor-pointer">Master</span>
          <span className="hover:bg-blue-100 px-1 cursor-pointer">Transaction</span>
          <span className="hover:bg-blue-100 px-1 cursor-pointer">Reports</span>
          <span className="hover:bg-blue-100 px-1 cursor-pointer">Utilities</span>
          <span className="hover:bg-blue-100 px-1 cursor-pointer">Windows</span>
        </div>

        {/* 3. TOOLBAR matching Photo 3: First, Prev, Next, Last, Save, Undo, Delete, Print, Exit, View (Active) */}
        <div className="bg-[#ebe9ed] border-b border-[#ba8775] px-2 py-1 flex flex-wrap items-center space-x-1 shrink-0 select-none">
          <button
            type="button"
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold cursor-pointer shadow-2xs"
            title="First Bill"
          >
            <ChevronFirst className="w-3.5 h-3.5 text-blue-700" />
            <span>First</span>
          </button>

          <button
            type="button"
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold cursor-pointer shadow-2xs"
            title="Previous Bill"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-blue-700" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold cursor-pointer shadow-2xs"
            title="Next Bill"
          >
            <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
            <span>Next</span>
          </button>

          <button
            type="button"
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold cursor-pointer shadow-2xs"
            title="Last Bill"
          >
            <ChevronLast className="w-3.5 h-3.5 text-blue-700" />
            <span>Last</span>
          </button>

          <span className="w-px h-5 bg-[#a0a0a0] mx-0.5"></span>

          <button
            type="button"
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold cursor-pointer shadow-2xs opacity-60"
            title="Save"
          >
            <Save className="w-3.5 h-3.5 text-blue-700" />
            <span>Save</span>
          </button>

          <button
            type="button"
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold cursor-pointer shadow-2xs opacity-60"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            disabled={!selectedInvoice}
            onClick={() => {
              if (selectedInvoice && window.confirm(`Delete bill #${selectedInvoice.invoiceNo || selectedInvoice.invoice_no}?`)) {
                onDeleteInvoice?.(selectedInvoice.id || selectedInvoice.invoiceNo);
                setSelectedInvoiceId(null);
              }
            }}
            className={`flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold shadow-2xs ${
              selectedInvoice ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            disabled={!selectedInvoice}
            onClick={() => {
              if (selectedInvoice && onPrintInvoice) {
                onPrintInvoice(selectedInvoice);
              }
            }}
            className={`flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold shadow-2xs ${
              selectedInvoice ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            title="Print"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold cursor-pointer shadow-2xs"
            title="Exit"
          >
            <LogOut className="w-3.5 h-3.5 text-red-700" />
            <span>Exit</span>
          </button>

          {/* Active View Button highlighted */}
          <button
            type="button"
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-[#bde0fe] hover:bg-[#a2d2ff] text-slate-900 border-2 border-blue-600 text-xs font-black shadow-xs cursor-default"
            title="View Bills"
          >
            <Eye className="w-3.5 h-3.5 text-blue-700" />
            <span>View</span>
          </button>
        </div>

        {/* 4. SUBHEADER BAR (Rust-Orange Strip matching Photo 3) */}
        <div className="bg-[#d9663d] text-white border-b border-[#ba8775] px-3 py-0.5 flex items-center justify-between text-xs font-bold shrink-0 select-none shadow-xs">
          <div className="flex items-center space-x-1 text-white">
            <span>User :</span>
            <span className="font-black text-white">A</span>
          </div>

          <div className="font-black text-sm tracking-wide uppercase text-white drop-shadow-xs">
            Bill
          </div>

          <div className="flex items-center space-x-1 font-mono text-white">
            <span>Date :</span>
            <span>22-10-2026 22:27</span>
          </div>
        </div>

        {/* 5. MAIN WORKSPACE CONTAINER */}
        <div className="flex-1 p-2 bg-[#f0cfbe] flex flex-col gap-2 overflow-hidden min-h-0">
          
          {/* SEARCH CRITERIA BOX matching Photo 3 */}
          <div className="bg-[#f7e4da] border border-[#ba8775] p-2 shrink-0 text-xs">
            <div className="font-bold text-[#4a2214] mb-1">Search :</div>
            
            {/* Row 1: Date From & Date To */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214]">Date From :</span>
                <input
                  type="text"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-24 px-1.5 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-center text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214]">Date To :</span>
                <input
                  type="text"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-24 px-1.5 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-center text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Row 2: Payment Mode & search button */}
            <div className="flex flex-wrap items-center gap-4 mt-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214]">Payment Mode :</span>
                <select
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value)}
                  className="w-28 px-1.5 py-0.5 bg-white border border-[#cca292] text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CREDIT">Credit Card</option>
                </select>
              </div>

              <button
                type="button"
                className="px-4 py-0.5 bg-[#e6e6e6] hover:bg-[#d4d4d4] active:bg-[#c0c0c0] text-[#111] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                search
              </button>
            </div>
          </div>

          {/* INVOICES GRID TABLE matching Photo 3 */}
          <div className="flex-1 bg-white border border-[#ba8775] overflow-auto min-h-0">
            <table className="w-full text-left text-xs border-collapse select-none">
              <thead className="bg-[#e8bcae] text-[#4a2214] font-bold sticky top-0 z-10 border-b border-[#ba8775]">
                <tr>
                  <th className="border-r border-[#ba8775] py-1 px-2.5 w-24">Date</th>
                  <th className="border-r border-[#ba8775] py-1 px-2 w-20 text-center">BillNo</th>
                  <th className="border-r border-[#ba8775] py-1 px-2 w-16 text-center">Table</th>
                  <th className="border-r border-[#ba8775] py-1 px-2 w-12 text-center">Pax</th>
                  <th className="border-r border-[#ba8775] py-1 px-2.5 w-24 text-right font-mono">Amount</th>
                  <th className="border-r border-[#ba8775] py-1 px-2 w-20 text-right font-mono">Cash Tips</th>
                  <th className="border-r border-[#ba8775] py-1 px-2 w-20 text-right font-mono">Credit Tips</th>
                  <th className="border-r border-[#ba8775] py-1 px-2 w-20 text-right font-mono">Discount</th>
                  <th className="border-r border-[#ba8775] py-1 px-2.5 w-24 text-right font-mono">Cash Payment</th>
                  <th className="border-r border-[#ba8775] py-1 px-2.5 w-24 text-right font-mono">Credit Payment</th>
                  <th className="py-1 px-2.5 w-28 text-right font-mono">Customer Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cca292]/50">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400 font-semibold italic">
                      No bills found.
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
                        onDoubleClick={() => handleRowDoubleClick(inv)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#cce8ff] text-slate-900 font-bold border-y border-blue-500'
                            : 'hover:bg-amber-50 text-slate-800'
                        }`}
                      >
                        <td className="border-r border-[#cca292]/50 py-1 px-2.5 font-mono">
                          {inv.date || '22/10/2026'}
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2 text-center font-mono font-bold text-slate-900">
                          {inv.invoiceNo || inv.invoice_no}
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2 text-center font-bold">
                          {inv.tableName || inv.table_name || '15'}
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2 text-center font-mono">
                          {inv.pax || 1}
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2.5 text-right font-mono font-semibold">
                          {amt.toFixed(2)}
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2 text-right font-mono text-slate-600">
                          0.00
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2 text-right font-mono text-slate-600">
                          0.00
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2 text-right font-mono text-slate-600">
                          {disc.toFixed(2)}
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2.5 text-right font-mono">
                          {cashPay.toFixed(2)}
                        </td>
                        <td className="border-r border-[#cca292]/50 py-1 px-2.5 text-right font-mono">
                          {creditPay.toFixed(2)}
                        </td>
                        <td className="py-1 px-2.5 text-right font-mono">
                          {custPay.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Summary Totals Row matching Photo 3 */}
              {filteredInvoices.length > 0 && (
                <tfoot className="bg-white font-mono font-bold text-slate-900 sticky bottom-0 border-t-2 border-[#ba8775]">
                  <tr>
                    <td className="border-r border-[#ba8775] py-1 px-2.5 font-sans font-bold">
                      Total
                    </td>
                    <td className="border-r border-[#ba8775] py-1 px-2"></td>
                    <td className="border-r border-[#ba8775] py-1 px-2"></td>
                    <td className="border-r border-[#ba8775] py-1 px-2 text-center font-bold text-slate-900">
                      {totals.count}
                    </td>
                    <td className="border-r border-[#ba8775] py-1 px-2.5 text-right font-bold">
                      {totals.totalAmount.toFixed(2)}
                    </td>
                    <td className="border-r border-[#ba8775] py-1 px-2 text-right text-slate-600">0.00</td>
                    <td className="border-r border-[#ba8775] py-1 px-2 text-right text-slate-600">0.00</td>
                    <td className="border-r border-[#ba8775] py-1 px-2 text-right text-slate-600">
                      {totals.totalDiscount.toFixed(2)}
                    </td>
                    <td className="border-r border-[#ba8775] py-1 px-2.5 text-right font-bold">
                      {totals.cashPayment.toFixed(2)}
                    </td>
                    <td className="border-r border-[#ba8775] py-1 px-2.5 text-right font-bold">
                      {totals.creditPayment.toFixed(2)}
                    </td>
                    <td className="py-1 px-2.5 text-right font-bold">
                      {totals.customerPayment.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* 6. BOTTOM ACTION BUTTONS: [ select ]  [ cancel ] matching Photo 3 exactly */}
          <div className="flex items-center justify-center space-x-3 py-1 shrink-0">
            <button
              type="button"
              disabled={!selectedInvoice}
              onClick={handleSelect}
              className={`px-5 py-0.5 bg-[#e6e6e6] hover:bg-[#d4d4d4] text-[#111] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs font-bold transition shadow-2xs ${
                selectedInvoice ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
              }`}
            >
              select
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-0.5 bg-[#e6e6e6] hover:bg-[#d4d4d4] text-[#111] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
