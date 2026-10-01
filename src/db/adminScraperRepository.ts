import { db, initDatabase } from './index';

export type ScraperMethod = 'playwright' | 'ssr' | 'cookie' | 'api';

export interface ScraperConfigEntry {
  name: string;
  is_enabled: number; // 1 = enabled, 0 = disabled
  method: ScraperMethod;
  target_url: string | null;
  timeout_ms: number;
  updated_at: string;
}

export const DEFAULT_SCRAPERS: Array<{
  name: string;
  method: ScraperMethod;
  target_url?: string;
  timeout_ms?: number;
}> = [
  { name: 'Gupy', method: 'ssr', target_url: 'https://portal.gupy.io' },
  { name: 'LinkedIn', method: 'playwright', target_url: 'https://www.linkedin.com/jobs' },
  { name: 'Indeed', method: 'ssr', target_url: 'https://br.indeed.com' },
  { name: 'Google Jobs', method: 'api', target_url: 'https://serpapi.com' },
  { name: 'Telegram Channels', method: 'api', target_url: 'https://t.me' },
  { name: 'Programathor', method: 'ssr', target_url: 'https://programathor.com.br' },
  { name: 'Remotar', method: 'ssr', target_url: 'https://remotar.com.br' },
  { name: 'Catho', method: 'ssr', target_url: 'https://www.catho.com.br' },
  { name: 'Glassdoor', method: 'playwright', target_url: 'https://www.glassdoor.com.br' },
  { name: 'São José Mais Empregos', method: 'ssr', target_url: 'https://saojose.maisemprego.sc.gov.br' },
  { name: 'Vagas SC', method: 'ssr', target_url: 'https://vagassc.com.br' },
  { name: 'Vagas Floripa', method: 'ssr', target_url: 'https://vagasfloripa.com.br' },
  { name: 'Emprega Palhoça', method: 'ssr', target_url: 'https://empregapalhoca.com.br' },
  { name: 'Nerdin', method: 'ssr', target_url: 'https://nerdin.com.br' },
  { name: 'InfoJobs', method: 'ssr', target_url: 'https://www.infojobs.com.br' },
  { name: 'Chawork', method: 'ssr', target_url: 'https://chawork.com.br' },
  { name: 'Trabalha Brasil', method: 'ssr', target_url: 'https://www.trabalhabrasil.com.br' },
  { name: 'BNE', method: 'ssr', target_url: 'https://www.bne.com.br' },
  { name: 'beBee', method: 'ssr', target_url: 'https://br.bebee.com' },
  { name: 'Empregos.com.br', method: 'ssr', target_url: 'https://www.empregos.com.br' },
  { name: 'Recruta Simples', method: 'ssr', target_url: 'https://www.recrutasimples.com.br' },
  { name: 'Recrutei Empregos', method: 'api', target_url: 'https://recrutei.com.br' },
  { name: 'Quickin ATS', method: 'api', target_url: 'https://quickin.io' },
  { name: 'Recrutei Jobs (PeoplePlan)', method: 'api', target_url: 'https://peopleplan.recrutei.com.br' },
  { name: 'PandaPé ATS (GTO RH)', method: 'ssr', target_url: 'https://pandape.infojobs.com.br' },
  { name: 'GeekHunter', method: 'ssr', target_url: 'https://www.geekhunter.com.br' },
  { name: 'Revelo', method: 'playwright', target_url: 'https://www.revelo.com.br' },
  { name: '99jobs', method: 'playwright', target_url: 'https://www.99jobs.com' },
  { name: 'Sólides', method: 'api', target_url: 'https://vagas.solides.com.br' },
  { name: 'RunTalent', method: 'playwright', target_url: 'https://runtalent.com.br' },
  { name: 'Empregare', method: 'playwright', target_url: 'https://empregare.com' },
  { name: 'Trampos.co', method: 'ssr', target_url: 'https://trampos.co' },
  { name: '99Freelas', method: 'ssr', target_url: 'https://www.99freelas.com.br' },
  { name: 'Workana', method: 'playwright', target_url: 'https://www.workana.com' },
  { name: 'Facebook Groups', method: 'cookie', target_url: 'https://facebook.com' },
  { name: 'LinkedIn Posts', method: 'playwright', target_url: 'https://www.linkedin.com/feed' },
];

export class AdminScraperRepository {
  constructor() {
    initDatabase();
    this.seedDefaultConfigs();
  }

  seedDefaultConfigs(): void {
    const existing = db.prepare('SELECT name FROM scraper_configs').all() as Array<{ name: string }>;
    const existingSet = new Set(existing.map((e) => e.name));

    const insertStmt = db.prepare(`
      INSERT INTO scraper_configs (name, is_enabled, method, target_url, timeout_ms, updated_at)
      VALUES (?, 1, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const insertMany = db.transaction(() => {
      for (const scraper of DEFAULT_SCRAPERS) {
        if (!existingSet.has(scraper.name)) {
          insertStmt.run(
            scraper.name,
            scraper.method,
            scraper.target_url || null,
            scraper.timeout_ms || 45000,
            now
          );
        }
      }
    });

    insertMany();
  }

  getAllConfigs(): ScraperConfigEntry[] {
    const stmt = db.prepare('SELECT * FROM scraper_configs ORDER BY name ASC');
    return stmt.all() as ScraperConfigEntry[];
  }

  getConfig(name: string): ScraperConfigEntry | null {
    const stmt = db.prepare('SELECT * FROM scraper_configs WHERE name = ?');
    return (stmt.get(name) as ScraperConfigEntry) || null;
  }

  toggleScraper(name: string, enabled: boolean): ScraperConfigEntry | null {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE scraper_configs
      SET is_enabled = ?, updated_at = ?
      WHERE name = ?
    `);
    const info = stmt.run(enabled ? 1 : 0, now, name);
    if (info.changes === 0) return null;
    return this.getConfig(name);
  }

  updateConfig(
    name: string,
    data: { is_enabled?: boolean; method?: ScraperMethod; target_url?: string; timeout_ms?: number }
  ): ScraperConfigEntry | null {
    const current = this.getConfig(name);
    if (!current) return null;

    const is_enabled = data.is_enabled !== undefined ? (data.is_enabled ? 1 : 0) : current.is_enabled;
    const method = data.method || current.method;
    const target_url = data.target_url !== undefined ? data.target_url : current.target_url;
    const timeout_ms = data.timeout_ms !== undefined ? data.timeout_ms : current.timeout_ms;
    const updated_at = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE scraper_configs
      SET is_enabled = ?, method = ?, target_url = ?, timeout_ms = ?, updated_at = ?
      WHERE name = ?
    `);
    stmt.run(is_enabled, method, target_url, timeout_ms, updated_at, name);
    return this.getConfig(name);
  }
}
