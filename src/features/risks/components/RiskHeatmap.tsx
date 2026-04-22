'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { ArrowRight, X } from 'lucide-react';

interface Risk {
  id: string;
  code: string;
  name: string;
  frequency: number;
  impact_max: number;
  risk_potential: number;
  risk_residual: number;
  risk_level_inherent: string;
  risk_level_residual: string;
  treatment: string;
}

interface Props {
  risks: Risk[];
}

// 5 impact buckets (Y axis, top=5)
const IMPACT_LEVELS = [
  { value: 5, label: 'Crítico', min: 8.0 },
  { value: 4, label: 'Alto', min: 6.0 },
  { value: 3, label: 'Medio', min: 4.0 },
  { value: 2, label: 'Bajo', min: 2.0 },
  { value: 1, label: 'Muy bajo', min: 0 },
];

// 5 frequency buckets (X axis)
const FREQ_LEVELS = [
  { value: 1, label: 'Muy baja' },
  { value: 2, label: 'Baja' },
  { value: 3, label: 'Media' },
  { value: 4, label: 'Alta' },
  { value: 5, label: 'Muy alta' },
];

function impactBucket(impactMax: number): number {
  if (impactMax >= 8.0) return 5;
  if (impactMax >= 6.0) return 4;
  if (impactMax >= 4.0) return 3;
  if (impactMax >= 2.0) return 2;
  return 1;
}

// cell score = freq * impact (1..25)
function cellColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 20) return { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' };
  if (score >= 15) return { bg: 'bg-rose-400', text: 'text-white', border: 'border-rose-500' };
  if (score >= 12) return { bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-500' };
  if (score >= 9) return { bg: 'bg-amber-400', text: 'text-white', border: 'border-amber-500' };
  if (score >= 6) return { bg: 'bg-yellow-300', text: 'text-slate-800', border: 'border-yellow-400' };
  if (score >= 4) return { bg: 'bg-lime-300', text: 'text-slate-800', border: 'border-lime-400' };
  return { bg: 'bg-emerald-300', text: 'text-slate-800', border: 'border-emerald-400' };
}

export function RiskHeatmap({ risks }: Props) {
  const [view, setView] = useState<'inherent' | 'residual'>('residual');
  const [selectedCell, setSelectedCell] = useState<{ freq: number; impact: number } | null>(null);

  const grid = useMemo(() => {
    const map = new Map<string, Risk[]>();
    for (const r of risks) {
      // For residual view, recompute impact as impact_max * (1 - residual_effectiveness / full)
      // Simpler: use raw impact_max for inherent, and risk_residual / freq for residual
      const impact = view === 'residual' && r.frequency > 0
        ? impactBucket((r.risk_residual ?? 0) / r.frequency)
        : impactBucket(r.impact_max ?? 0);
      const freq = Math.max(1, Math.min(5, r.frequency ?? 1));
      const key = `${freq}:${impact}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [risks, view]);

  const selectedRisks = selectedCell
    ? grid.get(`${selectedCell.freq}:${selectedCell.impact}`) ?? []
    : [];

  const byLevel = useMemo(() => {
    const stats = { critical: 0, high: 0, medium: 0, low: 0, negligible: 0 };
    for (const r of risks) {
      const level = view === 'residual' ? r.risk_level_residual : r.risk_level_inherent;
      if (level in stats) stats[level as keyof typeof stats]++;
    }
    return stats;
  }, [risks, view]);

  return (
    <div className="space-y-6">
      {/* Toggle inherent/residual */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setView('inherent')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'inherent' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Riesgo inherente
          </button>
          <button
            type="button"
            onClick={() => setView('residual')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'residual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Riesgo residual
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Crítico: {byLevel.critical}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400" /> Alto: {byLevel.high}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Medio: {byLevel.medium}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-300" /> Bajo: {byLevel.low}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> Desp.: {byLevel.negligible}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
        {/* Matrix */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Y-axis label */}
            <div className="flex flex-col items-center justify-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Impacto</span>
            </div>

            <div className="flex-1">
              <table className="w-full border-separate border-spacing-1">
                <tbody>
                  {IMPACT_LEVELS.map((imp) => (
                    <tr key={imp.value}>
                      <td className="w-24 text-right pr-2 align-middle">
                        <div className="text-xs font-medium text-slate-600">{imp.label}</div>
                        <div className="text-[10px] text-slate-400">≥ {imp.min.toFixed(1)}</div>
                      </td>
                      {FREQ_LEVELS.map((f) => {
                        const key = `${f.value}:${imp.value}`;
                        const cellRisks = grid.get(key) ?? [];
                        const count = cellRisks.length;
                        const score = f.value * imp.value;
                        const color = cellColor(score);
                        const active = selectedCell?.freq === f.value && selectedCell?.impact === imp.value;
                        return (
                          <td key={key} className="w-[18%]">
                            <button
                              type="button"
                              onClick={() => setSelectedCell(active ? null : { freq: f.value, impact: imp.value })}
                              disabled={count === 0}
                              title={`${f.label} × ${imp.label} · ${count} riesgo${count !== 1 ? 's' : ''}`}
                              className={`w-full aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                                count > 0 ? `${color.bg} ${color.border} hover:scale-105 cursor-pointer` : 'bg-slate-50 border-slate-200'
                              } ${active ? 'ring-2 ring-sky-500 ring-offset-2' : ''}`}
                            >
                              <span className={`text-2xl font-bold font-mono ${count > 0 ? color.text : 'text-slate-300'}`}>
                                {count}
                              </span>
                              <span className={`text-[10px] font-medium ${count > 0 ? color.text : 'text-slate-300'}`}>
                                {score}
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* X-axis row */}
                  <tr>
                    <td />
                    {FREQ_LEVELS.map((f) => (
                      <td key={`x-${f.value}`} className="text-center pt-2">
                        <div className="text-xs font-medium text-slate-600">{f.label}</div>
                        <div className="text-[10px] text-slate-400">f={f.value}</div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Frecuencia
              </div>
            </div>
          </div>
        </div>

        {/* Side panel: cell drill-down */}
        <aside className="rounded-xl border border-slate-200 bg-white shadow-sm min-h-[300px]">
          {selectedCell ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider">Celda seleccionada</p>
                  <p className="text-sm font-semibold text-slate-700">
                    F{selectedCell.freq} × I{selectedCell.impact}
                    <span className="ml-2 text-slate-400 font-normal">
                      ({FREQ_LEVELS[selectedCell.freq - 1]?.label} × {IMPACT_LEVELS.find((i) => i.value === selectedCell.impact)?.label})
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[440px]">
                {selectedRisks.length === 0 ? (
                  <p className="p-4 text-sm text-slate-400">Sin riesgos en esta celda.</p>
                ) : (
                  selectedRisks.map((r) => (
                    <Link
                      key={r.id}
                      href={`/risks/${r.id}`}
                      className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-sky-600">{r.code}</span>
                        <StatusBadge status={view === 'residual' ? r.risk_level_residual : r.risk_level_inherent} />
                      </div>
                      <p className="text-sm text-slate-700 leading-snug">{r.name}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                        <span>Valor: <span className="font-mono text-slate-700">{Number(view === 'residual' ? r.risk_residual : r.risk_potential).toFixed(1)}</span></span>
                        <span className="capitalize">{r.treatment}</span>
                        <ArrowRight className="w-3 h-3 ml-auto text-slate-300" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Haz clic en una celda</p>
              <p className="text-xs text-slate-400 mt-1">
                Selecciona una combinación frecuencia × impacto para ver los escenarios específicos.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
