'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Plus, Trash2, Building2, Users, Briefcase, MapPin, Layers, ArrowRight, Loader2, X } from 'lucide-react';
import { createDependency, deleteDependency } from '../actions/dependencyActions';
import type { ProcessDependency } from '../services/dependencyService';

interface Props {
  processId: string;
  processName: string;
  dependencies: ProcessDependency[];
}

const KIND_SUGGESTIONS = [
  'Oficina',
  'Grupo',
  'Área',
  'Subdirección',
  'Dirección Territorial',
  'Unidad',
  'Coordinación',
  'Dependencia',
];

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Oficina: Building2,
  Grupo: Users,
  Área: Layers,
  Subdirección: Briefcase,
  'Dirección Territorial': MapPin,
  Unidad: Layers,
  Coordinación: Briefcase,
  Dependencia: Layers,
};

function iconFor(kind: string) {
  return KIND_ICON[kind] ?? Layers;
}

const KIND_BADGE: Record<string, string> = {
  Oficina: 'bg-sky-50 text-sky-700 border-sky-200',
  Grupo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Área: 'bg-amber-50 text-amber-700 border-amber-200',
  Subdirección: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Dirección Territorial': 'bg-rose-50 text-rose-700 border-rose-200',
  Unidad: 'bg-slate-50 text-slate-700 border-slate-200',
  Coordinación: 'bg-violet-50 text-violet-700 border-violet-200',
  Dependencia: 'bg-slate-50 text-slate-700 border-slate-200',
};

function badgeFor(kind: string) {
  return KIND_BADGE[kind] ?? 'bg-slate-50 text-slate-700 border-slate-200';
}

export function DependencyList({ processId, processName, dependencies }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('Oficina');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName('');
    setKind('Oficina');
    setDescription('');
    setError('');
  }

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    fd.set('process_id', processId);
    fd.set('name', name.trim());
    fd.set('kind', kind);
    if (description.trim()) fd.set('description', description.trim());

    startTransition(async () => {
      const res = await createDependency(fd);
      if (!res.ok) {
        setError(res.error ?? 'No se pudo crear');
        return;
      }
      resetForm();
      setShowForm(false);
      router.refresh();
    });
  }

  function onDelete(id: string, depName: string) {
    if (!confirm(`¿Eliminar la dependencia "${depName}"?\n\nTambién se eliminarán sus vínculos con activos (los activos permanecen).`)) return;
    startTransition(async () => {
      const res = await deleteDependency(id);
      if (!res.ok) {
        alert(res.error ?? 'No se pudo eliminar');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Dependencias del proceso
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {dependencies.length} {dependencies.length === 1 ? 'dependencia registrada' : 'dependencias registradas'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? <><X className="w-4 h-4" />Cancelar</> : <><Plus className="w-4 h-4" />Nueva dependencia</>}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onCreate}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="dep-name" className="block text-xs font-medium text-slate-600 mb-1">
                Nombre <span className="text-rose-500">*</span>
              </label>
              <input
                id="dep-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Grupo de Sistemas de Información"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
              />
            </div>
            <div>
              <label htmlFor="dep-kind" className="block text-xs font-medium text-slate-600 mb-1">
                Tipo
              </label>
              <input
                id="dep-kind"
                type="text"
                list="dep-kind-suggestions"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                placeholder="Oficina, Grupo, Área…"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
              />
              <datalist id="dep-kind-suggestions">
                {KIND_SUGGESTIONS.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="dep-description" className="block text-xs font-medium text-slate-600 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                id="dep-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Función o alcance de la dependencia"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex items-center gap-2 px-4 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</>
              ) : (
                <><Plus className="w-4 h-4" />Crear dependencia</>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Proceso: <span className="font-medium text-slate-600">{processName}</span>
          </p>
        </form>
      )}

      {dependencies.length === 0 && !showForm ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Sin dependencias todavía</p>
          <p className="text-xs text-slate-500 mt-1">
            Crea la primera oficina, grupo o área que compone este proceso.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Crear primera dependencia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dependencies.map((dep) => {
            const Icon = iconFor(dep.kind);
            return (
              <div
                key={dep.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-200">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${badgeFor(dep.kind)}`}>
                        {dep.kind}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug mt-1">{dep.name}</p>
                    {dep.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dep.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      {dep.asset_count} {dep.asset_count === 1 ? 'activo' : 'activos'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/assets/dependency/${dep.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700"
                  >
                    Ver activos
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(dep.id, dep.name)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    aria-label={`Eliminar ${dep.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
