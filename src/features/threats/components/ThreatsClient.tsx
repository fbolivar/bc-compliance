'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  Lock,
  Pencil,
  Trash2,
  Search,
  Plus,
  Shield,
  X,
  AlertTriangle,
} from 'lucide-react';
import { ThreatForm } from './ThreatForm';
import { deleteThreat } from '../actions/threatActions';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ThreatsClientProps {
  threats: Threat[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ORIGIN_TABS = [
  { value: 'all', label: 'Todas' },
  { value: 'natural', label: 'Naturales' },
  { value: 'industrial', label: 'Industriales' },
  { value: 'accidental', label: 'Accidentales' },
  { value: 'deliberate', label: 'Deliberadas' },
] as const;

const ORIGIN_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  natural: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Natural',
  },
  industrial: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Industrial',
  },
  accidental: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    label: 'Accidental',
  },
  deliberate: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Deliberada',
  },
};

const DIMENSION_STYLES: Record<string, { short: string; color: string }> = {
  confidentiality: { short: 'C', color: 'bg-blue-100 text-blue-700' },
  integrity: { short: 'I', color: 'bg-emerald-100 text-emerald-700' },
  availability: { short: 'A', color: 'bg-amber-100 text-amber-700' },
  authenticity: { short: 'Au', color: 'bg-purple-100 text-purple-700' },
  traceability: { short: 'T', color: 'bg-slate-100 text-slate-600' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function OriginBadge({ origin }: { origin: string }) {
  const style = ORIGIN_STYLES[origin];
  if (!style) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
        {origin}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${style.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {style.label}
    </span>
  );
}

function DimensionPills({ dimensions }: { dimensions: string[] }) {
  if (!dimensions?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {dimensions.map((dim) => {
        const style = DIMENSION_STYLES[dim];
        if (!style) return null;
        return (
          <span
            key={dim}
            title={dim}
            className={`inline-flex items-center justify-center w-6 h-5 rounded text-xs font-semibold ${style.color}`}
          >
            {style.short}
          </span>
        );
      })}
    </div>
  );
}

function FrequencyDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" title={`Frecuencia: ${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-sky-500' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  threat,
  onConfirm,
  onCancel,
  isPending,
}: {
  threat: Threat;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Eliminar amenaza</h3>
            <p className="mt-1 text-xs text-slate-500">
              Esta accion eliminara permanentemente{' '}
              <span className="font-medium text-slate-700">{threat.name}</span>. No se puede
              deshacer.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ThreatsClient({ threats }: ThreatsClientProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingThreat, setEditingThreat] = useState<Threat | null>(null);
  const [deletingThreat, setDeletingThreat] = useState<Threat | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Counts per tab
  const countByOrigin = useMemo(() => {
    const counts: Record<string, number> = { all: threats.length };
    threats.forEach((t) => {
      counts[t.origin] = (counts[t.origin] ?? 0) + 1;
    });
    return counts;
  }, [threats]);

  // Custom threats count
  const customCount = useMemo(
    () => threats.filter((t) => t.organization_id !== null).length,
    [threats],
  );

  // Filtered list
  const filtered = useMemo(() => {
    let list = activeTab === 'all' ? threats : threats.filter((t) => t.origin === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [threats, activeTab, search]);

  function openCreate() {
    setEditingThreat(null);
    setShowForm(true);
  }

  function openEdit(threat: Threat) {
    setEditingThreat(threat);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingThreat(null);
  }

  function handleDeleteConfirm() {
    if (!deletingThreat) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteThreat(deletingThreat.id);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setDeletingThreat(null);
      }
    });
  }

  return (
    <>
      {/* Delete dialog */}
      {deletingThreat && (
        <DeleteConfirmDialog
          threat={deletingThreat}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeletingThreat(null);
            setDeleteError(null);
          }}
          isPending={isPending}
        />
      )}

      <div className="space-y-4">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(ORIGIN_STYLES).map(([key, style]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`text-left rounded-xl border p-3.5 transition-all ${
                activeTab === key
                  ? `${style.badge} shadow-sm`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {style.label}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-800">
                {countByOrigin[key] ?? 0}
              </p>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, codigo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-sky-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva Amenaza
          </button>
        </div>

        {/* Origin tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {ORIGIN_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? 'bg-sky-100 text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs tabular-nums ${
                  activeTab === tab.value ? 'text-sky-600' : 'text-slate-400'
                }`}
              >
                {countByOrigin[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Inline form */}
        {showForm && (
          <ThreatForm
            key={editingThreat?.id ?? 'new'}
            threat={editingThreat ?? undefined}
            onClose={closeForm}
          />
        )}

        {/* Delete error inline */}
        {deleteError && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {deleteError}
          </p>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            <span className="font-medium text-slate-700">{filtered.length}</span> amenaza
            {filtered.length !== 1 ? 's' : ''} mostrada{filtered.length !== 1 ? 's' : ''}
            {search && (
              <>
                {' '}
                &middot; filtrando por{' '}
                <span className="font-medium text-slate-700">&ldquo;{search}&rdquo;</span>
              </>
            )}
          </span>
          <span>
            <span className="font-medium text-sky-600">{customCount}</span> personalizada
            {customCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                {search ? 'Sin resultados para la busqueda' : 'No hay amenazas en esta categoria'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {search
                  ? 'Intenta con otros terminos'
                  : 'Crea una amenaza personalizada con el boton superior'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">
                        Codigo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                        Origen
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">
                        Dimensiones
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28 hidden lg:table-cell">
                        Frecuencia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">
                        Tipo
                      </th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((threat, idx) => {
                      const isSystem = threat.organization_id === null;
                      return (
                        <tr
                          key={threat.id}
                          className={`transition-colors hover:bg-sky-50/40 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}
                        >
                          {/* Code */}
                          <td className="px-4 py-3">
                            <span
                              className={`font-mono text-xs font-medium ${
                                isSystem ? 'text-slate-500' : 'text-sky-600'
                              }`}
                            >
                              {threat.code}
                            </span>
                          </td>
                          {/* Name + description */}
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-700 leading-snug">
                              {threat.name}
                            </p>
                            {threat.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                {threat.description}
                              </p>
                            )}
                          </td>
                          {/* Origin */}
                          <td className="px-4 py-3">
                            <OriginBadge origin={threat.origin} />
                          </td>
                          {/* Dimensions */}
                          <td className="px-4 py-3">
                            <DimensionPills dimensions={threat.affected_dimensions} />
                          </td>
                          {/* Frequency */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <FrequencyDots value={threat.frequency_base} />
                          </td>
                          {/* Type */}
                          <td className="px-4 py-3">
                            {isSystem ? (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Lock className="w-3 h-3" />
                                Sistema
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-sky-600">
                                <Pencil className="w-3 h-3" />
                                Personalizada
                              </span>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            {!isSystem ? (
                              <div className="flex items-center justify-end gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => openEdit(threat)}
                                  className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                                  title="Editar"
                                  aria-label={`Editar ${threat.name}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingThreat(threat)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                  aria-label={`Eliminar ${threat.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end">
                                <span
                                  className="p-1.5 text-slate-300 cursor-not-allowed"
                                  title="Las amenazas del catalogo MAGERIT no se pueden modificar"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filtered.map((threat) => {
                  const isSystem = threat.organization_id === null;
                  return (
                    <div key={threat.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono text-xs font-medium ${
                                isSystem ? 'text-slate-500' : 'text-sky-600'
                              }`}
                            >
                              {threat.code}
                            </span>
                            <OriginBadge origin={threat.origin} />
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-700">{threat.name}</p>
                          {threat.description && (
                            <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                              {threat.description}
                            </p>
                          )}
                        </div>
                        {!isSystem ? (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEdit(threat)}
                              className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                              aria-label={`Editar ${threat.name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingThreat(threat)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              aria-label={`Eliminar ${threat.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <DimensionPills dimensions={threat.affected_dimensions} />
                        <FrequencyDots value={threat.frequency_base} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
