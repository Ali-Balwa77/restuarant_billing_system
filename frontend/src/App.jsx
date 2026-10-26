import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import LoginView from './components/LoginView';
import FastBillingView from './components/POS/FastBillingView';
import ConsoleDashboardView from './components/Console/ConsoleDashboardView';
import BillListView from './components/POS/BillListView';
import BulkBillPrintView from './components/POS/BulkBillPrintView';
import MastersView from './components/Masters/MastersView';
import ReportsView from './components/Reports/ReportsView';
import TransactionsView from './components/Transactions/TransactionsView';
import BanquetView from './components/Banquet/BanquetView';
import PrintBillModal from './components/Modals/PrintBillModal';
import { api } from './services/api';

export default function App() {
  // 1. Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Active Screen View ('CONSOLE', 'BILL_LIST', 'BILLING', 'BULK_BILL', 'MASTERS', 'REPORTS')
  const [activeView, setActiveView] = useState('CONSOLE');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 3. Backend Data State
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [restaurant, setRestaurant] = useState({
    name: 'Alinea Restaurant & Banquet',
    tagline: 'Pure Veg & Multi-Cuisine',
    address: 'Near Parimal Garden, Punchvati Cross Road, Ahmedabad, Gujarat - 380006',
    phone: '+91 9898745429',
    gstin: '24AAACH7890B1ZK',
    fssai: '1072300000001',
    printerWidth: '80mm',
    cgstRate: 2.5,
    sgstRate: 2.5,
  });

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [kots, setKots] = useState([]);
  const [sales, setSales] = useState([]);

  // Active Billing Order State
  const [invoiceCounter, setInvoiceCounter] = useState(1);
  const [billNo, setBillNo] = useState('0001');
  const [orderType, setOrderType] = useState('DINE_IN');
  const [selectedTable, setSelectedTable] = useState(null);
  const [customer, setCustomer] = useState({ name: '', gstNo: '' });
  const [orderItems, setOrderItems] = useState([]);

  // Running Tables State (holds active order items per table, persisted)
  const [runningOrders, setRunningOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_running_orders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pos_running_orders', JSON.stringify(runningOrders));
    } catch { }
  }, [runningOrders]);

  const updateRunningOrder = useCallback((tableId, items, cust) => {
    if (!tableId || tableId === 'TAKEAWAY') return;
    setRunningOrders(prev => {
      if (!items || items.length === 0) {
        const copy = { ...prev };
        delete copy[tableId];
        return copy;
      }
      return {
        ...prev,
        [tableId]: {
          tableId,
          items,
          customer: cust || { name: '', gstNo: '' },
          updatedAt: Date.now()
        }
      };
    });
  }, []);

  const removeRunningOrder = useCallback((tableId) => {
    if (!tableId) return;
    setRunningOrders(prev => {
      const copy = { ...prev };
      delete copy[tableId];
      return copy;
    });
  }, []);

  // Thermal Print Modal State
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printableData, setPrintableData] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Fetch all live data from backend SQLite
  const fetchAllData = useCallback(async () => {
    try {
      const health = await api.checkHealth().catch(() => null);
      if (!health || health.status !== 'ONLINE') {
        setIsBackendOnline(false);
        return;
      }
      setIsBackendOnline(true);

      const [
        settingsRes,
        itemsRes,
        catsRes,
        tablesRes,
        kotsRes,
        salesRes
      ] = await Promise.all([
        api.getSettings().catch(() => null),
        api.getItems().catch(() => null),
        api.getCategories().catch(() => null),
        api.getTables().catch(() => null),
        api.getKots().catch(() => null),
        api.getSales().catch(() => null),
      ]);

      if (settingsRes?.data) setRestaurant(settingsRes.data);
      if (itemsRes?.data) setItems(itemsRes.data);
      if (catsRes?.data) setCategories(catsRes.data);
      if (tablesRes?.data) {
        setTables(tablesRes.data);
      }
      if (kotsRes?.data) setKots(kotsRes.data);
      if (salesRes?.data) {
        setSales(salesRes.data);
        const nextNum = salesRes.data.length + 1;
        setInvoiceCounter(nextNum);
        setBillNo(String(nextNum).padStart(4, '0'));
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      setIsBackendOnline(false);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchAllData();
    const timer = setInterval(fetchAllData, 5000);
    return () => clearInterval(timer);
  }, [fetchAllData]);

  // Handle Login
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('pos_user', JSON.stringify(user));
    setActiveView('CONSOLE');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_user');
    setActiveView('CONSOLE');
  };

  // Handle View Selection
  const handleSelectView = (view) => {
    setActiveView(view);
    if (view === 'BILLING') {
      setOrderType('DINE_IN');
    }
  };

  // Start New Bill
  const handleNewBill = useCallback(() => {
    setEditingInvoice(null);
    const nextNum = invoiceCounter + 1;
    setInvoiceCounter(nextNum);
    setBillNo(String(nextNum).padStart(4, '0'));
    setOrderType('DINE_IN');
    setSelectedTable(null);
    setOrderItems([]);
    setCustomer({ name: '', gstNo: '' });
    setActiveView('BILLING');
  }, [invoiceCounter]);

  // Settle or Update Bill
  const handleSettleBill = useCallback(async (calcData, shouldPrint = true) => {
    const settleItems = (calcData?.items && calcData.items.length > 0) ? calcData.items : orderItems;
    if (!settleItems || settleItems.length === 0) {
      alert('Cannot settle empty order');
      return;
    }

    const isUpdate = Boolean(calcData?.editingInvoiceId || editingInvoice?.id || editingInvoice?.invoiceNo);
    const targetInvoiceId = calcData?.editingInvoiceId || editingInvoice?.id || editingInvoice?.invoiceNo;

    const invoicePayload = {
      invoiceNo: isUpdate ? (editingInvoice?.invoiceNo || calcData?.invoiceNo || billNo) : billNo,
      date: isUpdate ? (editingInvoice?.date || new Date().toLocaleDateString('en-GB')) : new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tableName: calcData?.tableName || (orderType === 'DINE_IN' ? (selectedTable?.id || selectedTable?.name || 'Table') : orderType),
      customerName: customer.name || 'Walk-in Guest',
      customerGst: customer.gstNo || '',
      paymentMode: calcData?.paymentMode || 'CASH',
      subtotal: calcData?.subtotal,
      discount: calcData?.discount,
      tax: calcData?.tax,
      grandTotal: calcData?.grandTotal,
      pax: calcData?.pax || 1,
      steward: calcData?.steward || '',
      discountReason: calcData?.discountReason || '',
      paymentMode2: calcData?.paymentMode2 || '',
      paymentAmount2: calcData?.paymentAmount2 || 0,
      items: settleItems,
    };

    // If print requested by user, open print modal
    if (shouldPrint) {
      setPrintableData(invoicePayload);
      setIsPrintOpen(true);
    }

    try {
      if (isUpdate) {
        // UPDATE EXISTING INVOICE in database (DO NOT create new bill!)
        await api.updateInvoice(targetInvoiceId, invoicePayload);
      } else {
        // CREATE NEW INVOICE
        await api.createInvoice(invoicePayload);
      }

      // Free table if dine-in and remove from running orders (for BOTH new bills and updates)
      const tableToFree = selectedTable?.id || invoicePayload.tableName;
      if (tableToFree && tableToFree !== 'TAKEAWAY') {
        removeRunningOrder(tableToFree);
        const tbl = tables.find(t => t.name === tableToFree || t.id === tableToFree);
        if (tbl?.id) {
          removeRunningOrder(tbl.id);
          api.updateTable(tbl.id, { status: 'AVAILABLE' }).catch(() => {});
        }
      }

      // Background refresh
      fetchAllData().catch(() => {});

      // Clear editing state and reset for next bill
      setEditingInvoice(null);
      setSelectedTable(null);
      setOrderItems([]);
      setCustomer({ name: '', gstNo: '' });
      handleNewBill();
    } catch (err) {
      console.error('Error saving bill:', err);
      alert(`Error saving bill: ${err.message}`);
    }
  }, [orderItems, billNo, orderType, selectedTable, customer, editingInvoice, fetchAllData, handleNewBill, removeRunningOrder]);

  // Transfer Table (Shift order from one table to another)
  const handleTransferTable = useCallback(async (fromTableId, toTableId) => {
    if (!fromTableId || !toTableId || fromTableId === toTableId) {
      alert('Please select a valid, different target table.');
      return false;
    }

    const targetTbl = tables.find(t => t.id.toUpperCase() === toTableId.toUpperCase());
    if (!targetTbl) {
      alert(`Target Table ${toTableId} does not exist in master tables.`);
      return false;
    }

    try {
      // 1. Call backend API to transfer table statuses and KOTs
      await api.transferTable(fromTableId, targetTbl.id);

      // 2. Transfer in runningOrders
      setRunningOrders(prev => {
        const copy = { ...prev };
        const sourceOrder = copy[fromTableId] || {
          tableId: fromTableId,
          items: orderItems,
          customer,
          updatedAt: Date.now()
        };

        if (copy[targetTbl.id]?.items) {
          copy[targetTbl.id] = {
            tableId: targetTbl.id,
            tableName: targetTbl.name,
            items: [...copy[targetTbl.id].items, ...sourceOrder.items],
            customer: copy[targetTbl.id].customer?.name ? copy[targetTbl.id].customer : sourceOrder.customer,
            updatedAt: Date.now()
          };
        } else {
          copy[targetTbl.id] = {
            ...sourceOrder,
            tableId: targetTbl.id,
            tableName: targetTbl.name,
            updatedAt: Date.now()
          };
        }

        delete copy[fromTableId];
        return copy;
      });

      // 3. If currently viewing source table, switch active table to target
      if (selectedTable?.id === fromTableId) {
        setSelectedTable(targetTbl);
      }

      await fetchAllData();
      return true;
    } catch (err) {
      alert(`Error transferring table: ${err.message}`);
      return false;
    }
  }, [tables, orderItems, customer, selectedTable, fetchAllData]);

  // Global Keyboard Shortcuts (Escape to close print modal)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPrintOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. If not logged in, render Login View
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Main POS Workspace Layout
  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans select-none">
      {/* Top Navbar */}
      <Navbar
        restaurant={restaurant}
        user={currentUser}
        onLogout={handleLogout}
        onNewBill={handleNewBill}
        onNavigateHome={() => setActiveView('CONSOLE')}
        isOnline={isBackendOnline}
      />

      {/* Main Body: Left Sidebar + Central Workstation */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          setActiveView={handleSelectView}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Central View Switcher */}
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-slate-100">
          {/* VIEW 0: Console Root / Dashboard (Image 2) */}
          {activeView === 'CONSOLE' && (
            <ConsoleDashboardView
              currentUser={currentUser}
              onOpenBill={() => setActiveView('BILLING')}
              onOpenBulkBill={() => setActiveView('BULK_BILL')}
              salesCount={sales.length}
              restaurant={restaurant}
            />
          )}

          {/* VIEW 1: Bill List / Search Screen (Image 3) */}
          {activeView === 'BILL_LIST' && (
            <BillListView
              invoices={sales}
              currentUser={currentUser}
              onSelectInvoice={(inv) => {
                if (inv) {
                  setEditingInvoice(inv);
                  setBillNo(inv.invoiceNo || inv.invoice_no);
                  const matchedTbl = tables.find(t => t.name === (inv.tableName || inv.table_name) || t.id === (inv.tableName || inv.table_name));
                  const targetTbl = matchedTbl || { id: inv.tableName || inv.table_name, name: inv.tableName || inv.table_name };
                  setSelectedTable(targetTbl);
                  // Ensure this table does NOT appear in Running Tables when editing historic invoice
                  if (targetTbl?.id) {
                    removeRunningOrder(targetTbl.id);
                  }
                  if (inv.tableName || inv.table_name) {
                    removeRunningOrder(inv.tableName || inv.table_name);
                  }
                  setCustomer({
                    name: inv.customerName || inv.customer_name || '',
                    gstNo: inv.customerGst || inv.customer_gst || ''
                  });
                  const itemsList = Array.isArray(inv.items)
                    ? inv.items
                    : (typeof inv.items_json === 'string' ? JSON.parse(inv.items_json) : []);
                  setOrderItems(itemsList);
                }
                setActiveView('BILLING');
              }}
              onNewBill={() => {
                handleNewBill();
                setActiveView('BILLING');
              }}
              onExit={() => setActiveView('CONSOLE')}
              onPrintInvoice={(inv) => {
                setPrintableData(inv);
                setIsPrintOpen(true);
              }}
              onDeleteInvoice={async (id) => {
                try {
                  await api.deleteInvoice(id);
                  await fetchAllData();
                } catch (err) {
                  alert(`Error deleting invoice: ${err.message}`);
                }
              }}
            />
          )}

          {/* VIEW 2: Bill / POS Fast Billing Screen (Image 4 & 5) */}
          {activeView === 'BILLING' && (
            <FastBillingView
              billNo={billNo}
              editingInvoice={editingInvoice}
              setEditingInvoice={setEditingInvoice}
              orderType={orderType}
              setOrderType={setOrderType}
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              tables={tables}
              customer={customer}
              setCustomer={setCustomer}
              orderItems={orderItems}
              setOrderItems={setOrderItems}
              menuItems={items}
              restaurant={restaurant}
              runningOrders={runningOrders}
              updateRunningOrder={updateRunningOrder}
              removeRunningOrder={removeRunningOrder}
              onSettleBill={handleSettleBill}
              onNewBill={handleNewBill}
              onTransferTable={handleTransferTable}
              currentUser={currentUser}
              sales={sales}
              onPrintInvoice={(inv) => {
                setPrintableData(inv);
                setIsPrintOpen(true);
              }}
              onDeleteInvoice={async (id) => {
                try {
                  await api.deleteInvoice(id);
                  await fetchAllData();
                } catch (err) {
                  alert(`Error deleting invoice: ${err.message}`);
                }
              }}
              onExit={() => setActiveView('CONSOLE')}
              onOpenListView={() => setActiveView('BILL_LIST')}
            />
          )}

          {/* VIEW 3: Bulk Bill Print View */}
          {activeView === 'BULK_BILL' && (
            <BulkBillPrintView
              invoices={sales}
              currentUser={currentUser}
              onExit={() => setActiveView('CONSOLE')}
            />
          )}

          {/* VIEW 4: Master Management Screen */}
          {activeView === 'MASTERS' && (
            <MastersView
              items={items}
              categories={categories}
              tables={tables}
              restaurant={restaurant}
              onRefresh={fetchAllData}
            />
          )}

          {/* VIEW 5: Sales & Reports Screen */}
          {activeView === 'REPORTS' && (
            <ReportsView
              sales={sales}
              restaurant={restaurant}
            />
          )}

          {/* VIEW 6: Transactions, Petty Cash & Customer Khata */}
          {activeView === 'TRANSACTIONS' && (
            <TransactionsView
              currentUser={currentUser}
            />
          )}

          {/* VIEW 7: Banquet & Party Booking */}
          {activeView === 'BANQUET' && (
            <BanquetView />
          )}
        </div>
      </div>

      {/* 80mm Thermal Receipt Print Preview Modal */}
      <PrintBillModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        billData={printableData}
        restaurant={restaurant}
      />
    </div>
  );
}
