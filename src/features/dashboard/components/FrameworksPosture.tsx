import Link from 'next/link';
import { Layers, ArrowRight } from 'lucide-react';
import type { FrameworkRow } from '@/features/compliance/services/complianceService';

interface Props {
  frameworks: FrameworkRow[];
}

function statusFromPct(pct: number): { label: string; color: string; bgBar: string } {
  if (pct >= 80) return { label: 'Conforme', color: 'text-emerald-700', bgBar: 'bg-emerald-500' };
  if (pct >= 60) return { label: 'En consolidación', color: 'text-sky-700', bgBar: 'bg-sky-500' };
  if (pct >= 40) return { label: 'En desarrollo', color: 'text-amber-700', bgBar: 'bg-amber-500' };
  if (pct >= 20) return { label: 'Inicial', color: 'text-orange-700', bgBar: 'bg-orange-500' };
  return { label: 'No conforme', color: 'text-rose-700', bgBar: 'bg-rose-500' };
}

export function FrameworksPosture({ frameworks }: Props) {
  if (frameworks.length === 0) return null;

  // Sort: lowest compliance first (most attention needed)
  const sorted = [...frameworks].sort((a, b) => a.compliance_percentage - b.compliance_percentage);

  return (
    <section
      aria-label="Cumplimiento por marco normativo"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            Postura por Marco Normativo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {frameworks.length} frameworks evaluados · ordenados por nivel de atención requerido
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map((fw) => {
          const status = statusFromPct(fw.compliance_percentage);
          return (
            <Link
              key={fw.id}
              href={`/compliance/${fw.id}`}
              className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all p-4 flex items-center gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{fw.name}</p>
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  {fw.compliant_count} / {fw.total_requirements} requisitos cumplen
                </p>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(fw.compliant_count / Math.max(1, fw.total_requirements)) * 100}%` }} />
                  <div className="h-full bg-amber-400 transition-all"
                    style={{ width: `${(fw.partial_count / Math.max(1, fw.total_requirements)) * 100}%` }} />
                  <div className="h-full bg-rose-400 transition-all"
                    style={{ width: `${(fw.non_compliant_count / Math.max(1, fw.total_requirements)) * 100}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-2xl font-bold tabular-nums ${status.color}`}>
                  {fw.compliance_percentage}%
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
