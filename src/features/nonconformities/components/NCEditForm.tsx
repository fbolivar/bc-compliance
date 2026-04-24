'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { updateNC } from '../actions/ncActions';
import type { NCRow } from '../services/ncService';

interface Props {
  nc: NCRow;
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 bg-white';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
const sectionHeaderClass = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';
const cardClass = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';

export function NCEditForm({ nc }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateNC(nc.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/nonconformities/${nc.id}`);
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
            <label htmlFor="code" className={labelClass}>Codigo</label>
            <input
              id="code"
              name="code"
              type="text"
              defaultValue={nc.code}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="title" className={labelClass}>Titulo *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={nc.title}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="raised_by" className={labelClass}>Levantado por</label>
            <input
              id="raised_by"
              name="raised_by"
              type="text"
              defaultValue={nc.raised_by ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="assigned_to" className={labelClass}>Asignado a</label>
            <input
              id="assigned_to"
              name="assigned_to"
              type="text"
              defaultValue={nc.assigned_to ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Clasificacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Clasificacion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nc_type" className={labelClass}>Tipo</label>
            <select
              id="nc_type"
              name="nc_type"
              defaultValue={nc.nc_type}
              className={inputClass}
            >
              <option value="major">Mayor</option>
              <option value="minor">Menor</option>
              <option value="observation">Observacion</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>Estado</label>
            <select
              id="status"
              name="status"
              defaultValue={nc.status}
              className={inputClass}
            >
              <option value="open">Abierto</option>
              <option value="in_progress">En progreso</option>
              <option value="closed">Cerrado</option>
              <option value="verified">Verificado</option>
            </select>
          </div>
          <div>
            <label htmlFor="source" className={labelClass}>Fuente</label>
            <select
              id="source"
              name="source"
              defaultValue={nc.source ?? ''}
              className={inputClass}
            >
              <option value="">— Selecciona —</option>
              <option value="internal_audit">Auditoria interna</option>
              <option value="external_audit">Auditoria externa</option>
              <option value="certification_audit">Auditoria de certificacion</option>
              <option value="management_review">Revision por direccion</option>
              <option value="customer_complaint">Queja de cliente</option>
              <option value="regulatory_inspection">Inspeccion regulatoria</option>
              <option value="self_assessment">Autoevaluacion</option>
            </select>
          </div>
          <div>
            <label htmlFor="root_cause_method" className={labelClass}>Metodo de causa raiz</label>
            <select
              id="root_cause_method"
              name="root_cause_method"
              defaultValue={nc.root_cause_method ?? ''}
              className={inputClass}
            >
              <option value="">— Selecciona —</option>
              <option value="5_whys">5 Por ques</option>
              <option value="fishbone">Espina de pescado</option>
              <option value="fault_tree">Arbol de fallas</option>
              <option value="pareto">Pareto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fechas */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Fechas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="detected_at" className={labelClass}>Fecha de deteccion</label>
            <input
              id="detected_at"
              name="detected_at"
              type="date"
              defaultValue={nc.detected_at ? nc.detected_at.slice(0, 10) : ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="target_close_date" className={labelClass}>Fecha limite de cierre</label>
            <input
              id="target_close_date"
              name="target_close_date"
              type="date"
              defaultValue={nc.target_close_date ? nc.target_close_date.slice(0, 10) : ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="closed_at" className={labelClass}>Fecha de cierre</label>
            <input
              id="closed_at"
              name="closed_at"
              type="date"
              defaultValue={nc.closed_at ? nc.closed_at.slice(0, 10) : ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Verificacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Verificacion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="verified_by" className={labelClass}>Verificado por</label>
            <input
              id="verified_by"
              name="verified_by"
              type="text"
              defaultValue={nc.verified_by ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Analisis */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Analisis</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="root_cause" className={labelClass}>Causa raiz</label>
            <textarea
              id="root_cause"
              name="root_cause"
              rows={3}
              defaultValue={nc.root_cause ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Descripcion</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={nc.description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="notes" className={labelClass}>Notas</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={nc.notes ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/nonconformities/${nc.id}`)}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
