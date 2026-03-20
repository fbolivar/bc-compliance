import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlatformSidebar } from '@/features/dashboard/components/PlatformSidebar';
import { MobileSidebar } from '@/features/dashboard/components/MobileSidebar';
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
      <main className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center h-14 sm:h-16 px-3 sm:px-6 bg-slate-900/95 backdrop-blur border-b border-slate-800 gap-3">
          <MobileSidebar />
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-slate-400 truncate max-w-[120px] sm:max-w-none">{user.email}</span>
            <LogoutButton />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
