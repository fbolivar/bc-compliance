import Link from 'next/link';
import { WIZARD_PHASES } from '../lib/wizard-config';
import type { WizardPhaseRow } from '../services/wizardService';
import {
  Building2, Users, ShieldAlert, BookOpen, Shield,
  ClipboardCheck, TrendingUp, ChevronRight, CheckCircle2,
  Clock, Circle,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Users, ShieldAlert, BookOpen, Shield, ClipboardCheck, TrendingUp,
};

const COLOR_MAP: Record<string, { bg: string; border: string; badge: string; bar: string; num: string }> = {
  sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     badge: 'bg-sky-100 text-sky-700',       bar: 'bg-sky-500',     num: 'text-sky-600' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700',  bar: 'bg-violet-500',  num: 'text-violet-600' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',    bar: 'bg-amber-500',   num: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', num: 'text-emerald-600' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700',      bar: 'bg-rose-500',    num: 'text-rose-600' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  badge: 'bg-indigo-100 text-indigo-700',  bar: 'bg-indigo-500',  num: 'text-indigo-600' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    badge: 'bg-teal-100 text-teal-700',      bar: 'bg-teal-500',    num: 'text-teal-600' },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'in_progress') return <Clock className="w-4 h-4 text-amber-500" />;
  return <Circle className="w-4 h-4 text-slate-300" />;
}

interface Props {
  summary: {
    totalTasks: number;
    completedTasks: number;
    overallPct: number;
    phaseSummary: WizardPhaseRow[];
  };
}

export function WizardOverview({ summary }: Props) {
  const phaseMap = new Map(summary.phaseSummary.map((p) => [p.phase_number, p]));

  return (
    <div className="space-y-6">
      {/* Global progress banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-slate-500">Progreso global de implementacion</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{summary.overallPct}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">{summary.completedTasks} de {summary.totalTasks} tareas completadas</p>
            <p className="text-xs text-slate-400 mt-0.5">ISO 27001:2022 — 7 Fases</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${summary.overallPct}%` }}
          />
        </div>
      </div>

      {/* Phase cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {WIZARD_PHASES.map((phaseDef) => {
          const phaseRow = phaseMap.get(phaseDef.number);
          const pct = phaseRow?.completion_pct ?? 0;
          const status = phaseRow?.status ?? 'pending';
          const colors = COLOR_MAP[phaseDef.color];
          const Icon = ICON_MAP[phaseDef.icon] ?? Building2;

          return (
            <Link
              key={phaseDef.number}
              href={`/iso-wizard/${phaseDef.number}`}
              className={`group block rounded-xl border ${colors.border} ${colors.bg} p-5 hover:shadow-md transition-all duration-150`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.badge}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${colors.num}`}>
                      Fase {phaseDef.number} &middot; {phaseDef.isoClause}
                    </p>
                    <h3 className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">{phaseDef.title}</h3>
                  </div>
                </div>
                <StatusIcon status={status} />
              </div>

              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{phaseDef.subtitle}</p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{phaseDef.tasks.length} tareas</span>
                  <span className={`font-semibold ${colors.num}`}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
                  <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end">
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
