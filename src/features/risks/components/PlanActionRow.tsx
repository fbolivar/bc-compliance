'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Circle, Clock, XCircle, Loader2 } from 'lucide-react';
import { updateActionStatus } from '../actions/treatmentPlanActions';

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pendiente',    icon: Circle,       color: 'text-slate-400' },
  { value: 'in_progress', label: 'En progreso',  icon: Clock,        color: 'text-amber-500' },
  { value: 'completed',   label: 'Completada',   icon: CheckCircle2, color: 'text-emerald-500' },
  { value: 'cancelled',   label: 'Cancelada',    icon: XCircle,      color: 'text-slate-300' },
];

interface Props {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  notes: string | null;
  sortOrder: number;
}

export function PlanActionRow({ id, title, description, status: initialStatus, dueDate, notes }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [open, setOpen] = useState(false);
  const [isPending, start] = useTransition();

  const current = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  const Icon = current.icon;
  const isOverdue = dueDate && status !== 'completed' && status !== 'cancelled'
    && new Date(dueDate) < new Date();

  function handleSelect(newStatus: string) {
    setOpen(false);
    if (newStatus === status) return;
    start(async () => {
      const res = await updateActionStatus(id, newStatus);
      if (res.ok) setStatus(newStatus);
    });
  }

  return (
    <div className={`flex items-start gap-3 py-3 px-4 rounded-lg border transition-colors ${
      status === 'completed' ? 'bg-emerald-50/50 border-emerald-100' :
      status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' :
      'bg-white border-slate-100'
    }`}>
      {/* Status toggle */}
      <div className="relative flex-shrink-0 mt-0.5">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={isPending}
          className={`flex items-center justify-center w-5 h-5 rounded-full hover:opacity-80 transition-opacity ${current.color}`}
          title="Cambiar estado"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Icon className="w-5 h-5" />}
        </button>
        {open && (
          <div className="absolute left-0 top-6 z-10 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-36">
            {STATUS_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
                    opt.value === status ? 'font-semibold text-slate-800' : 'text-slate-600'
                  }`}
                >
                  <OptIcon className={`w-3.5 h-3.5 ${opt.color}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {title}
        </p>
        {description && description !== title && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{description}</p>
        )}
        {notes && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{notes}</p>
        )}
      </div>

      {/* Due date */}
      {dueDate && (
        <span className={`text-[11px] flex-shrink-0 font-medium px-2 py-0.5 rounded-md ${
          isOverdue ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'text-slate-400'
        }`}>
          {new Date(dueDate).toLocaleDateString('es-CO', { dateStyle: 'short' })}
        </span>
      )}
    </div>
  );
}
