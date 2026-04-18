import type { Metadata } from 'next';
import Link from 'next/link';
import './landing.css';

export const metadata: Metadata = {
  title: 'Tervix | Practice DSA Mock Interviews with Peers',
  description:
    'Practice real DSA mock interviews with peers. Book instant sessions, improve coding skills, and crack top tech interviews with Tervix.',
  icons: { icon: '/favicon.png' },
  openGraph: {
    title: 'Tervix | Practice DSA Mock Interviews with Peers',
    description:
      'Live peer-to-peer DSA mock interviews. Same-day slots, real-time coding, honest feedback.',
    type: 'website',
  },
};

const features = [
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
      </svg>
    ),
    title: 'Same-Day Slots',
    description: 'Find available peers today and schedule a session within hours — no waiting, no planning ahead.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25M9.75 9.75L7.5 12l2.25 2.25M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25z" />
      </svg>
    ),
    title: 'Live Coding Environment',
    description: 'Collaborate in a shared editor with syntax highlighting and real-time execution — just like the real thing.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: 'Structured Peer Feedback',
    description: 'After each session, both sides exchange feedback on communication, approach, and clarity.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Track Your Progress',
    description: 'See your interview history, feedback trends, and improvement over time — all in one place.',
  },
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LandingPage() {
  return (
    <>
      {/* NAV */}
      <nav className="lp-nav">
        <span className="lp-logo">Tervix</span>
        <Link href="/login" className="lp-nav-signin">Sign in</Link>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-badge">
          <span className="lp-badge-dot" />
          Peer-to-peer interview practice
        </div>

        <h1 className="lp-h1">
          Practice DSA Mock Interviews<br />
          with <span className="lp-accent">Real Peers</span>
        </h1>

        <p className="lp-sub">
          Tervix matches you with engineers at your level for live, same-day
          coding interviews — sharpen your skills the way that actually works.
        </p>

        <div className="lp-actions">
          <Link href="/login" className="lp-btn-primary">
            <GoogleIcon />
            Continue with Google
          </Link>
          <a href="#features" className="lp-btn-ghost">How it works ↓</a>
        </div>

        <div className="lp-proof">
          <div className="lp-avatars">
            {['A', 'R', 'M', 'K'].map((l) => (
              <div key={l} className="lp-avatar">{l}</div>
            ))}
          </div>
          <span>Join engineers already practicing on Tervix</span>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-features">
        <p className="lp-eyebrow">Why Tervix</p>
        <h2 className="lp-section-title">Everything you need to ace the technical round</h2>
        <div className="lp-cards">
          {features.map((f) => (
            <div key={f.title} className="lp-card">
              <div className="lp-card-icon">{f.icon}</div>
              <h3 className="lp-card-title">{f.title}</h3>
              <p className="lp-card-desc">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-wrap">
        <div className="lp-cta-box">
          <h2>Ready to level up?</h2>
          <p>Your next mock interview is one click away. No credit card required.</p>
          <Link href="/login" className="lp-btn-primary" style={{ display: 'inline-flex' }}>
            <GoogleIcon />
            Get started for free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <span className="lp-footer-logo">Tervix</span>
        <span className="lp-footer-copy">© {new Date().getFullYear()} Tervix. All rights reserved.</span>
      </footer>
    </>
  );
}