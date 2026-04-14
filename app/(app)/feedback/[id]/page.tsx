'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Peer {
  id: string;
  name: string;
  title: string;
  role: string;
}

interface InterviewData {
  id: string;
  durationMinutes: number | null;
  candidateQuestion: { title: string; difficulty: string } | null;
  interviewerQuestion: { title: string; difficulty: string } | null;
  bookings: { role: string; user: { id: string; name: string; title: string } }[];
}

export default function FeedbackPage({ params }: { params: { id: string } }) {
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState('');

  const [candidateRating, setCandidateRating] = useState(0);
  const [interviewerRating, setInterviewerRating] = useState(0);
  const [comments, setComments] = useState('');

  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch(`/api/interviews/${params.id}`).then(r => r.json()),
      fetch(`/api/feedback?interviewId=${params.id}`).then(r => r.json()),
    ]).then(([ivData, fbData]) => {
      if (ivData.interview) {
        setInterview(ivData.interview);
        setUserRole(ivData.userRole);
        const peerBooking = ivData.interview.bookings.find(
          (b: any) => b.role !== ivData.userRole
        );
        if (peerBooking) {
          setPeer({ ...peerBooking.user, role: peerBooking.role });
        }
      }
      setAlreadySubmitted(fbData.submitted);
    }).finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit() {
    if (candidateRating === 0 || interviewerRating === 0) {
      setError('Please provide both ratings.');
      return;
    }
    if (comments.length < 20) {
      setError('Comments must be at least 20 characters.');
      return;
    }
    if (!peer) {
      setError('Could not identify peer.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewId: params.id,
        reviewedUserId: peer.id,
        candidateRating,
        interviewerRating,
        comments,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError(data.error || 'Submission failed.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-primary text-5xl block mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <h2 className="text-2xl font-headline font-black text-on-surface mb-2">Feedback Submitted</h2>
          <p className="text-on-surface-variant mb-6">You have already submitted feedback for this session.</p>
          <a href="/dashboard" className="btn-primary px-6 py-3 rounded-xl text-sm font-bold inline-block">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  const durationText = interview?.durationMinutes
    ? `${interview.durationMinutes} min session`
    : 'Session completed';

  return (
    <div className="min-h-screen py-10 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '18px' }}>psychology</span>
        </div>
        <span className="font-headline font-bold text-on-surface text-lg">Tervix</span>
        <span className="ml-auto px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase tracking-wider">
          Post-Interview
        </span>
      </div>

      <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Final Assessment</h1>
      <p className="text-on-surface-variant text-sm mb-2">
        Please provide honest feedback about your session with{' '}
        <span className="text-on-surface font-semibold">{peer?.name ?? 'your peer'}</span>.
      </p>
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-8">
        {durationText} · {peer?.role === 'INTERVIEWER' ? 'They were the Interviewer' : 'They were the Candidate'}
      </p>

      <div className="space-y-8">

        {/* Candidate Rating */}
        <div className="bg-surface-container rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-headline font-bold text-on-surface">
              1. Candidate Performance
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary/10 text-tertiary uppercase">Required</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-5">
            How well did the candidate solve the problem, think out loud, and handle edge cases?
          </p>
          <RatingButtons score={candidateRating} onScore={setCandidateRating} />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Needs Work</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Exceptional</span>
          </div>
        </div>

        {/* Interviewer Rating */}
        <div className="bg-surface-container rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-headline font-bold text-on-surface">
              2. Interviewer Quality
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">Required</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-5">
            How clear were the questions? Was the interviewer helpful, professional, and constructive?
          </p>
          <RatingButtons score={interviewerRating} onScore={setInterviewerRating} />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Poor</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Excellent</span>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-surface-container rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-headline font-bold text-on-surface">3. Detailed Observations</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">Required</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">
            What did they do well? Where can they improve? Be specific and constructive.
          </p>
          <div className="relative">
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={5}
              placeholder="e.g. Great approach to the problem but could improve on edge case handling. Communication was clear throughout..."
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <span className={`absolute bottom-3 right-3 text-[10px] font-bold ${comments.length >= 20 ? 'text-green-400' : 'text-on-surface-variant'}`}>
              {comments.length}/20 min
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error/10 text-error text-sm flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full btn-primary py-4 rounded-xl font-bold text-base disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Submitting...</>
          ) : 'Submit Feedback & Finalize'}
        </button>

        <p className="text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          You will be redirected to the dashboard after submission
        </p>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: 'lock', title: 'Privacy Guaranteed', desc: 'Written feedback is shared but ratings are aggregated anonymously.' },
            { icon: 'verified', title: 'Quality Score', desc: 'Consistent quality feedback earns you Elite Peer status.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 bg-surface-container rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface mb-1">{title}</p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-10">
        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>diamond</span>
          Tervix Professional Interface
        </p>
      </div>
    </div>
  );
}

function RatingButtons({ score, onScore }: { score: number; onScore: (n: number) => void }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => onScore(n)}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            score === n
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105'
              : score > 0 && n <= score
              ? 'bg-primary/20 text-primary'
              : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
