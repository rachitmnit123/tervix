'use client';

import { useEffect, useState } from 'react';

interface ProfileData {
  user: {
    name: string;
    email: string;
    title: string;
    image: string | null;
    techStack: string[];
    interviewerRating: number;
    candidateRating: number;
    totalSessions: number;
    totalMinutes: number;
    createdAt: string;
  };
  recentSessions: {
    id: string;
    role: string;
    slot: { date: string };
    interview: {
      question: { title: string; topic: string; difficulty: string } | null;
      ratings: { candidateScore: number | null; interviewerScore: number | null }[];
    } | null;
  }[];
  monthlyStats: {
    month: string;
    candidateAvg: number;
    interviewerAvg: number;
    sessions: number;
  }[];
}

const TECH_OPTIONS = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'React', 'Node.js', 'SQL'];

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editStack, setEditStack] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setEditName(d.user.name);
        setEditTitle(d.user.title || '');
        setEditStack(d.user.techStack || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, title: editTitle, techStack: editStack }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(prev => prev ? { ...prev, user: { ...prev.user, ...updated.user } } : prev);
      setEditing(false);
    }
    setSaving(false);
  }

  function toggleTech(tech: string) {
    setEditStack(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="skeleton h-8 w-48 mb-2 rounded" />
        <div className="skeleton h-4 w-80 mb-8 rounded" />
        <div className="skeleton h-48 rounded-2xl mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, recentSessions, monthlyStats } = data;
  const maxSessions = Math.max(...monthlyStats.map(m => m.sessions), 1);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-headline font-black tracking-tight text-on-surface">Profile Overview</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Manage your architectural career trajectory and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
          </button>
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-primary-container/40 flex items-center justify-center text-primary font-bold text-sm">
              {user.name[0]}
            </div>
            <span className="text-sm font-semibold text-on-surface">{user.name}</span>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-surface-container rounded-2xl overflow-hidden mb-6 animate-fade-in-up">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-primary-container to-[#2a2a8a] relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #c0c1ff 0%, transparent 60%)' }} />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-surface-container-highest border-4 border-surface-container flex items-center justify-center text-2xl font-headline font-black text-primary">
                {user.name[0]}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '14px' }}>edit</span>
              </button>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-surface-container-highest rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">Title</label>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full bg-surface-container-highest rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Tech Stack</label>
                <div className="flex flex-wrap gap-2">
                  {TECH_OPTIONS.map(tech => (
                    <button
                      key={tech}
                      onClick={() => toggleTech(tech)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        editStack.includes(tech)
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-surface-container-high text-on-surface-variant border border-transparent hover:border-outline-variant/30'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-headline font-black text-on-surface">{user.name}</h3>
              <p className="text-on-surface-variant text-sm mb-4">{user.title || 'Software Engineer'}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Email</span>
                  <span className="text-sm text-on-surface">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Sessions</span>
                  <span className="text-sm text-on-surface">{user.totalSessions} completed</span>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold border border-outline-variant/20 text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Edit Profile Info
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tech Stack */}
      {!editing && user.techStack.length > 0 && (
        <div className="bg-surface-container rounded-2xl p-6 mb-6 animate-fade-in-up animate-delay-100">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Core Tech Stack</p>
          <div className="flex flex-wrap gap-2">
            {user.techStack.map(tech => (
              <span key={tech} className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface border border-outline-variant/10">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ratings */}
      <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up animate-delay-100">
        <div className="bg-surface-container rounded-2xl p-6 text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Interviewer Rating</p>
          <p className="text-5xl font-headline font-black text-on-surface">
            {user.interviewerRating.toFixed(1)}
            <span className="text-xl text-on-surface-variant font-medium">/10</span>
          </p>
          <div className="flex justify-center gap-1 my-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-lg ${i < Math.round(user.interviewerRating / 2) ? 'text-primary' : 'text-on-surface-variant/20'}`}>★</span>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant">Top 5% of active interviewers</p>
        </div>
        <div className="bg-surface-container rounded-2xl p-6 text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Candidate Rating</p>
          <p className="text-5xl font-headline font-black text-tertiary">
            {user.candidateRating.toFixed(1)}
            <span className="text-xl text-on-surface-variant font-medium">/10</span>
          </p>
          <div className="flex justify-center gap-1 my-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-lg ${i < Math.round(user.candidateRating / 2) ? 'text-tertiary' : 'text-on-surface-variant/20'}`}>★</span>
            ))}
          </div>
          <p className="text-xs text-on-surface-variant">Exceptional technical clarity</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-surface-container-low rounded-2xl p-6 mb-6 animate-fade-in-up animate-delay-200">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h4 className="text-base font-headline font-bold text-on-surface">Past Performance History</h4>
            <p className="text-xs text-on-surface-variant mt-1">Consistency over the last 6 months</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-on-surface-variant">Interviewer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-tertiary" />
              <span className="text-[10px] font-bold text-on-surface-variant">Candidate</span>
            </div>
          </div>
        </div>
        <div className="h-40 flex items-end justify-between gap-3">
          {monthlyStats.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: '120px' }}>
                <div
                  className="w-full bg-tertiary/25 group-hover:bg-tertiary/50 transition-all rounded-t-sm"
                  style={{ height: `${(m.candidateAvg / 10) * 100}%`, minHeight: m.sessions > 0 ? '4px' : '0' }}
                />
                <div
                  className="w-full bg-primary/40 group-hover:bg-primary/70 transition-all rounded-t-sm"
                  style={{ height: `${(m.interviewerAvg / 10) * 100}%`, minHeight: m.sessions > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-[9px] font-bold text-on-surface-variant/60">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-surface-container rounded-2xl p-6 mb-6 animate-fade-in-up animate-delay-300">
        <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-5">Recent Sessions</h4>
        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <p className="text-sm text-on-surface-variant/60 text-center py-4">No sessions yet.</p>
          ) : (
            recentSessions.map((s) => {
              const isInterviewer = s.role === 'INTERVIEWER';
              const feedback = s.interview?.feedback?.[0];
              const score = isInterviewer ? feedback?.interviewerRating : feedback?.candidateRating;
              return (
                <div key={s.id} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isInterviewer ? 'bg-surface-bright text-primary' : 'bg-surface-bright text-tertiary'}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          {isInterviewer ? 'terminal' : 'code'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                            {(isInterviewer ? s.interview?.interviewerQuestion?.topic : s.interview?.candidateQuestion?.topic) ?? 'DSA Session'}
                          </p>
                        <p className="text-[10px] text-on-surface-variant/60">
                          {new Date(s.slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isInterviewer ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                      {isInterviewer ? 'Interviewer' : 'Candidate'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/5">
                    <span className="text-[10px] text-on-surface-variant">
                      {isInterviewer ? 'Rating Given' : 'Score Received'}
                    </span>
                    <span className="text-sm font-headline font-bold text-on-surface">
                      {score != null ? `${score} / 10` : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <button className="w-full mt-5 py-2 text-xs font-bold text-primary hover:underline transition-all">
          View Full History
        </button>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-br from-primary-container to-[#1a1a4a] rounded-2xl p-8 relative overflow-hidden animate-fade-in-up">
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <span className="material-symbols-outlined text-on-primary-container text-4xl block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          <h5 className="text-xl font-headline font-extrabold text-on-primary-container">Level Up Your Skills</h5>
          <p className="text-on-primary-container/80 text-sm mt-2 mb-6 leading-relaxed max-w-md">
            Book a session with a FAANG architect to refine your system design patterns.
          </p>
          <a href="/book-slot" className="inline-block px-6 py-3 bg-white text-on-primary-fixed rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform">
            Start Practice
          </a>
        </div>
      </div>
    </div>
  );
}
