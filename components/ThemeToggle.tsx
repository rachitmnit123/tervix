'use client';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
        theme === 'dark'
          ? 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
          : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
      } ${className}`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
