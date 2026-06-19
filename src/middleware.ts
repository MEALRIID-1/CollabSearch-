import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/projects', '/publications', '/calendar', '/messages', '/notifications', '/profile', '/admin'];
const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('collabsearch_token')?.value;
  const { pathname } = request.nextUrl;

  // Rediriger vers login si pas authentifié et accès à une page protégée
  if (!token && protectedPaths.some((path) => pathname.startsWith(path))) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rediriger vers dashboard si déjà authentifié et accès à une page auth
  if (token && authPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*', '/publications/:path*', '/calendar/:path*', '/messages/:path*', '/notifications/:path*', '/profile/:path*', '/admin/:path*', '/auth/:path*'],
};
