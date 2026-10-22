import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM kots ORDER BY id DESC').all();
    const kots = rows.map(r => ({
      ...r,
      kotNo: r.kot_no,
      tableId: r.table_id,
      tableName: r.table_name,
      items: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json,
    }));
    res.json({ success: true, data: kots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  const { kotNo, tableId, tableName, captain, time, status = 'PENDING', items } = req.body;
  if (!kotNo || !tableName || !items) {
    return res.status(400).json({ success: false, message: 'Missing KOT required fields' });
  }

  try {
    db.prepare(`
      INSERT INTO kots (kot_no, table_id, table_name, captain, time, status, items_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      kotNo,
      tableId || '',
      tableName,
      captain || 'Captain',
      time || new Date().toLocaleTimeString(),
      status,
      JSON.stringify(items)
    );

    res.status(201).json({ success: true, message: 'KOT fired successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:kotNo/status', (req, res) => {
  const { kotNo } = req.params;
  const { status } = req.body;

  try {
    db.prepare('UPDATE kots SET status = ? WHERE kot_no = ?').run(status, kotNo);
    res.json({ success: true, message: `KOT ${kotNo} status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
