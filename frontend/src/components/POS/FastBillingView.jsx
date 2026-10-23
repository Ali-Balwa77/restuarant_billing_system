import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  User,
  FileText,
  CreditCard,
  IndianRupee,
  Percent,
  Layers,
  ArrowRightLeft,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  Printer,
  Eye,
  LogOut,
  Edit,
  CheckCircle,
  Clock,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import TransferTableModal from '../Modals/TransferTableModal';
import InvoiceManagerModal from '../Modals/InvoiceManagerModal';
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
  onSettleBill,
  onNewBill,
  onTransferTable,
  currentUser,
  sales = [],
  onPrintInvoice,
  onDeleteInvoice,
  onExit,
  onOpenListView
}) {
  // Modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Loaded historic invoice state (when viewing past invoices with First/Prev/Next/Last or View modal)
  const [loadedInvoice, setLoadedInvoice] = useState(null);

  // Form input states
  const [tableCodeInput, setTableCodeInput] = useState('');
  const [tableError, setTableError] = useState('');
  const [paxCount, setPaxCount] = useState(1);
  const [stewardName, setStewardName] = useState('');
  const [billDate, setBillDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-GB'); // dd/mm/yyyy
  });

  // Live Clock for Subheader strip
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

  // Inline entry states
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedQty, setSelectedQty] = useState('');
  const [isCodeDropdownOpen, setIsCodeDropdownOpen] = useState(false);
  const [isDescDropdownOpen, setIsDescDropdownOpen] = useState(false);

  // Calculation & Settlement states
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [primaryPaymentMode, setPrimaryPaymentMode] = useState('CASH');
  const [primaryPaymentAmt, setPrimaryPaymentAmt] = useState('');
  const [secondaryPaymentMode, setSecondaryPaymentMode] = useState('');
  const [secondaryPaymentAmt, setSecondaryPaymentAmt] = useState('');

  // Refs for keyboard navigation
  const searchInputRef = useRef(null);
  const descInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const tableInputRef = useRef(null);
  const tableContainerRef = useRef(null);
  const entryRowRef = useRef(null);

  // Available stewards / captains
  const stewardList = ['Steward 1', 'Steward 2', 'Captain Ramesh', 'Captain Suresh', 'Manager Admin'];

  // Sync tableCodeInput when selectedTable changes
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
  }, [orderType, selectedTable, setSelectedTable]);

  // Select or switch table
  const handleSelectTable = useCallback((tableObj, shouldFocusItem = false) => {
    if (!tableObj) {
      setSelectedTable(null);
      setTableCodeInput('');
      setTableError('');
      return;
    }

    setLoadedInvoice(null); // Exit historical view if selecting a live table

    // Save previous table's items to runningOrders before switching
    if (selectedTable?.id && selectedTable.id !== tableObj.id && selectedTable.id !== 'TAKEAWAY') {
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

    if (shouldFocusItem) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [selectedTable, orderItems, customer, runningOrders, updateRunningOrder, setSelectedTable, setOrderItems, setCustomer]);

  // Table code input change (typing only updates the input; no jumping or error until Enter is pressed)
  const handleTableCodeChange = (e) => {
    const rawVal = e.target.value;
    setTableCodeInput(rawVal);
    setTableError('');
  };

  // Keep runningOrders updated whenever items or customer changes for active table
  useEffect(() => {
    if (selectedTable?.id && selectedTable.id !== 'TAKEAWAY' && !loadedInvoice) {
      if (orderItems.length > 0) {
        updateRunningOrder?.(selectedTable.id, orderItems, customer);
      } else {
        removeRunningOrder?.(selectedTable.id);
      }
    }
  }, [orderItems, selectedTable, customer, loadedInvoice, updateRunningOrder, removeRunningOrder]);

  // Clear form / Esc action
  const handleEscClear = useCallback(() => {
    if (selectedTable?.id && selectedTable.id !== 'TAKEAWAY' && !loadedInvoice) {
      if (orderItems.length > 0) {
        updateRunningOrder?.(selectedTable.id, orderItems, customer);
      } else {
        removeRunningOrder?.(selectedTable.id);
      }
    }

    setLoadedInvoice(null);
    setOrderItems([]);
    setSelectedTable(null);
    setTableCodeInput('');
    setTableError('');
    setCustomer({ name: '', gstNo: '' });
    setPaxCount(1);
    setStewardName('');
    setDiscountPercent(0);
    setDiscountReason('');
    setPrimaryPaymentMode('CASH');
    setPrimaryPaymentAmt('');
    setSecondaryPaymentMode('');
    setSecondaryPaymentAmt('');
    setSearchCode('');
    setSearchName('');
    setSelectedQty('');
    setIsCodeDropdownOpen(false);
    setIsDescDropdownOpen(false);

    setTimeout(() => {
      if (orderType === 'DINE_IN') {
        tableInputRef.current?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }, 50);
  }, [selectedTable, orderItems, customer, loadedInvoice, updateRunningOrder, setOrderItems, setSelectedTable, setCustomer, orderType]);

  // Handle Enter key on Table input (only on Enter, validate and jump to item details)
  const handleTableKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = tableCodeInput.trim().toUpperCase();
      if (!code) {
        if (selectedTable?.id && selectedTable.id !== 'TAKEAWAY') {
          if (orderItems.length > 0) {
            updateRunningOrder?.(selectedTable.id, orderItems, customer);
          } else {
            removeRunningOrder?.(selectedTable.id);
          }
        }
        setSelectedTable(null);
        setTableError('Table Not Found');
        tableInputRef.current?.focus();
        return;
      }

      const matched = tables.find(t => t.id.toUpperCase() === code || t.name.toUpperCase() === code);
      if (matched) {
        handleSelectTable(matched, true); // true = advance focus to searchInputRef
        setTableError('');
      } else {
        setSelectedTable(null);
        setTableError('Table Not Found');
        tableInputRef.current?.focus();
      }
    }
  };

  // Active running tables list for left-hand side panel
  const runningTableList = Object.entries(runningOrders)
    .filter(([tId, ord]) => ord && Array.isArray(ord.items) && ord.items.length > 0)
    .map(([tId, ord]) => {
      const tbl = tables.find(t => t.id === tId) || { id: tId, name: `Table ${tId}`, area: 'Dining' };
      return { table: tbl, order: ord };
    });

  // Close dropdown when clicking outside the inline entry row
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (entryRowRef.current && !entryRowRef.current.contains(e.target)) {
        setIsCodeDropdownOpen(false);
        setIsDescDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dropdown toggles for arrow buttons (only click opens the dropdown)
  const toggleCodeDropdown = () => {
    if (orderType === 'DINE_IN' && !selectedTable) {
      setTableError('Please enter Table first');
      tableInputRef.current?.focus();
      return;
    }
    setIsDescDropdownOpen(false);
    setIsCodeDropdownOpen(prev => !prev);
    searchInputRef.current?.focus();
  };

  const toggleDescDropdown = () => {
    if (orderType === 'DINE_IN' && !selectedTable) {
      setTableError('Please enter Table first');
      tableInputRef.current?.focus();
      return;
    }
    setIsCodeDropdownOpen(false);
    setIsDescDropdownOpen(prev => !prev);
    descInputRef.current?.focus();
  };

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
          gstRate: item.gst_rate || 5.0,
          kotNo: 0
        }
      ]);
    }

    setSearchCode('');
    setSearchName('');
    setSelectedQty('');
    setIsCodeDropdownOpen(false);
    setIsDescDropdownOpen(false);
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
      const partial = menuItems.find(i => i.name.toLowerCase().includes(nameQ));
      if (partial) return partial;
    }
    return null;
  }, [searchCode, searchName, menuItems]);

  // Search input keydown (Code field)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (menuItems.length === 0) return;
      const currentCode = searchCode.trim().toLowerCase();
      const currentIndex = menuItems.findIndex(i => i.code.toLowerCase() === currentCode);
      const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
      const nextItem = menuItems[nextIndex];
      if (nextItem) {
        setSearchCode(nextItem.code);
        setSearchName(nextItem.name);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (menuItems.length === 0) return;
      const currentCode = searchCode.trim().toLowerCase();
      const currentIndex = menuItems.findIndex(i => i.code.toLowerCase() === currentCode);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
      const prevItem = menuItems[prevIndex];
      if (prevItem) {
        setSearchCode(prevItem.code);
        setSearchName(prevItem.name);
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (orderType === 'DINE_IN' && !selectedTable) {
        setTableError('Please enter Table first');
        tableInputRef.current?.focus();
        return;
      }
      setIsCodeDropdownOpen(false);
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
      setIsCodeDropdownOpen(false);
      const q = searchCode.trim().toLowerCase();
      const targetItem = menuItems.find(i => i.code.toLowerCase() === q) ||
        menuItems.find(i => i.code.toLowerCase().startsWith(q));

      if (targetItem) {
        setSearchCode(targetItem.code);
        setSearchName(targetItem.name);
      }
      setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }, 30);
    } else if (e.key === 'Escape') {
      setIsCodeDropdownOpen(false);
    }
  };

  // Description input keydown
  const handleDescKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (menuItems.length === 0) return;
      const currentName = searchName.trim().toLowerCase();
      const currentCode = searchCode.trim().toLowerCase();
      const currentIndex = menuItems.findIndex(
        i => i.name.toLowerCase() === currentName || (currentCode && i.code.toLowerCase() === currentCode)
      );
      const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
      const nextItem = menuItems[nextIndex];
      if (nextItem) {
        setSearchCode(nextItem.code);
        setSearchName(nextItem.name);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (menuItems.length === 0) return;
      const currentName = searchName.trim().toLowerCase();
      const currentCode = searchCode.trim().toLowerCase();
      const currentIndex = menuItems.findIndex(
        i => i.name.toLowerCase() === currentName || (currentCode && i.code.toLowerCase() === currentCode)
      );
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
      const prevItem = menuItems[prevIndex];
      if (prevItem) {
        setSearchCode(prevItem.code);
        setSearchName(prevItem.name);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (orderType === 'DINE_IN' && !selectedTable) {
        setTableError('Please enter Table first');
        tableInputRef.current?.focus();
        return;
      }
      setIsDescDropdownOpen(false);
      const targetItem = matchedItem || menuItems.find(i => i.name.toLowerCase().includes(searchName.trim().toLowerCase()));
      if (targetItem) {
        setSearchCode(targetItem.code);
        setSearchName(targetItem.name);
      }
      setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }, 30);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setIsDescDropdownOpen(false);
      const targetItem = matchedItem || menuItems.find(i => i.name.toLowerCase().includes(searchName.trim().toLowerCase()));
      if (targetItem) {
        setSearchCode(targetItem.code);
        setSearchName(targetItem.name);
      }
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    } else if (e.key === 'Escape') {
      setIsDescDropdownOpen(false);
    } else if (e.key === 'Backspace' && searchName === '') {
      setIsDescDropdownOpen(false);
      searchInputRef.current?.focus();
    }
  };

  // Quantity input keydown
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
      descInputRef.current?.focus();
    }
  };

  // Selection from dropdown popup
  const handleSelectDropdownItem = (item) => {
    if (orderType === 'DINE_IN' && !selectedTable) {
      setTableError('Please enter Table first');
      tableInputRef.current?.focus();
      return;
    }
    setIsCodeDropdownOpen(false);
    setIsDescDropdownOpen(false);
    setSearchCode(item.code);
    setSearchName(item.name);
    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 30);
  };

  // Update item qty in table
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
    if (selectedTable?.id && selectedTable.id !== 'TAKEAWAY' && !loadedInvoice) {
      if (updated.length === 0) {
        removeRunningOrder?.(selectedTable.id);
        try {
          api.updateTable(selectedTable.id, { status: 'AVAILABLE' });
        } catch {}
      } else {
        updateRunningOrder?.(selectedTable.id, updated, customer);
      }
    }
  };

  // Calculations
  const subtotal = orderItems.reduce((acc, i) => acc + (i.rate * (Number(i.qty) || 0)), 0);
  const discountAmt = (subtotal * (parseFloat(discountPercent) || 0)) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmt);
  const cgstRate = restaurant?.cgstRate !== undefined ? restaurant.cgstRate : 2.5;
  const sgstRate = restaurant?.sgstRate !== undefined ? restaurant.sgstRate : 2.5;
  const cgst = parseFloat(((taxableAmount * cgstRate) / 100).toFixed(2));
  const sgst = parseFloat(((taxableAmount * sgstRate) / 100).toFixed(2));
  const totalTax = cgst + sgst;
  const grandTotal = Math.round(taxableAmount + totalTax);

  // Auto-sync primary payment amount if empty
  const effectivePrimaryAmt = primaryPaymentAmt !== '' ? parseFloat(primaryPaymentAmt) || 0 : grandTotal;

  // Direct Settle & Print Bill (Triggered by End key or Print toolbar)
  const handleEndPrint = useCallback(() => {
    let finalItems = [...orderItems];

    // If an item is currently entered in the bottom entry row, automatically include it into the bill!
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
            gstRate: matchedItem.gst_rate || 5.0,
            kotNo: 0
          }
        ];
      }
    }

    if (finalItems.length === 0) {
      alert('Please enter at least one item before printing bill.');
      return;
    }

    const finalSubtotal = finalItems.reduce((acc, i) => acc + (i.rate * (Number(i.qty) || 0)), 0);
    const finalDiscountAmt = (finalSubtotal * (parseFloat(discountPercent) || 0)) / 100;
    const finalTaxable = Math.max(0, finalSubtotal - finalDiscountAmt);
    const finalCgst = parseFloat(((finalTaxable * cgstRate) / 100).toFixed(2));
    const finalSgst = parseFloat(((finalTaxable * sgstRate) / 100).toFixed(2));
    const finalTotalTax = finalCgst + finalSgst;
    const finalGrandTotal = Math.round(finalTaxable + finalTotalTax);

    // Reset inline entry inputs
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
      discountReason,
      tax: finalTotalTax,
      pax: paxCount,
      steward: stewardName,
      paymentMode: primaryPaymentMode,
      paymentMode2: secondaryPaymentMode,
      paymentAmount2: parseFloat(secondaryPaymentAmt) || 0,
      items: finalItems
    });
  }, [
    orderItems,
    matchedItem,
    selectedQty,
    discountPercent,
    discountReason,
    cgstRate,
    sgstRate,
    paxCount,
    stewardName,
    primaryPaymentMode,
    secondaryPaymentMode,
    secondaryPaymentAmt,
    onSettleBill
  ]);

  // Global Keyboard Shortcuts (Escape: clear; End: direct print & settle)
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

  // Load a historic invoice into the view
  const loadInvoiceIntoView = (inv) => {
    if (!inv) return;
    setLoadedInvoice(inv);
    setTableCodeInput(inv.tableName || inv.table_name || '');
    const matchedTbl = tables.find(t => t.name === (inv.tableName || inv.table_name) || t.id === (inv.tableName || inv.table_name));
    setSelectedTable(matchedTbl || { id: inv.tableName || inv.table_name, name: inv.tableName || inv.table_name });
    setCustomer({
      name: inv.customerName || inv.customer_name || '',
      gstNo: inv.customerGst || inv.customer_gst || ''
    });
    setPaxCount(inv.pax || 1);
    setStewardName(inv.steward || '');
    setDiscountReason(inv.discountReason || inv.discount_reason || '');
    setPrimaryPaymentMode((inv.paymentMode || inv.payment_mode || 'CASH').toUpperCase());

    const items = Array.isArray(inv.items)
      ? inv.items
      : (typeof inv.items_json === 'string' ? JSON.parse(inv.items_json) : []);

    setOrderItems(items);
  };

  // Toolbar Navigation Handlers: First, Previous, Next, Last
  const handleNavFirst = () => {
    if (sales && sales.length > 0) {
      loadInvoiceIntoView(sales[sales.length - 1]); // earliest invoice
    }
  };

  const handleNavPrev = () => {
    if (!sales || sales.length === 0) return;
    if (!loadedInvoice) {
      loadInvoiceIntoView(sales[0]);
      return;
    }
    const currentIdx = sales.findIndex(s => (s.id === loadedInvoice.id || s.invoiceNo === loadedInvoice.invoiceNo));
    if (currentIdx < sales.length - 1) {
      loadInvoiceIntoView(sales[currentIdx + 1]);
    }
  };

  const handleNavNext = () => {
    if (!sales || sales.length === 0) return;
    if (!loadedInvoice) return;
    const currentIdx = sales.findIndex(s => (s.id === loadedInvoice.id || s.invoiceNo === loadedInvoice.invoiceNo));
    if (currentIdx > 0) {
      loadInvoiceIntoView(sales[currentIdx - 1]);
    }
  };

  const handleNavLast = () => {
    if (sales && sales.length > 0) {
      loadInvoiceIntoView(sales[0]); // most recent invoice
    }
  };

  const handleDeleteActiveInvoice = () => {
    if (!loadedInvoice) return;
    if (window.confirm(`Delete Invoice #${loadedInvoice.invoiceNo || loadedInvoice.invoice_no}?`)) {
      onDeleteInvoice?.(loadedInvoice.id || loadedInvoice.invoiceNo);
      handleEscClear();
    }
  };

  const handlePrintActive = () => {
    if (loadedInvoice && onPrintInvoice) {
      onPrintInvoice(loadedInvoice);
    } else {
      handleEndPrint();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 select-none text-slate-800">
      {/* 1. TOP ACTION TOOLBAR matching Photos 1-5 */}
      <div className="bg-slate-800 text-white border-b border-slate-700/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0">
        <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap">
          {/* Navigation Buttons */}
          <button
            type="button"
            onClick={handleNavFirst}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-900 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="First Bill (|<<)"
          >
            <ChevronFirst className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">First</span>
          </button>

          <button
            type="button"
            onClick={handleNavPrev}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-900 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="Previous Bill (<)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNavNext}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-900 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="Next Bill (>)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Next</span>
          </button>

          <button
            type="button"
            onClick={handleNavLast}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-900 rounded-lg text-xs font-bold transition cursor-pointer text-slate-200"
            title="Last Bill (>>|)"
          >
            <ChevronLast className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Last</span>
          </button>

          <span className="w-px h-5 bg-slate-700 mx-1 hidden sm:block"></span>

          {/* Action Buttons: Add, Edit, Delete, Print, Exit, View */}
          <button
            type="button"
            onClick={() => {
              setLoadedInvoice(null);
              onNewBill?.();
              handleEscClear();
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-brand-orange hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Add New Bill (+)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          {loadedInvoice && (
            <button
              type="button"
              onClick={handleDeleteActiveInvoice}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Delete loaded bill"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrintActive}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            title="Print Receipt (End)"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleEscClear();
              if (onExit) onExit();
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            title="Exit / Return (Esc)"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-300" />
            <span>Exit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenListView) {
                onOpenListView();
              } else {
                setIsViewModalOpen(true);
              }
            }}
            className="flex items-center space-x-1 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            title="View Invoices List"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
        </div>

        {/* Loaded Invoice Notification Badge */}
        {loadedInvoice && (
          <div className="flex items-center space-x-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-0.5 rounded-lg text-xs font-bold">
            <span>Viewing Historical Bill #{loadedInvoice.invoiceNo || loadedInvoice.invoice_no}</span>
            <button
              onClick={handleEscClear}
              className="text-amber-200 hover:text-white underline text-[11px] cursor-pointer ml-1"
            >
              Back to Live Billing
            </button>
          </div>
        )}
      </div>

      {/* 2. SUBHEADER STRIP matching Photo 2-5: User : A | Bill | Date : 22-10-2026 22:26 */}
      <div className="bg-amber-100/90 text-amber-950 border-b border-amber-200/90 px-4 py-1.5 flex items-center justify-between text-xs font-bold shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">User :</span>
          <span className="bg-amber-200/90 px-2 py-0.5 rounded text-amber-950 font-black">
            {currentUser?.username?.toUpperCase() || currentUser?.name || 'A'}
          </span>
        </div>

        <div className="font-extrabold text-sm tracking-wide uppercase text-amber-900">
          Bill
        </div>

        <div className="flex items-center space-x-1.5 font-mono text-slate-700">
          <span className="font-semibold">Date :</span>
          <span>{liveTime}</span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: Left TABLES panel + Right Main Form */}
      <div className="flex-1 flex overflow-hidden p-2.5 gap-2.5 min-h-0">
        {/* Left Section: Active TABLES only (like before) */}
        <div className="w-24 bg-white rounded-xl shadow-xs border border-slate-300 flex flex-col overflow-hidden shrink-0">
          <div className="p-2 bg-slate-100 border-b border-slate-200 text-center">
            <span className="font-extrabold text-[11px] text-slate-800 tracking-tight block">Tables</span>
            <div className="mt-0.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full inline-block font-mono">
                {runningTableList.length} Run
              </span>
            </div>
          </div>

          {/* Running Active Tables List */}
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
                    className={`w-full py-2 px-1 text-center rounded-lg font-mono font-black text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-brand-orange text-white shadow-xs'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
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

        {/* Right Section: Main Billing Window */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden">
          {/* TOP FORM BOX: Select Table, Bill No, Date, Customer, GST NO, Table Transfer (Pax and Steward removed) */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-300 p-2.5 shrink-0">
            {/* Row 1: Select Table, Bill No, Date */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Select Table (Compact width) */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 whitespace-nowrap">Select Table :</span>
                <div className="relative">
                  <input
                    ref={tableInputRef}
                    type="text"
                    value={tableCodeInput}
                    onChange={handleTableCodeChange}
                    onKeyDown={handleTableKeyDown}
                    className={`w-28 px-2.5 py-1 font-mono font-bold uppercase rounded border text-xs outline-none transition ${
                      tableError
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-brand-orange'
                    }`}
                  />
                  {tableError && (
                    <span className="absolute left-0 -bottom-4 text-[10px] font-bold text-red-500 whitespace-nowrap z-10">
                      {tableError}
                    </span>
                  )}
                </div>
              </div>

              {/* Bill No */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Bill No :</span>
                <span className="font-mono font-black text-brand-orange bg-orange-50 border border-orange-200 px-2.5 py-1 rounded text-xs">
                  {loadedInvoice ? (loadedInvoice.invoiceNo || loadedInvoice.invoice_no) : billNo}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Date :</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded text-xs">
                  {loadedInvoice ? (loadedInvoice.date || billDate) : billDate}
                </span>
              </div>
            </div>

            {/* Row 2: Customer Name, GST NO, Table Transfer */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-xs mt-2 pt-2 border-t border-slate-100">
              <div className="md:col-span-6 flex items-center space-x-2">
                <span className="font-bold text-slate-700 whitespace-nowrap">Customer :</span>
                <input
                  type="text"
                  value={customer?.name || ''}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 outline-none focus:border-brand-orange"
                />
              </div>

              <div className="md:col-span-4 flex items-center space-x-2">
                <span className="font-bold text-slate-700 whitespace-nowrap">GST NO :</span>
                <input
                  type="text"
                  value={customer?.gstNo || ''}
                  onChange={(e) => setCustomer({ ...customer, gstNo: e.target.value.toUpperCase() })}
                  className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono uppercase text-slate-800 outline-none focus:border-brand-orange"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end">
                {selectedTable && (orderItems.length > 0 || runningOrders[selectedTable.id]?.items?.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded text-xs font-bold transition cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Shift order to another table"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
                    <span>Table Transfer</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE: ITEM DETAILS GRID TABLE labeled "Item Details" (KOTNo removed) */}
          <div className="flex-1 bg-white rounded-xl shadow-xs border border-slate-300 flex flex-col min-h-0 overflow-hidden">
            {/* Box Header Label */}
            <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-tight">Item Details</span>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                {orderItems.length} items entered
              </span>
            </div>

            {/* Scrollable Grid Table */}
            <div ref={tableContainerRef} className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 z-20 border-b border-slate-300 shadow-2xs">
                  <tr>
                    <th className="border-r border-slate-300 py-2 px-2.5 w-24">Code</th>
                    <th className="border-r border-slate-300 py-2 px-3">Item Description</th>
                    <th className="border-r border-slate-300 py-2 px-2 w-20 text-center">Qty.</th>
                    <th className="border-r border-slate-300 py-2 px-2.5 w-24 text-right">Rate</th>
                    <th className="border-r border-slate-300 py-2 px-2.5 w-28 text-right">Amount</th>
                    <th className="py-2 px-2 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Existing order items rows with borders */}
                  {orderItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-200 transition">
                      <td className="border-r border-slate-200 py-2 px-2.5 font-mono font-bold text-brand-orange">
                        {item.code}
                      </td>
                      <td className="border-r border-slate-200 py-2 px-3">
                        <span className="font-bold text-slate-800 text-xs">{item.name}</span>
                      </td>
                      <td className="border-r border-slate-200 py-2 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateQty(item.code, e.target.value)}
                          onBlur={() => handleQtyBlur(item.code, item.qty)}
                          className="w-full bg-transparent border-0 outline-none p-0 text-xs text-center font-bold font-mono text-slate-800 focus:outline-none"
                        />
                      </td>
                      <td className="border-r border-slate-200 py-2 px-2.5 text-right font-mono text-slate-700">
                        {Number(item.rate).toFixed(2)}
                      </td>
                      <td className="border-r border-slate-200 py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                        {(item.rate * (Number(item.qty) || 0)).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.code)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition mx-auto block cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Pinned Inline Entry Row (Always active at the bottom of Item Details table) */}
                  <tr ref={entryRowRef} className="bg-orange-50/50 border-b-2 border-brand-orange/40">
                    <td className="border-r border-slate-300 py-1.5 px-2 relative">
                      <div className="flex items-center justify-between">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchCode}
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
                            const val = e.target.value;
                            setSearchCode(val);
                            const found = menuItems.find(i => i.code.toLowerCase() === val.trim().toLowerCase());
                            if (found) {
                              setSearchName(found.name);
                            }
                          }}
                          onKeyDown={handleSearchKeyDown}
                          className="w-full bg-transparent border-0 outline-none p-0 text-xs font-mono font-bold uppercase text-slate-800 focus:ring-0"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCodeDropdown();
                          }}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-1 shrink-0"
                          title="Open item code dropdown"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown under Code: ONLY opens when arrow button is clicked */}
                      {isCodeDropdownOpen && (
                        <div className={`absolute left-0 w-32 ${orderItems.length > 4 ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white rounded shadow-xl border border-slate-200 max-h-56 overflow-y-auto z-50 py-0.5`}>
                          {menuItems.map((item) => {
                            const isSelected = item.code.toLowerCase() === searchCode.trim().toLowerCase();
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectDropdownItem(item)}
                                className={`px-2.5 py-1.5 text-xs cursor-pointer font-mono font-bold transition ${
                                  isSelected
                                    ? 'bg-brand-orange text-white'
                                    : 'hover:bg-orange-50 text-slate-800'
                                }`}
                              >
                                {item.code}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="border-r border-slate-300 py-1.5 px-3 relative">
                      <div className="flex items-center justify-between">
                        <input
                          ref={descInputRef}
                          type="text"
                          value={searchName || (searchCode && matchedItem ? matchedItem.name : '')}
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
                            const val = e.target.value;
                            setSearchName(val);
                            const found = menuItems.find(i => i.name.toLowerCase() === val.trim().toLowerCase());
                            if (found) {
                              setSearchCode(found.code);
                            }
                          }}
                          onKeyDown={handleDescKeyDown}
                          className="w-full bg-transparent border-0 outline-none p-0 text-xs font-bold text-slate-800 focus:ring-0"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDescDropdown();
                          }}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-1 shrink-0"
                          title="Open item description dropdown"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Dropdown under Item Description: ONLY opens when arrow button is clicked */}
                      {isDescDropdownOpen && (
                        <div className={`absolute left-0 min-w-64 max-w-md ${orderItems.length > 4 ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white rounded shadow-xl border border-slate-200 max-h-56 overflow-y-auto z-50 py-0.5`}>
                          {menuItems.map((item) => {
                            const isSelected = item.name.toLowerCase() === (searchName || (matchedItem ? matchedItem.name : '')).trim().toLowerCase();
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectDropdownItem(item)}
                                className={`px-3 py-1.5 text-xs cursor-pointer font-bold transition truncate ${
                                  isSelected
                                    ? 'bg-brand-orange text-white'
                                    : 'hover:bg-orange-50 text-slate-800'
                                }`}
                              >
                                {item.name}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="border-r border-slate-300 py-1.5 px-2 text-center">
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
                        className="w-full bg-transparent border-0 outline-none p-0 text-xs text-center font-bold font-mono text-slate-800 focus:ring-0"
                      />
                    </td>
                    <td className="border-r border-slate-300 py-2 px-2.5 text-right font-mono font-bold text-slate-700">
                      {matchedItem ? Number(matchedItem.rate).toFixed(2) : ''}
                    </td>
                    <td className="border-r border-slate-300 py-2 px-2.5 text-right font-mono font-bold text-brand-orange">
                      {matchedItem && selectedQty ? (matchedItem.rate * (Number(selectedQty) || 0)).toFixed(2) : ''}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-400 text-[10px]">
                      Enter
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM SUMMARY & SETTLEMENT FOOTER */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-300 p-2.5 shrink-0 text-xs">
            {/* ROW 1: Discount (% & Amt) | SGST (2.5% & Amt) | CGST (2.5% & Amt) | Total Amt. (Subtotal) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              {/* Discount : [ % ] % [ Amt ] */}
              <div className="md:col-span-3 flex items-center space-x-1.5">
                <span className="font-bold text-slate-700 whitespace-nowrap">Discount :</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-center text-xs outline-none focus:border-brand-orange"
                />
                <span className="font-bold text-slate-600">%</span>
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  {discountAmt.toFixed(2)}
                </span>
              </div>

              {/* SGST : [ 2.5 ] % [ Amt ] */}
              <div className="md:col-span-3 flex items-center space-x-1.5">
                <span className="font-bold text-slate-700 whitespace-nowrap">SGST :</span>
                <span className="w-12 px-1.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-center text-xs text-slate-700">
                  {sgstRate}%
                </span>
                <span className="font-mono font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-300 flex-1 text-right">
                  {sgst.toFixed(2)}
                </span>
              </div>

              {/* CGST : [ 2.5 ] % [ Amt ] */}
              <div className="md:col-span-3 flex items-center space-x-1.5">
                <span className="font-bold text-slate-700 whitespace-nowrap">CGST :</span>
                <span className="w-12 px-1.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-center text-xs text-slate-700">
                  {cgstRate}%
                </span>
                <span className="font-mono font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-300 flex-1 text-right">
                  {cgst.toFixed(2)}
                </span>
              </div>

              {/* Total Amt. (Subtotal) */}
              <div className="md:col-span-3 flex items-center justify-end space-x-1.5">
                <span className="font-bold text-slate-700 whitespace-nowrap">Total Amt. :</span>
                <span className="font-mono font-black text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-300 text-sm">
                  {subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* ROW 2: Reason | Items | Tax. Amt. | Grand Total */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center mt-2 pt-2 border-t border-slate-100">
              {/* Reason */}
              <div className="md:col-span-4 flex items-center space-x-1.5">
                <span className="font-bold text-slate-700 whitespace-nowrap">Reason :</span>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 outline-none focus:border-brand-orange"
                />
              </div>

              {/* Items Count */}
              <div className="md:col-span-2 flex items-center space-x-1.5">
                <span className="font-bold text-slate-700 whitespace-nowrap">Items :</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                  {orderItems.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)}
                </span>
              </div>

              {/* Tax. Amt. */}
              <div className="md:col-span-3 flex items-center space-x-1.5">
                <span className="font-bold text-slate-700 whitespace-nowrap">Tax. Amt. :</span>
                <span className="font-mono font-semibold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-300 flex-1 text-right">
                  {totalTax.toFixed(2)}
                </span>
              </div>

              {/* Grand Total Highlight Badge */}
              <div className="md:col-span-3 flex items-center justify-end space-x-2">
                <span className="font-bold text-slate-700 whitespace-nowrap">Grand Total :</span>
                <span className="font-mono font-black text-amber-950 bg-amber-200/90 px-3.5 py-1 rounded-lg border border-amber-300 text-base shadow-2xs">
                  ₹{grandTotal}
                </span>
              </div>
            </div>

            {/* ROW 3: Single Pay By (Settle & Print and Clear buttons removed) */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              {/* Pay By */}
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 whitespace-nowrap">Pay By :</span>
                <div className="flex items-center space-x-1.5">
                  {['CASH', 'UPI', 'CARD', 'CREDIT'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPrimaryPaymentMode(mode)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        primaryPaymentMode === mode
                          ? 'bg-brand-orange text-white border-brand-orange shadow-2xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODALS */}
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

      {/* Invoice Manager Modal matching Photo 3 */}
      <InvoiceManagerModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        invoices={sales}
        onSelectInvoice={(inv) => {
          loadInvoiceIntoView(inv);
        }}
        onPrintInvoice={(inv) => {
          onPrintInvoice?.(inv);
        }}
        onDeleteInvoice={(id) => {
          onDeleteInvoice?.(id);
        }}
      />
    </div>
  );
}
