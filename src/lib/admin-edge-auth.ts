export interface AdminEdgeSession {
  adminId: string;
  email: string;
  name: string;
  role: 'ADMIN';
  sessionId: string;
  exp: number;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Decodifica o token admin_session no Edge runtime (Middleware).
 * Valida formato JWT, role === 'ADMIN' e expiração temporal.
 * As rotas de API (Node.js runtime) farão a verificação criptográfica estrita com chave HMAC.
 */
export function decodeAdminSessionTokenEdge(token: string): AdminEdgeSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const b64Body = parts[1];
    const payload = JSON.parse(base64UrlDecode(b64Body));

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
