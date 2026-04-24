'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { createRegulatoryEvent, deleteRegulatoryEvent, markEventCompleted } from '../actions/regulatoryEventActions';
import type { RegulatoryEventRow } from '../services/regulatoryEventService';

const AUTHORITY_OPTIONS = [
  { value: 'SFC', label: 'SFC' },
  { value: 'SIC', label: 'SIC' },
  { value: 'UIAF', label: 'UIAF' },
  { value: 'MinTIC', label: 'MinTIC' },
  { value: 'ICONTEC', label: 'ICONTEC' },
  { value: 'Otro', label: 'Otro' },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'deadline', label: 'Plazo' },
  { value: 'report', label: 'Informe' },
  { value: 'audit', label: 'Auditoría' },
  { value: 'certification_renewal', label: 'Renovación certificado' },
  { value: 'review', label: 'Revisión' },
];

const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'Una vez' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'annual', label: 'Anual' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Completado' },
  { value: 'overdue', label: 'Vencido' },
];

const AUTHORITY_COLORS: Record<string, string> = {
  SFC: 'bg-sky-100 text-sky-700 border-sky-200',
  SIC: 'bg-violet-100 text-violet-700 border-violet-200',
  UIAF: 'bg-amber-100 text-amber-700 border-amber-200',
  MinTIC: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ICONTEC: 'bg-blue-100 text-blue-700 border-blue-200',
  Otro: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  overdue: 'bg-rose-100 text-rose-700 border-rose-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  overdue: 'Vencido',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  deadline: 'Plazo',
  report: 'Informe',
  audit: 'Auditoría',
  certification_renewal: 'Renovación certificado',
  review: 'Revisión',
};

const RECURRENCE_LABELS: Record<string, string> = {
  once: 'Una vez',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

function isOverdue(event: RegulatoryEventRow): boolean {
  if (event.status !== 'pending') return false;
  return new Date(event.due_date) < new Date();
}

interface Props {
  data: RegulatoryEventRow[];
}

export function RegulatoryCalendarClient({ data }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  // Optimistic completed set: ids that the user has marked as completed in this session
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await createRegulatoryEvent(fd);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      setIsOpen(false);
      form.reset();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este evento regulatorio?')) return;
    start(async () => {
      await deleteRegulatoryEvent(id);
      router.refresh();
    });
  }

  function handleComplete(id: string) {
    // Optimistic update: immediately mark as completed in local state
    setCompletedIds((prev) => new Set(prev).add(id));
    start(async () => {
      const res = await markEventCompleted(id);
      if (res.error) {
        // Roll back optimistic update on error
        setCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  }

  return (
    <>
      {/* Action button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo Evento
        </button>
      </div>

      {/* Events table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {data.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">No hay eventos regulatorios registrados.</p>
            <p className="text-xs text-slate-400 mt-1">Crea el primer evento usando el botón &quot;Nuevo Evento&quot;.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Autoridad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha límite</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recurrencia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((event) => {
                const isOptimisticallyCompleted = completedIds.has(event.id);
                const effectiveStatus = isOptimisticallyCompleted
                  ? 'completed'
                  : isOverdue(event)
                  ? 'overdue'
                  : event.status;
                const authColor = AUTHORITY_COLORS[event.authority] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                const effectiveColor = STATUS_COLORS[effectiveStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                const effectiveLabel = STATUS_LABELS[effectiveStatus] ?? event.status;
                const overdue = isOverdue(event) && !isOptimisticallyCompleted;
                const canComplete = effectiveStatus !== 'completed';

                return (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${authColor}`}>
                        {event.authority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium max-w-xs">
                      <span className="line-clamp-2">{event.title}</span>
                      {event.framework_ref && (
                        <span className="text-xs text-slate-400 font-normal font-mono block mt-0.5">
                          {event.framework_ref}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={overdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                        {new Date(event.due_date).toLocaleDateString('es-CO')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {RECURRENCE_LABELS[event.recurrence] ?? event.recurrence}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${effectiveColor}`}>
                        {effectiveLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        {canComplete && (
                          <button
                            type="button"
                            onClick={() => handleComplete(event.id)}
                            disabled={isPending}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded transition-all disabled:opacity-50"
                            aria-label="Marcar como completado"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Completar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id)}
                          disabled={isPending}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1 rounded disabled:opacity-50"
                          aria-label="Eliminar evento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              <h3 className="text-base font-semibold text-slate-800">Nuevo Evento Regulatorio</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
                <input
                  name="title"
                  required
                  placeholder="Nombre del evento o obligación"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Autoridad *</label>
                  <select
                    name="authority"
                    defaultValue="SFC"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {AUTHORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de evento</label>
                  <select
                    name="event_type"
                    defaultValue="deadline"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {EVENT_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha límite *</label>
                  <input
                    name="due_date"
                    type="date"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Recurrencia</label>
                  <select
                    name="recurrence"
                    defaultValue="once"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {RECURRENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                  <select
                    name="status"
                    defaultValue="pending"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Marco de referencia</label>
                  <input
                    name="framework_ref"
                    placeholder="ISO 27001, Circ 029..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Detalle del evento o requerimiento..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Observaciones internas..."
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
                  Guardar evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
