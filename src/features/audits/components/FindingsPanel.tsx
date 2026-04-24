'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Plus, X, CheckSquare, Shield, FileWarning,
  Loader2, Trash2, ChevronDown,
} from 'lucide-react';
import { createFinding, deleteFinding, updateFindingStatus } from '../actions/auditActions';
import type { EnrichedAuditFinding } from '../services/auditService';

const SEVERITY_OPTIONS = [
  { value: 'critical',    label: 'Crítico',       color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'major',       label: 'Mayor',         color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'minor',       label: 'Menor',         color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'observation', label: 'Observación',   color: 'bg-sky-100 text-sky-700 border-sky-200' },
];

const STATUS_OPTIONS = [
  { value: 'open',          label: 'Abierto' },
  { value: 'action_planned',label: 'Plan definido' },
  { value: 'in_remediation',label: 'En remediación' },
  { value: 'closed',        label: 'Cerrado' },
  { value: 'accepted',      label: 'Aceptado' },
];

function severityStyle(s: string) {
  return SEVERITY_OPTIONS.find((o) => o.value === s)?.color ?? 'bg-slate-100 text-slate-600 border-slate-200';
}

interface Props {
  auditId: string;
  findings: EnrichedAuditFinding[];
}

export function FindingsPanel({ auditId, findings: initial }: Props) {
  const [findings, setFindings] = useState(initial);
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await createFinding(auditId, fd);
      if (res.error) { setFormError(res.error); return; }
      setIsOpen(false);
      form.reset();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este hallazgo?')) return;
    start(async () => {
      await deleteFinding(id, auditId);
      setFindings((prev) => prev.filter((f) => f.id !== id));
    });
  }

  function handleStatusChange(findingId: string, newStatus: string) {
    start(async () => {
      const res = await updateFindingStatus(findingId, newStatus, auditId);
      if (!res.error) {
        setFindings((prev) => prev.map((f) => f.id === findingId ? { ...f, status: newStatus } : f));
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Hallazgos</h2>
          <span className="text-xs text-slate-400">({findings.length})</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo hallazgo
        </button>
      </div>

      {/* Findings list */}
      {findings.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">No hay hallazgos registrados para esta auditoría.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {findings.map((finding) => (
            <FindingRow
              key={finding.id}
              finding={finding}
              onDelete={() => handleDelete(finding.id)}
              onStatusChange={(s) => handleStatusChange(finding.id, s)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">Nuevo Hallazgo</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Código *</label>
                  <input
                    name="code"
                    required
                    placeholder="H-001"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Severidad</label>
                  <select
                    name="severity"
                    defaultValue="minor"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {SEVERITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
                <input
                  name="title"
                  required
                  placeholder="Descripción breve del hallazgo"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cláusula / Referencia</label>
                <input
                  name="clause_reference"
                  placeholder="Ej. ISO 27001 A.8.1.1"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Detalle del hallazgo..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Recomendación del auditor</label>
                <textarea
                  name="auditor_recommendation"
                  rows={2}
                  placeholder="Acción recomendada..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha límite de respuesta</label>
                <input
                  name="response_due_date"
                  type="date"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {formError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Guardar hallazgo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Single finding row ────────────────────────────────────────────────────────

function FindingRow({
  finding,
  onDelete,
  onStatusChange,
}: {
  finding: EnrichedAuditFinding;
  onDelete: () => void;
  onStatusChange: (s: string) => void;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const currentStatus = STATUS_OPTIONS.find((o) => o.value === finding.status);

  return (
    <div className="px-6 py-4 hover:bg-slate-50/50 transition-colors group">
      <div className="flex items-start gap-4">
        <span className="font-mono text-xs font-semibold text-sky-600 w-20 flex-shrink-0">{finding.code}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700">{finding.title}</p>
          {finding.description && (
            <p className="text-xs text-slate-500 mt-0.5">{finding.description}</p>
          )}
          {finding.clause_reference && (
            <p className="text-[11px] text-slate-400 mt-1">
              Cláusula: <span className="font-mono">{finding.clause_reference}</span>
            </p>
          )}
          {(finding.requirement_code || finding.control_code || finding.nonconformity_code) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {finding.requirement_code && (
                <Link href="/compliance" className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  <CheckSquare className="w-3 h-3" />
                  {finding.requirement_framework ? `${finding.requirement_framework}: ` : ''}{finding.requirement_code}
                </Link>
              )}
              {finding.control_code && (
                <Link href="/controls" className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors">
                  <Shield className="w-3 h-3" />
                  {finding.control_code}
                </Link>
              )}
              {finding.nonconformity_code && (
                <Link href="/nonconformities" className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">
                  <FileWarning className="w-3 h-3" />
                  {finding.nonconformity_code}
                </Link>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Severity badge */}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${severityStyle(finding.severity)}`}>
            {SEVERITY_OPTIONS.find((o) => o.value === finding.severity)?.label ?? finding.severity}
          </span>

          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusOpen((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 px-2 py-0.5 rounded border border-slate-200 hover:border-slate-300 transition-colors"
            >
              {currentStatus?.label ?? finding.status}
              <ChevronDown className="w-3 h-3" />
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-7 z-10 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-36">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusOpen(false); onStatusChange(opt.value); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${opt.value === finding.status ? 'font-semibold text-slate-800' : 'text-slate-600'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1 rounded"
            aria-label="Eliminar hallazgo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {finding.auditor_recommendation && (
        <p className="mt-2 ml-24 text-xs text-slate-600 bg-slate-50 rounded-md p-2 border border-slate-100">
          <span className="font-semibold text-slate-500">Recomendación: </span>
          {finding.auditor_recommendation}
        </p>
      )}
      {finding.response_due_date && (
        <p className="mt-1 ml-24 text-[11px] text-amber-600">
          Respuesta debida: {new Date(finding.response_due_date).toLocaleDateString('es-CO')}
        </p>
      )}
    </div>
  );
}
