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
app.use(express.json());

// ============================================
// --- SESSION WITH SAFE POSTGRES STORE ---
// ============================================
let sessionStore;
try {
  const pgSession = require('connect-pg-simple')(session);
  sessionStore = new pgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  });
  console.log('[session] PostgreSQL session store loaded.');
} catch (err) {
  console.error('[session] FATAL: Failed to initialize PostgreSQL session store. Falling back to memory store.', err);
  sessionStore = undefined;
}

app.use(session({
  store: sessionStore,
  secret: 'luxmind-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
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
// --- TZ HELPER: display stored UTC as Burundi time ---
// ============================================
app.locals.toBjInput = function (ts) {
  if (!ts) return '';
  return new Date(new Date(ts).getTime() + 2 * 3600 * 1000).toISOString().slice(0, 16);
};

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
// --- SHARED HELPERS ---
// ============================================
async function teacherOwnsCourse(userId, courseId) {
  const r = await pool.query(
    `SELECT 1 FROM course_sections WHERE course_id = $1 AND teacher_id = $2 LIMIT 1`,
    [courseId, userId]
  );
  return r.rows.length > 0;
}

function isTeacherRole(u) {
  if (!u || !u.role) return false;
  const r = String(u.role).toLowerCase().trim();
  return r === 'teacher' || r === 'advisor' || r === 'admin';
}

function formOn(v, dflt = true) {
  if (v === undefined || v === null) return dflt;
  if (Array.isArray(v)) v = v[v.length - 1];
  return v === 'on' || v === 'true' || v === '1' || v === true;
}

function formInt(v, dflt) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : dflt;
}

function formOptInt(v) {
  if (v === '' || v === undefined || v === null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function bjToUTC(v) {
  if (!v) return null;
  if (typeof v !== 'string') return v;
  if (v.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(v)) return v;
  if (/T\d{2}:\d{2}:\d{2}$/.test(v)) return v + '+02:00';
  if (/T\d{2}:\d{2}$/.test(v)) return v + ':00+02:00';
  return v;
}

// ---------- QUIZ HELPERS ----------
function shuffleSeeded(arr, seed) {
  const h = (s) => {
    let x = 0;
    for (let i = 0; i < s.length; i++) x = ((x << 5) - x + s.charCodeAt(i)) | 0;
    return x;
  };
  let state = Math.abs(h(String(seed))) || 1;
  const rnd = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function autoGradeAnswer(question, choicesByQuestion, studentAnswer) {
  const marks = Number(question.marks) || 0;
  if (!question.auto_grade) return { auto_score: null, is_correct: null };

  if (question.type === 'MCQ' || question.type === 'TF') {
    const correctIds = new Set((choicesByQuestion[question.id] || [])
      .filter(c => c.is_correct).map(c => c.id));
    let selected = [];
    if (question.type === 'TF') {
      const val = studentAnswer?.value;
      if (val === undefined || val === null) return { auto_score: 0, is_correct: false };
      const matching = (choicesByQuestion[question.id] || [])
        .find(c => c.text.toLowerCase() === (val ? 'true' : 'false'));
      if (matching) selected = [matching.id];
    } else {
      selected = Array.isArray(studentAnswer?.choice_ids) ? studentAnswer.choice_ids : [];
    }
    if (selected.length === 0) return { auto_score: 0, is_correct: false };
    let match = selected.length === correctIds.size;
    if (match) for (const id of selected) if (!correctIds.has(id)) { match = false; break; }
    return { auto_score: match ? marks : 0, is_correct: match };
  }

  if (question.type === 'FILL_BLANK') {
    const sv = String(studentAnswer?.value ?? '').trim();
    if (!sv) return { auto_score: 0, is_correct: false };
    const ca = question.correct_answer || {};
    const cv = String(ca.value ?? '').trim();
    const syns = Array.isArray(ca.synonyms) ? ca.synonyms : [];
    const tol = ca.tolerance;
    const norm = (s) => question.case_insensitive ? s.toLowerCase() : s;
    if (tol != null) {
      const a = parseFloat(sv), b = parseFloat(cv);
      if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= Number(tol))
        return { auto_score: marks, is_correct: true };
    }
    if (norm(sv) === norm(cv)) return { auto_score: marks, is_correct: true };
    for (const s of syns) if (norm(sv) === norm(String(s))) return { auto_score: marks, is_correct: true };
    return { auto_score: 0, is_correct: false };
  }

  if (question.type === 'SHORT_ANSWER') {
    const sv = String(studentAnswer?.value ?? '').trim();
    const cv = String(question.correct_answer?.model_answer ?? '').trim();
    if (!cv) return { auto_score: null, is_correct: null };
    const norm = (s) => question.case_insensitive ? s.toLowerCase() : s;
    const ok = norm(sv) === norm(cv);
    return { auto_score: ok ? marks : 0, is_correct: ok };
  }

  return { auto_score: null, is_correct: null };
}

async function autoSubmitAttempt(attemptId, quizId) {
  const aRes = await pool.query(`SELECT * FROM lms_quiz_attempts WHERE id = $1`, [attemptId]);
  if (aRes.rows.length === 0) return;
  const attempt = aRes.rows[0];
  if (attempt.status !== 'in_progress') return;

  const qRes = await pool.query(
    `SELECT * FROM lms_quiz_questions WHERE quiz_id = $1 ORDER BY position`, [quizId]);
  const questions = qRes.rows;

  const ansRes = await pool.query(
    `SELECT question_id, student_answer FROM lms_quiz_answers WHERE attempt_id = $1`, [attemptId]);
  const answersMap = {};
  for (const a of ansRes.rows) answersMap[a.question_id] = a.student_answer;

  let choicesByQ = {};
  if (questions.length > 0) {
    const cRes = await pool.query(
      `SELECT id, question_id, text, is_correct FROM lms_quiz_choices WHERE question_id = ANY($1)`,
      [questions.map(q => q.id)]);
    for (const c of cRes.rows) {
      if (!choicesByQ[c.question_id]) choicesByQ[c.question_id] = [];
      choicesByQ[c.question_id].push(c);
    }
  }

  let totalAuto = 0, hasManual = false;
  for (const q of questions) {
    const sa = answersMap[q.id] || null;
    const { auto_score, is_correct } = autoGradeAnswer(q, choicesByQ, sa);
    if (auto_score == null) hasManual = true;
    else totalAuto += Number(auto_score);

    await pool.query(`
      INSERT INTO lms_quiz_answers (attempt_id, question_id, student_answer, auto_score, is_correct, answered_at)
      VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT answered_at FROM lms_quiz_answers WHERE attempt_id=$1 AND question_id=$2), NOW()))
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET auto_score = EXCLUDED.auto_score, is_correct = EXCLUDED.is_correct
    `, [attemptId, q.id, sa, auto_score, is_correct]);
  }

  const quizRes = await pool.query(`SELECT total_marks FROM lms_quizzes WHERE id = $1`, [quizId]);
  const totalMarks = Number(quizRes.rows[0]?.total_marks) || 0;
  const pct = totalMarks > 0 ? (totalAuto / totalMarks) * 100 : 0;
  const is_graded = !hasManual;
  const newStatus = is_graded ? 'graded' : 'submitted';

  await pool.query(`
    UPDATE lms_quiz_attempts SET
      status = $1,
      submitted_at = COALESCE(submitted_at, NOW()),
      total_score = $2,
      percentage = $3,
      is_graded = $4,
      graded_at = CASE WHEN $4 THEN NOW() ELSE graded_at END
    WHERE id = $5
  `, [newStatus, totalAuto, pct, is_graded, attemptId]);
}

async function maybeRelease(attempt, quiz) {
  if (attempt.status === 'released') return true;
  if (attempt.status !== 'graded') return false;
  if (quiz.grade_release_at && new Date() < new Date(quiz.grade_release_at)) return false;
  await pool.query(
    `UPDATE lms_quiz_attempts SET status='released', released_at=NOW() WHERE id=$1`,
    [attempt.id]);
  return true;
}

// ============================================
// --- GRADEBOOK HELPERS ---
// ============================================
async function ensureGradeSettings(courseId) {
  const existing = await pool.query(
    `SELECT * FROM lms_grade_settings WHERE course_id = $1`, [courseId]);
  if (existing.rows.length > 0) return existing.rows[0];

  const ins = await pool.query(`
    INSERT INTO lms_grade_settings
      (course_id, weighting_mode, curve_mode, rounding_rule, publish_state, curve_locked)
    VALUES ($1, 'weighted', 'none', 'half_up', 'draft', FALSE)
    RETURNING *
  `, [courseId]);
  return ins.rows[0];
}

async function listCourseAssessments(courseId) {
  const r = await pool.query(`
    SELECT id, 'assignment'::text AS item_type, title, max_points,
           due_date, is_published
    FROM lms_assignments WHERE course_id = $1 AND is_published = TRUE
    UNION ALL
    SELECT id, 'quiz'::text AS item_type, title, total_marks AS max_points,
           close_at AS due_date, is_published
    FROM lms_quizzes WHERE course_id = $1 AND is_published = TRUE
    ORDER BY due_date NULLS LAST, title
  `, [courseId]);
  return r.rows;
}

async function getCategoriesForCourse(courseId) {
  const cats = await pool.query(
    `SELECT id, name, weight_pct, drop_lowest_n, sort_order
     FROM lms_grade_categories WHERE course_id = $1 ORDER BY sort_order, id`,
    [courseId]);
  const result = cats.rows.map(c => ({ ...c, items: [] }));
  if (result.length === 0) return result;
  const catIds = result.map(c => c.id);
  const items = await pool.query(
    `SELECT category_id, item_type, item_id FROM lms_grade_category_items
     WHERE category_id = ANY($1)`, [catIds]);
  const byCat = {};
  for (const it of items.rows) {
    if (!byCat[it.category_id]) byCat[it.category_id] = [];
    byCat[it.category_id].push({ item_type: it.item_type, item_id: it.item_id });
  }
  for (const c of result) c.items = byCat[c.id] || [];
  return result;
}

function parseCategoriesFromBody(body) {
  if (!body || !body.cats) return [];
  const cats = [];
  const keys = Object.keys(body.cats)
    .filter(k => /^\d+$/.test(k))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  for (const k of keys) {
    const c = body.cats[k];
    if (!c) continue;
    const name = String(c.name || '').trim();
    if (!name) throw new Error('Every category needs a name');
    const weight = Number(c.weight_pct);
    if (!Number.isFinite(weight) || weight < 0 || weight > 100)
      throw new Error(`Invalid weight for "${name}"`);
    const drop = Math.max(0, parseInt(c.drop_lowest_n, 10) || 0);
    const rawIds = [].concat(c.item_ids || []);
    const itemPairs = [];
    for (const v of rawIds) {
      const s = String(v || '');
      const [t, idStr] = s.split(':');
      const id = parseInt(idStr, 10);
      if (!['assignment', 'quiz'].includes(t) || !Number.isFinite(id))
        throw new Error(`Bad item reference: "${s}"`);
      itemPairs.push({ item_type: t, item_id: id });
    }
    cats.push({ name, weight_pct: weight, drop_lowest_n: drop, items: itemPairs });
  }
  const seen = new Map();
  for (const c of cats) {
    for (const it of c.items) {
      const key = `${it.item_type}:${it.item_id}`;
      if (seen.has(key))
        throw new Error(`Item ${key} is assigned to more than one category ("${seen.get(key)}" and "${c.name}")`);
      seen.set(key, c.name);
    }
  }
  return cats;
}

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
  const isTeacher = isTeacherRole(req.session.user);

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

// ============================================
// COURSE (single page, view-switched)
// ============================================
app.get('/course/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const view = req.query.view || 'dashboard';
  const isTeacher = isTeacherRole(req.session.user);

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
    let activeQuiz = null, activeQuizQuestions = [], activeQuizChoices = [];

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
      let qSql = `
        SELECT q.*,
          (SELECT COUNT(*) FROM lms_quiz_attempts a
             WHERE a.quiz_id = q.id AND a.status IN ('submitted','graded','released')) AS attempt_count,
          (SELECT COUNT(*) FROM lms_quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count
        FROM lms_quizzes q
        WHERE q.course_id = $1
      `;
      if (!isTeacher) qSql += ` AND q.is_published = TRUE`;
      qSql += ` ORDER BY q.due_date ASC NULLS LAST, q.created_at DESC`;

      const r = await pool.query(qSql, [courseId]);
      quizzes = r.rows;

      if (isTeacher && req.query.quiz_id) {
        const quizRes = await pool.query(
          `SELECT * FROM lms_quizzes WHERE id = $1 AND course_id = $2`,
          [req.query.quiz_id, courseId]
        );
        if (quizRes.rows.length > 0) {
          activeQuiz = quizRes.rows[0];
          const qRes = await pool.query(
            `SELECT * FROM lms_quiz_questions WHERE quiz_id = $1 ORDER BY position ASC`,
            [req.query.quiz_id]
          );
          activeQuizQuestions = qRes.rows;
          const cRes = await pool.query(
            `SELECT c.* FROM lms_quiz_choices c
             JOIN lms_quiz_questions q ON q.id = c.question_id
             WHERE q.quiz_id = $1
             ORDER BY c.question_id, c.position ASC`,
            [req.query.quiz_id]
          );
          activeQuizChoices = cRes.rows;
        }
      }

      if (!isTeacher && quizzes.length > 0) {
        const atRes = await pool.query(
          `SELECT * FROM lms_quiz_attempts
           WHERE student_id = $1 AND quiz_id = ANY($2)
           ORDER BY started_at DESC`,
          [req.session.user.id, quizzes.map(q => q.id)]
        );
        const byQuiz = {};
        for (const a of atRes.rows) {
          if (!byQuiz[a.quiz_id]) byQuiz[a.quiz_id] = [];
          byQuiz[a.quiz_id].push(a);
        }
        const now = new Date();
        for (const q of quizzes) {
          q.attempts = byQuiz[q.id] || [];
          q.latest_attempt = q.attempts[0] || null;
          q.is_open = (!q.open_at || new Date(q.open_at) <= now) &&
                      (!q.close_at || new Date(q.close_at) > now);
          q.has_in_progress = q.attempts.some(a => a.status === 'in_progress');
          q.can_start = q.is_open && q.attempts.length < q.max_attempts && !q.has_in_progress;
        }
      }
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

    // ============================================
    // STEP 2 FIX: COMBINE ASSIGNMENTS AND QUIZZES IN GRADEBOOK
    // ============================================
    if (view === 'grades') {
      if (isTeacher) {
        const r = await pool.query(`
          SELECT 
            s.id as record_id, 'Assignment' as item_type, s.submitted_at, s.grade as score, s.feedback, s.file_url,
            u.full_name as student_name, u.id as student_id, a.title as item_title, a.max_points
          FROM lms_submissions s
          JOIN lms_assignments a ON a.id = s.assignment_id
          JOIN users u ON u.id = s.student_id
          WHERE a.course_id = $1
          
          UNION ALL
          
          SELECT 
            qa.id as record_id, 'Quiz' as item_type, qa.submitted_at, qa.total_score as score, 'Auto-graded' as feedback, null as file_url,
            u.full_name as student_name, u.id as student_id, q.title as item_title, q.total_marks as max_points
          FROM lms_quiz_attempts qa
          JOIN lms_quizzes q ON q.id = qa.quiz_id
          JOIN users u ON u.id = qa.student_id
          WHERE q.course_id = $1 AND qa.status IN ('submitted', 'graded', 'released')
          
          ORDER BY student_name ASC, submitted_at DESC
        `, [courseId]);
        grades = r.rows;
      } else {
        const r = await pool.query(`
          SELECT 
            s.id as record_id, 'Assignment' as item_type, s.submitted_at, s.grade as score, s.feedback, s.file_url,
            a.title as item_title, a.max_points
          FROM lms_submissions s
          JOIN lms_assignments a ON a.id = s.assignment_id
          WHERE s.student_id = $1 AND a.course_id = $2
          
          UNION ALL
          
          SELECT 
            qa.id as record_id, 'Quiz' as item_type, qa.submitted_at, qa.total_score as score, 'Auto-graded' as feedback, null as file_url,
            q.title as item_title, q.total_marks as max_points
          FROM lms_quiz_attempts qa
          JOIN lms_quizzes q ON q.id = qa.quiz_id
          WHERE qa.student_id = $1 AND q.course_id = $2 AND qa.status IN ('submitted', 'graded', 'released')
          
          ORDER BY submitted_at DESC
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
      selectedAssignmentId: req.query.assignment_id || null,
      activeQuiz, activeQuizQuestions, activeQuizChoices,
      selectedQuizId: req.query.quiz_id || null
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
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
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

  if (!isTeacherRole(req.session.user) || !file || !title) {
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
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");

  try {
    await pool.query(`UPDATE lms_materials SET is_published = NOT is_published WHERE id = $1 AND course_id = $2`, [material_id, id]);
    res.redirect(`/course/${id}?view=materials`);
  } catch (err) { res.status(500).send("Toggle Error: " + err.message); }
});

// ============================================
// ASSIGNMENTS — CREATE
// ============================================
app.post('/course/:id/assignments', upload.single('attachment'), async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");

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

      if (upErr) throw new Error('Storage upload failed: ' + upErr.message);

      const { data: { publicUrl } } = supabase.storage.from('course-materials').getPublicUrl(storagePath);
      attachmentUrl = publicUrl;
      attachmentName = file.originalname;
    }

    await pool.query(`
      INSERT INTO lms_assignments
        (course_id, title, instructions, due_date, max_points, is_published, created_by, attachment_url, attachment_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      courseId, title, instructions || null, bjToUTC(due_date),
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
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
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
// SAVE GRADE (assignments)
// ============================================
app.post('/course/:id/grades/:submission_id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) {
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

// ============================================
// QUIZ BUILDER (Teacher)
// ============================================
app.post('/course/:id/quizzes', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const courseId = req.params.id;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  const b = req.body;
  if (!b.title || !b.title.trim()) return res.status(400).send("Title is required.");

  try {
    const r = await pool.query(`
      INSERT INTO lms_quizzes (
        course_id, title, description, instructions,
        open_at, close_at, duration_minutes, duration_fixed, late_start_behavior,
        due_date, pass_mark, grade_release_at, show_correct_answers, show_feedback,
        shuffle_questions, shuffle_choices, max_attempts,
        anti_cheat_enabled, auto_submit_after_warnings, is_published, created_by
      ) VALUES (
        $1,  $2,  $3, $4,
        $5,  $6,  $7, $8, $9,
        $6, $10, $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, $20
      ) RETURNING id
    `, [
      courseId, b.title.trim(), b.description || null, b.instructions || null,
      bjToUTC(b.open_at), bjToUTC(b.close_at),
      formInt(b.duration_minutes, 60), formOn(b.duration_fixed, true),
      ['full','truncated','blocked'].includes(b.late_start_behavior) ? b.late_start_behavior : 'full',
      formOptInt(b.pass_mark), bjToUTC(b.grade_release_at),
      formOn(b.show_correct_answers, true), formOn(b.show_feedback, true),
      formOn(b.shuffle_questions, true), formOn(b.shuffle_choices, true),
      formInt(b.max_attempts, 1),
      formOn(b.anti_cheat_enabled, true), formInt(b.auto_submit_after_warnings, 3),
      formOn(b.is_published, false), req.session.user.id
    ]);

    res.redirect(`/course/${courseId}?view=quizzes&quiz_id=${r.rows[0].id}`);
  } catch (err) {
    console.error('[create-quiz] FATAL:', err);
    res.status(500).send("Create Quiz Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { id: courseId, quiz_id } = req.params;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  const b = req.body;
  try {
    await pool.query(`
      UPDATE lms_quizzes SET
        title = COALESCE($1, title), description = $2, instructions = $3,
        open_at = $4, close_at = $5, due_date = $5,
        duration_minutes = $6, duration_fixed = $7, late_start_behavior = $8,
        pass_mark = $9, grade_release_at = $10,
        show_correct_answers = $11, show_feedback = $12,
        shuffle_questions = $13, shuffle_choices = $14,
        max_attempts = $15, anti_cheat_enabled = $16, auto_submit_after_warnings = $17
      WHERE id = $18 AND course_id = $19
    `, [
      b.title ? b.title.trim() : null, b.description || null, b.instructions || null,
      bjToUTC(b.open_at), bjToUTC(b.close_at),
      formInt(b.duration_minutes, 60), formOn(b.duration_fixed, true),
      ['full','truncated','blocked'].includes(b.late_start_behavior) ? b.late_start_behavior : 'full',
      formOptInt(b.pass_mark), bjToUTC(b.grade_release_at),
      formOn(b.show_correct_answers, true), formOn(b.show_feedback, true),
      formOn(b.shuffle_questions, true), formOn(b.shuffle_choices, true),
      formInt(b.max_attempts, 1), formOn(b.anti_cheat_enabled, true),
      formInt(b.auto_submit_after_warnings, 3),
      quiz_id, courseId
    ]);
    res.redirect(`/course/${courseId}?view=quizzes&quiz_id=${quiz_id}`);
  } catch (err) {
    console.error('[update-quiz]', err);
    res.status(500).send("Update Quiz Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id/publish', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { id: courseId, quiz_id } = req.params;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  try {
    const cur = await pool.query(
      `SELECT is_published,
              (SELECT COUNT(*) FROM lms_quiz_questions WHERE quiz_id = $1) AS qc
       FROM lms_quizzes WHERE id = $1 AND course_id = $2`,
      [quiz_id, courseId]);
    if (cur.rows.length === 0) return res.status(404).send("Quiz not found.");

    const willPublish = !cur.rows[0].is_published;
    if (willPublish && parseInt(cur.rows[0].qc, 10) === 0) {
      return res.status(400).send("Cannot publish a quiz with 0 questions. Add at least one question first.");
    }

    await pool.query(`UPDATE lms_quizzes SET is_published = $1 WHERE id = $2`, [willPublish, quiz_id]);
    res.redirect(`/course/${courseId}?view=quizzes`);
  } catch (err) {
    console.error('[publish-quiz]', err);
    res.status(500).send("Publish Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id/delete', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { id: courseId, quiz_id } = req.params;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");
  try {
    await pool.query(`DELETE FROM lms_quizzes WHERE id = $1 AND course_id = $2`, [quiz_id, courseId]);
    res.redirect(`/course/${courseId}?view=quizzes`);
  } catch (err) {
    console.error('[delete-quiz]', err);
    res.status(500).send("Delete Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id/questions', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { id: courseId, quiz_id } = req.params;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  const b = req.body;
  const type = String(b.type || '').toUpperCase();
  const VALID = ['MCQ','TF','FILL_BLANK','SHORT_ANSWER','ESSAY'];
  if (!VALID.includes(type)) return res.status(400).send("Invalid question type.");
  if (!b.prompt || !b.prompt.trim()) return res.status(400).send("Prompt is required.");

  const marks = Math.max(0, parseInt(b.marks, 10) || 1);
  const explanation = b.explanation || null;

  let mcqChoices = null, mcqCorrectPositions = null;
  if (type === 'MCQ') {
    const texts = [].concat(b.choice_texts || []);
    const correctSet = new Set([].concat(b.choice_correct || []).map(x => parseInt(x, 10)));
    const cleaned = texts.map((t, i) => ({ t: String(t || '').trim(), i })).filter(r => r.t.length > 0);
    if (cleaned.length < 2) return res.status(400).send("MCQ needs at least 2 non-empty choices.");
    mcqChoices = cleaned.map(r => ({ text: r.t, isCorrect: correctSet.has(r.i) }));
    mcqCorrectPositions = mcqChoices.map((c, i) => c.isCorrect ? i : -1).filter(x => x >= 0);
    if (mcqCorrectPositions.length === 0) return res.status(400).send("Mark at least one MCQ choice as correct.");
  }

  let tfValue = null;
  if (type === 'TF') tfValue = String(b.tf_value || '').toLowerCase() === 'true';

  let fillValue = null, fillSynonyms = null, fillTolerance = null, caseInsensitive = true;
  if (type === 'FILL_BLANK') {
    if (!b.fill_value || !b.fill_value.trim()) return res.status(400).send("Fill-in-blank needs a correct value.");
    fillValue = b.fill_value.trim();
    fillSynonyms = (b.synonyms || '').split(',').map(s => s.trim()).filter(Boolean);
    fillTolerance = b.tolerance ? Number(b.tolerance) : null;
    caseInsensitive = formOn(b.case_insensitive, true);
  }

  let modelAnswer = null;
  if (type === 'SHORT_ANSWER' || type === 'ESSAY') modelAnswer = b.model_answer ? b.model_answer.trim() : null;

  const autoGradeDefault = !['SHORT_ANSWER','ESSAY'].includes(type);
  const autoGrade = b.auto_grade === undefined ? autoGradeDefault : formOn(b.auto_grade, autoGradeDefault);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const posRes = await client.query(
      `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM lms_quiz_questions WHERE quiz_id = $1`,
      [quiz_id]);
    const nextPos = parseInt(posRes.rows[0].next_pos, 10);

    let correctAnswer = null;
    if (type === 'FILL_BLANK') correctAnswer = { value: fillValue, synonyms: fillSynonyms || [], tolerance: fillTolerance };
    else if (type === 'SHORT_ANSWER' || type === 'ESSAY') correctAnswer = modelAnswer ? { model_answer: modelAnswer } : null;

    const qInsert = await client.query(`
      INSERT INTO lms_quiz_questions
        (quiz_id, position, type, prompt, explanation, marks, correct_answer,
         auto_grade, case_insensitive, synonyms, tolerance)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [quiz_id, nextPos, type, b.prompt.trim(), explanation, marks,
        correctAnswer, autoGrade, caseInsensitive, fillSynonyms, fillTolerance]);
    const newQuestionId = qInsert.rows[0].id;

    if (type === 'MCQ') {
      for (let i = 0; i < mcqChoices.length; i++) {
        await client.query(
          `INSERT INTO lms_quiz_choices (question_id, position, text, is_correct) VALUES ($1, $2, $3, $4)`,
          [newQuestionId, i, mcqChoices[i].text, mcqChoices[i].isCorrect]);
      }
      await client.query(
        `UPDATE lms_quiz_questions SET correct_answer = $1 WHERE id = $2`,
        [{ positions: mcqCorrectPositions }, newQuestionId]);
    }

    if (type === 'TF') {
      await client.query(
        `INSERT INTO lms_quiz_choices (question_id, position, text, is_correct) VALUES
          ($1, 0, 'True',  $2),
          ($1, 1, 'False', $3)`,
        [newQuestionId, tfValue, !tfValue]);
      await client.query(
        `UPDATE lms_quiz_questions SET correct_answer = $1 WHERE id = $2`,
        [{ value: tfValue }, newQuestionId]);
    }

    await client.query('COMMIT');
    res.redirect(`/course/${courseId}?view=quizzes&quiz_id=${quiz_id}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[add-question]', err);
    res.status(400).send("Add Question Error: " + err.message);
  } finally {
    client.release();
  }
});

app.post('/course/:id/quizzes/:quiz_id/questions/:question_id/delete', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { id: courseId, quiz_id, question_id } = req.params;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");
  try {
    await pool.query(`DELETE FROM lms_quiz_questions WHERE id = $1 AND quiz_id = $2`, [question_id, quiz_id]);
    res.redirect(`/course/${courseId}?view=quizzes&quiz_id=${quiz_id}`);
  } catch (err) {
    console.error('[delete-question]', err);
    res.status(500).send("Delete Question Error: " + err.message);
  }
});

// ============================================
// QUIZ — STUDENT FLOW + GRADING
// ============================================
app.post('/course/:id/quizzes/:quiz_id/start', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { id: courseId, quiz_id } = req.params;

  try {
    const enroll = await pool.query(
      `SELECT 1 FROM enrollments WHERE course_id = $1 AND user_id = $2 LIMIT 1`,
      [courseId, req.session.user.id]);
    if (enroll.rows.length === 0) return res.status(403).send("Not enrolled.");

    const qRes = await pool.query(
      `SELECT * FROM lms_quizzes WHERE id = $1 AND course_id = $2 AND is_published = TRUE`,
      [quiz_id, courseId]);
    if (qRes.rows.length === 0) return res.status(404).send("Quiz not found or not published.");
    const quiz = qRes.rows[0];

    const now = new Date();
    if (quiz.open_at && new Date(quiz.open_at) > now) return res.status(400).send("Quiz is not open yet.");
    if (quiz.close_at && new Date(quiz.close_at) <= now) return res.status(400).send("Quiz is closed.");

    const existing = await pool.query(
      `SELECT * FROM lms_quiz_attempts WHERE quiz_id = $1 AND student_id = $2 ORDER BY started_at DESC`,
      [quiz_id, req.session.user.id]);

    const inProg = existing.rows.find(a => a.status === 'in_progress');
    if (inProg) return res.redirect(`/course/${courseId}/quizzes/${quiz_id}/take`);

    if (existing.rows.length >= quiz.max_attempts) {
      return res.status(400).send("Maximum attempts reached.");
    }

    const durationMs = quiz.duration_minutes * 60 * 1000;
    let endsAt = new Date(now.getTime() + durationMs);

    if (quiz.duration_fixed && quiz.close_at && endsAt > new Date(quiz.close_at)) {
      if (quiz.late_start_behavior === 'blocked') {
        return res.status(400).send("Too late to start — not enough time before close.");
      } else if (quiz.late_start_behavior === 'truncated') {
        endsAt = new Date(quiz.close_at);
      }
    }

    const attemptNum = existing.rows.length + 1;
    const ins = await pool.query(`
      INSERT INTO lms_quiz_attempts
        (quiz_id, student_id, attempt_number, status,
         started_at, ends_at, last_activity_at, current_question_index,
         ip_address, user_agent)
      VALUES ($1, $2, $3, 'in_progress', NOW(), $4, NOW(), 0, $5, $6)
      RETURNING id
    `, [
      quiz_id, req.session.user.id, attemptNum, endsAt,
      req.ip || null, (req.get('user-agent') || '').substring(0, 500)
    ]);

    console.log(`[quiz-start] attempt ${ins.rows[0].id} for quiz ${quiz_id} student ${req.session.user.id} ends ${endsAt.toISOString()}`);
    res.redirect(`/course/${courseId}/quizzes/${quiz_id}/take`);
  } catch (err) {
    console.error('[quiz-start]', err);
    res.status(500).send("Start Quiz Error: " + err.message);
  }
});

app.get('/course/:id/quizzes/:quiz_id/take', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { id: courseId, quiz_id } = req.params;

  try {
    const qRes = await pool.query(
      `SELECT q.*, c.code AS course_code, c.title AS course_title
       FROM lms_quizzes q JOIN courses c ON c.id = q.course_id
       WHERE q.id = $1 AND q.course_id = $2`,
      [quiz_id, courseId]);
    if (qRes.rows.length === 0) return res.status(404).send("Quiz not found.");
    const quiz = qRes.rows[0];

    const aRes = await pool.query(
      `SELECT * FROM lms_quiz_attempts
       WHERE quiz_id = $1 AND student_id = $2 AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
      [quiz_id, req.session.user.id]);
    if (aRes.rows.length === 0) return res.redirect(`/course/${courseId}?view=quizzes`);
    const attempt = aRes.rows[0];

    const now = new Date();
    if (now >= new Date(attempt.ends_at)) {
      await autoSubmitAttempt(attempt.id, quiz_id);
      return res.redirect(`/course/${courseId}/quizzes/${quiz_id}/result`);
    }

    const allQ = await pool.query(
      `SELECT * FROM lms_quiz_questions WHERE quiz_id = $1 ORDER BY position`, [quiz_id]);
    if (allQ.rows.length === 0) return res.status(400).send("Quiz has no questions.");

    let questions = allQ.rows;
    if (quiz.shuffle_questions) questions = shuffleSeeded(questions, `q_${attempt.id}_${quiz_id}`);

    const idx = attempt.current_question_index;
    if (idx >= questions.length) {
      await autoSubmitAttempt(attempt.id, quiz_id);
      return res.redirect(`/course/${courseId}/quizzes/${quiz_id}/result`);
    }
    const currentQ = questions[idx];

    let choices = [];
    if (currentQ.type === 'MCQ' || currentQ.type === 'TF') {
      const cRes = await pool.query(
        `SELECT id, text, position FROM lms_quiz_choices WHERE question_id = $1 ORDER BY position`,
        [currentQ.id]);
      choices = cRes.rows;
      if (quiz.shuffle_choices) choices = shuffleSeeded(choices, `c_${attempt.id}_${currentQ.id}`);
    }

    const ansRes = await pool.query(
      `SELECT * FROM lms_quiz_answers WHERE attempt_id = $1 AND question_id = $2`,
      [attempt.id, currentQ.id]);
    const existingAnswer = ansRes.rows[0] || null;

    const remainingSeconds = Math.max(0, Math.floor((new Date(attempt.ends_at) - now) / 1000));

    await pool.query(`UPDATE lms_quiz_attempts SET last_activity_at = NOW() WHERE id = $1`, [attempt.id]);

    res.render('lms-quiz-take', {
      user: req.session.user,
      course: { id: courseId, code: quiz.course_code, title: quiz.course_title },
      quiz, attempt, currentQ, choices, existingAnswer,
      questionIndex: idx,
      questionNumber: idx + 1,
      totalQuestions: questions.length,
      remainingSeconds,
      warningsCount: attempt.tab_switch_warnings,
      maxWarnings: quiz.auto_submit_after_warnings
    });
  } catch (err) {
    console.error('[quiz-take]', err);
    res.status(500).send("Take Quiz Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id/answer', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { id: courseId, quiz_id } = req.params;

  try {
    const aRes = await pool.query(
      `SELECT * FROM lms_quiz_attempts
       WHERE quiz_id = $1 AND student_id = $2 AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
      [quiz_id, req.session.user.id]);
    if (aRes.rows.length === 0) return res.redirect(`/course/${courseId}?view=quizzes`);
    const attempt = aRes.rows[0];

    if (new Date() >= new Date(attempt.ends_at)) {
      await autoSubmitAttempt(attempt.id, quiz_id);
      return res.redirect(`/course/${courseId}/quizzes/${quiz_id}/result`);
    }

    const qInfo = await pool.query(`SELECT shuffle_questions FROM lms_quizzes WHERE id = $1`, [quiz_id]);
    const shuffle = qInfo.rows[0]?.shuffle_questions;

    const allQ = await pool.query(
      `SELECT * FROM lms_quiz_questions WHERE quiz_id = $1 ORDER BY position`, [quiz_id]);
    let questions = allQ.rows;
    if (shuffle) questions = shuffleSeeded(questions, `q_${attempt.id}_${quiz_id}`);

    const idx = attempt.current_question_index;
    if (idx >= questions.length) {
      await autoSubmitAttempt(attempt.id, quiz_id);
      return res.redirect(`/course/${courseId}/quizzes/${quiz_id}/result`);
    }
    const currentQ = questions[idx];

    let studentAnswer = null;
    if (currentQ.type === 'MCQ') {
      const ids = [].concat(req.body.choice_ids || []).map(x => parseInt(x, 10)).filter(Number.isFinite);
      studentAnswer = { choice_ids: ids };
    } else if (currentQ.type === 'TF') {
      const raw = req.body.tf_value;
      if (raw === undefined || raw === null || raw === '') studentAnswer = { value: null };
      else studentAnswer = { value: String(raw).toLowerCase() === 'true' };
    } else {
      studentAnswer = { value: String(req.body.text_value || '') };
    }

    await pool.query(`
      INSERT INTO lms_quiz_answers (attempt_id, question_id, student_answer, answered_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET student_answer = EXCLUDED.student_answer, answered_at = NOW()
    `, [attempt.id, currentQ.id, studentAnswer]);

    const newIdx = idx + 1;
    const isLast = newIdx >= questions.length;
    await pool.query(
      `UPDATE lms_quiz_attempts SET current_question_index = $1, last_activity_at = NOW() WHERE id = $2`,
      [newIdx, attempt.id]);

    if (isLast) {
      await autoSubmitAttempt(attempt.id, quiz_id);
      return res.redirect(`/course/${courseId}/quizzes/${quiz_id}/result`);
    }
    res.redirect(`/course/${courseId}/quizzes/${quiz_id}/take`);
  } catch (err) {
    console.error('[quiz-answer]', err);
    res.status(500).send("Save Answer Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id/submit', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { id: courseId, quiz_id } = req.params;

  try {
    const aRes = await pool.query(
      `SELECT * FROM lms_quiz_attempts
       WHERE quiz_id = $1 AND student_id = $2 AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
      [quiz_id, req.session.user.id]);
    if (aRes.rows.length === 0) return res.redirect(`/course/${courseId}?view=quizzes`);

    await autoSubmitAttempt(aRes.rows[0].id, quiz_id);
    res.redirect(`/course/${courseId}/quizzes/${quiz_id}/result`);
  } catch (err) {
    console.error('[quiz-submit]', err);
    res.status(500).send("Submit Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id/flag', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ ok: false });
  const { quiz_id } = req.params;

  try {
    const aRes = await pool.query(
      `SELECT a.*, q.auto_submit_after_warnings, q.anti_cheat_enabled
       FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quiz_id
       WHERE a.quiz_id = $1 AND a.student_id = $2 AND a.status = 'in_progress'
       ORDER BY a.started_at DESC LIMIT 1`,
      [quiz_id, req.session.user.id]);
    if (aRes.rows.length === 0) return res.json({ ok: true, ignored: true });
    const attempt = aRes.rows[0];

    if (!attempt.anti_cheat_enabled) return res.json({ ok: true, ignored: true });

    const newCount = attempt.tab_switch_warnings + 1;
    const reason = String(req.body?.reason || 'tab_switch').substring(0, 40);

    await pool.query(
      `UPDATE lms_quiz_attempts SET tab_switch_warnings = $1, last_activity_at = NOW() WHERE id = $2`,
      [newCount, attempt.id]);

    console.log(`[quiz-flag] attempt ${attempt.id} warning ${newCount}/${attempt.auto_submit_after_warnings} reason=${reason}`);

    if (newCount >= attempt.auto_submit_after_warnings) {
      await autoSubmitAttempt(attempt.id, quiz_id);
      return res.json({ ok: true, submitted: true, warnings: newCount });
    }
    return res.json({
      ok: true, submitted: false,
      warnings: newCount,
      remaining: attempt.auto_submit_after_warnings - newCount
    });
  } catch (err) {
    console.error('[quiz-flag]', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/course/:id/quizzes/:quiz_id/result', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { id: courseId, quiz_id } = req.params;

  try {
    const qRes = await pool.query(
      `SELECT q.*, c.code AS course_code, c.title AS course_title
       FROM lms_quizzes q JOIN courses c ON c.id = q.course_id
       WHERE q.id = $1 AND q.course_id = $2`,
      [quiz_id, courseId]);
    if (qRes.rows.length === 0) return res.status(404).send("Quiz not found.");
    const quiz = qRes.rows[0];

    const aRes = await pool.query(
      `SELECT * FROM lms_quiz_attempts
       WHERE quiz_id = $1 AND student_id = $2
       ORDER BY started_at DESC LIMIT 1`,
      [quiz_id, req.session.user.id]);
    if (aRes.rows.length === 0) return res.redirect(`/course/${courseId}?view=quizzes`);
    const attempt = aRes.rows[0];

    const isReleased = await maybeRelease(attempt, quiz);
    if (isReleased) attempt.status = 'released';

    let breakdown = [];
    if (attempt.status === 'released') {
      const qq = await pool.query(
        `SELECT * FROM lms_quiz_questions WHERE quiz_id = $1 ORDER BY position`, [quiz_id]);
      const aa = await pool.query(
        `SELECT * FROM lms_quiz_answers WHERE attempt_id = $1`, [attempt.id]);
      const cc = await pool.query(
        `SELECT id, question_id, text, is_correct, position
         FROM lms_quiz_choices WHERE question_id = ANY($1) ORDER BY question_id, position`,
        [qq.rows.map(x => x.id)]);

      const ansByQ = {};
      for (const a of aa.rows) ansByQ[a.question_id] = a;
      const choicesByQ = {};
      for (const c of cc.rows) {
        if (!choicesByQ[c.question_id]) choicesByQ[c.question_id] = [];
        choicesByQ[c.question_id].push(c);
      }

      for (const q of qq.rows) {
        const a = ansByQ[q.id];
        const chs = choicesByQ[q.id] || [];
        let yourAnswerText = null, correctAnswerText = null;

        if (q.type === 'MCQ') {
          const sel = (a?.student_answer?.choice_ids) || [];
          yourAnswerText = chs.filter(c => sel.includes(c.id)).map(c => c.text).join(', ') || null;
          if (quiz.show_correct_answers) correctAnswerText = chs.filter(c => c.is_correct).map(c => c.text).join(', ');
        } else if (q.type === 'TF') {
          const v = a?.student_answer?.value;
          yourAnswerText = v === true ? 'True' : v === false ? 'False' : null;
          if (quiz.show_correct_answers) correctAnswerText = q.correct_answer?.value ? 'True' : 'False';
        } else {
          yourAnswerText = a?.student_answer?.value || null;
          if (quiz.show_correct_answers && q.correct_answer) {
            correctAnswerText = q.correct_answer.value || q.correct_answer.model_answer || null;
          }
        }

        breakdown.push({
          question: q,
          answer: a,
          choices: chs,
          yourAnswerText,
          correctAnswerText,
          marksEarned: Number(a?.auto_score ?? 0) + Number(a?.manual_score ?? 0),
          maxMarks: Number(q.marks),
          isCorrect: a?.is_correct,
          feedback: (quiz.show_feedback ? a?.teacher_feedback : null),
          explanation: (quiz.show_feedback ? q.explanation : null)
        });
      }
    }

    res.render('lms-quiz-result', {
      user: req.session.user,
      course: { id: courseId, code: quiz.course_code, title: quiz.course_title },
      quiz, attempt, breakdown, isReleased
    });
  } catch (err) {
    console.error('[quiz-result]', err);
    res.status(500).send("Result Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id/force-close', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { id: courseId, quiz_id } = req.params;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  try {
    const inProg = await pool.query(
      `SELECT id FROM lms_quiz_attempts WHERE quiz_id = $1 AND status = 'in_progress'`,
      [quiz_id]);
    for (const row of inProg.rows) await autoSubmitAttempt(row.id, quiz_id);
    await pool.query(`UPDATE lms_quizzes SET is_published = FALSE WHERE id = $1`, [quiz_id]);

    console.log(`[force-close] quiz ${quiz_id}: submitted ${inProg.rows.length} in-progress attempts`);
    res.redirect(`/course/${courseId}?view=quizzes`);
  } catch (err) {
    console.error('[force-close]', err);
    res.status(500).send("Force-Close Error: " + err.message);
  }
});

app.get('/course/:id/quizzes/:quiz_id/grading', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { id: courseId, quiz_id } = req.params;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  try {
    const qRes = await pool.query(
      `SELECT q.*, c.code AS course_code, c.title AS course_title
       FROM lms_quizzes q JOIN courses c ON c.id = q.course_id
       WHERE q.id = $1 AND q.course_id = $2`, [quiz_id, courseId]);
    if (qRes.rows.length === 0) return res.status(404).send("Quiz not found.");
    const quiz = qRes.rows[0];

    const attemptsRes = await pool.query(`
      SELECT a.*, u.full_name AS student_name
      FROM lms_quiz_attempts a JOIN users u ON u.id = a.student_id
      WHERE a.quiz_id = $1 AND a.status IN ('submitted','graded','released')
      ORDER BY u.full_name ASC, a.submitted_at ASC
    `, [quiz_id]);

    const manualQ = await pool.query(
      `SELECT id, prompt, marks, type, correct_answer
       FROM lms_quiz_questions
       WHERE quiz_id = $1 AND auto_grade = FALSE
       ORDER BY position`, [quiz_id]);

    for (const att of attemptsRes.rows) {
      const ansRes = await pool.query(
        `SELECT * FROM lms_quiz_answers WHERE attempt_id = $1`, [att.id]);
      const ansByQ = {};
      for (const a of ansRes.rows) ansByQ[a.question_id] = a;
      att.manual_questions = manualQ.rows.map(q => ({
        question: q,
        answer: ansByQ[q.id] || null
      }));
      att.has_unscored_manual = att.manual_questions.some(x => x.answer?.manual_score == null);
    }

    res.render('lms-quiz-grading', {
      user: req.session.user,
      course: { id: courseId, code: quiz.course_code, title: quiz.course_title },
      quiz, attempts: attemptsRes.rows
    });
  } catch (err) {
    console.error('[grading-queue]', err);
    res.status(500).send("Grading Queue Error: " + err.message);
  }
});

app.post('/course/:id/quizzes/:quiz_id/grading/:attempt_id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { id: courseId, quiz_id, attempt_id } = req.params;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  try {
    const aCheck = await pool.query(
      `SELECT 1 FROM lms_quiz_attempts WHERE id = $1 AND quiz_id = $2`,
      [attempt_id, quiz_id]);
    if (aCheck.rows.length === 0) return res.status(404).send("Attempt not found.");

    const manualQ = await pool.query(
      `SELECT id, marks FROM lms_quiz_questions WHERE quiz_id = $1 AND auto_grade = FALSE`,
      [quiz_id]);

    for (const q of manualQ.rows) {
      const rawScore = req.body[`manual_score_${q.id}`];
      const feedback = req.body[`feedback_${q.id}`];
      if (rawScore === undefined) continue;

      let score = Number(rawScore);
      if (!Number.isFinite(score)) score = 0;
      if (score < 0) score = 0;
      if (score > q.marks) score = q.marks;

      await pool.query(`
        INSERT INTO lms_quiz_answers (attempt_id, question_id, manual_score, teacher_feedback, answered_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (attempt_id, question_id)
        DO UPDATE SET manual_score = EXCLUDED.manual_score, teacher_feedback = EXCLUDED.teacher_feedback
      `, [attempt_id, q.id, score, feedback || null]);
    }

    const totals = await pool.query(`
      SELECT COALESCE(SUM(COALESCE(auto_score,0) + COALESCE(manual_score,0)), 0) AS total
      FROM lms_quiz_answers WHERE attempt_id = $1
    `, [attempt_id]);
    const totalScore = Number(totals.rows[0].total);

    const quizRes = await pool.query(`SELECT total_marks FROM lms_quizzes WHERE id = $1`, [quiz_id]);
    const totalMarks = Number(quizRes.rows[0]?.total_marks) || 0;
    const pct = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

    const unscored = await pool.query(`
      SELECT COUNT(*) AS n FROM lms_quiz_questions q
      LEFT JOIN lms_quiz_answers a ON a.question_id = q.id AND a.attempt_id = $1
      WHERE q.quiz_id = $2 AND q.auto_grade = FALSE AND a.manual_score IS NULL
    `, [attempt_id, quiz_id]);
    const allScored = parseInt(unscored.rows[0].n, 10) === 0;

    await pool.query(`
      UPDATE lms_quiz_attempts SET
        total_score = $1, percentage = $2,
        is_graded = $3,
        graded_at = CASE WHEN $3 THEN NOW() ELSE graded_at END,
        status = CASE WHEN $3 AND status = 'submitted' THEN 'graded' ELSE status END
      WHERE id = $4
    `, [totalScore, pct, allScored, attempt_id]);

    res.redirect(`/course/${courseId}/quizzes/${quiz_id}/grading`);
  } catch (err) {
    console.error('[save-grade]', err);
    res.status(500).send("Save Grade Error: " + err.message);
  }
});


// ============================================
// GRADEBOOK — G-3: Categories, Weights, Curve, Rounding
// ============================================

// GET: rules page
app.get('/course/:id/gradebook/setup/rules', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const courseId = req.params.id;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  try {
    const courseRes = await pool.query(
      `SELECT id, code, title, credits FROM courses WHERE id = $1`, [courseId]);
    if (courseRes.rows.length === 0) return res.status(404).send("Course not found.");
    const course = courseRes.rows[0];

    const settings = await ensureGradeSettings(courseId);
    const categories = await getCategoriesForCourse(courseId);
    const assessments = await listCourseAssessments(courseId);

    const assignedKeys = new Set();
    for (const c of categories) for (const it of c.items) assignedKeys.add(`${it.item_type}:${it.item_id}`);
    const unassigned = assessments.filter(a => !assignedKeys.has(`${a.item_type}:${a.id}`));
    const totalWeight = categories.reduce((s, c) => s + Number(c.weight_pct), 0);

    res.render('lms-gradebook-rules', {
      user: req.session.user,
      course, settings, categories, assessments, unassigned, totalWeight,
      flashError: req.query.error || null,
      flashSuccess: req.query.success || null
    });
  } catch (err) {
    console.error('[gradebook-rules]', err);
    res.status(500).send("Gradebook Rules Error: " + err.message);
  }
});

// POST: save general settings
app.post('/course/:id/gradebook/setup/rules/general', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const courseId = req.params.id;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  try {
    const s = await ensureGradeSettings(courseId);
    if (s.publish_state !== 'draft') {
      return res.redirect(`/course/${courseId}/gradebook/setup/rules?error=${encodeURIComponent('Gradebook is ' + s.publish_state + ' — cannot change rules')}`);
    }
    if (s.curve_locked) {
      return res.redirect(`/course/${courseId}/gradebook/setup/rules?error=${encodeURIComponent('Curve is locked after publish')}`);
    }

    const wm = String(req.body.weighting_mode || 'weighted');
    const cm = String(req.body.curve_mode || 'none');
    const rr = String(req.body.rounding_rule || 'half_up');

    if (!['simple', 'weighted'].includes(wm)) throw new Error('Invalid weighting mode');
    if (!['none', 'linear_max100', 'linear_mean', 'sqrt', 'bell'].includes(cm)) throw new Error('Invalid curve');
    if (!['none', 'integer', '1_decimal', 'half_up', 'half_even'].includes(rr)) throw new Error('Invalid rounding');

    await pool.query(`
      UPDATE lms_grade_settings SET
        weighting_mode = $1, curve_mode = $2, rounding_rule = $3
      WHERE course_id = $4
    `, [wm, cm, rr, courseId]);

    await pool.query(`
      INSERT INTO lms_grade_audit (course_id, item_type, action, changed_by, reason, old_value, new_value)
      VALUES ($1, 'gradebook', 'update', $2, 'General grade settings updated', $3, $4)
    `, [
      courseId, req.session.user.id,
      JSON.stringify({ weighting_mode: s.weighting_mode, curve_mode: s.curve_mode, rounding_rule: s.rounding_rule }),
      JSON.stringify({ weighting_mode: wm, curve_mode: cm, rounding_rule: rr })
    ]);

    res.redirect(`/course/${courseId}/gradebook/setup/rules?success=${encodeURIComponent('General settings saved')}`);
  } catch (err) {
    console.error('[gradebook-general-save]', err);
    res.redirect(`/course/${courseId}/gradebook/setup/rules?error=${encodeURIComponent(err.message)}`);
  }
});

// POST: save categories (full replace)
app.post('/course/:id/gradebook/setup/rules/categories', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const courseId = req.params.id;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  try {
    const s = await ensureGradeSettings(courseId);
    if (s.publish_state !== 'draft') {
      return res.redirect(`/course/${courseId}/gradebook/setup/rules?error=${encodeURIComponent('Gradebook is ' + s.publish_state + ' — cannot change categories')}`);
    }

    const cats = parseCategoriesFromBody(req.body);
    const oldCats = await getCategoriesForCourse(courseId);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM lms_grade_categories WHERE course_id = $1`, [courseId]);
      let sort = 0;
      for (const c of cats) {
        const ins = await client.query(
          `INSERT INTO lms_grade_categories
             (course_id, name, weight_pct, drop_lowest_n, sort_order)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [courseId, c.name, c.weight_pct, c.drop_lowest_n, sort++]);
        const catId = ins.rows[0].id;
        for (const it of c.items) {
          await client.query(
            `INSERT INTO lms_grade_category_items (category_id, item_type, item_id)
             VALUES ($1,$2,$3)`,
            [catId, it.item_type, it.item_id]);
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const newCats = await getCategoriesForCourse(courseId);
    await pool.query(`
      INSERT INTO lms_grade_audit (course_id, item_type, action, changed_by, reason, old_value, new_value)
      VALUES ($1, 'gradebook', 'update', $2, 'Categories replaced', $3, $4)
    `, [
      courseId, req.session.user.id,
      JSON.stringify(oldCats.map(c => ({ name: c.name, weight: c.weight_pct, items: c.items }))),
      JSON.stringify(newCats.map(c => ({ name: c.name, weight: c.weight_pct, items: c.items })))
    ]);

    res.redirect(`/course/${courseId}/gradebook/setup/rules?success=${encodeURIComponent('Categories saved')}`);
  } catch (err) {
    console.error('[gradebook-categories-save]', err);
    res.redirect(`/course/${courseId}/gradebook/setup/rules?error=${encodeURIComponent(err.message)}`);
  }
});

// ============================================
// ATTENDANCE MODULE
// ============================================

// Helper: Calculate distance between two coordinates in meters (Haversine formula)
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// 1. GET Attendance View (Handles BOTH Teacher and Student)
app.get('/course/:id/attendance', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const isTeacher = isTeacherRole(req.session.user);

  try {
    const courseRes = await pool.query(`SELECT id, code, title, credits FROM courses WHERE id = $1`, [courseId]);
    if (courseRes.rows.length === 0) return res.status(404).send("Course not found.");
    const course = courseRes.rows[0];

    // ==========================================
    // STUDENT VIEW
    // ==========================================
    if (!isTeacher) {
      const totalSessionsRes = await pool.query(`SELECT COUNT(*) as total FROM lms_attendance_sessions WHERE course_id = $1`, [courseId]);
      const totalSessions = parseInt(totalSessionsRes.rows[0].total);

      const attendedRes = await pool.query(`
        SELECT COUNT(*) as attended FROM lms_attendance_records r
        JOIN lms_attendance_sessions s ON s.id = r.session_id
        WHERE s.course_id = $1 AND r.student_id = $2 AND r.status = 'present'
      `, [courseId, req.session.user.id]);
      const attended = parseInt(attendedRes.rows[0].attended);

      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      const isEligible = percentage >= 70;

      const logsRes = await pool.query(`
        SELECT s.date, s.hour_number, r.status FROM lms_attendance_sessions s
        LEFT JOIN lms_attendance_records r ON r.session_id = s.id AND r.student_id = $2
        WHERE s.course_id = $1 ORDER BY s.date DESC, s.hour_number DESC
      `, [courseId, req.session.user.id]);

      return res.render('lms-student-attendance', { 
        user: req.session.user, course, totalSessions, attended, percentage, isEligible, logs: logsRes.rows 
      });
    }

    // ==========================================
    // TEACHER VIEW
    // ==========================================
    const ownsCourse = await teacherOwnsCourse(req.session.user.id, courseId);
    if (!ownsCourse) {
      return res.status(403).send(`Access Denied: Your User ID (${req.session.user.id}) is not registered as the teacher for Course ${courseId} in the database.`);
    }

    const dateStr = req.query.date || new Date().toISOString().split('T')[0];

    const studentsRes = await pool.query(`
      SELECT u.id, u.full_name, u.email, COALESCE(sp.admission_number, u.id::text) as admission_number 
      FROM enrollments e JOIN users u ON u.id = e.user_id LEFT JOIN student_profiles sp ON sp.user_id = u.id 
      WHERE e.course_id = $1 ORDER BY admission_number ASC
    `, [courseId]);

    const sessionsRes = await pool.query(`
      SELECT * FROM lms_attendance_sessions WHERE course_id = $1 AND date = $2 ORDER BY hour_number ASC
    `, [courseId, dateStr]);

    const sessionIds = sessionsRes.rows.map(s => s.id);
    let records = [];
    if (sessionIds.length > 0) {
      const recRes = await pool.query(`SELECT * FROM lms_attendance_records WHERE session_id = ANY($1)`, [sessionIds]);
      records = recRes.rows;
    }

    res.render('lms-attendance', {
      user: req.session.user, course, students: studentsRes.rows, sessions: sessionsRes.rows, records, selectedDate: dateStr
    });
  } catch (err) {
    res.status(500).send("Attendance Error: " + err.message);
  }
});

// 2. GET Summary View (Teacher only - 70% Rule)
app.get('/course/:id/attendance/summary', async (req, res) => {
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const courseId = req.params.id;
  if (!(await teacherOwnsCourse(req.session.user.id, courseId))) return res.status(403).send("Access Denied.");

  try {
    const courseRes = await pool.query(`SELECT id, code, title FROM courses WHERE id = $1`, [courseId]);
    const totalSessionsRes = await pool.query(`SELECT COUNT(*) as total FROM lms_attendance_sessions WHERE course_id = $1`, [courseId]);
    const totalSessions = parseInt(totalSessionsRes.rows[0].total);

    const studentsRes = await pool.query(`
      SELECT u.id, u.full_name, COALESCE(sp.admission_number, u.id::text) as admission_number,
      (SELECT COUNT(*) FROM lms_attendance_records r JOIN lms_attendance_sessions s ON s.id = r.session_id 
       WHERE s.course_id = $1 AND r.student_id = u.id AND r.status = 'present') as attended
      FROM enrollments e JOIN users u ON u.id = e.user_id LEFT JOIN student_profiles sp ON sp.user_id = u.id 
      WHERE e.course_id = $1 ORDER BY admission_number ASC
    `, [courseId]);

    const eligible = [];
    const ineligible = [];

    studentsRes.rows.forEach(st => {
      const pct = totalSessions > 0 ? Math.round((parseInt(st.attended) / totalSessions) * 100) : 0;
      st.percentage = pct;
      if (pct >= 70) eligible.push(st);
      else ineligible.push(st);
    });

    res.render('lms-attendance-summary', { user: req.session.user, course: courseRes.rows[0], totalSessions, eligible, ineligible });
  } catch (err) {
    res.status(500).send("Summary Error: " + err.message);
  }
});

// 3. POST Start Sessions
app.post('/course/:id/attendance/start', async (req, res) => {
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const courseId = req.params.id;
  const { date, hours } = req.body;
  const numHours = parseInt(hours) || 3;

  try {
    for (let i = 1; i <= numHours; i++) {
      await pool.query(`INSERT INTO lms_attendance_sessions (course_id, date, hour_number) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [courseId, date, i]);
    }
    res.redirect(`/course/${courseId}/attendance?date=${date}`);
  } catch (err) {
    res.status(500).send("Start Session Error: " + err.message);
  }
});

// 4. POST Generate QR Token
app.post('/course/:id/attendance/qr/:session_id', async (req, res) => {
  if (!isTeacherRole(req.session.user)) return res.status(403).json({ error: "Access Denied" });
  const { session_id } = req.params;
  const { lat, lng } = req.body;

  try {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await pool.query(`
      UPDATE lms_attendance_sessions SET qr_token = $1, token_expires_at = NOW() + INTERVAL '100 seconds', teacher_lat = $2, teacher_lng = $3 WHERE id = $4
    `, [token, lat, lng, session_id]);
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST Manual Mark (Radio Buttons)
app.post('/course/:id/attendance/manual', async (req, res) => {
  if (!isTeacherRole(req.session.user)) return res.status(403).send("Access Denied.");
  const { session_id, student_id, status } = req.body;

  try {
    await pool.query(`
      INSERT INTO lms_attendance_records (session_id, student_id, status, method, marked_by)
      VALUES ($1, $2, $3, 'manual', $4)
      ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, method = 'manual'
    `, [session_id, student_id, status, req.session.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET Student Scan Page
app.get('/course/:id/attendance/scan', async (req, res) => {
  if (!req.session.user) return res.redirect(`/login?redirect=/course/${req.params.id}/attendance/scan?token=${req.query.token}`);
  const courseId = req.params.id;
  const { token } = req.query;
  if (!token) return res.status(400).send("Invalid token.");

  try {
    const courseRes = await pool.query(`SELECT title, code FROM courses WHERE id = $1`, [courseId]);
    res.render('lms-attendance-scan', { user: req.session.user, course: courseRes.rows[0], token });
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// 7. POST Confirm Scan (From the Confirm Button)
app.post('/course/:id/attendance/scan', async (req, res) => {
  if (!req.session.user) return res.json({ success: false, error: "Not logged in" });
  const { token, lat, lng } = req.body;
  const courseId = req.params.id;

  try {
    const sessRes = await pool.query(`
      SELECT s.*, c.title as course_title FROM lms_attendance_sessions s
      JOIN courses c ON c.id = s.course_id
      WHERE s.qr_token = $1 AND s.token_expires_at > NOW() AND s.course_id = $2
    `, [token, courseId]);

    if (sessRes.rows.length === 0) return res.json({ success: false, error: "QR Code expired or invalid." });
    const session = sessRes.rows[0];

    const distance = getDistanceFromLatLonInMeters(lat, lng, session.teacher_lat, session.teacher_lng);
    if (distance > 50) return res.json({ success: false, error: `Rejected: You are ${Math.round(distance)}m away. Must be within 50m.` });

    await pool.query(`
      INSERT INTO lms_attendance_records (session_id, student_id, status, method, scanned_lat, scanned_lng)
      VALUES ($1, $2, 'present', 'qr', $3, $4)
      ON CONFLICT (session_id, student_id) DO UPDATE SET status = 'present', method = 'qr'
    `, [session.id, req.session.user.id, lat, lng]);

    res.json({ success: true, message: `Attendance confirmed for ${session.course_title}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET Status (Polling for Teacher)
app.get('/course/:id/attendance/status', async (req, res) => {
  if (!isTeacherRole(req.session.user)) return res.status(403).json({ error: "Access Denied" });
  const { date } = req.query;
  try {
    const sessions = await pool.query(`SELECT id FROM lms_attendance_sessions WHERE course_id = $1 AND date = $2`, [req.params.id, date]);
    if (sessions.rows.length === 0) return res.json({ records: [] });
    const sessionIds = sessions.rows.map(s => s.id);
    const records = await pool.query(`SELECT session_id, student_id, status FROM lms_attendance_records WHERE session_id = ANY($1)`, [sessionIds]);
    res.json({ records: records.rows });
  } catch (err) { res.json({ records: [] }); }
});

// ============================================
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.listen(process.env.PORT || 3001, () => console.log('LuxMind LMS running'));