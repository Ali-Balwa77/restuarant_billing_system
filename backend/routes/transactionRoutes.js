import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// GET /api/transactions/cash-flow - Complete daily cash flow statement
router.get('/cash-flow', (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().slice(0, 10);

    // 1. Total Cash Sales from Invoices
    const cashSales = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as total 
      FROM invoices 
      WHERE (payment_mode = 'CASH' OR payment_mode_2 = 'CASH')
        AND date = ?
    `).get(today).total;

    // 2. Total UPI / Card / Other Sales
    const digitalSales = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as total 
      FROM invoices 
      WHERE payment_mode IN ('UPI', 'CARD', 'ONLINE')
        AND date = ?
    `).get(today).total;

    // 3. Customer Cash Receipts (Khata payments received in cash)
    const customerCashReceipts = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM customer_receipts 
      WHERE payment_mode = 'CASH' AND date = ?
    `).get(today).total;

    // 4. Banquet Advance / Settlement Cash
    const banquetCash = db.prepare(`
      SELECT COALESCE(SUM(advance_paid), 0) as total 
      FROM banquet_bookings 
      WHERE DATE(created_at) = ?
    `).get(today).total;

    // 5. Cash Expenses
    const cashExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE payment_mode = 'CASH' AND date = ?
    `).get(today).total;

    // Net Cash in Hand calculated for today
    const totalCashIn = cashSales + customerCashReceipts + banquetCash;
    const totalCashOut = cashExpenses;
    const netCashInHand = totalCashIn - totalCashOut;

    res.json({
      success: true,
      data: {
        date: today,
        cashSales,
        digitalSales,
        customerCashReceipts,
        banquetCash,
        totalCashIn,
        cashExpenses,
        totalCashOut,
        netCashInHand
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions/customer-receipts - List all customer credit receipts
router.get('/customer-receipts', (req, res) => {
  try {
    const receipts = db.prepare('SELECT * FROM customer_receipts ORDER BY id DESC LIMIT 100').all();
    res.json({ success: true, data: receipts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/transactions/customer-receipt - Record credit settlement & reduce customer credit_due
router.post('/customer-receipt', (req, res) => {
  try {
    const { customer_id, amount, payment_mode = 'CASH', remarks = '' } = req.body;
    if (!customer_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid customer and positive amount are required' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const receiptAmount = parseFloat(amount);
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const count = db.prepare('SELECT COUNT(*) as c FROM customer_receipts').get().c + 1;
    const receipt_no = `RCP-${String(count).padStart(4, '0')}`;

    const newDue = Math.max(0, customer.credit_due - receiptAmount);

    db.transaction(() => {
      // 1. Insert receipt
      db.prepare(`
        INSERT INTO customer_receipts (receipt_no, customer_id, customer_name, date, time, amount, payment_mode, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(receipt_no, customer.id, customer.name, date, time, receiptAmount, payment_mode, remarks);

      // 2. Deduct credit due
      db.prepare('UPDATE customers SET credit_due = ? WHERE id = ?').run(newDue, customer.id);
    })();

    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
    res.status(201).json({
      success: true,
      message: `Received ₹${receiptAmount} from ${customer.name}. New outstanding balance: ₹${newDue}`,
      data: {
        receipt_no,
        customer: updatedCustomer
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions/void-kots - List all void/cancelled KOTs
router.get('/void-kots', (req, res) => {
  try {
    const voidKots = db.prepare('SELECT * FROM void_kots ORDER BY id DESC LIMIT 100').all();
    res.json({ success: true, data: voidKots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/transactions/void-kot - Record a void KOT
router.post('/void-kot', (req, res) => {
  try {
    const { kot_no, table_name, reason, cancelled_by = 'Admin', items_json, total_amount = 0 } = req.body;
    if (!kot_no || !table_name || !reason) {
      return res.status(400).json({ success: false, message: 'KOT No, Table, and Cancellation Reason are required' });
    }

    const result = db.prepare(`
      INSERT INTO void_kots (kot_no, table_name, reason, cancelled_by, items_json, total_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(kot_no, table_name, reason, cancelled_by, typeof items_json === 'string' ? items_json : JSON.stringify(items_json || []), parseFloat(total_amount));

    res.status(201).json({ success: true, message: 'Void KOT recorded', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
