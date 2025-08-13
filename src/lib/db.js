import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), ".data", "shifter.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT,
  emailVerified INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  clockInAt INTEGER NOT NULL,
  clockInLat REAL,
  clockInLng REAL,
  clockInNote TEXT,
  clockOutAt INTEGER,
  clockOutLat REAL,
  clockOutLng REAL,
  clockOutNote TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
);
`);

export default db;
