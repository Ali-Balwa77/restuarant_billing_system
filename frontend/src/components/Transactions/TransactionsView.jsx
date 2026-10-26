import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  DollarSign,
  UserCheck,
  Ban,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export default function TransactionsView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('EXPENSES'); // 'CASH_FLOW', 'EXPENSES', 'RECEIPTS', 'VOID_KOT'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Data states
  const [cashFlow, setCashFlow] = useState({
    date: new Date().toISOString().slice(0, 10),
    cashSales: 0,
    digitalSales: 0,
    customerCashReceipts: 0,
    banquetCash: 0,
    totalCashIn: 0,
    cashExpenses: 0,
    totalCashOut: 0,
    netCashInHand: 0,
  });

  const [expenses, setExpenses] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState({ todayTotal: 0, allTotal: 0, byCategory: [] });
  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [voidKots, setVoidKots] = useState([]);

  // Form states
  const [newExpense, setNewExpense] = useState({
    category: 'Vegetables & Fruits',
    amount: '',
    paid_to: '',
    payment_mode: 'CASH',
    remarks: '',
  });

  const [newReceipt, setNewReceipt] = useState({
    customer_id: '',
    amount: '',
    payment_mode: 'CASH',
    remarks: '',
  });

  const categories = [
    'Vegetables & Fruits',
    'Dairy & Milk',
    'Kitchen Grocery',
    'Gas & Fuel',
    'Repairs & Maintenance',
    'Staff Salary & Advance',
    'Tea & Refreshment',
    'Cleaning & Hygiene',
    'Stationery & Printing',
    'Miscellaneous'
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfRes, expRes, sumRes, recRes, custRes, voidRes] = await Promise.all([
        api.getCashFlow(),
        api.getExpenses(),
        api.getExpenseSummary(),
        api.getCustomerReceipts(),
        api.getCustomers(),
        api.getVoidKots()
      ]);

      if (cfRes?.data) setCashFlow(cfRes.data);
      if (expRes?.data) setExpenses(expRes.data);
      if (sumRes?.data) setExpenseSummary(sumRes.data);
      if (recRes?.data) setReceipts(recRes.data);
      if (custRes?.data) setCustomers(custRes.data);
      if (voidRes?.data) setVoidKots(voidRes.data);
    } catch (err) {
      console.error('Error loading transaction data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg, isSuccess = true) => {
    setNotification({ msg, isSuccess });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      showNotification('Please enter a valid expense amount', false);
      return;
    }

    try {
      const res = await api.createExpense({
        ...newExpense,
        created_by: currentUser?.name || 'Admin',
      });
      if (res.success) {
        showNotification('Expense recorded successfully!');
        setNewExpense({
          category: 'Vegetables & Fruits',
          amount: '',
          paid_to: '',
          payment_mode: 'CASH',
          remarks: '',
        });
        loadData();
      }
    } catch (err) {
      showNotification(err.message, false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense entry?')) return;
    try {
      await api.deleteExpense(id);
      showNotification('Expense deleted');
      loadData();
    } catch (err) {
      showNotification(err.message, false);
    }
  };

  // Add Customer Credit Receipt
  const handleAddReceipt = async (e) => {
    e.preventDefault();
    if (!newReceipt.customer_id) {
      showNotification('Please select a credit customer', false);
      return;
    }
    if (!newReceipt.amount || Number(newReceipt.amount) <= 0) {
      showNotification('Please enter a valid received amount', false);
      return;
    }

    try {
      const res = await api.createCustomerReceipt(newReceipt);
      if (res.success) {
        showNotification(res.message);
        setNewReceipt({ customer_id: '', amount: '', payment_mode: 'CASH', remarks: '' });
        loadData();
      }
    } catch (err) {
      showNotification(err.message, false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-white flex items-center space-x-2">
              <span>Param Infotech - Transactions & Accounts</span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                CASH REGISTER
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Manage daily cash expenses, credit customer receipts, void KOT tracking & cash flow
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center space-x-1.5 text-slate-200 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`px-4 py-2 text-xs flex items-center space-x-2 border-b ${
            notification.isSuccess
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
              : 'bg-red-950/80 text-red-200 border-red-800'
          }`}
        >
          {notification.isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="bg-slate-800/50 border-b border-slate-700/60 px-4 flex items-center space-x-1">
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'EXPENSES'
              ? 'border-brand-orange text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5 text-red-400" />
          <span>Cash Expense Entry (Kharch)</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'RECEIPTS'
              ? 'border-brand-orange text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Customer Cash Receipts (Khata Jama)</span>
        </button>

        <button
          onClick={() => setActiveTab('CASH_FLOW')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'CASH_FLOW'
              ? 'border-brand-orange text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-sky-400" />
          <span>Cash Flow Statement</span>
        </button>

        <button
          onClick={() => setActiveTab('VOID_KOT')}
          className={`px-4 py-2.5 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'VOID_KOT'
              ? 'border-brand-orange text-amber-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          <Ban className="w-3.5 h-3.5 text-purple-400" />
          <span>Void / Cancelled KOTs</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 1: EXPENSES */}
        {activeTab === 'EXPENSES' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Add Expense Form */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 shadow-sm h-fit">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5 text-amber-400">
                <Plus className="w-4 h-4" />
                <span>New Expense Entry</span>
              </h2>

              <form onSubmit={handleAddExpense} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Expense Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="Enter amount (e.g. 1500)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Paid To / Supplier / Vendor</label>
                  <input
                    type="text"
                    value={newExpense.paid_to}
                    onChange={(e) => setNewExpense({ ...newExpense, paid_to: e.target.value })}
                    placeholder="e.g. APMC Mandi, Amul Parlour, Electrician"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={newExpense.payment_mode}
                    onChange={(e) => setNewExpense({ ...newExpense, payment_mode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Remarks / Note</label>
                  <textarea
                    rows="2"
                    value={newExpense.remarks}
                    onChange={(e) => setNewExpense({ ...newExpense, remarks: e.target.value })}
                    placeholder="Brief description of items purchased or expense reason"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Expense</span>
                </button>
              </form>

              {/* Expense Category Summary */}
              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category Breakdown
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {expenseSummary.byCategory.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-300 truncate">{cat.category}</span>
                      <span className="font-mono font-bold text-amber-400">₹{cat.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Expenses Table */}
            <div className="lg:col-span-2 bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm">
              <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Expense Register ({expenses.length} Entries)
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  Today's Total: ₹{expenseSummary.todayTotal.toFixed(2)}
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3">No.</th>
                      <th className="py-2 px-3">Date/Time</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Paid To</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500">
                          No expense entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-700/30 transition">
                          <td className="py-2 px-3 font-mono text-amber-400">{exp.expense_no}</td>
                          <td className="py-2 px-3 text-slate-300">
                            <div>{exp.date}</div>
                            <div className="text-[10px] text-slate-500">{exp.time}</div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-200">
                            <div>{exp.paid_to}</div>
                            {exp.remarks && <div className="text-[10px] text-slate-400">{exp.remarks}</div>}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                              {exp.payment_mode}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-red-400">
                            ₹{Number(exp.amount).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER CREDIT RECEIPTS */}
        {activeTab === 'RECEIPTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Add Receipt Form */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 shadow-sm h-fit">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5 text-emerald-400">
                <Plus className="w-4 h-4" />
                <span>Receive Khata Payment (Udhar Vasooli)</span>
              </h2>

              <form onSubmit={handleAddReceipt} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Select Credit Customer</label>
                  <select
                    value={newReceipt.customer_id}
                    onChange={(e) => {
                      const cust = customers.find((c) => c.id === e.target.value);
                      setNewReceipt({
                        ...newReceipt,
                        customer_id: e.target.value,
                        amount: cust ? cust.credit_due : '',
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Due: ₹{c.credit_due?.toFixed(2) || '0.00'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Received Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newReceipt.amount}
                    onChange={(e) => setNewReceipt({ ...newReceipt, amount: e.target.value })}
                    placeholder="Enter received amount"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={newReceipt.payment_mode}
                    onChange={(e) => setNewReceipt({ ...newReceipt, payment_mode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI / GPay / QR</option>
                    <option value="CHEQUE">Cheque / Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={newReceipt.remarks}
                    onChange={(e) => setNewReceipt({ ...newReceipt, remarks: e.target.value })}
                    placeholder="e.g. Monthly bill clearance, Part payment"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Record Receipt & Clear Balance</span>
                </button>
              </form>
            </div>

            {/* Right: Receipts Table */}
            <div className="lg:col-span-2 bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm">
              <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Khata Receipts Register ({receipts.length} Receipts)
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3">Receipt No.</th>
                      <th className="py-2 px-3">Date/Time</th>
                      <th className="py-2 px-3">Customer Name</th>
                      <th className="py-2 px-3">Mode</th>
                      <th className="py-2 px-3">Remarks</th>
                      <th className="py-2 px-3 text-right">Received Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500">
                          No receipts recorded yet.
                        </td>
                      </tr>
                    ) : (
                      receipts.map((rcp) => (
                        <tr key={rcp.id} className="hover:bg-slate-700/30 transition">
                          <td className="py-2 px-3 font-mono text-emerald-400">{rcp.receipt_no}</td>
                          <td className="py-2 px-3 text-slate-300">
                            <div>{rcp.date}</div>
                            <div className="text-[10px] text-slate-500">{rcp.time}</div>
                          </td>
                          <td className="py-2 px-3 font-semibold text-white">{rcp.customer_name}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                              {rcp.payment_mode}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">{rcp.remarks || '-'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                            ₹{Number(rcp.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CASH FLOW STATEMENT */}
        {activeTab === 'CASH_FLOW' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Daily Cash Register & Cash Flow Summary
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Date: <span className="text-amber-400 font-mono font-bold">{cashFlow.date}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase font-bold">Net Cash In Hand</div>
                  <div className={`text-xl font-mono font-extrabold ${cashFlow.netCashInHand >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{cashFlow.netCashInHand.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Inflows vs Outflows Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {/* Cash Inflows */}
                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase mb-3">
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Total Cash Inflows</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-300">Cash Sales (Food Bills):</span>
                      <span className="font-mono font-bold text-white">₹{cashFlow.cashSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-300">Customer Credit Receipts (Cash):</span>
                      <span className="font-mono font-bold text-white">₹{cashFlow.customerCashReceipts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-300">Banquet Cash Advances:</span>
                      <span className="font-mono font-bold text-white">₹{cashFlow.banquetCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm font-bold pt-2 border-t border-emerald-500/40 text-emerald-400">
                      <span>Total Cash In:</span>
                      <span className="font-mono">₹{cashFlow.totalCashIn.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Cash Outflows */}
                <div className="bg-slate-900/60 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase mb-3">
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>Total Cash Outflows</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-300">Cash Expenses (Petty Cash/Kharch):</span>
                      <span className="font-mono font-bold text-white">₹{cashFlow.cashExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm font-bold pt-2 border-t border-red-500/40 text-red-400 mt-auto">
                      <span>Total Cash Out:</span>
                      <span className="font-mono">₹{cashFlow.totalCashOut.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Digital Collection Info */}
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Digital / UPI / Card Sales:</span>
                      <span className="font-mono font-bold text-sky-400">₹{cashFlow.digitalSales.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VOID KOTs */}
        {activeTab === 'VOID_KOT' && (
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ban className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Void & Cancelled Order Tickets ({voidKots.length} Records)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-3">Date/Time</th>
                    <th className="py-2 px-3">KOT No.</th>
                    <th className="py-2 px-3">Table</th>
                    <th className="py-2 px-3">Cancellation Reason</th>
                    <th className="py-2 px-3">Cancelled By</th>
                    <th className="py-2 px-3 text-right">Approx Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {voidKots.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No void or cancelled KOTs recorded.
                      </td>
                    </tr>
                  ) : (
                    voidKots.map((vk) => (
                      <tr key={vk.id} className="hover:bg-slate-700/30 transition">
                        <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">{vk.created_at}</td>
                        <td className="py-2 px-3 font-mono font-bold text-purple-400">{vk.kot_no}</td>
                        <td className="py-2 px-3 font-bold text-white">{vk.table_name}</td>
                        <td className="py-2 px-3 text-red-300 font-medium">{vk.reason}</td>
                        <td className="py-2 px-3 text-slate-400">{vk.cancelled_by}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-300">
                          ₹{Number(vk.total_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
