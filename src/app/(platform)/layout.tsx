import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/shared/lib/get-org';
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
  const { user, isPlatformOwner } = await getCurrentOrg();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <PlatformSidebar isPlatformOwner={isPlatformOwner} />
      <main className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center h-14 sm:h-16 px-3 sm:px-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 shadow-[0_1px_12px_0_rgba(0,0,0,0.4)] gap-3">
          <MobileSidebar isPlatformOwner={isPlatformOwner} />
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase">
                  {user.email?.charAt(0) ?? '?'}
                </span>
              </div>
              <span className="text-[13px] text-slate-400 truncate max-w-[120px] sm:max-w-none hidden sm:block">{user.email}</span>
            </div>
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
