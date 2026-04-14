import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendInterviewReminder } from '@/lib/email';

// Protect with a secret so only your cron can call this
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in15 = new Date(now.getTime() + 15 * 60 * 1000);
  const in16 = new Date(now.getTime() + 16 * 60 * 1000);

  // Find slots starting in ~15 minutes
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingSlots = await db.slot.findMany({
    where: { date: today },
    include: {
      bookings: {
        where: { status: { in: ['WAITING', 'MATCHED'] } },
        include: {
          user: { select: { name: true, email: true } },
          interview: { select: { id: true } },
        },
      },
    },
  });

  let sent = 0;
  for (const slot of upcomingSlots) {
    const [h, m] = slot.startTime.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(h, m, 0, 0);

    // Check if slot is 14-16 minutes away (15min window)
    if (slotTime >= in15 && slotTime <= in16) {
      for (const booking of slot.bookings) {
        if (booking.user?.email) {
          await sendInterviewReminder(
            booking.user.email,
            booking.user.name,
            slot.startTime,
            booking.interview?.id ?? booking.id
          );
          sent++;
        }
      }
    }
  }

  return NextResponse.json({ success: true, remindersSent: sent, checkedAt: now.toISOString() });
}
