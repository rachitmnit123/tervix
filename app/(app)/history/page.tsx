'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BookingRecord {
  id: string;
  role: string;
  status: string;
  slot: { date: string; startTime: string };
  interview: {
    id: string;
    status: string;
    durationMinutes: number | null;
    candidateQuestion: { title: string; topic: string; difficulty: string } | null;
    interviewerQuestion: { title: string; topic: string; difficulty: string } | null;
    bookings: { user: { name: string; title: string } }[];
    feedback: { id: string }[];
  } | null;
}

export default function HistoryPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .finally(() => setLoading(false));
  }, []);

  const difficultyColor: Record<string, string> = {
    EASY:   'text-green-400 bg-green-400/10',
    MEDIUM: 'text-amber-400 bg-amber-400/10',
    HARD:   'bg-error/10 text-error',
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-headline font-black tracking-tight text-on-surface">
          Interview History
        </h2>
        <p className="text-on-surface-variant mt-1 text-sm">
          Your complete record of past mock interview sessions.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-24 bg-surface-container rounded-2xl">
          <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl block mb-4">
            history
          </span>
          <h3 className="text-lg font-headline font-bold text-on-surface/60 mb-2">
            No sessions yet
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">
            Book your first mock interview to get started.
          </p>
          <Link href="/book-slot" className="btn-primary px-6 py-3 rounded-xl text-sm font-bold">
            Book a Slot
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => {
            const peer = booking.interview?.bookings[0]?.user;
            const hasFeedback = (booking.interview?.feedback?.length ?? 0) > 0;
            const question = booking.role === 'CANDIDATE'
              ? booking.interview?.candidateQuestion
              : booking.interview?.interviewerQuestion;
            const difficulty = question?.difficulty ?? 'MEDIUM';
            const duration = booking.interview?.durationMinutes;

            return (
              <div
                key={booking.id}
                className="bg-surface-container rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-surface-container-high transition-colors animate-fade-in-up"
              >
                {/* Left */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    booking.role === 'INTERVIEWER'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-tertiary/10 text-tertiary'
                  }`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {booking.role === 'INTERVIEWER' ? 'record_voice_over' : 'person'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-on-surface">
                        {question?.topic ?? 'DSA Interview'}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${difficultyColor[difficulty]}`}>
                        {difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      with {peer?.name ?? 'Peer'} · {peer?.title}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-6 text-xs flex-wrap">
                  <div>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
                      Date
                    </p>
                    <p className="text-on-surface font-semibold">
                      {new Date(booking.slot.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
                      Role
                    </p>
                    <span className={`font-bold ${
                      booking.role === 'INTERVIEWER' ? 'text-primary' : 'text-tertiary'
                    }`}>
                      {booking.role === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}
                    </span>
                  </div>
                  {duration && (
                    <div>
                      <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
                        Duration
                      </p>
                      <p className="text-on-surface font-semibold">{duration} min</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
                      Status
                    </p>
                    <span className={`font-bold ${
                      booking.interview?.status === 'COMPLETED'
                        ? 'text-green-400'
                        : 'text-on-surface-variant'
                    }`}>
                      {booking.interview?.status ?? booking.status}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div>
                  {booking.interview &&
                  booking.interview.status === 'COMPLETED' &&
                  !hasFeedback ? (
                    <Link
                      href={`/feedback/${booking.interview.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
                      Submit Feedback
                    </Link>
                  ) : hasFeedback ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container-high text-on-surface-variant">
                      ✓ Feedback Sent
                    </span>
                  ) : booking.interview?.status === 'IN_PROGRESS' ? (
                    <Link
                      href={`/interview/${booking.interview.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-error/10 text-error hover:bg-error/20 transition-colors"
                    >
                      Rejoin
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
