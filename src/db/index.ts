import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'buscavag.db');

// Garante que o diretório do banco existe antes de instanciar
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

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
      overall_score REAL DEFAULT 0,
      stack_score REAL DEFAULT 0,
      seniority_score REAL DEFAULT 0,
      location_score REAL DEFAULT 0,
      category TEXT,
      gaps TEXT,
      resume_tips TEXT,
      application_status TEXT DEFAULT 'pending',
      ai_reasoning TEXT,
      notified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scraper_logs (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      scraper_name TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      tier TEXT DEFAULT 'free',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidate_profiles (
      user_id TEXT PRIMARY KEY,
      target_role TEXT,
      seniority TEXT,
      expected_salary TEXT,
      preferred_work_models TEXT,
      skills TEXT,
      bio TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS candidate_resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_saved_jobs (
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      status TEXT DEFAULT 'saved',
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, job_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // Migração automática para bancos já existentes
  try {
    const existingColumns = (db.pragma('table_info(jobs)') as Array<{ name: string }>).map((col) => col.name);
    const columnsToAdd: Array<{ name: string; type: string }> = [
      { name: 'overall_score', type: 'REAL DEFAULT 0' },
      { name: 'stack_score', type: 'REAL DEFAULT 0' },
      { name: 'seniority_score', type: 'REAL DEFAULT 0' },
      { name: 'location_score', type: 'REAL DEFAULT 0' },
      { name: 'category', type: 'TEXT' },
      { name: 'gaps', type: 'TEXT' },
      { name: 'resume_tips', type: 'TEXT' },
      { name: 'application_status', type: "TEXT DEFAULT 'pending'" },
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        db.exec(`ALTER TABLE jobs ADD COLUMN ${col.name} ${col.type};`);
      }
    }
  } catch (err) {
    console.warn('[DB Migration] Aviso ao verificar colunas da tabela jobs:', (err as Error).message);
  }

  // Criação segura de índices após migrações
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);
      CREATE INDEX IF NOT EXISTS idx_jobs_notified ON jobs(notified);
      CREATE INDEX IF NOT EXISTS idx_jobs_app_status ON jobs(application_status);
      CREATE INDEX IF NOT EXISTS idx_logs_run_id ON scraper_logs(run_id);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON scraper_logs(level);
      CREATE INDEX IF NOT EXISTS idx_logs_scraper_name ON scraper_logs(scraper_name);
      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON scraper_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON candidate_resumes(user_id);
      CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON user_saved_jobs(user_id);
    `);
  } catch (err) {
    console.warn('[DB Migration] Aviso ao criar índices:', (err as Error).message);
  }
}
