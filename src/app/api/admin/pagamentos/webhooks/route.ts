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
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const repo = new AdminPaymentRepository();
    const webhooks = repo.getRecentWebhooks(limit);

    return NextResponse.json({
      success: true,
      webhooks,
    });
  } catch (err: any) {
    console.error('[API Admin Webhooks Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar webhooks de pagamento' },
      { status: 500 }
    );
  }
}
