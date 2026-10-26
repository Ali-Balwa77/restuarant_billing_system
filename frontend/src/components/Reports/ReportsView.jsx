import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  IndianRupee,
  CreditCard,
  Banknote,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  PieChart,
  UserCheck,
  Receipt,
  Layers
} from 'lucide-react';

export default function ReportsView({ sales = [], restaurant = {} }) {
  const [activeTab, setActiveTab] = useState('SALES_REGISTER'); // 'SALES_REGISTER', 'ITEM_SALES', 'STEWARD_SALES', 'TAX_SUMMARY'
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchDate = !dateFilter || s.date === dateFilter;
      const matchPayment = paymentFilter === 'ALL' || s.paymentMode === paymentFilter;
      return matchDate && matchPayment;
    });
  }, [sales, dateFilter, paymentFilter]);

  // Overall KPIs
  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalBills = filteredSales.length;
  const cashSales = filteredSales.filter((s) => s.paymentMode === 'CASH').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const upiSales = filteredSales.filter((s) => s.paymentMode === 'UPI').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const cardSales = filteredSales.filter((s) => s.paymentMode === 'CARD').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const creditSales = filteredSales.filter((s) => s.paymentMode === 'CREDIT').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalTax = filteredSales.reduce((acc, s) => acc + (s.tax || 0), 0);
  const totalDiscount = filteredSales.reduce((acc, s) => acc + (s.discount || 0), 0);

  // Item-wise & Category-wise aggregation
  const itemAnalytics = useMemo(() => {
    const itemMap = {};
    const categoryMap = {};

    filteredSales.forEach((sale) => {
      let itemsList = [];
      try {
        itemsList = typeof sale.itemsJson === 'string' ? JSON.parse(sale.itemsJson) : (sale.itemsJson || []);
      } catch {
        itemsList = [];
      }

      itemsList.forEach((it) => {
        const key = it.code || it.name;
        const cat = it.category || 'General';
        const qty = Number(it.qty) || 1;
        const total = Number(it.total) || (Number(it.rate) * qty) || 0;

        if (!itemMap[key]) {
          itemMap[key] = {
            code: it.code || '-',
            name: it.name || key,
            category: cat,
            qty: 0,
            revenue: 0,
          };
        }
        itemMap[key].qty += qty;
        itemMap[key].revenue += total;

        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, qty: 0, revenue: 0 };
        }
        categoryMap[cat].qty += qty;
        categoryMap[cat].revenue += total;
      });
    });

    const sortedItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);
    const sortedCategories = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    return { items: sortedItems, categories: sortedCategories };
  }, [filteredSales]);

  // Steward-wise aggregation
  const stewardAnalytics = useMemo(() => {
    const stwMap = {};
    filteredSales.forEach((s) => {
      const stw = s.steward || 'Counter Cashier';
      if (!stwMap[stw]) {
        stwMap[stw] = { steward: stw, billsCount: 0, totalSales: 0 };
      }
      stwMap[stw].billsCount += 1;
      stwMap[stw].totalSales += (s.grandTotal || 0);
    });
    return Object.values(stwMap).sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredSales]);

  // CSV Export
  const handleExportCSV = () => {
    let csv = 'Invoice No,Date,Time,Table,Customer,Customer Phone,Customer GST,Steward,Payment Mode,Subtotal,Discount,Tax,Grand Total\n';
    filteredSales.forEach((s) => {
      csv += `"${s.invoiceNo}","${s.date}","${s.time}","${s.tableName}","${s.customerName || ''}","${s.customerPhone || ''}","${s.customerGst || ''}","${s.steward || ''}","${s.paymentMode}",${s.subtotal},${s.discount},${s.tax},${s.grandTotal}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Param_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-white flex items-center space-x-2">
              <span>Param Infotech - Reports & Business Analytics</span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                SALES & TAX
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Detailed sales registers, item-wise consumption, steward performance & GST audits
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 pb-2">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
          <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">{totalBills} Bills generated</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash Collection</span>
          <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">
            ₹{cashSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">Drawer Cash</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">UPI / QR Digital</span>
          <span className="text-lg font-mono font-bold text-sky-400 mt-0.5 block">
            ₹{upiSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">Online Portals</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit (Khata)</span>
          <span className="text-lg font-mono font-bold text-purple-400 mt-0.5 block">
            ₹{creditSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400">Outstanding Udhar</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Collection</span>
          <span className="text-lg font-mono font-bold text-indigo-400 mt-0.5 block">
            ₹{totalTax.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400">CGST + SGST (5%)</span>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="bg-slate-800/50 border-b border-slate-700/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('SALES_REGISTER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'SALES_REGISTER' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Bill Register
          </button>
          <button
            onClick={() => setActiveTab('ITEM_SALES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'ITEM_SALES' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Item & Category Sales
          </button>
          <button
            onClick={() => setActiveTab('STEWARD_SALES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'STEWARD_SALES' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Steward Performance
          </button>
          <button
            onClick={() => setActiveTab('TAX_SUMMARY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'TAX_SUMMARY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            Tax & Modes Summary
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px] font-mono focus:outline-none focus:border-emerald-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[10px] text-slate-400 hover:text-white px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400">Mode:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-[11px] focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Modes</option>
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="CARD">CARD</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 1: BILL REGISTER */}
        {activeTab === 'SALES_REGISTER' && (
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-900/70 border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Bill No.</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Table</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Steward</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-right">Tax (5%)</th>
                    <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-slate-500">
                        No sales bills matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-700/30 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{s.invoiceNo}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          <div>{s.date}</div>
                          <div className="text-[10px] text-slate-500">{s.time}</div>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">{s.tableName}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          <div>{s.customerName || '-'}</div>
                          {s.customerPhone && <div className="text-[10px] text-slate-500">{s.customerPhone}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{s.steward || '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px] font-bold">
                            {s.paymentMode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">₹{s.subtotal.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">₹{s.tax.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          ₹{s.grandTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ITEM & CATEGORY SALES */}
        {activeTab === 'ITEM_SALES' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Category breakdown */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden shadow-sm h-fit">
              <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Category-wise Sales
                </span>
              </div>
              <div className="divide-y divide-slate-700/60 max-h-96 overflow-y-auto">
                {itemAnalytics.categories.map((c) => (
                  <div key={c.category} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{c.category}</div>
                      <div className="text-[10px] text-slate-400">{c.qty} items sold</div>
                    </div>
                    <div className="font-mono font-bold text-amber-400 text-right">
                      ₹{c.revenue.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Items Table */}
            <div className="lg:col-span-2 bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Item-wise Sales Breakdown ({itemAnalytics.items.length} Items)
                </span>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead className="sticky top-0 bg-slate-900">
                    <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Qty Sold</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {itemAnalytics.items.map((it) => (
                      <tr key={it.name} className="hover:bg-slate-700/30 transition">
                        <td className="py-2 px-3 font-mono font-bold text-amber-400">{it.code}</td>
                        <td className="py-2 px-3 font-semibold text-white">{it.name}</td>
                        <td className="py-2 px-3 text-slate-400">{it.category}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-white">{it.qty}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                          ₹{it.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STEWARD SALES */}
        {activeTab === 'STEWARD_SALES' && (
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden shadow-sm max-w-2xl mx-auto">
            <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Steward / Captain Sales Performance
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-900/70 border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Captain / Steward Name</th>
                    <th className="py-2.5 px-3 text-center">Bills Handled</th>
                    <th className="py-2.5 px-3 text-right">Total Sales Generated (₹)</th>
                    <th className="py-2.5 px-3 text-right">Average Bill Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {stewardAnalytics.map((st) => (
                    <tr key={st.steward} className="hover:bg-slate-700/30 transition">
                      <td className="py-2.5 px-3 font-semibold text-white flex items-center space-x-2">
                        <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span>{st.steward}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">{st.billsCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        ₹{st.totalSales.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        ₹{(st.billsCount > 0 ? st.totalSales / st.billsCount : 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TAX & MODES SUMMARY */}
        {activeTab === 'TAX_SUMMARY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {/* Payment Modes */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5 text-amber-400">
                <CreditCard className="w-4 h-4" />
                <span>Payment Mode Breakdown</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-300">CASH Collection:</span>
                  <span className="font-mono font-bold text-white">₹{cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-300">UPI / QR Collection:</span>
                  <span className="font-mono font-bold text-white">₹{upiSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-300">Card (Debit/Credit):</span>
                  <span className="font-mono font-bold text-white">₹{cardSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-300">Credit (Khata Udhar):</span>
                  <span className="font-mono font-bold text-white">₹{creditSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold border-t border-slate-600 text-emerald-400 pt-2">
                  <span>Total Settled:</span>
                  <span className="font-mono">₹{totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* GST Summary */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5 text-sky-400">
                <FileText className="w-4 h-4" />
                <span>GST Tax Audit Summary</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-300">Total Taxable Value (Subtotal):</span>
                  <span className="font-mono font-bold text-white">
                    ₹{(totalRevenue - totalTax).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-300">CGST @ 2.5%:</span>
                  <span className="font-mono font-bold text-sky-400">₹{(totalTax / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                  <span className="text-slate-300">SGST @ 2.5%:</span>
                  <span className="font-mono font-bold text-sky-400">₹{(totalTax / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold border-t border-slate-600 text-indigo-400 pt-2">
                  <span>Total GST Collected:</span>
                  <span className="font-mono">₹{totalTax.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
