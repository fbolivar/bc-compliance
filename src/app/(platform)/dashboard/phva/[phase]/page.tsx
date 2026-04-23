import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Compass, Wrench, ClipboardCheck, Repeat, AlertTriangle, Sparkles } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getPhvaBreakdown, type PhvaPhase } from '@/features/dashboard/services/phvaBreakdown';
import { maturityFromScore } from '@/features/dashboard/services/executiveDashboardService';

interface Props {
  params: Promise<{ phase: string }>;
}

const VALID_PHASES: PhvaPhase[] = ['planear', 'hacer', 'verificar', 'actuar'];

const PHASE_THEME: Record<PhvaPhase, {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  bg: string;
  border: string;
  bar: string;
  ring: string;
  iconBg: string;
}> = {
  planear: { icon: Compass, text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', bar: 'bg-sky-500', ring: 'ring-sky-500', iconBg: 'bg-sky-100' },
  hacer: { icon: Wrench, text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', ring: 'ring-emerald-500', iconBg: 'bg-emerald-100' },
  verificar: { icon: ClipboardCheck, text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500', ring: 'ring-amber-500', iconBg: 'bg-amber-100' },
  actuar: { icon: Repeat, text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', bar: 'bg-indigo-500', ring: 'ring-indigo-500', iconBg: 'bg-indigo-100' },
};

const PHASE_TABS: Array<{ key: PhvaPhase; label: string; short: string }> = [
  { key: 'planear', label: 'Planear', short: 'P' },
  { key: 'hacer', label: 'Hacer', short: 'H' },
  { key: 'verificar', label: 'Verificar', short: 'V' },
  { key: 'actuar', label: 'Actuar', short: 'A' },
];

const STATUS_PILL: Record<string, string> = {
  ok: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  warning: 'text-amber-700 bg-amber-50 border-amber-200',
  bad: 'text-rose-700 bg-rose-50 border-rose-200',
};

const BADGE_COLOR: Record<string, string> = {
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
};

const PRIORITY_STYLE: Record<string, { dot: string; label: string }> = {
  critical: { dot: 'bg-rose-500', label: 'Crítica' },
  high: { dot: 'bg-amber-500', label: 'Alta' },
  medium: { dot: 'bg-sky-500', label: 'Media' },
};

export default async function PhvaPhasePage({ params }: Props) {
  const { phase } = await params;
  if (!VALID_PHASES.includes(phase as PhvaPhase)) notFound();

  const { orgId } = await requireOrg();
  const data = await getPhvaBreakdown(orgId, phase as PhvaPhase);

  const currentPhase = phase as PhvaPhase;
  const theme = PHASE_THEME[currentPhase];
  const Icon = theme.icon;
  const maturity = maturityFromScore(data.phaseScore);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header con back + phase tabs */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg" aria-label="Fases PHVA">
          {PHASE_TABS.map((t) => {
            const isActive = t.key === currentPhase;
            return (
              <Link
                key={t.key}
                href={`/dashboard/phva/${t.key}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="font-bold">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Hero score card */}
      <section
        className={`rounded-2xl border ${theme.border} ${theme.bg} p-6 shadow-sm`}
        aria-label={`Madurez de fase ${data.phaseLabel}`}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl ${theme.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-7 h-7 ${theme.text}`} />
            </div>
            <div>
              <p className={`text-xs font-semibold ${theme.text} uppercase tracking-wider`}>Fase del SGSI</p>
              <h1 className="text-2xl font-bold text-slate-800 mt-0.5">{data.phaseLabel}</h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">{data.description}</p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-bold tabular-nums ${theme.text}`}>{data.phaseScore}</span>
              <span className="text-xl text-slate-400">%</span>
            </div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-1">
              {maturity.label}
            </span>
            <div className="w-40 h-1.5 mt-3 rounded-full bg-white/70 overflow-hidden">
              <div
                className={`h-full ${theme.bar} transition-all duration-700`}
                style={{ width: `${data.phaseScore}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Composition cards */}
      <section aria-label="Composición del indicador">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Composición del indicador
          </h2>
          <p className="text-xs text-slate-400">Métricas que conforman el cálculo</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">{item.category}</h3>
                <span className={`text-2xl font-bold tabular-nums ${
                  item.pct >= 80 ? 'text-emerald-600'
                    : item.pct >= 50 ? 'text-amber-600'
                    : 'text-rose-600'
                }`}>
                  {item.pct}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-500 ${
                    item.pct >= 80 ? 'bg-emerald-500'
                      : item.pct >= 50 ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>

              <p className="text-xs text-slate-500 mb-3">
                {item.done} de {item.total} {item.done === 1 ? 'elemento' : 'elementos'}
              </p>

              <div className="flex flex-wrap gap-2">
                {item.details.map((d, j) => {
                  const pill = (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_PILL[d.status]} ${d.href ? 'hover:opacity-80 transition-opacity' : ''}`}
                    >
                      <span className="opacity-70">{d.label}:</span>
                      <span className="font-bold tabular-nums">{d.value}</span>
                    </span>
                  );
                  return d.href ? (
                    <Link key={j} href={d.href}>{pill}</Link>
                  ) : (
                    <span key={j}>{pill}</span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-column: Top items + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top items (2/3) */}
        <section aria-label={data.topItemsTitle} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {data.topItemsTitle}
            </h2>
            <p className="text-xs text-slate-400">Acciona los más críticos primero</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {data.topItems.length === 0 ? (
              <div className="p-8 text-center">
                <Sparkles className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Sin elementos pendientes</p>
                <p className="text-xs text-slate-500 mt-1">Todos los registros están en buen estado.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.topItems.map((item, i) => (
                  <li key={i}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="font-mono text-xs text-slate-400 mt-0.5 flex-shrink-0 w-16 truncate">
                          {item.code}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900">
                            {item.title}
                          </p>
                          {item.meta && (
                            <p className="text-xs text-slate-400 mt-0.5">{item.meta}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${BADGE_COLOR[item.badgeColor]}`}>
                          {item.badge}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Recommendations (1/3) */}
        <section aria-label="Acciones recomendadas">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              Próxima mejor acción
            </h2>
          </div>
          <div className="space-y-3">
            {data.recommendations.map((rec, i) => {
              const p = PRIORITY_STYLE[rec.priority];
              return (
                <Link
                  key={i}
                  href={rec.href}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {p.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3 leading-snug">{rec.text}</p>
                  <div className="flex items-center gap-1 text-xs font-medium text-sky-600 group-hover:text-sky-700">
                    {rec.cta}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="pt-2 text-center">
        <p className="text-[11px] text-slate-400">
          Ciclo PHVA · Modelo de Seguridad y Privacidad MinTIC · ISO/IEC 27001:2022
        </p>
      </footer>
    </div>
  );
}
