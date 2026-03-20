import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { PlatformSidebar } from '@/features/dashboard/components/PlatformSidebar';
import { MobileSidebar } from '@/features/dashboard/components/MobileSidebar';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'BC Compliance - GRC & SecOps Platform',
  description: 'Plataforma unificada de ciberseguridad y cumplimiento normativo',
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization, isPlatformOwner } = await getCurrentOrg();

  if (!user) {
    redirect('/login');
  }

  const orgName = (organization as { name?: string } | null)?.name || 'Mi Organizacion';

  return (
    <div className="flex h-screen bg-slate-950">
      <PlatformSidebar isPlatformOwner={isPlatformOwner} userEmail={user.email || ''} />
      <main className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center h-14 sm:h-16 px-3 sm:px-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 shadow-[0_1px_12px_0_rgba(0,0,0,0.4)] gap-3">
          <MobileSidebar isPlatformOwner={isPlatformOwner} />
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[13px] font-medium text-slate-200 leading-tight">{orgName}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{user.email}</p>
            </div>
            <span className="sm:hidden text-[13px] text-slate-300 truncate max-w-[150px]">{orgName}</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
