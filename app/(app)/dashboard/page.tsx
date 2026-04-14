'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardData {
  user: {
    name: string;
    title: string;
    image: string | null;
    interviewerRating: number;
    candidateRating: number;
    totalSessions: number;
    totalMinutes: number;
    pendingFeedback: boolean;
  };
  upcomingBooking: {
    id: string;
    role: string;
    slot: { startTime: string; endTime: string };
    interview: {
      id: string;
      status: string;
      question: { title: string; difficulty: string; topic: string } | null;
      bookings: { user: { name: string; title: string } }[];
    } | null;
  } | null;
  pastBookings: {
    id: string;
    role: string;
    slot: { startTime: string; date: string };
    interview: {
      id: string;
      question: { title: string; difficulty: string; topic: string } | null;
      bookings: { user: { name: string; title: string } }[];
      ratings: { candidateScore: number | null; interviewerScore: number | null }[];
      feedback: { id: string }[];
    } | null;
  }[];
  stats: {
    weeklyHours: number;
    weeklyGoal: number;
    totalUsers: number;
    pendingFeedback: boolean;
  };
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container rounded-2xl p-6 animate-pulse">
      <div className="skeleton h-4 w-1/3 mb-3 rounded" />
      <div className="skeleton h-8 w-1/2 mb-2 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const router = useRouter();

  function fetchDashboard() {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  // Poll for match if user has unmatched booking
  useEffect(() => {
    if (!data?.upcomingBooking) return;
    if (data.upcomingBooking.interview) return; // already matched

    const bookingId = data.upcomingBooking.id;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const status = await res.json();
      if (status.matched && status.interviewId) {
        clearInterval(interval);
        fetchDashboard(); // refresh to show interview
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [data?.upcomingBooking?.id, data?.upcomingBooking?.interview]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function handleCancel() {
    if (!data?.upcomingBooking) return;
    setCancelling(true);
    try {
      await fetch('/api/bookings/' + data.upcomingBooking.id, { method: 'DELETE' });
      setShowCancelConfirm(false);
      fetchDashboard();
    } catch {}
    finally { setCancelling(false); }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="skeleton h-8 w-64 mb-2 rounded" />
        <div className="skeleton h-4 w-96 mb-10 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const { user, upcomingBooking, pastBookings } = data;
  const stats = data.stats ?? { weeklyHours: 0, weeklyGoal: 10, totalUsers: 0, pendingFeedback: false };
  const velocityPct = Math.min(100, Math.round((stats.weeklyHours / stats.weeklyGoal) * 100));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tight text-on-surface">
            Dashboard Overview
          </h2>
          <p className="text-on-surface-variant mt-1">Welcome back, {user.name.split(' ')[0]}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
          </button>
          <Link href="/profile" className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/10 hover:border-primary/30 transition-all">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary text-xs font-bold">
              {user.name[0]}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-on-surface leading-none">{user.name}</p>
              <p className="text-on-surface-variant text-[10px]">{user.title || 'Engineer'}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Pending Feedback Warning */}
      {user.pendingFeedback && (
        <div className="mb-6 p-4 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center gap-3 animate-fade-in-up">
          <span className="material-symbols-outlined text-tertiary">warning</span>
          <p className="text-sm text-tertiary font-medium">
            You have pending feedback to submit before booking your next session.
          </p>
          <Link
            href="/history"
            className="ml-auto text-xs font-bold text-tertiary underline whitespace-nowrap"
          >
            Submit Now →
          </Link>
        </div>
      )}

      {/* Top cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming interview */}
        <div className="bg-surface-container rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Upcoming Interview
            </p>
            {upcomingBooking && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-tertiary uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary pulse-chip inline-block" />
                Live Soon
              </span>
            )}
          </div>

          {upcomingBooking ? (
            <>
              <h3 className="text-3xl font-headline font-black text-on-surface mb-1">
                Today, {formatTime(upcomingBooking.slot.startTime)}
              </h3>
              <div className="flex items-center gap-3 mt-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>videocam</span>
                </div>
                <div>
                  {upcomingBooking.interview?.bookings[0]?.user ? (
                    <>
                      <p className="text-sm font-bold text-on-surface">
                        {upcomingBooking.interview.bookings[0].user.name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {upcomingBooking.interview.bookings[0].user.title}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-on-surface">Waiting for peer...</p>
                      <p className="text-xs text-on-surface-variant">Slot opens when matched</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {upcomingBooking.interview ? (
                  <Link
                    href={`/interview/${upcomingBooking.interview.id}`}
                    className="flex-1 btn-primary py-3 rounded-xl text-center text-sm font-bold"
                  >
                    Enter Interview Room
                  </Link>
                ) : (
                  <button disabled className="flex-1 py-3 rounded-xl text-sm font-bold bg-surface-container-high text-on-surface-variant cursor-not-allowed">
                    Waiting for Match...
                  </button>
                )}
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-3 rounded-xl text-sm font-bold text-error border border-error/20 hover:bg-error/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-headline font-bold text-on-surface/50 mb-1 mt-2">
                No session booked today
              </h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Book a slot to start practicing DSA with a peer.
              </p>
              <Link
                href="/book-slot"
                className="inline-block btn-primary py-3 px-6 rounded-xl text-sm font-bold"
              >
                Book Today&apos;s Slot
              </Link>
            </>
          )}
        </div>

        {/* Practice velocity */}
        <div className="bg-surface-container rounded-2xl p-6 animate-fade-in-up animate-delay-100">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
            Practice Velocity
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-headline font-black text-on-surface">
              {(user.totalMinutes / 60).toFixed(1)}
            </span>
            <span className="text-on-surface-variant font-medium">Hours</span>
            <div className="ml-auto w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>trending_up</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant mb-2 mt-4">
            <span>Weekly Goal</span>
            <span>{velocityPct}% Complete</span>
          </div>
          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-700"
              style={{ width: `${velocityPct}%` }}
            />
          </div>

          {/* Performance */}
          <div className="mt-6 bg-surface-container-high rounded-xl p-4">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Performance</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant w-20">Candidate</span>
                <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tertiary rounded-full"
                    style={{ width: `${(user.candidateRating / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-on-surface w-14 text-right">
                  {user.candidateRating.toFixed(1)} / 10
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-on-surface-variant w-20">Interviewer</span>
                <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(user.interviewerRating / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-on-surface w-14 text-right">
                  {user.interviewerRating.toFixed(1)} / 10
                </span>
              </div>
            </div>
            {user.totalSessions > 0 && (
              <p className="text-[10px] text-primary font-bold mt-3">Top 5% this month</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up animate-delay-200">
        <a href="/book-slot" className="bg-surface-container hover:bg-surface-container-high rounded-2xl p-5 flex items-center gap-4 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>event_available</span></div>
          <div><p className="text-sm font-bold text-on-surface">Book a Slot</p><p className="text-xs text-on-surface-variant">Same-day sessions</p></div>
          <span className="material-symbols-outlined text-on-surface-variant ml-auto" style={{ fontSize: '18px' }}>arrow_forward</span>
        </a>
        <a href="/history" className="bg-surface-container hover:bg-surface-container-high rounded-2xl p-5 flex items-center gap-4 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center"><span className="material-symbols-outlined text-tertiary" style={{ fontSize: '20px' }}>history</span></div>
          <div><p className="text-sm font-bold text-on-surface">History</p><p className="text-xs text-on-surface-variant">Past interviews</p></div>
          <span className="material-symbols-outlined text-on-surface-variant ml-auto" style={{ fontSize: '18px' }}>arrow_forward</span>
        </a>
        <a href="/profile" className="bg-surface-container hover:bg-surface-container-high rounded-2xl p-5 flex items-center gap-4 transition-colors group">
          <div className="w-10 h-10 rounded-xl bg-surface-bright flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>account_circle</span></div>
          <div><p className="text-sm font-bold text-on-surface">Profile</p><p className="text-xs text-on-surface-variant">Ratings & stats</p></div>
          <span className="material-symbols-outlined text-on-surface-variant ml-auto" style={{ fontSize: '18px' }}>arrow_forward</span>
        </a>
      </div>

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-high rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-headline font-black text-on-surface mb-2">Cancel Booking?</h3>
            <p className="text-sm text-on-surface-variant mb-6">Are you sure you want to cancel this slot? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-error text-white hover:bg-error/80 disabled:opacity-60 transition-colors">
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-outline-variant/20 text-on-surface hover:bg-surface-container transition-colors">
                Keep Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
