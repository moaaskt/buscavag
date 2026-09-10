import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /admin and /api/admin routes
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    
    if (!token) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const session = verifySessionToken(token);
    
    // Only users with ADMIN role can access these routes
    if (!session || session.role !== 'ADMIN') {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
      }
      // Redirect non-admins trying to access admin pages to the home page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
