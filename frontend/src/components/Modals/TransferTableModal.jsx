import React, { useState, useEffect, useRef } from 'react';
import { ArrowRightLeft, X, Check, AlertCircle } from 'lucide-react';

export default function TransferTableModal({
  isOpen,
  onClose,
  currentTable,
  tables = [],
  runningOrders = {},
  orderItems = [],
  onTransferConfirm
}) {
  const [targetTableId, setTargetTableId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Focus input and reset state on open
  useEffect(() => {
    if (isOpen) {
      setTargetTableId('');
      setErrorMsg('');
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentTable) return null;

  const currentTotal = orderItems.reduce((acc, i) => acc + (i.rate * i.qty), 0);
  const currentItemCount = orderItems.reduce((acc, i) => acc + i.qty, 0);

  // Available candidate tables (excluding current table)
  const candidateTables = tables.filter(t => t.id !== currentTable.id);

  const matchedTarget = tables.find(
    t => t.id.toUpperCase() === targetTableId.trim().toUpperCase()
  );

  const handleConfirm = async () => {
    const targetCode = targetTableId.trim().toUpperCase();
    if (!targetCode) {
      setErrorMsg('Please enter or select a target table.');
      return;
    }

    if (targetCode === currentTable.id.toUpperCase()) {
      setErrorMsg('Target table cannot be the same as current table.');
      return;
    }

    if (!matchedTarget) {
      setErrorMsg(`Table "${targetCode}" does not exist in master tables.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const success = await onTransferConfirm(currentTable.id, matchedTarget.id);
      if (success) {
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  const isTargetOccupied = matchedTarget && (
    matchedTarget.status === 'OCCUPIED' || Boolean(runningOrders[matchedTarget.id]?.items?.length)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">Transfer Table</h3>
              <p className="text-[11px] text-slate-400">Shift active order to another dining table</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Source Table Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source Table</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="font-mono font-black text-sm text-brand-orange bg-orange-100 px-2 py-0.5 rounded-md">
                  {currentTable.id}
                </span>
                <span className="text-xs font-bold text-slate-800">{currentTable.name}</span>
                <span className="text-[10px] text-slate-400">({currentTable.area})</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">{currentItemCount} items</span>
              <span className="font-mono font-bold text-xs text-slate-800">₹{currentTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Arrow Divider */}
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
              <ArrowRightLeft className="w-4 h-4 rotate-90 sm:rotate-0" />
            </div>
          </div>

          {/* Target Table Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Transfer To Table <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter Table ID (e.g. T2, AC1)"
                value={targetTableId}
                onChange={(e) => {
                  setTargetTableId(e.target.value.toUpperCase());
                  setErrorMsg('');
                }}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
              {matchedTarget && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold flex items-center space-x-1 text-emerald-600">
                  <Check className="w-3.5 h-3.5" />
                  <span>{matchedTarget.name}</span>
                </span>
              )}
            </div>

            {/* Occupied Warning */}
            {isTargetOccupied && (
              <div className="flex items-center space-x-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg mt-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Notice: Table {matchedTarget.id} is occupied. Items will be merged.</span>
              </div>
            )}

            {errorMsg && (
              <p className="text-[11px] text-red-600 font-semibold">{errorMsg}</p>
            )}
          </div>

          {/* Quick Pick Table Grid */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Select Available Table:
            </span>
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
              {candidateTables.map((tbl) => {
                const isSelected = targetTableId === tbl.id;
                const isRunning = tbl.status === 'OCCUPIED' || Boolean(runningOrders[tbl.id]?.items?.length);

                return (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => {
                      setTargetTableId(tbl.id);
                      setErrorMsg('');
                    }}
                    className={`p-2 rounded-lg text-center transition cursor-pointer border ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : isRunning
                        ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-mono font-black text-xs">{tbl.id}</div>
                    <div className={`text-[9px] font-semibold truncate ${isSelected ? 'text-sky-100' : isRunning ? 'text-amber-700' : 'text-emerald-600'}`}>
                      {isRunning ? 'Occupied' : 'Free'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!targetTableId.trim() || isSubmitting}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 flex items-center space-x-1.5 shadow-sm shadow-sky-600/20"
          >
            {isSubmitting ? (
              <span>Transferring...</span>
            ) : (
              <>
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Confirm Transfer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
