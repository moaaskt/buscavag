import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { LogRepository, type LogTipo, type LogNivel } from '@/db/logRepository';

export async function GET(req: NextRequest) {
  try {
    const sessionData = await getAdminSessionUser(req);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Sessão administrativa ausente ou inválida' },
        { status: 401 }
      );
    }

    const { searchParams } = req.nextUrl;
    const repo = new LogRepository();

    // Requisição exclusiva de origens distintas para o dropdown dinâmico
    if (searchParams.get('origins') === 'true') {
      const origins = repo.getDistinctOrigins();
      return NextResponse.json({ success: true, origins });
    }

    // Requisição exclusiva de estatísticas de logs
    if (searchParams.get('stats') === 'true') {
      const stats = repo.getLogStats();
      return NextResponse.json({ success: true, stats });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const tipo = (searchParams.get('tipo') as LogTipo | 'ALL') || 'ALL';
    const nivel = (searchParams.get('nivel') as LogNivel | 'ALL') || 'ALL';
    const origem = searchParams.get('origem') || 'ALL';
    const search = searchParams.get('search') || '';
    const period = (searchParams.get('period') as any) || '24h';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const result = repo.queryLogs({
      page,
      limit,
      tipo,
      nivel,
      origem,
      search,
      period,
      startDate,
      endDate,
    });

    // Retorna dados paginados com resumo analítico e lista de origens para otimizar requisições
    const stats = repo.getLogStats();
    const origins = repo.getDistinctOrigins();

    return NextResponse.json({
      success: true,
      ...result,
      stats,
      origins,
    });
  } catch (err: any) {
    console.error('[API Admin Logs Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar logs' },
      { status: 500 }
    );
  }
}
