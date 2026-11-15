require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const session = require('express-session');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'luxmind-lms-secret', resave: false, saveUninitialized: false }));

// LMS LOGIN PAGE
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// LMS LOGIN LOGIC (Connects to the same SIS DB)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT id, full_name, role FROM users WHERE username = $1 AND password = $2`,
      [username, password]
    );

    if (result.rows.length > 0) {
      req.session.user = result.rows[0];
      return res.redirect('/dashboard');
    }
    res.render('login', { error: 'Invalid credentials' });
  } catch (err) {
    res.status(500).send("Database Error: " + err.message);
  }
});

// LMS DASHBOARD
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.send(`<h1>Welcome to LuxMind LMS, ${req.session.user.full_name}!</h1><p>Role: ${req.session.user.role}</p><a href="/logout">Logout</a>`);
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.listen(process.env.PORT || 3001, () => console.log('LuxMind LMS running'));