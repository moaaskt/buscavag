const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'buscavag.db');

console.log(`[Reset DB] Reinicializando banco SQLite em: ${dbPath}`);

if (fs.existsSync(dbPath)) {
  const db = new Database(dbPath);
  
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('DROP TABLE IF EXISTS user_saved_jobs;');
  db.exec('DROP TABLE IF EXISTS candidate_resumes;');
  db.exec('DROP TABLE IF EXISTS candidate_profiles;');
  db.exec('DROP TABLE IF EXISTS users;');
  db.exec('DROP TABLE IF EXISTS scraper_logs;');
  db.exec('DROP TABLE IF EXISTS jobs;');
  db.exec('PRAGMA foreign_keys = ON;');
  
  db.close();
  console.log('[Reset DB] Tabelas antigas removidas com sucesso.');
}

console.log('[Reset DB] Banco de dados resetado para Zero-State inicial.');
