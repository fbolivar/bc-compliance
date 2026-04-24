'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, Trash2, Loader2 } from 'lucide-react';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { createProcedure, deleteProcedure } from '../actions/procedureActions';

interface BcpProcedure {
  id: string;
  bcp_plan_id: string;
  phase: string;
  step_number: number;
  title: string;
  description: string | null;
  responsible: string | null;
  estimated_hours: number | null;
}

interface Props {
  planId: string;
  procedures: BcpProcedure[];
}

const PHASES: { key: string; label: string; classes: string }[] = [
  { key: 'prevention', label: 'Prevencion', classes: 'bg-slate-50 text-slate-700 border-slate-200' },
  { key: 'activation', label: 'Activacion', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'response', label: 'Respuesta', classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  { key: 'recovery', label: 'Recuperacion', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'restoration', label: 'Restauracion', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export function ProceduresPanel({ planId, procedures }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createProcedure(planId, formData);
      if (result.error) { setError(result.error); return; }
      setShowModal(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este procedimiento?')) return;
    startTransition(async () => {
      await deleteProcedure(id, planId);
      router.refresh();
    });
  }

  // Group procedures by phase
  const grouped = PHASES.map((phase) => ({
    ...phase,
    items: procedures
      .filter((p) => p.phase === phase.key)
      .sort((a, b) => a.step_number - b.step_number),
  }));

  const hasAny = procedures.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700">Procedimientos por Fase</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar Procedimiento
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
            {error}
          </div>
        )}

        {!hasAny ? (
          <div className="text-center py-10">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No hay procedimientos definidos</p>
            <p className="text-xs text-slate-400 mt-1">Agrega los pasos de cada fase del plan</p>
          </div>
        ) : (
          grouped.map((phase) => {
            if (phase.items.length === 0) return null;
            return (
              <div key={phase.key}>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${phase.classes}`}>
                  {phase.label}
                </div>
                <div className="space-y-2">
                  {phase.items.map((proc) => (
                    <div
                      key={proc.id}
                      className="flex items-start gap-3 p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500 shadow-sm">
                        {proc.step_number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{proc.title}</p>
                        {proc.description && (
                          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{proc.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {proc.responsible && (
                            <span className="text-xs text-slate-500">
                              Responsable: <span className="font-medium text-slate-600">{proc.responsible}</span>
                            </span>
                          )}
                          {proc.estimated_hours !== null && (
                            <span className="text-xs text-slate-500">
                              Tiempo est.: <span className="font-mono font-medium text-slate-600">{proc.estimated_hours}h</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(proc.id)}
                        disabled={isPending}
                        className="flex-shrink-0 p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-40"
                        title="Eliminar procedimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Procedure Modal */}
      <FormModal isOpen={showModal} onClose={() => setShowModal(false)} title="Agregar Procedimiento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Fase"
              name="phase"
              type="select"
              options={PHASES.map((p) => ({ value: p.key, label: p.label }))}
            />
            <FormField
              label="Numero de paso"
              name="step_number"
              type="number"
              defaultValue={1}
              min={1}
            />
          </div>
          <FormField label="Titulo" name="title" required />
          <FormField label="Descripcion" name="description" type="textarea" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Responsable" name="responsible" />
            <FormField label="Horas estimadas" name="estimated_hours" type="number" min={0} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
