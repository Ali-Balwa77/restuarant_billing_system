import React from 'react';
import { FileText, Download, IndianRupee, CreditCard, Banknote, TrendingUp } from 'lucide-react';

export default function ReportsView({ sales = [], restaurant = {} }) {
  const totalRevenue = sales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalBills = sales.length;
  const cashSales = sales.filter(s => s.paymentMode === 'CASH').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const upiSales = sales.filter(s => s.paymentMode === 'UPI').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const cardSales = sales.filter(s => s.paymentMode === 'CARD').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalTax = sales.reduce((acc, s) => acc + (s.tax || 0), 0);

  // CSV Export
  const handleExportCSV = () => {
    let csv = 'Invoice No,Date,Time,Table,Customer,Customer GST,Payment Mode,Subtotal,Discount,Tax,Grand Total\n';
    sales.forEach(s => {
      csv += `"${s.invoiceNo}","${s.date}","${s.time}","${s.tableName}","${s.customerName}","${s.customerGst || ''}","${s.paymentMode}",${s.subtotal},${s.discount},${s.tax},${s.grandTotal}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden p-3">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-inspire-800 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center space-x-2">
                <span>Sales Invoices & Revenue Analytics</span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Live transaction history directly fetched from SQLite database
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Revenue
              </span>
              <span className="text-xl font-black font-mono text-emerald-700 mt-0.5 block">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{totalBills} Bills generated</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Cash Collection
              </span>
              <span className="text-xl font-black font-mono text-amber-700 mt-0.5 block">
                ₹{cashSales.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Counter Drawer Cash</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                UPI / QR Sales
              </span>
              <span className="text-xl font-black font-mono text-sky-700 mt-0.5 block">
                ₹{upiSales.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Digital Payments</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total GST Tax
              </span>
              <span className="text-xl font-black font-mono text-indigo-700 mt-0.5 block">
                ₹{totalTax.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">CGST + SGST</span>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Detailed Bill Settlement Log
            </div>
            {sales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No invoices settled yet. Completed bills will be logged here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Date & Time</th>
                      <th className="p-2.5">Table</th>
                      <th className="p-2.5">Guest</th>
                      <th className="p-2.5">Payment</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                      <th className="p-2.5 text-right">Discount</th>
                      <th className="p-2.5 text-right">Tax</th>
                      <th className="p-2.5 text-right">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {sales.map((s) => (
                      <tr key={s.id || s.invoiceNo} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-mono font-bold text-brand-orange">{s.invoiceNo}</td>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">{s.date} {s.time}</td>
                        <td className="p-2.5 font-bold text-slate-800">{s.tableName}</td>
                        <td className="p-2.5 text-slate-600">
                          <div>{s.customerName || 'Walk-in'}</div>
                          {s.customerGst && (
                            <div className="text-[10px] text-slate-400 font-mono">GST: {s.customerGst}</div>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-200 text-slate-800">
                            {s.paymentMode}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">₹{s.subtotal}</td>
                        <td className="p-2.5 text-right font-mono text-red-600">-₹{s.discount}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">₹{s.tax}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{s.grandTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
