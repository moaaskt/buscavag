import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeAdminSessionTokenEdge } from '@/lib/admin-edge-auth';

const ADMIN_SESSION_COOKIE_NAME = 'admin_session';

// Rotas públicas administrativas (não exigem sessão prévia)
const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/api/admin/auth/login',
  '/api/admin/auth/setup-totp',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Proteção exclusiva de rotas administrativas /admin e /api/admin
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    // Permite livre acesso às rotas públicas de autenticação admin
    const isPublic = PUBLIC_ADMIN_PATHS.some((publicPath) => path === publicPath || path.startsWith(publicPath + '/'));
    const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    const session = token ? decodeAdminSessionTokenEdge(token) : null;

    if (isPublic) {
      // Se já estiver autenticado e tentar acessar /admin/login, redireciona para o painel
      if (path === '/admin/login' && session && session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    // Validação estrita da sessão de administrador
    if (!token || !session || session.role !== 'ADMIN') {
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Sessão administrativa ausente ou inválida' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

