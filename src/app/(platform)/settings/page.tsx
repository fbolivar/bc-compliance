import { getCurrentOrg } from '@/shared/lib/get-org';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import Link from 'next/link';
import { Users, KeyRound, ScrollText, ChevronRight, Building2 } from 'lucide-react';
import { OrgSettingsForm } from '@/features/organizations/components/OrgSettingsForm';

export default async function SettingsPage() {
  const { orgId, isPlatformOwner } = await getCurrentOrg();
  if (!orgId) redirect('/login');
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, tax_id, industry, country, address, plan, logo_url')
    .eq('id', orgId)
    .single();

  const settingsSections = [
    ...(isPlatformOwner ? [{
      title: 'Gestion de Clientes',
      description: 'Crea y administra organizaciones cliente',
      href: '/settings/clients',
      icon: Building2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    }] : []),
    {
      title: 'Usuarios y Miembros',
      description: 'Gestiona los miembros del equipo e invitaciones',
      href: '/settings/users',
      icon: Users,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
    },
    {
      title: 'Roles y Permisos',
      description: 'Configura roles y permisos de acceso',
      href: '/settings/roles',
      icon: KeyRound,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Log de Auditoria',
      description: 'Registro inmutable de todas las acciones',
      href: '/settings/audit-log',
      icon: ScrollText,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Configuracion"
        description="Administra tu organizacion, usuarios y preferencias"
      />

      {/* Organization Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Perfil de la Organizacion</h2>
        {org && <OrgSettingsForm organization={org} />}
      </div>

      {/* Settings Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex items-start gap-4 p-4 sm:p-5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <div className={`p-2.5 rounded-xl border ${section.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                    {section.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
                <p className="text-xs text-slate-500 mt-1">{section.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
