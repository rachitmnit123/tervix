import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questions = await db.question.findMany({
      select: {
        id: true,
        title: true,
        difficulty: true,
        topic: true,
      },
      orderBy: { difficulty: 'asc' },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
