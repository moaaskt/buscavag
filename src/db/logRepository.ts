import { db, initDatabase } from './index';
import crypto from 'crypto';

export type LogTipo = 'sistema' | 'acao' | 'mensageria';
export type LogNivel = 'info' | 'warning' | 'error' | 'security';

export interface LogEntry {
  id: string;
  tipo: LogTipo;
  nivel: LogNivel;
  origem: string;
  mensagem: string;
  metadata: string | null;
  created_at: string;
}

export interface CreateLogDTO {
  id?: string;
  tipo: LogTipo;
  nivel: LogNivel;
  origem: string;
  mensagem: string;
  metadata?: Record<string, any> | string | null;
  created_at?: string;
}

export interface LogFilterParams {
  tipo?: LogTipo | 'ALL';
  nivel?: LogNivel | 'ALL';
  origem?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  period?: '1h' | '24h' | '7d' | '30d' | 'ALL';
  page?: number;
  limit?: number;
}

export interface PaginatedLogsResult {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LogStatsSummary {
  total24h: number;
  acoes24h: number;
  warnings24h: number;
  errors24h: number;
  security24h: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
}

export class LogRepository {
  constructor() {
    initDatabase();
  }

  insertLog(data: CreateLogDTO): LogEntry {
    const id = data.id || crypto.randomUUID();
    const created_at = data.created_at || new Date().toISOString();
    const metadataStr =
      data.metadata === undefined || data.metadata === null
        ? null
        : typeof data.metadata === 'string'
        ? data.metadata
        : JSON.stringify(data.metadata);

    const stmt = db.prepare(`
      INSERT INTO logs (id, tipo, nivel, origem, mensagem, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.tipo, data.nivel, data.origem, data.mensagem, metadataStr, created_at);

    return {
      id,
      tipo: data.tipo,
      nivel: data.nivel,
      origem: data.origem,
      mensagem: data.mensagem,
      metadata: metadataStr,
      created_at,
    };
  }

  queryLogs(params: LogFilterParams = {}): PaginatedLogsResult {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const queryParams: any[] = [];

    // Filtro por tipo
    if (params.tipo && params.tipo !== 'ALL') {
      whereClauses.push('tipo = ?');
      queryParams.push(params.tipo);
    }

    // Filtro por nível
    if (params.nivel && params.nivel !== 'ALL') {
      whereClauses.push('nivel = ?');
      queryParams.push(params.nivel);
    }

    // Filtro por origem
    if (params.origem && params.origem !== 'ALL') {
      whereClauses.push('origem = ?');
      queryParams.push(params.origem);
    }

    // Busca textual na mensagem ou origem
    if (params.search && params.search.trim()) {
      whereClauses.push('(LOWER(mensagem) LIKE ? OR LOWER(origem) LIKE ?)');
      const term = `%${params.search.trim().toLowerCase()}%`;
      queryParams.push(term, term);
    }

    // Filtro por período predefinido
    if (params.period && params.period !== 'ALL') {
      if (params.period === '1h') {
        whereClauses.push("created_at >= datetime('now', '-1 hour')");
      } else if (params.period === '24h') {
        whereClauses.push("created_at >= datetime('now', '-24 hours')");
      } else if (params.period === '7d') {
        whereClauses.push("created_at >= datetime('now', '-7 days')");
      } else if (params.period === '30d') {
        whereClauses.push("created_at >= datetime('now', '-30 days')");
      }
    }

    // Filtros por datas explícitas
    if (params.startDate) {
      whereClauses.push('created_at >= ?');
      queryParams.push(params.startDate);
    }
    if (params.endDate) {
      whereClauses.push('created_at <= ?');
      queryParams.push(params.endDate);
    }

    const whereSql = whereClauses.join(' AND ');

    // Contagem total para paginação
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM logs WHERE ${whereSql}`);
    const { total } = countStmt.get(...queryParams) as { total: number };

    // Consulta dos registros ordenados por data decrescente
    const dataStmt = db.prepare(`
      SELECT * FROM logs
      WHERE ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const logs = dataStmt.all(...queryParams, limit, offset) as LogEntry[];
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      logs,
      total,
      page,
      limit,
      totalPages,
    };
  }
  getDistinctOrigins(): string[] {
    const stmt = db.prepare(`
      SELECT DISTINCT origem
      FROM logs
      WHERE origem IS NOT NULL AND origem != ''
      ORDER BY origem ASC
    `);
    const rows = stmt.all() as Array<{ origem: string }>;
    return rows.map((r) => r.origem).sort((a, b) => a.localeCompare(b));
  }

  getLogStats(periodHours: number = 24): LogStatsSummary {
    const cutoff = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM logs WHERE created_at >= ?
    `);
    const { total: total24h } = countStmt.get(cutoff) as { total: number };

    const typeStmt = db.prepare(`
      SELECT tipo, COUNT(*) as count FROM logs WHERE created_at >= ? GROUP BY tipo
    `);
    const typeRows = typeStmt.all(cutoff) as Array<{ tipo: string; count: number }>;
    const byType: Record<string, number> = {};
    for (const r of typeRows) {
      byType[r.tipo] = r.count;
    }

    const levelStmt = db.prepare(`
      SELECT nivel, COUNT(*) as count FROM logs WHERE created_at >= ? GROUP BY nivel
    `);
    const levelRows = levelStmt.all(cutoff) as Array<{ nivel: string; count: number }>;
    const byLevel: Record<string, number> = {};
    for (const r of levelRows) {
      byLevel[r.nivel] = r.count;
    }

    return {
      total24h,
      acoes24h: byType['acao'] || 0,
      warnings24h: byLevel['warning'] || 0,
      errors24h: byLevel['error'] || 0,
      security24h: byLevel['security'] || 0,
      byType,
      byLevel,
    };
  }

  purgeLogsOlderThan(days: number): number {
    const stmt = db.prepare(`
      DELETE FROM logs WHERE created_at < datetime('now', '-' || ? || ' days')
    `);
    const info = stmt.run(days);
    return info.changes;
  }
}
