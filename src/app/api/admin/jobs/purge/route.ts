import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminJobRepository } from '@/db/adminJobRepository';
import { logAdminAction, logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let authType: 'session' | 'cron' | null = null;
    let adminUser: { id: string; email: string; name?: string } | null = null;

    // 1. Tenta autenticação via sessão administrativa
    const sessionData = await getAdminSessionUser(req);
    if (sessionData) {
      authType = 'session';
      adminUser = sessionData.user;
    } else {
      // 2. Tenta autenticação via Bearer token (para crontab na VPS)
      const authHeader = req.headers.get('authorization') || '';
      const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_JWT_SECRET;

      if (authHeader.startsWith('Bearer ') && cronSecret) {
        const token = authHeader.substring(7).trim();
        if (token === cronSecret) {
          authType = 'cron';
        }
      }
    }

    if (!authType) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado: sessão ou CRON_SECRET obrigatórios' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const repo = new AdminJobRepository();
    const retentionDays = typeof body.retentionDays === 'number' && body.retentionDays > 0
      ? body.retentionDays
      : undefined;

    // Modo Pré-visualização
    if (body.preview === true) {
      const previewResult = repo.previewPurge(retentionDays);
      return NextResponse.json({
        success: true,
        preview: true,
        ...previewResult,
      });
    }

    // Modo Execução Efetiva do Expurgo em Lotes
    const purgeResult = repo.executeBatchPurge(retentionDays, 500);

    const logDetails = {
      retentionDays: purgeResult.retentionDays,
      totalDeleted: purgeResult.totalDeleted,
      batches: purgeResult.batches,
      reclaimedDisk: purgeResult.reclaimedDisk,
      triggerBy: authType,
    };

    if (adminUser) {
      logAdminAction(
        adminUser,
        `Execução de expurgo seguro de vagas (${purgeResult.totalDeleted} removidas)`,
        logDetails,
        req
      );
    } else {
      logger.info(
        'jobs',
        `Expurgo automatizado via cron concluído: ${purgeResult.totalDeleted} vagas removidas em ${purgeResult.batches} lotes.`,
        { metadata: logDetails }
      );
    }

    return NextResponse.json({
      success: true,
      preview: false,
      ...purgeResult,
      message: `${purgeResult.totalDeleted} vagas expiradas foram expurgadas com sucesso em ${purgeResult.batches} lotes.`,
    });
  } catch (err: any) {
    console.error('[API Admin Jobs Purge Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar expurgo de vagas' },
      { status: 500 }
    );
  }
}
