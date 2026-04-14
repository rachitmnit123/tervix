'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/book-slot', icon: 'event_available', label: 'Book Slot' },
  { href: '/history', icon: 'history', label: 'History' },
  { href: '/profile', icon: 'account_circle', label: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Push collapsed state to a CSS variable on <html> so layout shifts globally
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '4rem' : '16rem'
    );
  }, [collapsed]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-surface-container-low flex flex-col py-6 z-50 hidden md:flex transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo + collapse toggle */}
<div className={`mb-10 flex items-center ${collapsed ? 'justify-center px-0' : 'px-6'} relative`}>

  {!collapsed ? (
    <div className="flex items-center gap-3 flex-1">
      {/* Logo */}
      <img 
        src="/tervixlogo.png" 
        alt="Tervix" 
        className="h-12 w-auto object-contain"
      />

      {/* Text (ONLY when expanded) */}
      <span className="text-lg font-bold text-on-surface tracking-wide">
        Tervix
      </span>
    </div>
  ) : (
    <img 
      src="/tervixlogo.png" 
      alt="Tervix" 
      className="h-10 w-auto object-contain"
    />
  )}

  {/* Toggle button */}
  <button
    onClick={() => setCollapsed(!collapsed)}
    className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-all shadow-md"
  >
    <span className="material-symbols-outlined text-sm">
      {collapsed ? 'chevron_right' : 'chevron_left'}
    </span>
  </button>
</div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'nav-active'
                    : 'text-on-surface/40 hover:bg-surface-bright/20 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined shrink-0" style={{ fontSize: '20px' }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto px-2 space-y-1">
          {/* <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-1'} mb-1`}>
            <ThemeToggle />
            {!collapsed && <span className="text-xs text-on-surface-variant ml-2">Theme</span>}
          </div>
          <Link
            href="/settings"
            title={collapsed ? 'Settings' : undefined}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-on-surface/40 hover:bg-surface-bright/20 hover:text-on-surface transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: '20px' }}>settings</span>
            {!collapsed && <span>Settings</span>}
          </Link> */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-on-surface/40 hover:bg-surface-bright/20 hover:text-on-surface transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: '20px' }}>logout</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-outline-variant/10 px-2 py-2 flex justify-around items-center z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                isActive ? 'text-primary' : 'text-on-surface/40'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
