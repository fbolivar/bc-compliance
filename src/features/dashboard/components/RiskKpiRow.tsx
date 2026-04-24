import Link from 'next/link';
import type { RiskZoneSummary } from '../services/executiveDashboardService';

interface Props {
  summary: RiskZoneSummary;
}

const ZONES = [
  { key: 'extremo' as const, label: 'Extremo', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  { key: 'alto' as const,    label: 'Alto',    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  { key: 'moderado' as const,label: 'Moderado',bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  { key: 'bajo' as const,    label: 'Bajo',    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
];

export function RiskKpiRow({ summary }: Props) {
  if (summary.total === 0) return null;

  const withoutPlan = summary.total - summary.withPlan;
  const planPct = Math.round((summary.withPlan / summary.total) * 100);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Panorama de Riesgos</h2>
        <Link href="/risks" className="text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors">
          Ver mapa de riesgos →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-700">{summary.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">{withoutPlan} sin plan</p>
        </div>

        {ZONES.map((z) => (
          <div key={z.key} className={`rounded-xl border p-4 shadow-sm ${z.bg} ${z.border}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${z.dot}`} />
              <p className={`text-xs font-medium uppercase tracking-wider ${z.text}`}>{z.label}</p>
            </div>
            <p className={`text-2xl font-bold ${z.text}`}>{summary[z.key]}</p>
          </div>
        ))}

        {/* Con plan de tratamiento */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-1">Con plan</p>
          <p className="text-2xl font-bold text-indigo-700">{planPct}%</p>
          <p className="text-[11px] text-indigo-400 mt-1">{summary.withPlan}/{summary.total}</p>
        </div>
      </div>
    </section>
  );
}
