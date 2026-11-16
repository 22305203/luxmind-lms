require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const session = require('express-session');

const app = express();

app.set('trust proxy', 1);
const pool = new Pool({
  user: 'postgres.fclhdbppskmjlmbhtoug',
  password: 'LuxMindAdmin2026',
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
console.log("🔥 ATTEMPTING DB CONNECTION WITH:", process.env.DATABASE_URL || 'HARDCODED_URL_USED');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'luxmind-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,       // Required for HTTPS on Render
    sameSite: 'none',   // Allows cross-site cookies if needed
    httpOnly: true
  }
}));
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// ============================================
// --- i18n: TRANSLATIONS & MIDDLEWARE ---
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
  
  const isTeacher = req.session.user.role === 'teacher' || req.session.user.role === 'advisor';

  try {
    if (isTeacher) {
      // FETCH TEACHER DATA
      const courseRes = await pool.query(`
        SELECT c.id, c.code, c.title, s.group_name, 
               (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count
        FROM courses c
        JOIN course_sections s ON s.course_id = c.id
        WHERE s.teacher_id = $1
      `, [req.session.user.id]);

      const ungradedCount = 14; 
      const pendingMessages = 3;
      const onlineUsers = 5;

      return res.render('lms-teacher-dashboard', { 
        user: req.session.user, 
        courses: courseRes.rows,
        ungradedCount,
        pendingMessages,
        onlineUsers
      });
    } else {
      // FETCH STUDENT DATA
      const courseRes = await pool.query(`
        SELECT c.id, c.code, c.title, u.full_name AS teacher_name
        FROM courses c
        JOIN enrollments e ON e.course_id = c.id
        LEFT JOIN course_sections s ON s.course_id = c.id
        LEFT JOIN users u ON u.id = s.teacher_id
        WHERE e.user_id = $1
      `, [req.session.user.id]);

      // 1. Get the last time the student checked announcements
      const userRes = await pool.query(`SELECT last_announcements_view_at FROM users WHERE id = $1`, [req.session.user.id]);
      const lastView = userRes.rows[0]?.last_announcements_view_at || new Date(0);
      
      // 2. Count announcements created AFTER that time
      const notifRes = await pool.query(`SELECT COUNT(*) FROM lms_announcements WHERE created_at > $1`, [lastView]);
      const unreadCount = parseInt(notifRes.rows[0].count);

      // 3. Fetch announcements for the feed
      const annRes = await pool.query(`
        SELECT a.*, u.full_name AS author_name 
        FROM lms_announcements a
        LEFT JOIN users u ON u.id = a.created_by
        ORDER BY a.created_at DESC
      `);

      return res.render('lms-dashboard', { 
        user: req.session.user, 
        courses: courseRes.rows,
        announcements: annRes.rows,
        onlineUsers: 3,
        unreadCount: unreadCount
      });
    }
  } catch (err) {
    res.status(500).send("Dashboard Error: " + err.message);
  }
});

// COURSE CONTENT PAGE (Multi-tab)
app.get('/course/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const view = req.query.view || 'dashboard';
  const isTeacher = req.session.user.role === 'teacher' || req.session.user.role === 'advisor';
  
  try {
    // 1. Verify access
    let courseCheck;
    if (!isTeacher) {
      courseCheck = await pool.query(
        `SELECT c.id, c.code, c.title, c.credits, u.full_name AS teacher_name FROM courses c 
         JOIN enrollments e ON e.course_id = c.id 
         LEFT JOIN course_sections s ON s.course_id = c.id
         LEFT JOIN users u ON u.id = s.teacher_id
         WHERE c.id = $1 AND e.user_id = $2`,
        [courseId, req.session.user.id]
      );
    } else {
      courseCheck = await pool.query(
        `SELECT c.id, c.code, c.title, c.credits, u.full_name AS teacher_name FROM courses c 
         LEFT JOIN course_sections s ON s.course_id = c.id
         LEFT JOIN users u ON u.id = s.teacher_id
         WHERE c.id = $1 AND s.teacher_id = $2`,
        [courseId, req.session.user.id]
      );
    }

    if (courseCheck.rows.length === 0) return res.send("Access Denied: You do not have permission for this course.");
    const course = courseCheck.rows[0];

    // 2. Fetch data based on the view
    let assignments = [], quizzes = [], grades = [], announcements = [], materials = [], students = [];
    
    if (view === 'dashboard' || view === 'assignments') {
      const r = await pool.query(`SELECT * FROM lms_assignments WHERE course_id = $1 ORDER BY due_date ASC`, [courseId]);
      assignments = r.rows;
    }
    if (view === 'quizzes') {
      const r = await pool.query(`SELECT * FROM lms_quizzes WHERE course_id = $1 ORDER BY due_date ASC`, [courseId]);
      quizzes = r.rows;
    }
    if (view === 'announcements') {
       // IF STUDENT OPENS THE PAGE, CLEAR THE RED BELL
       if (!isTeacher) {
         await pool.query(`UPDATE users SET last_announcements_view_at = NOW() WHERE id = $1`, [req.session.user.id]);
       }
       const r = await pool.query(`SELECT * FROM lms_announcements WHERE course_id = $1 OR course_id IS NULL ORDER BY created_at DESC`, [courseId]);
       announcements = r.rows;
    }
    if (view === 'materials') {
      const m = await pool.query(`SELECT * FROM lms_materials WHERE course_id = $1 ORDER BY week_number ASC, created_at DESC`, [courseId]);
      materials = m.rows;
    }
    if (view === 'students' && isTeacher) {
      const st = await pool.query(`
        SELECT u.id, u.full_name, sp.admission_number, u.email
        FROM enrollments e 
        JOIN users u ON u.id = e.user_id 
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        WHERE e.course_id = $1
      `, [courseId]);
      students = st.rows;
    }
    if (view === 'grades') {
      if (isTeacher) {
        const r = await pool.query(`
          SELECT u.full_name as student_name, a.title, s.grade, a.max_points 
          FROM lms_submissions s
          JOIN lms_assignments a ON a.id = s.assignment_id
          JOIN users u ON u.id = s.student_id
          WHERE a.course_id = $1
        `, [courseId]);
        grades = r.rows;
      } else {
        const r = await pool.query(`
          SELECT a.title, s.grade, a.max_points 
          FROM lms_submissions s
          JOIN lms_assignments a ON a.id = s.assignment_id
          WHERE s.student_id = $1 AND a.course_id = $2
        `, [req.session.user.id, courseId]);
        grades = r.rows;
      }
    }

    res.render('lms-course', { 
      user: req.session.user, 
      isTeacher,
      course: course,
      view: view,
      assignments, quizzes, grades, announcements, materials, students,
      unreadCount: 0 
    });
  } catch (err) {
    res.status(500).send("Course Error: " + err.message);
  }
});

// POST NEW ANNOUNCEMENT (Teacher Only)
app.post('/course/:id/announcements', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const courseId = req.params.id;
  const { title, message } = req.body;

  // Ensure only teachers/advisors can post
  if (req.session.user.role !== 'teacher' && req.session.user.role !== 'advisor') {
    return res.status(403).send("Access Denied.");
  }

  if (!title || !message) {
    return res.redirect(`/course/${courseId}?view=announcements`);
  }

  try {
    await pool.query(`
      INSERT INTO lms_announcements (course_id, title, message, created_by)
      VALUES ($1, $2, $3, $4)
    `, [courseId, title, message, req.session.user.id]);

    res.redirect(`/course/${courseId}?view=announcements`);
  } catch (err) {
    res.status(500).send("Error posting announcement: " + err.message);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/debug-teacher', async (req, res) => {
  if (!req.session.user) return res.send('You are not logged in. Please log in first.');
  
  try {
    const user = req.session.user;
    const allSections = await pool.query(`SELECT id, course_id, teacher_id, group_name FROM course_sections`);
    const mySections = await pool.query(`SELECT * FROM course_sections WHERE teacher_id = $1`, [user.id]);
    
    res.json({ 
      loggedInUser: user,
      allSectionsInDB: allSections.rows,
      mySections: mySections.rows
    });
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

app.listen(process.env.PORT || 3001, () => console.log('LuxMind LMS running'));