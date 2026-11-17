const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let db = null;
let useSqlite = false;
const DB_FILE = path.join(__dirname, 'reviews.db');
const JSON_BACKUP_FILE = path.join(__dirname, 'reviews.json');

// Try loading built-in node:sqlite
try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_FILE);
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date_time TEXT NOT NULL
    )
  `);
  useSqlite = true;
  console.log('[DB] Using SQLite (node:sqlite) persistence at', DB_FILE);
} catch (err) {
  console.warn('[DB] node:sqlite unavailable, falling back to JSON file storage.', err.message);
  useSqlite = false;
  if (!fs.existsSync(JSON_BACKUP_FILE)) {
    fs.writeFileSync(JSON_BACKUP_FILE, JSON.stringify([]), 'utf-8');
  }
}

// Helpers for JSON fallback
function readJsonDb() {
  try {
    if (!fs.existsSync(JSON_BACKUP_FILE)) return [];
    const content = fs.readFileSync(JSON_BACKUP_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (e) {
    return [];
  }
}

function writeJsonDb(data) {
  fs.writeFileSync(JSON_BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function toPlainObject(item) {
  if (!item) return null;
  return {
    id: String(item.id),
    title: String(item.title),
    content: String(item.content),
    date_time: String(item.date_time),
  };
}

/**
 * Get all reviews sorted by date_time descending (latest first)
 */
function getAll() {
  if (useSqlite) {
    const stmt = db.prepare('SELECT id, title, content, date_time FROM reviews ORDER BY datetime(date_time) DESC, date_time DESC');
    return stmt.all().map(toPlainObject);
  } else {
    const list = readJsonDb();
    return list.sort((a, b) => new Date(b.date_time) - new Date(a.date_time)).map(toPlainObject);
  }
}

/**
 * Get single review by ID
 */
function getById(id) {
  if (useSqlite) {
    const stmt = db.prepare('SELECT id, title, content, date_time FROM reviews WHERE id = ?');
    const result = stmt.get(String(id));
    return result ? toPlainObject(result) : null;
  } else {
    const list = readJsonDb();
    const item = list.find((r) => String(r.id) === String(id));
    return item ? toPlainObject(item) : null;
  }
}

/**
 * Create a new review or restore a previously deleted one
 */
function create({ title, content, id, date_time }) {
  const reviewId = id || crypto.randomUUID();
  const dateTime = date_time || new Date().toISOString();

  if (useSqlite) {
    const stmt = db.prepare(`
      INSERT INTO reviews (id, title, content, date_time)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(reviewId, title.trim(), content.trim(), dateTime);
    return getById(reviewId);
  } else {
    const list = readJsonDb();
    const newReview = {
      id: reviewId,
      title: title.trim(),
      content: content.trim(),
      date_time: dateTime,
    };
    list.unshift(newReview);
    writeJsonDb(list);
    return newReview;
  }
}

/**
 * Update an existing review
 */
function update(id, { title, content }) {
  const existing = getById(id);
  if (!existing) return null;

  const updatedTime = new Date().toISOString();
  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newContent = content !== undefined ? content.trim() : existing.content;

  if (useSqlite) {
    const stmt = db.prepare(`
      UPDATE reviews
      SET title = ?, content = ?, date_time = ?
      WHERE id = ?
    `);
    stmt.run(newTitle, newContent, updatedTime, String(id));
    return getById(id);
  } else {
    const list = readJsonDb();
    const index = list.findIndex((r) => String(r.id) === String(id));
    if (index === -1) return null;
    list[index] = {
      ...list[index],
      title: newTitle,
      content: newContent,
      date_time: updatedTime,
    };
    writeJsonDb(list);
    return list[index];
  }
}

/**
 * Delete a review by ID
 */
function deleteById(id) {
  const existing = getById(id);
  if (!existing) return null;

  if (useSqlite) {
    const stmt = db.prepare('DELETE FROM reviews WHERE id = ?');
    stmt.run(String(id));
    return existing;
  } else {
    const list = readJsonDb();
    const filtered = list.filter((r) => String(r.id) !== String(id));
    writeJsonDb(filtered);
    return existing;
  }
}

/**
 * Clear all reviews (useful for testing)
 */
function clearAll() {
  if (useSqlite) {
    db.exec('DELETE FROM reviews');
  } else {
    writeJsonDb([]);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteById,
  clearAll,
};
