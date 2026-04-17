import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, ThemeScript } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
  title: 'Tervix – Peer Mock Interviews',
  description: 'Sharpen your DSA skills with same-day peer mock interviews.',
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} font-body bg-background text-on-background antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
