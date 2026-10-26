import React, { useState } from 'react';
import { UtensilsCrossed, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('A');
  const [password, setPassword] = useState('A');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.login(username.trim(), password.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Invalid username or password');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-7 shadow-2xl z-10">
        {/* Restaurant Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-orange to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-orange/30 text-white">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Alinea Restaurant & Banquet
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            FAST POS & RESTAURANT MANAGEMENT SYSTEM
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 bg-red-900/40 border border-red-700/60 text-red-200 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Username / User ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-900/90 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password / PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-900/90 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-brand-orange/20 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <span>Login to POS Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Login Chips */}
        <div className="mt-6 pt-5 border-t border-slate-700/60">
          <div className="text-[11px] text-slate-400 text-center mb-2 font-medium">
            Quick Fill Accounts:
          </div>
          <div className="flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => handleQuickFill('A', 'A')}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white rounded-lg text-xs font-mono transition border border-amber-500/40 cursor-pointer font-bold"
            >
              Param User: <span className="text-amber-300">A / A</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('cashier', '1234')}
              className="px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition border border-slate-600/60 cursor-pointer"
            >
              Cashier: <span className="text-emerald-400 font-bold">1234</span>
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="text-[10px] text-slate-500 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>SQLite Offline & Local Network Synchronized</span>
          </span>
        </div>
      </div>
    </div>
  );
}
