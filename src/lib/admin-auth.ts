import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { AdminRepository, type AdminSession, type AdminUser } from '@/db/adminRepository';

export const DEFAULT_ADMIN_AUTH_SECRET = 'buscavag-secret-key-admin-portal-2026-isolated-auth';
export const ADMIN_SESSION_COOKIE_NAME = 'admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 2 * 60 * 60; // 2 horas

let cachedAdminSecret: string | null = null;

/**
 * Validação de segurança estrita do ADMIN_JWT_SECRET em produção.
 */
export function validateAdminAuthSecret(
  secret: string | undefined = process.env.ADMIN_JWT_SECRET,
  nodeEnv: string | undefined = process.env.NODE_ENV
): string {
  const isProd = nodeEnv === 'production';
  if (isProd) {
    if (!secret || secret.trim() === '') {
      throw new Error('🚨 [FATAL_SECURITY] ADMIN_JWT_SECRET environment variable is missing in production!');
    }
    if (secret === DEFAULT_ADMIN_AUTH_SECRET) {
      throw new Error('🚨 [FATAL_SECURITY] ADMIN_JWT_SECRET cannot use default hardcoded secret in production!');
    }
    if (secret.length < 32) {
      throw new Error(`🚨 [FATAL_SECURITY] ADMIN_JWT_SECRET must have at least 32 characters in production! (Found ${secret.length})`);
    }
    return secret;
  }
  return secret || DEFAULT_ADMIN_AUTH_SECRET;
}

export function getAdminAuthSecret(): string {
  if (cachedAdminSecret) return cachedAdminSecret;
  cachedAdminSecret = validateAdminAuthSecret(process.env.ADMIN_JWT_SECRET, process.env.NODE_ENV);
  return cachedAdminSecret;
}

export function resetAdminAuthSecretCache(): void {
  cachedAdminSecret = null;
}

export interface AdminSessionPayload {
  adminId: string;
  email: string;
  name: string;
  role: 'ADMIN';
  sessionId: string;
  exp?: number;
}

/**
 * Gera hash SHA-256 seguro para armazenamento em banco (evitando vazamento do token bruto).
 */
export function hashTokenForStorage(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Cria token de sessão JWT isolado para administradores.
 */
export function createAdminSessionToken(
  payload: Omit<AdminSessionPayload, 'exp'>,
  expiresInSeconds: number = ADMIN_SESSION_TTL_SECONDS
): { token: string; tokenHash: string; expiresAt: string } {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = { ...payload, exp };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Body = Buffer.from(JSON.stringify(body)).toString('base64url');
  const data = `${b64Header}.${b64Body}`;

  const secret = getAdminAuthSecret();
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const token = `${data}.${signature}`;
  const tokenHash = hashTokenForStorage(token);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return { token, tokenHash, expiresAt };
}

/**
 * Valida a integridade criptográfica e expiração do token admin.
 */
export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [b64Header, b64Body, signature] = parts;
    const data = `${b64Header}.${b64Body}`;

    const secret = getAdminAuthSecret();
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(b64Body, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    if (payload.role !== 'ADMIN' || !payload.adminId || !payload.sessionId) {
      return null;
    }

    return {
      adminId: payload.adminId,
      email: payload.email,
      name: payload.name,
      role: 'ADMIN',
      sessionId: payload.sessionId,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Obtém o admin logado validando token JWT e status ativo em admin_sessions.
 */
export async function getAdminSessionUser(
  req?: NextRequest
): Promise<{ payload: AdminSessionPayload; session: AdminSession; user: AdminUser } | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    } catch {
      token = undefined;
    }
  }

  if (!token) return null;

  const payload = verifyAdminSessionToken(token);
  if (!payload) return null;

  const repo = new AdminRepository();
  const tokenHash = hashTokenForStorage(token);
  const session = repo.getSessionByTokenHash(tokenHash);

  if (!session) return null;

  // Checa se a sessão expirou no banco
  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  if (expiresAt < now) {
    repo.revokeSession(session.id);
    return null;
  }

  const user = repo.getAdminById(payload.adminId);
  if (!user) return null;

  // Sliding expiration: se faltar menos de 60 minutos para expirar, estende mais 2h
  const remainingMs = expiresAt.getTime() - now.getTime();
  if (remainingMs < 60 * 60 * 1000) {
    const newExpiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000).toISOString();
    repo.touchSession(session.id, newExpiresAt);
    session.expires_at = newExpiresAt;
  }

  return { payload, session, user };
}
