import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Layers,
  Grid,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Save,
  AlertCircle,
  Building2,
  Printer
} from 'lucide-react';
import { api } from '../../services/api';

export default function MastersView({
  items = [],
  categories = [],
  tables = [],
  restaurant = {},
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('ITEMS'); // 'ITEMS', 'CATEGORIES', 'TABLES', 'STAFF', 'SETTINGS'
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ text: '', type: 'success' });

  // 1. Item Form State
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemRate, setNewItemRate] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Full');
  const [newItemIsVeg, setNewItemIsVeg] = useState(1);
  const [newItemGst, setNewItemGst] = useState(5.0);

  // 2. Category Form State
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatOrder, setNewCatOrder] = useState('1');

  // 3. Table Form State
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableId, setNewTableId] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableArea, setNewTableArea] = useState('Main Hall');
  const [newTableCap, setNewTableCap] = useState(4);

  // 4. Stewards State
  const [stewards, setStewards] = useState([]);
  const [showAddSteward, setShowAddSteward] = useState(false);
  const [newStewardCode, setNewStewardCode] = useState('');
  const [newStewardName, setNewStewardName] = useState('');
  const [newStewardPhone, setNewStewardPhone] = useState('');

  // 5. Customers State
  const [customers, setCustomers] = useState([]);
  const [showAddCust, setShowAddCust] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCredit, setNewCustCredit] = useState(0);

  // 6. Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    name: restaurant?.name || 'Alinea Restaurant & Banquet',
    tagline: restaurant?.tagline || 'Pure Veg & Multi-Cuisine',
    address: restaurant?.address || '',
    phone: restaurant?.phone || '',
    gstin: restaurant?.gstin || '',
    fssai: restaurant?.fssai || '',
    cgstRate: restaurant?.cgstRate ?? 2.5,
    sgstRate: restaurant?.sgstRate ?? 2.5,
    printerWidth: restaurant?.printerWidth || '80mm'
  });

  const loadExtraMasters = async () => {
    try {
      const [stwRes, custRes] = await Promise.all([api.getStewards(), api.getCustomers()]);
      if (stwRes?.data) setStewards(stwRes.data);
      if (custRes?.data) setCustomers(custRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    loadExtraMasters();
  }, []);

  const showMsg = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification({ text: '', type: 'success' }), 4000);
  };

  // 1. Create Item Handler
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemCode || !newItemName || !newItemRate) {
      showMsg('Code, Name, and Rate are required', 'error');
      return;
    }

    try {
      await api.createItem({
        code: newItemCode.trim(),
        name: newItemName.trim(),
        category_name: newItemCategory || (categories[0]?.name || 'Main Course'),
        unit: newItemUnit,
        rate: parseFloat(newItemRate),
        is_veg: newItemIsVeg,
        gst_rate: parseFloat(newItemGst) || 5.0
      });
      showMsg('Item added to Item Master!');
      setNewItemCode('');
      setNewItemName('');
      setNewItemRate('');
      setShowAddItem(false);
      onRefresh();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // Delete Item Handler
  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Delete item "${name}" from master?`)) return;
    try {
      await api.deleteItem(id);
      showMsg('Item removed');
      onRefresh();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // 2. Create Category Handler
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory({
        name: newCatName.trim(),
        display_order: parseInt(newCatOrder) || 1
      });
      showMsg('Category added!');
      setNewCatName('');
      setShowAddCat(false);
      onRefresh();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(id);
      showMsg('Category deleted');
      onRefresh();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // 3. Create Table Handler
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableId || !newTableName) return;
    try {
      await api.createTable({
        id: newTableId.trim(),
        name: newTableName.trim(),
        area: newTableArea,
        capacity: parseInt(newTableCap) || 4,
        status: 'AVAILABLE'
      });
      showMsg('Table added!');
      setNewTableId('');
      setNewTableName('');
      setShowAddTable(false);
      onRefresh();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm(`Delete table ${id}?`)) return;
    try {
      await api.deleteTable(id);
      showMsg('Table deleted');
      onRefresh();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // 4. Steward Handlers
  const handleCreateSteward = async (e) => {
    e.preventDefault();
    if (!newStewardCode || !newStewardName) return;
    try {
      await api.createSteward({ code: newStewardCode.trim(), name: newStewardName.trim(), phone: newStewardPhone.trim() });
      showMsg('Steward added!');
      setNewStewardCode('');
      setNewStewardName('');
      setNewStewardPhone('');
      setShowAddSteward(false);
      loadExtraMasters();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteSteward = async (id) => {
    if (!window.confirm('Delete this steward?')) return;
    try {
      await api.deleteSteward(id);
      showMsg('Steward deleted');
      loadExtraMasters();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // 5. Customer Handlers
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    try {
      await api.createCustomer({
        id: `CUST${Date.now().toString().slice(-4)}`,
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim(),
        credit_due: parseFloat(newCustCredit) || 0
      });
      showMsg('Customer added!');
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setNewCustCredit(0);
      setShowAddCust(false);
      loadExtraMasters();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // 6. Update Restaurant Settings Handler
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settingsForm);
      showMsg('Restaurant profile & GST settings updated!');
      onRefresh();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  };

  // Filter items
  const filteredItems = items.filter(
    i => i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         i.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         i.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden p-3">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="bg-inspire-800 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-extrabold flex items-center space-x-2">
              <Settings className="w-5 h-5 text-sky-400" />
              <span>Restaurant Master Management</span>
            </h2>
            <p className="text-[11px] text-slate-300">
              Manage Items, Categories, Tables, Stewards and Customers directly in SQLite
            </p>
          </div>

          {/* Master Tabs */}
          <div className="flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700">
            {[
              { id: 'ITEMS', label: 'Item Master', icon: UtensilsCrossed },
              { id: 'CATEGORIES', label: 'Categories', icon: Layers },
              { id: 'TABLES', label: 'Tables', icon: Grid },
              { id: 'STEWARDS', label: 'Stewards/Captains', icon: Users },
              { id: 'CUSTOMERS', label: 'Customers Khata', icon: Users },
              { id: 'SETTINGS', label: 'Restaurant & Tax', icon: Building2 },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-brand-orange text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification.text && (
          <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between ${
            notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
          }`}>
            <span>{notification.text}</span>
            <button onClick={() => setNotification({ text: '', type: 'success' })}>✕</button>
          </div>
        )}

        {/* TAB 1: ITEM MASTER */}
        {activeTab === 'ITEMS' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item by code, name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-brand-orange"
                />
              </div>

              <button
                onClick={() => setShowAddItem(!showAddItem)}
                className="px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddItem ? 'Close Form' : '+ New Item'}</span>
              </button>
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <form onSubmit={handleCreateItem} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in fade-in">
                <h4 className="font-bold text-xs text-slate-800 mb-3 uppercase tracking-wider">Add New Item to Master</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Item Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 118"
                      value={newItemCode}
                      onChange={(e) => setNewItemCode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-semibold mb-1">Item Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Malai Kofta"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Category</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Rate / Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={newItemRate}
                      onChange={(e) => setNewItemRate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                    >
                      Save Item
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-16">Code</th>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-center">Unit</th>
                    <th className="p-3 text-center">GST %</th>
                    <th className="p-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-brand-orange">{item.code}</td>
                      <td className="p-3 font-bold text-slate-800">{item.name}</td>
                      <td className="p-3 text-slate-600">{item.category_name}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{item.rate}</td>
                      <td className="p-3 text-center text-slate-500">{item.unit}</td>
                      <td className="p-3 text-center text-slate-500">{item.gst_rate}%</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES */}
        {activeTab === 'CATEGORIES' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-800">Menu Category Master</h3>
              <button
                onClick={() => setShowAddCat(!showAddCat)}
                className="px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            {showAddCat && (
              <form onSubmit={handleCreateCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Sizzlers)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold"
                  required
                />
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                  Save
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((c, idx) => (
                <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800">{c.name}</span>
                    <span className="text-[10px] text-slate-400 block">Display Order: {idx + 1}</span>
                  </div>
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TABLES */}
        {activeTab === 'TABLES' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-800">Restaurant Dining Tables Master</h3>
              <button
                onClick={() => setShowAddTable(!showAddTable)}
                className="px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Table</span>
              </button>
            </div>

            {showAddTable && (
              <form onSubmit={handleCreateTable} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Table ID (e.g. T7)"
                  value={newTableId}
                  onChange={(e) => setNewTableId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  required
                />
                <input
                  type="text"
                  placeholder="Table Name (e.g. Table 7)"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-bold"
                  required
                />
                <select
                  value={newTableArea}
                  onChange={(e) => setNewTableArea(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  <option value="Main Hall">Main Hall</option>
                  <option value="AC Lounge">AC Lounge</option>
                  <option value="Garden Terrace">Garden Terrace</option>
                </select>
                <button type="submit" className="py-2 bg-emerald-600 text-white rounded-lg font-bold">
                  Save Table
                </button>
              </form>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {tables.map(t => (
                <div key={t.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-brand-orange text-xs">{t.id}</div>
                    <div className="font-bold text-xs text-slate-800">{t.name}</div>
                    <div className="text-[10px] text-slate-400">{t.area} • {t.capacity} Seats</div>
                  </div>
                  <button onClick={() => handleDeleteTable(t.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* TAB 4: STEWARDS / CAPTAINS */}
        {activeTab === 'STEWARDS' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Stewards & Captains Master</h3>
                <p className="text-xs text-slate-500">Tag captains and stewards for table orders and sales analysis</p>
              </div>
              <button
                onClick={() => setShowAddSteward(!showAddSteward)}
                className="px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Steward</span>
              </button>
            </div>

            {showAddSteward && (
              <form onSubmit={handleCreateSteward} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Steward Code (e.g. 06)"
                  value={newStewardCode}
                  onChange={(e) => setNewStewardCode(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  required
                />
                <input
                  type="text"
                  placeholder="Full Name (e.g. Bharat Dave)"
                  value={newStewardName}
                  onChange={(e) => setNewStewardName(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-bold"
                  required
                />
                <input
                  type="text"
                  placeholder="Mobile / Contact No."
                  value={newStewardPhone}
                  onChange={(e) => setNewStewardPhone(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
                <button type="submit" className="py-2 bg-emerald-600 text-white rounded-lg font-bold cursor-pointer">
                  Save Steward
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {stewards.map((s) => (
                <div key={s.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-brand-orange text-xs">Code: {s.code}</span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">Active</span>
                    </div>
                    <div className="font-bold text-xs text-slate-800 mt-0.5">{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.phone || 'No phone'}</div>
                  </div>
                  <button onClick={() => handleDeleteSteward(s.id)} className="text-slate-400 hover:text-red-500 p-1 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER KHATA ACCOUNTS */}
        {activeTab === 'CUSTOMERS' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Credit Customers & Khata Accounts</h3>
                <p className="text-xs text-slate-500">Regular party & corporate customers with credit ledger balance</p>
              </div>
              <button
                onClick={() => setShowAddCust(!showAddCust)}
                className="px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>

            {showAddCust && (
              <form onSubmit={handleCreateCustomer} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Customer / Company Name *"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-bold"
                  required
                />
                <input
                  type="text"
                  placeholder="Phone No. *"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  required
                />
                <input
                  type="text"
                  placeholder="Address / Locality"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2"
                />
                <input
                  type="number"
                  placeholder="Opening Due (₹)"
                  value={newCustCredit}
                  onChange={(e) => setNewCustCredit(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
                <button type="submit" className="py-2 bg-emerald-600 text-white rounded-lg font-bold cursor-pointer">
                  Save Customer
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {customers.map((c) => (
                <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{c.phone}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{c.address || '-'}</div>
                    <div className="mt-1 text-xs font-mono font-bold">
                      <span className="text-slate-500 text-[10px] font-normal">Credit Due: </span>
                      <span className={c.credit_due > 0 ? 'text-red-600' : 'text-emerald-600'}>
                        ₹{Number(c.credit_due || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: RESTAURANT SETTINGS & TAX */}
        {activeTab === 'SETTINGS' && (
          <div className="flex-1 p-5 overflow-y-auto max-w-3xl">
            <h3 className="font-bold text-sm text-slate-800 mb-4">Restaurant Profile & GST Tax Configuration</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Full Restaurant Address</label>
                <textarea
                  rows="2"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={settingsForm.gstin}
                    onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">FSSAI License No.</label>
                  <input
                    type="text"
                    value={settingsForm.fssai}
                    onChange={(e) => setSettingsForm({ ...settingsForm, fssai: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">CGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsForm.cgstRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, cgstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">SGST Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsForm.sgstRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, sgstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Printer Receipt Width</label>
                  <select
                    value={settingsForm.printerWidth}
                    onChange={(e) => setSettingsForm({ ...settingsForm, printerWidth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-semibold"
                  >
                    <option value="80mm">80mm (Standard Thermal)</option>
                    <option value="58mm">58mm (Compact Mobile)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-brand-orange/20 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Restaurant Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
