import Database from 'better-sqlite3';
import path from 'path';
const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'buscavag.db');
export const db = new Database(dbPath);
export function initDatabase() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      platform TEXT NOT NULL,
      description TEXT NOT NULL,
      published_at TEXT NOT NULL,
      location TEXT,
      is_junior_fullstack INTEGER DEFAULT 0,
      score_ia REAL DEFAULT 0,
      ai_reasoning TEXT,
      notified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);
    CREATE INDEX IF NOT EXISTS idx_jobs_notified ON jobs(notified);
  `);
}
