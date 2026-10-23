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

    // 1. Seed Users (admin, cashier)
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    if (userCount === 0) {
      db.prepare(`
        INSERT INTO users (username, password, name, role)
        VALUES ('admin', 'admin123', 'Manager Admin', 'ADMIN'),
               ('cashier', '1234', 'Cashier Counter', 'CASHIER')
      `).run();
      console.log('✅ Seeded users: admin (admin123), cashier (1234)');
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



  } catch (err) {
    console.error('❌ Database init error:', err);
  }
}

initDb();

export default db;
