import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  User,
  FileText,
  Grid,
  CreditCard,
  IndianRupee,
  Tag,
  Percent,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import TransferTableModal from '../Modals/TransferTableModal';
import { api } from '../../services/api';

export default function FastBillingView({
  billNo,
  orderType,
  setOrderType,
  selectedTable,
  setSelectedTable,
  tables = [],
  customer,
  setCustomer,
  orderItems,
  setOrderItems,
  menuItems = [],
  restaurant,
  runningOrders = {},
  updateRunningOrder,
  removeRunningOrder,
  onGenerateKot,
  onSettleBill,
  onNewBill,
  onTransferTable
}) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [tableCodeInput, setTableCodeInput] = useState('');
  const [tableError, setTableError] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedQty, setSelectedQty] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchField, setActiveSearchField] = useState('code');
  const [isItemConfirmed, setIsItemConfirmed] = useState(false);
  const [discountType, setDiscountType] = useState('PERCENT');
  const [discountVal, setDiscountVal] = useState(0);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');

  const searchInputRef = useRef(null);
  const descInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const tableInputRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Sync tableCodeInput when selectedTable changes externally or resets
  useEffect(() => {
    if (orderType === 'TAKEAWAY') {
      setTableCodeInput('');
      setTableError('');
      setSelectedTable({ id: 'TAKEAWAY', name: 'Takeaway Counter' });
    } else if (orderType === 'DINE_IN') {
      if (!selectedTable || selectedTable.id === 'TAKEAWAY') {
        setTableCodeInput('');
      } else {
        setTableCodeInput(selectedTable.id);
      }
    }
  }, [orderType, selectedTable]);

  // Select or switch to a table (loads saved entries if table is running)
  const handleSelectTable = useCallback((tableObj) => {
    if (!tableObj) {
      setSelectedTable(null);
      setTableCodeInput('');
      setTableError('');
      return;
    }

    // Save previous table's items to runningOrders before switching
    if (selectedTable?.id && selectedTable.id !== tableObj.id) {
      if (orderItems.length > 0) {
        updateRunningOrder?.(selectedTable.id, orderItems, customer);
      } else {
        removeRunningOrder?.(selectedTable.id);
      }
    }

    setSelectedTable(tableObj);
    setTableCodeInput(tableObj.id);
    setTableError('');

    // Restore table's existing running items if present
    const savedOrder = runningOrders[tableObj.id];
    if (savedOrder && Array.isArray(savedOrder.items) && savedOrder.items.length > 0) {
      setOrderItems(savedOrder.items);
      if (savedOrder.customer) {
        setCustomer(savedOrder.customer);
      }
    } else {
      setOrderItems([]);
      setCustomer({ name: '', gstNo: '' });
    }

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  }, [selectedTable, orderItems, customer, runningOrders, updateRunningOrder, setSelectedTable, setOrderItems, setCustomer]);

  // Handle table code input change and validation against master tables
  const handleTableCodeChange = (e) => {
    const rawVal = e.target.value;
    setTableCodeInput(rawVal);
    const code = rawVal.trim().toUpperCase();

    if (!code) {
      if (selectedTable?.id) {
        if (orderItems.length > 0) {
          updateRunningOrder?.(selectedTable.id, orderItems, customer);
        } else {
          removeRunningOrder?.(selectedTable.id);
        }
      }
      setSelectedTable(null);
      setTableError('');
      return;
    }

    const matched = tables.find(t => t.id.toUpperCase() === code);
    if (matched) {
      handleSelectTable(matched);
    } else {
      setSelectedTable(null);
      setTableError('Invalid Table');
    }
  };

  // Keep runningOrders updated whenever items or customer changes for active table
  useEffect(() => {
    if (selectedTable?.id && selectedTable.id !== 'TAKEAWAY') {
      if (orderItems.length > 0) {
        updateRunningOrder?.(selectedTable.id, orderItems, customer);
      } else {
        removeRunningOrder?.(selectedTable.id);
      }
    }
  }, [orderItems, selectedTable, customer, updateRunningOrder, removeRunningOrder]);

  // Esc Button handler: Empties current order items & table selection, keeping running tables saved on left side
  const handleEscClear = useCallback(() => {
    if (selectedTable?.id) {
      if (orderItems.length > 0) {
        updateRunningOrder?.(selectedTable.id, orderItems, customer);
      } else {
        removeRunningOrder?.(selectedTable.id);
      }
    }

    setOrderItems([]);
    setSelectedTable(null);
    setTableCodeInput('');
    setTableError('');
    setCustomer({ name: '', gstNo: '' });
    setSearchCode('');
    setSearchName('');
    setSelectedQty('');
    setSearchResults([]);
    setActiveSearchField('code');
    setIsItemConfirmed(false);

    setTimeout(() => {
      if (orderType === 'DINE_IN') {
        tableInputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }, 50);
  }, [selectedTable, orderItems, customer, updateRunningOrder, setOrderItems, setSelectedTable, setCustomer, orderType]);



  // On Enter in table input, validate and jump to item code input
  const handleTableKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = tableCodeInput.trim().toUpperCase();
      const matched = tables.find(t => t.id.toUpperCase() === code);
      if (matched) {
        handleSelectTable(matched);
        setTableError('');
        searchInputRef.current?.focus();
      } else {
        setTableError('Invalid Table');
        tableInputRef.current?.focus();
      }
    }
  };

  // Focus Table input on mount/change if DINE_IN and no table selected; else focus Item Code
  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderType === 'DINE_IN' && !selectedTable) {
        tableInputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [orderType, selectedTable]);

  // Reset all inline entry fields when new bill is created
  useEffect(() => {
    setSearchCode('');
    setSearchName('');
    setSelectedQty('');
    setSearchResults([]);
    setActiveSearchField('code');
    setIsItemConfirmed(false);
    setTableCodeInput('');
    setTableError('');
  }, [billNo]);

  // Active running tables list for left-hand side panel
  const runningTableList = Object.entries(runningOrders)
    .filter(([tId, ord]) => ord && Array.isArray(ord.items) && ord.items.length > 0)
    .map(([tId, ord]) => {
      const tbl = tables.find(t => t.id === tId) || { id: tId, name: `Table ${tId}`, area: 'Dining' };
      return { table: tbl, order: ord };
    });

  // Filter items only when user searches in description
  useEffect(() => {
    if (isItemConfirmed || activeSearchField !== 'desc') {
      setSearchResults([]);
      return;
    }
    const q = searchName.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const matches = menuItems.filter(
      item => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    ).slice(0, 10);
    setSearchResults(matches);
  }, [searchName, activeSearchField, isItemConfirmed, menuItems]);

  // Add Item to order
  const handleAddItem = (item, qty = 1) => {
    if (!item) return;

    if (orderType === 'DINE_IN' && !selectedTable) {
      setTableError('Please enter Table first');
      tableInputRef.current?.focus();
      return;
    }

    const existingIndex = orderItems.findIndex(i => i.code === item.code);
    if (existingIndex > -1) {
      const updated = [...orderItems];
      updated[existingIndex].qty += Number(qty) || 1;
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          code: item.code,
          name: item.name,
          category: item.category_name,
          rate: item.rate,
          qty: Number(qty) || 1,
          isVeg: Boolean(item.is_veg),
          unit: item.unit || 'Full',
          gstRate: item.gst_rate || 5.0
        }
      ]);
    }

    setSearchCode('');
    setSearchName('');
    setSelectedQty('');
    setSearchResults([]);
    setActiveSearchField('code');
    setIsItemConfirmed(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
      tableContainerRef.current?.scrollTo({ top: tableContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, 40);
  };

  // Compute matched item from item code or item description
  const matchedItem = useMemo(() => {
    const codeQ = searchCode.trim().toLowerCase();
    if (codeQ) {
      const byCode = menuItems.find(i => i.code.toLowerCase() === codeQ);
      if (byCode) return byCode;
    }
    const nameQ = searchName.trim().toLowerCase();
    if (nameQ) {
      const byName = menuItems.find(i => i.name.toLowerCase() === nameQ);
      if (byName) return byName;
      if (activeSearchField === 'desc' && searchResults.length > 0) return searchResults[0];
    }
    return null;
  }, [searchCode, searchName, activeSearchField, menuItems, searchResults]);

  // When Enter or Tab is pressed in Item Code
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (orderType === 'DINE_IN' && !selectedTable) {
        setTableError('Please enter Table first');
        tableInputRef.current?.focus();
        return;
      }
      setIsItemConfirmed(false);
      setActiveSearchField('desc');
      descInputRef.current?.focus();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (orderType === 'DINE_IN' && !selectedTable) {
        setTableError('Please enter Table first');
        tableInputRef.current?.focus();
        return;
      }
      const q = searchCode.trim().toLowerCase();
      if (!q) {
        return;
      }
      const targetItem = menuItems.find(i => i.code.toLowerCase() === q) ||
        menuItems.find(i => i.code.toLowerCase().startsWith(q));

      if (targetItem) {
        setIsItemConfirmed(true);
        setSearchCode(targetItem.code);
        setSearchName(targetItem.name);
        setSearchResults([]);
        setTimeout(() => {
          qtyInputRef.current?.focus();
        }, 30);
      }
    } else if (e.key === 'Escape') {
      setSearchResults([]);
    }
  };

  // When Enter or Tab is pressed in Item Description
  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (orderType === 'DINE_IN' && !selectedTable) {
        setTableError('Please enter Table first');
        tableInputRef.current?.focus();
        return;
      }
      const targetItem = matchedItem || (searchResults.length > 0 ? searchResults[0] : null);
      if (targetItem) {
        setIsItemConfirmed(true);
        setSearchCode(targetItem.code);
        setSearchName(targetItem.name);
        setSearchResults([]);
        setTimeout(() => {
          qtyInputRef.current?.focus();
        }, 30);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const targetItem = matchedItem || (searchResults.length > 0 ? searchResults[0] : null);
      if (targetItem) {
        setIsItemConfirmed(true);
        setSearchCode(targetItem.code);
        setSearchName(targetItem.name);
        setSearchResults([]);
      }
      qtyInputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setSearchResults([]);
    } else if (e.key === 'Backspace' && searchName === '') {
      setIsItemConfirmed(false);
      setActiveSearchField('code');
      searchInputRef.current?.focus();
    }
  };

  // When Enter is pressed in Quantity, add item to bill and advance to the next row at bottom
  const handleQtyKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (orderType === 'DINE_IN' && !selectedTable) {
        setTableError('Please enter Table first');
        tableInputRef.current?.focus();
        return;
      }
      const itemToAdd = matchedItem || menuItems.find(i => i.code.toLowerCase() === searchCode.trim().toLowerCase());
      if (itemToAdd) {
        const qtyNum = parseInt(selectedQty, 10);
        handleAddItem(itemToAdd, !isNaN(qtyNum) && qtyNum > 0 ? qtyNum : 1);
      }
    } else if (e.key === 'Backspace' && selectedQty === '') {
      if (activeSearchField === 'desc') {
        descInputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }
  };

  // When an autocomplete option is clicked, fill code and jump directly to Quantity
  const handleSelectDropdownItem = (item) => {
    if (orderType === 'DINE_IN' && !selectedTable) {
      setTableError('Please enter Table first');
      tableInputRef.current?.focus();
      return;
    }
    setIsItemConfirmed(true);
    setSearchCode(item.code);
    setSearchName(item.name);
    setSearchResults([]);
    setTimeout(() => {
      qtyInputRef.current?.focus();
    }, 30);
  };

  // Update item qty manually
  const handleUpdateQty = (code, val) => {
    if (val === '') {
      setOrderItems(orderItems.map(i => i.code === code ? { ...i, qty: '' } : i));
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setOrderItems(orderItems.map(i => i.code === code ? { ...i, qty: Math.max(1, num) } : i));
    }
  };

  const handleQtyBlur = (code, currentQty) => {
    if (!currentQty || Number(currentQty) <= 0) {
      setOrderItems(orderItems.map(i => i.code === code ? { ...i, qty: 1 } : i));
    }
  };

  // Remove item
  const removeItem = (code) => {
    const updated = orderItems.filter(i => i.code !== code);
    setOrderItems(updated);
    if (selectedTable?.id && selectedTable.id !== 'TAKEAWAY') {
      if (updated.length === 0) {
        removeRunningOrder?.(selectedTable.id);
        try {
          api.updateTable(selectedTable.id, { status: 'AVAILABLE' });
        } catch { }
      } else {
        updateRunningOrder?.(selectedTable.id, updated, customer);
      }
    }
  };

  // Calculations
  const subtotal = orderItems.reduce((acc, i) => acc + (i.rate * (Number(i.qty) || 0)), 0);
  const discountAmt = discountType === 'PERCENT'
    ? (subtotal * (parseFloat(discountVal) || 0)) / 100
    : Math.min(subtotal, parseFloat(discountVal) || 0);

  const taxableAmount = Math.max(0, subtotal - discountAmt);
  const cgst = taxableAmount * ((restaurant?.cgstRate || 2.5) / 100);
  const sgst = taxableAmount * ((restaurant?.sgstRate || 2.5) / 100);
  const totalTax = cgst + sgst;
  const grandTotal = Math.round(taxableAmount + totalTax);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = tenderedNum > grandTotal ? tenderedNum - grandTotal : 0;

  // Direct Settle & Print Bill when End key is pressed
  const handleEndPrint = useCallback(() => {
    let finalItems = [...orderItems];

    // If an item is currently selected/typed in the bottom entry row, automatically include it into the bill
    if (matchedItem && (Number(selectedQty) > 0 || selectedQty !== '')) {
      const qNum = Number(selectedQty) || 1;
      const existingIndex = finalItems.findIndex(i => i.code === matchedItem.code);
      if (existingIndex > -1) {
        finalItems = finalItems.map(i =>
          i.code === matchedItem.code ? { ...i, qty: i.qty + qNum } : i
        );
      } else {
        finalItems = [
          ...finalItems,
          {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            code: matchedItem.code,
            name: matchedItem.name,
            category: matchedItem.category_name,
            rate: matchedItem.rate,
            qty: qNum,
            isVeg: Boolean(matchedItem.is_veg),
            unit: matchedItem.unit || 'Full',
            gstRate: matchedItem.gst_rate || 5.0
          }
        ];
      }
    }

    if (finalItems.length === 0) {
      alert('Please enter at least one item before printing bill.');
      return;
    }

    const finalSubtotal = finalItems.reduce((acc, i) => acc + (i.rate * (Number(i.qty) || 0)), 0);
    const finalDiscountAmt = discountType === 'PERCENT'
      ? (finalSubtotal * (parseFloat(discountVal) || 0)) / 100
      : Math.min(finalSubtotal, parseFloat(discountVal) || 0);

    const finalTaxable = Math.max(0, finalSubtotal - finalDiscountAmt);
    const finalCgst = finalTaxable * ((restaurant?.cgstRate || 2.5) / 100);
    const finalSgst = finalTaxable * ((restaurant?.sgstRate || 2.5) / 100);
    const finalTotalTax = finalCgst + finalSgst;
    const finalGrandTotal = Math.round(finalTaxable + finalTotalTax);

    const finalTendered = parseFloat(cashTendered) || 0;
    const finalChangeDue = finalTendered > finalGrandTotal ? finalTendered - finalGrandTotal : 0;

    // Reset inline entry inputs so they don't remain behind
    setSearchCode('');
    setSearchName('');
    setSelectedQty('');
    setSearchResults([]);
    setActiveSearchField('code');
    setIsItemConfirmed(false);
    setTableCodeInput('');
    setTableError('');

    onSettleBill({
      grandTotal: finalGrandTotal,
      subtotal: finalSubtotal,
      discount: finalDiscountAmt,
      tax: finalTotalTax,
      paymentMode,
      cashTendered: finalTendered || finalGrandTotal,
      changeDue: finalChangeDue,
      items: finalItems
    });
  }, [
    orderItems,
    matchedItem,
    selectedQty,
    discountType,
    discountVal,
    restaurant,
    cashTendered,
    paymentMode,
    onSettleBill
  ]);

  // Global Keyboard Shortcuts: Escape (Clear form), End (Direct Print & Settle Bill)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleEscClear();
      } else if (e.key === 'End') {
        e.preventDefault();
        handleEndPrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEscClear, handleEndPrint]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden p-3 gap-3">
      {/* 1. LEFT PANEL: Running Tables (Compact Table IDs Only) */}
      <div className="w-full lg:w-24 bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col overflow-hidden shrink-0">
        <div className="p-2 bg-slate-50 border-b border-slate-200 text-center">
          <span className="font-extrabold text-[11px] text-slate-700 block tracking-tight">Tables</span>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded-full inline-block mt-0.5 font-mono">
            {runningTableList.length} Run
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
          {runningTableList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[10px] font-medium">
              None
            </div>
          ) : (
            runningTableList.map(({ table }) => {
              const isSelected = selectedTable?.id === table.id;
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => handleSelectTable(table)}
                  className={`w-full py-2 px-1 text-center rounded-xl font-mono font-black text-xs transition cursor-pointer ${isSelected
                    ? 'bg-brand-orange text-white shadow-xs'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                    }`}
                  title={table.name}
                >
                  {table.id}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER: Billing Order Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden min-w-0">
        {/* Top Control Bar: Order Type, Table, Captain, Customer */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          {/* Order Type & Bill No */}
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-xs bg-slate-800 text-white px-2.5 py-1 rounded-lg">
              {billNo}
            </span>
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
              {['DINE_IN', 'TAKEAWAY'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${orderType === t ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table Input (Manual Entry & Validation by Table ID) */}
          <div className="flex items-center space-x-2 flex-wrap">
            {orderType === 'DINE_IN' && (
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-500 font-semibold">Table:</span>
                <div className="relative">
                  <input
                    ref={tableInputRef}
                    type="text"
                    value={tableCodeInput}
                    onChange={handleTableCodeChange}
                    onKeyDown={handleTableKeyDown}
                    className={`px-2.5 py-1 text-xs font-mono font-bold uppercase rounded-lg border focus:outline-none transition w-24 ${tableError
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : 'bg-white border-slate-300 text-slate-800 focus:border-brand-orange'
                      }`}
                  />
                </div>

                {tableError && (
                  <span className="text-[11px] font-semibold text-red-500">
                    {tableError}
                  </span>
                )}

                {/* Transfer Table Button */}
                {selectedTable && (orderItems.length > 0 || runningOrders[selectedTable.id]?.items?.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="Transfer Table Order"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
                    <span>Transfer Table</span>
                  </button>
                )}
              </div>
            )}

            {orderType === 'TAKEAWAY' && (
              <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                <span>🥡 Takeaway Counter</span>
              </div>
            )}
          </div>

          {/* Customer Name & Customer GST No */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Customer Name"
                value={customer?.name || ''}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="pl-7 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-xs w-36 focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Customer GST No"
                value={customer?.gstNo || ''}
                onChange={(e) => setCustomer({ ...customer, gstNo: e.target.value.toUpperCase() })}
                className="pl-7 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-xs w-36 font-mono uppercase focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* Direct Order Items Table with Full Borders (Grid Table) */}
        <div ref={tableContainerRef} className="flex-1 overflow-y-auto p-3">
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-20">
              <tr>
                <th className="border border-slate-300 py-2 px-2.5 w-24">Item Code</th>
                <th className="border border-slate-300 py-2 px-3">Item Description</th>
                <th className="border border-slate-300 py-2 px-2 w-16 text-center">Quantity</th>
                <th className="border border-slate-300 py-2 px-2.5 w-20 text-right">Price</th>
                <th className="border border-slate-300 py-2 px-2.5 w-24 text-right">Amount</th>
                <th className="border border-slate-300 py-2 px-2 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Order Items Rows with Cell Borders (Added items on top) */}
              {orderItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="border border-slate-300 py-2 px-2.5 font-mono font-bold text-brand-orange">
                    {item.code}
                  </td>
                  <td className="border border-slate-300 py-2 px-3">
                    <span className="font-bold text-slate-800 text-xs">{item.name}</span>
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleUpdateQty(item.code, e.target.value)}
                      onBlur={() => handleQtyBlur(item.code, item.qty)}
                      className="w-full bg-transparent border-0 outline-none p-0 text-xs text-center font-bold font-mono text-slate-800 focus:outline-none focus:ring-0"
                    />
                  </td>
                  <td className="border border-slate-300 py-2 px-2.5 text-right font-mono text-slate-700">
                    ₹{item.rate}
                  </td>
                  <td className="border border-slate-300 py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                    ₹{item.rate * (Number(item.qty) || 0)}
                  </td>
                  <td className="border border-slate-300 py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.code)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition mx-auto block cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Direct Inline Entry Row (Always at the BOTTOM of table) */}
              <tr className="bg-orange-50/40">
                <td className="border border-slate-300 py-2 px-2.5 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchCode}
                    onFocus={() => {
                      setActiveSearchField('code');
                      if (orderType === 'DINE_IN' && !selectedTable) {
                        tableInputRef.current?.focus();
                      }
                    }}
                    onChange={(e) => {
                      if (orderType === 'DINE_IN' && !selectedTable) {
                        setTableError('Please enter Table first');
                        tableInputRef.current?.focus();
                        return;
                      }
                      setIsItemConfirmed(false);
                      setActiveSearchField('code');
                      setSearchCode(e.target.value);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full bg-transparent border-0 outline-none p-0 text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none focus:ring-0"
                  />
                </td>
                <td className="border border-slate-300 py-2 px-3 relative">
                  <input
                    ref={descInputRef}
                    type="text"
                    value={searchName || (searchCode && matchedItem ? matchedItem.name : '')}
                    onFocus={() => {
                      setActiveSearchField('desc');
                      if (orderType === 'DINE_IN' && !selectedTable) {
                        tableInputRef.current?.focus();
                      }
                    }}
                    onChange={(e) => {
                      if (orderType === 'DINE_IN' && !selectedTable) {
                        setTableError('Please enter Table first');
                        tableInputRef.current?.focus();
                        return;
                      }
                      setIsItemConfirmed(false);
                      setActiveSearchField('desc');
                      setSearchName(e.target.value);
                    }}
                    onKeyDown={handleDescKeyDown}
                    className="w-full bg-transparent border-0 outline-none p-0 text-xs font-bold text-slate-800 focus:outline-none focus:ring-0"
                  />
                  {/* Autocomplete Dropdown under Item Description: only displays item name, stays closed after selection */}
                  {activeSearchField === 'desc' && searchResults.length > 0 && !isItemConfirmed && (
                    <div className={`absolute left-0 w-96 ${orderItems.length > 2 ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white rounded-xl shadow-2xl border border-slate-300 max-h-60 overflow-y-auto z-30`}>
                      {searchResults.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectDropdownItem(item)}
                          className={`px-3 py-2 text-xs cursor-pointer border-b border-slate-100 hover:bg-orange-50 transition font-bold text-slate-800 ${idx === 0 ? 'bg-orange-50/70' : ''
                            }`}
                        >
                          {item.name}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="border border-slate-300 py-2 px-2 text-center">
                  <input
                    ref={qtyInputRef}
                    type="number"
                    min="1"
                    value={selectedQty}
                    onFocus={() => {
                      if (orderType === 'DINE_IN' && !selectedTable) {
                        tableInputRef.current?.focus();
                      }
                    }}
                    onChange={(e) => {
                      if (orderType === 'DINE_IN' && !selectedTable) {
                        setTableError('Please enter Table first');
                        tableInputRef.current?.focus();
                        return;
                      }
                      setSelectedQty(e.target.value);
                    }}
                    onKeyDown={handleQtyKeyDown}
                    className="w-full bg-transparent border-0 outline-none p-0 text-xs text-center font-bold font-mono text-slate-800 focus:outline-none focus:ring-0"
                  />
                </td>
                <td className="border border-slate-300 py-2 px-2.5 text-right font-mono font-bold text-slate-700">
                  {matchedItem ? `₹${matchedItem.rate}` : ''}
                </td>
                <td className="border border-slate-300 py-2 px-2.5 text-right font-mono font-bold text-brand-orange">
                  {matchedItem && selectedQty ? `₹${matchedItem.rate * (Number(selectedQty) || 0)}` : ''}
                </td>
                <td className="border border-slate-300 py-2 px-2 text-center">
                  {/* Action cell empty in entry row */}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: Bill Summary & Settle Payment Panel */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between overflow-hidden">
        {/* Breakdown Card */}
        <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Bill Summary</h3>
            <span className="text-[11px] font-mono text-slate-400">
              {orderItems.reduce((acc, i) => acc + i.qty, 0)} Items
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between text-xs text-slate-600">
            <span>Item Subtotal:</span>
            <span className="font-mono font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Discount Input */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Apply Discount:</span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setDiscountType('PERCENT')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${discountType === 'PERCENT' ? 'bg-brand-orange text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('FLAT')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${discountType === 'FLAT' ? 'bg-brand-orange text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  ₹
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="number"
                min="0"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
                placeholder="Discount value"
                className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold"
              />
              <span className="text-red-600 font-mono font-bold">- ₹{discountAmt.toFixed(2)}</span>
            </div>
          </div>

          {/* Taxes */}
          <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
            <div className="flex justify-between">
              <span>CGST ({restaurant?.cgstRate || 2.5}%):</span>
              <span className="font-mono">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST ({restaurant?.sgstRate || 2.5}%):</span>
              <span className="font-mono">₹{sgst.toFixed(2)}</span>
            </div>
          </div>

          {/* Grand Total Big Display */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Grand Total Payable
              </div>
              <div className="text-2xl font-black font-mono text-amber-400">
                ₹{grandTotal}
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono">
              Net Tax: ₹{totalTax.toFixed(2)}
            </div>
          </div>

          {/* Payment Mode Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['CASH', 'UPI', 'CARD', 'CREDIT'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${paymentMode === mode
                    ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Tendered & Change (if cash) */}
          {paymentMode === 'CASH' && (
            <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-slate-500 block">Tendered Cash:</span>
                <input
                  type="number"
                  placeholder={`₹${grandTotal}`}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold mt-0.5"
                />
              </div>
              <div className="text-right flex-1">
                <span className="text-[10px] font-semibold text-slate-500 block">Change Return:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  ₹{changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Table Modal */}
      <TransferTableModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        currentTable={selectedTable}
        tables={tables}
        runningOrders={runningOrders}
        orderItems={orderItems}
        onTransferConfirm={async (fromId, toId) => {
          const res = await onTransferTable?.(fromId, toId);
          return res;
        }}
      />
    </div>
  );
}
