import React from 'react';
import {
  Receipt,
  Settings2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
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
      className={`bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-all duration-200 select-none ${isCollapsed ? 'w-16' : 'w-64'
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
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition group relative cursor-pointer ${isActive
                ? item.activeClass
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition ${isActive ? 'text-white' : item.color
                  } ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
              />

              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">
                    {item.sublabel}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
