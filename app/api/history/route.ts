export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await db.booking.findMany({
      where: { userId: session.user!.id },
      include: {
        slot: true,
        interview: {
          include: {
            candidateQuestion:   { select: { title: true, topic: true, difficulty: true } },
            interviewerQuestion: { select: { title: true, topic: true, difficulty: true } },
            bookings: {
              where: { userId: { not: session.user!.id } },
              include: { user: { select: { id: true, name: true, title: true } } },
            },
            feedback: {
              where: { reviewerId: session.user!.id },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
