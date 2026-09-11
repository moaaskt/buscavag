export interface UserSession {
  userId: string;
  email: string;
  name: string;
  tier: 'free' | 'premium';
  role: 'GUEST' | 'CANDIDATE' | 'ADMIN';
}

const AUTH_SECRET = process.env.AUTH_SECRET || 'buscavag-secret-key-candidate-portal-2026-secure-auth';

function base64UrlDecode(str: string) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

// Uma função simples só para decodificar o payload no middleware (Onde o Edge não suporta Node crypto Hmac sync)
// Atenção: O middleware apenas lê a role para roteamento da UI. As rotas de API (Node) farão a verificação criptográfica real de assinatura.
export function decodeSessionTokenEdge(token: string): UserSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const b64Body = parts[1];
    const payload = JSON.parse(base64UrlDecode(b64Body));
    
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
