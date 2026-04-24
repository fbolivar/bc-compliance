'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, X, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { createVendorAssessment } from '../actions/vendorAssessmentActions';
import { computeAssessmentScore, type QuestionnaireResponses } from '../lib/assessmentHelpers';
import type { VendorAssessmentRow } from '../services/vendorService';

// ── Questionnaire definition ────────────────────────────────────────────────

const POSITIVE_QUESTIONS: { id: keyof QuestionnaireResponses; label: string; hint?: string }[] = [
  { id: 'iso27001',       label: '¿Tiene certificación ISO 27001 vigente?', hint: 'Certificación activa con auditor externo acreditado' },
  { id: 'soc2',           label: '¿Cuenta con SOC 2 Type II o equivalente?', hint: 'ISAE 3402, SOC 2 Type II, u otro informe de aseguramiento' },
  { id: 'dpa',            label: '¿Ha firmado Acuerdo de Tratamiento de Datos (DPA/NDA)?', hint: 'Exigido por Ley 1581 de 2012 y SFC para proveedores con acceso a datos personales' },
  { id: 'pentest',        label: '¿Realiza pruebas de penetración al menos una vez al año?', hint: 'Pentest o ethical hacking por empresa independiente' },
  { id: 'bcp',            label: '¿Tiene Plan de Continuidad del Negocio (BCP/DRP)?', hint: 'Plan documentado, probado y actualizado' },
  { id: 'access_controls',label: '¿Tiene controles de acceso lógico documentados y auditables?', hint: 'MFA, gestión de privilegios, revisión periódica de accesos' },
  { id: 'training',       label: '¿Su personal recibe capacitación en seguridad de la información?', hint: 'Al menos una vez al año, con registro de asistencia' },
  { id: 'incident_policy',label: '¿Tiene política de gestión de incidentes documentada?', hint: 'Procedimiento de notificación, escalado y cierre de incidentes' },
];

const RISK_QUESTIONS: { id: keyof QuestionnaireResponses; label: string; hint?: string }[] = [
  { id: 'had_incidents',         label: '¿Ha tenido incidentes de seguridad en los últimos 12 meses?', hint: 'Brechas, ransomware, accesos no autorizados, etc.' },
  { id: 'subcontracts_unvetted', label: '¿Subcontrata servicios críticos sin evaluación previa de riesgos?', hint: 'Cuartos y cuartos sin cláusulas de seguridad equivalentes' },
];

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low:      { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Bajo' },
  medium:   { bg: 'bg-yellow-100',  text: 'text-yellow-700',  label: 'Moderado' },
  high:     { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Alto' },
  critical: { bg: 'bg-rose-100',    text: 'text-rose-700',    label: 'Crítico' },
};

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  vendorId: string;
  assessments: VendorAssessmentRow[];
}

type QState = Partial<Record<keyof QuestionnaireResponses, boolean>>;

export function VendorAssessmentPanel({ vendorId, assessments: initial }: Props) {
  const [assessments, setAssessments] = useState(initial);
  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState<QState>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const router = useRouter();

  const allAnswered = [...POSITIVE_QUESTIONS, ...RISK_QUESTIONS].every((q) => q.id in answers);

  const liveQ = allAnswered ? (answers as QuestionnaireResponses) : null;
  const liveScore = liveQ ? computeAssessmentScore(liveQ) : null;
  const liveRisk = liveScore !== null
    ? (liveScore >= 80 ? 'low' : liveScore >= 60 ? 'medium' : liveScore >= 40 ? 'high' : 'critical')
    : null;

  function toggle(id: keyof QuestionnaireResponses, val: boolean) {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  }

  function handleOpen() { setIsOpen(true); setAnswers({}); setFormError(null); }
  function handleClose() { setIsOpen(false); setAnswers({}); setFormError(null); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!allAnswered) { setFormError('Responde todas las preguntas antes de guardar.'); return; }
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    for (const [k, v] of Object.entries(answers)) fd.set(k, String(v));
    start(async () => {
      const res = await createVendorAssessment(vendorId, fd);
      if (!res.ok) { setFormError(res.error ?? 'Error desconocido'); return; }
      handleClose();
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Evaluaciones de Riesgo</h2>
          <span className="text-xs text-slate-400 ml-1">({assessments.length})</span>
        </div>
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva evaluación
        </button>
      </div>

      {/* History */}
      {assessments.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">No hay evaluaciones registradas para este proveedor.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                {['Fecha', 'Score', 'Nivel de Riesgo', 'Próxima Eval.', 'Notas'].map((h) => (
                  <th key={h} className="px-6 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map((a) => {
                const rc = RISK_COLORS[a.risk_level ?? ''] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: a.risk_level ?? '—' };
                return (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {new Date(a.assessment_date).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-3">
                      <ScoreBar score={a.overall_score} />
                    </td>
                    <td className="px-6 py-3">
                      {a.risk_level ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${rc.bg} ${rc.text}`}>
                          {rc.label}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {a.next_assessment_date ? new Date(a.next_assessment_date).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate">{a.notes ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Nueva Evaluación de Riesgo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cuestionario de seguridad — 10 preguntas</p>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de evaluación</label>
                  <input type="date" name="assessment_date" defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Próxima evaluación</label>
                  <input type="date" name="next_assessment_date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              {/* Positive controls */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Controles de Seguridad</h4>
                </div>
                <div className="space-y-2">
                  {POSITIVE_QUESTIONS.map((q) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      value={answers[q.id]}
                      onToggle={(v) => toggle(q.id, v)}
                    />
                  ))}
                </div>
              </div>

              {/* Risk factors */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Factores de Riesgo</h4>
                </div>
                <div className="space-y-2">
                  {RISK_QUESTIONS.map((q) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      value={answers[q.id]}
                      onToggle={(v) => toggle(q.id, v)}
                      isRisk
                    />
                  ))}
                </div>
              </div>

              {/* Live score preview */}
              {liveScore !== null && liveRisk && (
                <div className={`rounded-xl p-4 border ${RISK_COLORS[liveRisk].bg} border-opacity-50`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Score calculado</p>
                      <p className={`text-2xl font-bold ${RISK_COLORS[liveRisk].text}`}>{liveScore}/100</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-600 mb-1">Nivel de riesgo</p>
                      <span className={`text-sm font-bold ${RISK_COLORS[liveRisk].text}`}>
                        {RISK_COLORS[liveRisk].label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 bg-white/60 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        liveScore >= 80 ? 'bg-emerald-500' : liveScore >= 60 ? 'bg-yellow-400' : liveScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${liveScore}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones</label>
                <textarea name="notes" rows={2} placeholder="Hallazgos, compromisos del proveedor, evidencias revisadas..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>

              {formError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !allAnswered}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Guardar evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QuestionRow({
  question,
  value,
  onToggle,
  isRisk = false,
}: {
  question: { id: string; label: string; hint?: string };
  value: boolean | undefined;
  onToggle: (v: boolean) => void;
  isRisk?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 transition-colors ${
      value === true
        ? isRisk ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
        : value === false
          ? isRisk ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
          : 'bg-slate-50 border-slate-200'
    }`}>
      <p className="text-xs font-medium text-slate-700 mb-2">{question.label}</p>
      {question.hint && <p className="text-[11px] text-slate-400 mb-2">{question.hint}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
            value === true
              ? isRisk ? 'bg-rose-500 text-white border-rose-500' : 'bg-emerald-500 text-white border-emerald-500'
              : 'text-slate-500 border-slate-300 hover:border-slate-400'
          }`}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
            value === false
              ? isRisk ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-rose-500 text-white border-rose-500'
              : 'text-slate-500 border-slate-300 hover:border-slate-400'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-300 text-xs">—</span>;
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-400' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-slate-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-600">{score}</span>
    </div>
  );
}
