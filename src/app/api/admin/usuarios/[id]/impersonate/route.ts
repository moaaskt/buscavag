import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { CandidateRepository } from '@/db/candidateRepository';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAdminAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionData = await getAdminSessionUser(req);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Sessão administrativa ausente ou inválida' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de usuário não fornecido' },
        { status: 400 }
      );
    }

    const candidateRepo = new CandidateRepository();
    const user = candidateRepo.getUserById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: 'Não é possível personificar um usuário com conta suspensa' },
        { status: 403 }
      );
    }

    // Emissão do token de candidato assinado com metadados de suporte
    const candidateToken = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      role: user.role,
      impersonatedBy: {
        adminId: sessionData.user.id,
        adminEmail: sessionData.user.email,
      },
    });

    logAdminAction(
      sessionData.user,
      `Acesso em Suporte (Impersonate) na conta de ${user.email}`,
      {
        targetUserId: user.id,
        targetEmail: user.email,
        targetTier: user.tier,
      },
      req
    );

    const response = NextResponse.json({
      success: true,
      redirectUrl: '/candidate',
      message: `Sessão de suporte iniciada para ${user.email}`,
    });

    // Define o cookie buscavag_session no navegador
    response.cookies.set(SESSION_COOKIE_NAME, candidateToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60, // 2 horas para janela de suporte
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('[API Admin Impersonate Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao iniciar sessão de suporte' },
      { status: 500 }
    );
  }
}
