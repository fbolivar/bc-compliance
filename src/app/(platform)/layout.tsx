import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { PlatformSidebar } from '@/features/dashboard/components/PlatformSidebar';
import { MobileSidebar } from '@/features/dashboard/components/MobileSidebar';
import { OrgSwitcher } from '@/features/dashboard/components/OrgSwitcher';
import { CommandPalette } from '@/shared/components/CommandPalette';

export const metadata = {
  title: 'BC Trust - GRC & SecOps Platform',
  description: 'Plataforma unificada de ciberseguridad y cumplimiento normativo',
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization, isPlatformOwner, userName, memberships } = await getCurrentOrg();

  if (!user) {
    redirect('/login');
  }

  const org = organization as { id?: string; name?: string; plan?: string } | null;
  const orgName = org?.name || 'Mi Organización';
  const orgPlan = org?.plan || 'starter';

  return (
    <div className="flex h-screen bg-slate-50">
      <CommandPalette />
      <PlatformSidebar isPlatformOwner={isPlatformOwner} userEmail={user.email || ''} userName={userName || ''} />
      <main className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center h-12 sm:h-14 px-3 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 gap-3">
          <MobileSidebar isPlatformOwner={isPlatformOwner} />
          <div className="flex-1 min-w-0" />

          {/* Org switcher (solo si user pertenece a >1 org) */}
          {organization && memberships && memberships.length > 1 && (
            <OrgSwitcher
              current={{
                id: org!.id ?? '',
                name: orgName,
                slug: null,
                plan: orgPlan,
                is_platform_owner: isPlatformOwner,
              }}
              memberships={memberships}
            />
          )}

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right">
              <p className="text-[13px] font-medium text-slate-700 leading-tight">{orgName}</p>
              <p className="text-[10px] text-slate-400 leading-tight uppercase tracking-wider">Plan {orgPlan}</p>
            </div>
            <span className="sm:hidden text-[13px] text-slate-700 truncate max-w-[150px]">{orgName}</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
