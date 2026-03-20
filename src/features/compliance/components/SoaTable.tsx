'use client';

import { useState, useTransition, useCallback } from 'react';
import { ChevronDown, Check, AlertCircle, Loader2, Filter } from 'lucide-react';
import { updateSoaEntry } from '@/features/compliance/actions/complianceActions';

export interface SoaEntryEnriched {
  id: string;
  is_applicable: boolean;
  justification: string | null;
  compliance_status: string;
  implementation_status: string;
  notes: string | null;
  requirement_id: string;
  framework_requirements: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    framework_id: string;
    frameworks: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface Props {
  entries: SoaEntryEnriched[];
  frameworks: { id: string; name: string }[];
}

const IMPL_STATUS_OPTIONS = [
  { value: 'implemented', label: 'Implementado', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'partially_implemented', label: 'Parcial', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'planned', label: 'Planificado', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { value: 'not_implemented', label: 'No implementado', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { value: 'not_applicable', label: 'N/A', color: 'text-slate-600 bg-slate-100 border-slate-200' },
] as const;

type ImplStatus = (typeof IMPL_STATUS_OPTIONS)[number]['value'];

function statusColor(status: string): string {
  const found = IMPL_STATUS_OPTIONS.find((o) => o.value === status);
  return found?.color ?? 'text-slate-600 bg-slate-100 border-slate-200';
}

function statusLabel(status: string): string {
  const found = IMPL_STATUS_OPTIONS.find((o) => o.value === status);
  return found?.label ?? status.replace(/_/g, ' ');
}

interface RowState {
  implementation_status: string;
  is_applicable: boolean;
  justification: string;
  notes: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
  expanded: boolean;
}

export function SoaTable({ entries, frameworks }: Props) {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const e of entries) {
      init[e.id] = {
        implementation_status: e.implementation_status ?? 'not_implemented',
        is_applicable: e.is_applicable ?? true,
        justification: e.justification ?? '',
        notes: e.notes ?? '',
        saving: false,
        saved: false,
        error: null,
        expanded: false,
      };
    }
    return init;
  });

  const [, startTransition] = useTransition();

  const updateRow = useCallback(
    (id: string, patch: Partial<RowState>) => {
      setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    },
    [],
  );

  const saveEntry = useCallback(
    (entry: SoaEntryEnriched) => {
      const row = rowStates[entry.id];
      if (!row) return;

      updateRow(entry.id, { saving: true, saved: false, error: null });

      const fd = new FormData();
      fd.set('implementation_status', row.implementation_status);
      fd.set('is_applicable', String(row.is_applicable));
      fd.set('justification', row.justification);
      fd.set('notes', row.notes);

      startTransition(async () => {
        const result = await updateSoaEntry(entry.id, fd);
        if (result.error) {
          updateRow(entry.id, { saving: false, error: result.error });
        } else {
          updateRow(entry.id, { saving: false, saved: true, error: null });
          setTimeout(() => updateRow(entry.id, { saved: false }), 2000);
        }
      });
    },
    [rowStates, updateRow],
  );

  const handleStatusChange = useCallback(
    (entry: SoaEntryEnriched, value: string) => {
      const newApplicable = value !== 'not_applicable';
      updateRow(entry.id, {
        implementation_status: value,
        is_applicable: newApplicable,
      });

      // Auto-save on status change
      const fd = new FormData();
      fd.set('implementation_status', value);
      fd.set('is_applicable', String(newApplicable));
      fd.set('justification', rowStates[entry.id]?.justification ?? '');
      fd.set('notes', rowStates[entry.id]?.notes ?? '');

      updateRow(entry.id, { saving: true, saved: false, error: null });
      startTransition(async () => {
        const result = await updateSoaEntry(entry.id, fd);
        if (result.error) {
          updateRow(entry.id, { saving: false, error: result.error });
        } else {
          updateRow(entry.id, { saving: false, saved: true, error: null });
          setTimeout(() => updateRow(entry.id, { saved: false }), 2000);
        }
      });
    },
    [rowStates, updateRow],
  );

  const filtered = entries.filter((e) => {
    const fw = e.framework_requirements?.frameworks;
    if (selectedFramework !== 'all' && fw?.id !== selectedFramework) return false;
    const row = rowStates[e.id];
    if (selectedStatus !== 'all' && row?.implementation_status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          <span>Filtrar:</span>
        </div>

        <div className="relative">
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Todos los frameworks</option>
            {frameworks.map((fw) => (
              <option key={fw.id} value={fw.id}>
                {fw.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            {IMPL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} de {entries.length} entradas
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">
                  Codigo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Requisito
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-52">
                  Estado implementacion
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
                  Aplica
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Justificacion
                </th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    No hay entradas que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const row = rowStates[entry.id];
                  if (!row) return null;
                  const req = entry.framework_requirements;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Code */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-sky-600">
                          {req?.code ?? '-'}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 font-medium leading-snug">
                          {req?.name ?? '-'}
                        </p>
                        {req?.description && (
                          <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                            {req.description}
                          </p>
                        )}
                      </td>

                      {/* Status dropdown */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={row.implementation_status}
                            onChange={(e) =>
                              handleStatusChange(entry, e.target.value as ImplStatus)
                            }
                            disabled={row.saving}
                            className={`appearance-none w-full pl-3 pr-7 py-1.5 text-xs font-medium border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${statusColor(row.implementation_status)}`}
                            aria-label={`Estado de implementacion para ${req?.code}`}
                          >
                            {IMPL_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                        </div>
                        {row.error && (
                          <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {row.error}
                          </p>
                        )}
                      </td>

                      {/* Applicable toggle */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newVal = !row.is_applicable;
                            updateRow(entry.id, { is_applicable: newVal });
                            const fd = new FormData();
                            fd.set('implementation_status', row.implementation_status);
                            fd.set('is_applicable', String(newVal));
                            fd.set('justification', row.justification);
                            fd.set('notes', row.notes);
                            updateRow(entry.id, { saving: true });
                            startTransition(async () => {
                              const result = await updateSoaEntry(entry.id, fd);
                              if (result.error) {
                                updateRow(entry.id, { saving: false, error: result.error });
                              } else {
                                updateRow(entry.id, { saving: false, saved: true });
                                setTimeout(() => updateRow(entry.id, { saved: false }), 2000);
                              }
                            });
                          }}
                          disabled={row.saving}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 disabled:opacity-50 ${
                            row.is_applicable ? 'bg-sky-500' : 'bg-slate-200'
                          }`}
                          aria-label={`Aplicabilidad: ${row.is_applicable ? 'Aplica' : 'No aplica'}`}
                          role="switch"
                          aria-checked={row.is_applicable}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                              row.is_applicable ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Justification inline edit */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.justification}
                          onChange={(e) =>
                            updateRow(entry.id, { justification: e.target.value })
                          }
                          onBlur={() => saveEntry(entry)}
                          placeholder="Agregar justificacion..."
                          className="w-full text-xs text-slate-600 placeholder-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-sky-400 focus:outline-none py-0.5 transition-colors"
                          aria-label={`Justificacion para ${req?.code}`}
                        />
                      </td>

                      {/* Save indicator */}
                      <td className="px-4 py-3 text-center">
                        {row.saving && (
                          <Loader2 className="w-4 h-4 text-sky-500 animate-spin mx-auto" />
                        )}
                        {row.saved && !row.saving && (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
