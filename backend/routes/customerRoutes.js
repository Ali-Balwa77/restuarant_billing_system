import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  const { name, phone, address = 'Ahmedabad', credit_due = 0 } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Customer name and phone required' });

  const id = `cust-${phone.trim()}`;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO customers (id, name, phone, address, credit_due)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name.trim(), phone.trim(), address.trim(), parseFloat(credit_due) || 0);

    const newCust = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json({ success: true, message: 'Customer saved', data: newCust });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/clear-due', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE customers SET credit_due = 0 WHERE id = ?').run(id);
    res.json({ success: true, message: 'Credit due cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
