import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const sessionData = await getAdminSessionUser(req);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Sessão administrativa ausente ou inválida' },
        { status: 401 }
      );
    }

    const { user } = sessionData;
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        totp_enabled: user.totp_enabled === 1,
        last_login_at: user.last_login_at,
      },
    });
  } catch (err: any) {
    console.error('[Admin Me Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar sessão' },
      { status: 500 }
    );
  }
}
