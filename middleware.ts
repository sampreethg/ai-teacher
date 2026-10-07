export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/classroom/:path*',
    '/studio/:path*',
    '/api/chat',
    '/api/generate-lesson',
    '/api/upload',
    '/api/avatar/:path*',
  ],
};

