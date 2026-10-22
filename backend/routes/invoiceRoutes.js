import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM invoices ORDER BY id DESC').all();
    const invoices = rows.map(r => ({
      ...r,
      invoiceNo: r.invoice_no,
      tableName: r.table_name,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerGst: r.customer_gst,
      paymentMode: r.payment_mode,
      grandTotal: r.grand_total,
      items: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json,
    }));
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  const {
    invoiceNo,
    date,
    time,
    tableName,
    customerName,
    customerPhone = '',
    customerGst = '',
    paymentMode,
    subtotal,
    discount = 0,
    tax = 0,
    grandTotal,
    items
  } = req.body;

  if (!invoiceNo || grandTotal === undefined) {
    return res.status(400).json({ success: false, message: 'Missing invoice required fields' });
  }

  try {
    db.prepare(`
      INSERT INTO invoices (invoice_no, date, time, table_name, customer_name, customer_phone, customer_gst, payment_mode, subtotal, discount, tax, grand_total, items_count, items_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceNo,
      date || new Date().toLocaleDateString('en-GB'),
      time || new Date().toLocaleTimeString(),
      tableName || 'Counter',
      customerName || 'Walk-in Guest',
      customerPhone || '',
      customerGst || '',
      paymentMode || 'CASH',
      parseFloat(subtotal) || 0,
      parseFloat(discount) || 0,
      parseFloat(tax) || 0,
      parseFloat(grandTotal) || 0,
      Array.isArray(items) ? items.length : 1,
      JSON.stringify(items || [])
    );

    res.status(201).json({ success: true, message: 'Invoice settled and saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
