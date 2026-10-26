import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// GET /api/inventory - Get all inventory items with reorder alert status
router.get('/', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM store_inventory ORDER BY name ASC').all();
    const itemsWithStatus = items.map(item => ({
      ...item,
      is_low_stock: item.current_stock <= item.min_reorder_level
    }));
    res.json({ success: true, data: itemsWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/inventory/item - Create new inventory item
router.post('/item', (req, res) => {
  try {
    const { code, name, category = 'Kitchen Grocery', unit = 'Kg', current_stock = 0, min_reorder_level = 5, unit_cost = 0 } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Item name is required' });
    }

    const itemCode = code || `RAW${String(Date.now()).slice(-4)}`;
    const result = db.prepare(`
      INSERT INTO store_inventory (code, name, category, unit, current_stock, min_reorder_level, unit_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(itemCode, name, category, unit, parseFloat(current_stock), parseFloat(min_reorder_level), parseFloat(unit_cost));

    const created = db.prepare('SELECT * FROM store_inventory WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Inventory item created', data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/inventory/transaction - Record Purchase, Kitchen Issue, Return, or Wastage
router.post('/transaction', (req, res) => {
  try {
    const { item_id, type, qty, unit_cost, remarks = '' } = req.body;
    if (!item_id || !type || !qty || Number(qty) <= 0) {
      return res.status(400).json({ success: false, message: 'Item ID, valid type, and positive quantity required' });
    }

    const item = db.prepare('SELECT * FROM store_inventory WHERE id = ?').get(item_id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    const quantity = parseFloat(qty);
    const cost = unit_cost !== undefined ? parseFloat(unit_cost) : item.unit_cost;
    const total_amount = quantity * cost;
    const date = new Date().toISOString().slice(0, 10);

    let newStock = item.current_stock;
    if (type === 'PURCHASE' || type === 'RETURN_FROM_KITCHEN') {
      newStock += quantity;
    } else if (type === 'ISSUE_TO_KITCHEN' || type === 'WASTAGE') {
      if (item.current_stock < quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock! Current stock is only ${item.current_stock} ${item.unit}` });
      }
      newStock -= quantity;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    // Execute transaction atomically
    const insertTxn = db.prepare(`
      INSERT INTO store_transactions (date, type, item_id, item_name, qty, unit, unit_cost, total_amount, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare('UPDATE store_inventory SET current_stock = ?, unit_cost = ? WHERE id = ?');

    db.transaction(() => {
      insertTxn.run(date, type, item.id, item.name, quantity, item.unit, cost, total_amount, remarks);
      updateStock.run(newStock, cost, item.id);
    })();

    const updatedItem = db.prepare('SELECT * FROM store_inventory WHERE id = ?').get(item.id);
    res.json({
      success: true,
      message: `Stock updated: ${type} of ${quantity} ${item.unit} recorded`,
      data: updatedItem
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/inventory/transactions - List inventory movements
router.get('/transactions', (req, res) => {
  try {
    const txns = db.prepare('SELECT * FROM store_transactions ORDER BY id DESC LIMIT 100').all();
    res.json({ success: true, data: txns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
