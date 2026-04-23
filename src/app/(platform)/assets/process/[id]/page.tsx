import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getProcessById } from '@/features/assets/services/processService';
import { getDependenciesByProcess } from '@/features/assets/services/dependencyService';
import { PageHeader } from '@/shared/components/PageHeader';
import { DependencyList } from '@/features/assets/components/DependencyList';
import { ProcessIcon } from '@/features/assets/components/ProcessIcon';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const FAMILY_THEME: Record<string, { text: string; bg: string; border: string }> = {
  'Procesos Estratégicos': { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  'Procesos Misionales': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Procesos de Apoyo': { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Procesos de Seguimiento y Control': { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  'Procesos de Evaluación': { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export default async function ProcessDetailPage({ params }: Props) {
  const { id } = await params;

  const { orgId } = await requireOrg();
  const process = await getProcessById(id, orgId);
  if (!process) notFound();

  const dependencies = await getDependenciesByProcess(id, orgId);
  const totalAssets = dependencies.reduce((sum, d) => sum + d.asset_count, 0);

  const theme = FAMILY_THEME[process.family_name] ?? { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link
          href="/assets"
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver a procesos"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/assets" className="hover:text-slate-700">Activos</Link>
          <span>/</span>
          <span className={`${theme.text} font-medium`}>{process.family_name}</span>
        </nav>
      </div>

      <section className={`rounded-2xl border ${theme.border} ${theme.bg} p-6 shadow-sm`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border ${theme.border}`}>
            <ProcessIcon name={process.icon} className={`w-7 h-7 ${theme.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold ${theme.text} uppercase tracking-wider`}>
              Proceso
            </p>
            <PageHeader
              title={process.name}
              description={`${dependencies.length} ${dependencies.length === 1 ? 'dependencia' : 'dependencias'} · ${totalAssets} ${totalAssets === 1 ? 'activo' : 'activos'} en total`}
            />
          </div>
        </div>
      </section>

      <DependencyList
        processId={process.id}
        processName={process.name}
        dependencies={dependencies}
      />
    </div>
  );
}
