'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { updateControl } from '../actions/controlActions';
import type { ControlRow } from '../services/controlService';

interface Props {
  control: ControlRow;
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700 bg-white';
const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
const sectionHeaderClass = 'text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4';
const cardClass = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';

export function ControlEditForm({ control }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateControl(control.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/controls/${control.id}`);
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
              defaultValue={control.code}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>Nombre *</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={control.name}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="department" className={labelClass}>Departamento</label>
            <input
              id="department"
              name="department"
              type="text"
              defaultValue={control.department ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Tipo y Naturaleza */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Tipo y Naturaleza</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="control_type" className={labelClass}>Tipo de Control</label>
            <select
              id="control_type"
              name="control_type"
              defaultValue={control.control_type}
              className={inputClass}
            >
              <option value="preventive">Preventivo</option>
              <option value="detective">Detectivo</option>
              <option value="corrective">Correctivo</option>
              <option value="deterrent">Disuasivo</option>
            </select>
          </div>
          <div>
            <label htmlFor="control_nature" className={labelClass}>Naturaleza</label>
            <select
              id="control_nature"
              name="control_nature"
              defaultValue={control.control_nature ?? ''}
              className={inputClass}
            >
              <option value="">— Selecciona —</option>
              <option value="manual">Manual</option>
              <option value="automated">Automatizado</option>
              <option value="hybrid">Hibrido</option>
            </select>
          </div>
          <div>
            <label htmlFor="automation_level" className={labelClass}>Nivel de automatizacion</label>
            <select
              id="automation_level"
              name="automation_level"
              defaultValue={control.automation_level ?? ''}
              className={inputClass}
            >
              <option value="">— Selecciona —</option>
              <option value="fully_manual">Completamente manual</option>
              <option value="partially_automated">Parcialmente automatizado</option>
              <option value="fully_automated">Completamente automatizado</option>
            </select>
          </div>
          <div>
            <label htmlFor="execution_frequency" className={labelClass}>Frecuencia de ejecucion</label>
            <select
              id="execution_frequency"
              name="execution_frequency"
              defaultValue={control.execution_frequency ?? ''}
              className={inputClass}
            >
              <option value="">— Selecciona —</option>
              <option value="continuous">Continuo</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="annual">Anual</option>
              <option value="on_demand">A demanda</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>Estado</label>
            <select
              id="status"
              name="status"
              defaultValue={control.status}
              className={inputClass}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="planned">Planificado</option>
              <option value="under_review">En revision</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-5">
            <input
              id="is_key_control"
              name="is_key_control"
              type="checkbox"
              defaultChecked={control.is_key_control}
              value="true"
              className="w-4 h-4 accent-indigo-500 cursor-pointer"
            />
            <label htmlFor="is_key_control" className="text-sm text-slate-600 cursor-pointer">
              Control clave
            </label>
          </div>
        </div>
      </div>

      {/* Efectividad */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Efectividad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="design_effectiveness" className={labelClass}>Efectividad de diseno (0-100)</label>
            <input
              id="design_effectiveness"
              name="design_effectiveness"
              type="number"
              min={0}
              max={100}
              defaultValue={control.design_effectiveness ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="operating_effectiveness" className={labelClass}>Efectividad operativa (0-100)</label>
            <input
              id="operating_effectiveness"
              name="operating_effectiveness"
              type="number"
              min={0}
              max={100}
              defaultValue={control.operating_effectiveness ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="overall_effectiveness" className={labelClass}>Efectividad general (0-100)</label>
            <input
              id="overall_effectiveness"
              name="overall_effectiveness"
              type="number"
              min={0}
              max={100}
              defaultValue={control.overall_effectiveness ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Fechas */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Fechas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="next_review_date" className={labelClass}>Proxima revision</label>
            <input
              id="next_review_date"
              name="next_review_date"
              type="date"
              defaultValue={control.next_review_date ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="implementation_date" className={labelClass}>Fecha de implementacion</label>
            <input
              id="implementation_date"
              name="implementation_date"
              type="date"
              defaultValue={control.implementation_date ?? ''}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Textos */}
      <div className={cardClass}>
        <h2 className={sectionHeaderClass}>Textos</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="objective" className={labelClass}>Objetivo</label>
            <textarea
              id="objective"
              name="objective"
              rows={3}
              defaultValue={control.objective ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="implementation_notes" className={labelClass}>Notas de implementacion</label>
            <textarea
              id="implementation_notes"
              name="implementation_notes"
              rows={3}
              defaultValue={control.implementation_notes ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Descripcion</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={control.description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/controls/${control.id}`)}
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
