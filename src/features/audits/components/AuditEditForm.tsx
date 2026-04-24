'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { updateAudit } from '../actions/auditActions';
import type { AuditRow } from '../services/auditService';

interface Props {
  audit: AuditRow;
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 bg-white';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
const sectionHeaderClass = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';
const cardClass = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';

export function AuditEditForm({ audit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateAudit(audit.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/audits/${audit.id}`);
          router.refresh();
        }, 800);
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

      {/* Informacion General */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Informacion General</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="code" className={labelClass}>Codigo</label>
            <input
              id="code"
              name="code"
              type="text"
              defaultValue={audit.code}
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
              defaultValue={audit.title}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="year" className={labelClass}>Ano</label>
            <input
              id="year"
              name="year"
              type="number"
              defaultValue={audit.year ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="audit_type" className={labelClass}>Tipo de auditoria</label>
            <select
              id="audit_type"
              name="audit_type"
              defaultValue={audit.audit_type}
              className={inputClass}
            >
              <option value="internal">Interna</option>
              <option value="external">Externa</option>
              <option value="certification">Certificacion</option>
              <option value="surveillance">Vigilancia</option>
              <option value="gap_assessment">Evaluacion de brechas</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>Estado</label>
            <select
              id="status"
              name="status"
              defaultValue={audit.status}
              className={inputClass}
            >
              <option value="planned">Planificado</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Planificacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Planificacion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="planned_start" className={labelClass}>Inicio planificado</label>
            <input
              id="planned_start"
              name="planned_start"
              type="date"
              defaultValue={audit.planned_start ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="planned_end" className={labelClass}>Fin planificado</label>
            <input
              id="planned_end"
              name="planned_end"
              type="date"
              defaultValue={audit.planned_end ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="actual_start" className={labelClass}>Inicio real</label>
            <input
              id="actual_start"
              name="actual_start"
              type="date"
              defaultValue={audit.actual_start ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="actual_end" className={labelClass}>Fin real</label>
            <input
              id="actual_end"
              name="actual_end"
              type="date"
              defaultValue={audit.actual_end ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Certificacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Certificacion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="certification_body" className={labelClass}>Entidad certificadora</label>
            <input
              id="certification_body"
              name="certification_body"
              type="text"
              placeholder="BSI, Bureau Veritas, SGS..."
              defaultValue={audit.certification_body ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="certificate_number" className={labelClass}>Numero de certificado</label>
            <input
              id="certificate_number"
              name="certificate_number"
              type="text"
              defaultValue={audit.certificate_number ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="certificate_expiry" className={labelClass}>Vencimiento del certificado</label>
            <input
              id="certificate_expiry"
              name="certificate_expiry"
              type="date"
              defaultValue={audit.certificate_expiry ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Alcance y Descripcion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Alcance y Descripcion</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="scope_description" className={labelClass}>Alcance</label>
            <textarea
              id="scope_description"
              name="scope_description"
              rows={3}
              defaultValue={audit.scope_description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Descripcion</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={audit.description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="notes" className={labelClass}>Notas</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={audit.notes ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/audits/${audit.id}`)}
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
