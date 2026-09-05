import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const avatarBackendUrl = process.env.AVATAR_BACKEND_URL || 'http://localhost:3001';

    const response = await fetch(`${avatarBackendUrl}/api/avatar/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
