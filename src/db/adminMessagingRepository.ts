import { db, initDatabase } from './index';
import crypto from 'crypto';
import { logAdminAction } from '@/lib/logger';
import { whatsappService } from '@/services/whatsappService';
import { TelegramNotifier } from '@/services/telegramNotifier';

export interface MessagingStats {
  totalSent: number;
  telegramCount: number;
  whatsappCount: number;
  failedCount: number;
  successRate: number; // Porcentagem (0 - 100)
}

export interface MessagingLogEntry {
  id: string;
  tipo: string;
  nivel: string;
  origem: string;
  mensagem: string;
  canal: 'telegram' | 'whatsapp' | 'desconhecido';
  destinatario?: string;
  status: 'delivered' | 'failed' | 'pending';
  provider?: string;
  messageId?: string;
  error?: string;
  preview?: string;
  isMock: boolean;
  metadata: string | null;
  created_at: string;
}

export interface MessagingFilterParams {
  canal?: 'all' | 'telegram' | 'whatsapp';
  status?: 'all' | 'delivered' | 'failed';
  search?: string;
  page?: number;
  limit?: number;
}

export class AdminMessagingRepository {
  constructor() {
    initDatabase();
  }

  /**
   * Retorna estatísticas agregadas de mensageria calculadas em tempo real a partir dos logs de mensageria.
   */
  public getMessagingStats(): MessagingStats {
    try {
      const stmt = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN nivel = 'error' THEN 1 ELSE 0 END) as failures,
          SUM(CASE WHEN LOWER(mensagem) LIKE '%[telegram]%' OR (metadata IS NOT NULL AND LOWER(metadata) LIKE '%"canal":"telegram"%') THEN 1 ELSE 0 END) as telegramCount,
          SUM(CASE WHEN LOWER(mensagem) LIKE '%[whatsapp]%' OR (metadata IS NOT NULL AND LOWER(metadata) LIKE '%"canal":"whatsapp"%') THEN 1 ELSE 0 END) as whatsappCount
        FROM logs
        WHERE origem = 'mensageria' OR tipo = 'mensageria'
      `);

      const row = stmt.get() as {
        total: number;
        failures: number;
        telegramCount: number;
        whatsappCount: number;
      };

      const totalSent = Number(row?.total || 0);
      const failedCount = Number(row?.failures || 0);
      const telegramCount = Number(row?.telegramCount || 0);
      const whatsappCount = Number(row?.whatsappCount || 0);

      const successCount = Math.max(0, totalSent - failedCount);
      const successRate = totalSent > 0 ? Number(((successCount / totalSent) * 100).toFixed(1)) : 100;

      return {
        totalSent,
        telegramCount,
        whatsappCount,
        failedCount,
        successRate,
      };
    } catch (err) {
      console.error('[AdminMessagingRepository] Erro ao obter estatísticas de mensageria:', err);
      return {
        totalSent: 0,
        telegramCount: 0,
        whatsappCount: 0,
        failedCount: 0,
        successRate: 100,
      };
    }
  }

  /**
   * Consulta logs de mensageria paginados e filtrados com deserialização de metadata.
   */
  public getMessagingLogs(params: MessagingFilterParams = {}): {
    logs: MessagingLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ["(origem = 'mensageria' OR tipo = 'mensageria')"];
    const queryParams: any[] = [];

    // Filtro por Canal
    if (params.canal && params.canal !== 'all') {
      if (params.canal === 'telegram') {
        whereClauses.push('(LOWER(mensagem) LIKE ? OR (metadata IS NOT NULL AND LOWER(metadata) LIKE ?))');
        queryParams.push('%[telegram]%', '%"canal":"telegram"%');
      } else if (params.canal === 'whatsapp') {
        whereClauses.push('(LOWER(mensagem) LIKE ? OR (metadata IS NOT NULL AND LOWER(metadata) LIKE ?))');
        queryParams.push('%[whatsapp]%', '%"canal":"whatsapp"%');
      }
    }

    // Filtro por Status
    if (params.status && params.status !== 'all') {
      if (params.status === 'delivered') {
        whereClauses.push("nivel != 'error'");
      } else if (params.status === 'failed') {
        whereClauses.push("nivel = 'error'");
      }
    }

    // Filtro por Busca Textual
    if (params.search && params.search.trim()) {
      whereClauses.push('(LOWER(mensagem) LIKE ? OR (metadata IS NOT NULL AND LOWER(metadata) LIKE ?))');
      const term = `%${params.search.trim().toLowerCase()}%`;
      queryParams.push(term, term);
    }

    const whereSql = whereClauses.join(' AND ');

    // Contagem
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM logs WHERE ${whereSql}`);
    const { total } = countStmt.get(...queryParams) as { total: number };

    // Registros
    const dataStmt = db.prepare(`
      SELECT * FROM logs
      WHERE ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rawRows = dataStmt.all(...queryParams, limit, offset) as any[];

    const logs: MessagingLogEntry[] = rawRows.map((row) => {
      let canal: 'telegram' | 'whatsapp' | 'desconhecido' = 'desconhecido';
      let status: 'delivered' | 'failed' | 'pending' = row.nivel === 'error' ? 'failed' : 'delivered';
      let destinatario: string | undefined = undefined;
      let provider: string | undefined = undefined;
      let messageId: string | undefined = undefined;
      let error: string | undefined = undefined;
      let preview: string | undefined = undefined;
      let isMock = false;

      if (row.metadata) {
        try {
          const parsed = JSON.parse(row.metadata);
          if (parsed.canal === 'telegram') canal = 'telegram';
          if (parsed.canal === 'whatsapp') canal = 'whatsapp';
          if (parsed.destinatario) destinatario = parsed.destinatario;
          if (parsed.provider) provider = parsed.provider;
          if (parsed.messageId) messageId = parsed.messageId;
          if (parsed.error) error = parsed.error;
          if (parsed.preview) preview = parsed.preview;
          if (parsed.mock) isMock = true;
          if (parsed.status) status = parsed.status;
        } catch {
          // ignora
        }
      }

      if (canal === 'desconhecido') {
        if (/\[telegram\]/i.test(row.mensagem)) canal = 'telegram';
        if (/\[whatsapp\]/i.test(row.mensagem)) canal = 'whatsapp';
      }

      return {
        id: row.id,
        tipo: row.tipo,
        nivel: row.nivel,
        origem: row.origem,
        mensagem: row.mensagem,
        canal,
        destinatario,
        status,
        provider,
        messageId,
        error,
        preview,
        isMock,
        metadata: row.metadata,
        created_at: row.created_at,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      logs,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Reenvia manualmente uma mensagem que falhou com registro em auditoria.
   */
  public async resendFailedMessage(
    logId: string,
    adminUser: { id?: string; email?: string; name?: string } | null
  ): Promise<{ success: boolean; message: string; newLogId?: string }> {
    const stmt = db.prepare('SELECT * FROM logs WHERE id = ?');
    const logRow = stmt.get(logId) as any;

    if (!logRow) {
      throw new Error(`Registro de log "${logId}" não encontrado.`);
    }

    let parsedMeta: Record<string, any> = {};
    if (logRow.metadata) {
      try {
        parsedMeta = JSON.parse(logRow.metadata);
      } catch {
        parsedMeta = {};
      }
    }

    const canal = parsedMeta.canal || (/\[telegram\]/i.test(logRow.mensagem) ? 'telegram' : 'whatsapp');
    const destinatario = parsedMeta.destinatario || '';
    const preview = parsedMeta.preview || logRow.mensagem;

    let resendSuccess = false;

    if (canal === 'whatsapp') {
      const res = await whatsappService.sendMessage(destinatario, preview || 'Reenvio de notificação BuscaVag');
      resendSuccess = res.success;
    } else {
      const notifier = new TelegramNotifier();
      const res = await notifier.sendMessage(destinatario, preview || 'Reenvio de notificação BuscaVag');
      resendSuccess = res.success;
    }

    // Auditoria de Ação Administrativa
    logAdminAction(
      adminUser,
      `Reenvio manual de mensagem (${canal})`,
      {
        originalLogId: logId,
        canal,
        destinatario,
        resendSuccess,
      }
    );

    return {
      success: resendSuccess,
      message: resendSuccess ? 'Mensagem reenviada com sucesso' : 'Falha ao reenviar mensagem',
    };
  }
}
