export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession().catch(() => null);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await import('@/lib/db'); // ✅ FIX

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');

    const limit = 20;
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      db.question.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          difficulty: true,
          topic: true,
          createdAt: true,
          visibleTests: true,
          hiddenTests: true,
        },
      }),
      db.question.count(),
    ]);

    return NextResponse.json({
      questions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });

  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession().catch(() => null);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await import('@/lib/db'); // ✅ FIX

    const data = await req.json();

    const question = await db.question.create({
      data: {
        title: data.title,
        difficulty: data.difficulty,
        topic: data.topic,
        description: data.description,
        examples: data.examples || [],
        constraints: data.constraints || [],
        starterCode: data.starterCode || '',
        visibleTests: data.visibleTests || [],
        hiddenTests: data.hiddenTests || [],
      },
    });

    return NextResponse.json({ question }, { status: 201 });

  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}