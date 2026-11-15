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

// LMS DASHBOARD (Lists Courses)
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  try {
    // Fetch courses this student is enrolled in
    const result = await pool.query(`
      SELECT c.id, c.code, c.title, u.full_name AS teacher_name
      FROM courses c
      JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_sections s ON s.course_id = c.id
      LEFT JOIN users u ON u.id = s.teacher_id
      WHERE e.user_id = $1
    `, [req.session.user.id]);

    const courses = result.rows;
    const user = req.session.user;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LuxMind LMS</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'DM Sans', sans-serif; background: #f4f6fa; margin: 0; padding: 40px; color: #172238; }
          .header { display: flex; justify-content: space-between; align-items: center; background: #111d35; color: white; padding: 20px 30px; border-radius: 12px; margin-bottom: 40px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header a { color: #ffb0b6; text-decoration: none; font-weight: bold; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
          .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-decoration: none; color: inherit; border: 1px solid #e6ebf2; transition: 0.2s; }
          .card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-color: #3867e8; }
          .badge { background: #edf2ff; color: #3867e8; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 12px; }
          .card h3 { margin: 0 0 8px 0; font-size: 18px; }
          .card p { margin: 0; color: #718096; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>LuxMind LMS</h1>
            <span style="font-size: 13px; color: #9eacc3;">Welcome, ${user.full_name} (${user.role})</span>
          </div>
          <a href="/logout">Logout</a>
        </div>

        <h2 style="color: #142039;">My Courses</h2>
        <div class="grid">
          ${courses.map(c => `
            <a href="/course/${c.id}" class="card">
              <span class="badge">${c.code}</span>
              <h3>${c.title}</h3>
              <p><i>Instructor: ${c.teacher_name || 'TBA'}</i></p>
            </a>
          `).join('')}
          ${courses.length === 0 ? '<p>You are not enrolled in any courses yet.</p>' : ''}
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Dashboard Error: " + err.message);
  }
});
// COURSE CONTENT PAGE
app.get('/course/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  
  try {
    // 1. Verify student is enrolled
    const enrollCheck = await pool.query(
      `SELECT c.code, c.title FROM courses c 
       JOIN enrollments e ON e.course_id = c.id 
       WHERE c.id = $1 AND e.user_id = $2`,
      [courseId, req.session.user.id]
    );

    if (enrollCheck.rows.length === 0) return res.send("Access Denied: You are not enrolled in this course.");
    const course = enrollCheck.rows[0];

    // 2. Fetch Assignments
    const assignments = await pool.query(
      `SELECT * FROM lms_assignments WHERE course_id = $1 ORDER BY due_date ASC`, 
      [courseId]
    );

    // 3. Render the page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${course.code} - LuxMind LMS</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'DM Sans', sans-serif; background: #f4f6fa; margin: 0; padding: 40px; color: #172238; }
          .header { background: #111d35; color: white; padding: 20px 30px; border-radius: 12px; margin-bottom: 20px; }
          .header a { color: #9eacc3; text-decoration: none; font-size: 14px; }
          .header h1 { margin: 10px 0 0 0; font-size: 28px; }
          .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e6ebf2; margin-bottom: 20px; }
          .assignment { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #edf0f5; padding: 16px 0; }
          .assignment:last-child { border-bottom: 0; }
          .btn { background: #3867e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; }
          .btn:hover { background: #2a53c9; }
        </style>
      </head>
      <body>
        <div class="header">
          <a href="/dashboard">← Back to Dashboard</a>
          <h1>${course.code}: ${course.title}</h1>
        </div>

        <div class="card">
          <h2 style="margin-top:0;">Assignments</h2>
          ${assignments.rows.length === 0 ? '<p style="color:#718096;">No assignments posted yet.</p>' : ''}
          ${assignments.rows.map(a => `
            <div class="assignment">
              <div>
                <h3 style="margin: 0 0 6px 0;">${a.title}</h3>
                <p style="margin: 0; color: #718096; font-size: 13px;">
                  Due: ${new Date(a.due_date).toLocaleDateString()} · ${a.max_points} Points
                </p>
              </div>
              <a href="#" class="btn" onclick="alert('Upload feature coming in the next step!')">Submit Work</a>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Course Error: " + err.message);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});



app.listen(process.env.PORT || 3001, () => console.log('LuxMind LMS running'));