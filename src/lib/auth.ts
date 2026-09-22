import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export const DEFAULT_AUTH_SECRET = 'buscavag-secret-key-candidate-portal-2026-secure-auth';

/**
 * Validação estrita de segurança do AUTH_SECRET (REQ-07).
 * Em ambiente de produção (NODE_ENV=production), a aplicação bloqueia fatalmente
 * a inicialização se AUTH_SECRET estiver ausente, usar a chave padrão ou tiver menos de 32 caracteres.
 * Em development ou test, utiliza o segredo fornecido ou o fallback local para DX.
 */
export function validateAuthSecretSecurity(
  secret: string | undefined = process.env.AUTH_SECRET,
  nodeEnv: string | undefined = process.env.NODE_ENV
): string {
  const isProd = nodeEnv === 'production';
  if (isProd) {
    if (!secret || secret.trim() === '') {
      throw new Error('🚨 [FATAL_SECURITY] AUTH_SECRET environment variable is missing in production!');
    }
    if (secret === DEFAULT_AUTH_SECRET) {
      throw new Error('🚨 [FATAL_SECURITY] AUTH_SECRET cannot use the default hardcoded secret in production!');
    }
    if (secret.length < 32) {
      throw new Error(`🚨 [FATAL_SECURITY] AUTH_SECRET must have at least 32 characters in production! (Found ${secret.length})`);
    }
    return secret;
  }
  return secret || DEFAULT_AUTH_SECRET;
}

const AUTH_SECRET = validateAuthSecretSecurity();
export const SESSION_COOKIE_NAME = 'buscavag_session';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  tier: 'free' | 'premium';
  role: 'GUEST' | 'CANDIDATE' | 'ADMIN';
}

/**
 * Gera hash seguro de senha utilizando scrypt com salt aleatório.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Compara a senha informada com o hash scrypt armazenado.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
  } catch {
    return false;
  }
}

/**
 * Cria token de sessão assinado HMAC-SHA256 (com expiração em 7 dias).
 */
export function createSessionToken(payload: UserSession): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 dias
  const body = { ...payload, exp };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Body = Buffer.from(JSON.stringify(body)).toString('base64url');
  const data = `${b64Header}.${b64Body}`;

  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Valida a assinatura e expiração do token de sessão.
 */
export function verifySessionToken(token: string): UserSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [b64Header, b64Body, signature] = parts;
    const data = `${b64Header}.${b64Body}`;

    const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(b64Body, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      tier: payload.tier || 'free',
      role: payload.role || 'CANDIDATE',
    };
  } catch {
    return null;
  }
}

/**
 * Extrai o usuário da sessão a partir dos cookies do Next.js ou request.
 */
export async function getSessionUser(req?: NextRequest): Promise<UserSession | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      token = undefined;
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}
