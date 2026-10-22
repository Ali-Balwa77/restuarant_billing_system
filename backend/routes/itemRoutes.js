import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// GET all items
router.get('/', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items ORDER BY display_order ASC, code ASC').all();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST new item
router.post('/', (req, res) => {
  const { code, name, category_name, unit = 'Full', rate, is_veg = 1, gst_rate = 5.0 } = req.body;
  if (!code || !name || rate === undefined) {
    return res.status(400).json({ success: false, message: 'Item code, name, and rate are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM items WHERE code = ?').get(code);
    if (existing) {
      return res.status(409).json({ success: false, message: `Item with code "${code}" already exists` });
    }

    const info = db.prepare(`
      INSERT INTO items (code, name, category_name, unit, rate, is_veg, gst_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(code.trim(), name.trim(), category_name || 'General', unit, parseFloat(rate), is_veg ? 1 : 0, parseFloat(gst_rate) || 5.0);

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Item created successfully', data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update item
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { code, name, category_name, unit, rate, is_veg, gst_rate, is_available } = req.body;

  try {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    db.prepare(`
      UPDATE items
      SET code = COALESCE(?, code),
          name = COALESCE(?, name),
          category_name = COALESCE(?, category_name),
          unit = COALESCE(?, unit),
          rate = COALESCE(?, rate),
          is_veg = COALESCE(?, is_veg),
          gst_rate = COALESCE(?, gst_rate),
          is_available = COALESCE(?, is_available)
      WHERE id = ?
    `).run(
      code ? code.trim() : null,
      name ? name.trim() : null,
      category_name || null,
      unit || null,
      rate !== undefined ? parseFloat(rate) : null,
      is_veg !== undefined ? (is_veg ? 1 : 0) : null,
      gst_rate !== undefined ? parseFloat(gst_rate) : null,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json({ success: true, message: 'Item updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM items WHERE id = ?').run(id);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
