export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      select: {
        status: true,
        language: true,
        peerMeta: true,
        // FIX: Also return codeState so polling clients get code updates
        // without needing a page reload
        codeState: true,
        bookings: {
          select: { userId: true, role: true },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const userBooking = interview.bookings.find(b => b.userId === session.user!.id);
    const roles: Record<string, string> = {};
    interview.bookings.forEach(b => { roles[b.userId] = b.role; });

    return NextResponse.json({
      status:    interview.status,
      language:  interview.language,
      userRole:  userBooking?.role ?? 'CANDIDATE',
      roles,
      peerMeta:  interview.peerMeta,
      // FIX: Include codeState so the polling fallback can sync code across devices
      codeState: interview.codeState,
    });
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}