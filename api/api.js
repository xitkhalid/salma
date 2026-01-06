const express = require('express');
const mysql = require('mysql2/promise');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120
});
app.use(limiter);

const db = mysql.createPool({
  host: process.env.DB_HOST || 'mysql11.serv00.com',
  user: process.env.DB_USER || 'm8357_salma',
  password: process.env.DB_PASS || 'Salma1@2@3@',
  database: process.env.DB_NAME || 'm8357_salma',
  waitForConnections: true,
  connectionLimit: 10
});

const ADMIN_KEY = process.env.ADMIN_KEY || 'FuckYou';

/* ---------- USER ---------- */

app.post('/user', async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id) return res.status(400).end();

    const [rows] = await db.query(
      'SELECT id,name,balance FROM users WHERE id=?',
      [id]
    );

    if (rows.length) return res.json(rows[0]);

    await db.query(
      'INSERT INTO users (id,name,balance) VALUES (?,?,0)',
      [id, name || '']
    );

    res.json({ id, name, balance: 0 });
  } catch {
    res.status(500).end();
  }
});

app.post('/balance/add', async (req, res) => {
  try {
    const { id, amount } = req.body;
    if (!id || !amount) return res.status(400).end();

    await db.query(
      'UPDATE users SET balance = balance + ? WHERE id=?',
      [amount, id]
    );

    res.json({ ok: true });
  } catch {
    res.status(500).end();
  }
});

/* ---------- PUBLIC CONFIG ---------- */

app.get('/config', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT channel_link FROM config LIMIT 1'
    );
    res.json(rows[0] || {});
  } catch {
    res.status(500).end();
  }
});

/* ---------- ADMIN ---------- */

app.post('/admin/config', async (req, res) => {
  try {
    const { key, channel_link } = req.body;
    if (key !== ADMIN_KEY) return res.status(403).end();

    await db.query(
      'UPDATE config SET channel_link=? WHERE id=1',
      [channel_link]
    );

    res.json({ ok: true });
  } catch {
    res.status(500).end();
  }
});

app.listen(3000);
