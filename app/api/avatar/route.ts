import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce authenticated session
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[API /api/avatar] CRITICAL: NEXTAUTH_SECRET environment variable is missing.');
      return NextResponse.json(
        { error: 'Configuration Error', message: 'NEXTAUTH_SECRET environment variable is missing.' },
        { status: 500 }
      );
    }

    const token = await getToken({ req: request, secret });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid authenticated session is required to create an avatar session.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const avatarBackendUrl = process.env.AVATAR_BACKEND_URL || 'http://localhost:3001';

    // Forward cookies and auth headers to backend
    const cookieHeader = request.headers.get('cookie') || '';
    const authHeader = request.headers.get('authorization') || '';

    const response = await fetch(`${avatarBackendUrl}/api/avatar/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in /api/avatar Next.js route:', error);
    return NextResponse.json(
      { error: 'Avatar service proxy error', message: error?.message || 'Failed to reach avatar service' },
      { status: 502 }
    );
  }
}
