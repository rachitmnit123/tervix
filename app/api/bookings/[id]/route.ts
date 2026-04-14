export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cancelBooking, getBookingMatchStatus, matchUsersInSlot } from '@/lib/matching';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try matching again before returning status
    const booking = await db.booking.findUnique({
      where: { id: params.id },
      select: { slotId: true, status: true },
    });

    if (booking?.status === 'WAITING') {
      await matchUsersInSlot(booking.slotId).catch(() => {});
    }

    const status = await getBookingMatchStatus(params.id);
    if (!status) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Booking status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await cancelBooking(params.id, session.user!.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      peerRequeued: result.peerRequeued,
      message: result.peerRequeued
        ? 'Booking cancelled. Your peer has been returned to the queue.'
        : 'Booking cancelled.',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
