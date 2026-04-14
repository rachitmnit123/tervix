export const dynamic = 'force-dynamic';

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '../_components/AdminNav';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => {
      if (r.status === 401) { router.push('/admin/login'); return null; }
      return r.json();
    }).then(d => d && setStats(d));
  }, []);

  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#c0c1ff' },
    { label: 'New This Week', value: stats.newUsersThisWeek, icon: '📈', color: '#ffb695' },
    { label: 'Total Interviews', value: stats.totalInterviews, icon: '🎯', color: '#c0c1ff' },
    { label: 'Completed', value: stats.completedInterviews, icon: '✅', color: '#4ade80' },
    { label: 'In Progress', value: stats.inProgressInterviews, icon: '⚡', color: '#ffb695' },
    { label: 'Questions', value: stats.totalQuestions, icon: '❓', color: '#c0c1ff' },
    { label: 'Avg Candidate Rating', value: stats.avgCandidateRating, icon: '⭐', color: '#ffb695' },
    { label: 'Avg Interviewer Rating', value: stats.avgInterviewerRating, icon: '⭐', color: '#c0c1ff' },
  ] : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326' }}>
      <AdminNav active="dashboard" />
      <main style={{ flex: 1, padding: 32 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#dae2fd' }}>Dashboard</h1>
        <p style={{ margin: '0 0 32px', color: '#c7c4d8', fontSize: 14 }}>Platform overview and key metrics</p>

        {!stats ? (
          <p style={{ color: '#c7c4d8' }}>Loading...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {cards.map(({ label, value, icon, color }) => (
              <div key={label} style={{ background: '#171f33', borderRadius: 12, padding: 20, border: '1px solid rgba(70,69,85,0.2)' }}>
                <p style={{ margin: '0 0 8px', fontSize: 24 }}>{icon}</p>
                <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color }}>{value}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#c7c4d8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Manage Questions', desc: 'Add, edit or delete DSA questions', href: '/admin/questions', icon: '📝' },
            { label: 'Manage Users', desc: 'View and manage platform users', href: '/admin/users', icon: '👤' },
            { label: 'Manage Interviews', desc: 'Monitor and manage active sessions', href: '/admin/interviews', icon: '🎥' },
          ].map(({ label, desc, href, icon }) => (
            <a key={href} href={href} style={{ background: '#171f33', borderRadius: 12, padding: 20, border: '1px solid rgba(70,69,85,0.2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.2s' }}>
              <span style={{ fontSize: 32 }}>{icon}</span>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#dae2fd' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#c7c4d8' }}>{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
