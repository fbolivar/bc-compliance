import Link from 'next/link';
import { AlertCircle, Bug, FileWarning, Calendar, Clock, ArrowRight, ShieldAlert, ClipboardCheck, FileText, Wrench } from 'lucide-react';
import type { CriticalGap, UpcomingAction } from '@/features/dashboard/services/executiveDashboardService';

interface Props {
  gaps: CriticalGap[];
  actions: UpcomingAction[];
}

const GAP_ICON: Record<CriticalGap['type'], React.ComponentType<{ className?: string }>> = {
  risk: ShieldAlert,
  vulnerability: Bug,
  nc: FileWarning,
  control: AlertCircle,
  requirement: AlertCircle,
};

const ACTION_ICON: Record<UpcomingAction['type'], React.ComponentType<{ className?: string }>> = {
  audit: ClipboardCheck,
  nc: FileWarning,
  capa: Wrench,
  document: FileText,
  control: AlertCircle,
};

const LEVEL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

function relativeDate(daysUntil: number): string {
  if (daysUntil < 0) return `Vencida hace ${Math.abs(daysUntil)} día${Math.abs(daysUntil) !== 1 ? 's' : ''}`;
  if (daysUntil === 0) return 'Hoy';
  if (daysUntil === 1) return 'Mañana';
  if (daysUntil < 7) return `En ${daysUntil} días`;
  if (daysUntil < 30) return `En ${Math.ceil(daysUntil / 7)} semanas`;
  return `En ${Math.ceil(daysUntil / 30)} meses`;
}

export function TopGapsAndActions({ gaps, actions }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top critical gaps */}
      <section
        aria-label="Brechas críticas que requieren atención"
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Brechas Críticas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Hallazgos que requieren atención inmediata de la dirección</p>
        </div>
        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {gaps.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-emerald-600">
              ✓ Sin brechas críticas detectadas en este momento.
            </p>
          ) : (
            gaps.map((g) => {
              const Icon = GAP_ICON[g.type];
              const c = LEVEL_COLORS[g.level] ?? LEVEL_COLORS.medium;
              return (
                <Link
                  key={`${g.type}-${g.id}`}
                  href={g.href}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">{g.code}</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${c.bg} ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {g.hint}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 truncate group-hover:text-sky-600 transition-colors">
                      {g.title}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Upcoming actions timeline */}
      <section
        aria-label="Próximas acciones en agenda"
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-500" />
            Agenda Próxima
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Auditorías, NCs, CAPA y revisiones documentales próximas o vencidas</p>
        </div>
        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {actions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              No hay acciones pendientes en los próximos 90 días.
            </p>
          ) : (
            actions.map((a) => {
              const Icon = ACTION_ICON[a.type];
              const c = LEVEL_COLORS[a.level] ?? LEVEL_COLORS.medium;
              const isOverdue = a.daysUntil < 0;
              return (
                <Link
                  key={`${a.type}-${a.id}`}
                  href={a.href}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate group-hover:text-sky-600 transition-colors">
                      {a.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className={`w-3 h-3 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                      <span className={`text-[11px] ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                        {relativeDate(a.daysUntil)}
                      </span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] text-slate-400 capitalize">{a.type}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
