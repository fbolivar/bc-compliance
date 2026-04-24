'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { updateBcpPlan } from '../actions/bcpActions';
import type { BcpPlan } from '../services/bcpService';

interface Props {
  plan: BcpPlan;
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-700 bg-white';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
const sectionHeaderClass = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';
const cardClass = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';

function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function BcpEditForm({ plan }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateBcpPlan(plan.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/business-continuity/${plan.id}`);
          router.refresh();
        }, 1000);
      }
    });
  }

  if (success) {
    return (
      <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center">
        Cambios guardados correctamente
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
          {error}
        </div>
      )}

      {/* Identificacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Identificacion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="code" className={labelClass}>Codigo *</label>
            <input
              id="code"
              name="code"
              type="text"
              required
              defaultValue={plan.code}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="version" className={labelClass}>Version</label>
            <input
              id="version"
              name="version"
              type="text"
              defaultValue={plan.version ?? ''}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="title" className={labelClass}>Titulo *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={plan.title}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>Estado</label>
            <select id="status" name="status" defaultValue={plan.status} className={inputClass}>
              <option value="draft">Borrador</option>
              <option value="approved">Aprobado</option>
              <option value="active">Activo</option>
              <option value="obsolete">Obsoleto</option>
            </select>
          </div>
          <div>
            <label htmlFor="owner" className={labelClass}>Responsable</label>
            <input
              id="owner"
              name="owner"
              type="text"
              defaultValue={plan.owner ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Objetivos de recuperacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Objetivos de Recuperacion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rto_target_hours" className={labelClass}>RTO objetivo (horas)</label>
            <input
              id="rto_target_hours"
              name="rto_target_hours"
              type="number"
              min={0}
              defaultValue={plan.rto_target_hours ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rpo_target_hours" className={labelClass}>RPO objetivo (horas)</label>
            <input
              id="rpo_target_hours"
              name="rpo_target_hours"
              type="number"
              min={0}
              defaultValue={plan.rpo_target_hours ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="last_test_date" className={labelClass}>Ultima prueba</label>
            <input
              id="last_test_date"
              name="last_test_date"
              type="date"
              defaultValue={toDateInput(plan.last_test_date)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="next_test_date" className={labelClass}>Proxima prueba</label>
            <input
              id="next_test_date"
              name="next_test_date"
              type="date"
              defaultValue={toDateInput(plan.next_test_date)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Aprobacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Aprobacion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="approved_by" className={labelClass}>Aprobado por</label>
            <input
              id="approved_by"
              name="approved_by"
              type="text"
              defaultValue={plan.approved_by ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="approved_at" className={labelClass}>Fecha de aprobacion</label>
            <input
              id="approved_at"
              name="approved_at"
              type="date"
              defaultValue={toDateInput(plan.approved_at)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Contenido del Plan</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="scope" className={labelClass}>Alcance</label>
            <textarea
              id="scope"
              name="scope"
              rows={3}
              defaultValue={plan.scope ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="activation_criteria" className={labelClass}>Criterios de activacion</label>
            <textarea
              id="activation_criteria"
              name="activation_criteria"
              rows={3}
              defaultValue={plan.activation_criteria ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="notes" className={labelClass}>Notas</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={plan.notes ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/business-continuity/${plan.id}`)}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
