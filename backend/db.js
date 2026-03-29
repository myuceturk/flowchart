const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'diagrams.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Migration: diagrams table
db.exec(`
  CREATE TABLE IF NOT EXISTS diagrams (
    id         TEXT    PRIMARY KEY,
    title      TEXT    NOT NULL DEFAULT '',
    data       TEXT    NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

// Migration: add user_id column if it doesn't exist yet
const diagramColumns = db.pragma('table_info(diagrams)').map((c) => c.name);
if (!diagramColumns.includes('user_id')) {
  db.exec(`ALTER TABLE diagrams ADD COLUMN user_id TEXT REFERENCES users(id)`);
}

// Migration: users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT    PRIMARY KEY,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    INTEGER NOT NULL
  )
`);

// ─── Diagram functions ────────────────────────────────────────────────────────

function getDiagram(id) {
  const row = db.prepare('SELECT * FROM diagrams WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, data: JSON.parse(row.data) };
}

function saveDiagram(id, title, data, userId) {
  const now = Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO diagrams (id, title, data, user_id, created_at, updated_at)
    VALUES (
      ?, ?, ?, ?,
      COALESCE((SELECT created_at FROM diagrams WHERE id = ?), ?),
      ?
    )
  `).run(id, title, JSON.stringify(data), userId ?? null, id, now, now);
  return getDiagram(id);
}

function updateDiagram(id, changes) {
  const existing = getDiagram(id);
  if (!existing) return null;

  const title = changes.title !== undefined ? changes.title : existing.title;
  const data = changes.data !== undefined ? changes.data : existing.data;
  const now = Date.now();

  db.prepare(`
    UPDATE diagrams SET title = ?, data = ?, updated_at = ? WHERE id = ?
  `).run(title, JSON.stringify(data), now, id);

  return getDiagram(id);
}

function deleteDiagram(id) {
  const result = db.prepare('DELETE FROM diagrams WHERE id = ?').run(id);
  return result.changes > 0;
}

function listDiagrams(userId) {
  let rows;
  if (userId) {
    rows = db
      .prepare('SELECT * FROM diagrams WHERE user_id = ? ORDER BY updated_at DESC')
      .all(userId);
  } else {
    rows = db.prepare('SELECT * FROM diagrams ORDER BY updated_at DESC').all();
  }
  return rows.map((row) => ({ ...row, data: JSON.parse(row.data) }));
}

// ─── User functions ───────────────────────────────────────────────────────────

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) ?? null;
}

function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) ?? null;
}

function createUser(email, passwordHash) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  const now = Date.now();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)
  `).run(id, email, passwordHash, now);
  return getUserById(id);
}

module.exports = {
  db,
  getDiagram,
  saveDiagram,
  updateDiagram,
  deleteDiagram,
  listDiagrams,
  getUserById,
  getUserByEmail,
  createUser,
};
