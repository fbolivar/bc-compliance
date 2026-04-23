import { Fragment } from 'react';

interface Props {
  probabilityValue: number | null;
  impactValue: number | null;
  zone: string | null;
}

const PROB_LABELS = ['Muy Baja', 'Baja', 'Media', 'Alta', 'Muy Alta'];
const PROB_VALUES = [0.2, 0.4, 0.6, 0.8, 1.0];
const IMP_LABELS = ['Leve', 'Menor', 'Moderado', 'Mayor', 'Catastrófico'];
const IMP_VALUES = [0.2, 0.4, 0.6, 0.8, 1.0];

const ZONE_COLOR: Record<string, string> = {
  Bajo: 'bg-emerald-100 border-emerald-200',
  Moderado: 'bg-amber-100 border-amber-200',
  Alto: 'bg-orange-100 border-orange-200',
  Extremo: 'bg-rose-100 border-rose-200',
};

const ZONE_TEXT: Record<string, string> = {
  Bajo: 'text-emerald-800',
  Moderado: 'text-amber-800',
  Alto: 'text-orange-800',
  Extremo: 'text-rose-800',
};

function cellZone(probValue: number, impValue: number): string {
  const score = probValue * impValue;
  if (score >= 0.6) return 'Extremo';
  if (score >= 0.3) return 'Alto';
  if (score >= 0.12) return 'Moderado';
  return 'Bajo';
}

export function DafpRiskMatrix({ probabilityValue, impactValue, zone }: Props) {
  // Prob axis goes top→bottom (Muy Alta first, Muy Baja last) per DAFP convention
  const probReversed = [...PROB_VALUES].reverse();
  const probLabelsReversed = [...PROB_LABELS].reverse();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Matriz DAFP 5×5</h3>
          <p className="text-xs text-slate-500">Zona del riesgo inherente</p>
        </div>
        {zone && (
          <span
            className={`px-4 py-1.5 rounded-lg font-bold text-sm border ${ZONE_COLOR[zone] ?? ''} ${ZONE_TEXT[zone] ?? 'text-slate-700'}`}
          >
            {zone}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {/* Y-axis label */}
        <div className="flex items-center justify-center" style={{ width: 24 }}>
          <p className="text-[11px] font-medium text-slate-500 -rotate-90 whitespace-nowrap">
            Probabilidad
          </p>
        </div>

        {/* Prob labels + grid */}
        <div className="flex-1">
          <div className="grid" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
            {/* Header row (impact labels) */}
            <div />
            {IMP_LABELS.map((label) => (
              <div key={label} className="text-center text-[10px] text-slate-500 font-medium pb-1">
                {label}
              </div>
            ))}

            {/* 5 rows, top to bottom: Muy Alta → Muy Baja */}
            {probReversed.map((pVal, rowIdx) => (
              <Fragment key={`row-${rowIdx}`}>
                <div className="text-right text-[11px] text-slate-600 font-medium pr-2 py-2">
                  {probLabelsReversed[rowIdx]}
                </div>
                {IMP_VALUES.map((iVal) => {
                  const cZone = cellZone(pVal, iVal);
                  const isActive =
                    probabilityValue !== null &&
                    impactValue !== null &&
                    Math.abs(pVal - probabilityValue) < 0.01 &&
                    Math.abs(iVal - impactValue) < 0.01;
                  return (
                    <div
                      key={`${pVal}-${iVal}`}
                      className={`aspect-square border flex items-center justify-center text-[10px] font-medium transition-all ${
                        ZONE_COLOR[cZone]
                      } ${ZONE_TEXT[cZone]} ${
                        isActive ? 'ring-2 ring-sky-500 ring-offset-1 scale-105 shadow-md' : 'opacity-60'
                      }`}
                    >
                      {isActive ? '●' : cZone.charAt(0)}
                    </div>
                  );
                })}
              </Fragment>
            ))}

            {/* Bottom X-axis title */}
            <div />
            <div className="col-span-5 text-center text-[11px] font-medium text-slate-500 pt-2">
              Impacto →
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]">
        {(['Bajo', 'Moderado', 'Alto', 'Extremo'] as const).map((z) => (
          <div key={z} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${ZONE_COLOR[z]}`} />
            <span className="text-slate-600">{z}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
