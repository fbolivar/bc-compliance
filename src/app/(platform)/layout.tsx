import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlatformSidebar } from '@/features/dashboard/components/PlatformSidebar';
import { LogoutButton } from '@/features/auth/components/LogoutButton';

export const metadata = {
  title: 'BC Compliance - GRC & SecOps Platform',
  description: 'Plataforma unificada de ciberseguridad y cumplimiento normativo',
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <PlatformSidebar />
      <main className="lg:pl-64 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center h-16 px-6 bg-slate-900/95 backdrop-blur border-b border-slate-800">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user.email}</span>
            <LogoutButton />
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
