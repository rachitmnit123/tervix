'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/admin/dashboard');
    } else {
      setError(data.error || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1326' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 32, background: '#171f33', borderRadius: 16, border: '1px solid rgba(70,69,85,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <img
              src="/tervixlogo.png"
              alt="Tervix"
              style={{
                height: 100,
                width: 'auto',
                objectFit: 'contain',
                margin: '0 auto',
                display: 'block'
              }}
            />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#dae2fd' }}>Admin Portal</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#c7c4d8' }}>Tervix Administration</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 10, marginBottom: 16, color: '#ffb4ab', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@tervix.io"
              style={{ width: '100%', padding: '10px 14px', background: '#222a3d', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, color: '#dae2fd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', background: '#222a3d', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 10, color: '#dae2fd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #c0c1ff, #4b4dd8)', border: 'none', borderRadius: 10, color: '#1000a9', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In to Admin'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(199,196,216,0.4)' }}>
          This portal is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
