import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import Link from 'next/link';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { UsersPageClient } from '@/features/organizations/components/UsersPageClient';

export default async function SettingsUsersPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  // Get members with profile info
  const { data: members } = await supabase
    .from('organization_members')
    .select('id, role, is_owner, is_active, joined_at, user_id, profiles(email, full_name)')
    .eq('organization_id', orgId)
    .order('joined_at', { ascending: false });

  // Get invitations
  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, email, role, status, token, expires_at, created_at, invited_by')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  const memberList = members || [];
  const invitationList = invitations || [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bc-compliance.vercel.app';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/settings" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Usuarios y Miembros"
          description={`${memberList.length} miembros · ${invitationList.filter(i => i.status === 'pending').length} invitaciones pendientes`}
        />
      </div>

      {/* Client wrapper for invite button + modal + invitations list */}
      <UsersPageClient invitations={invitationList} siteUrl={siteUrl} />

      {/* Members Table */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
          Miembros activos ({memberList.length})
        </h3>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {memberList.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-sm text-slate-500">No hay miembros registrados</p>
            </div>
          ) : (
            memberList.map((member) => {
              const profile = member.profiles as { email?: string; full_name?: string } | null;
              return (
                <div key={member.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <UserCircle className="w-8 h-8 text-slate-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 font-medium truncate">
                        {profile?.full_name || profile?.email || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{profile?.email || member.user_id}</p>
                    </div>
                    <StatusBadge status={member.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 capitalize">
                      {member.is_owner ? 'Owner' : (member.role?.replace(/_/g, ' ') || 'viewer')}
                    </span>
                    <span>
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString('es-CO', { dateStyle: 'short' })
                        : '-'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha union</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {memberList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-sm text-slate-500">No hay miembros registrados</p>
                    </td>
                  </tr>
                ) : (
                  memberList.map((member) => {
                    const profile = member.profiles as { email?: string; full_name?: string } | null;
                    return (
                      <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserCircle className="w-8 h-8 text-slate-600" />
                            <div>
                              <p className="text-sm text-slate-200 font-medium">
                                {profile?.full_name || 'Sin nombre'}
                              </p>
                              <p className="text-xs text-slate-500">{profile?.email || member.user_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                            {member.is_owner ? 'Owner' : (member.role?.replace(/_/g, ' ') || 'viewer')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={member.is_active ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })
                            : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
