'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Filter, Loader2, Check, AlertTriangle, TrendingUp } from 'lucide-react';
import { bulkUpdateSoaStatus } from '@/features/compliance/actions/complianceActions';

export interface GapEntry {
  id: string;
  implementation_status: string;
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
  entries: GapEntry[];
  frameworks: { id: string; name: string }[];
  totalEntries: number;
}

const STATUS_LABELS: Record<string, string> = {
  not_implemented: 'No implementado',
  partially_implemented: 'Parcial',
  planned: 'Planificado',
  not_assessed: 'Sin evaluar',
};

const STATUS_BADGE: Record<string, string> = {
  not_implemented: 'bg-rose-100 text-rose-700 border border-rose-200',
  partially_implemented: 'bg-amber-100 text-amber-700 border border-amber-200',
  planned: 'bg-sky-100 text-sky-700 border border-sky-200',
  not_assessed: 'bg-slate-100 text-slate-600 border border-slate-200',
};

function GapBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_BADGE[status] ?? STATUS_BADGE['not_assessed']}`}
    >
      {STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
    </span>
  );
}

interface QuickActionButtonProps {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant: 'sky' | 'emerald';
}

function QuickActionButton({ label, onClick, disabled, variant }: QuickActionButtonProps) {
  const colors =
    variant === 'emerald'
      ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50'
      : 'border-sky-200 text-sky-700 hover:bg-sky-50 disabled:opacity-50';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${colors}`}
    >
      {label}
    </button>
  );
}

export function GapList({ entries, frameworks, totalEntries }: Props) {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const filtered = entries.filter((e) => {
    const fw = e.framework_requirements?.frameworks;
    if (selectedFramework !== 'all' && fw?.id !== selectedFramework) return false;
    if (selectedStatus !== 'all' && e.implementation_status !== selectedStatus) return false;
    return true;
  });

  const byFramework = filtered.reduce<Record<string, { fw: { id: string; name: string }; gaps: GapEntry[] }>>(
    (acc, entry) => {
      const fw = entry.framework_requirements?.frameworks;
      if (!fw) return acc;
      if (!acc[fw.id]) {
        acc[fw.id] = { fw, gaps: [] };
      }
      acc[fw.id].gaps.push(entry);
      return acc;
    },
    {},
  );

  function markEntries(ids: string[], status: string) {
    setUpdatingIds(new Set(ids));
    startTransition(async () => {
      const result = await bulkUpdateSoaStatus(ids, status);
      setUpdatingIds(new Set());
      if (result.success) {
        setUpdatedIds((prev) => new Set([...prev, ...ids]));
        setTimeout(() => {
          setUpdatedIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
          });
        }, 2000);
      }
    });
  }

  const implementedCount = totalEntries - entries.length;
  const closurePct = totalEntries > 0 ? Math.round((implementedCount / totalEntries) * 100) : 0;

  const uniqueStatuses = [...new Set(entries.map((e) => e.implementation_status))];

  return (
    <div className="space-y-4">
      {/* Gap closure progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            Cierre de brechas
          </span>
          <span className="text-sm font-semibold text-sky-600">{closurePct}% completado</span>
        </div>
        <meter
          value={closurePct}
          min={0}
          max={100}
          title={`${closurePct}% completado`}
          className="w-full h-2.5 [&::-webkit-meter-bar]:rounded-full [&::-webkit-meter-bar]:bg-slate-100 [&::-webkit-meter-optimum-value]:rounded-full [&::-webkit-meter-optimum-value]:bg-sky-500"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          {implementedCount} de {totalEntries} requisitos implementados — {entries.length} brechas pendientes
        </p>
      </div>

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
            className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
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
            className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} brechas mostradas
        </span>
      </div>

      {/* Gap groups */}
      {Object.values(byFramework).length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 py-14 text-center">
          <p className="text-sm font-medium text-emerald-700">
            No se encontraron brechas con los filtros seleccionados
          </p>
          <p className="text-xs text-emerald-600/70 mt-1">
            Ajusta los filtros o marca mas requisitos como implementados
          </p>
        </div>
      ) : (
        Object.values(byFramework).map(({ fw, gaps }) => (
          <div
            key={fw.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
          >
            {/* Framework header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <h2 className="text-sm font-semibold text-slate-700">{fw.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200">
                {gaps.length} {gaps.length === 1 ? 'brecha' : 'brechas'}
              </span>
              <div className="ml-auto flex gap-2">
                <QuickActionButton
                  label="Marcar todo como Planificado"
                  onClick={() =>
                    markEntries(
                      gaps.map((g) => g.id),
                      'planned',
                    )
                  }
                  disabled={updatingIds.size > 0}
                  variant="sky"
                />
                <QuickActionButton
                  label="Marcar todo como Implementado"
                  onClick={() =>
                    markEntries(
                      gaps.map((g) => g.id),
                      'implemented',
                    )
                  }
                  disabled={updatingIds.size > 0}
                  variant="emerald"
                />
              </div>
            </div>

            {/* Gap rows */}
            <div className="divide-y divide-slate-100">
              {gaps.map((gap) => {
                const req = gap.framework_requirements;
                const isUpdating = updatingIds.has(gap.id);
                const isUpdated = updatedIds.has(gap.id);

                return (
                  <div
                    key={gap.id}
                    className="px-4 py-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Code */}
                      <span className="font-mono text-xs font-semibold text-sky-600 w-24 shrink-0 mt-0.5">
                        {req?.code ?? '-'}
                      </span>

                      {/* Name + description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium">{req?.name ?? '-'}</p>
                        {req?.description && (
                          <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                            {req.description}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <GapBadge status={gap.implementation_status} />

                      {/* Quick actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isUpdating && (
                          <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                        )}
                        {isUpdated && !isUpdating && (
                          <Check className="w-4 h-4 text-emerald-500" />
                        )}
                        {!isUpdating && !isUpdated && (
                          <>
                            {gap.implementation_status !== 'planned' && (
                              <QuickActionButton
                                label="En progreso"
                                onClick={() => markEntries([gap.id], 'planned')}
                                disabled={false}
                                variant="sky"
                              />
                            )}
                            <QuickActionButton
                              label="Implementado"
                              onClick={() => markEntries([gap.id], 'implemented')}
                              disabled={false}
                              variant="emerald"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
