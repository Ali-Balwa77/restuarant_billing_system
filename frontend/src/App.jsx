import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import LoginView from './components/LoginView';
import FastBillingView from './components/POS/FastBillingView';
import MastersView from './components/Masters/MastersView';
import KitchenView from './components/Kitchen/KitchenView';
import ReportsView from './components/Reports/ReportsView';
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

  // 2. Active Screen View ('BILLING', 'MASTERS', 'KITCHEN', 'REPORTS')
  const [activeView, setActiveView] = useState('BILLING');
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
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_user');
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
    const nextNum = invoiceCounter + 1;
    setInvoiceCounter(nextNum);
    setBillNo(String(nextNum).padStart(4, '0'));
    setOrderType('DINE_IN');
    setSelectedTable(null);
    setOrderItems([]);
    setCustomer({ name: '', gstNo: '' });
    setActiveView('BILLING');
  }, [invoiceCounter]);

  // Fire KOT to Kitchen
  const handleGenerateKot = useCallback(async () => {
    if (orderItems.length === 0) {
      alert('Please add at least one item to fire KOT.');
      return;
    }

    const nextKotNo = `KOT-${100 + kots.length + 1}`;
    const kotPayload = {
      kotNo: nextKotNo,
      tableId: selectedTable?.id || 'WALK-IN',
      tableName: orderType === 'DINE_IN' ? (selectedTable?.name || 'Table') : orderType,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING',
      items: orderItems.map(i => ({ name: i.name, qty: i.qty, notes: '' })),
    };

    try {
      await api.createKot(kotPayload);
      if (orderType === 'DINE_IN' && selectedTable?.id) {
        await api.updateTable(selectedTable.id, { status: 'OCCUPIED' });
      }
      await fetchAllData();
      alert(`🔥 Kitchen Order Ticket ${nextKotNo} sent to kitchen!`);
    } catch (err) {
      alert(`Error saving KOT: ${err.message}`);
    }
  }, [orderItems, orderType, selectedTable, kots.length, fetchAllData]);

  // Settle Bill
  const handleSettleBill = useCallback(async (calcData) => {
    const settleItems = (calcData?.items && calcData.items.length > 0) ? calcData.items : orderItems;
    if (!settleItems || settleItems.length === 0) {
      alert('Cannot settle empty order');
      return;
    }

    const invoicePayload = {
      invoiceNo: billNo,
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tableName: orderType === 'DINE_IN' ? (selectedTable?.name || 'Table') : orderType,
      customerName: customer.name || 'Walk-in Guest',
      customerGst: customer.gstNo || '',
      paymentMode: calcData?.paymentMode || 'CASH',
      subtotal: calcData?.subtotal,
      discount: calcData?.discount,
      tax: calcData?.tax,
      grandTotal: calcData?.grandTotal,
      items: settleItems,
    };

    try {
      await api.createInvoice(invoicePayload);

      // Free table if dine-in
      if (orderType === 'DINE_IN' && selectedTable?.id) {
        await api.updateTable(selectedTable.id, { status: 'AVAILABLE' });
        removeRunningOrder(selectedTable.id);
      }

      await fetchAllData();

      // Open print receipt
      setPrintableData(invoicePayload);
      setIsPrintOpen(true);

      // Prepare fresh new bill
      handleNewBill();
    } catch (err) {
      alert(`Error settling bill: ${err.message}`);
    }
  }, [orderItems, billNo, orderType, selectedTable, customer, fetchAllData, handleNewBill, removeRunningOrder]);

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
        isOnline={isBackendOnline}
      />

      {/* Main Body: Left Sidebar + Central Workstation */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          setActiveView={handleSelectView}
          kotsCount={kots.length}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Central View Switcher */}
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-slate-100">
          {/* VIEW 1: Bill / POS Fast Billing Screen */}
          {activeView === 'BILLING' && (
            <FastBillingView
              billNo={billNo}
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
              onGenerateKot={handleGenerateKot}
              onSettleBill={handleSettleBill}
              onNewBill={handleNewBill}
              onTransferTable={handleTransferTable}
            />
          )}

          {/* VIEW 2: Master Management Screen */}
          {activeView === 'MASTERS' && (
            <MastersView
              items={items}
              categories={categories}
              tables={tables}
              restaurant={restaurant}
              onRefresh={fetchAllData}
            />
          )}

          {/* VIEW 3: Live Kitchen (KOTs) Screen */}
          {activeView === 'KITCHEN' && (
            <KitchenView
              kots={kots}
              onRefresh={fetchAllData}
            />
          )}

          {/* VIEW 4: Sales & Reports Screen */}
          {activeView === 'REPORTS' && (
            <ReportsView
              sales={sales}
              restaurant={restaurant}
            />
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
