require('dotenv').config(); // MUST BE LINE 1

const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const session = require('express-session');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.set('trust proxy', 1);

// ============================================
// --- SUPABASE CONFIGURATION (LMS STORAGE) ---
// ============================================
const supabase = createClient(
  'https://dxprjnjdkzykqnawhucf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cHJqbmpka3p5a3FuYXdodWNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDY5NTc3NiwiZXhwIjoyMTEwMjcxNzc2fQ.TxLB4kIYynPPSztEkEPDJR2aDgE7G90WPbgaiG_hx4I'
);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ============================================
// --- DATABASE CONFIGURATION (SIS DB) ---
// ============================================
const pool = new Pool({
  user: 'postgres.fclhdbppskmjlmbhtoug',
  password: 'LuxMindAdmin2026',
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// ============================================
// --- SESSION WITH SAFE POSTGRES STORE ---
// ============================================
let sessionStore;

try {
  const pgSession = require('connect-pg-simple')(session);
  sessionStore = new pgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: false   // We created it manually in Step 1
  });
  console.log('[session] PostgreSQL session store loaded.');
} catch (err) {
  console.error('[session] FATAL: Failed to initialize PostgreSQL session store. Falling back to memory store.', err);
  sessionStore = undefined; // express-session will use MemoryStore as fallback
}

app.use(session({
  store: sessionStore,            // undefined → MemoryStore (safe fallback)
  secret: 'luxmind-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.get('/', (req, res) => res.redirect('/dashboard'));

// ============================================
// --- i18n & TIMEZONE MIDDLEWARE ---
// ============================================
const translations = {
  en: {
    portal_title: "LUXMIND PORTAL",
    greeting: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
    nav: { home: "Home", courses: "My Courses", announcements: "Site announcements", logout: "Log out" },
    dash: { online: "Online Users", site_ann: "Site announcements", course_overview: "Course Overview", no_courses: "You are not enrolled in any courses.", no_ann: "No announcements yet.", credits: "Credits" },
    course: { home: "Course Home", announcements: "Announcements", syllabus: "Syllabus", materials: "Course Materials", assignments: "Assignments", quizzes: "Quizzes", forums: "Discussion Forums", grades: "My Grades", attendance: "My Attendance", evaluation: "Course Evaluation", instructor: "Instructor", upcoming: "Upcoming Events", submit: "Submit Work", start: "Start Quiz", view: "View / Download", no_mat: "No materials uploaded yet.", no_assign: "No assignments yet.", due: "Due", points: "Points", time_limit: "Time Limit" },
    teacher: {
      portal_title: "TEACHER PORTAL",
      nav: { dashboard: "Dashboard", courses: "My Courses", schedule: "Schedule", grading: "Grading Center", messages: "Messages", global_ann: "Global Announcements", leave: "Leave Requests", settings: "Settings" },
      dash: { title: "Teacher Command Center", welcome: "Welcome back", ungraded: "Submissions to Grade", at_risk: "At-Risk Students", unread: "Unread Messages", attention: "Needs Attention", activity: "Campus Activity", online: "students online", live: "Live System", courses_teach: "Courses I Teach", students: "Students Enrolled", manage: "Manage Course", grading_across: "Across all active courses", attendance_below: "Attendance below 70%", from_students: "From students and admin" }
    }
  },
  fr: {
    portal_title: "PORTAIL LUXMIND",
    greeting: { morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir" },
    nav: { home: "Accueil", courses: "Mes Cours", announcements: "Annonces du site", logout: "Déconnexion" },
    dash: { online: "Utilisateurs en ligne", site_ann: "Annonces du site", course_overview: "Aperçu des cours", no_courses: "Vous n'êtes inscrit à aucun cours.", no_ann: "Aucune annonce pour le moment.", credits: "Crédits" },
    course: { home: "Accueil du cours", announcements: "Annonces", syllabus: "Programme", materials: "Supports de cours", assignments: "Devoirs", quizzes: "Quiz", forums: "Forums de discussion", grades: "Mes Notes", attendance: "Ma Présence", evaluation: "Évaluation du cours", instructor: "Instructeur", upcoming: "Événements à venir", submit: "Soumettre", start: "Commencer le Quiz", view: "Voir / Télécharger", no_mat: "Aucun support pour le moment.", no_assign: "Aucun devoir.", due: "Échéance", points: "Points", time_limit: "Temps limite" },
    teacher: {
      portal_title: "PORTAIL ENSEIGNANT",
      nav: { dashboard: "Tableau de bord", courses: "Mes Cours", schedule: "Emploi du temps", grading: "Centre de notation", messages: "Messages", global_ann: "Annonces globales", leave: "Demandes de congé", settings: "Paramètres" },
      dash: { title: "Centre de commande", welcome: "Bon retour", ungraded: "Copies à noter", at_risk: "Étudiants à risque", unread: "Messages non lus", attention: "Attention requise", activity: "Activité du campus", online: "étudiants en ligne", live: "Système en direct", courses_teach: "Cours que j'enseigne", students: "Étudiants inscrits", manage: "Gérer le cours", grading_across: "Dans tous les cours actifs", attendance_below: "Présence inférieure à 70%", from_students: "Des étudiants et de l'admin" }
    }
  },
  rn: {
    portal_title: "URUGO RWA LUXMIND",
    greeting: { morning: "Mwaramutse", afternoon: "Mwiriwe", evening: "Mwiriwe" },
    nav: { home: "Ahabanza", courses: "Amasomo Yanje", announcements: "Amatangazo", logout: "Sohoka" },
    dash: { online: "Abakoresha kumurongo", site_ann: "Amatangazo", course_overview: "Incamake y'amasomo", no_courses: "Ntamasomo wiyandikishije.", no_ann: "Nta matangazo arahari.", credits: "Amanota" },
    course: { home: "Ahabanza h'isomo", announcements: "Amatangazo", syllabus: "Gahunda y'isomo", materials: "Ibikoresho vy'isomo", assignments: "Ibikorwa", quizzes: "Ibibazo", forums: "Ibiganiro", grades: "Amanota yanje", attendance: "Uko naje kw'isomo", evaluation: "Gusuzuma isomo", instructor: "Umwarimu", upcoming: "Ibikorwa biri imbere", submit: "Tanga", start: "Tangira", view: "Raba / Kurura", no_mat: "Nta bikoresho birashirwaho.", no_assign: "Nta bikorwa birashirwaho.", due: "Iherezo", points: "Amanota", time_limit: "Igihe ntarengwa" },
    teacher: {
      portal_title: "URUGO RW'UMWARIMU",
      nav: { dashboard: "Ahabanza", courses: "Amasomo Ngana", schedule: "Gahunda", grading: "Aho Gutanga Amanota", messages: "Ubutumwa", global_ann: "Amatangazo Rusangi", leave: "Gusaba Uruhusho", settings: "Igenamiterere" },
      dash: { title: "Icyumba c'Umwarimu", welcome: "Murakaza neza", ungraded: "Ivyo Kwiga Bitegereje", at_risk: "Abanyeshure mu Kaga", unread: "Ubutumwa Butarasomwa", attention: "Bikenera Ivyiyumviro", activity: "Ibikorwa ku Kigo", online: "abanyeshure kumurongo", live: "Sisitemu irakora", courses_teach: "Amasomo Ndishikira", students: "Abanyeshure Biyandikishije", manage: "Gucunga Isomo", grading_across: "Mu masomo yose", attendance_below: "Ukwiye kw'isomo munsi ya 70%", from_students: "Uva ku banyeshure no kuri admin" }
    }
  },
  sw: {
    portal_title: "LUXMIND PORTAL",
    greeting: { morning: "Habari za asubuhi", afternoon: "Habari za mchana", evening: "Habari za jioni" },
    nav: { home: "Nyumbani", courses: "Kozi Zangu", announcements: "Matangazo", logout: "Toka" },
    dash: { online: "Watumiaji Mtandaoni", site_ann: "Matangazo", course_overview: "Muhtasari wa Kozi", no_courses: "Haujasajiliwa katika kozi yoyote.", no_ann: "Hakuna matangazo bado.", credits: "Mikopo" },
    course: { home: "Nyumbani kwa Kozi", announcements: "Matangazo", syllabus: "Mwongozo", materials: "Vifaa vya Kozi", assignments: "Kazi", quizzes: "Maswali", forums: "Majadiliano", grades: "Alama Zangu", attendance: "Mahudhurio Yangu", evaluation: "Tathmini ya Kozi", instructor: "Mwalimu", upcoming: "Matukio Yajayo", submit: "Wasilisha", start: "Anza", view: "Tazama / Pakua", no_mat: "Hakuna vifaa bado.", no_assign: "Hakuna kazi bado.", due: "Mwisho", points: "Alama", time_limit: "Muda" },
    teacher: {
      portal_title: "PORTAL YA MWALIMU",
      nav: { dashboard: "Dashibodi", courses: "Kozi Zangu", schedule: "Ratiba", grading: "Kituo cha Kuweka Alama", messages: "Ujumbe", global_ann: "Matangazo ya Jumla", leave: "Maombi ya Likizo", settings: "Mipangilio" },
      dash: { title: "Kituo cha Mwalimu", welcome: "Karibu tena", ungraded: "Kazi za Kuwekwa Alama", at_risk: "Wanafunzi Hatarini", unread: "Ujumbe Ambao Haujasomwa", attention: "Inahitaji Kuzingatiwa", activity: "Shughuli za Kampasi", online: "wanafunzi mtandaoni", live: "Mfumo Hai", courses_teach: "Kozi Ninazofundisha", students: "Wanafunzi Walioandikishwa", manage: "Dhibiti Kozi", grading_across: "Katika kozi zote hai", attendance_below: "Mahudhurio chini ya 70%", from_students: "Kutoka kwa wanafunzi na admin" }
    }
  }
};

app.use((req, res, next) => {
  req.session.language = req.session.language || 'en';
  const lang = req.session.language;
  res.locals.lang = lang;
  res.locals.t = translations[lang];

  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Bujumbura', hour: 'numeric', hour12: false });
  const hour = parseInt(formatter.format(new Date()), 10);
  if (hour < 12) res.locals.greeting = res.locals.t.greeting.morning;
  else if (hour < 18) res.locals.greeting = res.locals.t.greeting.afternoon;
  else res.locals.greeting = res.locals.t.greeting.evening;

  next();
});

// ============================================
// --- DEBUG: inspect current session ---
// ============================================
app.get('/whoami', (req, res) => {
  res.json({
    hasSession: !!req.session,
    hasUser: !!req.session.user,
    user: req.session.user || null,
    cookie: req.headers.cookie ? 'present' : 'missing'
  });
});

// ============================================
// --- ROUTES ---
// ============================================
app.get('/set-language/:lang', (req, res) => {
  if (translations[req.params.lang]) req.session.language = req.params.lang;
  res.redirect(req.get('referer') || '/dashboard');
});

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(`SELECT id, full_name, role FROM users WHERE username = $1 AND password = $2`, [username, password]);
    if (result.rows.length > 0) {
      req.session.user = result.rows[0];
      req.session.save((err) => {
        if (err) {
          console.error('[login] save error:', err);
          return res.status(500).send('Session save failed');
        }
        return res.redirect('/dashboard');
      });
      return;
    }
    res.render('login', { error: 'Invalid credentials' });
  } catch (err) { res.status(500).send("Database Error: " + err.message); }
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const isTeacher = req.session.user.role === 'teacher' || req.session.user.role === 'advisor';

  try {
    if (isTeacher) {
      const courseRes = await pool.query(`
        SELECT c.id, c.code, c.title, s.group_name, (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count
        FROM courses c JOIN course_sections s ON s.course_id = c.id WHERE s.teacher_id = $1
      `, [req.session.user.id]);
      return res.render('lms-teacher-dashboard', { user: req.session.user, courses: courseRes.rows, ungradedCount: 14, pendingMessages: 3, onlineUsers: 5 });
    } else {
      const courseRes = await pool.query(`
        SELECT c.id, c.code, c.title, u.full_name AS teacher_name
        FROM courses c JOIN enrollments e ON e.course_id = c.id LEFT JOIN course_sections s ON s.course_id = c.id LEFT JOIN users u ON u.id = s.teacher_id
        WHERE e.user_id = $1
      `, [req.session.user.id]);

      const userRes = await pool.query(`SELECT last_announcements_view_at FROM users WHERE id = $1`, [req.session.user.id]);
      const lastView = userRes.rows[0]?.last_announcements_view_at || new Date(0);

      const notifRes = await pool.query(`
        SELECT a.id, a.title, a.message, a.created_at, c.code as course_code, c.id as course_id
        FROM lms_announcements a
        JOIN courses c ON c.id = a.course_id
        WHERE a.created_at > $1
        ORDER BY a.created_at DESC
      `, [lastView]);
      const unreadAnnouncements = notifRes.rows;

      const annRes = await pool.query(`SELECT a.*, u.full_name AS author_name FROM lms_announcements a LEFT JOIN users u ON u.id = a.created_by ORDER BY a.created_at DESC`);

      return res.render('lms-dashboard', {
        user: req.session.user,
        courses: courseRes.rows,
        announcements: annRes.rows,
        onlineUsers: 3,
        unreadCount: unreadAnnouncements.length,
        unreadAnnouncements: unreadAnnouncements
      });
    }
  } catch (err) { res.status(500).send("Dashboard Error: " + err.message); }
});

app.get('/course/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const view = req.query.view || 'dashboard';
  const isTeacher = req.session.user.role === 'teacher' || req.session.user.role === 'advisor';

  try {
    let courseCheck;
    if (!isTeacher) {
      courseCheck = await pool.query(`SELECT c.id, c.code, c.title, c.credits, u.full_name AS teacher_name FROM courses c JOIN enrollments e ON e.course_id = c.id LEFT JOIN course_sections s ON s.course_id = c.id LEFT JOIN users u ON u.id = s.teacher_id WHERE c.id = $1 AND e.user_id = $2`, [courseId, req.session.user.id]);
    } else {
      courseCheck = await pool.query(`SELECT c.id, c.code, c.title, c.credits, u.full_name AS teacher_name FROM courses c LEFT JOIN course_sections s ON s.course_id = c.id LEFT JOIN users u ON u.id = s.teacher_id WHERE c.id = $1 AND s.teacher_id = $2`, [courseId, req.session.user.id]);
    }
    if (courseCheck.rows.length === 0) return res.send("Access Denied.");
    const course = courseCheck.rows[0];

    let assignments = [], quizzes = [], grades = [], announcements = [], materials = [], students = [];

    if (view === 'dashboard' || view === 'assignments' || view === 'grades') {
      if (isTeacher) {
        const r = await pool.query(`
          SELECT a.*, (SELECT COUNT(*) FROM lms_submissions s WHERE s.assignment_id = a.id) as submission_count
          FROM lms_assignments a WHERE a.course_id = $1 ORDER BY a.due_date ASC
        `, [courseId]);
        assignments = r.rows;
      } else {
        const r = await pool.query(`
          SELECT a.*, s.id as submission_id, s.file_url as submitted_file, s.grade, s.feedback, s.submitted_at
          FROM lms_assignments a
          LEFT JOIN lms_submissions s ON s.assignment_id = a.id AND s.student_id = $2
          WHERE a.course_id = $1 AND a.is_published = true
          ORDER BY a.due_date ASC
        `, [courseId, req.session.user.id]);
        assignments = r.rows;
      }
    }

    if (view === 'quizzes') {
      const r = await pool.query(`SELECT * FROM lms_quizzes WHERE course_id = $1 ORDER BY due_date ASC`, [courseId]); quizzes = r.rows;
    }
    if (view === 'announcements') {
      if (!isTeacher) { await pool.query(`UPDATE users SET last_announcements_view_at = NOW() WHERE id = $1`, [req.session.user.id]); }
      const r = await pool.query(`SELECT * FROM lms_announcements WHERE course_id = $1 OR course_id IS NULL ORDER BY created_at DESC`, [courseId]); announcements = r.rows;
    }

    if (view === 'materials') {
      if (isTeacher) {
        const m = await pool.query(`SELECT * FROM lms_materials WHERE course_id = $1 ORDER BY week_number ASC, created_at DESC`, [courseId]); materials = m.rows;
      } else {
        const m = await pool.query(`SELECT * FROM lms_materials WHERE course_id = $1 AND is_published = true ORDER BY week_number ASC, created_at DESC`, [courseId]); materials = m.rows;
      }
    }

    if (view === 'students' && isTeacher) {
      const st = await pool.query(`SELECT u.id, u.full_name, sp.admission_number, u.email FROM enrollments e JOIN users u ON u.id = e.user_id LEFT JOIN student_profiles sp ON sp.user_id = u.id WHERE e.course_id = $1`, [courseId]); students = st.rows;
    }

    if (view === 'grades') {
      if (isTeacher) {
        let gSql = `
          SELECT s.id as submission_id, s.assignment_id, s.file_url, s.submitted_at, s.grade, s.feedback,
                 u.full_name as student_name, u.id as student_id, a.title as assignment_title, a.max_points
          FROM lms_submissions s
          JOIN lms_assignments a ON a.id = s.assignment_id
          JOIN users u ON u.id = s.student_id
          WHERE a.course_id = $1
        `;
        const params = [courseId];
        if (req.query.assignment_id) {
          gSql += ` AND a.id = $2`;
          params.push(req.query.assignment_id);
        }
        gSql += ` ORDER BY a.due_date ASC, u.full_name ASC`;
        const r = await pool.query(gSql, params);
        grades = r.rows;
      } else {
        const r = await pool.query(`
          SELECT s.id as submission_id, s.file_url, s.submitted_at, s.grade, s.feedback,
                 a.title as assignment_title, a.max_points, a.due_date
          FROM lms_submissions s
          JOIN lms_assignments a ON a.id = s.assignment_id
          WHERE s.student_id = $1 AND a.course_id = $2
          ORDER BY a.due_date ASC
        `, [req.session.user.id, courseId]);
        grades = r.rows;
      }
    }

    let upcomingAssignments = [];
    let latestAnnouncements = [];
    let studentCount = 0;

    if (view === 'dashboard') {
      const a = await pool.query(`SELECT title, due_date FROM lms_assignments WHERE course_id = $1 AND due_date > NOW() ORDER BY due_date ASC LIMIT 3`, [courseId]);
      upcomingAssignments = a.rows;

      const an = await pool.query(`SELECT title, message, created_at FROM lms_announcements WHERE course_id = $1 OR course_id IS NULL ORDER BY created_at DESC LIMIT 2`, [courseId]);
      latestAnnouncements = an.rows;

      if (isTeacher) {
        const sc = await pool.query(`SELECT COUNT(*) FROM enrollments WHERE course_id = $1`, [courseId]);
        studentCount = parseInt(sc.rows[0].count);
      }
    }

    res.render('lms-course', {
      user: req.session.user, isTeacher, course, view,
      assignments, quizzes, grades, announcements, materials, students,
      unreadCount: 0,
      upcomingAssignments, latestAnnouncements, studentCount,
      selectedAssignmentId: req.query.assignment_id || null
    });
  } catch (err) { res.status(500).send("Course Error: " + err.message); }
});

// ============================================
// ANNOUNCEMENTS
// ============================================
app.post('/course/:id/announcements', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const { title, message } = req.body;
  if (req.session.user.role !== 'teacher' && req.session.user.role !== 'advisor') return res.status(403).send("Access Denied.");
  if (!title || !message) return res.redirect(`/course/${courseId}?view=announcements`);
  try {
    await pool.query(`INSERT INTO lms_announcements (course_id, title, message, created_by) VALUES ($1, $2, $3, $4)`, [courseId, title, message, req.session.user.id]);
    res.redirect(`/course/${courseId}?view=announcements`);
  } catch (err) { res.status(500).send("Error posting announcement: " + err.message); }
});

// ============================================
// MATERIALS
// ============================================
app.post('/course/:id/materials', upload.single('material'), async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const { title, week_number } = req.body;
  const file = req.file;

  if ((req.session.user.role !== 'teacher' && req.session.user.role !== 'advisor') || !file || !title) {
    return res.redirect(`/course/${courseId}?view=materials`);
  }

  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `course_${courseId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from('course-materials').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('course-materials').getPublicUrl(fileName);

    await pool.query(`INSERT INTO lms_materials (course_id, title, file_url, week_number, created_by) VALUES ($1, $2, $3, $4, $5)`,
      [courseId, title, publicUrl, Number(week_number) || 1, req.session.user.id]);

    res.redirect(`/course/${courseId}?view=materials`);
  } catch (err) {
    res.status(500).send("Upload Error: " + err.message);
  }
});

app.post('/course/:id/materials/:material_id/toggle', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { id, material_id } = req.params;
  if (req.session.user.role !== 'teacher' && req.session.user.role !== 'advisor') return res.status(403).send("Access Denied.");

  try {
    await pool.query(`UPDATE lms_materials SET is_published = NOT is_published WHERE id = $1 AND course_id = $2`, [material_id, id]);
    res.redirect(`/course/${id}?view=materials`);
  } catch (err) { res.status(500).send("Toggle Error: " + err.message); }
});

// ============================================
// ASSIGNMENTS — CREATE (single route, with multer + debug logs)
// ============================================
app.post('/course/:id/assignments', upload.single('attachment'), async (req, res) => {
  console.log('[create-assignment] HIT', {
    sessionExists: !!req.session,
    hasUser: !!req.session.user,
    role: req.session.user ? req.session.user.role : null,
    userId: req.session.user ? req.session.user.id : null
  });
  console.log('[create-assignment] body:', req.body);
  console.log('[create-assignment] file:', req.file ? req.file.originalname : 'none');

  if (!req.session.user ||
      (req.session.user.role !== 'teacher' && req.session.user.role !== 'advisor')) {
    console.log('[create-assignment] AUTH FAILED — session or role wrong');
    return res.status(403).send("Access Denied.");
  }

  const courseId = req.params.id;
  const { title, instructions, due_date, max_points, is_published } = req.body;
  const file = req.file;

  try {
    let attachmentUrl = null;
    let attachmentName = null;

    if (file) {
      const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
      const storagePath = `assignments/course_${courseId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from('course-materials')
        .upload(storagePath, file.buffer, { contentType: file.mimetype });

      if (upErr) {
        console.error('[create-assignment] storage error:', upErr);
        throw new Error('Storage upload failed: ' + upErr.message);
      }

      const { data: { publicUrl } } = supabase.storage.from('course-materials').getPublicUrl(storagePath);
      attachmentUrl = publicUrl;
      attachmentName = file.originalname;
    }

    await pool.query(`
      INSERT INTO lms_assignments
        (course_id, title, instructions, due_date, max_points, is_published, created_by, attachment_url, attachment_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      courseId, title, instructions || null, due_date || null,
      Number(max_points) || 100, is_published === 'on', req.session.user.id,
      attachmentUrl, attachmentName
    ]);

    res.redirect(`/course/${courseId}?view=assignments`);
  } catch (err) {
    console.error('[create-assignment] FATAL:', err);
    res.status(500).send("Create Assignment Error: " + err.message);
  }
});

// ============================================
// ASSIGNMENTS — TOGGLE
// ============================================
app.post('/course/:id/assignments/:assignment_id/toggle', async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'teacher' && req.session.user.role !== 'advisor')) return res.status(403).send("Access Denied.");
  const { id, assignment_id } = req.params;
  try {
    await pool.query(`UPDATE lms_assignments SET is_published = NOT is_published WHERE id = $1 AND course_id = $2`, [assignment_id, id]);
    res.redirect(`/course/${id}?view=assignments`);
  } catch (err) { res.status(500).send("Toggle Error: " + err.message); }
});

// ============================================
// SUBMIT ASSIGNMENT (Student)
// ============================================
app.post('/course/:id/assignments/:assignment_id/submit', upload.single('submission'), async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { id, assignment_id } = req.params;
  const file = req.file;
  if (!file) return res.redirect(`/course/${id}?view=assignments`);

  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `submissions/${assignment_id}_student_${req.session.user.id}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from('course-materials').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('course-materials').getPublicUrl(fileName);

    await pool.query(`
      INSERT INTO lms_submissions (assignment_id, student_id, file_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (assignment_id, student_id)
      DO UPDATE SET file_url = EXCLUDED.file_url, submitted_at = NOW(), grade = NULL, feedback = NULL
    `, [assignment_id, req.session.user.id, publicUrl]);

    res.redirect(`/course/${id}?view=assignments`);
  } catch (err) { res.status(500).send("Submission Error: " + err.message); }
});

// ============================================
// SAVE GRADE
// ============================================
app.post('/course/:id/grades/:submission_id', async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'teacher' && req.session.user.role !== 'advisor')) {
    return res.status(403).send("Access Denied.");
  }
  const { id, submission_id } = req.params;
  const { grade, feedback, assignment_id } = req.body;

  try {
    const check = await pool.query(`
      SELECT s.id FROM lms_submissions s
      JOIN lms_assignments a ON a.id = s.assignment_id
      JOIN course_sections cs ON cs.course_id = a.course_id
      WHERE s.id = $1 AND a.course_id = $2 AND cs.teacher_id = $3
    `, [submission_id, id, req.session.user.id]);

    if (check.rows.length === 0) return res.status(403).send("Access Denied.");

    const gradeValue = (grade === '' || grade === null || grade === undefined) ? null : Number(grade);
    await pool.query(`UPDATE lms_submissions SET grade = $1, feedback = $2 WHERE id = $3`, [gradeValue, feedback || null, submission_id]);

    const qs = assignment_id ? `&assignment_id=${assignment_id}` : '';
    res.redirect(`/course/${id}?view=grades${qs}`);
  } catch (err) { res.status(500).send("Save Grade Error: " + err.message); }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.listen(process.env.PORT || 3001, () => console.log('LuxMind LMS running'));