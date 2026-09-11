import { db, initDatabase } from './index';
import { ScraperLog, LogFilterOptions, ScraperRunSummary, LogLevel } from '../types/log';
import crypto from 'crypto';

export class LogRepository {
  constructor() {
    initDatabase();
  }

  public insertLog(log: {
    runId: string;
    scraperName: string;
    level: LogLevel;
    message: string;
    details?: string;
  }): ScraperLog {
    const id = crypto.randomUUID();
    const createdAt = new Date();

    const stmt = db.prepare(`
      INSERT INTO scraper_logs (id, run_id, scraper_name, level, message, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      log.runId,
      log.scraperName,
      log.level,
      log.message,
      log.details || null,
      createdAt.toISOString()
    );

    return {
      id,
      runId: log.runId,
      scraperName: log.scraperName,
      level: log.level,
      message: log.message,
      details: log.details,
      createdAt,
    };
  }

  public getLogs(filters?: LogFilterOptions): { logs: ScraperLog[]; total: number } {
    let sql = 'SELECT * FROM scraper_logs WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM scraper_logs WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (filters?.level) {
      sql += ' AND level = ?';
      countSql += ' AND level = ?';
      params.push(filters.level);
      countParams.push(filters.level);
    }

    if (filters?.scraperName) {
      sql += ' AND scraper_name = ?';
      countSql += ' AND scraper_name = ?';
      params.push(filters.scraperName);
      countParams.push(filters.scraperName);
    }

    if (filters?.runId) {
      sql += ' AND run_id = ?';
      countSql += ' AND run_id = ?';
      params.push(filters.runId);
      countParams.push(filters.runId);
    }

    if (filters?.period) {
      let interval = '';
      if (filters.period === '24h') interval = '-24 hours';
      else if (filters.period === '48h') interval = '-48 hours';
      else if (filters.period === '7d') interval = '-7 days';
      else if (filters.period === '30d') interval = '-30 days';

      if (interval) {
        sql += ` AND datetime(created_at) >= datetime('now', '${interval}')`;
        countSql += ` AND datetime(created_at) >= datetime('now', '${interval}')`;
      }
    }

    const totalRow = db.prepare(countSql).get(...countParams) as { total: number };
    const total = totalRow?.total || 0;

    sql += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
      if (filters?.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const rows = db.prepare(sql).all(...params) as any[];
    const logs = rows.map((row) => ({
      id: row.id,
      runId: row.run_id,
      scraperName: row.scraper_name,
      level: row.level as LogLevel,
      message: row.message,
      details: row.details || undefined,
      createdAt: new Date(row.created_at),
    }));

    return { logs, total };
  }

  public getRecentRuns(limit: number = 10): ScraperRunSummary[] {
    const runRows = db.prepare(`
      SELECT 
        run_id,
        MIN(created_at) as started_at,
        MAX(created_at) as completed_at,
        COUNT(*) as total_logs,
        SUM(CASE WHEN level = 'ERROR' THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN level = 'WARN' THEN 1 ELSE 0 END) as warn_count,
        SUM(CASE WHEN level = 'INFO' THEN 1 ELSE 0 END) as info_count,
        GROUP_CONCAT(DISTINCT scraper_name) as scrapers_run
      FROM scraper_logs
      GROUP BY run_id
      ORDER BY MIN(created_at) DESC
      LIMIT ?
    `).all(limit) as any[];

    return runRows.map((r) => ({
      runId: r.run_id,
      startedAt: new Date(r.started_at),
      completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
      totalLogs: r.total_logs || 0,
      errorCount: r.error_count || 0,
      warnCount: r.warn_count || 0,
      infoCount: r.info_count || 0,
      scrapersRun: r.scrapers_run ? r.scrapers_run.split(',') : [],
    }));
  }
}
