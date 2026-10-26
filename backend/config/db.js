import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { alineaCategories, alineaMenuItems } from './alineaMenuData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'restaurant.db');
const db = new Database(dbPath, { timeout: 15000 });

// Pragmas for fast, crash-resilient operation without locking issues
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 15000');

console.log('✅ SQLite Database Connected:', dbPath);

// Initialize DB Tables & Base Seeds
export function initDb() {
  try {
    db.exec(`
      -- Users Master
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'CASHIER',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Restaurant Profile & Settings
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT,
        address TEXT,
        phone TEXT,
        gstin TEXT,
        fssai TEXT,
        cgst_rate REAL DEFAULT 2.5,
        sgst_rate REAL DEFAULT 2.5,
        printer_width TEXT DEFAULT '80mm',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Menu Categories
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_order INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1
      );

      -- Menu Items
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category_name TEXT NOT NULL,
        unit TEXT DEFAULT 'Full',
        rate REAL NOT NULL,
        is_veg INTEGER DEFAULT 1,
        gst_rate REAL DEFAULT 5.0,
        is_available INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 1
      );

      -- Dining Tables
      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        area TEXT NOT NULL,
        capacity INTEGER DEFAULT 4,
        status TEXT DEFAULT 'AVAILABLE',
        current_bill_no TEXT,
        occupied_since TEXT
      );

      -- Kitchen Order Tickets (KOT)
      CREATE TABLE IF NOT EXISTS kots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kot_no TEXT NOT NULL UNIQUE,
        table_id TEXT,
        table_name TEXT NOT NULL,
        captain TEXT,
        time TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        items_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Invoices & Sales
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        table_name TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        customer_gst TEXT,
        payment_mode TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        grand_total REAL NOT NULL,
        items_count INTEGER DEFAULT 1,
        items_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Customers
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        address TEXT,
        visits INTEGER DEFAULT 1,
        credit_due REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Cash Expenses (Petty cash / Daily expenses)
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_no TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        paid_to TEXT,
        payment_mode TEXT DEFAULT 'CASH',
        remarks TEXT,
        created_by TEXT DEFAULT 'Admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Customer Credit Receipts (Khata jama / Udhar vasooli)
      CREATE TABLE IF NOT EXISTS customer_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_no TEXT,
        customer_id TEXT,
        customer_name TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_mode TEXT DEFAULT 'CASH',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Banquet Bookings & Billing
      CREATE TABLE IF NOT EXISTS banquet_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_no TEXT UNIQUE,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        event_name TEXT NOT NULL,
        hall_name TEXT DEFAULT 'Alinea Banquet Hall',
        event_date TEXT NOT NULL,
        event_time_slot TEXT NOT NULL,
        pax INTEGER NOT NULL,
        rate_per_pax REAL NOT NULL,
        package_total REAL NOT NULL,
        advance_paid REAL DEFAULT 0,
        balance_amount REAL NOT NULL,
        status TEXT DEFAULT 'CONFIRMED',
        menu_details TEXT,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Stewards & Captains Master
      CREATE TABLE IF NOT EXISTS stewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        phone TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Void / Cancelled KOTs
      CREATE TABLE IF NOT EXISTS void_kots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kot_no TEXT,
        table_name TEXT,
        reason TEXT,
        cancelled_by TEXT DEFAULT 'Admin',
        items_json TEXT,
        total_amount REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Store Inventory Items
      CREATE TABLE IF NOT EXISTS store_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Kitchen Grocery',
        unit TEXT DEFAULT 'Kg',
        current_stock REAL DEFAULT 0,
        min_reorder_level REAL DEFAULT 5,
        unit_cost REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Store Inventory Transactions (Purchase, Issue to Kitchen, Return, Wastage)
      CREATE TABLE IF NOT EXISTS store_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        item_id INTEGER,
        item_name TEXT NOT NULL,
        qty REAL NOT NULL,
        unit TEXT NOT NULL,
        unit_cost REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: ensure new columns exist on invoices
    try {
      const cols = db.prepare('PRAGMA table_info(invoices)').all();
      const colNames = cols.map(c => c.name);
      if (!colNames.includes('customer_gst')) db.prepare('ALTER TABLE invoices ADD COLUMN customer_gst TEXT').run();
      if (!colNames.includes('pax')) db.prepare('ALTER TABLE invoices ADD COLUMN pax INTEGER DEFAULT 1').run();
      if (!colNames.includes('steward')) db.prepare('ALTER TABLE invoices ADD COLUMN steward TEXT').run();
      if (!colNames.includes('discount_reason')) db.prepare('ALTER TABLE invoices ADD COLUMN discount_reason TEXT').run();
      if (!colNames.includes('payment_mode_2')) db.prepare('ALTER TABLE invoices ADD COLUMN payment_mode_2 TEXT').run();
      if (!colNames.includes('payment_amount_2')) db.prepare('ALTER TABLE invoices ADD COLUMN payment_amount_2 REAL DEFAULT 0').run();
    } catch {}

    // 1. Seed Users (admin, cashier, A)
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE username = ?').get('A').c;
    if (userCount === 0) {
      db.prepare(`
        INSERT OR IGNORE INTO users (username, password, name, role)
        VALUES ('A', 'A', 'Admin Cashier (A)', 'ADMIN'),
               ('admin', 'admin123', 'Manager Admin', 'ADMIN'),
               ('cashier', '1234', 'Cashier Counter', 'CASHIER')
      `).run();
      console.log('✅ Seeded user: A (A), admin (admin123), cashier (1234)');
    }

    // 2. Seed Restaurant Profile
    const setting = db.prepare('SELECT id, name FROM settings WHERE id = 1').get();
    if (!setting) {
      db.prepare(`
        INSERT INTO settings (id, name, tagline, address, phone, gstin, fssai, cgst_rate, sgst_rate, printer_width)
        VALUES (1, 'Alinea Restaurant & Banquet', 'Pure Veg & Multi-Cuisine', 'Near Parimal Garden, Punchvati Cross Road, Ahmedabad, Gujarat - 380006', '+91 9898745429', '24AAACH7890B1ZK', '1072300000001', 2.5, 2.5, '80mm')
      `).run();
    }

    // 3. Seed Categories & Items for Alinea Restaurant
    const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
    const itemCount = db.prepare('SELECT COUNT(*) as c FROM items').get().c;
    if (catCount === 0 || itemCount === 0) {
      db.prepare('DELETE FROM categories').run();
      db.prepare('DELETE FROM items').run();
      const insertCat = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, ?)');
      alineaCategories.forEach((cat, idx) => insertCat.run(cat, idx + 1));

      const insertItem = db.prepare(`
        INSERT INTO items (code, name, category_name, unit, rate, is_veg, gst_rate, display_order)
        VALUES (?, ?, ?, ?, ?, ?, 5.0, ?)
      `);
      alineaMenuItems.forEach((item, idx) => {
        insertItem.run(item.code, item.name, item.category, item.unit, item.rate, item.isVeg, idx + 1);
      });
    }

    // 5. Seed Tables (All AVAILABLE)
    const tblCount = db.prepare('SELECT COUNT(*) as c FROM tables').get().c;
    if (tblCount === 0) {
      const insertTbl = db.prepare('INSERT INTO tables (id, name, area, capacity, status) VALUES (?, ?, ?, ?, ?)');
      const tables = [
        ['T1', 'Table 1', 'Main Hall', 4, 'AVAILABLE'],
        ['T2', 'Table 2', 'Main Hall', 4, 'AVAILABLE'],
        ['T3', 'Table 3', 'Main Hall', 6, 'AVAILABLE'],
        ['T4', 'Table 4', 'Main Hall', 2, 'AVAILABLE'],
        ['T5', 'Table 5', 'Main Hall', 8, 'AVAILABLE'],
        ['T6', 'Table 6', 'Main Hall', 4, 'AVAILABLE'],
        ['AC1', 'AC Table 1', 'AC Lounge', 4, 'AVAILABLE'],
        ['AC2', 'AC Table 2', 'AC Lounge', 6, 'AVAILABLE'],
        ['AC3', 'AC Table 3', 'AC Lounge', 4, 'AVAILABLE'],
        ['G1', 'Garden 1', 'Garden Terrace', 4, 'AVAILABLE'],
        ['G2', 'Garden 2', 'Garden Terrace', 6, 'AVAILABLE']
      ];
      tables.forEach(t => insertTbl.run(...t));
    }

    // 6. Seed Stewards / Captains (Param Infotech steward codes)
    const stwCount = db.prepare('SELECT COUNT(*) as c FROM stewards').get().c;
    if (stwCount === 0) {
      const insertStw = db.prepare('INSERT INTO stewards (code, name, phone) VALUES (?, ?, ?)');
      [
        ['01', 'Ramesh Patel', '98250 11221'],
        ['02', 'Suresh Kumar', '98250 22332'],
        ['03', 'Mahesh Sharma', '98250 33443'],
        ['04', 'Dilip Vaghela', '98250 44554'],
        ['05', 'Kailash Joshi', '98250 55665']
      ].forEach(s => insertStw.run(...s));
      console.log('✅ Seeded stewards/captains');
    }

    // 7. Seed Store Inventory (Kitchen & Grocery Raw Materials)
    const invCount = db.prepare('SELECT COUNT(*) as c FROM store_inventory').get().c;
    if (invCount === 0) {
      const insertInv = db.prepare(`
        INSERT INTO store_inventory (code, name, category, unit, current_stock, min_reorder_level, unit_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      [
        ['RAW01', 'Fresh Malai Paneer', 'Dairy', 'Kg', 18.5, 5.0, 320],
        ['RAW02', 'Amul Processed Cheese', 'Dairy', 'Kg', 12.0, 3.0, 480],
        ['RAW03', 'Amul Butter (Yellow)', 'Dairy', 'Kg', 15.0, 4.0, 490],
        ['RAW04', 'Basmati Premium Rice', 'Grains', 'Kg', 65.0, 20.0, 95],
        ['RAW05', 'Fortune Refined Cottonseed Oil', 'Oil & Ghee', 'Ltr', 45.0, 15.0, 125],
        ['RAW06', 'Pure Cow Ghee', 'Oil & Ghee', 'Kg', 8.0, 3.0, 580],
        ['RAW07', 'Fresh Farm Tomatoes', 'Vegetables', 'Kg', 22.0, 10.0, 35],
        ['RAW08', 'Nasik Red Onions', 'Vegetables', 'Kg', 40.0, 15.0, 28],
        ['RAW09', 'Maida (Refined Flour)', 'Flour', 'Kg', 35.0, 10.0, 42],
        ['RAW10', 'Whole Cashew Nuts (Kaju Tukda)', 'Dry Fruits', 'Kg', 6.5, 2.0, 720],
        ['RAW11', 'Full Cream Milk', 'Dairy', 'Ltr', 25.0, 10.0, 64],
        ['RAW12', 'Garam Masala & Spices Mix', 'Spices', 'Pkt', 14.0, 5.0, 180]
      ].forEach(row => insertInv.run(...row));
      console.log('✅ Seeded store inventory items');
    }

    // 8. Seed Sample Expenses (Petty cash)
    const expCount = db.prepare('SELECT COUNT(*) as c FROM expenses').get().c;
    if (expCount === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const insertExp = db.prepare(`
        INSERT INTO expenses (expense_no, date, time, category, amount, paid_to, payment_mode, remarks, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      [
        ['EXP-001', today, '08:30 AM', 'Vegetables & Fruits', 1250, 'APMC Mandi Vendor', 'CASH', 'Daily fresh vegetables purchase', 'Admin'],
        ['EXP-002', today, '09:15 AM', 'Dairy & Milk', 960, 'Amul Parlour', 'CASH', 'Morning milk and dahi packets', 'Admin'],
        ['EXP-003', today, '11:45 AM', 'Kitchen Grocery', 1800, 'Mahavir Kirana Store', 'UPI', 'Masala and cooking supplies', 'Admin'],
        ['EXP-004', today, '02:30 PM', 'Tea & Refreshment', 180, 'Local Tea Stall', 'CASH', 'Staff morning & afternoon tea', 'Admin']
      ].forEach(e => insertExp.run(...e));
      console.log('✅ Seeded sample daily expenses');
    }

    // 9. Seed Sample Banquet Booking
    const bnqCount = db.prepare('SELECT COUNT(*) as c FROM banquet_bookings').get().c;
    if (bnqCount === 0) {
      const nextWeek = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      db.prepare(`
        INSERT INTO banquet_bookings (booking_no, customer_name, customer_phone, event_name, hall_name, event_date, event_time_slot, pax, rate_per_pax, package_total, advance_paid, balance_amount, status, menu_details, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'BNQ-2026-001',
        'Rajeshbhai Shah',
        '98981 12345',
        '25th Silver Wedding Anniversary',
        'Alinea Grand Banquet',
        nextWeek,
        'Dinner (7:30 PM - 11:30 PM)',
        85,
        450,
        38250,
        15000,
        23250,
        'CONFIRMED',
        'Welcome Drink: Fresh Lime Soda, Soups: Cream of Tomato, Starters: Hara Bhara Kabab, Paneer Chilli, Main: Paneer Angara, Veg Handi, Dal Makhani, Jeera Rice, Tandoori Breads, Dessert: Sizzling Brownie',
        'Stage decoration and welcome mocktails included'
      );
      console.log('✅ Seeded sample banquet booking');
    }

    // 10. Seed Credit Customers (Khata accounts)
    const custCount = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
    if (custCount === 0) {
      const insertCust = db.prepare(`
        INSERT INTO customers (id, name, phone, address, visits, credit_due)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      [
        ['CUST01', 'Patel Brothers & Co.', '98240 12345', 'C.G. Road, Navrangpura, Ahmedabad', 14, 4850.0],
        ['CUST02', 'Dr. Alkesh Mehta', '98980 67890', 'Parimal Garden Cross Roads, Ahmedabad', 8, 1200.0],
        ['CUST03', 'Navrang Traders Pvt Ltd', '97120 54321', 'Ashram Road, Ahmedabad', 22, 6500.0],
        ['CUST04', 'Snehal Vyas', '94260 98765', 'Paldi, Ahmedabad', 5, 0.0]
      ].forEach(c => insertCust.run(...c));
      console.log('✅ Seeded regular credit customers');
    }



  } catch (err) {
    console.error('❌ Database init error:', err);
  }
}

initDb();

export default db;
