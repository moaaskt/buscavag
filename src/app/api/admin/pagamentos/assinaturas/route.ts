import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminPaymentRepository } from '@/db/adminPaymentRepository';

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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || 'all';

    const repo = new AdminPaymentRepository();
    const result = repo.getAdminSubscriptions({ page, limit, status });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('[API Admin Assinaturas Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar assinaturas dos usuários' },
      { status: 500 }
    );
  }
}
