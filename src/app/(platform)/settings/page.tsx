import { requireOrg } from '@/shared/lib/get-org';
import { PageHeader } from '@/shared/components/PageHeader';
import Link from 'next/link';
import { Users, Shield, FileText, ChevronRight } from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    href: '/settings/users',
    icon: Users,
    title: 'Usuarios y Miembros',
    description: 'Gestion de usuarios, invitaciones y asignacion de roles',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
  },
  {
    href: '/settings/roles',
    icon: Shield,
    title: 'Roles y Permisos',
    description: 'Configuracion de roles RBAC y permisos por modulo',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
  {
    href: '/settings/audit-log',
    icon: FileText,
    title: 'Log de Auditoria',
    description: 'Registro inmutable de todas las acciones realizadas en el sistema',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
];

export default async function SettingsPage() {
  const { organization } = await requireOrg();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracion"
        description="Ajustes de la organizacion, usuarios y seguridad del sistema"
      />

      {/* Organization info */}
      {organization && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Organizacion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Nombre</p>
              <p className="text-sm font-medium text-slate-200">{(organization as { name?: string }).name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Identificador (Slug)</p>
              <p className="text-sm font-mono text-cyan-400">{(organization as { slug?: string }).slug || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Plan</p>
              <p className="text-sm font-medium text-slate-200 capitalize">{(organization as { plan?: string }).plan || 'starter'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${section.bg} border ${section.border}`}>
                  <Icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">{section.title}</h3>
              <p className="text-xs text-slate-500">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
