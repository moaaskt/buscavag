import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { AdminRepository } from '@/db/adminRepository';
import {
  generateTotpSecret,
  generateTotpUri,
  generateQrCodeDataUrl,
  verifyTotpToken,
} from '@/lib/totp';
import {
  createAdminSessionToken,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

const SetupTotpSchema = z.object({
  adminId: z.string().min(1, 'ID de administrador obrigatório'),
  secret: z.string().min(10, 'Segredo inválido'),
  totpCode: z.string().min(6, 'Informe o código de 6 dígitos').max(6),
});

export async function GET(req: NextRequest) {
  try {
    const adminId = req.nextUrl.searchParams.get('adminId');
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'adminId é obrigatório' },
        { status: 400 }
      );
    }

    const repo = new AdminRepository();
    const admin = repo.getAdminById(adminId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    const secret = generateTotpSecret();
    const otpAuthUri = generateTotpUri(admin.email, secret);
    const qrCodeDataUrl = await generateQrCodeDataUrl(otpAuthUri);

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCodeDataUrl,
        email: admin.email,
      },
    });
  } catch (err: any) {
    console.error('[Setup TOTP GET Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar QR Code para 2FA' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SetupTotpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { adminId, secret, totpCode } = parsed.data;
    const repo = new AdminRepository();
    const admin = repo.getAdminById(adminId);

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Administrador não encontrado' },
        { status: 404 }
      );
    }

    const isValid = verifyTotpToken(totpCode, secret);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Código 2FA incorreto ou expirado. Tente novamente.' },
        { status: 400 }
      );
    }

    // Salva o segredo e ativa o 2FA
    repo.updateAdminTotp(admin.id, secret, true);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    logger.security('admin-auth', `2FA ativado com sucesso para ${admin.email}`, {
      user_id: admin.id,
      ip,
      user_agent: userAgent,
    });

    // Emite sessão de administrador
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

    const response = NextResponse.json({
      success: true,
      message: 'Autenticação em dois fatores configurada com sucesso!',
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
    console.error('[Setup TOTP POST Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao validar e persistir 2FA' },
      { status: 500 }
    );
  }
}
