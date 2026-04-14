export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  title: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user!.id },
      select: {
        id: true, name: true, email: true, title: true, image: true,
        techStack: true, interviewerRating: true, candidateRating: true,
        totalSessions: true, totalMinutes: true, createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const recentSessions = await db.booking.findMany({
      where: { userId: session.user!.id, status: 'COMPLETED' },
      include: {
        slot: true,
        interview: {
          include: {
            candidateQuestion:   { select: { title: true, topic: true, difficulty: true } },
            interviewerQuestion: { select: { title: true, topic: true, difficulty: true } },
            feedback: {
              where: { reviewerId: session.user!.id },
              select: { candidateRating: true, interviewerRating: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const monthlyStats = await getMonthlyStats(session.user!.id);

    return NextResponse.json({ user, recentSessions, monthlyStats });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const user = await db.user.update({
      where: { id: session.user!.id },
      data,
      select: { id: true, name: true, email: true, title: true, techStack: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getMonthlyStats(userId: string) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end   = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const sessions = await db.booking.findMany({
      where: { userId, status: 'COMPLETED', createdAt: { gte: start, lte: end } },
      include: {
        interview: {
          include: {
            feedback: {
              where: { reviewerId: { not: userId }, reviewedUserId: userId },
              select: { candidateRating: true, interviewerRating: true },
            },
          },
        },
      },
    });

    const count = sessions.length;
    const avgCandidate = count > 0
      ? sessions.reduce((s, b) => s + (b.interview?.feedback[0]?.candidateRating ?? 0), 0) / count
      : 0;
    const avgInterviewer = count > 0
      ? sessions.reduce((s, b) => s + (b.interview?.feedback[0]?.interviewerRating ?? 0), 0) / count
      : 0;

    months.push({
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      candidateAvg:   Math.round(avgCandidate * 10) / 10,
      interviewerAvg: Math.round(avgInterviewer * 10) / 10,
      sessions: count,
    });
  }
  return months;
}
