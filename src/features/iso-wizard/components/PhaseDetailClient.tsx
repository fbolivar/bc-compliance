'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Circle, Clock, ChevronDown, ExternalLink } from 'lucide-react';
import { updateTaskStatus, updateTaskNotes } from '../actions/wizardActions';
import type { WizardPhase, WizardTask, TaskStatus } from '../lib/wizard-config';
import type { WizardPhaseWithTasks, WizardTaskRow } from '../services/wizardService';

const STATUS_CYCLE: TaskStatus[] = ['pending', 'in_progress', 'completed'];

function TaskStatusButton({
  status,
  onClick,
  disabled,
}: {
  status: TaskStatus;
  onClick: () => void;
  disabled: boolean;
}) {
  if (status === 'completed') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label="Marcar como pendiente"
        className="text-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
      >
        <CheckCircle2 className="w-5 h-5" />
      </button>
    );
  }
  if (status === 'in_progress') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label="Marcar como completada"
        className="text-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50"
      >
        <Clock className="w-5 h-5" />
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Marcar como en progreso"
      className="text-slate-300 hover:text-slate-400 transition-colors disabled:opacity-50"
    >
      <Circle className="w-5 h-5" />
    </button>
  );
}

interface TaskRowProps {
  taskDef: WizardTask;
  taskRow: WizardTaskRow | undefined;
  phaseNumber: number;
}

function TaskRow({ taskDef, taskRow, phaseNumber }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(taskRow?.notes ?? '');
  const [evidenceUrl, setEvidenceUrl] = useState(taskRow?.evidence_url ?? '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentStatus = (taskRow?.status ?? 'pending') as TaskStatus;
  const isNA = currentStatus === 'not_applicable';

  function cycleStatus() {
    if (!taskRow) return;
    const idx = STATUS_CYCLE.indexOf(currentStatus);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    startTransition(async () => {
      await updateTaskStatus(taskRow.id, next, phaseNumber);
    });
  }

  async function saveNotes() {
    if (!taskRow) return;
    setSavingNotes(true);
    await updateTaskNotes(taskRow.id, notes, evidenceUrl || null, phaseNumber);
    setSavingNotes(false);
  }

  const isCompleted = currentStatus === 'completed';

  return (
    <div
      className={`border rounded-lg transition-colors ${
        isCompleted ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <TaskStatusButton status={currentStatus} onClick={cycleStatus} disabled={isPending || isNA} />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
            }`}
          >
            {taskDef.label}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">ISO {taskDef.isoClause}</p>
        </div>
        {taskRow?.evidence_url && (
          <a
            href={taskRow.evidence_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 hover:text-sky-600 shrink-0"
            title="Ver evidencia"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Colapsar detalles' : 'Expandir detalles'}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">{taskDef.description}</p>
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de implementacion..."
              rows={2}
              aria-label="Notas de implementacion"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="URL de evidencia (opcional)"
              aria-label="URL de evidencia"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {savingNotes ? 'Guardando...' : 'Guardar notas'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  phaseDef: WizardPhase;
  phaseData: WizardPhaseWithTasks;
  phaseNumber: number;
}

export function PhaseDetailClient({ phaseDef, phaseData, phaseNumber }: Props) {
  const taskMap = new Map(phaseData.tasks.map((t) => [t.task_key, t]));
  const completedCount = phaseData.tasks.filter((t) => t.status === 'completed').length;
  const totalCount = phaseData.tasks.filter((t) => t.status !== 'not_applicable').length;

  return (
    <div className="space-y-4">
      {/* Phase progress header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-500">
            {completedCount} de {totalCount} tareas completadas
          </span>
          <span className="text-sm font-bold text-slate-700">{phaseData.completion_pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${phaseData.completion_pct}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Haz clic en el icono de estado para avanzar: pendiente &rarr; en progreso &rarr; completada
        </p>
      </div>

      {/* Task list */}
      <div className="space-y-2" role="list" aria-label={`Tareas de la fase ${phaseNumber}`}>
        {phaseDef.tasks.map((taskDef) => (
          <div key={taskDef.key} role="listitem">
            <TaskRow
              taskDef={taskDef}
              taskRow={taskMap.get(taskDef.key)}
              phaseNumber={phaseNumber}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
