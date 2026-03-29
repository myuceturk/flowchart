const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'diagrams.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Migration: create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS diagrams (
    id         TEXT    PRIMARY KEY,
    title      TEXT    NOT NULL DEFAULT '',
    data       TEXT    NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

function getDiagram(id) {
  const row = db.prepare('SELECT * FROM diagrams WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, data: JSON.parse(row.data) };
}

function saveDiagram(id, title, data) {
  const now = Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO diagrams (id, title, data, created_at, updated_at)
    VALUES (?, ?, ?, COALESCE((SELECT created_at FROM diagrams WHERE id = ?), ?), ?)
  `).run(id, title, JSON.stringify(data), id, now, now);
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

function listDiagrams() {
  const rows = db.prepare('SELECT * FROM diagrams ORDER BY updated_at DESC').all();
  return rows.map(row => ({ ...row, data: JSON.parse(row.data) }));
}

module.exports = { getDiagram, saveDiagram, updateDiagram, deleteDiagram, listDiagrams };
