import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// GET /api/expenses - List expenses with optional date filtering
router.get('/', (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }
    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY id DESC';
    const expenses = db.prepare(query).all(...params);
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/expenses/summary - Get today's expenses & category breakdown
router.get('/summary', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const todayTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = ?').get(today).total;
    const allTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses').get().total;
    const byCategory = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM expenses 
      GROUP BY category 
      ORDER BY total DESC
    `).all();

    res.json({
      success: true,
      data: {
        todayTotal,
        allTotal,
        byCategory
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/expenses - Create new expense entry
router.post('/', (req, res) => {
  try {
    const { category, amount, paid_to, payment_mode = 'CASH', remarks = '', created_by = 'Admin' } = req.body;
    if (!category || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid category and positive amount are required' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Generate expense no
    const count = db.prepare('SELECT COUNT(*) as c FROM expenses').get().c + 1;
    const expense_no = `EXP-${String(count).padStart(3, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO expenses (expense_no, date, time, category, amount, paid_to, payment_mode, remarks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      expense_no,
      today,
      time,
      category,
      parseFloat(amount),
      paid_to || 'General Expense',
      payment_mode,
      remarks,
      created_by
    );

    const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Expense recorded successfully', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Expense entry not found' });
    }
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
