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

    // Reverte tier para free no SQLite
    repo.updateUserTier(session.userId, 'free');

    const updatedSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      tier: 'free' as const,
    };
    const newToken = createSessionToken(updatedSession);

    const response = NextResponse.json({
      success: true,
      message: 'Plano revertido para Gratuito.',
      user: updatedSession,
    });

    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Error in POST /api/saas/cancel:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao reverter plano' },
      { status: 500 }
    );
  }
}
