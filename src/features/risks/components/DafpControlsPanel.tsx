import { Shield, CheckCircle2, XCircle, FileText, Eye } from 'lucide-react';
import type { MitigatingControl } from '../services/riskService';

interface Props {
  controls: MitigatingControl[];
}

const CONTROL_TYPE_LABEL: Record<string, string> = {
  preventive: 'Preventivo',
  detective: 'Detectivo',
  corrective: 'Correctivo',
  deterrent: 'Disuasivo',
  compensating: 'Compensatorio',
  recovery: 'Recuperación',
};

const AUTOMATION_LABEL: Record<string, string> = {
  manual: 'Manual',
  semi_automated: 'Semi-automatizado',
  fully_automated: 'Automatizado',
};

const TYPE_BADGE: Record<string, string> = {
  preventive: 'bg-sky-50 text-sky-700 border-sky-200',
  detective: 'bg-amber-50 text-amber-700 border-amber-200',
  corrective: 'bg-rose-50 text-rose-700 border-rose-200',
  deterrent: 'bg-slate-50 text-slate-700 border-slate-200',
  compensating: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  recovery: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const AFFECTS_BADGE: Record<string, string> = {
  Probabilidad: 'bg-violet-50 text-violet-700 border-violet-200',
  Impacto: 'bg-orange-50 text-orange-700 border-orange-200',
};

function BoolIcon({ value }: { value: boolean | null }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (value === false) return <XCircle className="w-4 h-4 text-rose-500" />;
  return <span className="text-slate-300 text-xs">—</span>;
}

export function DafpControlsPanel({ controls }: Props) {
  if (controls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">Sin controles asociados</p>
        <p className="text-xs text-slate-500 mt-1">
          Vincula controles existentes o crea nuevos desde el panel inferior.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/60 flex items-center gap-3">
        <Shield className="w-5 h-5 text-sky-600" />
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Controles DAFP asociados</h3>
          <p className="text-xs text-slate-500">
            {controls.length} control{controls.length !== 1 ? 'es' : ''} con los 6 atributos DAFP 2020
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {controls.map((c) => {
          const typeLabel = c.control_type ? CONTROL_TYPE_LABEL[c.control_type] ?? c.control_type : null;
          const autoLabel = c.automation_level ? AUTOMATION_LABEL[c.automation_level] ?? c.automation_level : null;
          return (
            <div key={c.mapping_id} className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="font-mono text-xs text-slate-400 mt-0.5 flex-shrink-0">{c.code}</span>
                <p className="text-sm font-medium text-slate-800 flex-1">{c.name}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <p className="text-slate-500 mb-1">Afectación</p>
                  {c.affects_probability_or_impact ? (
                    <span className={`inline-block px-2 py-0.5 rounded border font-medium ${AFFECTS_BADGE[c.affects_probability_or_impact] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                      {c.affects_probability_or_impact}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Tipo</p>
                  {typeLabel && c.control_type ? (
                    <span className={`inline-block px-2 py-0.5 rounded border font-medium ${TYPE_BADGE[c.control_type] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                      {typeLabel}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Implementación</p>
                  <span className="font-medium text-slate-700">{autoLabel ?? '—'}</span>
                </div>
                <div>
                  <p className="text-slate-500 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Documentado
                  </p>
                  <BoolIcon value={c.is_documented} />
                </div>
                <div>
                  <p className="text-slate-500 mb-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Con registro
                  </p>
                  <BoolIcon value={c.has_evidence} />
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Frecuencia</p>
                  <span className="font-medium text-slate-700">
                    {c.control_frequency_dafp || '—'}
                  </span>
                </div>
              </div>

              {c.notes && (
                <p className="mt-3 text-xs text-slate-500 italic border-l-2 border-slate-200 pl-3">
                  {c.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
