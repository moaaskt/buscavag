import { db, initDatabase } from './index.js';
import { ProcessedJob, RawJob } from '../types/job.js';
import { generateJobHash } from '../utils/hash.js';

export class JobRepository {
  constructor() {
    initDatabase();
  }

  public exists(url: string, company: string, title: string): boolean {
    const id = generateJobHash(url, company, title);
    const stmt = db.prepare('SELECT 1 FROM jobs WHERE id = ? OR url = ?');
    const result = stmt.get(id, url);
    return !!result;
  }

  public insert(rawJob: RawJob, isJunior: boolean = false, scoreIa: number = 0, reasoning: string = ''): ProcessedJob {
    const id = generateJobHash(rawJob.url, rawJob.company, rawJob.title);
    const createdAt = new Date();

    const stmt = db.prepare(`
      INSERT INTO jobs (
        id, url, title, company, platform, description, published_at, location,
        is_junior_fullstack, score_ia, ai_reasoning, notified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    stmt.run(
      id,
      rawJob.url,
      rawJob.title,
      rawJob.company,
      rawJob.platform,
      rawJob.description,
      rawJob.publishedAt.toISOString(),
      rawJob.location || null,
      isJunior ? 1 : 0,
      scoreIa,
      reasoning,
      createdAt.toISOString()
    );

    return {
      ...rawJob,
      id,
      isJuniorFullStack: isJunior,
      scoreIa,
      aiReasoning: reasoning,
      notified: false,
      createdAt,
    };
  }

  public getPendingNotifications(): ProcessedJob[] {
    const stmt = db.prepare('SELECT * FROM jobs WHERE is_junior_fullstack = 1 AND notified = 0');
    const rows = stmt.all() as any[];

    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      title: row.title,
      company: row.company,
      platform: row.platform,
      description: row.description,
      publishedAt: new Date(row.published_at),
      location: row.location || undefined,
      isJuniorFullStack: Boolean(row.is_junior_fullstack),
      scoreIa: row.score_ia,
      aiReasoning: row.ai_reasoning,
      notified: Boolean(row.notified),
      createdAt: new Date(row.created_at),
    }));
  }

  public markAsNotified(id: string): void {
    const stmt = db.prepare('UPDATE jobs SET notified = 1 WHERE id = ?');
    stmt.run(id);
  }
}
