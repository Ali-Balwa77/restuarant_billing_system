import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// GET /api/stewards - List all stewards/captains
router.get('/', (req, res) => {
  try {
    const stewards = db.prepare('SELECT * FROM stewards ORDER BY code ASC').all();
    res.json({ success: true, data: stewards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/stewards - Create new steward
router.post('/', (req, res) => {
  try {
    const { code, name, phone = '' } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Code and name are required' });
    }

    const result = db.prepare('INSERT INTO stewards (code, name, phone) VALUES (?, ?, ?)')
      .run(code.trim(), name.trim(), phone.trim());

    const created = db.prepare('SELECT * FROM stewards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Steward added', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/stewards/:id - Update steward
router.put('/:id', (req, res) => {
  try {
    const { code, name, phone, is_active } = req.body;
    db.prepare('UPDATE stewards SET code = ?, name = ?, phone = ?, is_active = ? WHERE id = ?')
      .run(code, name, phone, is_active !== undefined ? is_active : 1, req.params.id);
    
    const updated = db.prepare('SELECT * FROM stewards WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Steward updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/stewards/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM stewards WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Steward not found' });
    }
    res.json({ success: true, message: 'Steward deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
