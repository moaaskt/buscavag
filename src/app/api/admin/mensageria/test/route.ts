import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { whatsappService } from '@/services/whatsappService';
import { TelegramNotifier } from '@/services/telegramNotifier';
import { logAdminAction } from '@/lib/logger';

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
    const { canal, destinatario, mensagem, parseMode } = body;

    if (!canal || !mensagem) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros canal e mensagem são obrigatórios.' },
        { status: 400 }
      );
    }

    let sendResult: { success: boolean; messageId?: string; mock?: boolean; error?: string };

    if (canal === 'whatsapp') {
      sendResult = await whatsappService.sendMessage(destinatario || '', mensagem);
    } else if (canal === 'telegram') {
      const notifier = new TelegramNotifier();
      sendResult = await notifier.sendMessage(destinatario || '', mensagem, parseMode || 'HTML');
    } else {
      return NextResponse.json(
        { success: false, error: `Canal inválido: ${canal}. Utilize 'whatsapp' ou 'telegram'.` },
        { status: 400 }
      );
    }

    // Auditoria de Ação do Administrador
    logAdminAction(
      sessionData.user,
      `Envio de mensagem de teste (${canal})`,
      {
        canal,
        destinatario: destinatario || 'default',
        mensagemPreview: mensagem.slice(0, 100),
        resultSuccess: sendResult.success,
        mock: !!sendResult.mock,
      },
      req
    );

    return NextResponse.json({
      success: sendResult.success,
      messageId: sendResult.messageId,
      mock: sendResult.mock,
      error: sendResult.error,
    });
  } catch (err: any) {
    console.error('[API Admin Mensageria Test POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao disparar mensagem de teste' },
      { status: 500 }
    );
  }
}
