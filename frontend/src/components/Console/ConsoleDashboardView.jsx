import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Printer,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Eye,
  UtensilsCrossed,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ConsoleDashboardView({
  currentUser,
  onOpenBill,
  onOpenBulkBill,
  salesCount = 0,
  restaurant
}) {
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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* 1. TOP TOOLBAR matching Image 2 */}
      <div className="bg-slate-800 text-white border-b border-slate-700/80 px-3 py-1.5 flex items-center justify-between text-xs font-bold shrink-0 shadow-xs">
        <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap">
          <button
            type="button"
            disabled
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700/50 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed"
          >
            <ChevronFirst className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">First</span>
          </button>
          <button
            type="button"
            disabled
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700/50 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            type="button"
            disabled
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700/50 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next</span>
          </button>
          <button
            type="button"
            disabled
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700/50 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed"
          >
            <ChevronLast className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Last</span>
          </button>

          <span className="w-px h-5 bg-slate-700 mx-1 hidden sm:block"></span>

          <button
            type="button"
            onClick={onOpenBill}
            className="flex items-center space-x-1 px-3 py-1 bg-brand-orange hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Open Bill"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          <button
            type="button"
            onClick={onOpenBill}
            className="flex items-center space-x-1 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            title="View Bills"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block">
          Restaura's [Restaurant Billing & Management System]
        </div>
      </div>

      {/* 2. SUBHEADER STRIP matching Image 2: User : A | Entry Name | Date : 22-10-2026 22:26 */}
      <div className="bg-amber-100/90 text-amber-950 border-b border-amber-200/90 px-4 py-1.5 flex items-center justify-between text-xs font-bold shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">User :</span>
          <span className="bg-amber-200/90 px-2 py-0.5 rounded text-amber-950 font-black">
            {currentUser?.username?.toUpperCase() || currentUser?.name || 'A'}
          </span>
        </div>

        <div className="font-extrabold text-sm tracking-wide uppercase text-amber-900">
          Entry Name
        </div>

        <div className="flex items-center space-x-1.5 font-mono text-slate-700">
          <span className="font-semibold">Date :</span>
          <span>{liveTime}</span>
        </div>
      </div>

      {/* 3. CENTER WORKSPACE: Desktop Shortcut Cards for "Bill" and "Bulk Bill Print" */}
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center relative overflow-y-auto">
        {/* Subtle decorative background watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <UtensilsCrossed className="w-96 h-96 text-slate-900" />
        </div>

        <div className="max-w-3xl w-full z-10 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              {restaurant?.name || 'Alinea Restaurant & Banquet'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Select an operational module from below or use the console tree on the left
            </p>
          </div>

          {/* Desktop Tiles matching Image 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto pt-4">
            {/* Tile 1: Bill */}
            <div
              onClick={onOpenBill}
              className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-brand-orange p-6 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col items-center text-center transform hover:-translate-y-1"
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-400 to-brand-orange flex items-center justify-center text-white shadow-lg shadow-brand-orange/30 group-hover:scale-105 transition duration-200">
                <Receipt className="w-12 h-12" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-800 group-hover:text-brand-orange transition">
                Bill
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-snug">
                Table & Counter Billing, KOT, and Order Settlement
              </p>
              <div className="mt-4 flex items-center space-x-1 text-xs font-bold text-brand-orange group-hover:underline">
                <span>Open Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Tile 2: Bulk Bill Print */}
            <div
              onClick={onOpenBulkBill}
              className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-sky-500 p-6 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col items-center text-center transform hover:-translate-y-1"
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 group-hover:scale-105 transition duration-200">
                <Printer className="w-12 h-12" />
              </div>
              <h3 className="mt-4 text-base font-black text-slate-800 group-hover:text-sky-600 transition">
                Bulk Bill Print
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-snug">
                Batch Print Invoices, Date Range Search & Export
              </p>
              <div className="mt-4 flex items-center space-x-1 text-xs font-bold text-sky-600 group-hover:underline">
                <span>Open Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM STATUS BAR matching Image 2 */}
      <div className="bg-slate-200 border-t border-slate-300 px-4 py-1 flex items-center justify-between text-[11px] text-slate-600 font-mono shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-700">System Ready</span>
        </div>
        <div>
          <span>Ver : 2.2.0</span>
        </div>
      </div>
    </div>
  );
}
