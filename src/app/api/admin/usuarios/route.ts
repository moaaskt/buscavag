import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminUserRepository } from '@/db/adminUserRepository';

export const dynamic = 'force-dynamic';

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
    const repo = new AdminUserRepository();

    if (searchParams.get('statsOnly') === 'true') {
      const stats = repo.getAdminUserStats();
      return NextResponse.json({ success: true, stats });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const tier = (searchParams.get('tier') as any) || 'all';
    const status = (searchParams.get('status') as any) || 'all';
    const role = (searchParams.get('role') as any) || 'all';

    const result = repo.getAdminUsers({
      page,
      limit,
      search,
      tier,
      status,
      role,
    });

    const stats = repo.getAdminUserStats();

    return NextResponse.json({
      success: true,
      ...result,
      stats,
    });
  } catch (err: any) {
    console.error('[API Admin Usuarios GET Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar usuários' },
      { status: 500 }
    );
  }
}
