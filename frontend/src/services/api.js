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

  // Customers
  getCustomers: () => request('/customers'),
  createCustomer: (cust) => request('/customers', { method: 'POST', body: JSON.stringify(cust) }),
  clearCustomerDue: (id) => request(`/customers/${id}/clear-due`, { method: 'POST' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings) => request('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};
