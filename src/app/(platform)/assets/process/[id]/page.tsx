import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getProcessById } from '@/features/assets/services/processService';
import { getAssetsByProcess } from '@/features/assets/services/assetService';
import { PageHeader } from '@/shared/components/PageHeader';
import { ProcessAssetList } from '@/features/assets/components/ProcessAssetList';
import { ProcessIcon } from '@/features/assets/components/ProcessIcon';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; new?: string }>;
}

const FAMILY_THEME: Record<string, { text: string; bg: string; border: string }> = {
  'Procesos Estratégicos': { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  'Procesos Misionales': { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Procesos de Apoyo': { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  'Procesos de Seguimiento y Control': { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  'Procesos de Evaluación': { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export default async function ProcessDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const { orgId } = await requireOrg();
  const process = await getProcessById(id, orgId);
  if (!process) notFound();

  const page = Number(sp.page) || 1;
  const result = await getAssetsByProcess(orgId, id, { page, pageSize: 25 });

  const theme = FAMILY_THEME[process.family_name] ?? { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };
  const autoOpenForm = sp.new === '1';

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
              description={`${process.asset_count} activo${process.asset_count === 1 ? '' : 's'} registrado${process.asset_count === 1 ? '' : 's'} en este proceso`}
            />
          </div>
        </div>
      </section>

      <ProcessAssetList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
        processId={process.id}
        processName={process.name}
        autoOpenForm={autoOpenForm}
      />
    </div>
  );
}
