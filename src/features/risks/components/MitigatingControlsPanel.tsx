'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Shield, Plus, X, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import {
  linkControlToRisk,
  unlinkControlFromRisk,
} from '@/features/compliance/actions/mappingActions';

export interface MitigatingControlItem {
  mapping_id: string;
  control_id: string;
  code: string;
  name: string;
  status: string;
  effectiveness: number;
  notes: string | null;
}

export interface AvailableControl {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface Props {
  riskId: string;
  mitigatingControls: MitigatingControlItem[];
  availableControls: AvailableControl[];
}

export function MitigatingControlsPanel({
  riskId,
  mitigatingControls,
  availableControls,
}: Props) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState('');
  const [effectiveness, setEffectiveness] = useState(70);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resetForm = () => {
    setSelectedControl('');
    setEffectiveness(70);
    setNotes('');
    setError(null);
  };

  const handleAdd = () => {
    if (!selectedControl) {
      setError('Selecciona un control');
      return;
    }
    startTransition(async () => {
      const res = await linkControlToRisk({
        controlId: selectedControl,
        riskId,
        effectiveness,
        notes,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setModalOpen(false);
      resetForm();
    });
  };

  const handleRemove = (mappingId: string) => {
    if (!confirm('¿Quitar este control mitigante del riesgo?')) return;
    startTransition(async () => {
      await unlinkControlFromRisk(mappingId);
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Controles Mitigantes
          </h3>
          <span className="text-xs text-slate-400 ml-1">
            ({mitigatingControls.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          disabled={availableControls.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          title={availableControls.length === 0 ? 'No hay más controles disponibles' : 'Agregar control mitigante'}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar control
        </button>
      </div>

      {mitigatingControls.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">
            Este riesgo aún no tiene controles mitigantes asignados.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Haz clic en &ldquo;Agregar control&rdquo; para vincular uno.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="px-6 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Control</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Efectividad</th>
                <th className="px-6 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mitigatingControls.map((c) => (
                <tr key={c.mapping_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link
                      href={`/controls/${c.control_id}`}
                      className="font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline"
                    >
                      {c.code}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700">
                    {c.name}
                    {c.notes && <p className="text-xs text-slate-400 mt-0.5">{c.notes}</p>}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            c.effectiveness >= 80 ? 'bg-emerald-500' :
                            c.effectiveness >= 50 ? 'bg-amber-500' : 'bg-rose-400'
                          }`}
                          style={{ width: `${c.effectiveness}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-600 w-10 text-right">
                        {c.effectiveness}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(c.mapping_id)}
                      disabled={pending}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                      title="Quitar control mitigante"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar control mitigante"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Control
            </label>
            <select
              value={selectedControl}
              onChange={(e) => setSelectedControl(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Selecciona un control...</option>
              {availableControls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Efectividad (%)
              <span className="ml-2 font-mono text-sky-600">{effectiveness}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={effectiveness}
              onChange={(e) => setEffectiveness(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Detalles sobre cómo el control mitiga este riesgo..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={pending}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending || !selectedControl}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Vincular
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
