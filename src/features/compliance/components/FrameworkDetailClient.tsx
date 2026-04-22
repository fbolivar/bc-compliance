'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Check,
  Loader2,
  AlertCircle,
  Shield,
  Link2,
} from 'lucide-react';
import { updateSoaEntry } from '@/features/compliance/actions/complianceActions';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FrameworkData {
  id: string;
  code: string;
  name: string;
  version: string | null;
  description: string | null;
}

export interface RequirementData {
  id: string;
  framework_id: string;
  code: string;
  title: string;
  description: string | null;
  section: string | null;
  is_mandatory: boolean;
  compliance_status: string;
}

export interface SoaEntryData {
  id: string;
  requirement_id: string;
  implementation_status: string;
  is_applicable: boolean;
  compliance_status: string;
}

export interface ControlMappingData {
  requirement_id: string;
  control_id: string;
  control_code: string;
  control_name: string;
  control_status: string;
  coverage_percentage: number;
  compliance_status: string;
}

interface Props {
  framework: FrameworkData;
  requirements: RequirementData[];
  soaEntries: SoaEntryData[];
  controlMappings?: ControlMappingData[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const IMPL_STATUS_OPTIONS = [
  {
    value: 'implemented',
    label: 'Implementado',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  {
    value: 'partially_implemented',
    label: 'Parcial',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
  },
  {
    value: 'not_implemented',
    label: 'No implementado',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    dot: 'bg-rose-500',
  },
  {
    value: 'not_applicable',
    label: 'No aplica',
    color: 'text-slate-500 bg-slate-100 border-slate-200',
    dot: 'bg-slate-400',
  },
  {
    value: 'not_assessed',
    label: 'No evaluado',
    color: 'text-slate-500 bg-slate-50 border-slate-200',
    dot: 'bg-slate-300',
  },
] as const;

type ImplStatus = (typeof IMPL_STATUS_OPTIONS)[number]['value'];

const DOMAIN_NAMES: Record<string, string> = {
  'A.5': 'Controles organizativos',
  'A.6': 'Controles de personas',
  'A.7': 'Controles fisicos',
  'A.8': 'Controles tecnologicos',
  '4': 'Contexto de la organizacion',
  '5': 'Liderazgo',
  '6': 'Planificacion',
  '7': 'Soporte',
  '8': 'Operacion',
  '9': 'Evaluacion del desempeno',
  '10': 'Mejora',
};

const FILTER_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'implemented', label: 'Implementado' },
  { value: 'partially_implemented', label: 'Parcial' },
  { value: 'not_implemented', label: 'No implementado' },
  { value: 'not_assessed', label: 'No evaluado' },
  { value: 'not_applicable', label: 'No aplica' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusMeta(status: string) {
  return (
    IMPL_STATUS_OPTIONS.find((o) => o.value === status) ??
    IMPL_STATUS_OPTIONS[4] // not_assessed fallback
  );
}

function getDomainKey(code: string): string {
  const parts = code.split('.');
  if (parts[0] === 'A' && parts.length >= 2) {
    return `A.${parts[1]}`;
  }
  return parts[0] ?? 'General';
}

function getDomainName(key: string): string {
  return DOMAIN_NAMES[key] ?? key;
}

function complianceColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 60) return 'text-amber-500';
  return 'text-rose-500';
}

function complianceBg(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

// ─── Row state management ─────────────────────────────────────────────────────

interface RowState {
  implementation_status: string;
  is_applicable: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full ${meta.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// ─── Inline status select ─────────────────────────────────────────────────────

interface InlineSelectProps {
  entryId: string | null;
  requirementId: string;
  status: string;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onChange: (reqId: string, value: string) => void;
}

function InlineStatusSelect({
  entryId,
  status,
  saving,
  saved,
  error,
  onChange,
  requirementId,
}: InlineSelectProps) {
  const meta = getStatusMeta(status);
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <select
          value={status}
          onChange={(e) => onChange(requirementId, e.target.value)}
          disabled={saving || !entryId}
          title={!entryId ? 'Sin entrada SOA asociada' : undefined}
          className={`appearance-none pl-2.5 pr-7 py-1 text-xs font-medium border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${meta.color}`}
          aria-label="Estado de implementacion"
        >
          {IMPL_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
      </div>
      {saving && <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin flex-shrink-0" />}
      {saved && !saving && <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
      {error && !saving && (
        <span title={error}><AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" /></span>
      )}
    </div>
  );
}

// ─── Domain Section ───────────────────────────────────────────────────────────

interface DomainRequirement extends RequirementData {
  soaEntry: SoaEntryData | undefined;
  rowState: RowState;
  mappedControls: ControlMappingData[];
}

interface DomainSectionProps {
  domainKey: string;
  requirements: DomainRequirement[];
  onStatusChange: (reqId: string, value: string) => void;
}

function RequirementRow({
  req,
  onStatusChange,
}: {
  req: DomainRequirement;
  onStatusChange: (reqId: string, value: string) => void;
}) {
  const [showControls, setShowControls] = useState(false);
  const controlCount = req.mappedControls.length;

  return (
    <div className="hover:bg-slate-50/70 transition-colors">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="font-mono text-xs font-semibold text-sky-600 w-20 flex-shrink-0 mt-0.5">
          {req.code}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 leading-snug">{req.title}</p>
          {req.description && (
            <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{req.description}</p>
          )}
          {controlCount > 0 && (
            <button
              type="button"
              onClick={() => setShowControls((p) => !p)}
              className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 text-[11px] font-medium rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <Link2 className="w-3 h-3" />
              {controlCount} {controlCount === 1 ? 'control' : 'controles'}
              <ChevronDown className={`w-3 h-3 transition-transform ${showControls ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <div className="flex-shrink-0 mt-0.5">
          <InlineStatusSelect
            entryId={req.soaEntry?.id ?? null}
            requirementId={req.id}
            status={req.rowState.implementation_status}
            saving={req.rowState.saving}
            saved={req.rowState.saved}
            error={req.rowState.error}
            onChange={onStatusChange}
          />
        </div>
      </div>

      {showControls && controlCount > 0 && (
        <div className="px-4 pb-3 pl-[5.5rem]">
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 overflow-hidden">
            {req.mappedControls.map((ctrl) => (
              <Link
                key={ctrl.control_id}
                href={`/controls/${ctrl.control_id}`}
                className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-white transition-colors border-b border-slate-200 last:border-0"
              >
                <span className="font-mono font-semibold text-sky-600 w-20 flex-shrink-0">
                  {ctrl.control_code}
                </span>
                <span className="flex-1 text-slate-700 truncate">{ctrl.control_name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  ctrl.control_status === 'implemented' ? 'bg-emerald-100 text-emerald-700' :
                  ctrl.control_status === 'partially_implemented' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {ctrl.control_status === 'implemented' ? 'OK' :
                   ctrl.control_status === 'partially_implemented' ? 'Parcial' :
                   ctrl.control_status === 'not_implemented' ? 'Pendiente' : ctrl.control_status}
                </span>
                <span className="font-mono text-slate-500 w-8 text-right flex-shrink-0">
                  {ctrl.coverage_percentage}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DomainSection({ domainKey, requirements, onStatusChange }: DomainSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const implemented = requirements.filter(
    (r) => r.rowState.implementation_status === 'implemented',
  ).length;
  const partial = requirements.filter(
    (r) => r.rowState.implementation_status === 'partially_implemented',
  ).length;
  const notImpl = requirements.filter(
    (r) => r.rowState.implementation_status === 'not_implemented',
  ).length;
  const notApplicable = requirements.filter(
    (r) =>
      r.rowState.implementation_status === 'not_applicable' || !r.rowState.is_applicable,
  ).length;
  const applicable = requirements.length - notApplicable;
  const pct =
    applicable > 0
      ? Math.round(((implemented + partial * 0.5) / applicable) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Domain header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}

        {/* Domain info */}
        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm font-semibold text-sky-600">{domainKey}</span>
          <span className="text-sm font-semibold text-slate-700">{getDomainName(domainKey)}</span>
          <span className="text-xs text-slate-400">
            {requirements.length} controles
          </span>
        </div>

        {/* Domain progress bar (mini) */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(implemented / requirements.length) * 100}%` }}
            />
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${(partial / requirements.length) * 100}%` }}
            />
            <div
              className="h-full bg-rose-400 transition-all"
              style={{ width: `${(notImpl / requirements.length) * 100}%` }}
            />
          </div>
          <span className={`text-xs font-semibold w-8 text-right ${complianceColor(pct)}`}>
            {pct}%
          </span>
        </div>

        {/* Colored dot summary */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          {implemented > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-600">
              <StatusDot status="implemented" />
              {implemented}
            </span>
          )}
          {partial > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 ml-1">
              <StatusDot status="partially_implemented" />
              {partial}
            </span>
          )}
          {notImpl > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-rose-600 ml-1">
              <StatusDot status="not_implemented" />
              {notImpl}
            </span>
          )}
        </div>
      </button>

      {/* Controls list */}
      {expanded && (
        <div className="divide-y divide-slate-100">
          {requirements.map((req) => (
            <RequirementRow key={req.id} req={req} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function FrameworkDetailClient({ framework, requirements, soaEntries, controlMappings = [] }: Props) {
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');

  // Group control mappings by requirement_id for fast lookup
  const controlsByRequirement = useMemo(() => {
    const map = new Map<string, ControlMappingData[]>();
    for (const m of controlMappings) {
      if (!map.has(m.requirement_id)) map.set(m.requirement_id, []);
      map.get(m.requirement_id)!.push(m);
    }
    return map;
  }, [controlMappings]);

  // Build initial row states from SOA entries
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(() => {
    const soaMap = new Map(soaEntries.map((e) => [e.requirement_id, e]));
    const init: Record<string, RowState> = {};
    for (const req of requirements) {
      const entry = soaMap.get(req.id);
      init[req.id] = {
        implementation_status: entry?.implementation_status ?? 'not_assessed',
        is_applicable: entry?.is_applicable ?? true,
        saving: false,
        saved: false,
        error: null,
      };
    }
    return init;
  });

  // SOA entry lookup map (requirement_id -> entry)
  const soaMap = useMemo(
    () => new Map(soaEntries.map((e) => [e.requirement_id, e])),
    [soaEntries],
  );

  // Status change handler with auto-save
  const handleStatusChange = useCallback(
    (requirementId: string, value: string) => {
      const soaEntry = soaMap.get(requirementId);
      if (!soaEntry) return; // no entry to update

      const newApplicable = value !== 'not_applicable';
      setRowStates((prev) => ({
        ...prev,
        [requirementId]: {
          ...prev[requirementId],
          implementation_status: value,
          is_applicable: newApplicable,
          saving: true,
          saved: false,
          error: null,
        },
      }));

      const fd = new FormData();
      fd.set('implementation_status', value);
      fd.set('is_applicable', String(newApplicable));
      fd.set('justification', '');
      fd.set('notes', '');

      startTransition(async () => {
        const result = await updateSoaEntry(soaEntry.id, fd);
        setRowStates((prev) => ({
          ...prev,
          [requirementId]: {
            ...prev[requirementId],
            saving: false,
            saved: !result.error,
            error: result.error ?? null,
          },
        }));
        if (!result.error) {
          setTimeout(() => {
            setRowStates((prev) => ({
              ...prev,
              [requirementId]: { ...prev[requirementId], saved: false },
            }));
          }, 2000);
        }
      });
    },
    [soaMap, startTransition],
  );

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = requirements.length;
    let implemented = 0;
    let partial = 0;
    let notImpl = 0;
    let notApplicable = 0;

    for (const req of requirements) {
      const s = rowStates[req.id]?.implementation_status ?? 'not_assessed';
      const applicable = rowStates[req.id]?.is_applicable ?? true;
      if (!applicable || s === 'not_applicable') {
        notApplicable++;
      } else if (s === 'implemented') {
        implemented++;
      } else if (s === 'partially_implemented') {
        partial++;
      } else if (s === 'not_implemented') {
        notImpl++;
      }
    }

    const applicable = total - notApplicable;
    const pct =
      applicable > 0
        ? Math.round(((implemented + partial * 0.5) / applicable) * 100)
        : 0;
    const notEvaluated =
      total - implemented - partial - notImpl - notApplicable;

    return { total, implemented, partial, notImpl, notApplicable, notEvaluated, pct, applicable };
  }, [requirements, rowStates]);

  // ── Domain grouping ──────────────────────────────────────────────────────
  const domains = useMemo(() => {
    const map = new Map<string, RequirementData[]>();
    for (const req of requirements) {
      const key = getDomainKey(req.code);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(req);
    }
    return map;
  }, [requirements]);

  const domainKeys = useMemo(() => Array.from(domains.keys()).sort(), [domains]);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requirements.filter((req) => {
      if (q && !req.code.toLowerCase().includes(q) && !req.title.toLowerCase().includes(q))
        return false;
      const status = rowStates[req.id]?.implementation_status ?? 'not_assessed';
      if (filterStatus !== 'all' && status !== filterStatus) return false;
      if (filterDomain !== 'all' && getDomainKey(req.code) !== filterDomain) return false;
      return true;
    });
  }, [requirements, rowStates, search, filterStatus, filterDomain]);

  // Group filtered requirements by domain
  const filteredByDomain = useMemo(() => {
    const map = new Map<string, DomainRequirement[]>();
    for (const req of filtered) {
      const key = getDomainKey(req.code);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        ...req,
        soaEntry: soaMap.get(req.id),
        rowState: rowStates[req.id] ?? {
          implementation_status: 'not_assessed',
          is_applicable: true,
          saving: false,
          saved: false,
          error: null,
        },
        mappedControls: controlsByRequirement.get(req.id) ?? [],
      });
    }
    return map;
  }, [filtered, soaMap, rowStates, controlsByRequirement]);

  const filteredDomainKeys = useMemo(
    () => Array.from(filteredByDomain.keys()).sort(),
    [filteredByDomain],
  );

  // ── Progress bar widths ──────────────────────────────────────────────────
  const barWidths = useMemo(() => {
    const total = stats.total || 1;
    return {
      implemented: (stats.implemented / total) * 100,
      partial: (stats.partial / total) * 100,
      notImpl: (stats.notImpl / total) * 100,
      notApplicable: (stats.notApplicable / total) * 100,
    };
  }, [stats]);

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-sky-500 flex-shrink-0" />
              <h1 className="text-2xl font-bold text-sky-600 leading-tight">{framework.name}</h1>
              {framework.version && (
                <span className="text-sm font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                  {framework.version}
                </span>
              )}
            </div>
            {framework.description && (
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                {framework.description}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {stats.total} controles totales · {stats.applicable} aplicables
            </p>
          </div>

          {/* Compliance % */}
          <div className="flex-shrink-0 text-center">
            <p className={`text-5xl font-bold tabular-nums ${complianceColor(stats.pct)}`}>
              {stats.pct}%
            </p>
            <p className="text-xs text-slate-400 mt-1">cumplimiento</p>
          </div>
        </div>
      </div>

      {/* ── KPI Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Total controles" value={stats.total} colorClass="text-slate-700" />
        <KpiCard
          label="Aplicables"
          value={stats.applicable}
          colorClass="text-sky-600"
          bgClass="bg-sky-50 border-sky-200"
        />
        <KpiCard
          label="Implementados"
          value={stats.implemented}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50 border-emerald-200"
        />
        <KpiCard
          label="Parciales"
          value={stats.partial}
          colorClass="text-amber-600"
          bgClass="bg-amber-50 border-amber-200"
        />
        <KpiCard
          label="No implementados"
          value={stats.notImpl}
          colorClass="text-rose-600"
          bgClass="bg-rose-50 border-rose-200"
        />
      </div>

      {/* ── Progress Bar ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Estado de implementacion
          </p>
          <span className={`text-sm font-bold ${complianceColor(stats.pct)}`}>
            {stats.pct}%
          </span>
        </div>

        {/* Stacked bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${barWidths.implemented}%` }}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${barWidths.partial}%` }}
          />
          <div
            className="h-full bg-rose-400 transition-all duration-500"
            style={{ width: `${barWidths.notImpl}%` }}
          />
          <div
            className="h-full bg-slate-200 transition-all duration-500"
            style={{ width: `${barWidths.notApplicable}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
          <LegendItem dot="bg-emerald-500" label="Implementado" count={stats.implemented} />
          <LegendItem dot="bg-amber-500" label="Parcial" count={stats.partial} />
          <LegendItem dot="bg-rose-400" label="No implementado" count={stats.notImpl} />
          <LegendItem dot="bg-slate-200" label="No aplica" count={stats.notApplicable} />
          {stats.notEvaluated > 0 && (
            <LegendItem dot="bg-slate-300" label="No evaluado" count={stats.notEvaluated} />
          )}
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar control por codigo o nombre..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            aria-label="Buscar controles"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
            aria-label="Filtrar por estado"
          >
            {FILTER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Domain filter */}
        <div className="relative">
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
            aria-label="Filtrar por dominio"
          >
            <option value="all">Todos los dominios</option>
            {domainKeys.map((key) => (
              <option key={key} value={key}>
                {key} - {getDomainName(key)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} de {requirements.length} controles
        </span>
      </div>

      {/* ── Domain Sections ───────────────────────────────────────────────── */}
      {filteredDomainKeys.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-slate-400">
            No hay controles que coincidan con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDomainKeys.map((key) => (
            <DomainSection
              key={key}
              domainKey={key}
              requirements={filteredByDomain.get(key) ?? []}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Small helper sub-components ─────────────────────────────────────────────

function KpiCard({
  label,
  value,
  colorClass,
  bgClass = 'bg-white border-slate-200',
}: {
  label: string;
  value: number;
  colorClass: string;
  bgClass?: string;
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${bgClass}`}>
      <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function LegendItem({
  dot,
  label,
  count,
}: {
  dot: string;
  label: string;
  count: number;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${dot}`} />
      {label}
      <span className="font-semibold text-slate-600">({count})</span>
    </span>
  );
}
