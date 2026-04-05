const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const pool = new Pool({
  host: 'aws-1-eu-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xhvgcdbwmqsnbeczdnzz',
  password: 'Wedding@2024#Femi',
  ssl: { rejectUnauthorized: false }
});

const generateUniquePin = async () => {
  let pin, exists;
  do {
    pin = String(Math.floor(10000 + Math.random() * 90000));
    const res = await pool.query('SELECT id FROM guests WHERE pin = $1', [pin]);
    exists = res.rows.length > 0;
  } while (exists);
  return pin;
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, section, status } = req.query;
    let query = 'SELECT * FROM guests WHERE 1=1';
    const params = [];

    if (search) { params.push(`%${search}%`); query += ` AND name ILIKE $${params.length}`; }
    if (section) { params.push(section); query += ` AND section = $${params.length}`; }
    if (status === 'in') query += ' AND checked_in = TRUE';
    if (status === 'out') query += ' AND checked_in = FALSE';

    query += ' ORDER BY section, name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM guests');
    const checkedIn = await pool.query('SELECT COUNT(*) FROM guests WHERE checked_in = TRUE');
    const sections = await pool.query(
      'SELECT section, COUNT(*) as total, SUM(CASE WHEN checked_in THEN 1 ELSE 0 END) as arrived FROM guests GROUP BY section ORDER BY section'
    );
    res.json({
      total: parseInt(total.rows[0].count),
      checkedIn: parseInt(checkedIn.rows[0].count),
      pending: parseInt(total.rows[0].count) - parseInt(checkedIn.rows[0].count),
      sections: sections.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, section } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const pin = await generateUniquePin();
    const qrData = `WED-${uuidv4().split('-')[0].toUpperCase()}`;
    const qrImage = await QRCode.toDataURL(`${qrData}|${pin}`);
    const result = await pool.query(
      'INSERT INTO guests (name, section, pin, qr_data) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, section || 'General', pin, qrData]
    );
    res.status(201).json({ ...result.rows[0], qr_image: qrImage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bulk', authMiddleware, async (req, res) => {
  const { guests } = req.body;
  if (!guests || !Array.isArray(guests))
    return res.status(400).json({ error: 'guests array required' });

  const results = [];
  const errors = [];

  for (const g of guests) {
    try {
      const pin = await generateUniquePin();
      const qrData = `WED-${uuidv4().split('-')[0].toUpperCase()}`;
      const result = await pool.query(
        'INSERT INTO guests (name, section, pin, qr_data) VALUES ($1, $2, $3, $4) RETURNING *',
        [g.name, g.section || 'General', pin, qrData]
      );
      results.push(result.rows[0]);
    } catch (err) {
      errors.push({ name: g.name, error: err.message });
    }
  }
  res.status(201).json({ imported: results.length, errors, guests: results });
});

router.get('/:id/qr', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    const guest = result.rows[0];
    const qrImage = await QRCode.toDataURL(`${guest.qr_data}|${guest.pin}`);
    res.json({ qr_image: qrImage, guest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM guests WHERE id = $1', [req.params.id]);
    res.json({ message: 'Guest deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;