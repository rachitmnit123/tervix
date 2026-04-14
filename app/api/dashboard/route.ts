import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTodayDate } from '@/lib/slots';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = getTodayDate();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, title: true, image: true,
        techStack: true, interviewerRating: true, candidateRating: true,
        totalSessions: true, totalMinutes: true, pendingFeedback: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upcoming booking today (waiting or matched)
    const upcomingBooking = await db.booking.findFirst({
      where: {
        userId,
        status: { in: ['WAITING', 'MATCHED'] },
        slot: { date: today },
      },
      include: {
        slot: true,
        interview: {
          include: {
            candidateQuestion:   { select: { title: true, difficulty: true, topic: true } },
            interviewerQuestion: { select: { title: true, difficulty: true, topic: true } },
            bookings: {
              where: { userId: { not: userId } },
              include: { user: { select: { id: true, name: true, title: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Past completed bookings
    const pastBookings = await db.booking.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        slot: true,
        interview: {
          include: {
            candidateQuestion:   { select: { title: true, difficulty: true, topic: true } },
            interviewerQuestion: { select: { title: true, difficulty: true, topic: true } },
            bookings: {
              where: { userId: { not: userId } },
              include: { user: { select: { id: true, name: true, title: true } } },
            },
            feedback: {
              where: { reviewerId: userId },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Weekly hours
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSessions = await db.booking.count({
      where: { userId, status: 'COMPLETED', createdAt: { gte: weekAgo } },
    });

    const totalUsers = await db.user.count();

    return NextResponse.json({
      user,
      upcomingBooking: upcomingBooking ?? null,
      pastBookings: pastBookings ?? [],
      stats: {
        weeklyHours: recentSessions * 2,
        weeklyGoal: 10,
        totalUsers,
        pendingFeedback: user.pendingFeedback,
      },
    });

  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
