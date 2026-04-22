import Link from 'next/link';
import { Activity, ShieldAlert, Shield, AlertTriangle } from 'lucide-react';
import type { ProcessHealth } from '@/features/dashboard/services/executiveDashboardService';

interface Props {
  processes: ProcessHealth[];
}

function healthColor(score: number): { bg: string; text: string; bar: string } {
  if (score >= 80) return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' };
  if (score >= 60) return { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', bar: 'bg-sky-500' };
  if (score >= 40) return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' };
  return { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', bar: 'bg-rose-500' };
}

function categoryIcon(code: string) {
  const prefix = code.substring(0, 2);
  switch (prefix) {
    case 'PE': return { label: 'E', color: 'bg-blue-500' };
    case 'PM': return { label: 'M', color: 'bg-emerald-500' };
    case 'PA': return { label: 'A', color: 'bg-amber-500' };
    case 'PV': return { label: 'V', color: 'bg-indigo-500' };
    default: return { label: '?', color: 'bg-slate-500' };
  }
}

export function ProcessHealthMatrix({ processes }: Props) {
  if (processes.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">Salud de Procesos</h2>
        <p className="text-sm text-slate-500">No hay procesos institucionales registrados.</p>
      </section>
    );
  }

  // Group by category
  const byCategory = processes.reduce<Record<string, ProcessHealth[]>>((acc, p) => {
    const k = p.category || 'Sin categoría';
    if (!acc[k]) acc[k] = [];
    acc[k].push(p);
    return acc;
  }, {});

  // Stats summary
  const total = processes.length;
  const healthy = processes.filter((p) => p.health >= 80).length;
  const atRisk = processes.filter((p) => p.health < 40).length;
  const avgHealth = Math.round(processes.reduce((s, p) => s + p.health, 0) / total);

  return (
    <section
      aria-label="Salud de Procesos Institucionales"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-500" />
            Salud de Procesos Institucionales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} procesos · Salud promedio <span className="font-semibold text-slate-700">{avgHealth}%</span>
            <span className="ml-3 text-emerald-600">{healthy} saludables</span>
            <span className="ml-3 text-rose-600">{atRisk} en riesgo</span>
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {category}
              <span className="ml-2 text-slate-400 font-normal normal-case">
                ({items.length} {items.length === 1 ? 'proceso' : 'procesos'})
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((p) => {
                const colors = healthColor(p.health);
                const cat = categoryIcon(p.code);
                return (
                  <Link
                    key={p.asset_id}
                    href={`/assets/${p.asset_id}`}
                    className={`rounded-lg border ${colors.bg} p-3 hover:shadow-md transition-all flex flex-col gap-2 group`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className={`flex-shrink-0 w-6 h-6 rounded-md ${cat.color} text-white text-[10px] font-bold flex items-center justify-center`}>
                          {cat.label}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] text-slate-500">{p.code}</p>
                          <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">{p.name}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold tabular-nums ${colors.text}`}>{p.health}</span>
                    </div>

                    <div className="h-1 rounded-full bg-white/70 overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} transition-all`}
                        style={{ width: `${p.health}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-600">
                      {p.criticalRiskCount > 0 && (
                        <span className="flex items-center gap-0.5 text-rose-600">
                          <ShieldAlert className="w-3 h-3" />
                          {p.criticalRiskCount}
                        </span>
                      )}
                      {p.implementedControlCount > 0 && (
                        <span className="flex items-center gap-0.5 text-emerald-600">
                          <Shield className="w-3 h-3" />
                          {p.implementedControlCount}
                        </span>
                      )}
                      {p.incidentCount > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          {p.incidentCount}
                        </span>
                      )}
                      {p.criticalRiskCount === 0 && p.incidentCount === 0 && (
                        <span className="text-slate-400">Sin alertas</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
