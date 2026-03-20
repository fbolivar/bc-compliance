export const dynamic = 'force-dynamic';

import { getCurrentOrg } from '@/shared/lib/get-org';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { listClients } from '@/actions/clients';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { CreateClientSection } from '@/features/organizations/components/CreateClientSection';

interface ClientRow {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  country: string | null;
  plan: string;
  is_active: boolean;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
}

export default async function SettingsClientsPage() {
  const { isPlatformOwner } = await getCurrentOrg();
  if (!isPlatformOwner) redirect('/dashboard');
  const clients = (await listClients()) as ClientRow[];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/settings" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Gestion de Clientes"
          description={`${clients.length} organizaciones registradas`}
        />
      </div>

      <CreateClientSection />

      {/* Clients List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">
          Organizaciones ({clients.length})
        </h3>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {clients.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-sm text-slate-500">No hay clientes registrados</p>
            </div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 font-medium truncate">{client.name}</p>
                    <p className="text-xs text-slate-500 truncate">{client.owner_email || '-'}</p>
                  </div>
                  <StatusBadge status={client.is_active ? 'active' : 'inactive'} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 capitalize">{client.plan}</span>
                  <span>{new Date(client.created_at).toLocaleDateString('es-CO', { dateStyle: 'short' })}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Organizacion</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-500">No hay clientes registrados</p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-200 font-medium">{client.name}</p>
                          <p className="text-xs text-slate-500">{client.industry || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-slate-300">{client.owner_name || '-'}</p>
                        <p className="text-xs text-slate-500">{client.owner_email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                        {client.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={client.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(client.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
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
