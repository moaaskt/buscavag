import { db, initDatabase } from './index';
import { ProcessedJob, RawJob } from '../types/job';
import { generateJobHash } from '../utils/hash';
import { EvaluationResult } from '../services/hermesEvaluator';
import { TITLE_BLACKLIST } from '../config/jobFilters';

export interface JobFilterOptions {
  category?: string;
  platform?: string;
  status?: string;
  minScore?: number;
  search?: string;
  onlyApproved?: boolean;
  period?: string;
}

export interface DashboardStats {
  totalJobs: number;
  approvedJobs: number;
  avgScore: number;
  statusCounts: Record<string, number>;
  platformCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  topCompanies: Array<{ company: string; count: number }>;
}

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

    const applicationStatus = isJunior ? 'pending' : 'rejected';

    const stmt = db.prepare(`
      INSERT INTO jobs (
        id, url, title, company, platform, description, published_at, location,
        is_junior_fullstack, score_ia, overall_score, stack_score, seniority_score,
        location_score, category, gaps, resume_tips, application_status, ai_reasoning, notified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
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
      applicationStatus,
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
      applicationStatus,
      aiReasoning,
      notified: false,
      createdAt,
    };
  }

  public getPendingNotifications(): ProcessedJob[] {
    const stmt = db.prepare('SELECT * FROM jobs WHERE is_junior_fullstack = 1 AND notified = 0');
    const rows = stmt.all() as any[];
    return rows.map((row) => this.mapRowToJob(row));
  }

  public markAsNotified(id: string): void {
    const stmt = db.prepare('UPDATE jobs SET notified = 1 WHERE id = ?');
    stmt.run(id);
  }

  public updateApplicationStatus(id: string, status: string): boolean {
    const stmt = db.prepare('UPDATE jobs SET application_status = ? WHERE id = ?');
    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  public getJobById(id: string): ProcessedJob | null {
    const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapRowToJob(row);
  }

  public deleteJobs(ids: string[]): boolean {
    if (!ids || ids.length === 0) return false;
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM jobs WHERE id IN (${placeholders})`);
    const result = stmt.run(...ids);
    return result.changes > 0;
  }

  public purgeNonTech(): { deletedCount: number } {
    if (!TITLE_BLACKLIST || TITLE_BLACKLIST.length === 0) {
      return { deletedCount: 0 };
    }

    const conditions = TITLE_BLACKLIST.map(() => 'LOWER(title) LIKE ?').join(' OR ');
    const params = TITLE_BLACKLIST.map((term) => `%${term.toLowerCase()}%`);

    const stmt = db.prepare(`DELETE FROM jobs WHERE ${conditions}`);
    const result = stmt.run(...params);

    return { deletedCount: result.changes };
  }

  public getAllJobs(filters?: JobFilterOptions): ProcessedJob[] {
    let sql = 'SELECT * FROM jobs WHERE 1=1';
    const params: any[] = [];

    if (filters?.onlyApproved) {
      sql += ' AND is_junior_fullstack = 1';
    }

    if (filters?.category && filters.category !== 'all') {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.platform && filters.platform !== 'all') {
      sql += ' AND platform = ?';
      params.push(filters.platform);
    }

    if (filters?.status && filters.status !== 'all') {
      sql += ' AND application_status = ?';
      params.push(filters.status);
    }

    if (filters?.minScore && filters.minScore > 0) {
      sql += ' AND (overall_score >= ? OR score_ia >= ?)';
      params.push(filters.minScore, filters.minScore);
    }

    if (filters?.search && filters.search.trim()) {
      sql += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ?)';
      const query = `%${filters.search.trim()}%`;
      params.push(query, query, query);
    }

    if (filters?.period && filters.period !== 'all') {
      if (filters.period === '24h') {
        sql += " AND datetime(published_at) >= datetime('now', '-24 hours')";
      } else if (filters.period === '48h') {
        sql += " AND datetime(published_at) >= datetime('now', '-48 hours')";
      } else if (filters.period === '7d') {
        sql += " AND datetime(published_at) >= datetime('now', '-7 days')";
      } else if (filters.period === '30d') {
        sql += " AND datetime(published_at) >= datetime('now', '-30 days')";
      }
    }

    sql += ' ORDER BY overall_score DESC, published_at DESC';

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map((row) => this.mapRowToJob(row));
  }

  public getStats(): DashboardStats {
    const totalRow = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN is_junior_fullstack = 1 THEN 1 ELSE 0 END) as approved, AVG(overall_score) as avgScore FROM jobs').get() as any;
    
    const statusRows = db.prepare('SELECT application_status, COUNT(*) as count FROM jobs GROUP BY application_status').all() as any[];
    const statusCounts: Record<string, number> = {
      pending: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const r of statusRows) {
      if (r.application_status) {
        statusCounts[r.application_status] = r.count;
      }
    }

    const platformRows = db.prepare('SELECT platform, COUNT(*) as count FROM jobs GROUP BY platform ORDER BY count DESC').all() as any[];
    const platformCounts: Record<string, number> = {};
    for (const r of platformRows) {
      platformCounts[r.platform] = r.count;
    }

    const categoryRows = db.prepare('SELECT category, COUNT(*) as count FROM jobs WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC').all() as any[];
    const categoryCounts: Record<string, number> = {};
    for (const r of categoryRows) {
      categoryCounts[r.category] = r.count;
    }

    const topCompanyRows = db.prepare('SELECT company, COUNT(*) as count FROM jobs GROUP BY company ORDER BY count DESC LIMIT 6').all() as any[];
    const topCompanies = topCompanyRows.map((r) => ({ company: r.company, count: r.count }));

    return {
      totalJobs: totalRow?.total || 0,
      approvedJobs: totalRow?.approved || 0,
      avgScore: Math.round(totalRow?.avgScore || 0),
      statusCounts,
      platformCounts,
      categoryCounts,
      topCompanies,
    };
  }

  private mapRowToJob(row: any): ProcessedJob {
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
      applicationStatus: row.application_status || 'pending',
      aiReasoning: row.ai_reasoning,
      notified: Boolean(row.notified),
      createdAt: new Date(row.created_at),
    };
  }
}
