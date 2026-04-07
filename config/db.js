const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './database/ewaste.db';
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(path.resolve(DB_PATH), (err) => {
  if (err) console.error('DB connection error:', err);
});

// Promisified helpers for cleaner async/await usage
db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); })
  );

db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => { err ? reject(err) : resolve(row); })
  );

db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => { err ? reject(err) : resolve(rows); })
  );

db.execAsync = (sql) =>
  new Promise((resolve, reject) =>
    db.exec(sql, (err) => { err ? reject(err) : resolve(); })
  );

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');
});

module.exports = db;
