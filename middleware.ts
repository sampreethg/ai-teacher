import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const { pathname, search } = req.nextUrl;
    const isAuth = !!token;
    const isAuthRoute = pathname === '/login' || pathname === '/register';

    // 1. If user is already authenticated and visits login/register, redirect to dashboard
    if (isAuthRoute) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // 2. If unauthenticated request hits a protected API endpoint, return 401 JSON instead of redirecting to login page
    if (!isAuth && pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required to access this endpoint.' },
        { status: 401 }
      );
    }

    // 3. If unauthenticated request hits a protected page, redirect to /login with callbackUrl
    if (!isAuth) {
      const callbackUrl = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Allow middleware handler above to inspect token and determine routing / JSON response
      authorized: () => true,
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/classroom/:path*',
    '/studio/:path*',
    '/profile/:path*',
    '/login',
    '/register',
    '/api/chat/:path*',
    '/api/generate-lesson/:path*',
    '/api/upload/:path*',
    '/api/avatar/:path*',
    '/api/lessons/:path*',
    '/api/quiz/:path*',
  ],
};

