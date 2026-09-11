import crypto from 'crypto';
import { db, initDatabase } from '@/db';

export type LogLevel = 'info' | 'warn' | 'error' | 'security';
export type LogCategory = 'auth' | 'jobs' | 'cv' | 'scraper' | 'billing' | 'system' | 'security';

export interface LogContext {
  userId?: string | null;
  metadata?: Record<string, any> | null;
  ip?: string | null;
  userAgent?: string | null;
  req?: Request | { headers: Headers | Record<string, string | string[] | undefined> } | null;
}

export interface SystemLogRecord {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  user_id: string | null;
  metadata: string | null;
  ip: string | null;
  user_agent: string | null;
}

function extractRequestInfo(req?: LogContext['req']): { ip: string | null; userAgent: string | null } {
  if (!req) return { ip: null, userAgent: null };

  let ip: string | null = null;
  let userAgent: string | null = null;

  try {
    if ('headers' in req) {
      const headers = req.headers;
      if (typeof (headers as Headers).get === 'function') {
        const h = headers as Headers;
        ip = h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || null;
        userAgent = h.get('user-agent') || null;
      } else {
        const h = headers as Record<string, any>;
        const forwarded = h['x-forwarded-for'];
        ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() || (h['x-real-ip'] as string) || null;
        userAgent = (h['user-agent'] as string) || null;
      }
    }
  } catch {
    // Falha silenciosa na extração de headers
  }

  return { ip, userAgent };
}

class SystemLogger {
  constructor() {
    initDatabase();
  }

  private log(level: LogLevel, category: LogCategory, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();

    const { ip: reqIp, userAgent: reqUserAgent } = extractRequestInfo(context?.req);
    const ip = context?.ip || reqIp;
    const userAgent = context?.userAgent || reqUserAgent;
    const userId = context?.userId || null;
    const metadataStr = context?.metadata ? JSON.stringify(context.metadata) : null;

    // Log no console com formatação clara
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`;
    if (level === 'error') {
      console.error(`${prefix} ${message}`, metadataStr || '');
    } else if (level === 'warn' || level === 'security') {
      console.warn(`${prefix} ${message}`, metadataStr || '');
    } else {
      console.log(`${prefix} ${message}`, metadataStr || '');
    }

    // Persistência segura em SQLite
    try {
      const stmt = db.prepare(`
        INSERT INTO system_logs (id, timestamp, level, category, message, user_id, metadata, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, timestamp, level, category, message, userId, metadataStr, ip, userAgent);
    } catch (err) {
      console.error('[SystemLogger] Erro ao gravar log no banco SQLite:', (err as Error).message);
    }
  }

  public info(category: LogCategory, message: string, context?: LogContext) {
    this.log('info', category, message, context);
  }

  public warn(category: LogCategory, message: string, context?: LogContext) {
    this.log('warn', category, message, context);
  }

  public error(category: LogCategory, message: string, context?: LogContext) {
    this.log('error', category, message, context);
  }

  public security(category: LogCategory, message: string, context?: LogContext) {
    this.log('security', category, message, context);
  }

  public getRecentLogs(options?: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: string;
    limit?: number;
  }): SystemLogRecord[] {
    let sql = 'SELECT * FROM system_logs WHERE 1=1';
    const params: any[] = [];

    if (options?.level) {
      sql += ' AND level = ?';
      params.push(options.level);
    }
    if (options?.category) {
      sql += ' AND category = ?';
      params.push(options.category);
    }
    if (options?.userId) {
      sql += ' AND user_id = ?';
      params.push(options.userId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(options?.limit || 100);

    const stmt = db.prepare(sql);
    return stmt.all(...params) as SystemLogRecord[];
  }
}

export const logger = new SystemLogger();
