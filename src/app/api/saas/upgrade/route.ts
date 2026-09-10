import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const repo = new CandidateRepository();
    const user = repo.getUserById(session.userId);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Atualiza tier para premium no SQLite
    repo.updateUserTier(session.userId, 'premium');

    // Emite novo token de sessão com tier = premium
    const updatedSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      tier: 'premium' as const,
    };
    const newToken = createSessionToken(updatedSession);

    const response = NextResponse.json({
      success: true,
      message: 'Parabéns! Sua conta foi atualizada para o Plano Premium Pro com sucesso!',
      user: updatedSession,
    });

    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });

    return response;
  } catch (error: any) {
    console.error('Error in POST /api/saas/upgrade:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar upgrade de plano' },
      { status: 500 }
    );
  }
}
