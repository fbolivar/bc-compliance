import Link from 'next/link';
import { AlertTriangle, Bug, FileWarning, Wrench, ArrowRight } from 'lucide-react';
import type { OperationalMetrics } from '@/features/dashboard/services/executiveDashboardService';

interface Props {
  metrics: OperationalMetrics;
}

const INC_STATUS_LABELS: Record<string, string> = {
  detected: 'Detectado',
  triaged: 'Triaje',
  investigating: 'Investigando',
  containing: 'Conteniendo',
  eradicating: 'Erradicando',
  recovering: 'Recuperando',
  post_incident: 'Post-incidente',
  closed: 'Cerrado',
};

const NC_STATUS_LABELS: Record<string, string> = {
  open: 'Abierta',
  root_cause_analysis: 'Análisis causa',
  action_planned: 'Acción planificada',
  action_in_progress: 'Acción en curso',
  verification: 'Verificación',
  closed: 'Cerrada',
  reopened: 'Reabierta',
};

const SEV_COLORS: Record<string, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
  informational: 'bg-slate-400',
};

export function OperationalMetricsRow({ metrics }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Incidentes */}
      <Link
        href="/incidents"
        aria-label="Detalle de incidentes activos"
        className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all p-5 group flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              metrics.incidents.totalActive > 0 ? 'bg-orange-50' : 'bg-slate-50'
            }`}>
              <AlertTriangle className={`w-4 h-4 ${
                metrics.incidents.totalActive > 0 ? 'text-orange-600' : 'text-slate-400'
              }`} />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Incidentes activos</h3>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
        </div>

        <div>
          <p className={`text-3xl font-bold tabular-nums ${
            metrics.incidents.totalActive > 0 ? 'text-orange-600' : 'text-slate-400'
          }`}>
            {metrics.incidents.totalActive}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Lifecycle NIST SP 800-61</p>
        </div>

        {metrics.incidents.totalActive > 0 && (
          <div className="space-y-1.5">
            {Object.entries(metrics.incidents.byStatus)
              .filter(([s]) => s !== 'closed')
              .slice(0, 4)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{INC_STATUS_LABELS[status] ?? status}</span>
                  <span className="font-mono font-semibold text-slate-700">{count}</span>
                </div>
              ))}
          </div>
        )}
      </Link>

      {/* Vulnerabilidades */}
      <Link
        href="/vulnerabilities"
        aria-label="Detalle de vulnerabilidades abiertas"
        className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all p-5 group flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              metrics.vulnerabilities.totalOpen > 0 ? 'bg-rose-50' : 'bg-slate-50'
            }`}>
              <Bug className={`w-4 h-4 ${
                metrics.vulnerabilities.totalOpen > 0 ? 'text-rose-600' : 'text-slate-400'
              }`} />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Vulnerabilidades abiertas</h3>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
        </div>

        <div>
          <p className={`text-3xl font-bold tabular-nums ${
            metrics.vulnerabilities.totalOpen > 0 ? 'text-rose-600' : 'text-slate-400'
          }`}>
            {metrics.vulnerabilities.totalOpen}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Por severidad CVSS</p>
        </div>

        {metrics.vulnerabilities.totalOpen > 0 && (
          <div className="space-y-1">
            {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
              const count = metrics.vulnerabilities.bySeverity[sev] ?? 0;
              if (count === 0) return null;
              const total = metrics.vulnerabilities.totalOpen;
              const pct = (count / total) * 100;
              return (
                <div key={sev} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 capitalize">{sev === 'high' ? 'Alta' : sev === 'critical' ? 'Crítica' : sev === 'medium' ? 'Media' : 'Baja'}</span>
                    <span className="font-mono font-semibold text-slate-700">{count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${SEV_COLORS[sev]} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Link>

      {/* No conformidades + CAPA */}
      <Link
        href="/nonconformities"
        aria-label="Detalle de no conformidades y CAPA"
        className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all p-5 group flex flex-col gap-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              metrics.nonconformities.totalOpen > 0 ? 'bg-amber-50' : 'bg-slate-50'
            }`}>
              <FileWarning className={`w-4 h-4 ${
                metrics.nonconformities.totalOpen > 0 ? 'text-amber-600' : 'text-slate-400'
              }`} />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No conformidades</h3>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
        </div>

        <div>
          <p className={`text-3xl font-bold tabular-nums ${
            metrics.nonconformities.totalOpen > 0 ? 'text-amber-600' : 'text-slate-400'
          }`}>
            {metrics.nonconformities.totalOpen}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Abiertas
            {metrics.nonconformities.overdue > 0 && (
              <span className="text-rose-600 font-semibold ml-2">
                · {metrics.nonconformities.overdue} vencidas
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs text-slate-600">CAPA activas</span>
          </div>
          <span className="text-sm font-semibold text-slate-700 tabular-nums">{metrics.capa.totalActive}</span>
        </div>
      </Link>
    </div>
  );
}
