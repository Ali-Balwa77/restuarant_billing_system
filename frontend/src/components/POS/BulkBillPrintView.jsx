import React, { useState, useEffect } from 'react';
import {
  Printer,
  Calendar,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  LogOut,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  FileText,
  Layers
} from 'lucide-react';

export default function BulkBillPrintView({
  invoices = [],
  currentUser,
  onExit
}) {
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [billNoFrom, setBillNoFrom] = useState('');
  const [billNoTo, setBillNoTo] = useState('');
  const [paymentMode, setPaymentMode] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  // Filter invoices for display
  const filtered = invoices.filter(inv => {
    if (paymentMode !== 'ALL') {
      const mode = (inv.paymentMode || inv.payment_mode || '').toUpperCase();
      if (mode !== paymentMode) return false;
    }
    return true;
  });

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(filtered.map(i => i.id || i.invoiceNo));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const selectedCount = selectedIds.size;
  const selectedTotalAmount = filtered
    .filter(i => selectedIds.has(i.id || i.invoiceNo))
    .reduce((acc, i) => acc + Number(i.grandTotal || i.grand_total || i.subtotal || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 select-none overflow-hidden text-slate-800">
      {/* 1. TOP TOOLBAR */}
      <div className="bg-slate-800 text-white border-b border-slate-700/80 px-3 py-1.5 flex items-center justify-between text-xs font-bold shrink-0 shadow-xs">
        <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="Select All Bills"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select All</span>
          </button>

          <button
            type="button"
            onClick={handleDeselectAll}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="Deselect All"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" />
            <span>Deselect All</span>
          </button>

          <span className="w-px h-5 bg-slate-700 mx-1 hidden sm:block"></span>

          <button
            type="button"
            onClick={() => {
              if (selectedCount === 0) {
                alert('Please select at least one bill to print.');
                return;
              }
              alert(`Bulk print layout prepared for ${selectedCount} bills. (Design preview)`);
            }}
            className="flex items-center space-x-1 px-3.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Print Selected Bills"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Selected ({selectedCount})</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            title="Exit to Console"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-300" />
            <span>Exit</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block">
          Restaura's [Bulk Bill Print System]
        </div>
      </div>

      {/* 2. SUBHEADER STRIP */}
      <div className="bg-amber-100/90 text-amber-950 border-b border-amber-200/90 px-4 py-1.5 flex items-center justify-between text-xs font-bold shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">User :</span>
          <span className="bg-amber-200/90 px-2 py-0.5 rounded text-amber-950 font-black">
            {currentUser?.username?.toUpperCase() || currentUser?.name || 'A'}
          </span>
        </div>

        <div className="font-extrabold text-sm tracking-wide uppercase text-amber-900">
          Bulk Bill Print
        </div>

        <div className="flex items-center space-x-1.5 font-mono text-slate-700">
          <span className="font-semibold">Date :</span>
          <span>{liveTime}</span>
        </div>
      </div>

      {/* 3. FILTER PARAMETERS BOX */}
      <div className="p-3 bg-white border-b border-slate-300 shrink-0">
        <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-800">Filter Range :</span>

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

            {/* Bill No From */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-600 font-semibold">Bill From :</span>
              <input
                type="text"
                placeholder="Start Bill No"
                value={billNoFrom}
                onChange={(e) => setBillNoFrom(e.target.value)}
                className="w-24 font-mono text-xs text-slate-800 outline-none"
              />
            </div>

            {/* Bill No To */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-600 font-semibold">Bill To :</span>
              <input
                type="text"
                placeholder="End Bill No"
                value={billNoTo}
                onChange={(e) => setBillNoTo(e.target.value)}
                className="w-24 font-mono text-xs text-slate-800 outline-none"
              />
            </div>

            {/* Payment Mode */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-slate-600 font-semibold">Mode :</span>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="font-bold text-xs text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="ALL">All Modes</option>
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="CREDIT">CREDIT</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              type="button"
              className="px-4 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* 4. BILLS TABLE WITH CHECKBOXES */}
      <div className="flex-1 overflow-auto p-3">
        <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-300 shadow-2xs">
                <tr>
                  <th className="border-r border-slate-300 py-2 px-3 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedCount === filtered.length}
                      onChange={(e) => {
                        if (e.target.checked) handleSelectAll();
                        else handleDeselectAll();
                      }}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="border-r border-slate-300 py-2 px-2.5 w-24">BillNo</th>
                  <th className="border-r border-slate-300 py-2 px-2.5 w-28">Date</th>
                  <th className="border-r border-slate-300 py-2 px-2.5 w-24">Time</th>
                  <th className="border-r border-slate-300 py-2 px-2 w-20 text-center">Table</th>
                  <th className="border-r border-slate-300 py-2 px-2 w-16 text-center">Pax</th>
                  <th className="border-r border-slate-300 py-2 px-3">Customer</th>
                  <th className="border-r border-slate-300 py-2 px-2.5 text-right font-mono">Amount (₹)</th>
                  <th className="border-r border-slate-300 py-2 px-2.5 text-center">Mode</th>
                  <th className="py-2 px-2.5 text-center">Print Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400 font-medium">
                      No invoices available for bulk printing.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => {
                    const id = inv.id || inv.invoiceNo;
                    const isChecked = selectedIds.has(id);
                    const amt = Number(inv.grandTotal || inv.grand_total || inv.subtotal || 0);

                    return (
                      <tr
                        key={id}
                        onClick={() => handleToggleSelect(id)}
                        className={`cursor-pointer transition border-b border-slate-200 ${
                          isChecked
                            ? 'bg-sky-50 font-semibold text-slate-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <td className="border-r border-slate-200 py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 font-mono font-bold text-brand-orange">
                          {inv.invoiceNo || inv.invoice_no}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 font-mono">
                          {inv.date || '-'}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 font-mono text-slate-500">
                          {inv.time || '-'}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2 text-center font-bold">
                          {inv.tableName || inv.table_name || 'Counter'}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2 text-center font-mono">
                          {inv.pax || 1}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-3">
                          {inv.customerName || inv.customer_name || 'Walk-in Guest'}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                          {amt.toFixed(2)}
                        </td>
                        <td className="border-r border-slate-200 py-2 px-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {inv.paymentMode || inv.payment_mode || 'CASH'}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ready
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SUMMARY BAR */}
      <div className="p-3 bg-white border-t border-slate-300 flex items-center justify-between text-xs font-bold shrink-0">
        <div className="flex items-center space-x-4">
          <span className="text-slate-600">
            Selected: <strong className="text-sky-700 font-mono text-sm">{selectedCount}</strong> / {filtered.length} Bills
          </span>
          <span className="text-slate-600">
            Total Selected Amount: <strong className="text-emerald-700 font-mono text-sm">₹{selectedTotalAmount.toFixed(2)}</strong>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              if (selectedCount === 0) {
                alert('Please select bills to print.');
                return;
              }
              alert(`Printing batch of ${selectedCount} bills... (Layout Preview)`);
            }}
            className="px-5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Selected Batch</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
