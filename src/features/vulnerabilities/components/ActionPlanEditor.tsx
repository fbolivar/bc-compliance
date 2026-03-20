'use client';

import { useState } from 'react';
import { updateVulnerability } from '../actions/vulnActions';
import { Save, Loader2, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActionPlanEditorProps {
  vulnId: string;
  currentPlan: string | null;
  currentResponsible: string | null;
  currentPriority: string | null;
  currentStatus: string | null;
  currentRemediation: string | null;
  currentDueDate: string | null;
}

const priorities = [
  { value: 'critica', label: 'Critica' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

const statuses = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function ActionPlanEditor({
  vulnId, currentPlan, currentResponsible, currentPriority,
  currentStatus, currentRemediation, currentDueDate,
}: ActionPlanEditorProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateVulnerability(vulnId, formData);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Plan de accion actualizado' });
      setEditing(false);
      router.refresh();
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100";
  const labelClass = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {!editing ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Plan de Accion</h2>
            <button type="button" onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors">
              <Pencil className="w-3 h-3" /> Editar plan
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="py-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Remediacion</span>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{currentRemediation || <span className="text-slate-400">Sin definir</span>}</p>
            </div>
            <div className="py-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Plan de accion</span>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{currentPlan || <span className="text-slate-400">Sin definir</span>}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Responsable</span>
                <p className="text-sm text-slate-700 mt-1">{currentResponsible || <span className="text-slate-400">-</span>}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridad</span>
                <p className="text-sm text-slate-700 mt-1 capitalize">{currentPriority || <span className="text-slate-400">-</span>}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</span>
                <p className="text-sm text-slate-700 mt-1 capitalize">{currentStatus?.replace(/_/g, ' ') || <span className="text-slate-400">-</span>}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha limite</span>
                <p className="text-sm text-slate-700 mt-1">{currentDueDate ? new Date(currentDueDate).toLocaleDateString('es-CO') : <span className="text-slate-400">-</span>}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Editar Plan de Accion</h2>
            <button type="button" onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-3 h-3" /> Cancelar
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Remediacion / Solucion</label>
              <textarea name="remediation" rows={3} defaultValue={currentRemediation || ''} placeholder="Describir la solucion tecnica..." className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Plan de accion</label>
              <textarea name="action_plan" rows={3} defaultValue={currentPlan || ''} placeholder="Pasos a seguir para remediar..." className={`${inputClass} resize-none`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Responsable</label>
                <input type="text" name="action_responsible" defaultValue={currentResponsible || ''} placeholder="Nombre" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prioridad</label>
                <select name="action_priority" defaultValue={currentPriority || ''} className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado del plan</label>
                <select name="action_status" defaultValue={currentStatus || 'pendiente'} className={inputClass}>
                  {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fecha limite</label>
                <input type="date" name="due_date" defaultValue={currentDueDate || ''} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-lg transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar plan
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
