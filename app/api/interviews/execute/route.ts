import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { runTestCases, LANGUAGE_IDS } from '@/lib/executor';

// Simple in-memory rate limiter (per user, max 1 request per 3s)
const lastExecTime = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const now = Date.now();
    const last = lastExecTime.get(session.user!.id) ?? 0;
    if (now - last < 3000) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }
    lastExecTime.set(session.user!.id, now);

    const { code, language = 'python', stdin = '', interviewId, mode = 'run' } = await req.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json({
        output: '⚠ Code cannot be empty.',
        isError: true,
        status: 'Empty',
        executionTime: '0ms',
      });
    }

    if (!LANGUAGE_IDS[language]) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    // MODE 1: Simple run with stdin (existing behavior, no test cases)
    if (mode === 'run' || !interviewId) {
      return await handleSimpleRun(code, language, stdin);
    }

    // MODE 2: Run against test cases (new behavior)
    if (mode === 'test' && interviewId) {
      return await handleTestCaseRun(code, language, interviewId, session.user!.id);
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  } catch (error: any) {
    console.error('Execute error:', error?.message);
    return NextResponse.json({
      output: 'Execution failed. Please try again.',
      isError: true,
      status: 'Error',
      executionTime: 'N/A',
    });
  }
}

// Simple run — just execute with stdin, return output
async function handleSimpleRun(code: string, language: string, stdin: string) {
  const { LANGUAGE_IDS } = await import('@/lib/executor');
  const languageId = LANGUAGE_IDS[language];

  try {
    const res = await fetch(
      'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: stdin || '',
          cpu_time_limit: 10,
          wall_time_limit: 15,
        }),
      }
    );

    if (!res.ok) {
      // Tell client to execute directly
      return NextResponse.json({ clientSideExec: true, languageId, code, stdin });
    }

    const result = await res.json();
    let output = '';
    let isError = false;

    if (result?.compile_output?.trim()) { output = result.compile_output; isError = true; }
    else if (result?.stderr?.trim())    { output = result.stderr; isError = true; }
    else if (result?.status?.id === 5)  { output = 'Time Limit Exceeded'; isError = true; }
    else                                 { output = result?.stdout?.trim() || '(no output)'; }

    return NextResponse.json({
      output,
      isError,
      status: result?.status?.description || 'Done',
      executionTime: result?.time ? `${Math.round(parseFloat(result.time) * 1000)}ms` : 'N/A',
    });
  } catch {
    return NextResponse.json({ clientSideExec: true, languageId, code, stdin });
  }
}

// Test case run — execute against visible + hidden test cases
async function handleTestCaseRun(
  code: string,
  language: string,
  interviewId: string,
  userId: string
) {
  // Get the interview to find which question this user is solving
  const interview = await db.interview.findUnique({
    where: { id: interviewId },
    include: {
      bookings: { where: { userId }, select: { role: true } },
      candidateQuestion: { select: { visibleTests: true, hiddenTests: true, title: true } },
      interviewerQuestion: { select: { visibleTests: true, hiddenTests: true, title: true } },
    },
  });

  if (!interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
  }

  const userRole = interview.bookings[0]?.role ?? 'CANDIDATE';
  const question = userRole === 'CANDIDATE'
    ? interview.candidateQuestion
    : interview.interviewerQuestion;

  const visibleTests = (question.visibleTests as any[]) || [];
  const hiddenTests  = (question.hiddenTests  as any[]) || [];

  const summary = await runTestCases(code, language, visibleTests, hiddenTests);

  return NextResponse.json({
    mode: 'test',
    questionTitle: question.title,
    ...summary,
  });
}
