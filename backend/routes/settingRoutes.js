import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!row) {
      return res.json({
        success: true,
        data: {
          name: 'Alinea Restaurant & Banquet',
          tagline: 'Pure Veg & Multi-Cuisine',
          address: 'Near Parimal Garden, Punchvati Cross Road, Ahmedabad, Gujarat - 380006',
          phone: '+91 9898745429',
          gstin: '24AAACH7890B1ZK',
          fssai: '1072300000001',
          cgstRate: 2.5,
          sgstRate: 2.5,
          printerWidth: '80mm',
        }
      });
    }

    res.json({
      success: true,
      data: {
        name: row.name,
        tagline: row.tagline,
        address: row.address,
        phone: row.phone,
        gstin: row.gstin,
        fssai: row.fssai,
        cgstRate: row.cgst_rate,
        sgstRate: row.sgst_rate,
        printerWidth: row.printer_width,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/', (req, res) => {
  const { name, tagline, address, phone, gstin, fssai, cgstRate, sgstRate, printerWidth } = req.body;

  try {
    db.prepare(`
      INSERT INTO settings (id, name, tagline, address, phone, gstin, fssai, cgst_rate, sgst_rate, printer_width, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = COALESCE(excluded.name, name),
        tagline = COALESCE(excluded.tagline, tagline),
        address = COALESCE(excluded.address, address),
        phone = COALESCE(excluded.phone, phone),
        gstin = COALESCE(excluded.gstin, gstin),
        fssai = COALESCE(excluded.fssai, fssai),
        cgst_rate = COALESCE(excluded.cgst_rate, cgst_rate),
        sgst_rate = COALESCE(excluded.sgst_rate, sgst_rate),
        printer_width = COALESCE(excluded.printer_width, printer_width),
        updated_at = CURRENT_TIMESTAMP
    `).run(
      name,
      tagline,
      address,
      phone,
      gstin,
      fssai,
      cgstRate !== undefined ? parseFloat(cgstRate) : 2.5,
      sgstRate !== undefined ? parseFloat(sgstRate) : 2.5,
      printerWidth || '80mm'
    );

    res.json({ success: true, message: 'Restaurant settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
