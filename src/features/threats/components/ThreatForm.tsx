'use client';

import { useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createThreat, updateThreat } from '../actions/threatActions';

interface Threat {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  origin: string;
  affected_dimensions: string[];
  affected_asset_types?: string[] | null;
  frequency_base: number;
  is_active: boolean;
}

interface ThreatFormProps {
  onClose: () => void;
  threat?: Threat;
}

const ORIGIN_OPTIONS = [
  { value: 'natural', label: 'Natural' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'accidental', label: 'Accidental' },
  { value: 'deliberate', label: 'Deliberada' },
];

const DIMENSION_OPTIONS = [
  { value: 'confidentiality', label: 'Confidencialidad' },
  { value: 'integrity', label: 'Integridad' },
  { value: 'availability', label: 'Disponibilidad' },
  { value: 'authenticity', label: 'Autenticidad' },
  { value: 'traceability', label: 'Trazabilidad' },
];

const baseInputClass =
  'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition-colors';

export function ThreatForm({ onClose, threat }: ThreatFormProps) {
  const isEdit = Boolean(threat);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(
    threat?.affected_dimensions ?? ['confidentiality'],
  );

  function toggleDimension(value: string) {
    setSelectedDimensions((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Inject checkbox values manually since unchecked boxes are not submitted
    selectedDimensions.forEach((dim) => formData.append('affected_dimensions', dim));

    startTransition(async () => {
      const result = isEdit
        ? await updateThreat(threat!.id, formData)
        : await createThreat(formData);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {isEdit ? 'Editar Amenaza' : 'Nueva Amenaza'}
          </h3>
          {isEdit && threat && (
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{threat.code}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          aria-label="Cerrar formulario"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="threat-name" className="block text-sm font-medium text-slate-600">
            Nombre <span className="text-rose-400">*</span>
          </label>
          <input
            id="threat-name"
            name="name"
            type="text"
            required
            defaultValue={threat?.name ?? ''}
            placeholder="Ej. Inundacion, Acceso no autorizado..."
            className={baseInputClass}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="threat-description" className="block text-sm font-medium text-slate-600">
            Descripcion
          </label>
          <textarea
            id="threat-description"
            name="description"
            rows={3}
            defaultValue={threat?.description ?? ''}
            placeholder="Descripcion detallada de la amenaza..."
            className={`${baseInputClass} min-h-[80px] resize-none`}
          />
        </div>

        {/* Origin + Frequency row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="threat-origin" className="block text-sm font-medium text-slate-600">
              Origen <span className="text-rose-400">*</span>
            </label>
            <select
              id="threat-origin"
              name="origin"
              required
              defaultValue={threat?.origin ?? ''}
              className={baseInputClass}
            >
              <option value="">Seleccionar origen...</option>
              {ORIGIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="threat-frequency" className="block text-sm font-medium text-slate-600">
              Frecuencia base{' '}
              <span className="text-slate-400 font-normal text-xs">(1–5)</span>
            </label>
            <input
              id="threat-frequency"
              name="frequency_base"
              type="number"
              min={1}
              max={5}
              defaultValue={threat?.frequency_base ?? 1}
              className={baseInputClass}
            />
          </div>
        </div>

        {/* Affected dimensions */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Dimensiones afectadas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIMENSION_OPTIONS.map((dim) => {
              const checked = selectedDimensions.includes(dim.value);
              return (
                <label
                  key={dim.value}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none ${
                    checked
                      ? 'bg-sky-50 border-sky-300 text-sky-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleDimension(dim.value)}
                  />
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? 'bg-sky-500 border-sky-500' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-xs font-medium">{dim.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || selectedDimensions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear amenaza'}
          </button>
        </div>
      </form>
    </div>
  );
}
