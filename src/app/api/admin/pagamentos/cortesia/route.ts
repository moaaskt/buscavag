import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminPaymentRepository } from '@/db/adminPaymentRepository';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionData = await getAdminSessionUser(req);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Sessão administrativa ausente ou inválida' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { userId, days, reason } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Identificador do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const numDays = Math.max(1, parseInt(days || '30', 10));
    const justification = (reason || 'Cortesia concedida pelo suporte administrativo').trim();

    const repo = new AdminPaymentRepository();
    const result = repo.grantCourtesySubscription(userId, numDays, justification, sessionData.user);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result,
      message: `Cortesia Pro concedida com sucesso por ${numDays} dias`,
    });
  } catch (err: any) {
    console.error('[API Admin Cortesia Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao conceder cortesia Pro' },
      { status: 500 }
    );
  }
}
