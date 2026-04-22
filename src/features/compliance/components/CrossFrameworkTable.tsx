'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search, X, Loader2, ArrowRight, Plus, Link2 } from 'lucide-react';
import { FormModal } from '@/shared/components/FormModal';
import { linkRequirements, unlinkRequirements } from '@/features/compliance/actions/mappingActions';

export interface CrossMapping {
  id: string;
  source_requirement_id: string;
  source_code: string;
  source_title: string;
  source_framework_id: string;
  source_framework_name: string;
  target_requirement_id: string;
  target_code: string;
  target_title: string;
  target_framework_id: string;
  target_framework_name: string;
  mapping_strength: string;
  notes: string | null;
}

export interface RequirementOption {
  id: string;
  code: string;
  title: string;
  framework_id: string;
  framework_name: string;
}

interface Props {
  mappings: CrossMapping[];
  requirements: RequirementOption[];
}

const STRENGTH_OPTIONS = [
  { value: 'equivalent', label: 'Equivalente', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'superset', label: 'Superconjunto', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'subset', label: 'Subconjunto', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'partial', label: 'Parcial', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'related', label: 'Relacionado', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

function strengthMeta(strength: string) {
  return STRENGTH_OPTIONS.find((s) => s.value === strength) ?? STRENGTH_OPTIONS[4];
}

export function CrossFrameworkTable({ mappings, requirements }: Props) {
  const [search, setSearch] = useState('');
  const [sourceFramework, setSourceFramework] = useState('all');
  const [targetFramework, setTargetFramework] = useState('all');

  // Modal state
  const [isModalOpen, setModalOpen] = useState(false);
  const [srcFw, setSrcFw] = useState('');
  const [srcReq, setSrcReq] = useState('');
  const [tgtFw, setTgtFw] = useState('');
  const [tgtReq, setTgtReq] = useState('');
  const [strength, setStrength] = useState('related');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const frameworks = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of requirements) {
      if (r.framework_id && r.framework_name) map.set(r.framework_id, r.framework_name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requirements]);

  const filteredMappings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mappings.filter((m) => {
      if (sourceFramework !== 'all' && m.source_framework_id !== sourceFramework) return false;
      if (targetFramework !== 'all' && m.target_framework_id !== targetFramework) return false;
      if (q) {
        return (
          m.source_code.toLowerCase().includes(q) ||
          m.source_title.toLowerCase().includes(q) ||
          m.target_code.toLowerCase().includes(q) ||
          m.target_title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mappings, search, sourceFramework, targetFramework]);

  const srcReqOptions = useMemo(
    () => requirements.filter((r) => !srcFw || r.framework_id === srcFw),
    [requirements, srcFw],
  );
  const tgtReqOptions = useMemo(
    () => requirements.filter((r) => !tgtFw || r.framework_id === tgtFw),
    [requirements, tgtFw],
  );

  const resetModal = () => {
    setSrcFw('');
    setSrcReq('');
    setTgtFw('');
    setTgtReq('');
    setStrength('related');
    setNotes('');
    setError(null);
  };

  const handleAdd = () => {
    if (!srcReq || !tgtReq) {
      setError('Selecciona requisito origen y destino');
      return;
    }
    if (srcReq === tgtReq) {
      setError('Origen y destino deben ser distintos');
      return;
    }
    startTransition(async () => {
      const res = await linkRequirements({
        sourceRequirementId: srcReq,
        targetRequirementId: tgtReq,
        mappingStrength: strength,
        notes,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setModalOpen(false);
      resetModal();
      window.location.reload();
    });
  };

  const handleRemove = (mappingId: string) => {
    if (!confirm('¿Eliminar este mapeo cross-framework?')) return;
    startTransition(async () => {
      await unlinkRequirements(mappingId);
      window.location.reload();
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o título de requisito..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <select
          value={sourceFramework}
          onChange={(e) => setSourceFramework(e.target.value)}
          aria-label="Framework origen"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Origen: todos</option>
          {frameworks.map((fw) => (
            <option key={`src-${fw.id}`} value={fw.id}>Origen: {fw.name}</option>
          ))}
        </select>

        <select
          value={targetFramework}
          onChange={(e) => setTargetFramework(e.target.value)}
          aria-label="Framework destino"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Destino: todos</option>
          {frameworks.map((fw) => (
            <option key={`tgt-${fw.id}`} value={fw.id}>Destino: {fw.name}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            resetModal();
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo mapeo
        </button>

        <span className="text-xs text-slate-400 ml-auto">
          {filteredMappings.length} de {mappings.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {filteredMappings.length === 0 ? (
          <div className="py-16 text-center">
            <Link2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {mappings.length === 0
                ? 'No hay mapeos cross-framework aún.'
                : 'Ningún mapeo coincide con los filtros.'}
            </p>
            {mappings.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Crea el primero con el botón &ldquo;Nuevo mapeo&rdquo;.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Requisito Origen
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                    Relación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Requisito Destino
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-4 py-3 w-10" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMappings.map((m) => {
                  const meta = strengthMeta(m.mapping_strength);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-slate-400 uppercase">{m.source_framework_name}</p>
                        <p className="font-mono text-xs text-sky-600">{m.source_code}</p>
                        <p className="text-sm text-slate-600">{m.source_title}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-slate-400 uppercase">{m.target_framework_name}</p>
                        <p className="font-mono text-xs text-sky-600">{m.target_code}</p>
                        <p className="text-sm text-slate-600">{m.target_title}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                        {m.notes ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(m.id)}
                          disabled={pending}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                          aria-label="Eliminar mapeo"
                        >
                          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo mapeo cross-framework"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Framework origen</label>
              <select
                value={srcFw}
                onChange={(e) => { setSrcFw(e.target.value); setSrcReq(''); }}
                aria-label="Framework origen"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecciona...</option>
                {frameworks.map((fw) => <option key={fw.id} value={fw.id}>{fw.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Framework destino</label>
              <select
                value={tgtFw}
                onChange={(e) => { setTgtFw(e.target.value); setTgtReq(''); }}
                aria-label="Framework destino"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecciona...</option>
                {frameworks.map((fw) => <option key={fw.id} value={fw.id}>{fw.name}</option>)}
              </select>
            </div>
          </div>

          {srcFw && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Requisito origen
                <span className="ml-2 text-slate-400 font-normal">({srcReqOptions.length})</span>
              </label>
              <select
                value={srcReq}
                onChange={(e) => setSrcReq(e.target.value)}
                aria-label="Requisito origen"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecciona...</option>
                {srcReqOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.code} — {r.title}</option>
                ))}
              </select>
            </div>
          )}

          {tgtFw && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Requisito destino
                <span className="ml-2 text-slate-400 font-normal">({tgtReqOptions.length})</span>
              </label>
              <select
                value={tgtReq}
                onChange={(e) => setTgtReq(e.target.value)}
                aria-label="Requisito destino"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecciona...</option>
                {tgtReqOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.code} — {r.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Tipo de relación</label>
            <div className="grid grid-cols-4 gap-2">
              {STRENGTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStrength(opt.value)}
                  className={`px-2 py-1.5 text-xs font-medium border rounded-md transition-colors ${
                    strength === opt.value ? opt.color : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Diferencias o aclaraciones entre ambos requisitos..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

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
              disabled={pending || !srcReq || !tgtReq}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Crear mapeo
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
