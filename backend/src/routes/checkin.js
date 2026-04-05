const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

router.post('/validate', async (req, res) => {
  const { pin, qr_data } = req.body;
  if (!pin && !qr_data)
    return res.status(400).json({ error: 'PIN or QR data required' });

  try {
    let result;
    if (qr_data) {
      const qrCode = qr_data.split('|')[0];
      result = await pool.query('SELECT * FROM guests WHERE qr_data = $1', [qrCode]);
    } else {
      result = await pool.query('SELECT * FROM guests WHERE pin = $1', [pin]);
    }

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Guest not found' });

    const guest = result.rows[0];

    if (guest.checked_in) {
      return res.json({
        success: false,
        already_checked_in: true,
        guest: { name: guest.name, section: guest.section, check_in_time: guest.check_in_time }
      });
    }

    await pool.query('UPDATE guests SET checked_in = TRUE, check_in_time = NOW() WHERE id = $1', [guest.id]);
    await pool.query('INSERT INTO checkin_logs (guest_id, method) VALUES ($1, $2)', [guest.id, qr_data ? 'qr' : 'pin']);

    const updated = await pool.query('SELECT * FROM guests WHERE id = $1', [guest.id]);
    
    req.io && req.io.emit('guest_checked_in', {
      name: updated.rows[0].name,
      section: updated.rows[0].section,
      check_in_time: updated.rows[0].check_in_time
    });

    res.json({
      success: true,
      guest: { name: updated.rows[0].name, section: updated.rows[0].section, check_in_time: updated.rows[0].check_in_time }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cl.id, g.name, g.section, cl.method, cl.scanned_at
      FROM checkin_logs cl JOIN guests g ON cl.guest_id = g.id
      ORDER BY cl.scanned_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;