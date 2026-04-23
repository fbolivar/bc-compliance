import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2 } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getDependencyById, getAssetsByDependency } from '@/features/assets/services/dependencyService';
import { PageHeader } from '@/shared/components/PageHeader';
import { DependencyAssetList } from '@/features/assets/components/DependencyAssetList';

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

export default async function DependencyDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const { orgId } = await requireOrg();
  const dep = await getDependencyById(id, orgId);
  if (!dep) notFound();

  const page = Number(sp.page) || 1;
  const result = await getAssetsByDependency(id, orgId, { page, pageSize: 25 });

  const theme = dep.family_name ? FAMILY_THEME[dep.family_name] ?? null : null;
  const accentText = theme?.text ?? 'text-slate-700';
  const accentBg = theme?.bg ?? 'bg-slate-50';
  const accentBorder = theme?.border ?? 'border-slate-200';
  const autoOpen = sp.new === '1';

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link
          href={`/assets/process/${dep.process_id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al proceso"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/assets" className="hover:text-slate-700">Activos</Link>
          <span>/</span>
          {dep.family_name && (
            <>
              <span className={`${accentText} font-medium`}>{dep.family_name}</span>
              <span>/</span>
            </>
          )}
          <Link href={`/assets/process/${dep.process_id}`} className="hover:text-slate-700">
            {dep.process_name}
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{dep.name}</span>
        </nav>
      </div>

      <section className={`rounded-2xl border ${accentBorder} ${accentBg} p-6 shadow-sm`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border ${accentBorder}`}>
            <Building2 className={`w-7 h-7 ${accentText}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[11px] font-medium rounded border bg-white text-slate-600 border-slate-200">
                {dep.kind}
              </span>
              <span className="text-xs text-slate-500">· en {dep.process_name}</span>
            </div>
            <PageHeader
              title={dep.name}
              description={dep.description ?? `${dep.asset_count} activo${dep.asset_count === 1 ? '' : 's'} vinculado${dep.asset_count === 1 ? '' : 's'} a esta dependencia`}
            />
          </div>
        </div>
      </section>

      <DependencyAssetList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
        dependencyId={dep.id}
        dependencyName={dep.name}
        dependencyKind={dep.kind}
        processName={dep.process_name}
        categoryId={dep.process_id}
        autoOpenForm={autoOpen}
      />
    </div>
  );
}
