'use client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin/dashboard',   label: 'Dashboard',   icon: '📊' },
  { href: '/admin/questions',   label: 'Questions',   icon: '��' },
  { href: '/admin/users',       label: 'Users',       icon: '👥' },
  { href: '/admin/interviews',  label: 'Interviews',  icon: '🎥' },
];

export default function AdminNav({ active }: { active: string }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  return (
    <aside style={{ width: 220, background: '#131b2e', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/tervixlogo.png" alt="Tervix" style={{ height: '50px', width: 'auto' }} />
          <span style={{ fontSize: 20, color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Admin</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map(({ href, label, icon }) => (
          <a key={href} href={href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
            marginBottom: 4, textDecoration: 'none', fontSize: 14, fontWeight: 600,
            background: active === label.toLowerCase() ? 'rgba(192,193,255,0.1)' : 'transparent',
            color: active === label.toLowerCase() ? '#c0c1ff' : '#c7c4d8',
            transition: 'all 0.15s',
          }}>
            <span>{icon}</span>
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(70,69,85,0.2)' }}>
        <button onClick={logout} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 8, color: '#ffb4ab', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
