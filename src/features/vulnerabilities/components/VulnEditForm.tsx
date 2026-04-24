'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { updateVulnerability } from '../actions/vulnActions';
import type { VulnRow } from '../services/vulnService';

interface Props {
  vuln: VulnRow;
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 bg-white';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
const sectionHeaderClass = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';
const cardClass = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';

export function VulnEditForm({ vuln }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateVulnerability(vuln.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/vulnerabilities/${vuln.id}`);
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
              defaultValue={vuln.code}
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
              defaultValue={vuln.title}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cve_id" className={labelClass}>ID CVE</label>
            <input
              id="cve_id"
              name="cve_id"
              type="text"
              placeholder="CVE-2024-..."
              defaultValue={vuln.cve_id ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="source" className={labelClass}>Fuente</label>
            <input
              id="source"
              name="source"
              type="text"
              placeholder="Nessus, Qualys, pentest..."
              defaultValue={vuln.source ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cvss_base_score" className={labelClass}>Score CVSS (0–10)</label>
            <input
              id="cvss_base_score"
              name="cvss_base_score"
              type="number"
              min={0}
              max={10}
              step={0.1}
              defaultValue={vuln.cvss_base_score ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Estado */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Estado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="severity" className={labelClass}>Severidad</label>
            <select
              id="severity"
              name="severity"
              defaultValue={vuln.severity}
              className={inputClass}
            >
              <option value="critical">Critica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
              <option value="informational">Informativa</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>Estado</label>
            <select
              id="status"
              name="status"
              defaultValue={vuln.status}
              className={inputClass}
            >
              <option value="open">Abierto</option>
              <option value="in_progress">En progreso</option>
              <option value="remediated">Remediado</option>
              <option value="accepted">Aceptado (riesgo)</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          <div>
            <label htmlFor="due_date" className={labelClass}>Fecha limite</label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              defaultValue={vuln.due_date ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Analisis y Remediacion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Analisis y Remediacion</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className={labelClass}>Descripcion</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={vuln.description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="remediation" className={labelClass}>Remediacion</label>
            <textarea
              id="remediation"
              name="remediation"
              rows={4}
              defaultValue={vuln.remediation ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Plan de Accion */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Plan de Accion</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="action_plan" className={labelClass}>Plan de accion</label>
            <textarea
              id="action_plan"
              name="action_plan"
              rows={4}
              defaultValue={vuln.action_plan ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="action_responsible" className={labelClass}>Responsable</label>
              <input
                id="action_responsible"
                name="action_responsible"
                type="text"
                defaultValue={vuln.action_responsible ?? ''}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="action_priority" className={labelClass}>Prioridad</label>
              <select
                id="action_priority"
                name="action_priority"
                defaultValue={vuln.action_priority ?? ''}
                className={inputClass}
              >
                <option value="">— Selecciona —</option>
                <option value="critical">Critica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            <div>
              <label htmlFor="action_status" className={labelClass}>Estado del plan</label>
              <select
                id="action_status"
                name="action_status"
                defaultValue={vuln.action_status ?? ''}
                className={inputClass}
              >
                <option value="">— Selecciona —</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/vulnerabilities/${vuln.id}`)}
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
