import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interview = await db.interview.findUnique({
      where: { id: params.id },
      include: {
        interviewerQuestion: true,
        candidateQuestion:   true,
        bookings: {
          include: {
            user: { select: { id: true, name: true, title: true, image: true } },
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const userBooking = interview.bookings.find(b => b.userId === session.user!.id);
    if (!userBooking) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Role-specific question
    const userRole = userBooking.role;
    const question = userRole === 'INTERVIEWER'
      ? interview.interviewerQuestion
      : interview.candidateQuestion;

    // Extract peerIds from peerMeta
    const peerMeta = (interview.peerMeta as any) ?? {};
    const peerIds: string[] = peerMeta.peerIds ?? [];

    // Extract code state
    let codeState = null;
    try {
      const raw = interview.codeState as any;
      if (raw && typeof raw === 'object') codeState = raw;
    } catch {}

    return NextResponse.json({
      interview: {
        ...interview,
        question,       // role-specific question
        peerIds,
        codeState,
      },
      userRole,
    });
  } catch (error) {
    console.error('Interview GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const interview = await db.interview.findUnique({
      where: { id: params.id },
      include: { bookings: true },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const isParticipant = interview.bookings.some(b => b.userId === session.user!.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    switch (action) {

      case 'start': {
        await db.interview.update({
          where: { id: params.id },
          data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
        break;
      }

      case 'end': {
        const startedAt = interview.startedAt ?? new Date();
        const endedAt = new Date();
        const durationMinutes = Math.round(
          (endedAt.getTime() - startedAt.getTime()) / 60000
        );

        await db.interview.update({
          where: { id: params.id },
          data: {
            status: 'COMPLETED',
            endedAt,
            durationMinutes,
            codeState: body.codeState ?? interview.codeState,
          },
        });

        // Mark all participants as pending feedback & update total minutes
        const userIds = interview.bookings.map(b => b.userId);
        await db.user.updateMany({
          where: { id: { in: userIds } },
          data: { pendingFeedback: true },
        });
        await Promise.all(
          userIds.map(uid =>
            db.user.update({
              where: { id: uid },
              data: { totalMinutes: { increment: durationMinutes } },
            })
          )
        );

        // Mark bookings completed
        await db.booking.updateMany({
          where: { interviewId: params.id },
          data: { status: 'COMPLETED' },
        });
        break;
      }

      case 'updateCodeState': {
        await db.interview.update({
          where: { id: params.id },
          data: {
            codeState: body.codeState,
            language: body.language ?? interview.language,
          },
        });
        break;
      }

      case 'switchLanguage': {
        await db.interview.update({
          where: { id: params.id },
          data: {
            language: body.language,
            codeState: body.codeState ?? interview.codeState,
          },
        });
        break;
      }

      case 'switchRole': {
        // Swap roles for both participants
        const [b1, b2] = interview.bookings;
        if (b1 && b2) {
          await db.$transaction([
            db.booking.update({
              where: { id: b1.id },
              data: { role: b1.role === 'INTERVIEWER' ? 'CANDIDATE' : 'INTERVIEWER' },
            }),
            db.booking.update({
              where: { id: b2.id },
              data: { role: b2.role === 'INTERVIEWER' ? 'CANDIDATE' : 'INTERVIEWER' },
            }),
          ]);
        }
        break;
      }

      case 'setPeerId': {
        const { peerId } = body;
        const meta = (interview.peerMeta as any) ?? {};
        const peerIds: string[] = meta.peerIds ?? [];
        if (!peerIds.includes(peerId)) peerIds.push(peerId);
        // Keep last 2 only
        const trimmed = peerIds.slice(-2);
        await db.interview.update({
          where: { id: params.id },
          data: { peerMeta: { ...meta, peerIds: trimmed } },
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Interview PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
