import { Compass, Wrench, ClipboardCheck, Repeat } from 'lucide-react';

interface Props {
  phva: { planear: number; hacer: number; verificar: number; actuar: number };
}

const PHASES = [
  {
    key: 'planear' as const, label: 'Planear (P)', icon: Compass,
    color: 'sky',
    description: 'Políticas, alcance, gestión de riesgos y planificación del SGSI',
  },
  {
    key: 'hacer' as const, label: 'Hacer (H)', icon: Wrench,
    color: 'emerald',
    description: 'Implementación de controles y operación del SGSI',
  },
  {
    key: 'verificar' as const, label: 'Verificar (V)', icon: ClipboardCheck,
    color: 'amber',
    description: 'Auditorías, monitoreo y evaluación de la conformidad',
  },
  {
    key: 'actuar' as const, label: 'Actuar (A)', icon: Repeat,
    color: 'indigo',
    description: 'Acciones correctivas, preventivas y mejora continua',
  },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; bar: string; iconBg: string }> = {
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', bar: 'bg-sky-500', iconBg: 'bg-sky-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500', iconBg: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500', iconBg: 'bg-amber-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: 'bg-indigo-500', iconBg: 'bg-indigo-100' },
};

function pctLabel(v: number): string {
  if (v >= 80) return 'Maduro';
  if (v >= 60) return 'En consolidación';
  if (v >= 40) return 'En desarrollo';
  if (v >= 20) return 'Inicial';
  return 'Crítico';
}

export function PhvaCycle({ phva }: Props) {
  return (
    <section
      aria-label="Ciclo PHVA del SGSI"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Ciclo PHVA del SGSI</h2>
          <p className="text-xs text-slate-500 mt-0.5">Madurez de cada fase del modelo de seguridad y privacidad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          const value = phva[phase.key];
          const colors = COLOR_CLASSES[phase.color];
          return (
            <div
              key={phase.key}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <span className={`text-xs font-semibold ${colors.text} uppercase tracking-wider`}>
                  {pctLabel(value)}
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">{phase.label}</p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{phase.description}</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>{value}</span>
                  <span className="text-sm text-slate-400">%</span>
                </div>
                <div className="h-1.5 mt-2 rounded-full bg-white/60 overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} transition-all duration-700`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
