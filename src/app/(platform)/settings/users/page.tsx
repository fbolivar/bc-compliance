import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import Link from 'next/link';
import { ArrowLeft, UserCircle } from 'lucide-react';

export default async function SettingsUsersPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from('organization_members')
    .select('id, role, is_active, joined_at, user_id')
    .eq('organization_id', orgId)
    .order('joined_at', { ascending: false });

  const memberList = members || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Usuarios y Miembros"
          description={`${memberList.length} miembros en la organizacion`}
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
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
                memberList.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserCircle className="w-8 h-8 text-slate-600" />
                        <span className="font-mono text-xs text-slate-400">{member.user_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                        {member.role?.replace(/_/g, ' ') || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={member.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
