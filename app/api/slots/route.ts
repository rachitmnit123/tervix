export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SLOT_TIMES, getTodayDate, isSlotInFuture } from '@/lib/slots';
import { matchUsersInSlot } from '@/lib/matching';
import { sendBookingConfirmation } from '@/lib/email';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getTodayDate();

    const [todaySlots, userBookings] = await Promise.all([
      db.slot.findMany({
        where: { date: today },
        include: {
          bookings: {
            where: { status: { in: ['WAITING', 'MATCHED'] } },
            select: { userId: true, status: true, interviewId: true },
          },
        },
      }),
      db.booking.findMany({
        where: { userId: session.user!.id, slot: { date: today } },
        include: { slot: true, interview: true },
      }),
    ]);

    const slotMap = new Map(todaySlots.map(s => [s.startTime, s]));
    const userBookedSlots = new Set(userBookings.map(b => b.slot.startTime));

    const slots = SLOT_TIMES.map((time, index) => {
      const dbSlot = slotMap.get(time.start);
      const activeBookings = dbSlot?.bookings ?? [];
      const waitingCount = activeBookings.filter(b => b.status === 'WAITING').length;
      const matchedCount = activeBookings.filter(b => b.status === 'MATCHED').length;
      const userBooked = userBookedSlots.has(time.start);
      const isFuture = isSlotInFuture(time.start);

      const isNextAvailable =
        isFuture &&
        !userBooked &&
        SLOT_TIMES.filter(
          (t, i) => i < index && isSlotInFuture(t.start) && !userBookedSlots.has(t.start)
        ).length === 0;

      return {
        id: dbSlot?.id ?? null,
        number: index + 1,
        startTime: time.start,
        endTime: time.end,
        status: !isFuture ? 'EXPIRED' : 'AVAILABLE',
        waitingCount,
        matchedCount,
        totalActive: activeBookings.length,
        userBooked,
        isNextAvailable,
      };
    });

    return NextResponse.json({ slots, userBookings });
  } catch (error) {
    console.error('Slots GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startTime } = await req.json();

    const user = await db.user.findUnique({
      where: { id: session.user!.id },
      select: { pendingFeedback: true },
    });

    if (user?.pendingFeedback) {
      return NextResponse.json(
        { error: 'Submit feedback from your last session before booking.' },
        { status: 403 }
      );
    }

    const slotDef = SLOT_TIMES.find(s => s.start === startTime);
    if (!slotDef || !isSlotInFuture(startTime)) {
      return NextResponse.json({ error: 'Invalid or expired slot' }, { status: 400 });
    }

    const today = getTodayDate();

    let slot = await db.slot.findFirst({ where: { date: today, startTime } });
    if (!slot) {
      slot = await db.slot.create({
        data: { date: today, startTime, endTime: slotDef.end },
      });
    }

    // Prevent duplicate booking for same slot
    const existing = await db.booking.findUnique({
      where: { userId_slotId: { userId: session.user!.id, slotId: slot.id } },
    });
    if (existing && existing.status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Already booked this slot' }, { status: 409 });
    }

    // Create or reactivate booking
    const booking = existing
      ? await db.booking.update({
          where: { id: existing.id },
          data: { status: 'WAITING', interviewId: null, matchedAt: null },
        })
      : await db.booking.create({
          data: {
            userId: session.user!.id,
            slotId: slot.id,
            status: 'WAITING',
          },
        });

    // Attempt immediate match
    const matchResult = await matchUsersInSlot(slot.id);

    // Send booking confirmation email (non-blocking)
    try {
      const userForEmail = await db.user.findUnique({
        where: { id: session.user!.id },
        select: { name: true, email: true },
      });
      if (userForEmail?.email) {
        const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        sendBookingConfirmation(userForEmail.email, userForEmail.name, dateStr, startTime).catch(console.error);
      }
    } catch (e) { /* email failure should not block booking */ }

        return NextResponse.json({
      booking,
      matched: matchResult.matched,
      interviewId: matchResult.interviewId ?? null,
      waitingCount: matchResult.waitingCount,
      message: matchResult.matched
        ? 'Matched! Redirecting to your interview...'
        : `In queue. ${matchResult.waitingCount + 1} user(s) waiting for this slot.`,
    }, { status: 201 });

  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Already booked this slot' }, { status: 409 });
    }
    console.error('Slot booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
