const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'earning_app'
});

// GET OR CREATE USER
app.post('/api/user', (req, res) => {
  const u = req.body;

  db.query('SELECT * FROM users WHERE id=?', [u.id], (err, rows) => {
    if (rows.length) return res.json(rows[0]);

    db.query(
      `INSERT INTO users 
      (id, first_name, last_name, username, photo_url, last_ad_date)
      VALUES (?,?,?,?,?,CURDATE())`,
      [u.id, u.first_name, u.last_name, u.username, u.photo_url],
      () => {
        res.json({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          username: u.username,
          photo_url: u.photo_url,
          balance: 0
        });
      }
    );
  });
});

// WATCH AD
app.post('/api/watch-ad', (req, res) => {
  const { userId, value } = req.body;

  db.query(
    `UPDATE users SET
      balance = balance + ?,
      total_earned = total_earned + ?,
      lifetime_ad_count = lifetime_ad_count + 1,
      daily_ad_count = daily_ad_count + 1
     WHERE id=?`,
    [value, value, userId]
  );

  db.query(
    `INSERT INTO earnings (user_id, amount, earn_date)
     VALUES (?, ?, CURDATE())`,
    [userId, value]
  );

  res.json({ success: true });
});

// WITHDRAW
app.post('/api/withdraw', (req, res) => {
  const { userId, method, account, amount } = req.body;

  db.query(
    `INSERT INTO withdrawals (user_id, method, account, amount)
     VALUES (?,?,?,?)`,
    [userId, method, account, amount]
  );

  db.query(
    `UPDATE users SET balance = balance - ? WHERE id=?`,
    [amount, userId]
  );

  res.json({ success: true });
});

app.listen(3000, () =>
  console.log('Server running → http://localhost:3000')
);