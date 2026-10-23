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
      pax: r.pax || 1,
      steward: r.steward || '',
      discountReason: r.discount_reason || '',
      paymentMode2: r.payment_mode_2 || '',
      paymentAmount2: r.payment_amount_2 || 0,
      items: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : (r.items_json || []),
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
    items,
    pax = 1,
    steward = '',
    discountReason = '',
    paymentMode2 = '',
    paymentAmount2 = 0
  } = req.body;

  if (!invoiceNo || grandTotal === undefined) {
    return res.status(400).json({ success: false, message: 'Missing invoice required fields' });
  }

  try {
    db.prepare(`
      INSERT INTO invoices (
        invoice_no, date, time, table_name, customer_name, customer_phone, customer_gst,
        payment_mode, subtotal, discount, tax, grand_total, items_count, items_json,
        pax, steward, discount_reason, payment_mode_2, payment_amount_2
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      JSON.stringify(items || []),
      parseInt(pax) || 1,
      steward || '',
      discountReason || '',
      paymentMode2 || '',
      parseFloat(paymentAmount2) || 0
    );

    res.status(201).json({ success: true, message: 'Invoice settled and saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    customerName,
    customerPhone,
    customerGst,
    tableName,
    pax,
    steward,
    paymentMode,
    subtotal,
    discount,
    discountReason,
    tax,
    grandTotal,
    paymentMode2,
    paymentAmount2,
    items
  } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM invoices WHERE id = ? OR invoice_no = ?').get(id, id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const updatedItems = items !== undefined ? JSON.stringify(items) : existing.items_json;
    const itemsCount = items !== undefined ? (Array.isArray(items) ? items.length : 1) : existing.items_count;

    db.prepare(`
      UPDATE invoices
      SET customer_name = COALESCE(?, customer_name),
          customer_phone = COALESCE(?, customer_phone),
          customer_gst = COALESCE(?, customer_gst),
          table_name = COALESCE(?, table_name),
          pax = COALESCE(?, pax),
          steward = COALESCE(?, steward),
          payment_mode = COALESCE(?, payment_mode),
          subtotal = COALESCE(?, subtotal),
          discount = COALESCE(?, discount),
          discount_reason = COALESCE(?, discount_reason),
          tax = COALESCE(?, tax),
          grand_total = COALESCE(?, grand_total),
          payment_mode_2 = COALESCE(?, payment_mode_2),
          payment_amount_2 = COALESCE(?, payment_amount_2),
          items_count = ?,
          items_json = ?
      WHERE id = ? OR invoice_no = ?
    `).run(
      customerName !== undefined ? customerName : null,
      customerPhone !== undefined ? customerPhone : null,
      customerGst !== undefined ? customerGst : null,
      tableName !== undefined ? tableName : null,
      pax !== undefined ? parseInt(pax) : null,
      steward !== undefined ? steward : null,
      paymentMode !== undefined ? paymentMode : null,
      subtotal !== undefined ? parseFloat(subtotal) : null,
      discount !== undefined ? parseFloat(discount) : null,
      discountReason !== undefined ? discountReason : null,
      tax !== undefined ? parseFloat(tax) : null,
      grandTotal !== undefined ? parseFloat(grandTotal) : null,
      paymentMode2 !== undefined ? paymentMode2 : null,
      paymentAmount2 !== undefined ? parseFloat(paymentAmount2) : null,
      itemsCount,
      updatedItems,
      id,
      id
    );

    res.json({ success: true, message: 'Invoice updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM invoices WHERE id = ? OR invoice_no = ?').run(id, id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
