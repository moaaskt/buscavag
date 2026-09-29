import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminMessagingRepository } from '@/db/adminMessagingRepository';

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

    const body = await req.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro logId é obrigatório para reenvio.' },
        { status: 400 }
      );
    }

    const repo = new AdminMessagingRepository();
    const result = await repo.resendFailedMessage(logId, sessionData.user);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API Admin Mensageria Resend POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao processar reenvio de mensagem' },
      { status: 500 }
    );
  }
}
