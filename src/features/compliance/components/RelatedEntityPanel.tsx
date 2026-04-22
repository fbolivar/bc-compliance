'use client';

import { useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { Plus, X, Loader2 } from 'lucide-react';
import { FormModal } from '@/shared/components/FormModal';

export interface RelatedEntityItem {
  mapping_id: string;
  entity_id: string;
}

export interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface Column<T extends RelatedEntityItem> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render: (item: T) => ReactNode;
}

interface Props<T extends RelatedEntityItem> {
  title: string;
  icon: ReactNode;
  items: T[];
  columns: Column<T>[];
  emptyMessage: string;
  entityBasePath: string; // e.g. /risks, /controls
  addButtonLabel: string;
  modalTitle: string;
  optionGroupLabel?: string; // "Framework", "Riesgo", etc for selector label
  options: Option[];
  extraModalFields?: ReactNode;
  onAdd: (optionId: string) => Promise<{ error?: string }>;
  onRemove: (mappingId: string) => Promise<{ error?: string }>;
  onModalOpen?: () => void;
  confirmRemoveMessage?: string;
  headerExtra?: ReactNode;
}

export function RelatedEntityPanel<T extends RelatedEntityItem>({
  title,
  icon,
  items,
  columns,
  emptyMessage,
  addButtonLabel,
  modalTitle,
  optionGroupLabel = 'Item',
  options,
  extraModalFields,
  onAdd,
  onRemove,
  onModalOpen,
  confirmRemoveMessage = '¿Desvincular este item?',
  headerExtra,
}: Props<T>) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setSelectedId('');
    setError(null);
  };

  const handleAdd = () => {
    if (!selectedId) {
      setError(`Selecciona un ${optionGroupLabel.toLowerCase()}`);
      return;
    }
    startTransition(async () => {
      const res = await onAdd(selectedId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setModalOpen(false);
      reset();
    });
  };

  const handleRemove = (mappingId: string) => {
    if (!confirm(confirmRemoveMessage)) return;
    startTransition(async () => {
      await onRemove(mappingId);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            {title}
          </h3>
          <span className="text-xs text-slate-400 ml-1">({items.length})</span>
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          <button
            type="button"
            onClick={() => {
              reset();
              onModalOpen?.();
              setModalOpen(true);
            }}
            disabled={options.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            title={options.length === 0 ? 'No hay items disponibles' : addButtonLabel}
          >
            <Plus className="w-3.5 h-3.5" />
            {addButtonLabel}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-2 text-${col.align ?? 'left'} text-xs font-medium text-slate-500 uppercase tracking-wider`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-2 w-10" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.mapping_id} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-3 text-${col.align ?? 'left'}`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.mapping_id)}
                      disabled={pending}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                      aria-label="Desvincular"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              {optionGroupLabel}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              aria-label={optionGroupLabel}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Selecciona {optionGroupLabel.toLowerCase()}...</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                  {opt.sublabel ? ` — ${opt.sublabel}` : ''}
                </option>
              ))}
            </select>
          </div>

          {extraModalFields}

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={pending}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending || !selectedId}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Vincular
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}

// Export lightweight helper for entity-detail links
export function EntityLink({ href, code, label }: { href: string; code: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-block font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline"
    >
      {code}
      {label && <span className="sr-only"> — {label}</span>}
    </Link>
  );
}
