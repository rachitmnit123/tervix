export const dynamic = 'force-dynamic';

'use client';
import { useEffect, useState } from 'react';
import AdminNav from '../_components/AdminNav';

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInterviews(); }, [page, statusFilter]);

  async function fetchInterviews() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/admin/interviews?${params}`);
    const data = await res.json();
    setInterviews(data.interviews || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  async function forceEnd(id: string) {
    if (!confirm('Force end this interview?')) return;
    await fetch(`/api/admin/interviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'force_end' }),
    });
    fetchInterviews();
  }

  const statusColors: Record<string, string> = {
    SCHEDULED: '#c0c1ff', IN_PROGRESS: '#ffb695', COMPLETED: '#4ade80', CANCELLED: '#ffb4ab',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326' }}>
      <AdminNav active="interviews" />
      <main style={{ flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#dae2fd' }}>Interviews</h1>
            <p style={{ margin: '4px 0 0', color: '#c7c4d8', fontSize: 13 }}>{total} total interviews</p>
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '8px 14px', background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 8, color: '#dae2fd', fontSize: 13, outline: 'none' }}>
            <option value="">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? <p style={{ color: '#c7c4d8' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(70,69,85,0.3)' }}>
                {['Participants', 'Question', 'Status', 'Duration', 'Started', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#c7c4d8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interviews.map(iv => (
                <tr key={iv.id} style={{ borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                  <td style={{ padding: '12px', color: '#dae2fd' }}>
                    {iv.bookings.map((b: any) => (
                      <div key={b.id} style={{ fontSize: 12 }}>
                        <span style={{ color: b.role === 'INTERVIEWER' ? '#c0c1ff' : '#ffb695' }}>{b.role === 'INTERVIEWER' ? '🎤' : '💻'}</span>
                        {' '}{b.user?.name}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: '12px', color: '#c7c4d8', maxWidth: 180 }}>
                    <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {iv.candidateQuestion?.title}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: statusColors[iv.status] || '#c7c4d8', background: `${statusColors[iv.status]}20` }}>
                      {iv.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#c7c4d8' }}>
                    {iv.durationMinutes ? `${iv.durationMinutes}m` : '—'}
                  </td>
                  <td style={{ padding: '12px', color: '#c7c4d8' }}>
                    {iv.startedAt ? new Date(iv.startedAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {iv.status === 'IN_PROGRESS' && (
                      <button onClick={() => forceEnd(iv.id)} style={{ padding: '4px 10px', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 6, color: '#ffb4ab', fontSize: 12, cursor: 'pointer' }}>
                        Force End
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 6, color: '#dae2fd', cursor: 'pointer', fontSize: 13 }}>← Prev</button>}
          <span style={{ padding: '6px 14px', color: '#c7c4d8', fontSize: 13 }}>Page {page}</span>
          {interviews.length === 20 && <button onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 6, color: '#dae2fd', cursor: 'pointer', fontSize: 13 }}>Next →</button>}
        </div>
      </main>
    </div>
  );
}
