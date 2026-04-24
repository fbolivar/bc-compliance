'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { updatePlanStatus } from '../actions/treatmentPlanActions';

const OPTIONS = [
  { value: 'draft',       label: 'Borrador',    color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'approved',    label: 'Aprobado',    color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'in_progress', label: 'En progreso', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'completed',   label: 'Completado',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'cancelled',   label: 'Cancelado',   color: 'bg-rose-50 text-rose-600 border-rose-200' },
];

export function PlanStatusChanger({ planId, status: initial }: { planId: string; status: string }) {
  const [status, setStatus] = useState(initial);
  const [open, setOpen] = useState(false);
  const [isPending, start] = useTransition();

  const current = OPTIONS.find((o) => o.value === status) ?? OPTIONS[0];

  function select(v: string) {
    setOpen(false);
    if (v === status) return;
    start(async () => {
      const res = await updatePlanStatus(planId, v);
      if (res.ok) setStatus(v);
    });
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${current.color}`}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {current.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-10 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-40">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => select(opt.value)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
                opt.value === status ? 'font-semibold text-slate-800' : 'text-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
