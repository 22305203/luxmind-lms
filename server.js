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

// LMS HOME DASHBOARD
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    // 1. Fetch courses for this user
    const courseRes = await pool.query(`
      SELECT c.id, c.code, c.title, u.full_name AS teacher_name
      FROM courses c
      JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_sections s ON s.course_id = c.id
      LEFT JOIN users u ON u.id = s.teacher_id
      WHERE e.user_id = $1
    `, [req.session.user.id]);

    // 2. Fetch site announcements
    const annRes = await pool.query(`
      SELECT a.*, u.full_name AS author_name 
      FROM lms_announcements a
      LEFT JOIN users u ON u.id = a.created_by
      ORDER BY a.created_at DESC
    `);

    // 3. Fetch online users (simple mock)
    const onlineUsers = 3; 

    res.render('lms-dashboard', { 
      user: req.session.user, 
      courses: courseRes.rows,
      announcements: annRes.rows,
      onlineUsers: onlineUsers
    });
  } catch (err) {
    res.status(500).send("Dashboard Error: " + err.message);
  }
});

// COURSE CONTENT PAGE (Multi-tab)
app.get('/course/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const view = req.query.view || 'dashboard'; // dashboard, assignments, quizzes, grades, announcements, materials
  
  try {
    const enrollCheck = await pool.query(
      `SELECT c.id, c.code, c.title, c.credits, u.full_name AS teacher_name FROM courses c 
       JOIN enrollments e ON e.course_id = c.id 
       LEFT JOIN course_sections s ON s.course_id = c.id
       LEFT JOIN users u ON u.id = s.teacher_id
       WHERE c.id = $1 AND e.user_id = $2`,
      [courseId, req.session.user.id]
    );

    if (enrollCheck.rows.length === 0) return res.send("Access Denied: You are not enrolled in this course.");
    const course = enrollCheck.rows[0];

    // Fetch data based on the view
    let assignments = [], quizzes = [], grades = [], announcements = [], materials = [];
    
    if (view === 'dashboard' || view === 'assignments') {
      const r = await pool.query(`SELECT * FROM lms_assignments WHERE course_id = $1 ORDER BY due_date ASC`, [courseId]);
      assignments = r.rows;
    }
    
    if (view === 'quizzes') {
      const r = await pool.query(`SELECT * FROM lms_quizzes WHERE course_id = $1 ORDER BY due_date ASC`, [courseId]);
      quizzes = r.rows;
    }
    
    if (view === 'grades') {
      const r = await pool.query(`
        SELECT a.title, s.grade, a.max_points 
        FROM lms_submissions s
        JOIN lms_assignments a ON a.id = s.assignment_id
        WHERE s.student_id = $1 AND a.course_id = $2
      `, [req.session.user.id, courseId]);
      grades = r.rows;
    }
    
    if (view === 'announcements') {
       // In a real app, you'd filter by course_id. For now, we mock it.
       announcements = [{ title: 'Welcome to CS101', message: 'Please read the syllabus.', date: new Date() }];
    }

    // FETCH MATERIALS (NOTES)
    if (view === 'materials' || view === 'dashboard') {
      const m = await pool.query(`SELECT * FROM lms_materials WHERE section_id = $1 ORDER BY week_number ASC, created_at DESC`, [courseId]);
      materials = m.rows;
    }

    res.render('lms-course', { 
      user: req.session.user, 
      course: course,
      view: view,
      assignments, 
      quizzes, 
      grades, 
      announcements, 
      materials // <-- Passed to EJS
    });
  } catch (err) {
    res.status(500).send("Course Error: " + err.message);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.listen(process.env.PORT || 3001, () => console.log('LuxMind LMS running'));