import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CandidateRepository } from '@/db/candidateRepository';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logger } from '@/lib/logger';

const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const repo = new CandidateRepository();

    const user = repo.getUserByEmail(email);
    if (!user) {
      logger.security('auth', `Falha de login: usuário não encontrado (${email})`, { req });
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      logger.security('auth', `Falha de login: senha inválida para ${email}`, { userId: user.id, req });
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }

    logger.info('auth', `Login bem-sucedido: ${email} (${user.role})`, { userId: user.id, req });

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });

    return response;
  } catch (err) {
    console.error('[Login error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar login' },
      { status: 500 }
    );
  }
}
