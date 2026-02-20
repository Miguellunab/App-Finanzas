import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../gastos.db');

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    _db = drizzle(sqlite, { schema });
    initDb(sqlite);
  }
  return _db;
}

function initDb(sqlite: Database.Database) {
  // Crear tablas si no existen
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '💳',
      color TEXT NOT NULL DEFAULT '#6366f1',
      currency TEXT NOT NULL DEFAULT 'COP',
      balance REAL NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '📦',
      color TEXT NOT NULL DEFAULT '#8b5cf6',
      type TEXT NOT NULL DEFAULT 'both',
      budget_limit REAL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'COP',
      category_id INTEGER REFERENCES categories(id),
      wallet_id INTEGER NOT NULL REFERENCES wallets(id),
      wallet_destination_id INTEGER REFERENCES wallets(id),
      description TEXT NOT NULL DEFAULT '',
      ai_generated INTEGER NOT NULL DEFAULT 0,
      raw_input TEXT,
      date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export { schema };
