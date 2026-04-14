export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || undefined;
    const limit = 20;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [interviews, total] = await Promise.all([
      db.interview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        include: {
          candidateQuestion:   { select: { title: true, difficulty: true } },
          interviewerQuestion: { select: { title: true } },
          bookings: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      }),
      db.interview.count({ where }),
    ]);

    return NextResponse.json({ interviews, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
