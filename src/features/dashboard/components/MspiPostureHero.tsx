import { Shield } from 'lucide-react';
import type { MspiPosture, MaturityLevel } from '@/features/dashboard/services/executiveDashboardService';

const LEVEL_COLOR: Record<MaturityLevel, { bg: string; text: string; ring: string; bar: string }> = {
  inexistente: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-300', bar: 'bg-rose-500' },
  inicial: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-300', bar: 'bg-rose-500' },
  repetible: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-300', bar: 'bg-orange-500' },
  definido: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-300', bar: 'bg-amber-500' },
  gestionado: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-300', bar: 'bg-sky-500' },
  optimizado: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-300', bar: 'bg-emerald-500' },
};

const LEVEL_DESCRIPTION: Record<MaturityLevel, string> = {
  inexistente: 'Sin procesos formales de seguridad establecidos.',
  inicial: 'Procesos ad-hoc, dependientes de individuos.',
  repetible: 'Procesos básicos repetibles pero no documentados consistentemente.',
  definido: 'Procesos documentados y estandarizados, en ejecución.',
  gestionado: 'Procesos medidos y controlados con métricas cuantitativas.',
  optimizado: 'Mejora continua basada en datos y feedback del proceso.',
};

interface Props {
  posture: MspiPosture;
}

export function MspiPostureHero({ posture }: Props) {
  const colors = LEVEL_COLOR[posture.level];
  const description = LEVEL_DESCRIPTION[posture.level];

  // SVG arc gauge (180°)
  const radius = 90;
  const circumference = Math.PI * radius;
  const fillLength = (posture.score / 100) * circumference;

  // 6 maturity levels marks
  const marks = [
    { score: 0, label: '0' },
    { score: 20, label: 'Inicial' },
    { score: 40, label: 'Repetible' },
    { score: 60, label: 'Definido' },
    { score: 80, label: 'Gestionado' },
    { score: 100, label: 'Optimizado' },
  ];

  return (
    <section
      aria-label="Postura de Seguridad MSPI"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 p-6">
        {/* Gauge */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-[260px] h-[150px]">
            <svg viewBox="0 0 220 130" className="w-full h-full">
              {/* Background arc */}
              <path
                d={`M 20 110 A ${radius} ${radius} 0 0 1 200 110`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Filled arc */}
              <path
                d={`M 20 110 A ${radius} ${radius} 0 0 1 200 110`}
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${fillLength} ${circumference}`}
                className={posture.score >= 80 ? 'text-emerald-500' :
                  posture.score >= 60 ? 'text-sky-500' :
                  posture.score >= 40 ? 'text-amber-500' :
                  posture.score >= 20 ? 'text-orange-500' : 'text-rose-500'}
              />
              {/* Center value */}
              <text x="110" y="95" textAnchor="middle" className="fill-slate-800 font-bold text-4xl">
                {posture.score}
              </text>
              <text x="110" y="115" textAnchor="middle" className="fill-slate-400 text-xs">
                de 100
              </text>
            </svg>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
            <Shield className="w-4 h-4" />
            <span className="font-semibold text-sm">Nivel {posture.levelLabel}</span>
          </div>
        </div>

        {/* Description + maturity scale */}
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-800">Postura de Seguridad MSPI</h2>
              <span className="text-xs text-slate-400 uppercase tracking-wider">PHVA · MinTIC</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
            <p className="text-xs text-slate-500 mt-2">
              Score calculado ponderando ciclo PHVA: <span className="font-medium">Planear 20% · Hacer 40% · Verificar 20% · Actuar 20%</span>.
            </p>
          </div>

          {/* Maturity scale visualization */}
          <div className="space-y-2">
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-rose-300" style={{ width: '20%' }} />
              <div className="absolute inset-y-0 left-[20%] bg-orange-300" style={{ width: '20%' }} />
              <div className="absolute inset-y-0 left-[40%] bg-amber-300" style={{ width: '20%' }} />
              <div className="absolute inset-y-0 left-[60%] bg-sky-300" style={{ width: '20%' }} />
              <div className="absolute inset-y-0 left-[80%] bg-emerald-300" style={{ width: '20%' }} />
              {/* Pointer */}
              <div
                className="absolute -top-1 -translate-x-1/2 w-1 h-4 bg-slate-800 rounded-full shadow-md"
                style={{ left: `${posture.score}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              {marks.slice(1).map((m) => (
                <span key={m.label}>{m.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
