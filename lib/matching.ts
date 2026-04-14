import { db } from '@/lib/db';
import { Role } from '@prisma/client';

async function getTwoRandomQuestions() {
  const count = await db.question.count();
  if (count < 2) throw new Error('Not enough questions in database');

  const skip1 = Math.floor(Math.random() * count);
  let skip2 = Math.floor(Math.random() * count);
  if (skip2 === skip1) skip2 = (skip2 + 1) % count;

  const [q1, q2] = await Promise.all([
    db.question.findFirst({ skip: skip1 }),
    db.question.findFirst({ skip: skip2 }),
  ]);

  return { q1: q1!, q2: q2! };
}

/**
 * MATCH USERS IN SLOT
 * Atomically pairs the two oldest waiting users in a slot.
 * Safe under concurrent requests via Prisma transaction.
 */
export async function matchUsersInSlot(slotId: string): Promise<{
  matched: boolean;
  interviewId?: string;
  waitingCount: number;
}> {
  return db.$transaction(async (tx) => {
    const unmatched = await tx.booking.findMany({
      where: { slotId, status: 'WAITING', interviewId: null },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });

    if (unmatched.length < 2) {
      const total = await tx.booking.count({
        where: { slotId, status: 'WAITING', interviewId: null },
      });
      return { matched: false, waitingCount: total };
    }

    const [b1, b2] = unmatched;
    const { q1, q2 } = await getTwoRandomQuestions();

    // b1 = interviewer (asked first), b2 = candidate (solves problem)
    const interview = await tx.interview.create({
      data: {
        slotId,
        interviewerQuestionId: q1.id,
        candidateQuestionId: q2.id,
        peerMeta: { peerIds: [] },
      },
    });

    await tx.booking.update({
      where: { id: b1.id },
      data: {
        interviewId: interview.id,
        role: Role.INTERVIEWER,
        status: 'MATCHED',
        matchedAt: new Date(),
      },
    });

    await tx.booking.update({
      where: { id: b2.id },
      data: {
        interviewId: interview.id,
        role: Role.CANDIDATE,
        status: 'MATCHED',
        matchedAt: new Date(),
      },
    });

    const remaining = await tx.booking.count({
      where: { slotId, status: 'WAITING', interviewId: null },
    });

    return { matched: true, interviewId: interview.id, waitingCount: remaining };
  });
}

/**
 * CANCEL BOOKING
 * Handles both waiting and matched states.
 * If matched: cancels interview, returns peer to waiting queue, attempts re-match.
 */
export async function cancelBooking(bookingId: string, userId: string): Promise<{
  success: boolean;
  error?: string;
  peerRequeued?: boolean;
}> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { interview: true },
  });

  if (!booking) return { success: false, error: 'Booking not found' };
  if (booking.userId !== userId) return { success: false, error: 'Forbidden' };
  if (booking.status === 'COMPLETED') return { success: false, error: 'Cannot cancel completed session' };

  // Case 1: Still waiting, no match yet
  if (!booking.interviewId || booking.status === 'WAITING') {
    await db.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });
    return { success: true, peerRequeued: false };
  }

  // Case 2: Interview already started
  if (booking.interview?.status === 'IN_PROGRESS') {
    return { success: false, error: 'Cannot cancel an interview in progress. Use End Session instead.' };
  }

  // Case 3: Matched but not started yet — cancel and requeue peer
  await db.$transaction(async (tx) => {
    // Find peer booking
    const peerBooking = await tx.booking.findFirst({
      where: {
        interviewId: booking.interviewId!,
        userId: { not: userId },
      },
    });

    // Cancel this user's booking
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED', interviewId: null },
    });

    // Cancel the interview
    await tx.interview.update({
      where: { id: booking.interviewId! },
      data: { status: 'CANCELLED' },
    });

    // Requeue peer
    if (peerBooking) {
      await tx.booking.update({
        where: { id: peerBooking.id },
        data: {
          status: 'WAITING',
          interviewId: null,
          role: 'CANDIDATE',
          matchedAt: null,
        },
      });
    }
  });

  // Attempt re-match for peer
  let peerRequeued = false;
  try {
    await matchUsersInSlot(booking.slotId);
    peerRequeued = true;
  } catch {}

  return { success: true, peerRequeued };
}

export async function getBookingMatchStatus(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      interview: {
        include: {
          interviewerQuestion: { select: { id: true, title: true, difficulty: true, topic: true } },
          candidateQuestion:   { select: { id: true, title: true, difficulty: true, topic: true } },
        },
      },
      slot: true,
    },
  });

  if (!booking) return null;

  return {
    bookingId:   booking.id,
    status:      booking.status,
    matched:     booking.interviewId !== null && booking.status === 'MATCHED',
    interviewId: booking.interviewId,
    role:        booking.role,
    slot:        booking.slot,
    matchedAt:   booking.matchedAt,
    interview:   booking.interview ?? null,
  };
}
