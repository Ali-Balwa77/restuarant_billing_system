import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Clock, User, LogOut, Database } from 'lucide-react';

export default function Navbar({
  restaurant,
  user,
  onLogout,
  onNewBill,
  onNavigateHome,
  isOnline = true
}) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-inspire-800 text-white border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between shadow-md select-none z-30">
      {/* Brand Identity */}
      <div
        onClick={onNavigateHome}
        className="flex items-center space-x-3 cursor-pointer group"
        title="Go to Console Root"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-orange to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-orange/20">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base tracking-tight text-white">
              {restaurant?.name || 'Alinea Restaurant & Banquet'}
            </span>
            <span className="text-[10px] bg-brand-orange text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              POS v2.0
            </span>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center space-x-2">
            <span>{restaurant?.tagline || 'Pure Veg & Multi-Cuisine'}</span>
            <span>•</span>
            <span className="flex items-center space-x-1 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{time}</span>
            </span>
            <span>•</span>
            <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${
              isOnline ? 'text-emerald-400 bg-emerald-950/60' : 'text-red-400 bg-red-950/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span>{isOnline ? 'SQLite Live' : 'Offline'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* User Actions & Logout */}
      <div className="flex items-center space-x-3">

        {/* Current User Badge */}
        <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-700/70 px-3 py-1.5 rounded-lg text-xs">
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-[11px]">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="text-left hidden md:block">
            <div className="font-bold text-white text-[11px] leading-tight">{user?.name || 'User'}</div>
            <div className="text-[10px] text-slate-400 font-mono leading-tight">{user?.role || 'Staff'}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition cursor-pointer"
          title="Sign out of POS"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
