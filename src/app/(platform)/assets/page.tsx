import Link from 'next/link';
import { requireOrg } from '@/shared/lib/get-org';
import { getProcessesGroupedByFamily } from '@/features/assets/services/processService';
import { getAssetCount } from '@/features/assets/services/assetService';
import { PageHeader } from '@/shared/components/PageHeader';
import { ProcessIcon } from '@/features/assets/components/ProcessIcon';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';

export const dynamic = 'force-dynamic';

const FAMILY_THEME: Record<string, { text: string; bg: string; border: string; accent: string }> = {
  'Procesos Estratégicos': { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', accent: 'bg-sky-500' },
  'Procesos Misionales': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500' },
  'Procesos de Apoyo': { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-500' },
  'Procesos de Seguimiento y Control': { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'bg-indigo-500' },
  'Procesos de Evaluación': { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-500' },
};

function themeFor(familyName: string) {
  return FAMILY_THEME[familyName] ?? { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', accent: 'bg-slate-500' };
}

export default async function AssetsPage() {
  const { orgId } = await requireOrg();
  const [families, totalAssets] = await Promise.all([
    getProcessesGroupedByFamily(orgId),
    getAssetCount(orgId),
  ]);

  const totalProcesses = families.reduce((sum, f) => sum + f.processes.length, 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Gestión de Activos (CMDB)"
          description="Inventario por proceso según el mapa institucional"
        />
        <div className="flex items-center gap-2">
          <a
            href="/api/assets/export"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar Excel
          </a>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Familias</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{families.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Procesos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalProcesses}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Activos totales</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalAssets}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Procesos con activos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {families.reduce((sum, f) => sum + f.processes.filter((p) => p.asset_count > 0).length, 0)}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {families.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">No hay familias de procesos configuradas.</p>
        </div>
      )}

      {/* Families with their processes */}
      <div className="space-y-6">
        {families.map((family) => {
          const theme = themeFor(family.name);
          return (
            <section
              key={family.id}
              aria-label={family.name}
              className={`rounded-2xl border ${theme.border} ${theme.bg} p-5 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center border ${theme.border}`}>
                    <ProcessIcon name={family.icon} className={`w-5 h-5 ${theme.text}`} />
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${theme.text}`}>{family.name}</h2>
                    <p className="text-xs text-slate-500">
                      {family.processes.length} {family.processes.length === 1 ? 'proceso' : 'procesos'} · {family.total_assets} {family.total_assets === 1 ? 'activo' : 'activos'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {family.processes.map((proc) => (
                  <Link
                    key={proc.id}
                    href={`/assets/process/${proc.id}`}
                    className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${theme.bg} flex items-center justify-center flex-shrink-0 border ${theme.border}`}>
                        <ProcessIcon name={proc.icon} className={`w-4 h-4 ${theme.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{proc.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {proc.asset_count} {proc.asset_count === 1 ? 'activo' : 'activos'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
