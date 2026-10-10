import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAiStatus,
  analyzeSkillsAndCertificates,
  compareOpportunityWithStudent,
  generateAiRoadmap,
  evaluateProjectPitch,
  scanInnovationIdeas,
  generateInterviewQuestions,
  evaluateInterviewSubmission,
} from './aiService.js';
import {
  getChromaStatus,
  ingestKnowledgeToChroma,
  retrieveQuestionsFromChroma,
} from './chromaService.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3001);
const configuredDatabasePath = process.env.DATABASE_PATH || 'skillsetu.db';
const databasePath = path.isAbsolute(configuredDatabasePath) ? configuredDatabasePath : path.join(__dirname, configuredDatabasePath);
const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
const scrypt = promisify(scryptCallback);
const sessionCookie = 'skillsetu_session';
const sessionDuration = 30 * 24 * 60 * 60 * 1000;
const resetDuration = 30 * 60 * 1000;
const frontendUrl = process.env.APP_URL || 'http://localhost:5175';
const authAttempts = new Map();
const configuredCorsOrigins = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:3000,http://127.0.0.1:4173,https://*.netlify.app,https://aindrop-075402.netlify.app,https://melodic-duckanoo-07f7d2.netlify.app,https://*.vercel.app,https://*.onrender.com'
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, '').toLowerCase())
  .filter(Boolean);

if (process.env.APP_URL) {
  const appUrl = process.env.APP_URL.trim().replace(/\/+$/, '').toLowerCase();
  if (!configuredCorsOrigins.includes(appUrl)) {
    configuredCorsOrigins.push(appUrl);
  }
}

const defaultAllowedPatterns = [
  /^https?:\/\/[a-z0-9-]+\.netlify\.app$/,
  /^https?:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https?:\/\/[a-z0-9-]+\.onrender\.com$/,
];

const allowedOriginsSet = new Set(configuredCorsOrigins);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Direct API requests, tools, same-origin, curl, server-to-server
  const cleanOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();

  // 1. Direct configured origin match
  if (allowedOriginsSet.has(cleanOrigin)) return true;

  // 2. Default hosting platforms (Netlify, Vercel, Render)
  if (defaultAllowedPatterns.some((pattern) => pattern.test(cleanOrigin))) {
    return true;
  }

  // 3. In non-production, automatically permit any loopback/localhost dev port or LAN IP
  if (process.env.NODE_ENV !== 'production') {
    // Localhost, 127.0.0.1, [::1] with any port
    if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(cleanOrigin)) {
      return true;
    }
    // Private RFC1918 LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (/^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(cleanOrigin)) {
      return true;
    }
    // Local hostnames (e.g. *.local, *.internal)
    if (/^https?:\/\/[a-z0-9-]+\.(local|internal)(:\d+)?$/.test(cleanOrigin)) {
      return true;
    }
  }

  // 4. Match wildcard subdomains (e.g. https://*.customdomain.com)
  for (const allowed of configuredCorsOrigins) {
    if (allowed.startsWith('*.') || allowed.startsWith('https://*.') || allowed.startsWith('http://*.')) {
      const suffix = allowed.replace(/^https?:\/\/\*\./, '');
      try {
        const originHost = new URL(cleanOrigin).hostname;
        if (originHost.endsWith('.' + suffix) || originHost === suffix) {
          return true;
        }
      } catch {
        // invalid URL
      }
    }
  }

  return false;
};

const mailer = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
}) : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept', 'Origin'],
  })
);

app.use(express.json({ limit: '32kb' }));

app.use((req, res, next) => {
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method) && req.headers.origin) {
    if (!isOriginAllowed(req.headers.origin)) {
      console.warn(`[Security] 403 Forbidden: Request origin "${req.headers.origin}" is not authorized for ${req.method} ${req.path}`);
      return res.status(403).json({ message: 'Request origin is not allowed. Please check your domain configuration.' });
    }
  }
  return next();
});

const hashPassword = async (password) => {
  const salt = randomBytes(16).toString('base64url');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('base64url')}`;
};

const verifyPassword = async (password, storedHash) => {
  const [algorithm, salt, hash] = String(storedHash || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = Buffer.from(await scrypt(password, salt, expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
const safeUser = (user) => ({
  id: user.id,
  name: user.full_name || user.name,
  email: user.email,
  role: user.role,
  college: user.college || '',
  degree: user.degree || '',
  branch: user.branch || '',
  studyYear: user.study_year || '',
  location: user.profile_location || user.location || '',
  bio: user.profile_bio || user.bio || '',
  headline: user.headline || '',
  availability: user.availability || 'Open to collaborate',
  visibility: user.visibility || 'public',
});

const createSession = (userId, remember) => {
  const token = randomBytes(32).toString('base64url');
  const duration = remember ? sessionDuration : 12 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + duration).toISOString();
  db.prepare('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(userId, tokenHash(token), expiresAt);
  return { token, duration };
};

const setSessionCookie = (res, token, remember) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = remember ? `; Max-Age=${Math.floor(sessionDuration / 1000)}` : '';
  res.setHeader('Set-Cookie', `${sessionCookie}=${token}; HttpOnly; SameSite=Lax; Path=/${maxAge}${secure}`);
};

const clearSessionCookie = (res) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
};

const rateLimitAuth = (req, res, next) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const record = authAttempts.get(req.ip) || { count: 0, since: now };
  if (now - record.since > windowMs) {
    record.count = 0;
    record.since = now;
  }
  record.count += 1;
  authAttempts.set(req.ip, record);
  if (record.count > 20) return res.status(429).json({ message: 'Too many attempts. Please try again in 15 minutes.' });
  return next();
};

const requireAuth = (req, res, next) => {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((item) => {
    const separator = item.indexOf('=');
    return [item.slice(0, separator).trim(), decodeURIComponent(item.slice(separator + 1).trim())];
  }));
  const token = cookies[sessionCookie];
  if (!token) return res.status(401).json({ message: 'Please log in to continue.' });

  const session = db.prepare(`
    SELECT s.id AS session_id, s.expires_at, u.id, u.name, u.email, u.role, u.location, u.bio,
      p.full_name, p.college, p.degree, p.branch, p.study_year, p.location AS profile_location,
      p.bio AS profile_bio, p.headline, p.availability, p.visibility
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE s.token_hash = ?
  `).get(tokenHash(token));
  if (!session || Date.parse(session.expires_at) <= Date.now()) {
    if (session) db.prepare('DELETE FROM sessions WHERE id = ?').run(session.session_id);
    clearSessionCookie(res);
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
  req.user = safeUser(session);
  req.sessionId = session.session_id;
  return next();
};

const validateEmail = (email) => typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const splitList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 24);
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 24);
};

const ensureColumn = (table, column, definition) => {
  const columns = db.pragma(`table_info(${table})`).map((item) => item.name);
  if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
};

const compact = (value, maxLength = 500) => String(value || '').trim().slice(0, maxLength);

const getProfileLists = (userId) => {
  const skills = db.prepare(`
    SELECT s.id, s.name, s.type, ss.level, ss.verified, ss.evidence_url
    FROM student_skills ss JOIN skills s ON s.id = ss.skill_id
    WHERE ss.user_id = ? ORDER BY s.name
  `).all(userId);
  const interests = db.prepare(`
    SELECT i.id, i.name
    FROM student_interests si JOIN interests i ON i.id = si.interest_id
    WHERE si.user_id = ? ORDER BY i.name
  `).all(userId);
  return { skills, interests };
};

const replaceNamedJoins = (userId, names, kind, type = 'technical') => {
  const table = kind === 'skill' ? 'skills' : 'interests';
  const joinTable = kind === 'skill' ? 'student_skills' : 'student_interests';
  const idColumn = kind === 'skill' ? 'skill_id' : 'interest_id';
  db.prepare(`DELETE FROM ${joinTable} WHERE user_id = ?`).run(userId);
  for (const rawName of splitList(names)) {
    const name = rawName.slice(0, 80);
    if (kind === 'skill') {
      db.prepare('INSERT OR IGNORE INTO skills (name, type) VALUES (?, ?)').run(name, type);
    } else {
      db.prepare('INSERT OR IGNORE INTO interests (name) VALUES (?)').run(name);
    }
    const item = db.prepare(`SELECT id FROM ${table} WHERE LOWER(name) = LOWER(?)`).get(name);
    if (item) db.prepare(`INSERT OR IGNORE INTO ${joinTable} (user_id, ${idColumn}) VALUES (?, ?)`).run(userId, item.id);
  }
};

const studentSummarySelect = `
  SELECT u.id, u.email, u.role, p.full_name AS name, p.college, p.degree, p.branch,
    p.study_year, p.location, p.headline, p.bio, p.career_goals, p.availability,
    p.visibility, p.avatar_url, p.portfolio_url, p.github_url, p.linkedin_url, p.is_demo,
    p.updated_at,
    (SELECT COUNT(*) FROM projects pr WHERE pr.owner_id = u.id) AS project_count
  FROM users u JOIN profiles p ON p.user_id = u.id
`;

const getStudentProfile = (studentId, viewerId) => {
  const profile = db.prepare(`${studentSummarySelect} WHERE u.id = ?`).get(studentId);
  if (!profile) return null;
  if (profile.visibility !== 'public' && studentId !== viewerId) return null;
  const lists = getProfileLists(studentId);
  const projects = db.prepare(`
    SELECT p.id, p.name, p.description, p.category, p.status, p.match_score, p.owner_id,
      owner_profile.full_name AS owner_name,
      (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) AS application_count
    FROM projects p JOIN profiles owner_profile ON owner_profile.user_id = p.owner_id
    WHERE p.owner_id = ? OR p.id IN (SELECT project_id FROM project_members WHERE user_id = ? AND status = 'active')
    ORDER BY p.updated_at DESC, p.created_at DESC LIMIT 12
  `).all(studentId, studentId);
  const connection = viewerId === studentId ? null : db.prepare(`
    SELECT id, requester_id, recipient_id, status FROM connections
    WHERE (requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?)
    ORDER BY id DESC LIMIT 1
  `).get(viewerId, studentId, studentId, viewerId) || null;
  return { ...profile, ...lists, projects, connection };
};

const findOrCreateDirectConversation = (userId, recipientId) => {
  const existing = db.prepare(`
    SELECT cm.conversation_id AS id
    FROM conversation_members cm
    JOIN conversation_members other ON other.conversation_id = cm.conversation_id
    WHERE cm.user_id = ? AND other.user_id = ?
      AND (SELECT COUNT(*) FROM conversation_members count_members WHERE count_members.conversation_id = cm.conversation_id) = 2
    ORDER BY cm.conversation_id DESC LIMIT 1
  `).get(userId, recipientId);
  if (existing) return existing.id;
  const createConversation = db.transaction(() => {
    const info = db.prepare('INSERT INTO conversations (title, created_by) VALUES (?, ?)').run('', userId);
    const conversationId = Number(info.lastInsertRowid);
    db.prepare('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)').run(conversationId, userId);
    db.prepare('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)').run(conversationId, recipientId);
    return conversationId;
  });
  return createConversation();
};

const requireConversationMember = (conversationId, userId) => {
  return db.prepare('SELECT conversation_id, user_id FROM conversation_members WHERE conversation_id = ? AND user_id = ?').get(conversationId, userId);
};

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'Student',
      location TEXT DEFAULT 'Bengaluru',
      bio TEXT DEFAULT 'Building the future.'
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      full_name TEXT NOT NULL,
      college TEXT DEFAULT '',
      degree TEXT DEFAULT '',
      branch TEXT DEFAULT '',
      study_year TEXT DEFAULT '',
      location TEXT DEFAULT '',
      headline TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      career_goals TEXT DEFAULT '',
      availability TEXT DEFAULT 'Open to collaborate',
      visibility TEXT DEFAULT 'public',
      avatar_url TEXT DEFAULT '',
      portfolio_url TEXT DEFAULT '',
      github_url TEXT DEFAULT '',
      linkedin_url TEXT DEFAULT '',
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'technical',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_skills (
      user_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      level TEXT DEFAULT 'learning',
      verified INTEGER DEFAULT 0,
      evidence_url TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, skill_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_interests (
      user_id INTEGER NOT NULL,
      interest_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, interest_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(interest_id) REFERENCES interests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      match_score INTEGER DEFAULT 92,
      owner_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'Member',
      status TEXT DEFAULT 'active',
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_skills (
      project_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      PRIMARY KEY (project_id, skill_id),
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      status TEXT DEFAULT 'Pending',
      role TEXT DEFAULT 'Developer',
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      assignee TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'In progress',
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      project_id INTEGER,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversation_members (
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      last_read_at TEXT,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, user_id),
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_projects (
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, project_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roadmaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_role TEXT DEFAULT 'Full-stack builder',
      summary TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roadmap_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roadmap_id INTEGER,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'Planned',
      progress INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hackathons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      organizer TEXT DEFAULT '',
      theme TEXT DEFAULT '',
      eligibility TEXT DEFAULT '',
      registration_deadline TEXT,
      event_dates TEXT DEFAULT '',
      official_url TEXT DEFAULT '',
      source TEXT DEFAULT 'user-submitted',
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      feedback TEXT DEFAULT '',
      criteria_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT DEFAULT '',
      entity_id INTEGER,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      topics TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      question_count INTEGER DEFAULT 20,
      mode TEXT DEFAULT 'camera',
      status TEXT DEFAULT 'in_progress',
      current_question_index INTEGER DEFAULT 1,
      overall_score INTEGER DEFAULT 0,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL,
      question_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'conceptual',
      difficulty TEXT DEFAULT 'Medium',
      topic TEXT DEFAULT 'General',
      question_text TEXT NOT NULL,
      code_snippet TEXT DEFAULT '',
      starter_code TEXT DEFAULT '',
      suggested_answer TEXT DEFAULT '',
      explanation TEXT DEFAULT '',
      evaluation_rubric TEXT DEFAULT '',
      expected_concepts TEXT DEFAULT '[]',
      FOREIGN KEY(interview_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      answer_text TEXT DEFAULT '',
      code_content TEXT DEFAULT '',
      status TEXT DEFAULT 'answered',
      time_spent_seconds INTEGER DEFAULT 0,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (interview_id, question_id),
      FOREIGN KEY(interview_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES interview_questions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      overall_score INTEGER NOT NULL,
      technical_score INTEGER DEFAULT 0,
      explanation_score INTEGER DEFAULT 0,
      problem_solving_score INTEGER DEFAULT 0,
      total_questions INTEGER DEFAULT 20,
      answered_questions INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      partial_count INTEGER DEFAULT 0,
      incorrect_count INTEGER DEFAULT 0,
      strengths_json TEXT DEFAULT '[]',
      weaknesses_json TEXT DEFAULT '[]',
      recommendations_json TEXT DEFAULT '[]',
      topic_breakdown_json TEXT DEFAULT '{}',
      question_feedback_json TEXT DEFAULT '[]',
      proctoring_summary_json TEXT DEFAULT '{}',
      evaluated_by TEXT DEFAULT 'NVIDIA API Catalog',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(interview_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      details TEXT DEFAULT '',
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(interview_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  ensureColumn('projects', 'problem', "TEXT DEFAULT ''");
  ensureColumn('projects', 'solution', "TEXT DEFAULT ''");
  ensureColumn('projects', 'difficulty', "TEXT DEFAULT 'Intermediate'");
  ensureColumn('projects', 'commitment', "TEXT DEFAULT '4-6 hours/week'");
  ensureColumn('projects', 'tech_stack', "TEXT DEFAULT ''");
  ensureColumn('projects', 'open_roles', "TEXT DEFAULT ''");
  ensureColumn('projects', 'visibility', "TEXT DEFAULT 'public'");
  ensureColumn('projects', 'updated_at', 'TEXT');
  ensureColumn('applications', 'message', "TEXT DEFAULT ''");
  ensureColumn('applications', 'created_at', 'TEXT');
  ensureColumn('applications', 'updated_at', 'TEXT');
  ensureColumn('messages', 'conversation_id', 'INTEGER');
  ensureColumn('interview_evaluations', 'evaluation_data', "TEXT DEFAULT '{}'");

  const notificationColumns = db.pragma('table_info(notifications)').map((column) => column.name);
  if (!notificationColumns.includes('read_at')) {
    db.exec('ALTER TABLE notifications ADD COLUMN read_at TEXT');
  }
  if (!notificationColumns.includes('related_path')) {
    db.exec("ALTER TABLE notifications ADD COLUMN related_path TEXT DEFAULT ''");
  }

  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS applications_user_project ON applications(user_id, project_id)');
  db.exec('CREATE INDEX IF NOT EXISTS profiles_visibility_idx ON profiles(visibility, updated_at)');
  db.exec('CREATE INDEX IF NOT EXISTS skills_name_idx ON skills(name)');
  db.exec('CREATE INDEX IF NOT EXISTS project_owner_idx ON projects(owner_id, status)');
  db.exec('CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at)');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS connections_pair_idx ON connections(requester_id, recipient_id)');
  db.exec('CREATE VIEW IF NOT EXISTS project_applications AS SELECT * FROM applications');
  db.exec(`
    INSERT OR IGNORE INTO profiles (user_id, full_name, college, degree, branch, study_year, location, bio)
    SELECT id, name, 'SkillSetu Demo College', 'Degree', 'Branch', '3rd year', location, bio FROM users
  `);
  db.exec(`
    INSERT OR IGNORE INTO project_members (project_id, user_id, role, status)
    SELECT id, owner_id, 'Owner', 'active' FROM projects
  `);
};

createTables();

for (const user of db.prepare('SELECT id, password FROM users').all()) {
  if (!String(user.password).startsWith('scrypt$')) {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(await hashPassword(String(user.password)), user.id);
  }
}

const getDashboardData = (userId) => {
  const user = db.prepare(`
    SELECT u.*, p.full_name, p.college, p.degree, p.branch, p.study_year, p.location AS profile_location,
      p.bio AS profile_bio, p.headline, p.availability, p.visibility
    FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?
  `).get(userId);
  const recommendations = db.prepare(`
    SELECT p.*, owner_profile.full_name AS owner_name,
      (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) AS application_count
    FROM projects p JOIN profiles owner_profile ON owner_profile.user_id = p.owner_id
    WHERE p.status = ? ORDER BY p.match_score DESC LIMIT 3
  `).all('Open');
  const tasks = db.prepare(`
    SELECT t.* FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE p.owner_id = ? ORDER BY t.due_date ASC LIMIT 10
  `).all(userId);
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 10').all(userId);
  const applications = db.prepare(`
    SELECT a.id, a.status, a.role, p.name as project_name, p.category
    FROM applications a
    JOIN projects p ON p.id = a.project_id
    WHERE a.user_id = ?
    ORDER BY a.id DESC
  `).all(userId);
  const projectStats = db.prepare('SELECT ROUND(AVG(match_score), 1) AS synergy FROM projects WHERE owner_id = ?').get(userId);
  const health = db.prepare(`
    SELECT
      COUNT(*) AS active_tasks,
      SUM(CASE WHEN t.due_date < DATE('now') THEN 1 ELSE 0 END) AS overdue_tasks
    FROM tasks t JOIN projects p ON p.id = t.project_id
    WHERE p.owner_id = ? AND LOWER(t.status) NOT IN ('done', 'completed')
  `).get(userId);
  const messageStats = db.prepare('SELECT COUNT(*) AS unread FROM messages WHERE recipient_id = ? AND read_at IS NULL').get(userId);
  const notificationStats = db.prepare('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND read_at IS NULL').get(userId);

  return {
    user: user ? safeUser(user) : null,
    metrics: {
      synergy: projectStats.synergy || 0,
      workload: `${health.active_tasks} active`,
      unreadMessages: messageStats.unread,
      unreadNotifications: notificationStats.unread,
      risk: health.overdue_tasks ? 'Elevated' : 'Low',
    },
    recommendations,
    tasks,
    notifications,
    applications,
  };
};

app.get('/api/me', (req, res) => {
  const sessionCookieValue = (req.headers.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
  if (!sessionCookieValue) return res.json({ user: null });
  const session = db.prepare(`
    SELECT s.id AS session_id, s.expires_at, u.id, u.name, u.email, u.role, u.location, u.bio,
      p.full_name, p.college, p.degree, p.branch, p.study_year, p.location AS profile_location,
      p.bio AS profile_bio, p.headline, p.availability, p.visibility
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE s.token_hash = ?
  `).get(tokenHash(decodeURIComponent(sessionCookieValue)));
  if (!session || Date.parse(session.expires_at) <= Date.now()) {
    clearSessionCookie(res);
    return res.json({ user: null });
  }
  return res.json({ user: safeUser(session) });
});

app.post('/api/register', rateLimitAuth, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const college = compact(req.body?.college || req.body?.university || 'Campus', 140);
    const degree = compact(req.body?.degree || 'Degree', 80);
    const branch = compact(req.body?.branch || 'Undeclared', 100);
    const studyYear = compact(req.body?.studyYear || req.body?.year || '1st year', 40);
    const location = compact(req.body?.location || 'Campus', 100);
    const interests = splitList(req.body?.interests);
    const skills = splitList(req.body?.skills);
    if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Enter your full name (2–100 characters).' });
    if (!validateEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be 8–128 characters long.' });
    }

    const passwordHash = await hashPassword(password);
    const createAccount = db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO users (name, email, password, role, location, bio)
        VALUES (?, ?, ?, 'Student', ?, 'New member ready to build.')
      `);
      const result = insert.run(name, email, passwordHash, location);
      const userId = Number(result.lastInsertRowid);
      db.prepare(`
        INSERT INTO profiles (user_id, full_name, college, degree, branch, study_year, location, headline, bio, career_goals, availability, visibility)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public')
      `).run(
        userId,
        name,
        college,
        degree,
        branch,
        studyYear,
        location,
        `Student builder at ${college}`,
        'New SkillSetu member ready to collaborate.',
        compact(req.body?.careerGoals || 'Build practical projects and join strong teams.', 500),
        compact(req.body?.availability || 'Open to collaborate', 80),
      );
      replaceNamedJoins(userId, skills.length ? skills : ['Collaboration'], 'skill');
      replaceNamedJoins(userId, interests.length ? interests : ['Hackathons'], 'interest');
      return userId;
    });
    const userId = createAccount();
    const user = db.prepare(`
      SELECT u.*, p.full_name, p.college, p.degree, p.branch, p.study_year, p.location AS profile_location,
        p.bio AS profile_bio, p.headline, p.availability, p.visibility
      FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = ?
    `).get(userId);
    return res.status(201).json({ message: 'Account created. Sign in to continue.', user: safeUser(user) });
  } catch (error) {
    if (String(error.code || '').startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ message: 'An account with that email already exists.' });
    return next(error);
  }
});

app.post('/api/login', rateLimitAuth, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!validateEmail(email) || typeof password !== 'string' || !password.length) {
      return res.status(400).json({ message: 'Enter your email address and password.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    const remember = Boolean(req.body?.remember);
    const session = createSession(user.id, remember);
    setSessionCookie(res, session.token, remember);
    const responseUser = db.prepare(`
      SELECT u.*, p.full_name, p.college, p.degree, p.branch, p.study_year, p.location AS profile_location,
        p.bio AS profile_bio, p.headline, p.availability, p.visibility
      FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?
    `).get(user.id);
    return res.json({ user: safeUser(responseUser || user), message: 'Welcome back.' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
  clearSessionCookie(res);
  return res.json({ message: 'You have been logged out.' });
});

app.post('/api/forgot-password', rateLimitAuth, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!validateEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (process.env.NODE_ENV === 'production' && !mailer) {
      return res.status(503).json({ message: 'Password reset email is not configured. Please contact support.' });
    }
    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
    let developmentResetUrl;

    if (user) {
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + resetDuration).toISOString();
      db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
      db.prepare('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(user.id, tokenHash(token), expiresAt);
      const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

      if (mailer) {
        await mailer.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Reset your SkillSetu AI password',
          text: `Use this link within 30 minutes to reset your password: ${resetUrl}`,
        });
      } else if (process.env.NODE_ENV !== 'production') {
        developmentResetUrl = resetUrl;
      }
    }

    const payload = { message: 'If an account exists for that email, password reset instructions have been sent.' };
    if (developmentResetUrl) payload.developmentResetUrl = developmentResetUrl;
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/reset-password', rateLimitAuth, async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || token.length < 32) return res.status(400).json({ message: 'This reset link is invalid or expired.' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be 8–128 characters long.' });
    }
    const reset = db.prepare('SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ?').get(tokenHash(token), new Date().toISOString());
    if (!reset) return res.status(400).json({ message: 'This reset link is invalid or expired.' });
    const passwordHash = await hashPassword(password);
    const update = db.transaction(() => {
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(passwordHash, reset.user_id);
      db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(reset.user_id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(reset.user_id);
    });
    update();
    return res.json({ message: 'Password updated. Sign in with your new password.' });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/dashboard', requireAuth, (req, res) => res.json(getDashboardData(req.user.id)));

app.get('/api/profile', requireAuth, (req, res) => {
  const profile = getStudentProfile(req.user.id, req.user.id);
  return res.json({ profile });
});

app.patch('/api/profile', requireAuth, (req, res) => {
  const name = compact(req.body?.name || req.body?.fullName || req.user.name, 100);
  const role = compact(req.body?.role || 'Student', 80);
  const location = compact(req.body?.location || '', 100);
  const bio = compact(req.body?.bio || '', 1000);
  const college = compact(req.body?.college || req.user.college || '', 140);
  const degree = compact(req.body?.degree || req.user.degree || '', 80);
  const branch = compact(req.body?.branch || req.user.branch || '', 100);
  const studyYear = compact(req.body?.studyYear || req.body?.study_year || req.user.studyYear || '', 40);
  const headline = compact(req.body?.headline || '', 160);
  const careerGoals = compact(req.body?.careerGoals || req.body?.career_goals || '', 700);
  const availability = compact(req.body?.availability || 'Open to collaborate', 80);
  const visibility = ['public', 'private'].includes(req.body?.visibility) ? req.body.visibility : 'public';
  const avatarUrl = compact(req.body?.avatarUrl || req.body?.avatar_url || '', 500);
  const portfolioUrl = compact(req.body?.portfolioUrl || req.body?.portfolio_url || '', 500);
  const githubUrl = compact(req.body?.githubUrl || req.body?.github_url || '', 500);
  const linkedinUrl = compact(req.body?.linkedinUrl || req.body?.linkedin_url || '', 500);
  if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Name must be 2–100 characters.' });
  const updateProfile = db.transaction(() => {
    db.prepare('UPDATE users SET name = ?, role = ?, location = ?, bio = ? WHERE id = ?').run(name, role, location, bio, req.user.id);
    db.prepare(`
      INSERT INTO profiles (user_id, full_name, college, degree, branch, study_year, location, headline, bio, career_goals, availability, visibility, avatar_url, portfolio_url, github_url, linkedin_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        full_name = excluded.full_name,
        college = excluded.college,
        degree = excluded.degree,
        branch = excluded.branch,
        study_year = excluded.study_year,
        location = excluded.location,
        headline = excluded.headline,
        bio = excluded.bio,
        career_goals = excluded.career_goals,
        availability = excluded.availability,
        visibility = excluded.visibility,
        avatar_url = excluded.avatar_url,
        portfolio_url = excluded.portfolio_url,
        github_url = excluded.github_url,
        linkedin_url = excluded.linkedin_url,
        updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, name, college, degree, branch, studyYear, location, headline, bio, careerGoals, availability, visibility, avatarUrl, portfolioUrl, githubUrl, linkedinUrl);
    if ('skills' in req.body) replaceNamedJoins(req.user.id, req.body.skills, 'skill');
    if ('interests' in req.body) replaceNamedJoins(req.user.id, req.body.interests, 'interest');
  });
  updateProfile();
  const user = db.prepare(`
    SELECT u.*, p.full_name, p.college, p.degree, p.branch, p.study_year, p.location AS profile_location,
      p.bio AS profile_bio, p.headline, p.availability, p.visibility, p.avatar_url, p.portfolio_url, p.github_url, p.linkedin_url
    FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = ?
  `).get(req.user.id);
  db.prepare('INSERT INTO audit_events (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)').run(req.user.id, 'profile.update', 'profile', req.user.id);
  return res.json({ user: safeUser(user), profile: getStudentProfile(req.user.id, req.user.id) });
});

app.get('/api/students', requireAuth, (req, res) => {
  const query = compact(req.query.q, 100);
  const skill = compact(req.query.skill, 80);
  const college = compact(req.query.college, 140);
  const branch = compact(req.query.branch, 100);
  const year = compact(req.query.year, 40);
  const location = compact(req.query.location, 100);
  const availability = compact(req.query.availability, 80);
  const sort = req.query.sort === 'recent' ? 'p.updated_at DESC' : 'p.full_name ASC';
  const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 24));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const likeQuery = `%${query}%`;
  const students = db.prepare(`
    ${studentSummarySelect}
    WHERE u.id != ? AND p.visibility = 'public'
      AND (? = '' OR p.full_name LIKE ? OR p.college LIKE ? OR p.branch LIKE ? OR p.bio LIKE ? OR p.career_goals LIKE ?
        OR EXISTS (
          SELECT 1 FROM student_skills ss JOIN skills s ON s.id = ss.skill_id
          WHERE ss.user_id = u.id AND s.name LIKE ?
        )
        OR EXISTS (
          SELECT 1 FROM student_interests si JOIN interests i ON i.id = si.interest_id
          WHERE si.user_id = u.id AND i.name LIKE ?
        )
      )
      AND (? = '' OR p.college LIKE ?)
      AND (? = '' OR p.branch LIKE ?)
      AND (? = '' OR p.study_year = ?)
      AND (? = '' OR p.location LIKE ?)
      AND (? = '' OR p.availability LIKE ?)
      AND (? = '' OR EXISTS (
        SELECT 1 FROM student_skills ss JOIN skills s ON s.id = ss.skill_id
        WHERE ss.user_id = u.id AND LOWER(s.name) = LOWER(?)
      ))
    ORDER BY ${sort} LIMIT ? OFFSET ?
  `).all(
    req.user.id,
    query, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery,
    college, `%${college}%`,
    branch, `%${branch}%`,
    year, year,
    location, `%${location}%`,
    availability, `%${availability}%`,
    skill, skill,
    limit, offset,
  ).map((student) => ({ ...student, ...getProfileLists(student.id) }));
  return res.json({ students });
});

app.get('/api/students/:id', requireAuth, (req, res) => {
  const student = getStudentProfile(Number(req.params.id), req.user.id);
  if (!student) return res.status(404).json({ message: 'Student profile not found or private.' });
  return res.json({ student });
});

app.get('/api/matches', requireAuth, (req, res) => {
  const current = getProfileLists(req.user.id);
  const currentSkills = new Set(current.skills.map((skill) => skill.name.toLowerCase()));
  const currentInterests = new Set(current.interests.map((interest) => interest.name.toLowerCase()));
  const students = db.prepare(`${studentSummarySelect} WHERE u.id != ? AND p.visibility = 'public' ORDER BY p.updated_at DESC LIMIT 100`).all(req.user.id);
  const matches = students.map((student) => {
    const lists = getProfileLists(student.id);
    const sharedSkills = lists.skills.filter((skill) => currentSkills.has(skill.name.toLowerCase())).map((skill) => skill.name);
    const sharedInterests = lists.interests.filter((interest) => currentInterests.has(interest.name.toLowerCase())).map((interest) => interest.name);
    const complementarySkills = lists.skills.filter((skill) => !currentSkills.has(skill.name.toLowerCase())).slice(0, 5).map((skill) => skill.name);
    const score = Math.min(96, 38 + sharedSkills.length * 14 + sharedInterests.length * 10 + complementarySkills.length * 5 + (student.availability ? 6 : 0));
    const reasons = [];
    if (sharedSkills.length) reasons.push(`Shared skills: ${sharedSkills.slice(0, 3).join(', ')}`);
    if (sharedInterests.length) reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
    if (complementarySkills.length) reasons.push(`Can add ${complementarySkills.slice(0, 3).join(', ')}`);
    if (!reasons.length) reasons.push('Profile is public and available for cross-college collaboration');
    return { ...student, skills: lists.skills, interests: lists.interests, score, sharedSkills, complementarySkills, reasons };
  }).sort((a, b) => b.score - a.score).slice(0, 24);
  return res.json({
    matches,
    formula: 'Baseline score = 38 + shared skills * 14 + shared interests * 10 + complementary skills * 5 + availability bonus. It is a transparent heuristic, not a scientific prediction.',
  });
});

app.post('/api/connections', requireAuth, (req, res) => {
  const targetUserId = Number(req.body?.targetUserId);
  const action = compact(req.body?.action || 'connect', 20);
  if (!Number.isInteger(targetUserId) || targetUserId === req.user.id) return res.status(400).json({ message: 'Choose another student.' });
  const target = getStudentProfile(targetUserId, req.user.id);
  if (!target) return res.status(404).json({ message: 'Student profile not found.' });
  const existing = db.prepare(`
    SELECT * FROM connections
    WHERE (requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?)
    ORDER BY id DESC LIMIT 1
  `).get(req.user.id, targetUserId, targetUserId, req.user.id);

  if (action === 'connect') {
    if (existing) return res.json({ connection: existing, message: 'Connection already exists.' });
    const info = db.prepare('INSERT INTO connections (requester_id, recipient_id, status) VALUES (?, ?, ?)').run(req.user.id, targetUserId, 'pending');
    db.prepare('INSERT INTO notifications (user_id, message, type, related_path) VALUES (?, ?, ?, ?)').run(targetUserId, `${req.user.name} sent you a connection request.`, 'connection', `/students/${req.user.id}`);
    return res.status(201).json({ connection: db.prepare('SELECT * FROM connections WHERE id = ?').get(info.lastInsertRowid) });
  }

  if (!existing) return res.status(404).json({ message: 'Connection request not found.' });
  if (action === 'accept' || action === 'reject') {
    if (existing.recipient_id !== req.user.id) return res.status(403).json({ message: 'Only the recipient can respond to this request.' });
    const status = action === 'accept' ? 'accepted' : 'rejected';
    db.prepare('UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, existing.id);
    db.prepare('INSERT INTO notifications (user_id, message, type, related_path) VALUES (?, ?, ?, ?)').run(existing.requester_id, `${req.user.name} ${status} your connection request.`, 'connection', `/students/${req.user.id}`);
    return res.json({ connection: db.prepare('SELECT * FROM connections WHERE id = ?').get(existing.id) });
  }
  if (action === 'cancel') {
    if (existing.requester_id !== req.user.id) return res.status(403).json({ message: 'Only the requester can cancel this request.' });
    db.prepare('UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', existing.id);
    return res.json({ connection: db.prepare('SELECT * FROM connections WHERE id = ?').get(existing.id) });
  }
  return res.status(400).json({ message: 'Unsupported connection action.' });
});

app.get('/api/projects', requireAuth, (req, res) => {
  const query = String(req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const sort = ['match_score', 'created_at', 'name'].includes(req.query.sort) ? req.query.sort : 'match_score';
  const direction = req.query.direction === 'asc' ? 'ASC' : 'DESC';
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const projects = db.prepare(`
    SELECT p.*, owner_profile.full_name AS owner_name,
      (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) AS application_count,
      (SELECT a.status FROM applications a WHERE a.project_id = p.id AND a.user_id = ?) AS my_application_status
    FROM projects p JOIN profiles owner_profile ON owner_profile.user_id = p.owner_id
    WHERE (? = '' OR p.name LIKE ? OR p.description LIKE ? OR p.tech_stack LIKE ? OR p.open_roles LIKE ?)
      AND (? = '' OR LOWER(p.category) = LOWER(?))
    ORDER BY ${sort} ${direction} LIMIT ? OFFSET ?
  `).all(req.user.id, query, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, category, category, limit, offset);
  return res.json({ projects });
});

app.get('/api/categories', requireAuth, (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM projects ORDER BY category').all().map((row) => row.category);
  return res.json({ categories });
});

app.get('/api/projects/:id', requireAuth, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, owner_profile.full_name AS owner_name,
      (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) AS application_count
    FROM projects p JOIN profiles owner_profile ON owner_profile.user_id = p.owner_id WHERE p.id = ?
  `).get(Number(req.params.id));
  if (!project) return res.status(404).json({ message: 'Project not found.' });
  const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY due_date').all(project.id);
  const application = db.prepare('SELECT id, status, role FROM applications WHERE project_id = ? AND user_id = ?').get(project.id, req.user.id);
  const members = db.prepare(`
    SELECT pm.role, pm.status, pm.joined_at, p.user_id AS id, p.full_name AS name, p.college, p.branch
    FROM project_members pm JOIN profiles p ON p.user_id = pm.user_id
    WHERE pm.project_id = ? ORDER BY pm.joined_at
  `).all(project.id);
  const skills = db.prepare(`
    SELECT s.id, s.name, s.type FROM project_skills ps JOIN skills s ON s.id = ps.skill_id
    WHERE ps.project_id = ? ORDER BY s.name
  `).all(project.id);
  return res.json({ project, tasks, members, skills, application: application || null });
});

app.post('/api/projects', requireAuth, (req, res) => {
  const name = String(req.body?.name || '').trim();
  const description = String(req.body?.description || '').trim();
  const category = String(req.body?.category || '').trim();
  const problem = compact(req.body?.problem || description, 800);
  const solution = compact(req.body?.solution || '', 800);
  const difficulty = compact(req.body?.difficulty || 'Intermediate', 40);
  const commitment = compact(req.body?.commitment || '4-6 hours/week', 80);
  const techStack = compact(req.body?.techStack || req.body?.tech_stack || '', 300);
  const openRoles = compact(req.body?.openRoles || req.body?.open_roles || 'Contributor', 300);
  const requiredSkills = splitList(req.body?.requiredSkills || req.body?.skills || techStack);
  if (name.length < 3 || name.length > 120 || description.length < 10 || description.length > 2000 || category.length < 2 || category.length > 60) {
    return res.status(400).json({ message: 'Provide a project name, category, and description (at least 10 characters).' });
  }
  const ownSkills = new Set(getProfileLists(req.user.id).skills.map((skill) => skill.name.toLowerCase()));
  const sharedSkillCount = requiredSkills.filter((skill) => ownSkills.has(skill.toLowerCase())).length;
  const matchScore = Math.min(98, 68 + sharedSkillCount * 8 + Math.min(requiredSkills.length, 5) * 2);
  const createProject = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO projects (name, description, category, status, match_score, owner_id, problem, solution, difficulty, commitment, tech_stack, open_roles, visibility, updated_at)
      VALUES (?, ?, ?, 'Open', ?, ?, ?, ?, ?, ?, ?, ?, 'public', CURRENT_TIMESTAMP)
    `).run(name, description, category, matchScore, req.user.id, problem, solution, difficulty, commitment, techStack, openRoles);
    const projectId = Number(info.lastInsertRowid);
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role, status) VALUES (?, ?, ?, ?)').run(projectId, req.user.id, 'Owner', 'active');
    for (const skillName of requiredSkills) {
      db.prepare('INSERT OR IGNORE INTO skills (name, type) VALUES (?, ?)').run(skillName, 'technical');
      const skill = db.prepare('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)').get(skillName);
      if (skill) db.prepare('INSERT OR IGNORE INTO project_skills (project_id, skill_id) VALUES (?, ?)').run(projectId, skill.id);
    }
    db.prepare('INSERT INTO audit_events (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)').run(req.user.id, 'project.create', 'project', projectId);
    return projectId;
  });
  const projectId = createProject();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  return res.status(201).json({ project, message: 'Project created successfully.' });
});

app.patch('/api/projects/:id', requireAuth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(Number(req.params.id), req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found or you do not own it.' });
  const name = String(req.body?.name ?? project.name).trim();
  const description = String(req.body?.description ?? project.description).trim();
  const category = String(req.body?.category ?? project.category).trim();
  const status = String(req.body?.status ?? project.status).trim();
  const problem = compact(req.body?.problem ?? project.problem, 800);
  const solution = compact(req.body?.solution ?? project.solution, 800);
  const difficulty = compact(req.body?.difficulty ?? project.difficulty, 40);
  const commitment = compact(req.body?.commitment ?? project.commitment, 80);
  const techStack = compact(req.body?.techStack ?? req.body?.tech_stack ?? project.tech_stack, 300);
  const openRoles = compact(req.body?.openRoles ?? req.body?.open_roles ?? project.open_roles, 300);
  if (name.length < 3 || name.length > 120 || description.length < 10 || description.length > 2000 || category.length < 2 || !['Open', 'In Review', 'Closed'].includes(status)) {
    return res.status(400).json({ message: 'Project details are invalid.' });
  }
  db.prepare(`
    UPDATE projects SET name = ?, description = ?, category = ?, status = ?, problem = ?, solution = ?,
      difficulty = ?, commitment = ?, tech_stack = ?, open_roles = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, category, status, problem, solution, difficulty, commitment, techStack, openRoles, project.id);
  if ('requiredSkills' in req.body || 'skills' in req.body) {
    db.prepare('DELETE FROM project_skills WHERE project_id = ?').run(project.id);
    for (const skillName of splitList(req.body?.requiredSkills || req.body?.skills)) {
      db.prepare('INSERT OR IGNORE INTO skills (name, type) VALUES (?, ?)').run(skillName, 'technical');
      const skill = db.prepare('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)').get(skillName);
      if (skill) db.prepare('INSERT OR IGNORE INTO project_skills (project_id, skill_id) VALUES (?, ?)').run(project.id, skill.id);
    }
  }
  return res.json({ project: db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id) });
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(Number(req.params.id), req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found or you do not own it.' });
  const remove = db.transaction(() => {
    db.prepare('DELETE FROM tasks WHERE project_id = ?').run(project.id);
    db.prepare('DELETE FROM applications WHERE project_id = ?').run(project.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
  });
  remove();
  return res.json({ message: 'Project deleted.' });
});

app.post('/api/projects/:id/apply', requireAuth, (req, res) => {
  const project = db.prepare('SELECT id, owner_id, status FROM projects WHERE id = ?').get(Number(req.params.id));
  if (!project || project.status !== 'Open') return res.status(404).json({ message: 'This project is not accepting applications.' });
  if (project.owner_id === req.user.id) return res.status(400).json({ message: 'You cannot apply to your own project.' });
  const role = String(req.body?.role || 'Contributor').trim().slice(0, 80);
  const message = compact(req.body?.message || 'I would like to contribute to this project.', 1000);
  try {
    const application = db.prepare(`
      INSERT INTO applications (user_id, project_id, status, role, message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(req.user.id, project.id, 'Pending', role, message);
    db.prepare('INSERT INTO notifications (user_id, message, type, related_path) VALUES (?, ?, ?, ?)').run(project.owner_id, `${req.user.name} applied to your project.`, 'application', '/applications');
    return res.status(201).json({ application: { id: application.lastInsertRowid, status: 'Pending', role }, message: 'Application submitted.' });
  } catch (error) {
    if (String(error.code || '').startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ message: 'You have already applied to this project.' });
    return res.status(500).json({ message: 'Unable to submit application.' });
  }
});

app.get('/api/applications', requireAuth, (req, res) => {
  const applications = db.prepare(`
    SELECT a.id, a.status, a.role, a.message, a.created_at, a.project_id,
      p.name AS project_name, p.category, p.owner_id, applicant.full_name AS applicant_name
    FROM applications a JOIN projects p ON p.id = a.project_id JOIN profiles applicant ON applicant.user_id = a.user_id
    WHERE a.user_id = ? OR p.owner_id = ? ORDER BY a.id DESC
  `).all(req.user.id, req.user.id);
  return res.json({ applications });
});

app.patch('/api/applications/:id', requireAuth, (req, res) => {
  const application = db.prepare(`
    SELECT a.*, p.owner_id FROM applications a JOIN projects p ON p.id = a.project_id WHERE a.id = ?
  `).get(Number(req.params.id));
  if (!application || (application.user_id !== req.user.id && application.owner_id !== req.user.id)) {
    return res.status(404).json({ message: 'Application not found.' });
  }
  const status = String(req.body?.status || '');
  const isOwner = application.owner_id === req.user.id;
  const allowed = isOwner ? ['Accepted', 'Rejected'] : ['Withdrawn'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'That application action is not allowed.' });
  const updateApplication = db.transaction(() => {
    db.prepare('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, application.id);
    if (status === 'Accepted') {
      db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role, status) VALUES (?, ?, ?, ?)').run(application.project_id, application.user_id, application.role, 'active');
    }
  });
  updateApplication();
  db.prepare('INSERT INTO notifications (user_id, message, type, related_path) VALUES (?, ?, ?, ?)').run(
    isOwner ? application.user_id : application.owner_id,
    isOwner ? `Your application was ${status.toLowerCase()}.` : 'An application was withdrawn.',
    'application',
    '/applications',
  );
  return res.json({ application: { ...application, status } });
});

app.get('/api/tasks', requireAuth, (req, res) => {
  const tasks = db.prepare(`SELECT t.* FROM tasks t JOIN projects p ON p.id = t.project_id WHERE p.owner_id = ? ORDER BY t.due_date`).all(req.user.id);
  return res.json({ tasks });
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const projectId = Number(req.body?.projectId);
  const title = String(req.body?.title || '').trim();
  const dueDate = String(req.body?.dueDate || '');
  const assignee = String(req.body?.assignee || req.user.name).trim();
  if (!Number.isInteger(projectId) || title.length < 2 || title.length > 200 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return res.status(400).json({ message: 'Enter a task title and valid due date.' });
  }
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(projectId, req.user.id);
  if (!project) return res.status(403).json({ message: 'You can only add tasks to your own projects.' });
  const info = db.prepare('INSERT INTO tasks (project_id, title, assignee, due_date, status) VALUES (?, ?, ?, ?, ?)').run(projectId, title, assignee, dueDate, 'Planned');
  return res.status(201).json({ task: db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid) });
});

app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const task = db.prepare('SELECT t.* FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ? AND p.owner_id = ?').get(Number(req.params.id), req.user.id);
  if (!task) return res.status(404).json({ message: 'Task not found or you do not own it.' });
  const status = String(req.body?.status ?? task.status).trim();
  const title = String(req.body?.title ?? task.title).trim();
  const dueDate = String(req.body?.dueDate ?? task.due_date);
  if (!['Planned', 'In progress', 'Review', 'Done'].includes(status) || title.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return res.status(400).json({ message: 'Task details are invalid.' });
  }
  db.prepare('UPDATE tasks SET title = ?, due_date = ?, status = ? WHERE id = ?').run(title, dueDate, status, task.id);
  return res.json({ task: db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id) });
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const task = db.prepare('SELECT t.id FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ? AND p.owner_id = ?').get(Number(req.params.id), req.user.id);
  if (!task) return res.status(404).json({ message: 'Task not found or you do not own it.' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  return res.json({ message: 'Task deleted.' });
});

app.get('/api/notifications', requireAuth, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.user.id);
  db.prepare('UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = ?').run(req.user.id);
  return res.json({ notifications });
});

app.post('/api/notifications/mark-all-read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = ?').run(req.user.id);
  return res.json({ message: 'Notifications marked as read.' });
});

app.get('/api/conversations', requireAuth, (req, res) => {
  const conversations = db.prepare(`
    SELECT c.id, c.title, c.project_id, c.updated_at,
      p.name AS project_name,
      (
        SELECT group_concat(profile.full_name, ', ')
        FROM conversation_members cm JOIN profiles profile ON profile.user_id = cm.user_id
        WHERE cm.conversation_id = c.id AND cm.user_id != ?
      ) AS participant_names,
      (
        SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1
      ) AS last_message,
      (
        SELECT COUNT(*) FROM messages m
        WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.read_at IS NULL
      ) AS unread_count
    FROM conversations c
    JOIN conversation_members mine ON mine.conversation_id = c.id AND mine.user_id = ?
    LEFT JOIN projects p ON p.id = c.project_id
    ORDER BY c.updated_at DESC, c.id DESC
  `).all(req.user.id, req.user.id, req.user.id);
  return res.json({ conversations });
});

app.post('/api/conversations', requireAuth, (req, res) => {
  const recipientId = Number(req.body?.recipientId);
  if (!Number.isInteger(recipientId) || recipientId === req.user.id) return res.status(400).json({ message: 'Choose another student.' });
  if (!db.prepare('SELECT id FROM users WHERE id = ?').get(recipientId)) return res.status(404).json({ message: 'Recipient not found.' });
  const conversationId = findOrCreateDirectConversation(req.user.id, recipientId);
  return res.status(201).json({ conversation: db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId) });
});

app.get('/api/conversations/:id/messages', requireAuth, (req, res) => {
  const conversationId = Number(req.params.id);
  if (!requireConversationMember(conversationId, req.user.id)) return res.status(404).json({ message: 'Conversation not found.' });
  const messages = db.prepare(`
    SELECT m.*, sender.full_name AS sender_name, recipient.full_name AS recipient_name
    FROM messages m
    JOIN profiles sender ON sender.user_id = m.sender_id
    JOIN profiles recipient ON recipient.user_id = m.recipient_id
    WHERE m.conversation_id = ? ORDER BY m.id ASC LIMIT 300
  `).all(conversationId);
  db.prepare('UPDATE messages SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE conversation_id = ? AND recipient_id = ?').run(conversationId, req.user.id);
  db.prepare('UPDATE conversation_members SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?').run(conversationId, req.user.id);
  return res.json({ messages });
});

app.post('/api/conversations/:id/messages', requireAuth, (req, res) => {
  const conversationId = Number(req.params.id);
  if (!requireConversationMember(conversationId, req.user.id)) return res.status(404).json({ message: 'Conversation not found.' });
  const body = compact(req.body?.body, 4000);
  if (!body) return res.status(400).json({ message: 'Enter a message.' });
  const recipients = db.prepare('SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id != ?').all(conversationId, req.user.id);
  if (!recipients.length) return res.status(400).json({ message: 'Conversation has no recipient.' });
  const recipientId = recipients[0].user_id;
  const insertMessage = db.transaction(() => {
    const info = db.prepare('INSERT INTO messages (conversation_id, sender_id, recipient_id, body) VALUES (?, ?, ?, ?)').run(conversationId, req.user.id, recipientId, body);
    db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
    for (const recipient of recipients) {
      db.prepare('INSERT INTO notifications (user_id, message, type, related_path) VALUES (?, ?, ?, ?)').run(recipient.user_id, `New message from ${req.user.name}.`, 'message', `/messages/${conversationId}`);
    }
    return Number(info.lastInsertRowid);
  });
  const messageId = insertMessage();
  const message = db.prepare(`
    SELECT m.*, sender.full_name AS sender_name, recipient.full_name AS recipient_name
    FROM messages m JOIN profiles sender ON sender.user_id = m.sender_id JOIN profiles recipient ON recipient.user_id = m.recipient_id
    WHERE m.id = ?
  `).get(messageId);
  return res.status(201).json({ message });
});

app.get('/api/messages/people', requireAuth, (req, res) => {
  const people = db.prepare('SELECT u.id, p.full_name AS name, u.role FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id != ? AND p.visibility = ? ORDER BY p.full_name LIMIT 100').all(req.user.id, 'public');
  return res.json({ people });
});

app.get('/api/messages', requireAuth, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, sender.name AS sender_name, recipient.name AS recipient_name
    FROM messages m JOIN users sender ON sender.id = m.sender_id JOIN users recipient ON recipient.id = m.recipient_id
    WHERE m.sender_id = ? OR m.recipient_id = ? ORDER BY m.id ASC LIMIT 200
  `).all(req.user.id, req.user.id);
  db.prepare('UPDATE messages SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE recipient_id = ?').run(req.user.id);
  return res.json({ messages });
});

app.post('/api/messages', requireAuth, (req, res) => {
  const recipientId = Number(req.body?.recipientId);
  const body = String(req.body?.body || '').trim();
  if (!Number.isInteger(recipientId) || recipientId === req.user.id || body.length < 1 || body.length > 4000) {
    return res.status(400).json({ message: 'Choose a recipient and enter a message (up to 4,000 characters).' });
  }
  if (!db.prepare('SELECT id FROM users WHERE id = ?').get(recipientId)) return res.status(404).json({ message: 'Recipient not found.' });
  const conversationId = findOrCreateDirectConversation(req.user.id, recipientId);
  const info = db.prepare('INSERT INTO messages (conversation_id, sender_id, recipient_id, body) VALUES (?, ?, ?, ?)').run(conversationId, req.user.id, recipientId, body);
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);
  db.prepare('INSERT INTO notifications (user_id, message, type, related_path) VALUES (?, ?, ?, ?)').run(recipientId, `New message from ${req.user.name}.`, 'message', `/messages/${conversationId}`);
  return res.status(201).json({ message: db.prepare(`
    SELECT m.*, sender.name AS sender_name, recipient.name AS recipient_name
    FROM messages m JOIN users sender ON sender.id = m.sender_id JOIN users recipient ON recipient.id = m.recipient_id WHERE m.id = ?
  `).get(info.lastInsertRowid) });
});
app.get('/api/hackathons', (req, res) => {
  const hackathons = db.prepare('SELECT * FROM hackathons ORDER BY registration_deadline ASC, id ASC').all();
  return res.json({ hackathons });
});

app.post('/api/hackathons', requireAuth, (req, res) => {
  const title = compact(req.body?.title, 150);
  const organizer = compact(req.body?.organizer, 100);
  const theme = compact(req.body?.theme, 100);
  const eligibility = compact(req.body?.eligibility, 100);
  const registrationDeadline = compact(req.body?.registrationDeadline || req.body?.registration_deadline, 30);
  const eventDates = compact(req.body?.eventDates || req.body?.event_dates, 60);
  const officialUrl = compact(req.body?.officialUrl || req.body?.official_url, 300);
  if (!title) return res.status(400).json({ message: 'Title is required.' });
  const info = db.prepare(`
    INSERT INTO hackathons (title, organizer, theme, eligibility, registration_deadline, event_dates, official_url, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'user-submitted')
  `).run(title, organizer, theme, eligibility, registrationDeadline, eventDates, officialUrl);
  return res.status(201).json({ hackathon: db.prepare('SELECT * FROM hackathons WHERE id = ?').get(info.lastInsertRowid) });
});

app.post('/api/projects/:id/invite', requireAuth, (req, res) => {
  const projectId = Number(req.params.id);
  const targetUserId = Number(req.body?.targetUserId);
  const role = compact(req.body?.role || 'Teammate', 80);
  if (!Number.isInteger(targetUserId) || targetUserId === req.user.id) {
    return res.status(400).json({ message: 'Choose another student.' });
  }
  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?').get(projectId, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found or you do not own it.' });
  const targetUser = db.prepare('SELECT id, name FROM users WHERE id = ?').get(targetUserId);
  if (!targetUser) return res.status(404).json({ message: 'Student not found.' });
  
  db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role, status) VALUES (?, ?, ?, ?)').run(projectId, targetUserId, role, 'invited');
  db.prepare('INSERT INTO notifications (user_id, message, type, related_path) VALUES (?, ?, ?, ?)').run(
    targetUserId,
    `${req.user.name} invited you to join "${project.name}" as ${role}.`,
    'project',
    `/projects/${projectId}`
  );
  return res.status(200).json({ message: `Invitation sent to ${targetUser.name}.` });
});

app.get('/api/roadmaps', requireAuth, (req, res) => {
  const roadmap = db.prepare('SELECT * FROM roadmaps WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
  const milestones = db.prepare('SELECT * FROM roadmap_milestones WHERE user_id = ? ORDER BY due_date ASC, id ASC').all(req.user.id);
  return res.json({ roadmap: roadmap || null, milestones });
});

app.post('/api/roadmaps', requireAuth, (req, res) => {
  const targetRole = compact(req.body?.targetRole || 'Full-stack builder', 100);
  const summary = compact(req.body?.summary || '', 800);
  const info = db.prepare(`
    INSERT INTO roadmaps (user_id, target_role, summary, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(req.user.id, targetRole, summary);
  return res.status(201).json({ roadmap: db.prepare('SELECT * FROM roadmaps WHERE id = ?').get(info.lastInsertRowid) });
});

app.post('/api/roadmaps/milestones', requireAuth, (req, res) => {
  const title = compact(req.body?.title, 200);
  const dueDate = compact(req.body?.dueDate || req.body?.due_date, 30);
  const status = ['Planned', 'In progress', 'Review', 'Done'].includes(req.body?.status) ? req.body.status : 'Planned';
  const progress = Math.min(100, Math.max(0, Number(req.body?.progress) || 0));
  const roadmapId = Number(req.body?.roadmapId) || null;
  if (!title) return res.status(400).json({ message: 'Milestone title is required.' });
  const info = db.prepare(`
    INSERT INTO roadmap_milestones (roadmap_id, user_id, title, due_date, status, progress, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(roadmapId, req.user.id, title, dueDate, status, progress);
  return res.status(201).json({ milestone: db.prepare('SELECT * FROM roadmap_milestones WHERE id = ?').get(info.lastInsertRowid) });
});

app.patch('/api/roadmaps/milestones/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const milestone = db.prepare('SELECT * FROM roadmap_milestones WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!milestone) return res.status(404).json({ message: 'Milestone not found.' });
  const title = compact(req.body?.title ?? milestone.title, 200);
  const dueDate = compact(req.body?.dueDate ?? milestone.due_date, 30);
  const status = ['Planned', 'In progress', 'Review', 'Done'].includes(req.body?.status) ? req.body.status : milestone.status;
  const progress = req.body?.progress !== undefined ? Math.min(100, Math.max(0, Number(req.body.progress))) : milestone.progress;
  db.prepare(`
    UPDATE roadmap_milestones SET title = ?, due_date = ?, status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, dueDate, status, progress, id);
  return res.json({ milestone: db.prepare('SELECT * FROM roadmap_milestones WHERE id = ?').get(id) });
});

app.delete('/api/roadmaps/milestones/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const milestone = db.prepare('SELECT id FROM roadmap_milestones WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!milestone) return res.status(404).json({ message: 'Milestone not found.' });
  db.prepare('DELETE FROM roadmap_milestones WHERE id = ?').run(id);
  return res.json({ message: 'Milestone deleted.' });
});

app.get('/api/project-evaluations', requireAuth, (req, res) => {
  const evaluations = db.prepare('SELECT * FROM project_evaluations WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(req.user.id);
  return res.json({ evaluations });
});

app.post('/api/project-evaluations', requireAuth, (req, res) => {
  const score = Math.min(100, Math.max(0, Number(req.body?.score) || 0));
  const feedback = compact(req.body?.feedback || '', 2000);
  const criteriaJson = typeof req.body?.criteria === 'object' ? JSON.stringify(req.body.criteria) : '{}';
  const projectId = Number(req.body?.projectId) || null;
  const info = db.prepare(`
    INSERT INTO project_evaluations (project_id, user_id, score, feedback, criteria_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(projectId, req.user.id, score, feedback, criteriaJson);
  return res.status(201).json({ evaluation: db.prepare('SELECT * FROM project_evaluations WHERE id = ?').get(info.lastInsertRowid) });
});

// ==========================================
// NVIDIA AI CATALOG API ENDPOINTS
// ==========================================

app.get('/api/ai/status', (req, res) => {
  return res.json(getAiStatus());
});

app.post('/api/ai/analyze-skills', requireAuth, async (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id) || req.user;
    const skills = db.prepare(`
      SELECT s.name FROM skills s
      JOIN student_skills ss ON ss.skill_id = s.id
      WHERE ss.user_id = ?
    `).all(req.user.id).map((r) => r.name);

    const certificateText = compact(req.body?.certificateText || '', 3000);
    const portfolioSummary = compact(req.body?.portfolioSummary || '', 2000);

    const analysis = await analyzeSkillsAndCertificates({
      profile,
      skills,
      certificateText,
      portfolioSummary,
    });

    return res.json({ analysis });
  } catch (err) {
    console.error('AI skill analysis error:', err);
    return res.status(500).json({ message: 'Failed to analyze student skills and credentials.' });
  }
});

app.post('/api/ai/compare-opportunity', requireAuth, async (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id) || req.user;
    const skills = db.prepare(`
      SELECT s.name FROM skills s
      JOIN student_skills ss ON ss.skill_id = s.id
      WHERE ss.user_id = ?
    `).all(req.user.id).map((r) => r.name);

    const opportunityType = compact(req.body?.opportunityType || 'Hackathon', 100);
    const opportunityTitle = compact(req.body?.opportunityTitle || '', 200);
    const opportunityRequirements = compact(req.body?.opportunityRequirements || '', 3000);

    const comparison = await compareOpportunityWithStudent({
      profile,
      skills,
      opportunityType,
      opportunityTitle,
      opportunityRequirements,
    });

    return res.json({ comparison });
  } catch (err) {
    console.error('AI opportunity comparison error:', err);
    return res.status(500).json({ message: 'Failed to compare student profile with opportunity.' });
  }
});

app.post('/api/ai/career-roadmap', requireAuth, async (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id) || req.user;
    const skills = db.prepare(`
      SELECT s.name FROM skills s
      JOIN student_skills ss ON ss.skill_id = s.id
      WHERE ss.user_id = ?
    `).all(req.user.id).map((r) => r.name);

    const targetRole = compact(req.body?.targetRole || 'Full-Stack AI Engineer', 100);
    const timeframeWeeks = Math.min(24, Math.max(2, Number(req.body?.timeframeWeeks) || 6));

    const roadmap = await generateAiRoadmap({
      profile,
      skills,
      targetRole,
      timeframeWeeks,
    });

    return res.json({ roadmap });
  } catch (err) {
    console.error('AI career roadmap generation error:', err);
    return res.status(500).json({ message: 'Failed to generate career roadmap.' });
  }
});

app.post('/api/ai/judge', requireAuth, async (req, res) => {
  try {
    const pitchText = compact(req.body?.pitchText || '', 5000);
    const projectTitle = compact(req.body?.projectTitle || 'Hackathon Pitch', 200);
    if (!pitchText) {
      return res.status(400).json({ message: 'Please provide pitch text for evaluation.' });
    }

    const evaluation = await evaluateProjectPitch({ pitchText, projectTitle });
    return res.json({ evaluation });
  } catch (err) {
    console.error('AI judge simulation error:', err);
    return res.status(500).json({ message: 'Failed to simulate jury review.' });
  }
});

app.post('/api/ai/scanner', requireAuth, async (req, res) => {
  try {
    const domain = compact(req.body?.domain || 'All', 50);
    const keywords = compact(req.body?.keywords || '', 200);

    const result = await scanInnovationIdeas({ domain, keywords });
    return res.json(result);
  } catch (err) {
    console.error('AI scanner error:', err);
    return res.status(500).json({ message: 'Failed to scan innovation ideas.' });
  }
});

// ==========================================
// TECHNICAL INTERVIEW & PROCTORING API ROUTES
// ==========================================

// Check ChromaDB status
app.get('/api/chroma/status', async (req, res) => {
  try {
    const status = await getChromaStatus();
    return res.json(status);
  } catch (err) {
    return res.status(500).json({ connected: false, error: err.message });
  }
});

// Seed ChromaDB collection with curated questions
app.post('/api/chroma/seed', requireAuth, async (req, res) => {
  try {
    const result = await ingestKnowledgeToChroma();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// List candidate interview assessments (searchable and filterable)
app.get('/api/interviews/candidates', requireAuth, (req, res) => {
  const { search = '', language = '', difficulty = '', limit = 50 } = req.query;
  let query = `
    SELECT s.id, s.title, s.language, s.difficulty, s.duration_minutes, s.question_count, s.mode, s.status, s.created_at, s.finished_at,
           u.id AS candidate_id, u.name AS candidate_name, u.email AS candidate_email, u.college AS candidate_college, u.department AS candidate_dept,
           e.overall_score, e.technical_score, e.problem_solving_score, e.proctoring_score, e.recommendation, e.evaluated_by, e.created_at AS evaluated_at,
           (SELECT COUNT(*) FROM interview_answers a WHERE a.interview_id = s.id AND LENGTH(TRIM(a.answer_text || a.code_content)) > 0) AS answered_count,
           (SELECT COUNT(*) FROM interview_activity_logs al WHERE al.interview_id = s.id) AS activity_events_count
    FROM interview_sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN interview_evaluations e ON e.interview_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (u.name LIKE ? OR u.email LIKE ? OR s.title LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (language && language !== 'all') {
    query += ` AND s.language LIKE ?`;
    params.push(`%${language}%`);
  }
  if (difficulty && difficulty !== 'all') {
    query += ` AND s.difficulty = ?`;
    params.push(difficulty);
  }

  query += ` ORDER BY s.id DESC LIMIT ?`;
  params.push(Number(limit) || 50);

  const candidates = db.prepare(query).all(...params);
  return res.json({ candidates });
});

// List user's interview history
app.get('/api/interviews', requireAuth, (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, 
      e.overall_score AS eval_overall_score,
      e.technical_score,
      e.problem_solving_score,
      e.evaluated_by,
      e.created_at AS evaluated_at,
      (SELECT COUNT(*) FROM interview_questions q WHERE q.interview_id = s.id) AS total_questions_count,
      (SELECT COUNT(*) FROM interview_answers a WHERE a.interview_id = s.id AND LENGTH(TRIM(a.answer_text || a.code_content)) > 0) AS answered_count,
      (SELECT COUNT(*) FROM interview_activity_logs al WHERE al.interview_id = s.id) AS activity_events_count
    FROM interview_sessions s
    LEFT JOIN interview_evaluations e ON e.interview_id = s.id
    WHERE s.user_id = ?
    ORDER BY s.id DESC
  `).all(req.user.id);

  return res.json({ interviews: sessions });
});

// Create new technical interview session with dynamic 20+ questions via ChromaDB
app.post('/api/interviews', requireAuth, async (req, res) => {
  try {
    const rawLangs = req.body?.languages || req.body?.language || 'Python';
    const languages = Array.isArray(rawLangs)
      ? rawLangs.map((l) => compact(String(l), 50)).filter(Boolean)
      : String(rawLangs).split(',').map((l) => compact(l.trim(), 50)).filter(Boolean);
    if (languages.length === 0) languages.push('Python');
    const language = languages.join(', ');

    const difficulty = ['Beginner', 'Intermediate', 'Advanced'].includes(req.body?.difficulty) ? req.body.difficulty : 'Intermediate';
    const topics = Array.isArray(req.body?.topics) && req.body.topics.length > 0
      ? req.body.topics.slice(0, 10)
      : ['Fundamentals', 'Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Networks'];
    const durationMinutes = Math.min(120, Math.max(10, Number(req.body?.durationMinutes || req.body?.duration_minutes) || 30));
    const questionCount = Math.max(20, Math.min(30, Number(req.body?.questionCount || req.body?.question_count) || 20));
    const mode = req.body?.mode === 'text' ? 'text' : 'camera';
    const interviewType = ['conceptual', 'code_output', 'debugging', 'coding', 'mixed'].includes(req.body?.interviewType)
      ? req.body.interviewType
      : 'mixed';
    const title = compact(req.body?.title || `${language} (${difficulty}) AI Technical Interview`, 150);

    // Dynamic question retrieval via ChromaDB semantic vector store
    let questionsList = [];
    let providerInfo = { aiProvider: 'chromadb_vector_engine', model: 'llama-3.2-11b-vision-instruct' };

    try {
      questionsList = await retrieveQuestionsFromChroma({
        languages,
        topics,
        difficulty,
        count: questionCount,
        interviewType,
      });
    } catch (chromaErr) {
      console.warn('[ChromaDB Retrieval Fallback]:', chromaErr.message);
      const genResult = await generateInterviewQuestions({
        language: languages[0] || 'Python',
        difficulty,
        topics,
        count: questionCount,
      });
      questionsList = genResult.questions || [];
      providerInfo.aiProvider = genResult.aiProvider;
      providerInfo.model = genResult.model;
    }

    if (!questionsList || questionsList.length < questionCount) {
      const genResult = await generateInterviewQuestions({
        language: languages[0] || 'Python',
        difficulty,
        topics,
        count: questionCount,
      });
      questionsList = genResult.questions || [];
    }

    const startedAtIso = new Date().toISOString();

    const createTx = db.transaction(() => {
      const sessInfo = db.prepare(`
        INSERT INTO interview_sessions (user_id, title, language, difficulty, topics, duration_minutes, question_count, mode, status, current_question_index, started_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', 1, ?)
      `).run(
        req.user.id,
        title,
        language,
        difficulty,
        JSON.stringify(topics),
        durationMinutes,
        questionsList.length,
        mode,
        startedAtIso
      );

      const interviewId = Number(sessInfo.lastInsertRowid);

      const insertQuestionStmt = db.prepare(`
        INSERT INTO interview_questions (interview_id, question_index, title, type, difficulty, topic, question_text, code_snippet, starter_code, suggested_answer, explanation, evaluation_rubric, expected_concepts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const q of questionsList) {
        insertQuestionStmt.run(
          interviewId,
          q.questionIndex,
          q.title,
          q.type || 'conceptual',
          q.difficulty || difficulty,
          q.topic || 'General',
          q.question_text,
          q.code_snippet || '',
          q.starter_code || '',
          q.suggested_answer || '',
          q.explanation || '',
          q.evaluation_rubric || '',
          JSON.stringify(q.expected_concepts || [])
        );
      }

      // Initial log
      db.prepare(`
        INSERT INTO interview_activity_logs (interview_id, user_id, event_type, severity, details)
        VALUES (?, ?, 'session_started', 'info', ?)
      `).run(interviewId, req.user.id, `Interview started in ${mode} mode with ${questionsList.length} questions.`);

      return interviewId;
    });

    const interviewId = createTx();
    const session = db.prepare('SELECT * FROM interview_sessions WHERE id = ?').get(interviewId);
    
    // Return sanitized questions (without exposing suggested answers before completion)
    const questions = db.prepare(`
      SELECT id, interview_id, question_index, title, type, difficulty, topic, question_text, code_snippet, starter_code
      FROM interview_questions
      WHERE interview_id = ?
      ORDER BY question_index ASC
    `).all(interviewId);

    return res.status(201).json({
      interviewId,
      session,
      questions,
      aiProvider: providerInfo.aiProvider,
      model: providerInfo.model,
    });
  } catch (err) {
    console.error('Create interview session error:', err);
    return res.status(500).json({ message: 'Failed to initialize technical interview session.' });
  }
});

// Fetch active interview workspace details
app.get('/api/interviews/:id', requireAuth, (req, res) => {
  const interviewId = Number(req.params.id);
  const session = db.prepare('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?').get(interviewId, req.user.id);
  if (!session) return res.status(404).json({ message: 'Interview session not found or unauthorized.' });

  // Compute remaining seconds safely
  const totalSeconds = Math.max(600, (Number(session.duration_minutes) || 30) * 60);
  let remainingSeconds = totalSeconds;
  if (session.started_at) {
    let rawDate = String(session.started_at).trim();
    if (rawDate.includes(' ') && !rawDate.includes('T')) {
      rawDate = rawDate.replace(' ', 'T') + 'Z';
    } else if (!rawDate.endsWith('Z') && !rawDate.includes('+')) {
      rawDate = rawDate + 'Z';
    }
    const startMs = new Date(rawDate).getTime();
    if (!isNaN(startMs)) {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      if (elapsed >= 0 && elapsed < totalSeconds) {
        remainingSeconds = totalSeconds - elapsed;
      } else if (elapsed >= totalSeconds && session.status === 'in_progress') {
        remainingSeconds = 0;
      }
    }
  }

  // Get questions (if completed, include suggested answers, otherwise omit)
  const isCompleted = session.status === 'completed';
  const query = isCompleted
    ? 'SELECT * FROM interview_questions WHERE interview_id = ? ORDER BY question_index ASC'
    : `SELECT id, interview_id, question_index, title, type, difficulty, topic, question_text, code_snippet, starter_code
       FROM interview_questions WHERE interview_id = ? ORDER BY question_index ASC`;

  const questions = db.prepare(query).all(interviewId);
  const answers = db.prepare('SELECT * FROM interview_answers WHERE interview_id = ? AND user_id = ?').all(interviewId, req.user.id);
  const activityLogs = db.prepare('SELECT * FROM interview_activity_logs WHERE interview_id = ? ORDER BY id DESC LIMIT 50').all(interviewId);
  const evaluation = db.prepare('SELECT * FROM interview_evaluations WHERE interview_id = ?').get(interviewId) || null;

  return res.json({
    session,
    remaining_seconds: remainingSeconds,
    questions,
    answers,
    activityLogs,
    evaluation,
  });
});

// Save or autosave candidate answer for a question
app.post('/api/interviews/:id/answers', requireAuth, (req, res) => {
  const interviewId = Number(req.params.id);
  const session = db.prepare('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?').get(interviewId, req.user.id);
  if (!session) return res.status(404).json({ message: 'Interview not found.' });

  const questionId = Number(req.body?.questionId);
  const answerText = compact(req.body?.answerText || req.body?.answer_text || '', 8000);
  const codeContent = compact(req.body?.codeContent || req.body?.code_content || '', 12000);
  const timeSpent = Math.max(0, Number(req.body?.timeSpentSeconds) || 0);
  const status = req.body?.status || 'answered';

  const question = db.prepare('SELECT id FROM interview_questions WHERE id = ? AND interview_id = ?').get(questionId, interviewId);
  if (!question) return res.status(404).json({ message: 'Question not found in this interview.' });

  db.prepare(`
    INSERT INTO interview_answers (interview_id, question_id, user_id, answer_text, code_content, status, time_spent_seconds, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(interview_id, question_id) DO UPDATE SET
      answer_text = excluded.answer_text,
      code_content = excluded.code_content,
      status = excluded.status,
      time_spent_seconds = time_spent_seconds + excluded.time_spent_seconds,
      submitted_at = CURRENT_TIMESTAMP
  `).run(interviewId, questionId, req.user.id, answerText, codeContent, status, timeSpent);

  db.prepare('UPDATE interview_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(interviewId);

  return res.json({ message: 'Answer saved successfully.' });
});

// Record proctoring telemetry activity log
app.post('/api/interviews/:id/activity', requireAuth, (req, res) => {
  const interviewId = Number(req.params.id);
  const session = db.prepare('SELECT id FROM interview_sessions WHERE id = ? AND user_id = ?').get(interviewId, req.user.id);
  if (!session) return res.status(404).json({ message: 'Interview not found.' });

  const eventType = compact(req.body?.eventType || req.body?.event_type || 'activity_ping', 50);
  const severity = ['info', 'warning', 'critical'].includes(req.body?.severity) ? req.body.severity : 'warning';
  const details = compact(req.body?.details || '', 500);

  db.prepare(`
    INSERT INTO interview_activity_logs (interview_id, user_id, event_type, severity, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(interviewId, req.user.id, eventType, severity, details);

  return res.status(201).json({ message: 'Activity recorded.' });
});

// Finalize interview and generate AI evaluation report
app.post('/api/interviews/:id/finish', requireAuth, async (req, res) => {
  try {
    const interviewId = Number(req.params.id);
    const session = db.prepare('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?').get(interviewId, req.user.id);
    if (!session) return res.status(404).json({ message: 'Interview session not found.' });

    const questions = db.prepare('SELECT * FROM interview_questions WHERE interview_id = ? ORDER BY question_index ASC').all(interviewId);
    const answers = db.prepare('SELECT * FROM interview_answers WHERE interview_id = ? AND user_id = ?').all(interviewId, req.user.id);
    const activityLogs = db.prepare('SELECT * FROM interview_activity_logs WHERE interview_id = ? ORDER BY id ASC').all(interviewId);

    const evaluation = await evaluateInterviewSubmission({
      interview: session,
      questions,
      answers,
      activityLogs,
    });

    const finishTx = db.transaction(() => {
      db.prepare(`
        UPDATE interview_sessions
        SET status = 'completed', overall_score = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(evaluation.overallScore, interviewId);

      db.prepare(`
        INSERT INTO interview_evaluations (
          interview_id, user_id, overall_score, technical_score, explanation_score, problem_solving_score,
          total_questions, answered_questions, correct_count, partial_count, incorrect_count,
          strengths_json, weaknesses_json, recommendations_json, topic_breakdown_json, question_feedback_json,
          proctoring_summary_json, evaluated_by, evaluation_data
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(interview_id) DO UPDATE SET
          overall_score = excluded.overall_score,
          technical_score = excluded.technical_score,
          explanation_score = excluded.explanation_score,
          problem_solving_score = excluded.problem_solving_score,
          total_questions = excluded.total_questions,
          answered_questions = excluded.answered_questions,
          correct_count = excluded.correct_count,
          partial_count = excluded.partial_count,
          incorrect_count = excluded.incorrect_count,
          strengths_json = excluded.strengths_json,
          weaknesses_json = excluded.weaknesses_json,
          recommendations_json = excluded.recommendations_json,
          topic_breakdown_json = excluded.topic_breakdown_json,
          question_feedback_json = excluded.question_feedback_json,
          proctoring_summary_json = excluded.proctoring_summary_json,
          evaluated_by = excluded.evaluated_by,
          evaluation_data = excluded.evaluation_data
      `).run(
        interviewId,
        req.user.id,
        evaluation.overallScore,
        evaluation.technicalScore,
        evaluation.explanationScore,
        evaluation.problemSolvingScore,
        evaluation.totalQuestions,
        evaluation.answeredQuestions,
        evaluation.correctCount,
        evaluation.partialCount,
        evaluation.incorrectCount,
        JSON.stringify(evaluation.strengths || []),
        JSON.stringify(evaluation.weaknesses || []),
        JSON.stringify(evaluation.recommendations || []),
        JSON.stringify(evaluation.topicBreakdown || {}),
        JSON.stringify(evaluation.questionFeedback || []),
        JSON.stringify(evaluation.proctoringSummary || {}),
        evaluation.evaluatedBy || 'NVIDIA API Catalog',
        JSON.stringify(evaluation)
      );

      db.prepare(`
        INSERT INTO notifications (user_id, message, type, related_path)
        VALUES (?, ?, 'interview', ?)
      `).run(
        req.user.id,
        `Your ${session.title} evaluation is ready! Score: ${evaluation.overallScore}% (${evaluation.readinessVerdict || 'Completed'})`,
        `/interview/${interviewId}/results`
      );
    });

    finishTx();

    return res.json({
      message: 'Interview completed and evaluated successfully.',
      evaluation,
    });
  } catch (err) {
    console.error('Finish interview evaluation error:', err);
    return res.status(500).json({ message: 'Failed to evaluate completed interview.' });
  }
});

// Fetch detailed interview results dashboard data
app.get('/api/interviews/:id/results', requireAuth, (req, res) => {
  const interviewId = Number(req.params.id);
  const session = db.prepare('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?').get(interviewId, req.user.id);
  if (!session) return res.status(404).json({ message: 'Interview session not found.' });

  const evaluation = db.prepare('SELECT * FROM interview_evaluations WHERE interview_id = ?').get(interviewId);
  const questions = db.prepare('SELECT * FROM interview_questions WHERE interview_id = ? ORDER BY question_index ASC').all(interviewId);
  const answers = db.prepare('SELECT * FROM interview_answers WHERE interview_id = ? AND user_id = ?').all(interviewId, req.user.id);
  const activityLogs = db.prepare('SELECT * FROM interview_activity_logs WHERE interview_id = ? ORDER BY id ASC').all(interviewId);

  let parsedEval = null;
  if (evaluation) {
    let rawData = {};
    try {
      if (evaluation.evaluation_data) rawData = JSON.parse(evaluation.evaluation_data);
    } catch {
      // ignore
    }

    parsedEval = {
      ...rawData,
      ...evaluation,
      strengths: JSON.parse(evaluation.strengths_json || '[]'),
      weaknesses: JSON.parse(evaluation.weaknesses_json || '[]'),
      recommendations: JSON.parse(evaluation.recommendations_json || '[]'),
      topicBreakdown: JSON.parse(evaluation.topic_breakdown_json || '{}'),
      questionFeedback: JSON.parse(evaluation.question_feedback_json || '[]'),
      proctoringSummary: JSON.parse(evaluation.proctoring_summary_json || '{}'),
      overallScore: evaluation.overall_score,
      technicalScore: evaluation.technical_score,
      explanationScore: evaluation.explanation_score,
      problemSolvingScore: evaluation.problem_solving_score,
      totalMarksEarned: rawData.totalMarksEarned ?? evaluation.overall_score,
      totalMaxMarks: rawData.totalMaxMarks ?? 100,
      readinessVerdict: rawData.readinessVerdict || (evaluation.overall_score >= 75 ? 'Ready for Technical Rounds' : 'Intermediate Candidate'),
      overallEvaluation: rawData.overallEvaluation || `Candidate completed ${questions.length} technical questions.`,
      cameraStats: rawData.cameraStats || (JSON.parse(evaluation.proctoring_summary_json || '{}').cameraStats),
    };
  }

  return res.json({
    session,
    evaluation: parsedEval,
    questions,
    answers,
    activityLogs,
  });
});



const seedDatabase = async () => {
  const demoUsersCount = db.prepare('SELECT COUNT(*) AS count FROM profiles WHERE is_demo = 1').get().count;
  if (demoUsersCount >= 4) return;

  const demoAccounts = [
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.edu',
      password: 'DemoStudent123!',
      college: 'Indian Institute of Technology, Bombay',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      studyYear: '3rd year',
      location: 'Mumbai, India',
      headline: 'Full-Stack Engineer & AI Researcher · Top 1% Hackathon Winner',
      bio: 'Passionate about building agentic AI workflows and distributed backend systems. Former SIH 2025 finalist with 5+ shipped open source projects.',
      careerGoals: 'Build high-throughput AI infrastructure and co-found a developer tooling startup.',
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'PyTorch', 'PostgreSQL', 'Docker', 'System Design'],
      interests: ['Agentic AI', 'Developer Tools', 'Open Source', 'Hackathons', 'Cloud Architecture'],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
      githubUrl: 'https://github.com/priyasharma-dev',
      linkedinUrl: 'https://linkedin.com/in/priyasharma-ai',
      portfolioUrl: 'https://priyasharma.dev',
      projects: [
        {
          name: 'MediBridge AI - Rural Triage System',
          category: 'Healthcare',
          description: 'Multi-lingual triage agent assisting rural clinics with offline-first preliminary diagnostics using quantized LLMs.',
          problem: 'Overburdened PHCs in rural areas lack immediate diagnostic specialists, leading to treatment delays.',
          solution: 'Edge-hosted LLM running on low-spec tablets with Hindi, Tamil, and Marathi voice support.',
          techStack: 'Python, FastAPI, PyTorch, React Native, SQLite',
          openRoles: 'Mobile Engineer, Clinical Data Reviewer',
          skills: ['Python', 'FastAPI', 'PyTorch', 'React Native'],
          difficulty: 'Advanced',
          commitment: '8-10 hours/week',
        }
      ]
    },
    {
      name: 'Aravind Kumar',
      email: 'aravind.k@example.edu',
      password: 'DemoStudent123!',
      college: 'BITS Pilani',
      degree: 'B.E. (Hons)',
      branch: 'Electrical & Electronics Engineering',
      studyYear: '4th year',
      location: 'Hyderabad, India',
      headline: 'Embedded Systems & Edge AI Specialist · Drone Autonomy Enthusiast',
      bio: 'Specializing in computer vision on edge devices, ROS2, and low-latency robotics pipelines. Active contributor to aerial robotics labs.',
      careerGoals: 'Develop autonomous perception stacks for smart agriculture and disaster response robotics.',
      skills: ['C++', 'Python', 'ROS2', 'OpenCV', 'Embedded C', 'TensorFlow Lite', 'Linux', 'PCB Design'],
      interests: ['Robotics', 'Computer Vision', 'Edge AI', 'Drones', 'IoT'],
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&q=80',
      githubUrl: 'https://github.com/aravind-kumar-robotics',
      linkedinUrl: 'https://linkedin.com/in/aravindkumar-bits',
      portfolioUrl: 'https://aravindkumar.io',
      projects: [
        {
          name: 'KisanDrone - Autonomous Crop Health Scanner',
          category: 'Agritech',
          description: 'Low-cost autonomous drone payload for real-time multispectral NDVI crop stress and pest detection.',
          problem: 'Farmers incur 30%+ crop losses due to undetected early fungal infections and irrigation unevenness.',
          solution: 'Edge computer vision payload analyzing thermal and optical imagery to flag distress zones automatically.',
          techStack: 'C++, ROS2, OpenCV, PyTorch, Raspberry Pi 5',
          openRoles: 'Full-Stack Web Visualizer, Agronomy Advisor',
          skills: ['C++', 'ROS2', 'OpenCV', 'Python'],
          difficulty: 'Advanced',
          commitment: '6-8 hours/week',
        }
      ]
    },
    {
      name: 'Ananya Patel',
      email: 'ananya.patel@example.edu',
      password: 'DemoStudent123!',
      college: 'National Institute of Design (NID)',
      degree: 'B.Des',
      branch: 'Interaction & UX Design',
      studyYear: '3rd year',
      location: 'Ahmedabad, India',
      headline: 'Product Designer & Design Systems Architect · Figma Community Creator',
      bio: 'Crafting accessible, human-centric digital interfaces and high-fidelity interactive prototypes. Focused on SaaS workflows and developer experience.',
      careerGoals: 'Lead product design for developer tools and accessible educational software.',
      skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping', 'User Research', 'HTML/CSS', 'Micro-interactions'],
      interests: ['Human-Computer Interaction', 'Accessibility', 'Design Systems', 'EdTech', 'Product Strategy'],
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&fit=crop&q=80',
      githubUrl: 'https://github.com/ananyadesign',
      linkedinUrl: 'https://linkedin.com/in/ananyapatel-ux',
      portfolioUrl: 'https://ananyapatel.design',
      projects: [
        {
          name: 'SkillSetu Design System & Copilot UI',
          category: 'EdTech',
          description: 'Futuristic, accessible student collaboration UI system with glassmorphism components and dark mode tokens.',
          problem: 'Cluttered, outdated academic portals discourage cross-campus student collaboration and mentorship.',
          solution: 'Clean, high-performance UI components built for fast team discovery, pitch rehearsal, and milestone tracking.',
          techStack: 'Figma, Tailwind CSS, React, Framer Motion',
          openRoles: 'React Frontend Developer, Design Researcher',
          skills: ['Figma', 'Tailwind CSS', 'React', 'UI/UX Design'],
          difficulty: 'Intermediate',
          commitment: '4-6 hours/week',
        }
      ]
    },
    {
      name: 'Rohit Menon',
      email: 'rohit.menon@example.edu',
      password: 'DemoStudent123!',
      college: 'Delhi Technological University (DTU)',
      degree: 'B.Tech',
      branch: 'Software Engineering',
      studyYear: '2nd year',
      location: 'New Delhi, India',
      headline: 'Cloud Architect & Web3 Developer · Smart Contract Auditor',
      bio: 'Building scalable microservices, smart contracts on EVM, and verifiable credential protocols for academic verification.',
      careerGoals: 'Architect zero-knowledge identity protocols and decentralized credential infrastructure.',
      skills: ['Solidity', 'Go', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'GraphQL'],
      interests: ['Web3', 'Zero-Knowledge Proofs', 'Smart Contracts', 'Cloud Infrastructure', 'FinTech'],
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop&q=80',
      githubUrl: 'https://github.com/rohitmenon-dev',
      linkedinUrl: 'https://linkedin.com/in/rohitmenon-cloud',
      portfolioUrl: 'https://rohitmenon.tech',
      projects: [
        {
          name: 'EcoTrace - Supply Chain Carbon Accounting',
          category: 'CleanTech',
          description: 'Immutable carbon footprint tracking system utilizing smart contracts and IoT sensor verification for supply chains.',
          problem: 'Greenwashing and untraceable supply chain emission reports prevent accurate ESG compliance.',
          solution: 'Decentralized ledger recording verifiable sensor telemetry and issuing tamper-proof carbon score certificates.',
          techStack: 'Solidity, Next.js, Node.js, Polygon, Hardhat',
          openRoles: 'Smart Contract Auditor, Frontend Integrator',
          skills: ['Solidity', 'Node.js', 'Web3', 'Polygon'],
          difficulty: 'Intermediate',
          commitment: '5-7 hours/week',
        }
      ]
    }
  ];

  for (const account of demoAccounts) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(account.email);
    let userId;
    if (existing) {
      userId = existing.id;
    } else {
      const passwordHash = await hashPassword(account.password);
      const res = db.prepare(`
        INSERT INTO users (name, email, password, role, location, bio)
        VALUES (?, ?, ?, 'Student', ?, ?)
      `).run(account.name, account.email, passwordHash, account.location, account.bio);
      userId = Number(res.lastInsertRowid);
    }

    db.prepare(`
      INSERT INTO profiles (user_id, full_name, college, degree, branch, study_year, location, headline, bio, career_goals, availability, visibility, avatar_url, github_url, linkedin_url, portfolio_url, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open to collaborate', 'public', ?, ?, ?, ?, 1)
      ON CONFLICT(user_id) DO UPDATE SET
        full_name = excluded.full_name,
        college = excluded.college,
        degree = excluded.degree,
        branch = excluded.branch,
        study_year = excluded.study_year,
        location = excluded.location,
        headline = excluded.headline,
        bio = excluded.bio,
        career_goals = excluded.career_goals,
        availability = excluded.availability,
        visibility = excluded.visibility,
        avatar_url = excluded.avatar_url,
        github_url = excluded.github_url,
        linkedin_url = excluded.linkedin_url,
        portfolio_url = excluded.portfolio_url,
        is_demo = 1
    `).run(userId, account.name, account.college, account.degree, account.branch, account.studyYear, account.location, account.headline, account.bio, account.careerGoals, account.avatarUrl, account.githubUrl, account.linkedinUrl, account.portfolioUrl);

    replaceNamedJoins(userId, account.skills, 'skill');
    replaceNamedJoins(userId, account.interests, 'interest');

    for (const proj of account.projects) {
      const existingProject = db.prepare('SELECT id FROM projects WHERE owner_id = ? AND name = ?').get(userId, proj.name);
      if (!existingProject) {
        const info = db.prepare(`
          INSERT INTO projects (name, description, category, status, match_score, owner_id, problem, solution, difficulty, commitment, tech_stack, open_roles, visibility, updated_at)
          VALUES (?, ?, ?, 'Open', 94, ?, ?, ?, ?, ?, ?, ?, 'public', CURRENT_TIMESTAMP)
        `).run(proj.name, proj.description, proj.category, userId, proj.problem, proj.solution, proj.difficulty, proj.commitment, proj.techStack, proj.openRoles);
        const projectId = Number(info.lastInsertRowid);
        db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role, status) VALUES (?, ?, ?, ?)').run(projectId, userId, 'Owner', 'active');
        for (const s of proj.skills) {
          db.prepare('INSERT OR IGNORE INTO skills (name, type) VALUES (?, ?)').run(s, 'technical');
          const skillObj = db.prepare('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)').get(s);
          if (skillObj) db.prepare('INSERT OR IGNORE INTO project_skills (project_id, skill_id) VALUES (?, ?)').run(projectId, skillObj.id);
        }
      }
    }
  }

  const hackathonsData = [
    {
      title: 'Smart India Hackathon 2026',
      organizer: 'Ministry of Education & AICTE',
      theme: 'Smart Automation, Healthcare & Agritech',
      eligibility: 'All Indian University Students',
      registration_deadline: '2026-11-15',
      event_dates: 'Dec 12 - 14, 2026',
      official_url: 'https://sih.gov.in',
      source: 'verified'
    },
    {
      title: 'ETHIndia 2026',
      organizer: 'Devfolio & Ethereum Foundation',
      theme: 'Web3, Decentralized Infrastructure & ZK',
      eligibility: 'Global Student & Professional Builders',
      registration_deadline: '2026-11-01',
      event_dates: 'Dec 04 - 06, 2026',
      official_url: 'https://ethindia.co',
      source: 'verified'
    },
    {
      title: 'Google Cloud GenAI Hackathon 2026',
      organizer: 'Google Cloud Platform',
      theme: 'Agentic Workflows & Multi-Modal AI Solutions',
      eligibility: 'Open to All Enrolled Students',
      registration_deadline: '2026-10-30',
      event_dates: 'Nov 20 - 22, 2026',
      official_url: 'https://cloud.google.com/events',
      source: 'verified'
    },
    {
      title: 'NASA Space Apps Challenge 2026',
      organizer: 'NASA & International Space Agencies',
      theme: 'Earth Science, Climate Action & Space Data',
      eligibility: 'Global High School & University Teams',
      registration_deadline: '2026-10-25',
      event_dates: 'Oct 28 - 30, 2026',
      official_url: 'https://spaceappschallenge.org',
      source: 'verified'
    }
  ];

  for (const h of hackathonsData) {
    db.prepare(`
      INSERT OR IGNORE INTO hackathons (title, organizer, theme, eligibility, registration_deadline, event_dates, official_url, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(h.title, h.organizer, h.theme, h.eligibility, h.registration_deadline, h.event_dates, h.official_url, h.source);
  }
};

app.post('/api/seed-demo', requireAuth, async (req, res) => {
  await seedDatabase();
  return res.json({ message: 'Demo data loaded successfully.' });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const aiStatus = getAiStatus();
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: 'connected',
    ai: {
      provider: aiStatus.provider,
      configured: aiStatus.configured,
      model: aiStatus.model,
    },
    version: '2.0.0',
  });
});

// Fallback JSON handler for unmatched /api routes
app.use('/api', (req, res) => {
  return res.status(404).json({ message: `API route ${req.method} ${req.originalUrl || req.path} not found.` });
});

// Serve frontend static build in production or when dist directory exists
const distDirectory = path.join(__dirname, 'dist');
if (fs.existsSync(distDirectory)) {
  app.use(express.static(distDirectory));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(distDirectory, 'index.html'));
    }
    return next();
  });
}

app.use((error, req, res, next) => {
  console.error(`${req.method} ${req.path}`, error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ message: 'An unexpected server error occurred.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`SkillSetu API listening on http://localhost:${port}`);
  const aiStatus = getAiStatus();
  if (aiStatus.configured) {
    console.log(`[AI Engine] NVIDIA API Catalog connected: ${aiStatus.model} (Key: ${aiStatus.maskedKey})`);
  } else {
    console.log(`[AI Engine] Notice: NVIDIA_API_KEY not set. Running in Smart Heuristic mode. (Register at https://build.nvidia.com/)`);
  }
});

