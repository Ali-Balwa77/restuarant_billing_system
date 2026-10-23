import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  X,
  Printer,
  Trash2,
  CheckCircle,
  Plus,
  LogOut,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  RotateCcw,
  FileText
} from 'lucide-react';

export default function BillListView({
  invoices = [],
  currentUser,
  onSelectInvoice,
  onNewBill,
  onExit,
  onPrintInvoice,
  onDeleteInvoice
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

  // Live Clock
  const [liveTime, setLiveTime] = useState(() => {
    const d = new Date();
    return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setLiveTime(`${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    if (paymentModeFilter !== 'ALL') {
      const mode = (inv.paymentMode || inv.payment_mode || '').toUpperCase();
      if (mode !== paymentModeFilter) return false;
    }

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

  // Calculate totals matching Image 3 footer
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
    } else if (onNewBill) {
      onNewBill();
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
    <div className="flex-1 flex flex-col h-full bg-slate-100 select-none overflow-hidden text-slate-800">
      {/* 1. TOP TOOLBAR matching Image 3 */}
      <div className="bg-slate-800 text-white border-b border-slate-700/80 px-3 py-1.5 flex items-center justify-between text-xs font-bold shrink-0 shadow-xs">
        <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (filteredInvoices.length > 0) {
                setSelectedInvoiceId(filteredInvoices[filteredInvoices.length - 1].id || filteredInvoices[filteredInvoices.length - 1].invoiceNo);
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="First Bill"
          >
            <ChevronFirst className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">First</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedInvoiceId && filteredInvoices.length > 0) {
                setSelectedInvoiceId(filteredInvoices[0].id || filteredInvoices[0].invoiceNo);
                return;
              }
              const idx = filteredInvoices.findIndex(i => (i.id === selectedInvoiceId || i.invoiceNo === selectedInvoiceId));
              if (idx < filteredInvoices.length - 1) {
                setSelectedInvoiceId(filteredInvoices[idx + 1].id || filteredInvoices[idx + 1].invoiceNo);
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="Previous Bill"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedInvoiceId) return;
              const idx = filteredInvoices.findIndex(i => (i.id === selectedInvoiceId || i.invoiceNo === selectedInvoiceId));
              if (idx > 0) {
                setSelectedInvoiceId(filteredInvoices[idx - 1].id || filteredInvoices[idx - 1].invoiceNo);
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="Next Bill"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (filteredInvoices.length > 0) {
                setSelectedInvoiceId(filteredInvoices[0].id || filteredInvoices[0].invoiceNo);
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="Last Bill"
          >
            <ChevronLast className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Last</span>
          </button>

          <span className="w-px h-5 bg-slate-700 mx-1 hidden sm:block"></span>

          {/* Add New Bill button */}
          <button
            type="button"
            onClick={onNewBill}
            className="flex items-center space-x-1 px-3 py-1 bg-brand-orange hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Add New Bill"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          {/* Delete button */}
          {selectedInvoice && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Delete Bill"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {/* Print button */}
          {selectedInvoice && (
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print</span>
            </button>
          )}

          {/* Exit / Return to Console */}
          <button
            type="button"
            onClick={onExit}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            title="Exit to Console Root"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-300" />
            <span>Exit</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block">
          Restaura's [Restaurant Billing & Management System] - [Bill]
        </div>
      </div>

      {/* 2. SUBHEADER STRIP matching Image 3: User : A | Bill | Date : 22-10-2026 22:27 */}
      <div className="bg-amber-100/90 text-amber-950 border-b border-amber-200/90 px-4 py-1.5 flex items-center justify-between text-xs font-bold shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">User :</span>
          <span className="bg-amber-200/90 px-2 py-0.5 rounded text-amber-950 font-black">
            {currentUser?.username?.toUpperCase() || currentUser?.name || 'A'}
          </span>
        </div>

        <div className="font-extrabold text-sm tracking-wide uppercase text-amber-900">
          Bill
        </div>

        <div className="flex items-center space-x-1.5 font-mono text-slate-700">
          <span className="font-semibold">Date :</span>
          <span>{liveTime}</span>
        </div>
      </div>

      {/* 3. SEARCH CONTAINER matching Image 3 */}
      <div className="p-3 bg-white border-b border-slate-300 shrink-0">
        <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-800">Search :</span>

            {/* Date From */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-600 font-semibold">Date From :</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="font-mono text-xs text-slate-800 outline-none"
              />
            </div>

            {/* Date To */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-600 font-semibold">Date To :</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="font-mono text-xs text-slate-800 outline-none"
              />
            </div>

            {/* Payment Mode */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-600 font-semibold">Payment Mode :</span>
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="font-bold text-xs text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="CREDIT">CREDIT</option>
              </select>
            </div>

            {/* Free Search input */}
            <div className="relative flex-1 min-w-[150px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Bill No, Table, Guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-brand-orange"
              />
            </div>

            {/* Search / Reset button */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPaymentModeFilter('ALL');
              }}
              className="px-3.5 py-1 bg-brand-orange hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
            >
              search
            </button>
          </div>
        </div>
      </div>

      {/* 4. BILLS DATA GRID TABLE matching Image 3 */}
      <div className="flex-1 overflow-auto p-3">
        <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-300 shadow-2xs">
                <tr>
                  <th className="border-r border-slate-300 py-2 px-2.5 w-28">Date</th>
                  <th className="border-r border-slate-300 py-2 px-2.5 w-24">BillNo</th>
                  <th className="border-r border-slate-300 py-2 px-2 w-20 text-center">Table</th>
                  <th className="border-r border-slate-300 py-2 px-2 w-16 text-center">Pax</th>
                  <th className="border-r border-slate-300 py-2 px-2.5 text-right font-mono">Amount</th>
                  <th className="border-r border-slate-300 py-2 px-2 text-right font-mono">Cash Tips</th>
                  <th className="border-r border-slate-300 py-2 px-2 text-right font-mono">Credit Tips</th>
                  <th className="border-r border-slate-300 py-2 px-2 text-right font-mono">Discount</th>
                  <th className="border-r border-slate-300 py-2 px-2.5 text-right font-mono">Cash Payment</th>
                  <th className="border-r border-slate-300 py-2 px-2.5 text-right font-mono">Credit Payment</th>
                  <th className="py-2 px-2.5 text-right font-mono">Customer Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-slate-400 font-medium">
                      No bills found. Click <strong>[Add]</strong> above or <strong>[+ New Bill]</strong> below to create your first bill.
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
                        onDoubleClick={() => {
                          setSelectedInvoiceId(inv.id || inv.invoiceNo);
                          onSelectInvoice?.(inv);
                        }}
                        className={`cursor-pointer transition border-b border-slate-200 ${
                          isSelected
                            ? 'bg-amber-100/90 font-semibold text-slate-900 border-amber-300'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <td className="border-r border-slate-200 py-2 px-2.5 font-mono">
                          {inv.date || '-'}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 font-mono font-bold text-brand-orange">
                          {inv.invoiceNo || inv.invoice_no}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2 text-center font-bold">
                          {inv.tableName || inv.table_name || 'Counter'}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2 text-center font-mono">
                          {inv.pax || 1}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                          {amt.toFixed(2)}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2 text-right font-mono text-slate-500">
                          0.00
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2 text-right font-mono text-slate-500">
                          0.00
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2 text-right font-mono text-slate-500">
                          {disc.toFixed(2)}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 text-right font-mono font-semibold">
                          {cashPay.toFixed(2)}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 text-right font-mono font-semibold">
                          {creditPay.toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-semibold">
                          {custPay.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Totals Row matching Image 3 Footer */}
          {filteredInvoices.length > 0 && (
            <div className="bg-slate-100 font-mono font-bold text-slate-900 border-t-2 border-slate-400 shrink-0">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  <tr>
                    <td className="border-r border-slate-300 py-2 px-2.5 w-28 text-center font-sans font-black">
                      Total
                    </td>
                    <td className="border-r border-slate-300 py-2 px-2.5 w-24 text-center text-brand-orange font-bold">
                      {totals.count}
                    </td>
                    <td className="border-r border-slate-300 py-2 px-2 w-20"></td>
                    <td className="border-r border-slate-300 py-2 px-2 w-16"></td>
                    <td className="border-r border-slate-300 py-2 px-2.5 w-auto text-right text-emerald-700 font-black">
                      {totals.totalAmount.toFixed(2)}
                    </td>
                    <td className="border-r border-slate-300 py-2 px-2 w-auto text-right">0.00</td>
                    <td className="border-r border-slate-300 py-2 px-2 w-auto text-right">0.00</td>
                    <td className="border-r border-slate-300 py-2 px-2 w-auto text-right">
                      {totals.totalDiscount.toFixed(2)}
                    </td>
                    <td className="border-r border-slate-300 py-2 px-2.5 w-auto text-right">
                      {totals.cashPayment.toFixed(2)}
                    </td>
                    <td className="border-r border-slate-300 py-2 px-2.5 w-auto text-right">
                      {totals.creditPayment.toFixed(2)}
                    </td>
                    <td className="py-2 px-2.5 w-auto text-right">
                      {totals.customerPayment.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 5. BOTTOM ACTION BUTTONS: [select] [cancel] matching Image 3 */}
      <div className="p-3 bg-white border-t border-slate-300 flex items-center justify-center space-x-3 shrink-0">
        <button
          type="button"
          onClick={handleSelect}
          className="px-6 py-1.5 bg-brand-orange hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center space-x-1.5"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>select</span>
        </button>

        <button
          type="button"
          onClick={onNewBill}
          className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Bill</span>
        </button>

        <button
          type="button"
          onClick={onExit}
          className="px-6 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
