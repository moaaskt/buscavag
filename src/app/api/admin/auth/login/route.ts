import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { AdminRepository } from '@/db/adminRepository';
import { verifyPassword } from '@/lib/auth';
import {
  createAdminSessionToken,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from '@/lib/admin-auth';
import { isTotpEnabledGlobally, verifyTotpToken } from '@/lib/totp';
import { logger } from '@/lib/logger';

const AdminLoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
  totpCode: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AdminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { email, password, totpCode } = parsed.data;
    const repo = new AdminRepository();
    repo.ensureSeedAdmin();

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const admin = repo.getAdminByEmail(email);
    if (!admin) {
      logger.security('admin-auth', `Falha de login admin: usuário não encontrado (${email})`, {
        ip,
        user_agent: userAgent,
        metadata: { email },
      });
      return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isValidPassword = verifyPassword(password, admin.password_hash);
    if (!isValidPassword) {
      logger.security('admin-auth', `Falha de login admin: senha inválida para ${email}`, {
        user_id: admin.id,
        ip,
        user_agent: userAgent,
        metadata: { email },
      });
      return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 });
    }

    const totpGlobal = isTotpEnabledGlobally();

    // Caso o 2FA esteja ativado globalmente e o admin ainda não tenha configurado seu segredo
    if (totpGlobal && (!admin.totp_enabled || !admin.totp_secret)) {
      return NextResponse.json({
        success: true,
        requireSetupTotp: true,
        adminId: admin.id,
        email: admin.email,
        message: 'Configuração inicial de 2FA obrigatória',
      });
    }

    // Se o usuário possui 2FA ativado (ou globalmente exigido)
    if (admin.totp_enabled && admin.totp_secret) {
      if (!totpCode || !totpCode.trim()) {
        return NextResponse.json(
          { success: false, requireTotp: true, error: 'Informe o código de verificação 2FA (6 dígitos)' },
          { status: 401 }
        );
      }

      const isTotpValid = verifyTotpToken(totpCode, admin.totp_secret);
      if (!isTotpValid) {
        logger.security('admin-auth', `Falha de login admin: código 2FA inválido para ${email}`, {
          user_id: admin.id,
          ip,
          user_agent: userAgent,
          metadata: { email },
        });
        return NextResponse.json(
          { success: false, requireTotp: true, error: 'Código 2FA incorreto ou expirado' },
          { status: 401 }
        );
      }
    }

    // Autenticação bem-sucedida: emite sessão isolada
    const sessionId = crypto.randomUUID();
    const { token, tokenHash, expiresAt } = createAdminSessionToken({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'ADMIN',
      sessionId,
    });

    repo.createSession({
      id: sessionId,
      admin_user_id: admin.id,
      token_hash: tokenHash,
      ip_address: ip,
      user_agent: userAgent,
      expires_at: expiresAt,
    });

    repo.updateLastLogin(admin.id);

    logger.info('admin-auth', `Login administrativo bem-sucedido: ${email}`, {
      user_id: admin.id,
      ip,
      user_agent: userAgent,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: ADMIN_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (err: any) {
    console.error('[Admin Login Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar login administrativo' },
      { status: 500 }
    );
  }
}
