import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const tables = db.prepare('SELECT * FROM tables ORDER BY id ASC').all();
    res.json({ success: true, data: tables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  const { id, name, area = 'Main Hall', capacity = 4, status = 'AVAILABLE' } = req.body;
  if (!id || !name) return res.status(400).json({ success: false, message: 'Table ID and Name are required' });

  try {
    db.prepare('INSERT INTO tables (id, name, area, capacity, status) VALUES (?, ?, ?, ?, ?)')
      .run(id.trim(), name.trim(), area.trim(), capacity, status);
    const newTbl = db.prepare('SELECT * FROM tables WHERE id = ?').get(id.trim());
    res.status(201).json({ success: true, message: 'Table created', data: newTbl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, area, capacity, status, current_bill_no } = req.body;

  try {
    db.prepare(`
      UPDATE tables
      SET name = COALESCE(?, name),
          area = COALESCE(?, area),
          capacity = COALESCE(?, capacity),
          status = COALESCE(?, status),
          current_bill_no = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      area ? area.trim() : null,
      capacity || null,
      status || null,
      current_bill_no !== undefined ? current_bill_no : null,
      id
    );

    const updated = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
    res.json({ success: true, message: 'Table updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/transfer', (req, res) => {
  const { fromTableId, toTableId } = req.body;
  if (!fromTableId || !toTableId) {
    return res.status(400).json({ success: false, message: 'Source and Target Table IDs are required' });
  }

  try {
    const fromTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(fromTableId);
    const toTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(toTableId);

    if (!fromTable) return res.status(404).json({ success: false, message: `Table ${fromTableId} not found` });
    if (!toTable) return res.status(404).json({ success: false, message: `Table ${toTableId} not found` });

    // Update fromTable to AVAILABLE
    db.prepare("UPDATE tables SET status = 'AVAILABLE', current_bill_no = NULL WHERE id = ?").run(fromTableId);

    // Update toTable to OCCUPIED
    db.prepare("UPDATE tables SET status = 'OCCUPIED' WHERE id = ?").run(toTableId);

    // Also update any pending KOTs from fromTableId to toTableId
    db.prepare("UPDATE kots SET table_id = ?, table_name = ? WHERE table_id = ? AND status = 'PENDING'")
      .run(toTableId, toTable.name, fromTableId);

    res.json({
      success: true,
      message: `Table transferred from ${fromTable.name} to ${toTable.name}`,
      data: { fromTable, toTable }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
