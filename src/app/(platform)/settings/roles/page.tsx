import { requireOrg } from '@/shared/lib/get-org';
import { PageHeader } from '@/shared/components/PageHeader';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

const SYSTEM_ROLES = [
  {
    role: 'owner',
    label: 'Propietario',
    description: 'Acceso completo a todos los modulos y configuraciones. Puede gestionar usuarios y planes.',
    permissions: ['Todos los permisos', 'Gestion de usuarios', 'Configuracion de la organizacion', 'Facturacion'],
    color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  },
  {
    role: 'admin',
    label: 'Administrador',
    description: 'Acceso completo a todos los modulos. Puede gestionar usuarios pero no la facturacion.',
    permissions: ['Todos los modulos', 'Gestion de usuarios', 'Configuracion del sistema'],
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  },
  {
    role: 'compliance_manager',
    label: 'Gestor de Compliance',
    description: 'Gestion de frameworks, SOA, auditorias y reportes de cumplimiento.',
    permissions: ['Compliance', 'Auditorias', 'Documentos', 'Riesgos (lectura)'],
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  },
  {
    role: 'risk_analyst',
    label: 'Analista de Riesgos',
    description: 'Evaluacion de riesgos, vulnerabilidades y amenazas.',
    permissions: ['Riesgos', 'Vulnerabilidades', 'Amenazas', 'Activos (lectura)'],
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  {
    role: 'auditor',
    label: 'Auditor',
    description: 'Solo lectura en todos los modulos. Puede crear hallazgos de auditoria.',
    permissions: ['Lectura total', 'Crear hallazgos', 'Exportar reportes'],
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  },
  {
    role: 'viewer',
    label: 'Observador',
    description: 'Solo lectura en todos los modulos. Sin capacidad de crear ni modificar.',
    permissions: ['Solo lectura'],
    color: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  },
];

export default async function SettingsRolesPage() {
  await requireOrg();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Roles y Permisos"
          description="Roles del sistema con permisos predefinidos (RBAC)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYSTEM_ROLES.map((roleInfo) => (
          <div key={roleInfo.role} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg border ${roleInfo.color}`}>
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{roleInfo.label}</h3>
                <p className="text-xs font-mono text-slate-500">{roleInfo.role}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">{roleInfo.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {roleInfo.permissions.map((perm) => (
                <span key={perm} className="px-2 py-0.5 rounded-md text-xs bg-slate-800 text-slate-400 border border-slate-700">
                  {perm}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-sm text-amber-400 font-medium">Nota sobre roles personalizados</p>
        <p className="text-xs text-amber-400/70 mt-1">
          Los roles personalizados con permisos granulares estaran disponibles en el plan Enterprise.
          Por ahora, los roles del sistema cubren los casos de uso mas comunes.
        </p>
      </div>
    </div>
  );
}
