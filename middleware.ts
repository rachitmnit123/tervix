import { auth } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes protection ───────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Admin login page is public
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // All other admin routes require admin session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return NextResponse.next();
  }

  // ── User routes protection ────────────────────────────────────────────────
  const userSession = await auth();
  const isLoggedIn = !!userSession;
  const publicPaths = ['/login'];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next|favicon.ico|.*\\..*).*)',
  ],
};
