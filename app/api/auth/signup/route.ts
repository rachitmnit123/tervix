export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json(
    { error: 'Email/password signup is disabled. Please use Google Sign-In.' },
    { status: 410 }
  );
}
