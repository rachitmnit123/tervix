export const dynamic = 'force-dynamic';

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  async function handleGoogleLogin() {
    setLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  return (
    <div className="animate-fade-in-up">
      {/* Logo */}
      <div className="flex justify-center mb-10">
        <img src="/tervixlogo.png" alt="Tervix" style={{ height: '100px', width: 'auto' }} />
      </div>

      <div className="bg-surface-container rounded-2xl p-8 border border-outline-variant/10">
        <h2 className="text-2xl font-headline font-black text-on-surface mb-2 text-center">
          Welcome to Tervix
        </h2>
        <p className="text-on-surface-variant text-sm mb-8 text-center leading-relaxed">
          Practice DSA interviews with real peers.<br />
          Sign in to book your first session.
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-error/10 text-error text-sm flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {error === 'OAuthAccountNotLinked'
              ? 'This email is already linked to a different account.'
              : 'Authentication failed. Please try again.'}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-white text-gray-800 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 shadow-sm border border-gray-200"
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="mt-6 pt-6 border-t border-outline-variant/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: 'bolt', label: 'Same-day slots' },
              { icon: 'code', label: 'Live coding' },
              { icon: 'star', label: 'Peer feedback' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>{icon}</span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-on-surface-variant/50 mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
