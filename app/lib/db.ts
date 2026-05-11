import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "liguiyu.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      verification_token TEXT,
      verification_expires INTEGER,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  // Migration: add missing tables and columns
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
  const tableNames = new Set(tables.map((t: any) => t.name));
  if (!tableNames.has("verification_codes")) {
    db.exec(`
      CREATE TABLE verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
  }
  if (!tableNames.has("blog_comments")) {
    db.exec(`
      CREATE TABLE blog_comments (
        id TEXT PRIMARY KEY,
        post_slug TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT,
        user_email TEXT,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX idx_blog_comments_slug ON blog_comments(post_slug);
    `);
  }

  const cols = db.prepare("PRAGMA table_info(users)").all() as any[];
  const colNames = new Set(cols.map((c: any) => c.name));
  const migrations: [string, string][] = [
    ["email_verified", "INTEGER NOT NULL DEFAULT 0"],
    ["verification_token", "TEXT"],
    ["verification_expires", "INTEGER"],
    ["role", "TEXT NOT NULL DEFAULT 'user'"],
    ["login_code", "TEXT"],
    ["login_code_expires", "INTEGER"],
  ];
  for (const [col, def] of migrations) {
    if (!colNames.has(col)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
    }
  }
}

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  avatar_url: string | null;
  email_verified: number;
  verification_token: string | null;
  verification_expires: number | null;
  login_code: string | null;
  login_code_expires: number | null;
  role: string;
  created_at: number;
  updated_at: number;
}
