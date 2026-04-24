'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { updatePolicy } from '../actions/policyActions';
import type { PolicyRow } from '../services/policyService';

interface Props {
  policy: PolicyRow;
}

export function PolicyEditForm({ policy }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updatePolicy(policy.id, fd);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      router.push(`/policies/${policy.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identificación</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Código *</label>
            <input
              name="code"
              required
              defaultValue={policy.code}
              placeholder="POL-001"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Versión</label>
            <input
              name="version"
              defaultValue={policy.version}
              placeholder="1.0"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
          <input
            name="title"
            required
            defaultValue={policy.title}
            placeholder="Nombre del documento"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
            <select
              name="policy_type"
              defaultValue={policy.policy_type}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="policy">Política</option>
              <option value="procedure">Procedimiento</option>
              <option value="guideline">Directriz</option>
              <option value="standard">Estándar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
            <select
              name="status"
              defaultValue={policy.status}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="approved">Aprobado</option>
              <option value="obsolete">Obsoleto</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={policy.description ?? ''}
            placeholder="Resumen del propósito del documento..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Ownership & dates */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vigencia y responsabilidad</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Propietario</label>
            <input
              name="owner"
              defaultValue={policy.owner ?? ''}
              placeholder="Nombre del responsable"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Aprobado por</label>
            <input
              name="approved_by"
              defaultValue={policy.approved_by ?? ''}
              placeholder="Nombre del aprobador"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de aprobación</label>
            <input
              name="approved_at"
              type="date"
              defaultValue={policy.approved_at?.substring(0, 10) ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha efectiva</label>
            <input
              name="effective_date"
              type="date"
              defaultValue={policy.effective_date?.substring(0, 10) ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de revisión</label>
            <input
              name="review_date"
              type="date"
              defaultValue={policy.review_date?.substring(0, 10) ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contenido del documento</h2>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Texto completo de la política</label>
          <textarea
            name="content"
            rows={12}
            defaultValue={policy.content ?? ''}
            placeholder="Redacta aquí el contenido completo del documento..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notas internas</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={policy.notes ?? ''}
            placeholder="Observaciones o comentarios internos..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>
      </div>

      {formError && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3 pb-6">
        <button
          type="button"
          onClick={() => router.push(`/policies/${policy.id}`)}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
