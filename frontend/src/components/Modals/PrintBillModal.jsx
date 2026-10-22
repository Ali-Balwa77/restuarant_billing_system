import React, { useEffect } from 'react';
import { X, Printer } from 'lucide-react';

export default function PrintBillModal({ isOpen, onClose, billData, restaurant }) {
  useEffect(() => {
    if (isOpen && billData) {
      const timer = setTimeout(() => {
        window.print();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, billData]);

  if (!isOpen || !billData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs">Thermal Receipt Preview (80mm)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 80mm Thermal Receipt Slip */}
        <div className="p-4 bg-slate-50 overflow-y-auto max-h-[70vh]">
          <div className="bg-white p-4 shadow-sm border border-slate-200 font-mono text-[11px] text-slate-800 space-y-2 select-text">
            {/* Restaurant Heading */}
            <div className="text-center border-b border-dashed border-slate-300 pb-2">
              <div className="font-black text-sm uppercase">{restaurant?.name || 'Alinea Restaurant & Banquet'}</div>
              <div className="text-[10px] text-slate-500">{restaurant?.tagline || 'Pure Veg'}</div>
              <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{restaurant?.address}</div>
              <div className="text-[9px] text-slate-500 font-bold mt-1">Ph: {restaurant?.phone}</div>
              <div className="text-[9px] text-slate-500">GSTIN: {restaurant?.gstin}</div>
            </div>

            {/* Bill Details */}
            <div className="flex justify-between text-[10px] border-b border-dashed border-slate-300 pb-1.5 pt-1">
              <div>
                <div>Bill: <b>{billData.invoiceNo}</b></div>
                <div>Table: <b>{billData.tableName || billData.table}</b></div>
                {billData.customerName && billData.customerName !== 'Walk-in Guest' && (
                  <div>Cust: <b>{billData.customerName}</b></div>
                )}
                {billData.customerGst && (
                  <div>GSTIN: <b>{billData.customerGst}</b></div>
                )}
              </div>
              <div className="text-right">
                <div>Date: {billData.date}</div>
                <div>Time: {billData.time}</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-[10px] border-b border-dashed border-slate-300 pb-2">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Rate</th>
                  <th className="text-right py-1">Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.isArray(billData.items) &&
                  billData.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-1 font-bold">{i.name}</td>
                      <td className="text-center py-1">{i.qty}</td>
                      <td className="text-right py-1">₹{i.rate}</td>
                      <td className="text-right py-1 font-bold">₹{i.rate * i.qty}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="space-y-1 text-[10px] pt-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{Number(billData.subtotal).toFixed(2)}</span>
              </div>
              {Number(billData.discount) > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Discount:</span>
                  <span>-₹{Number(billData.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span>₹{(Number(billData.tax) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span>₹{(Number(billData.tax) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-xs border-t border-b border-dashed border-slate-400 py-1.5 mt-1">
                <span>NET TOTAL:</span>
                <span>₹{billData.grandTotal}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span>Payment Mode:</span>
                <span className="font-bold">{billData.paymentMode}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-dashed border-slate-300 pt-2 text-[9px] text-slate-400">
              <div>Thank You! Visit Again</div>
              <div>Software by Fast POS</div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="p-3 bg-white border-t border-slate-200 flex space-x-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
