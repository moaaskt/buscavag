import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminJobRepository, type JobStatus } from '@/db/adminJobRepository';

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
    const repo = new AdminJobRepository();

    // Se solicitado apenas as estatísticas de vagas
    if (searchParams.get('statsOnly') === 'true') {
      const stats = repo.getAdminJobStats();
      return NextResponse.json({ success: true, stats });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search') || '';
    const platform = searchParams.get('platform') || 'all';
    const status = (searchParams.get('status') as JobStatus | 'all') || 'all';
    const workModel = (searchParams.get('workModel') as any) || 'all';
    const category = searchParams.get('category') || 'all';

    const result = repo.getAdminJobs({
      page,
      limit,
      search,
      platform,
      status,
      workModel,
      category,
    });

    const stats = repo.getAdminJobStats();

    return NextResponse.json({
      success: true,
      ...result,
      stats,
    });
  } catch (err: any) {
    console.error('[API Admin Vagas Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar vagas administrativas' },
      { status: 500 }
    );
  }
}
