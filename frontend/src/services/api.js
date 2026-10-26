const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `API Error (${res.status})`);
    }
    return data;
  } catch (err) {
    console.error(`Fetch error at ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getUsers: () => request('/auth/users'),

  // Items
  getItems: () => request('/items'),
  createItem: (item) => request('/items', { method: 'POST', body: JSON.stringify(item) }),
  updateItem: (id, item) => request('/items/' + id, { method: 'PUT', body: JSON.stringify(item) }),
  deleteItem: (id) => request('/items/' + id, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (cat) => request('/categories', { method: 'POST', body: JSON.stringify(cat) }),
  updateCategory: (id, cat) => request('/categories/' + id, { method: 'PUT', body: JSON.stringify(cat) }),
  deleteCategory: (id) => request('/categories/' + id, { method: 'DELETE' }),

  // Tables
  getTables: () => request('/tables'),
  createTable: (tbl) => request('/tables', { method: 'POST', body: JSON.stringify(tbl) }),
  updateTable: (id, tbl) => request('/tables/' + id, { method: 'PUT', body: JSON.stringify(tbl) }),
  deleteTable: (id) => request('/tables/' + id, { method: 'DELETE' }),
  transferTable: (fromTableId, toTableId) =>
    request('/tables/transfer', {
      method: 'POST',
      body: JSON.stringify({ fromTableId, toTableId }),
    }),



  // KOT
  getKots: () => request('/kots'),
  createKot: (kot) => request('/kots', { method: 'POST', body: JSON.stringify(kot) }),
  updateKotStatus: (kotNo, status) =>
    request(`/kots/${kotNo}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Invoices & Sales
  getSales: () => request('/sales'),
  createInvoice: (invoice) => request('/sales', { method: 'POST', body: JSON.stringify(invoice) }),
  updateInvoice: (id, invoice) => request('/sales/' + id, { method: 'PUT', body: JSON.stringify(invoice) }),
  deleteInvoice: (id) => request('/sales/' + id, { method: 'DELETE' }),

  // Customers
  getCustomers: () => request('/customers'),
  createCustomer: (cust) => request('/customers', { method: 'POST', body: JSON.stringify(cust) }),
  clearCustomerDue: (id) => request(`/customers/${id}/clear-due`, { method: 'POST' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings) => request('/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Expenses
  getExpenses: (params = '') => request(`/expenses${params ? '?' + params : ''}`),
  getExpenseSummary: () => request('/expenses/summary'),
  createExpense: (exp) => request('/expenses', { method: 'POST', body: JSON.stringify(exp) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Banquet
  getBanquetBookings: () => request('/banquet'),
  createBanquetBooking: (booking) => request('/banquet', { method: 'POST', body: JSON.stringify(booking) }),
  updateBanquetBooking: (id, data) => request(`/banquet/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBanquetBooking: (id) => request(`/banquet/${id}`, { method: 'DELETE' }),

  // Store Inventory
  getInventory: () => request('/inventory'),
  createInventoryItem: (item) => request('/inventory/item', { method: 'POST', body: JSON.stringify(item) }),
  recordInventoryTxn: (txn) => request('/inventory/transaction', { method: 'POST', body: JSON.stringify(txn) }),
  getInventoryTxns: () => request('/inventory/transactions'),

  // Stewards
  getStewards: () => request('/stewards'),
  createSteward: (steward) => request('/stewards', { method: 'POST', body: JSON.stringify(steward) }),
  updateSteward: (id, steward) => request(`/stewards/${id}`, { method: 'PUT', body: JSON.stringify(steward) }),
  deleteSteward: (id) => request(`/stewards/${id}`, { method: 'DELETE' }),

  // Cash Flow & Transactions
  getCashFlow: (date = '') => request(`/transactions/cash-flow${date ? '?date=' + date : ''}`),
  getCustomerReceipts: () => request('/transactions/customer-receipts'),
  createCustomerReceipt: (rcp) => request('/transactions/customer-receipt', { method: 'POST', body: JSON.stringify(rcp) }),
  getVoidKots: () => request('/transactions/void-kots'),
  recordVoidKot: (voidData) => request('/transactions/void-kot', { method: 'POST', body: JSON.stringify(voidData) }),
};
