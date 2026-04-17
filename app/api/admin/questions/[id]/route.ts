export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession().catch(() => null);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await import('@/lib/db'); // ✅ FIX

    const q = await db.question.findUnique({ where: { id: params.id } });
    if (!q) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ question: q });

  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession().catch(() => null);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await import('@/lib/db'); // ✅ FIX

    const data = await req.json();

    const question = await db.question.update({
      where: { id: params.id },
      data: {
        title: data.title,
        difficulty: data.difficulty,
        topic: data.topic,
        description: data.description,
        examples: data.examples,
        constraints: data.constraints,
        starterCode: data.starterCode,
        visibleTests: data.visibleTests,
        hiddenTests: data.hiddenTests,
      },
    });

    return NextResponse.json({ question });

  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession().catch(() => null);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await import('@/lib/db');

    // 1. Find all interviews that use this question
    const interviews = await db.interview.findMany({
      where: {
        OR: [
          { interviewerQuestionId: params.id },
          { candidateQuestionId: params.id },
        ],
      },
      select: { id: true },
    });

    const interviewIds = interviews.map((i) => i.id);

    if (interviewIds.length > 0) {
      // 2. Delete feedback tied to those interviews
      await db.feedback.deleteMany({
        where: { interviewId: { in: interviewIds } },
      });

      // 3. Unlink bookings from those interviews (don't delete bookings)
      await db.booking.updateMany({
        where: { interviewId: { in: interviewIds } },
        data: { interviewId: null },
      });

      // 4. Delete the interviews themselves
      await db.interview.deleteMany({
        where: { id: { in: interviewIds } },
      });
    }

    // 5. Finally, delete the question
    await db.question.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });

  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}