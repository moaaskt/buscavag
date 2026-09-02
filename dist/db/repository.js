import { db, initDatabase } from './index.js';
import { generateJobHash } from '../utils/hash.js';
export class JobRepository {
    constructor() {
        initDatabase();
    }
    exists(url, company, title) {
        const id = generateJobHash(url, company, title);
        const stmt = db.prepare('SELECT 1 FROM jobs WHERE id = ? OR url = ?');
        const result = stmt.get(id, url);
        return !!result;
    }
    insert(rawJob, isJunior = false, scoreIa = 0, reasoning = '') {
        const id = generateJobHash(rawJob.url, rawJob.company, rawJob.title);
        const createdAt = new Date();
        const stmt = db.prepare(`
      INSERT INTO jobs (
        id, url, title, company, platform, description, published_at, location,
        is_junior_fullstack, score_ia, ai_reasoning, notified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);
        stmt.run(id, rawJob.url, rawJob.title, rawJob.company, rawJob.platform, rawJob.description, rawJob.publishedAt.toISOString(), rawJob.location || null, isJunior ? 1 : 0, scoreIa, reasoning, createdAt.toISOString());
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
    getPendingNotifications() {
        const stmt = db.prepare('SELECT * FROM jobs WHERE is_junior_fullstack = 1 AND notified = 0');
        const rows = stmt.all();
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
    markAsNotified(id) {
        const stmt = db.prepare('UPDATE jobs SET notified = 1 WHERE id = ?');
        stmt.run(id);
    }
}
