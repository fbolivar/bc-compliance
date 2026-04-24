'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Loader2, ExternalLink } from 'lucide-react';
import { createPolicy } from '../actions/policyActions';
import type { PolicyRow } from '../services/policyService';

const POLICY_TYPE_LABELS: Record<string, string> = {
  policy: 'Política',
  procedure: 'Procedimiento',
  guideline: 'Directriz',
  standard: 'Estándar',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  review: 'En revisión',
  approved: 'Aprobado',
  obsolete: 'Obsoleto',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  review: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  obsolete: 'bg-slate-100 text-slate-500 border-slate-200',
};

function PolicyStatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}

interface Props {
  data: PolicyRow[];
}

export function PoliciesClient({ data }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await createPolicy(fd);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      setIsOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <>
      {/* Action button rendered here so it can control the modal */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva Política
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {data.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">No hay políticas registradas.</p>
            <p className="text-xs text-slate-400 mt-1">Crea la primera política usando el botón &quot;Nueva Política&quot;.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Versión</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Propietario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Revisión</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((policy) => (
                <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3 text-sm">
                    <span className="font-mono text-sky-600 font-semibold text-xs">{policy.code}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 font-medium max-w-xs truncate">
                    {policy.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {POLICY_TYPE_LABELS[policy.policy_type] ?? policy.policy_type}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-mono text-slate-500 text-xs">{policy.version}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <PolicyStatusBadge status={policy.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {policy.owner ?? <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {policy.review_date
                      ? new Date(policy.review_date).toLocaleDateString('es-CO')
                      : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/policies/${policy.id}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">Nueva Política</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Código *</label>
                  <input
                    name="code"
                    required
                    placeholder="POL-001"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Versión</label>
                  <input
                    name="version"
                    defaultValue="1.0"
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
                  placeholder="Nombre del documento"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                  <select
                    name="policy_type"
                    defaultValue="policy"
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
                    defaultValue="draft"
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Propietario</label>
                <input
                  name="owner"
                  placeholder="Nombre del responsable"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha efectiva</label>
                  <input
                    name="effective_date"
                    type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de revisión</label>
                  <input
                    name="review_date"
                    type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Resumen del propósito del documento..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              {formError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar política
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
