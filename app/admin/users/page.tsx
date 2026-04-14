export const dynamic = 'force-dynamic';

'use client';
import { useEffect, useState } from 'react';
import AdminNav from '../_components/AdminNav';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, [page, search]);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${page}&search=${search}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326' }}>
      <AdminNav active="users" />
      <main style={{ flex: 1, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#dae2fd' }}>Users</h1>
            <p style={{ margin: '4px 0 0', color: '#c7c4d8', fontSize: 13 }}>{total} total users</p>
          </div>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '8px 14px', background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 8, color: '#dae2fd', fontSize: 13, width: 260, outline: 'none' }}
          />
        </div>

        {loading ? <p style={{ color: '#c7c4d8' }}>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(70,69,85,0.3)' }}>
                {['User', 'Email', 'Sessions', 'Candidate Rating', 'Interviewer Rating', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#c7c4d8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {u.image ? <img src={u.image} style={{ width: 28, height: 28, borderRadius: '50%' }} /> : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#222a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#c0c1ff', fontWeight: 700 }}>{u.name[0]}</div>}
                      <span style={{ color: '#dae2fd', fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#c7c4d8' }}>{u.email}</td>
                  <td style={{ padding: '12px', color: '#c7c4d8' }}>{u.totalSessions}</td>
                  <td style={{ padding: '12px', color: '#ffb695' }}>{u.candidateRating.toFixed(1)}</td>
                  <td style={{ padding: '12px', color: '#c0c1ff' }}>{u.interviewerRating.toFixed(1)}</td>
                  <td style={{ padding: '12px', color: '#c7c4d8' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => deleteUser(u.id)} style={{ padding: '4px 12px', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 6, color: '#ffb4ab', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 6, color: '#dae2fd', cursor: 'pointer', fontSize: 13 }}>← Prev</button>}
          <span style={{ padding: '6px 14px', color: '#c7c4d8', fontSize: 13 }}>Page {page} · {total} users</span>
          {users.length === 20 && <button onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', background: '#171f33', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 6, color: '#dae2fd', cursor: 'pointer', fontSize: 13 }}>Next →</button>}
        </div>
      </main>
    </div>
  );
}
