'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, ArrowRight, ClipboardCheck } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import {
  approveSoaChange,
  rejectSoaChange,
} from '@/features/compliance/actions/soaApprovalActions';

interface PendingItem {
  id: string;
  requirement_code: string;
  requirement_name: string;
  framework_name: string;
  current_status: string;
  proposed_status: string;
  current_compliance: string;
  proposed_compliance: string;
  proposed_justification: string | null;
  proposed_at: string | null;
}

interface Props { items: PendingItem[]; }

export function SoaApprovalsClient({ items }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setActingId(id);
    startTransition(async () => {
      const res = await approveSoaChange(id);
      setActingId(null);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt('Motivo del rechazo:');
    if (!reason || !reason.trim()) return;
    setActingId(id);
    startTransition(async () => {
      const res = await rejectSoaChange(id, reason.trim());
      setActingId(null);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">No hay cambios pendientes</p>
          <p className="text-sm text-slate-500 mt-1">
            Todos los cambios al SOA han sido revisados y aprobados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {it.framework_name}
                    </span>
                    <span className="font-mono text-xs text-sky-600">{it.requirement_code}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{it.requirement_name}</p>

                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 uppercase">De:</span>
                      <StatusBadge status={it.current_status} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-amber-600 uppercase font-semibold">A:</span>
                      <StatusBadge status={it.proposed_status} />
                    </div>
                  </div>

                  {it.proposed_justification && (
                    <div className="mt-3 px-3 py-2 rounded-md bg-white border border-amber-200">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-1">
                        Justificación propuesta
                      </p>
                      <p className="text-sm text-slate-700">{it.proposed_justification}</p>
                    </div>
                  )}

                  {it.proposed_at && (
                    <p className="text-[11px] text-slate-400 mt-2">
                      Propuesto: {new Date(it.proposed_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(it.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {actingId === it.id && pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(it.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
