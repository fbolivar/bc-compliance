'use client';

import { useTransition, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { approvePolicy } from '../actions/policyActions';

interface Props {
  policyId: string;
  status: string;
}

export function PolicyApproveButton({ policyId, status }: Props) {
  const [isPending, start] = useTransition();
  const [done, setDone] = useState(status === 'approved');
  const [approverName, setApproverName] = useState('');
  const [showInput, setShowInput] = useState(false);

  if (done) {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Aprobada
      </span>
    );
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={approverName}
          onChange={(e) => setApproverName(e.target.value)}
          placeholder="Nombre del aprobador"
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          onClick={() => {
            if (!approverName.trim()) return;
            start(async () => {
              const res = await approvePolicy(policyId, approverName.trim());
              if (!res.error) setDone(true);
            });
          }}
          disabled={isPending || !approverName.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          {isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <CheckCircle2 className="w-3.5 h-3.5" />}
          Confirmar
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      Aprobar Política
    </button>
  );
}
