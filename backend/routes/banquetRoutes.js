import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// GET /api/banquet - List all banquet bookings
router.get('/', (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM banquet_bookings ORDER BY event_date ASC, id DESC').all();
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/banquet - Create banquet booking
router.post('/', (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      event_name,
      hall_name = 'Alinea Banquet Hall',
      event_date,
      event_time_slot,
      pax,
      rate_per_pax,
      advance_paid = 0,
      menu_details = '',
      remarks = ''
    } = req.body;

    if (!customer_name || !customer_phone || !event_name || !event_date || !pax || !rate_per_pax) {
      return res.status(400).json({ success: false, message: 'Missing required banquet booking fields' });
    }

    const package_total = parseFloat(pax) * parseFloat(rate_per_pax);
    const advance = parseFloat(advance_paid) || 0;
    const balance_amount = package_total - advance;

    const count = db.prepare('SELECT COUNT(*) as c FROM banquet_bookings').get().c + 1;
    const booking_no = `BNQ-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO banquet_bookings (
        booking_no, customer_name, customer_phone, event_name, hall_name,
        event_date, event_time_slot, pax, rate_per_pax, package_total,
        advance_paid, balance_amount, status, menu_details, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      booking_no,
      customer_name,
      customer_phone,
      event_name,
      hall_name,
      event_date,
      event_time_slot || 'Dinner',
      parseInt(pax),
      parseFloat(rate_per_pax),
      package_total,
      advance,
      balance_amount,
      'CONFIRMED',
      menu_details,
      remarks
    );

    const created = db.prepare('SELECT * FROM banquet_bookings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Banquet booking created successfully', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/banquet/:id - Update booking or status (e.g. BILLED / CANCELLED)
router.put('/:id', (req, res) => {
  try {
    const { status, advance_paid, balance_amount, remarks } = req.body;
    const current = db.prepare('SELECT * FROM banquet_bookings WHERE id = ?').get(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const newStatus = status !== undefined ? status : current.status;
    const newAdvance = advance_paid !== undefined ? parseFloat(advance_paid) : current.advance_paid;
    const newBalance = balance_amount !== undefined ? parseFloat(balance_amount) : (current.package_total - newAdvance);
    const newRemarks = remarks !== undefined ? remarks : current.remarks;

    db.prepare(`
      UPDATE banquet_bookings 
      SET status = ?, advance_paid = ?, balance_amount = ?, remarks = ?
      WHERE id = ?
    `).run(newStatus, newAdvance, newBalance, newRemarks, req.params.id);

    const updated = db.prepare('SELECT * FROM banquet_bookings WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Booking updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/banquet/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM banquet_bookings WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
