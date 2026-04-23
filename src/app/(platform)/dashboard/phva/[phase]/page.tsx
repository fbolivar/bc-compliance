import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Compass, Wrench, ClipboardCheck, Repeat } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { PageHeader } from '@/shared/components/PageHeader';
import { getPhvaBreakdown, type PhvaPhase } from '@/features/dashboard/services/phvaBreakdown';

interface Props {
  params: Promise<{ phase: string }>;
}

const VALID_PHASES: PhvaPhase[] = ['planear', 'hacer', 'verificar', 'actuar'];

const PHASE_ICON: Record<PhvaPhase, React.ComponentType<{ className?: string }>> = {
  planear: Compass, hacer: Wrench, verificar: ClipboardCheck, actuar: Repeat,
};

const STATUS_COLORS: Record<string, string> = {
  ok: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  warning: 'text-amber-700 bg-amber-50 border-amber-200',
  bad: 'text-rose-700 bg-rose-50 border-rose-200',
};

export default async function PhvaPhasePage({ params }: Props) {
  const { phase } = await params;
  if (!VALID_PHASES.includes(phase as PhvaPhase)) notFound();

  const { orgId } = await requireOrg();
  const data = await getPhvaBreakdown(orgId, phase as PhvaPhase);
  const Icon = PHASE_ICON[phase as PhvaPhase];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={`Detalle PHVA · ${data.phaseLabel}`}
          description={data.description}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">¿Qué compone este indicador?</h2>
            <p className="text-xs text-slate-500">
              Detalle de los elementos que integran el cálculo de madurez de la fase.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data.items.map((item, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">{item.category}</h3>
              <span className={`text-2xl font-bold tabular-nums ${
                item.pct >= 80 ? 'text-emerald-600' :
                item.pct >= 50 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {item.pct}%
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div
                className={`h-full transition-all ${
                  item.pct >= 80 ? 'bg-emerald-500' :
                  item.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${item.pct}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 mb-3">
              {item.done} de {item.total} {item.done === 1 ? 'elemento' : 'elementos'}
            </p>

            <div className="flex flex-wrap gap-2">
              {item.details.map((d, j) => (
                <span
                  key={j}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_COLORS[d.status]}`}
                >
                  <span className="text-slate-500">{d.label}:</span>
                  <span className="font-bold tabular-nums">{d.value}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
