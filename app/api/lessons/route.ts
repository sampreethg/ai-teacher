import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const lessons = await prisma.lesson.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const mappedLessons = lessons.map(l => ({
      id: l.id,
      title: l.title,
      emoji: '📚',
      category: 'General',
      dateCreated: l.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      sourceCount: l.sourceCount,
      progress: 0,
      description: 'Custom AI Teacher Lesson'
    }));

    return NextResponse.json(mappedLessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { title } = await request.json();

    const newLesson = await prisma.lesson.create({
      data: {
        title: title || 'New Untitled Lesson',
        sourceCount: 0,
        userId: userId,
      }
    });

    return NextResponse.json(newLesson);
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}
