import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminMessagingRepository } from '@/db/adminMessagingRepository';
import { whatsappService } from '@/services/whatsappService';
import { TelegramNotifier } from '@/services/telegramNotifier';

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
    const repo = new AdminMessagingRepository();

    // Status de conectores
    const telegramNotifier = new TelegramNotifier();
    const telegramStatus = telegramNotifier.getStatus();
    const whatsappStatus = whatsappService.getStatus();

    if (searchParams.get('statsOnly') === 'true') {
      const stats = repo.getMessagingStats();
      return NextResponse.json({
        success: true,
        stats,
        connectors: {
          telegram: telegramStatus,
          whatsapp: whatsappStatus,
        },
      });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const canal = (searchParams.get('canal') as any) || 'all';
    const status = (searchParams.get('status') as any) || 'all';

    const result = repo.getMessagingLogs({
      page,
      limit,
      search,
      canal,
      status,
    });

    const stats = repo.getMessagingStats();

    return NextResponse.json({
      success: true,
      ...result,
      stats,
      connectors: {
        telegram: telegramStatus,
        whatsapp: whatsappStatus,
      },
    });
  } catch (err: any) {
    console.error('[API Admin Mensageria GET Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar dados de mensageria' },
      { status: 500 }
    );
  }
}
