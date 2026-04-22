'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, X, Loader2, Filter } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { unlinkControlFromRequirement } from '@/features/compliance/actions/mappingActions';

export interface MappingRow {
  id: string;
  control_id: string;
  control_code: string;
  control_name: string;
  control_status: string;
  requirement_id: string;
  requirement_code: string;
  requirement_title: string;
  framework_name: string;
  coverage_percentage: number;
  compliance_status: string;
}

interface Props {
  items: MappingRow[];
}

export function ControlsMappingTable({ items }: Props) {
  const [search, setSearch] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pending, startTransition] = useTransition();

  const frameworks = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.framework_name && set.add(i.framework_name));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (frameworkFilter !== 'all' && i.framework_name !== frameworkFilter) return false;
      if (statusFilter !== 'all' && i.compliance_status !== statusFilter) return false;
      if (q) {
        return (
          i.control_code.toLowerCase().includes(q) ||
          i.control_name.toLowerCase().includes(q) ||
          i.requirement_code.toLowerCase().includes(q) ||
          i.requirement_title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search, frameworkFilter, statusFilter]);

  const handleRemove = (mappingId: string) => {
    if (!confirm('¿Eliminar este mapeo control-requisito?')) return;
    startTransition(async () => {
      await unlinkControlFromRequirement(mappingId);
      window.location.reload();
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por control o requisito..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
        </div>

        <select
          value={frameworkFilter}
          onChange={(e) => setFrameworkFilter(e.target.value)}
          aria-label="Filtrar por framework"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Todos los frameworks</option>
          {frameworks.map((fw) => (
            <option key={fw} value={fw}>{fw}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrar por estado"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">Todos los estados</option>
          <option value="compliant">Cumple</option>
          <option value="partially_compliant">Parcial</option>
          <option value="non_compliant">No cumple</option>
          <option value="not_assessed">Sin evaluar</option>
        </select>

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} de {items.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">
              {items.length === 0
                ? 'No hay mapeos de controles registrados.'
                : 'Ningún mapeo coincide con los filtros.'}
            </p>
            {items.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Los mapeos se crean desde el detalle de un control.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Control
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Framework
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Requisito
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Cumplimiento
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Cobertura
                  </th>
                  <th className="px-4 py-3 w-10" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/controls/${m.control_id}`}
                        className="font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline block"
                      >
                        {m.control_code}
                      </Link>
                      <p className="text-sm text-slate-600">{m.control_name}</p>
                      {m.control_status && (
                        <div className="mt-1"><StatusBadge status={m.control_status} /></div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{m.framework_name || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-500">{m.requirement_code}</p>
                      <p className="text-sm text-slate-600">{m.requirement_title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.compliance_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              m.coverage_percentage >= 90 ? 'bg-emerald-500' :
                              m.coverage_percentage >= 50 ? 'bg-amber-500' : 'bg-rose-400'
                            }`}
                            style={{ width: `${m.coverage_percentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-slate-600 w-10 text-right">
                          {m.coverage_percentage}%
                        </span>
                      </div>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
