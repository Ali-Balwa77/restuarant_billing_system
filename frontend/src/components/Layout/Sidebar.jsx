import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Receipt,
  Printer,
  Settings2,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Monitor,
  Database,
  Sliders,
  ChevronLeft
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
  isCollapsed = false,
  setIsCollapsed,
}) {
  // Tree expansion states
  const [openSections, setOpenSections] = useState({
    master: false,
    transaction: true, // open by default as in Image 2
    reports: false,
    utilities: false,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <aside
      className={`bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="py-2.5 px-2 flex-1 overflow-y-auto">
        {/* Sidebar Header */}
        <div className="px-2 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between border-b border-slate-800/80 mb-2">
          {!isCollapsed && <span>Navigation Tree</span>}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition ml-auto cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {isCollapsed ? (
          /* Collapsed Icon Bar */
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setActiveView('CONSOLE')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                activeView === 'CONSOLE' ? 'bg-brand-orange text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Console Root"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('BILLING')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                activeView === 'BILLING' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Bill"
            >
              <Receipt className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('BULK_BILL')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                activeView === 'BULK_BILL' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Bulk Bill Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('MASTERS')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                activeView === 'MASTERS' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Master"
            >
              <Settings2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveView('REPORTS')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                activeView === 'REPORTS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Reports"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Tree View matching Image 2 */
          <div className="font-mono text-xs space-y-1">
            {/* Root: Console Root */}
            <div
              onClick={() => setActiveView('CONSOLE')}
              className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                activeView === 'CONSOLE'
                  ? 'bg-slate-800 text-amber-400 font-bold border-l-2 border-brand-orange'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <Monitor className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-sans font-bold text-xs tracking-tight">Console Root</span>
            </div>

            {/* Tree branches */}
            <div className="pl-3 space-y-1 border-l border-slate-700/60 ml-3 mt-1">
              {/* Branch 1: Master */}
              <div>
                <div
                  onClick={() => {
                    toggleSection('master');
                    setActiveView('MASTERS');
                  }}
                  className={`flex items-center space-x-1.5 px-2 py-1 rounded cursor-pointer transition ${
                    activeView === 'MASTERS'
                      ? 'bg-slate-800 text-sky-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  {openSections.master ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {openSections.master ? (
                    <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span className="font-sans font-semibold text-xs">Master</span>
                </div>

                {openSections.master && (
                  <div className="pl-5 space-y-1 border-l border-slate-700/60 ml-2.5 my-1">
                    <div
                      onClick={() => setActiveView('MASTERS')}
                      className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 rounded"
                    >
                      • Items & Categories
                    </div>
                    <div
                      onClick={() => setActiveView('MASTERS')}
                      className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 rounded"
                    >
                      • Tables Master
                    </div>
                  </div>
                )}
              </div>

              {/* Branch 2: Transaction (Contains Bill and Bulk Bill Print) */}
              <div>
                <div
                  onClick={() => toggleSection('transaction')}
                  className="flex items-center space-x-1.5 px-2 py-1 rounded cursor-pointer text-slate-300 hover:bg-slate-800/50 transition font-sans font-semibold text-xs"
                >
                  {openSections.transaction ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {openSections.transaction ? (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Transaction</span>
                </div>

                {openSections.transaction && (
                  <div className="pl-4 space-y-1 border-l border-slate-700/60 ml-2.5 my-1">
                    {/* Item 1: Bill */}
                    <div
                      onClick={() => setActiveView('BILLING')}
                      className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition ${
                        activeView === 'BILLING'
                          ? 'bg-brand-orange text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span className="font-sans text-xs">Bill</span>
                    </div>

                    {/* Item 2: Bulk Bill Print */}
                    <div
                      onClick={() => setActiveView('BULK_BILL')}
                      className={`flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition ${
                        activeView === 'BULK_BILL'
                          ? 'bg-sky-600 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="font-sans text-xs">Bulk Bill Print</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Branch 3: Reports */}
              <div>
                <div
                  onClick={() => {
                    toggleSection('reports');
                    setActiveView('REPORTS');
                  }}
                  className={`flex items-center space-x-1.5 px-2 py-1 rounded cursor-pointer transition ${
                    activeView === 'REPORTS'
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  {openSections.reports ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {openSections.reports ? (
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="font-sans font-semibold text-xs">Reports</span>
                </div>

                {openSections.reports && (
                  <div className="pl-5 space-y-1 border-l border-slate-700/60 ml-2.5 my-1">
                    <div
                      onClick={() => setActiveView('REPORTS')}
                      className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 rounded"
                    >
                      • Daily Sales Report
                    </div>
                    <div
                      onClick={() => setActiveView('REPORTS')}
                      className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 rounded"
                    >
                      • Tax Summary Report
                    </div>
                  </div>
                )}
              </div>

              {/* Branch 4: Utilities */}
              <div>
                <div
                  onClick={() => toggleSection('utilities')}
                  className="flex items-center space-x-1.5 px-2 py-1 rounded cursor-pointer text-slate-300 hover:bg-slate-800/50 transition font-sans font-semibold text-xs"
                >
                  {openSections.utilities ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  {openSections.utilities ? (
                    <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>Utilities</span>
                </div>

                {openSections.utilities && (
                  <div className="pl-5 space-y-1 border-l border-slate-700/60 ml-2.5 my-1">
                    <div
                      onClick={() => setActiveView('MASTERS')}
                      className="px-2 py-0.5 text-[11px] text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/40 rounded"
                    >
                      • Restaurant Settings
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
