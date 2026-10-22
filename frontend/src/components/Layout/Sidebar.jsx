import React from 'react';
import {
  Receipt,
  Settings2,
  Flame,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Command
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
  kotsCount = 0,
  isCollapsed = false,
  setIsCollapsed,
}) {
  const menuItems = [
    {
      id: 'BILLING',
      label: 'Bill / POS Billing',
      sublabel: 'Fast Table & Counter POS',
      icon: Receipt,
      badge: null,
      color: 'text-amber-400',
      activeClass: 'bg-slate-800 text-white shadow-inner border-l-4 border-brand-orange',
    },
    {
      id: 'MASTERS',
      label: 'Master Management',
      sublabel: 'Items, Categories & Tables',
      icon: Settings2,
      badge: null,
      color: 'text-sky-400',
      activeClass: 'bg-slate-800 text-white shadow-inner border-l-4 border-sky-500',
    },
    {
      id: 'KITCHEN',
      label: 'Live Kitchen / KOT',
      sublabel: 'Realtime Kitchen Ticket Cards',
      icon: Flame,
      badge: kotsCount > 0 ? kotsCount : null,
      color: 'text-orange-400',
      activeClass: 'bg-slate-800 text-white shadow-inner border-l-4 border-amber-500',
    },
    {
      id: 'REPORTS',
      label: 'Sales & Reports',
      sublabel: 'Daily Collection & Tax Invoices',
      icon: BarChart3,
      badge: null,
      color: 'text-emerald-400',
      activeClass: 'bg-slate-800 text-white shadow-inner border-l-4 border-emerald-500',
    },
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Menu Header & List */}
      <div className="py-3 px-2 flex-1 space-y-1.5">
        <div className="px-2 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          {!isCollapsed && <span>Navigation Menu</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition ml-auto cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative cursor-pointer ${
                isActive
                  ? item.activeClass
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition ${
                  isActive ? 'text-white' : item.color
                } ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
              />

              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== null && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1.5 bg-amber-500 text-slate-900 animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">
                    {item.sublabel}
                  </div>
                </div>
              )}

              {/* Collapsed Badge Dot */}
              {isCollapsed && item.badge !== null && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Pro Shortcuts */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 m-2 rounded-xl bg-slate-800/40">
          <div className="font-bold text-[11px] text-slate-300 flex items-center space-x-1 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Fast POS Hotkeys</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-400">
            <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <b className="text-amber-400">F8:</b> KOT Fire
            </div>
            <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <b className="text-emerald-400">F9:</b> Settle & Print
            </div>
            <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <b className="text-sky-400">F4:</b> New Bill
            </div>
            <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <b className="text-slate-300">Esc:</b> Close Modal
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
