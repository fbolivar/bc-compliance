'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { CheckSquare, Plus, X, Loader2, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import {
  linkControlToRequirement,
  unlinkControlFromRequirement,
  propagateControlAcrossFrameworks,
} from '@/features/compliance/actions/mappingActions';

export interface CoveredRequirementItem {
  mapping_id: string;
  requirement_id: string;
  code: string;
  title: string;
  framework_code: string;
  framework_name: string;
  coverage_percentage: number;
  compliance_status: string;
}

export interface AvailableRequirement {
  id: string;
  code: string;
  title: string;
  framework_code: string;
  framework_name: string;
}

interface Props {
  controlId: string;
  coveredRequirements: CoveredRequirementItem[];
  availableRequirements: AvailableRequirement[];
}

export function CoveredRequirementsPanel({
  controlId,
  coveredRequirements,
  availableRequirements,
}: Props) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState('');
  const [selectedRequirement, setSelectedRequirement] = useState('');
  const [coverage, setCoverage] = useState(80);
  const [justification, setJustification] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [propagating, setPropagating] = useState(false);

  const handlePropagate = () => {
    if (!confirm('Propagar este control a requisitos equivalentes en otros frameworks usando los mapeos cross-framework existentes?')) return;
    setPropagating(true);
    startTransition(async () => {
      const res = await propagateControlAcrossFrameworks(controlId);
      setPropagating(false);
      if (res.error) {
        alert(`Error: ${res.error}`);
        return;
      }
      alert(`Propagación completada: ${res.created ?? 0} nuevos mapeos creados, ${res.skipped ?? 0} ya existían.`);
      window.location.reload();
    });
  };

  const frameworks = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    for (const r of availableRequirements) {
      if (r.framework_name && !map.has(r.framework_name)) {
        map.set(r.framework_name, { code: r.framework_code, name: r.framework_name });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [availableRequirements]);

  const filteredRequirements = useMemo(() => {
    if (!selectedFramework) return [];
    return availableRequirements.filter((r) => r.framework_name === selectedFramework);
  }, [availableRequirements, selectedFramework]);

  const requirementsByFramework = useMemo(() => {
    return coveredRequirements.reduce<Record<string, CoveredRequirementItem[]>>((acc, req) => {
      const key = req.framework_name || 'Sin framework';
      if (!acc[key]) acc[key] = [];
      acc[key].push(req);
      return acc;
    }, {});
  }, [coveredRequirements]);

  const resetForm = () => {
    setSelectedFramework('');
    setSelectedRequirement('');
    setCoverage(80);
    setJustification('');
    setError(null);
  };

  const handleAdd = () => {
    if (!selectedRequirement) {
      setError('Selecciona un requisito');
      return;
    }
    startTransition(async () => {
      const res = await linkControlToRequirement({
        controlId,
        requirementId: selectedRequirement,
        coveragePercentage: coverage,
        justification,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setModalOpen(false);
      resetForm();
    });
  };

  const handleRemove = (mappingId: string) => {
    if (!confirm('¿Desvincular este requisito del control?')) return;
    startTransition(async () => {
      await unlinkControlFromRequirement(mappingId);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Requisitos Cubiertos
          </h2>
          <span className="text-xs text-slate-400 ml-1">({coveredRequirements.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/controls/mapping"
            className="text-xs text-sky-600 hover:text-sky-700 font-medium"
          >
            Ver todos →
          </Link>
          <button
            type="button"
            onClick={handlePropagate}
            disabled={propagating || coveredRequirements.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Propagar este control a requisitos equivalentes en otros frameworks"
          >
            {propagating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Propagar cross-framework
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            disabled={availableRequirements.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            title={availableRequirements.length === 0 ? 'No hay más requisitos disponibles' : 'Vincular requisito'}
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar requisito
          </button>
        </div>
      </div>

      {coveredRequirements.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">
            Este control aún no cubre requisitos de ningún framework.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {Object.entries(requirementsByFramework).map(([frameworkName, reqs]) => (
            <div key={frameworkName} className="px-6 py-4">
              <h3 className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">
                {frameworkName}
                <span className="ml-2 text-slate-400 font-normal normal-case">
                  ({reqs.length} {reqs.length === 1 ? 'requisito' : 'requisitos'})
                </span>
              </h3>
              <div className="space-y-1.5">
                {reqs.map((req) => (
                  <div
                    key={req.mapping_id}
                    className="group flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-mono text-xs font-semibold text-sky-600 w-16 flex-shrink-0 mt-0.5">
                      {req.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">{req.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={req.compliance_status} />
                      <span className="font-mono text-xs text-slate-500 w-10 text-right">
                        {req.coverage_percentage}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(req.mapping_id)}
                        disabled={pending}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                        title="Desvincular"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Vincular requisito a control"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Framework</label>
            <select
              value={selectedFramework}
              onChange={(e) => {
                setSelectedFramework(e.target.value);
                setSelectedRequirement('');
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Selecciona un framework...</option>
              {frameworks.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFramework && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Requisito
                <span className="ml-2 text-slate-400 font-normal">
                  ({filteredRequirements.length} disponibles)
                </span>
              </label>
              <select
                value={selectedRequirement}
                onChange={(e) => setSelectedRequirement(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecciona un requisito...</option>
                {filteredRequirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Cobertura (%)
              <span className="ml-2 font-mono text-sky-600">{coverage}%</span>
              <span className="ml-2 text-[11px] text-slate-400">
                (≥90% → Cumple, 50-89% → Parcial, &lt;50% → No cumple)
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={coverage}
              onChange={(e) => setCoverage(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Justificación (opcional)
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              placeholder="Cómo este control cumple el requisito..."
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
              disabled={pending || !selectedRequirement}
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
