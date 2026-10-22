import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  const { name, display_order = 1 } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

  try {
    const info = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, ?)').run(name.trim(), display_order);
    const newCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Category created', data: newCat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, display_order } = req.body;

  try {
    db.prepare('UPDATE categories SET name = COALESCE(?, name), display_order = COALESCE(?, display_order) WHERE id = ?')
      .run(name ? name.trim() : null, display_order, id);
    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ success: true, message: 'Category updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
