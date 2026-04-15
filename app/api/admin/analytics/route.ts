export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await requireAdminSession().catch(() => null);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalUsers, totalInterviews, totalQuestions, totalFeedback,
      activeUsers, completedInterviews, inProgressInterviews,
      avgRatings,
    ] = await Promise.all([
      db.user.count(),
      db.interview.count(),
      db.question.count(),
      db.feedback.count(),
      db.user.count({ where: { createdAt: { gte: weekAgo } } }),
      db.interview.count({ where: { status: 'COMPLETED' } }),
      db.interview.count({ where: { status: 'IN_PROGRESS' } }),
      db.user.aggregate({ _avg: { candidateRating: true, interviewerRating: true } }),
    ]);

    return NextResponse.json({
      totalUsers, totalInterviews, totalQuestions, totalFeedback,
      newUsersThisWeek: activeUsers,
      completedInterviews, inProgressInterviews,
      avgCandidateRating: Math.round((avgRatings._avg.candidateRating ?? 0) * 10) / 10,
      avgInterviewerRating: Math.round((avgRatings._avg.interviewerRating ?? 0) * 10) / 10,
    });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
