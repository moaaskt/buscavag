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
    `);
  } catch (err) {
    console.warn('[DB Migration] Aviso ao criar índices:', (err as Error).message);
  }
}
