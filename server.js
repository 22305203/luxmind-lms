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

// ============================================
// --- i18n: TRANSLATIONS & MIDDLEWARE ---
// ============================================
const translations = {
  en: {
    portal_title: "LUXMIND PORTAL",
    greeting: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
    nav: { home: "Home", courses: "My Courses", announcements: "Site announcements", logout: "Log out" },
    dash: { online: "Online Users", site_ann: "Site announcements", course_overview: "Course Overview", no_courses: "You are not enrolled in any courses.", no_ann: "No announcements yet.", credits: "Credits" }
  },
  fr: {
    portal_title: "PORTAIL LUXMIND",
    greeting: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir" },
    nav: { home: "Accueil", courses: "Mes Cours", announcements: "Annonces du site", logout: "Déconnexion" },
    dash: { online: "Utilisateurs en ligne", site_ann: "Annonces du site", course_overview: "Aperçu des cours", no_courses: "Vous n'êtes inscrit à aucun cours.", no_ann: "Aucune annonce pour le moment.", credits: "Crédits" }
  },
  rn: {
    portal_title: "URUGO RWA LUXMIND",
    greeting: { morning: "Mwaramutse", afternoon: "Mwiriwe", evening: "Mwiriwe" },
    nav: { home: "Ahabanza", courses: "Amasomo Yanje", announcements: "Amatangazo", logout: "Sohoka" },
    dash: { online: "Abakoresha kumurongo", site_ann: "Amatangazo y'urubuga", course_overview: "Incamake y'amasomo", no_courses: "Ntamasomo wiyandikishije.", no_ann: "Nta matangazo arahari.", credits: "Amanota" }
  },
  sw: {
    portal_title: "LUXMIND PORTAL",
    greeting: { morning: "Habari za asubuhi", afternoon: "Habari za mchana", evening: "Habari za jioni" },
    nav: { home: "Nyumbani", courses: "Kozi Zangu", announcements: "Matangazo", logout: "Toka" },
    dash: { online: "Watumiaji Mtandaoni", site_ann: "Matangazo ya Tovuti", course_overview: "Muhtasari wa Kozi", no_courses: "Haujasajiliwa katika kozi yoyote.", no_ann: "Hakuna matangazo bado.", credits: "Mikopo" }
  }
};

app.use((req, res, next) => {
  req.session.language = req.session.language || 'en';
  const lang = req.session.language;
  res.locals.lang = lang;
  res.locals.t = translations[lang];
  
  // Time-based greeting
  const hour = new Date().getHours();
  if (hour < 12) res.locals.greeting = res.locals.t.greeting.morning;
  else if (hour < 18) res.locals.greeting = res.locals.t.greeting.afternoon;
  else res.locals.greeting = res.locals.t.greeting.evening;

  next();
});

// Language Switcher Route
app.get('/set-language/:lang', (req, res) => {
  if (translations[req.params.lang]) {
    req.session.language = req.params.lang;
  }
  res.redirect(req.get('referer') || '/dashboard');
});

// ============================================
// --- ROUTES ---
// ============================================
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

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

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    // 1. Fetch courses
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

    // 3. NEW: Fetch upcoming deadlines (Assignments from ALL enrolled courses)
    const deadlineRes = await pool.query(`
      SELECT a.id, a.title, a.due_date, c.code 
      FROM lms_assignments a
      JOIN courses c ON c.id = a.course_id
      JOIN enrollments e ON e.course_id = c.id
      WHERE e.user_id = $1 AND a.due_date > NOW()
      ORDER BY a.due_date ASC
      LIMIT 5
    `, [req.session.user.id]);

    // 4. NEW: Fetch notifications (Using announcements as a mock for now)
    const notifRes = await pool.query(`
      SELECT title, created_at FROM lms_announcements ORDER BY created_at DESC LIMIT 3
    `);

    res.render('lms-dashboard', { 
      user: req.session.user, 
      courses: courseRes.rows,
      announcements: annRes.rows,
      upcomingDeadlines: deadlineRes.rows, // <-- Pass deadlines
      notifications: notifRes.rows,        // <-- Pass notifications
      onlineUsers: 3
    });
  } catch (err) {
    res.status(500).send("Dashboard Error: " + err.message);
  }
});

// COURSE CONTENT PAGE (Multi-tab)
app.get('/course/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const view = req.query.view || 'dashboard';
  
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
       announcements = [{ title: 'Welcome to CS101', message: 'Please read the syllabus.', date: new Date() }];
    }
    if (view === 'materials' || view === 'dashboard') {
      const m = await pool.query(`SELECT * FROM lms_materials WHERE section_id = $1 ORDER BY week_number ASC, created_at DESC`, [courseId]);
      materials = m.rows;
    }

    res.render('lms-course', { 
      user: req.session.user, 
      course: course,
      view: view,
      assignments, quizzes, grades, announcements, materials
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