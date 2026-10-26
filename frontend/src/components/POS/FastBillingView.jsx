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
  editingInvoice,
  setEditingInvoice,
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

  // Print & Settle Confirmation Modal state (Prompt: Print receipt Yes/No?)
  const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);
  const [pendingSettleData, setPendingSettleData] = useState(null);

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
  const lastLoadedInvoiceIdRef = useRef(null);

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
      }
    }
  }, [orderType, selectedTable, setSelectedTable]);

  // Select or switch table
  const handleSelectTable = useCallback((tableObj, shouldFocusItem = false, customInputVal = null) => {
    if (!tableObj) {
      setSelectedTable(null);
      setTableCodeInput('');
      setTableError('');
      return;
    }

    setLoadedInvoice(null); // Exit historical view if selecting a live table

    // Save previous table's items to runningOrders before switching (ONLY if live order, NOT when editing historic invoice)
    if (!loadedInvoice && !editingInvoice && selectedTable?.id && selectedTable.id !== tableObj.id && selectedTable.id !== 'TAKEAWAY') {
      if (orderItems.length > 0) {
        updateRunningOrder?.(selectedTable.id, orderItems, customer);
      } else {
        removeRunningOrder?.(selectedTable.id);
      }
    }

    setSelectedTable(tableObj);
    const valToSet = customInputVal !== null ? customInputVal : (tableObj.id || tableObj.name);
    setTableCodeInput(valToSet);
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
  }, [selectedTable, orderItems, customer, runningOrders, loadedInvoice, editingInvoice, updateRunningOrder, removeRunningOrder, setSelectedTable, setOrderItems, setCustomer]);

  // Table code input change (typing only updates the input; no jumping or error until Enter is pressed)
  const handleTableCodeChange = (e) => {
    const rawVal = e.target.value;
    setTableCodeInput(rawVal);
    setTableError('');
  };

  // Keep runningOrders updated whenever items or customer changes for active table
  useEffect(() => {
    // CRITICAL: NEVER push to runningOrders if viewing or editing a historic invoice!
    if (loadedInvoice || editingInvoice) return;

    if (selectedTable?.id && selectedTable.id !== 'TAKEAWAY') {
      if (orderItems.length > 0) {
        updateRunningOrder?.(selectedTable.id, orderItems, customer);
      } else {
        removeRunningOrder?.(selectedTable.id);
      }
    }
  }, [orderItems, selectedTable, customer, loadedInvoice, editingInvoice, updateRunningOrder, removeRunningOrder]);

  // Clear form / Esc action
  const handleEscClear = useCallback(() => {
    if (!loadedInvoice && !editingInvoice && selectedTable?.id && selectedTable.id !== 'TAKEAWAY') {
      if (orderItems.length > 0) {
        updateRunningOrder?.(selectedTable.id, orderItems, customer);
      } else {
        removeRunningOrder?.(selectedTable.id);
      }
    }

    lastLoadedInvoiceIdRef.current = null;
    setLoadedInvoice(null);
    if (setEditingInvoice) setEditingInvoice(null);
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
  }, [selectedTable, orderItems, customer, loadedInvoice, setEditingInvoice, updateRunningOrder, setOrderItems, setSelectedTable, setCustomer, orderType]);

  // Handle Enter key on Table input (only on Enter, validate and jump to item details)
  const handleTableKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const raw = tableCodeInput.trim().toUpperCase();
      if (!raw) {
        if (!loadedInvoice && !editingInvoice && selectedTable?.id && selectedTable.id !== 'TAKEAWAY') {
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

      // Flexible table match by ID ('15', 'T15'), or name ('Table 15')
      const matched = tables.find(t => {
        const tid = (t.id || '').toUpperCase();
        const tname = (t.name || '').toUpperCase();
        return tid === raw ||
          tname === raw ||
          tid === `T${raw}` ||
          tname === `TABLE ${raw}` ||
          tid.replace(/^T/, '') === raw ||
          tname.replace(/^TABLE\s+/, '') === raw;
      });

      if (matched) {
        handleSelectTable(matched, true, tableCodeInput.trim());
        setTableError('');
      } else {
        const customTbl = { id: raw, name: tableCodeInput.trim() };
        handleSelectTable(customTbl, true, tableCodeInput.trim());
        setTableError('');
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
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (menuItems.length === 0) return;
      const q = searchCode.trim().toLowerCase();
      // Candidate list based on query if typed
      const candidates = q
        ? menuItems.filter(i => i.code.toLowerCase().startsWith(q) || i.code.toLowerCase().includes(q))
        : menuItems;
      const activeList = candidates.length > 0 ? candidates : menuItems;

      const currentIndex = activeList.findIndex(i => i.code.toLowerCase() === q);
      const nextIndex = e.key === 'ArrowDown'
        ? (currentIndex < activeList.length - 1 ? currentIndex + 1 : 0)
        : (currentIndex > 0 ? currentIndex - 1 : activeList.length - 1);

      const nextItem = activeList[nextIndex];
      if (nextItem) {
        setSearchCode(nextItem.code);
        setSearchName(nextItem.name);
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
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (menuItems.length === 0) return;
      const q = searchName.trim().toLowerCase();
      const currentCode = searchCode.trim().toLowerCase();

      const candidates = q
        ? menuItems.filter(i => i.name.toLowerCase().includes(q))
        : menuItems;
      const activeList = candidates.length > 0 ? candidates : menuItems;

      const currentIndex = activeList.findIndex(
        i => i.name.toLowerCase() === q || (currentCode && i.code.toLowerCase() === currentCode)
      );
      const nextIndex = e.key === 'ArrowDown'
        ? (currentIndex < activeList.length - 1 ? currentIndex + 1 : 0)
        : (currentIndex > 0 ? currentIndex - 1 : activeList.length - 1);

      const nextItem = activeList[nextIndex];
      if (nextItem) {
        setSearchCode(nextItem.code);
        setSearchName(nextItem.name);
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
    if (!loadedInvoice && !editingInvoice && selectedTable?.id && selectedTable.id !== 'TAKEAWAY') {
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
  // Shows confirmation popup: "Do you want to print receipt? Yes / No"
  const handleEndPrint = useCallback(() => {
    let finalItems = [...orderItems];

    // If an item is currently typed in the bottom entry row, automatically include it into the bill!
    if (matchedItem) {
      const qNum = Number(selectedQty) > 0 ? Number(selectedQty) : 1;
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
      alert('Please enter at least one item before settling bill.');
      return;
    }

    const finalSubtotal = finalItems.reduce((acc, i) => acc + (i.rate * (Number(i.qty) || 0)), 0);
    const finalDiscountAmt = (finalSubtotal * (parseFloat(discountPercent) || 0)) / 100;
    const finalTaxable = Math.max(0, finalSubtotal - finalDiscountAmt);
    const finalCgst = parseFloat(((finalTaxable * cgstRate) / 100).toFixed(2));
    const finalSgst = parseFloat(((finalTaxable * sgstRate) / 100).toFixed(2));
    const finalTotalTax = finalCgst + finalSgst;
    const finalGrandTotal = Math.round(finalTaxable + finalTotalTax);

    const activeInvoice = loadedInvoice || editingInvoice;
    const editId = activeInvoice?.id || activeInvoice?.invoiceNo || activeInvoice?.invoice_no;

    const currentTableName = orderType === 'DINE_IN'
      ? (tableCodeInput.trim() || selectedTable?.id || selectedTable?.name || 'Table')
      : orderType;

    const settleData = {
      editingInvoiceId: editId || null,
      invoiceNo: activeInvoice ? (activeInvoice.invoiceNo || activeInvoice.invoice_no) : billNo,
      date: activeInvoice ? (activeInvoice.date || billDate) : billDate,
      tableName: currentTableName,
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
    };

    setPendingSettleData(settleData);
    setIsPrintConfirmOpen(true);
  }, [
    loadedInvoice,
    editingInvoice,
    billNo,
    billDate,
    orderType,
    selectedTable,
    tableCodeInput,
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
    secondaryPaymentAmt
  ]);

  // Execute settlement once user confirms in popup (shouldPrint: true -> print receipt; false -> save without printing)
  const handleConfirmSettle = useCallback((shouldPrint) => {
    if (!pendingSettleData) return;

    // Reset inline entry inputs & clear selected table completely
    setSearchCode('');
    setSearchName('');
    setSelectedQty('');
    setTableCodeInput('');
    setTableError('');
    setSelectedTable(null);
    setOrderItems([]);
    setCustomer({ name: '', gstNo: '' });

    // Trigger settlement/update in parent App
    onSettleBill(pendingSettleData, shouldPrint);

    // Close modal and reset active edit state
    setIsPrintConfirmOpen(false);
    setPendingSettleData(null);
    setLoadedInvoice(null);
    lastLoadedInvoiceIdRef.current = null;
    if (setEditingInvoice) setEditingInvoice(null);
    setPrimaryPaymentMode('CASH');

    // Focus table input for next bill
    setTimeout(() => {
      tableInputRef.current?.focus();
    }, 50);
  }, [pendingSettleData, onSettleBill, setSelectedTable, setOrderItems, setCustomer, setEditingInvoice]);

  // Global Keyboard Shortcuts (Escape: clear; End: direct print & settle; Y/N/Enter inside confirm modal)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If Print Confirmation Modal is active, capture modal keys
      if (isPrintConfirmOpen) {
        if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleConfirmSettle(true);
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          e.stopPropagation();
          handleConfirmSettle(false);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setIsPrintConfirmOpen(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleEscClear();
      } else if (e.key === 'End' || e.code === 'End') {
        e.preventDefault();
        e.stopPropagation();
        handleEndPrint();
      }
    };
    // Use capture phase (true) so End key is caught before any focused input swallows it
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isPrintConfirmOpen, handleConfirmSettle, handleEscClear, handleEndPrint]);

  // Load a historic invoice into the view
  const loadInvoiceIntoView = useCallback((inv) => {
    if (!inv) return;
    const invId = inv.id || inv.invoiceNo || inv.invoice_no;
    lastLoadedInvoiceIdRef.current = invId;
    setLoadedInvoice(inv);
    const savedTableName = inv.tableName || inv.table_name || '';
    const matchedTbl = tables.find(t => t.name === savedTableName || t.id === savedTableName);
    const targetTbl = matchedTbl || { id: savedTableName, name: savedTableName };
    setSelectedTable(targetTbl);
    setTableCodeInput(savedTableName);

    // Crucial: A loaded/edited historic invoice must NEVER be in running orders!
    if (targetTbl?.id) {
      removeRunningOrder?.(targetTbl.id);
    }
    if (inv.tableName || inv.table_name) {
      removeRunningOrder?.(inv.tableName || inv.table_name);
    }

    setCustomer({
      name: inv.customerName || inv.customer_name || '',
      gstNo: inv.customerGst || inv.customer_gst || ''
    });
    setPaxCount(inv.pax || 1);
    setStewardName(inv.steward || '');
    let mode = (inv.paymentMode || inv.payment_mode || 'CASH').toUpperCase();
    if (mode === 'CARD') mode = 'CREDIT';
    setPrimaryPaymentMode(mode);

    if (inv.subtotal && inv.discount) {
      const discP = Math.round((Number(inv.discount) / Number(inv.subtotal)) * 100);
      setDiscountPercent(discP);
    } else {
      setDiscountPercent(0);
    }
    if (inv.grandTotal || inv.grand_total) {
      setPrimaryPaymentAmt(inv.grandTotal || inv.grand_total);
    }
    if (inv.paymentMode2 || inv.payment_mode_2) {
      setSecondaryPaymentMode(inv.paymentMode2 || inv.payment_mode_2);
    }
    if (inv.paymentAmount2 || inv.payment_amount_2) {
      setSecondaryPaymentAmt(inv.paymentAmount2 || inv.payment_amount_2);
    }

    const items = Array.isArray(inv.items)
      ? inv.items
      : (typeof inv.items_json === 'string' ? JSON.parse(inv.items_json) : []);

    setOrderItems(items);
  }, [tables, removeRunningOrder, setOrderItems, setSelectedTable, setCustomer]);

  // Synchronize editingInvoice passed from parent (loads ONLY ONCE per invoice selection to prevent resetting user edits like Pay By UPI)
  useEffect(() => {
    if (editingInvoice) {
      const invId = editingInvoice.id || editingInvoice.invoiceNo || editingInvoice.invoice_no;
      if (lastLoadedInvoiceIdRef.current !== invId) {
        lastLoadedInvoiceIdRef.current = invId;
        loadInvoiceIntoView(editingInvoice);
      }
    } else {
      lastLoadedInvoiceIdRef.current = null;
    }
  }, [editingInvoice, loadInvoiceIntoView]);

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
    const activeInvoice = loadedInvoice || editingInvoice;
    if (!activeInvoice) return;
    if (window.confirm(`Delete Invoice #${activeInvoice.invoiceNo || activeInvoice.invoice_no}?`)) {
      onDeleteInvoice?.(activeInvoice.id || activeInvoice.invoiceNo);
      handleEscClear();
    }
  };

  const handlePrintActive = () => {
    handleEndPrint();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 select-none text-slate-800">
      {/* 1. TOP ACTION TOOLBAR matching Param Infotech Windows POS Photo 100% */}
      <div className="bg-[#ebe9ed] border-b border-[#ba8775] px-2 py-1 flex flex-wrap items-center justify-between gap-1 shadow-xs shrink-0 select-none">
        <div className="flex items-center space-x-1 flex-wrap">
          {/* Navigation Buttons: Previous, Next, Last */}
          <button
            type="button"
            onClick={handleNavPrev}
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Previous Bill (|<<)"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-blue-700" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={handleNavNext}
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Next Bill (>>)"
          >
            <ChevronRight className="w-3.5 h-3.5 text-blue-700" />
            <span>Next</span>
          </button>

          <button
            type="button"
            onClick={handleNavLast}
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Last Bill (>>|)"
          >
            <ChevronLast className="w-3.5 h-3.5 text-blue-700" />
            <span>Last</span>
          </button>

          <span className="w-px h-5 bg-[#a0a0a0] mx-0.5"></span>

          {/* Action Buttons: Add, Edit, Delete, Print, Exit, View */}
          <button
            type="button"
            onClick={() => {
              setLoadedInvoice(null);
              onNewBill?.();
              handleEscClear();
            }}
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Add New Bill (+)"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 font-black" />
            <span>Add</span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Edit active bill
              if (loadedInvoice) {
                // Allows editing
                alert(`Editing bill #${loadedInvoice.invoiceNo || loadedInvoice.invoice_no}`);
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Edit Bill"
          >
            <Edit className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteActiveInvoice}
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Delete Bill"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={handlePrintActive}
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Print Receipt (End)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleEscClear();
              if (onExit) onExit();
            }}
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Exit / Return (Esc)"
          >
            <LogOut className="w-3.5 h-3.5 text-red-700" />
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
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d0d0d0] text-slate-900 border border-[#a0a0a0] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="View Invoices List"
          >
            <Eye className="w-3.5 h-3.5 text-blue-700" />
            <span>View</span>
          </button>
        </div>

        {/* Loaded / Editing Invoice Notification Badge */}
        {(loadedInvoice || editingInvoice) && (
          <div className="flex items-center space-x-2 bg-amber-100 border border-amber-400 text-amber-900 px-2 py-0.5 text-xs font-bold">
            <span>Editing Bill #{(loadedInvoice || editingInvoice).invoiceNo || (loadedInvoice || editingInvoice).invoice_no}</span>
            <button
              onClick={handleEscClear}
              className="text-blue-700 underline text-[11px] cursor-pointer ml-1"
            >
              [Back to Live / New Bill]
            </button>
          </div>
        )}
      </div>

      {/* 2. SUBHEADER STRIP matching Photo: User : A | Bill | Date : 22-10-2026 22:26 */}
      <div className="bg-[#d9663d] text-white border-b border-[#ba8775] px-3 py-1 flex items-center justify-between text-xs font-bold shrink-0 select-none shadow-xs">
        <div className="flex items-center space-x-2 text-white/90">
          <span>User :</span>
          <span className="bg-black/20 px-2 py-0.5 rounded font-black text-white">
            {currentUser?.username?.toUpperCase() || currentUser?.name || 'A'}
          </span>
        </div>

        <div className="font-extrabold text-sm tracking-wide uppercase text-white drop-shadow-xs">
          Bill
        </div>

        <div className="flex items-center space-x-1 font-mono text-white/95">
          <span>Date :</span>
          <span>{liveTime}</span>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: Left TABLES panel + Right Main Form matching Photo 100% */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2 min-h-0 bg-[#f0cfbe]">
        {/* Left Section: TABLES Panel matching Photo exactly */}
        <div className="w-20 bg-[#f7e4da] border border-[#ba8775] flex flex-col shrink-0 overflow-hidden shadow-2xs">
          <div className="py-1.5 px-1 bg-[#e8bcae] border-b border-[#ba8775] text-center">
            <span className="font-extrabold text-xs text-[#4a2214] tracking-tight block">TABLES</span>
          </div>

          {/* Running Active Tables List */}
          <div className="flex-1 overflow-y-auto p-1 space-y-1 bg-white">
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
                    className={`w-full py-1.5 px-1 text-center font-mono font-bold text-xs transition cursor-pointer border ${isSelected
                        ? 'bg-[#8b0000] text-white border-[#500000] shadow-xs'
                        : 'bg-white text-[#8b0000] hover:bg-orange-50 border-[#cca292]'
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

        {/* Right Section: Main Billing Window with authentic Peach/Salmon theme */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden bg-[#f7e4da] border border-[#ba8775] p-2 shadow-2xs">
          {/* TOP FORM BOX matching Photo 100% */}
          <div className="bg-[#fcf5f2] border border-[#cca292] p-2 shrink-0">
            {/* Row 1: Select Table, Bill No, Date */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Select Table :</span>
                <div className="relative">
                  <input
                    ref={tableInputRef}
                    type="text"
                    value={tableCodeInput}
                    onChange={handleTableCodeChange}
                    onKeyDown={handleTableKeyDown}
                    className={`w-24 px-2 py-0.5 font-mono font-bold text-xs uppercase bg-white border border-[#cca292] outline-none text-[#8b0000] ${tableError ? 'bg-red-50 border-red-500' : 'focus:border-[#8b0000]'
                      }`}
                  />
                  {tableError && (
                    <span className="absolute left-0 -bottom-4 text-[10px] font-bold text-red-600 whitespace-nowrap z-10">
                      {tableError}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214]">Bill No :</span>
                <input
                  type="text"
                  readOnly
                  value={(loadedInvoice || editingInvoice) ? ((loadedInvoice || editingInvoice).invoiceNo || (loadedInvoice || editingInvoice).invoice_no) : billNo}
                  className="w-24 px-2 py-0.5 bg-white border border-[#cca292] text-xs font-mono font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214]">Date :</span>
                <div className="flex items-center bg-white border border-[#cca292] px-2 py-0.5 text-xs font-mono font-bold text-slate-800">
                  <span>{(loadedInvoice || editingInvoice) ? ((loadedInvoice || editingInvoice).date || billDate) : billDate}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
                </div>
              </div>
            </div>

            {/* Row 2: Customer, GST NO, Table Transfer Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs mt-2 pt-1.5 border-t border-[#ebd0c5]">
              <div className="flex-1 flex items-center space-x-2 min-w-[240px]">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Customer :</span>
                <input
                  type="text"
                  value={customer?.name || ''}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="flex-1 px-2 py-0.5 bg-white border border-[#cca292] text-xs font-semibold text-slate-800 outline-none focus:border-[#8b0000]"
                />
              </div>

              <div className="flex items-center space-x-2 w-56">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">GST NO :</span>
                <input
                  type="text"
                  value={customer?.gstNo || ''}
                  onChange={(e) => setCustomer({ ...customer, gstNo: e.target.value.toUpperCase() })}
                  className="flex-1 px-2 py-0.5 bg-white border border-[#cca292] text-xs font-mono uppercase text-slate-800 outline-none focus:border-[#8b0000]"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-3 py-1 bg-[#e6e6e6] hover:bg-[#d4d4d4] text-[#111] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-xs font-bold transition cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Shift order to another table"
                >
                  Table Transfer
                </button>
              </div>
            </div>
          </div>

          {/* MIDDLE: ITEM DETAILS GRID TABLE matching Photo 100% */}
          <div className="flex-1 bg-[#fcf5f2] border border-[#ba8775] flex flex-col min-h-0 overflow-hidden shadow-2xs">
            {/* Header divider line: -Item Details--------------------------------------------------------- */}
            <div className="px-2 py-0.5 bg-[#f7e4da] border-b border-[#ba8775] text-[#4a2214] font-bold text-xs select-none">
              <span>Item Details</span>
            </div>

            {/* Scrollable Grid Table */}
            <div ref={tableContainerRef} className="flex-1 overflow-y-auto bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#e8bcae] text-[#4a2214] font-bold sticky top-0 z-20 border-b border-[#ba8775]">
                  <tr>
                    <th className="border-r border-[#ba8775] py-1 px-2 w-16 text-center">Code</th>
                    <th className="border-r border-[#ba8775] py-1 px-2.5">Item Description</th>
                    <th className="border-r border-[#ba8775] py-1 px-2 w-16 text-center">Qty.</th>
                    <th className="border-r border-[#ba8775] py-1 px-2.5 w-24 text-right">Rate</th>
                    <th className="border-r border-[#ba8775] py-1 px-2.5 w-28 text-right">Amount</th>
                    <th className="border-r border-[#ba8775] py-1 px-2 w-16 text-center">KOTNo</th>
                    <th className="py-1 px-1.5 w-8 text-center text-[10px] text-slate-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cca292]/60">
                  {/* Existing order items rows with authentic styling */}
                  {orderItems.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/60 transition group">
                      <td className="border-r border-[#cca292]/60 py-1 px-2 text-center font-mono font-bold text-slate-900">
                        {item.code}
                      </td>
                      <td className="border-r border-[#cca292]/60 py-1 px-2.5 font-bold uppercase text-slate-900">
                        {item.name}
                      </td>
                      <td className="border-r border-[#cca292]/60 py-0.5 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateQty(item.code, e.target.value)}
                          onBlur={() => handleQtyBlur(item.code, item.qty)}
                          className="w-full bg-transparent border-0 outline-none p-0 text-xs text-center font-bold font-mono text-slate-900"
                        />
                      </td>
                      <td className="border-r border-[#cca292]/60 py-1 px-2.5 text-right font-mono font-semibold text-slate-900">
                        {Number(item.rate).toFixed(2)}
                      </td>
                      <td className="border-r border-[#cca292]/60 py-1 px-2.5 text-right font-mono font-bold text-slate-900">
                        {(item.rate * (Number(item.qty) || 0)).toFixed(2)}
                      </td>
                      <td className="border-r border-[#cca292]/60 py-1 px-2 text-center font-mono text-slate-700">
                        {item.kotNo || 0}
                      </td>
                      <td className="py-1 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.code)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition cursor-pointer p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Pinned Inline Entry Row matching the photo at the bottom of the grid */}
                  <tr ref={entryRowRef} className="bg-[#fcf5f2] border-t-2 border-[#ba8775]">
                    <td className="border-r border-[#ba8775] py-0.5 px-1 relative">
                      <div className="flex items-center bg-white border border-[#cca292]">
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
                          className="w-full px-1 py-0.5 text-xs font-mono font-bold uppercase text-slate-900 outline-none"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCodeDropdown();
                          }}
                          className="px-1 text-slate-500 hover:text-slate-800 cursor-pointer shrink-0 border-l border-[#cca292] bg-[#f0e6e0]"
                          title="Open item code dropdown"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Code Dropdown: ONLY opens when arrow button is clicked */}
                      {isCodeDropdownOpen && (
                        <div className={`absolute left-0 w-36 ${orderItems.length > 5 ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white rounded shadow-xl border border-[#ba8775] max-h-56 overflow-y-auto z-50 py-0.5`}>
                          {menuItems.map((item) => {
                            const isSelected = item.code.toLowerCase() === searchCode.trim().toLowerCase();
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectDropdownItem(item)}
                                className={`px-2 py-1 text-xs cursor-pointer font-mono font-bold transition ${isSelected
                                    ? 'bg-[#8b0000] text-white'
                                    : 'hover:bg-amber-100 text-slate-900'
                                  }`}
                              >
                                {item.code} - {item.name}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="border-r border-[#ba8775] py-0.5 px-1 relative">
                      <div className="flex items-center bg-white border border-[#cca292]">
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
                          className="w-full px-1.5 py-0.5 text-xs font-bold uppercase text-slate-900 outline-none"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDescDropdown();
                          }}
                          className="px-1 text-slate-500 hover:text-slate-800 cursor-pointer shrink-0 border-l border-[#cca292] bg-[#f0e6e0]"
                          title="Open item description dropdown"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Description Dropdown: ONLY opens when arrow button is clicked */}
                      {isDescDropdownOpen && (
                        <div className={`absolute left-0 min-w-72 max-w-lg ${orderItems.length > 5 ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white rounded shadow-xl border border-[#ba8775] max-h-56 overflow-y-auto z-50 py-0.5`}>
                          {menuItems.map((item) => {
                            const isSelected = item.name.toLowerCase() === (searchName || (matchedItem ? matchedItem.name : '')).trim().toLowerCase();
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectDropdownItem(item)}
                                className={`px-2.5 py-1 text-xs cursor-pointer font-bold transition truncate ${isSelected
                                    ? 'bg-[#8b0000] text-white'
                                    : 'hover:bg-amber-100 text-slate-900'
                                  }`}
                              >
                                {item.code} - {item.name} (₹{item.rate})
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="border-r border-[#ba8775] py-0.5 px-1 text-center">
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
                        className="w-full bg-white border border-[#cca292] px-1 py-0.5 text-xs text-center font-bold font-mono text-slate-900 outline-none"
                      />
                    </td>

                    <td className="border-r border-[#ba8775] py-1 px-2.5 text-right font-mono font-semibold text-slate-900">
                      {matchedItem ? Number(matchedItem.rate).toFixed(2) : ''}
                    </td>

                    <td className="border-r border-[#ba8775] py-1 px-2.5 text-right font-mono font-bold text-slate-900">
                      {matchedItem && selectedQty ? (matchedItem.rate * (Number(selectedQty) || 0)).toFixed(2) : ''}
                    </td>

                    <td className="border-r border-[#ba8775] py-1 px-2 text-center font-mono text-slate-600">
                      0
                    </td>

                    <td className="py-1 px-1 text-center text-[10px] text-slate-400 font-bold">
                      ↵
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM SUMMARY & SETTLEMENT BOX matching Photo 100% */}
          <div className="bg-[#fcf5f2] border border-[#ba8775] p-2 shrink-0 text-xs shadow-2xs">
            {/* ROW 1: Discount : [ 0.00 ] % [ 0.00 ]  SGST : [ 2.5 ] % [ 63.35 ]  CGST : [ 2.5 ] % [ 63.35 ]  Total Amt. : [ 2534.00 ] */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Discount */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Discount :</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="w-16 px-1 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-center text-xs outline-none"
                />
                <span className="font-bold text-[#4a2214]">%</span>
                <input
                  type="text"
                  readOnly
                  value={discountAmt.toFixed(2)}
                  className="w-16 px-1 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-right text-xs text-red-600 outline-none"
                />
              </div>

              {/* SGST */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">SGST :</span>
                <input
                  type="text"
                  readOnly
                  value={`${sgstRate}`}
                  className="w-12 px-1 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-center text-xs outline-none"
                />
                <span className="font-bold text-[#4a2214]">%</span>
                <input
                  type="text"
                  readOnly
                  value={sgst.toFixed(2)}
                  className="w-16 px-1 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-right text-xs outline-none"
                />
              </div>

              {/* CGST */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">CGST :</span>
                <input
                  type="text"
                  readOnly
                  value={`${cgstRate}`}
                  className="w-12 px-1 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-center text-xs outline-none"
                />
                <span className="font-bold text-[#4a2214]">%</span>
                <input
                  type="text"
                  readOnly
                  value={cgst.toFixed(2)}
                  className="w-16 px-1 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-right text-xs outline-none"
                />
              </div>

              {/* Total Amt. (Subtotal before tax) */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Total Amt. :</span>
                <input
                  type="text"
                  readOnly
                  value={subtotal.toFixed(2)}
                  className="w-24 px-1.5 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-right text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            {/* ROW 2: Reason : [              ]  Items : [ 9 ]  Tax. Amt. : [ 0 ] */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1.5 border-t border-[#ebd0c5]">
              {/* Reason */}
              <div className="flex-1 flex items-center space-x-1.5 min-w-[280px]">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Reason :</span>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="flex-1 px-2 py-0.5 bg-white border border-[#cca292] text-xs font-semibold text-slate-900 outline-none"
                />
              </div>

              {/* Items */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Items :</span>
                <input
                  type="text"
                  readOnly
                  value={orderItems.reduce((acc, i) => acc + (Number(i.qty) || 0), 0)}
                  className="w-14 px-1 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-center text-xs outline-none"
                />
              </div>

              {/* Tax. Amt. */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Tax. Amt. :</span>
                <input
                  type="text"
                  readOnly
                  value={totalTax.toFixed(2)}
                  className="w-20 px-1 py-0.5 bg-white border border-[#cca292] font-mono font-bold text-right text-xs outline-none"
                />
              </div>

              {/* Net Amount Display */}
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Net Amt :</span>
                <div className="px-2.5 py-0.5 bg-white border-2 border-[#8b0000] font-mono font-black text-sm text-[#8b0000]">
                  ₹{grandTotal}
                </div>
              </div>
            </div>

            {/* ROW 3: Single Pay By */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-1.5 border-t border-[#ebd0c5]">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#4a2214] whitespace-nowrap">Pay By :</span>
                <select
                  value={primaryPaymentMode}
                  onChange={(e) => setPrimaryPaymentMode(e.target.value)}
                  className="w-36 px-2 py-0.5 bg-white border border-[#cca292] text-xs font-bold text-slate-900 outline-none focus:border-[#8b0000]"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CREDIT">Credit Card</option>
                </select>
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
          if (setEditingInvoice) setEditingInvoice(inv);
        }}
        onPrintInvoice={(inv) => {
          onPrintInvoice?.(inv);
        }}
        onDeleteInvoice={(id) => {
          onDeleteInvoice?.(id);
        }}
      />

      {/* Print Confirmation Popup Modal (Prompt: Print receipt Yes / No?) */}
      {isPrintConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs select-none p-4 animate-in fade-in duration-100">
          <div className="bg-[#f7e4da] border-2 border-[#ba8775] shadow-2xl rounded-xs w-full max-w-sm overflow-hidden text-slate-800">
            {/* Window Title Bar */}
            <div className="bg-gradient-to-r from-[#ba8775] via-[#c87a63] to-[#ba8775] text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs shadow-inner">
              <div className="flex items-center space-x-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>Confirm Print / પ્રિન્ટ પુષ્ટિકરણ</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintConfirmOpen(false)}
                className="hover:bg-black/20 px-1.5 py-0.5 rounded text-white text-xs cursor-pointer"
                title="Cancel (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Window Content */}
            <div className="p-4 text-center space-y-3">
              {pendingSettleData?.editingInvoiceId ? (
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded">
                  <span>Updating Bill #{pendingSettleData?.invoiceNo}</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded">
                  <span>New Bill #{pendingSettleData?.invoiceNo}</span>
                </div>
              )}

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-800">
                  Do you want to print receipt?
                </h4>
                <p className="text-sm font-bold text-[#8b4513]">
                  પ્રિન્ટ કાઢવી છે કે નહીં?
                </p>
              </div>

              <div className="bg-[#faece6] border border-[#d9baaf] rounded p-2 text-xs font-medium text-slate-700 flex justify-between items-center px-4">
                <span>Items: <strong className="text-slate-900">{pendingSettleData?.items?.length || 0}</strong></span>
                <span>Grand Total: <strong className="text-base font-black text-[#8b4513]">₹{pendingSettleData?.grandTotal}</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => handleConfirmSettle(true)}
                  className="flex-1 py-2 px-3 bg-gradient-to-b from-[#e8f5e9] to-[#c8e6c9] hover:from-[#c8e6c9] hover:to-[#a5d6a7] active:bg-[#81c784] text-emerald-950 border-2 border-emerald-600 font-black text-xs rounded shadow flex items-center justify-center space-x-1.5 cursor-pointer transition"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Yes / હા (Enter/Y)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmSettle(false)}
                  className="flex-1 py-2 px-3 bg-gradient-to-b from-[#ffebee] to-[#ffcdd2] hover:from-[#ffcdd2] hover:to-[#ef9a9a] active:bg-[#e57373] text-red-950 border-2 border-red-600 font-black text-xs rounded shadow flex items-center justify-center space-x-1.5 cursor-pointer transition"
                >
                  <span>No / ના (N)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
