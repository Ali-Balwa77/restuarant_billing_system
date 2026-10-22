import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const user = db.prepare(`
      SELECT id, username, name, role, is_active 
      FROM users 
      WHERE LOWER(username) = LOWER(?) AND password = ?
    `).get(username.trim(), password.trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, is_active, created_at FROM users').all();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
