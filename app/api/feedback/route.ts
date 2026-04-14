export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const feedbackSchema = z.object({
  interviewId:      z.string(),
  reviewedUserId:   z.string(),
  candidateRating:  z.number().min(1).max(10),
  interviewerRating: z.number().min(1).max(10),
  comments:         z.string().min(20, 'Comments must be at least 20 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = feedbackSchema.parse(body);

    const interview = await db.interview.findUnique({
      where: { id: data.interviewId },
      include: { bookings: true, feedback: true },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    if (interview.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Interview is not completed' }, { status: 400 });
    }

    const userBooking = interview.bookings.find(b => b.userId === session.user!.id);
    if (!userBooking) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Prevent duplicate feedback
    const existing = interview.feedback.find(f => f.reviewerId === session.user!.id);
    if (existing) {
      return NextResponse.json({ error: 'Feedback already submitted' }, { status: 409 });
    }

    // Determine the reviewed user's role
    const reviewedBooking = interview.bookings.find(b => b.userId === data.reviewedUserId);
    if (!reviewedBooking) {
      return NextResponse.json({ error: 'Reviewed user not found' }, { status: 404 });
    }

    // Create feedback
    await db.feedback.create({
      data: {
        interviewId:      data.interviewId,
        reviewerId:       session.user!.id,
        reviewedUserId:   data.reviewedUserId,
        candidateRating:  data.candidateRating,
        interviewerRating: data.interviewerRating,
        comments:         data.comments,
        role:             reviewedBooking.role,
      },
    });

    // Update reviewed user's aggregate ratings
    await updateUserRatings(data.reviewedUserId, {
      candidateRating:  data.candidateRating,
      interviewerRating: data.interviewerRating,
    });

    // Check if both users have submitted feedback
    const allFeedback = await db.feedback.findMany({
      where: { interviewId: data.interviewId },
    });

    const participantIds = interview.bookings.map(b => b.userId);

    if (allFeedback.length >= interview.bookings.length) {
      // All feedback submitted — clear pendingFeedback for all
      await db.user.updateMany({
        where: { id: { in: participantIds } },
        data: { pendingFeedback: false, totalSessions: { increment: 1 } },
      });
    } else {
      // Just clear for this reviewer
      await db.user.update({
        where: { id: session.user!.id },
        data: { pendingFeedback: false },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Feedback POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return NextResponse.json({ error: 'interviewId required' }, { status: 400 });
    }

    const feedback = await db.feedback.findFirst({
      where: { interviewId, reviewerId: session.user!.id },
    });

    return NextResponse.json({ submitted: !!feedback });
  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateUserRatings(
  userId: string,
  ratings: { candidateRating: number; interviewerRating: number }
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { candidateRating: true, interviewerRating: true, totalSessions: true },
  });

  if (!user) return;

  const n = Math.max(user.totalSessions, 1);
  const newCandidate  = ((user.candidateRating  * (n - 1)) + ratings.candidateRating)  / n;
  const newInterviewer = ((user.interviewerRating * (n - 1)) + ratings.interviewerRating) / n;

  await db.user.update({
    where: { id: userId },
    data: {
      candidateRating:  Math.round(newCandidate  * 10) / 10,
      interviewerRating: Math.round(newInterviewer * 10) / 10,
    },
  });
}
