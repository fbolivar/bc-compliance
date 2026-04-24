'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { updateIncident } from '../actions/incidentActions';
import type { IncidentRow } from '../services/incidentService';

interface Props {
  incident: IncidentRow;
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 bg-white';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
const sectionHeaderClass = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';
const cardClass = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

export function IncidentEditForm({ incident }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateIncident(incident.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/incidents/${incident.id}`);
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
              defaultValue={incident.code}
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
              defaultValue={incident.title}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="reported_by" className={labelClass}>Reportado por</label>
            <input
              id="reported_by"
              name="reported_by"
              type="text"
              defaultValue={incident.reported_by ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="assigned_to" className={labelClass}>Asignado a</label>
            <input
              id="assigned_to"
              name="assigned_to"
              type="text"
              defaultValue={incident.assigned_to ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Estado y Clasificacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Estado y Clasificacion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="severity" className={labelClass}>Severidad</label>
            <select
              id="severity"
              name="severity"
              defaultValue={incident.severity}
              className={inputClass}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Critica</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>Estado</label>
            <select
              id="status"
              name="status"
              defaultValue={incident.status}
              className={inputClass}
            >
              <option value="open">Abierto</option>
              <option value="investigating">Investigando</option>
              <option value="contained">Contenido</option>
              <option value="eradicated">Erradicado</option>
              <option value="recovered">Recuperado</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>Categoria</label>
            <select
              id="category"
              name="category"
              defaultValue={incident.category ?? ''}
              className={inputClass}
            >
              <option value="">— Selecciona —</option>
              <option value="malware">Malware</option>
              <option value="phishing">Phishing</option>
              <option value="data_breach">Brecha de datos</option>
              <option value="ddos">DDoS</option>
              <option value="insider_threat">Amenaza interna</option>
              <option value="ransomware">Ransomware</option>
              <option value="unauthorized_access">Acceso no autorizado</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="source" className={labelClass}>Fuente</label>
            <input
              id="source"
              name="source"
              type="text"
              defaultValue={incident.source ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Cronologia NIST */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Cronologia NIST SP 800-61</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="detected_at" className={labelClass}>Detectado</label>
            <input
              id="detected_at"
              name="detected_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(incident.detected_at)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="triaged_at" className={labelClass}>Triaje</label>
            <input
              id="triaged_at"
              name="triaged_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(incident.triaged_at)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="contained_at" className={labelClass}>Contenido</label>
            <input
              id="contained_at"
              name="contained_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(incident.contained_at)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="eradicated_at" className={labelClass}>Erradicado</label>
            <input
              id="eradicated_at"
              name="eradicated_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(incident.eradicated_at)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="recovered_at" className={labelClass}>Recuperado</label>
            <input
              id="recovered_at"
              name="recovered_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(incident.recovered_at)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="closed_at" className={labelClass}>Cerrado</label>
            <input
              id="closed_at"
              name="closed_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(incident.closed_at)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Descripcion y Analisis */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Descripcion y Analisis</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className={labelClass}>Descripcion</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={incident.description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="root_cause" className={labelClass}>Causa raiz</label>
            <textarea
              id="root_cause"
              name="root_cause"
              rows={3}
              defaultValue={incident.root_cause ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="lessons_learned" className={labelClass}>Lecciones aprendidas</label>
            <textarea
              id="lessons_learned"
              name="lessons_learned"
              rows={3}
              defaultValue={incident.lessons_learned ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Acciones de Respuesta */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Acciones de Respuesta</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="containment_actions" className={labelClass}>Acciones de contencion</label>
            <textarea
              id="containment_actions"
              name="containment_actions"
              rows={3}
              defaultValue={incident.containment_actions ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="eradication_actions" className={labelClass}>Acciones de erradicacion</label>
            <textarea
              id="eradication_actions"
              name="eradication_actions"
              rows={3}
              defaultValue={incident.eradication_actions ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="recovery_actions" className={labelClass}>Acciones de recuperacion</label>
            <textarea
              id="recovery_actions"
              name="recovery_actions"
              rows={3}
              defaultValue={incident.recovery_actions ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/incidents/${incident.id}`)}
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
