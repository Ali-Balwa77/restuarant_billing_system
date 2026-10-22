import React from 'react';
import { Flame, Clock, CheckCircle2, AlertCircle, ChefHat } from 'lucide-react';
import { api } from '../../services/api';

export default function KitchenView({ kots = [], onRefresh }) {
  const handleStatusChange = async (kotNo, newStatus) => {
    try {
      await api.updateKotStatus(kotNo, newStatus);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden p-3">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-inspire-800 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center text-white">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center space-x-2">
                <span>Live Kitchen Order Tickets (KOT)</span>
                <span className="text-xs bg-amber-500 text-slate-900 font-bold px-2 py-0.5 rounded-full">
                  {kots.length} Active
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Real-time kitchen order tickets fired from billing tables
              </p>
            </div>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
          {kots.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <ChefHat className="w-16 h-16 text-slate-300 mb-2" />
              <p className="font-bold text-slate-600">No active kitchen orders</p>
              <p className="text-xs text-slate-400">
                Fired KOT tickets from tables will automatically appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kots.map((kot) => {
                const isPending = kot.status === 'PENDING';
                const isPrep = kot.status === 'PREPARING';
                const isReady = kot.status === 'READY';

                return (
                  <div
                    key={kot.kotNo}
                    className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col justify-between transition ${
                      isPending
                        ? 'border-amber-400 shadow-amber-500/10'
                        : isPrep
                        ? 'border-sky-400 shadow-sky-500/10'
                        : 'border-emerald-500 shadow-emerald-500/10'
                    }`}
                  >
                    {/* Ticket Header */}
                    <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-black text-sm text-slate-800">{kot.kotNo}</div>
                        <div className="text-xs font-bold text-brand-orange">{kot.tableName}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 font-mono flex items-center space-x-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>{kot.time}</span>
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="p-3.5 space-y-2 flex-1">
                      {Array.isArray(kot.items) &&
                        kot.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="font-bold text-slate-800">
                              <span className="font-mono text-brand-orange mr-1.5">{item.qty}x</span>
                              <span>{item.name}</span>
                            </div>
                            {item.notes && (
                              <span className="text-[10px] italic text-slate-400 max-w-[120px] truncate">
                                {item.notes}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Status Action Buttons */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isPrep
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {kot.status}
                      </span>

                      <div className="flex space-x-1.5">
                        {isPending && (
                          <button
                            onClick={() => handleStatusChange(kot.kotNo, 'PREPARING')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-[11px] transition"
                          >
                            Start Prep
                          </button>
                        )}
                        {isPrep && (
                          <button
                            onClick={() => handleStatusChange(kot.kotNo, 'READY')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition"
                          >
                            Mark Ready
                          </button>
                        )}
                        {isReady && (
                          <button
                            onClick={() => handleStatusChange(kot.kotNo, 'SERVED')}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-[11px] transition"
                          >
                            Mark Served
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
