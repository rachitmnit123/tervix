import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className="min-h-screen pb-20 md:pb-0 transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 16rem)' }}
      >
        {children}
      </main>
    </div>
  );
}
