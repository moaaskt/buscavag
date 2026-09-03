import { db, initDatabase } from './index.js';
import { ProcessedJob, RawJob } from '../types/job.js';
import { generateJobHash } from '../utils/hash.js';
import { EvaluationResult } from '../services/hermesEvaluator.js';

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

  public insert(
    rawJob: RawJob,
    evalResultOrIsJunior: EvaluationResult | boolean = false,
    scoreIa: number = 0,
    reasoning: string = ''
  ): ProcessedJob {
    const id = generateJobHash(rawJob.url, rawJob.company, rawJob.title);
    const createdAt = new Date();

    let isJunior = false;
    let overallScore = scoreIa;
    let stackScore = 0;
    let seniorityScore = 0;
    let locationScore = 0;
    let category = 'Full Stack';
    let gaps: string[] = [];
    let resumeTips = '';
    let aiReasoning = reasoning;

    if (typeof evalResultOrIsJunior === 'object' && evalResultOrIsJunior !== null) {
      isJunior = evalResultOrIsJunior.isJuniorFullStack;
      overallScore = evalResultOrIsJunior.overallScore ?? evalResultOrIsJunior.score ?? 0;
      stackScore = evalResultOrIsJunior.stackScore ?? 0;
      seniorityScore = evalResultOrIsJunior.seniorityScore ?? 0;
      locationScore = evalResultOrIsJunior.locationScore ?? 0;
      category = evalResultOrIsJunior.category || 'Full Stack';
      gaps = evalResultOrIsJunior.gaps || [];
      resumeTips = evalResultOrIsJunior.resumeTips || '';
      aiReasoning = evalResultOrIsJunior.reasoning || '';
    } else {
      isJunior = Boolean(evalResultOrIsJunior);
      overallScore = scoreIa;
      aiReasoning = reasoning;
    }

    const stmt = db.prepare(`
      INSERT INTO jobs (
        id, url, title, company, platform, description, published_at, location,
        is_junior_fullstack, score_ia, overall_score, stack_score, seniority_score,
        location_score, category, gaps, resume_tips, ai_reasoning, notified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
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
      overallScore,
      overallScore,
      stackScore,
      seniorityScore,
      locationScore,
      category,
      JSON.stringify(gaps),
      resumeTips,
      aiReasoning,
      createdAt.toISOString()
    );

    return {
      ...rawJob,
      id,
      isJuniorFullStack: isJunior,
      scoreIa: overallScore,
      overallScore,
      stackScore,
      seniorityScore,
      locationScore,
      category,
      gaps,
      resumeTips,
      aiReasoning,
      notified: false,
      createdAt,
    };
  }

  public getPendingNotifications(): ProcessedJob[] {
    const stmt = db.prepare('SELECT * FROM jobs WHERE is_junior_fullstack = 1 AND notified = 0');
    const rows = stmt.all() as any[];

    return rows.map((row) => {
      let gaps: string[] = [];
      try {
        if (row.gaps) {
          gaps = typeof row.gaps === 'string' ? JSON.parse(row.gaps) : row.gaps;
        }
      } catch {
        gaps = [];
      }

      return {
        id: row.id,
        url: row.url,
        title: row.title,
        company: row.company,
        platform: row.platform,
        description: row.description,
        publishedAt: new Date(row.published_at),
        location: row.location || undefined,
        isJuniorFullStack: Boolean(row.is_junior_fullstack),
        scoreIa: row.overall_score || row.score_ia || 0,
        overallScore: row.overall_score || row.score_ia || 0,
        stackScore: row.stack_score || 0,
        seniorityScore: row.seniority_score || 0,
        locationScore: row.location_score || 0,
        category: row.category || undefined,
        gaps,
        resumeTips: row.resume_tips || undefined,
        aiReasoning: row.ai_reasoning,
        notified: Boolean(row.notified),
        createdAt: new Date(row.created_at),
      };
    });
  }

  public markAsNotified(id: string): void {
    const stmt = db.prepare('UPDATE jobs SET notified = 1 WHERE id = ?');
    stmt.run(id);
  }
}
