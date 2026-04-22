'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ShieldAlert, Plus, X, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { FormModal } from '@/shared/components/FormModal';
import {
  linkControlToRisk,
  unlinkControlFromRisk,
} from '@/features/compliance/actions/mappingActions';

export interface MitigatedRiskItem {
  mapping_id: string;
  risk_id: string;
  code: string;
  name: string;
  risk_level_residual: string;
  risk_residual: number;
  treatment: string;
  effectiveness: number;
}

export interface AvailableRisk {
  id: string;
  code: string;
  name: string;
  risk_level_residual: string;
}

interface Props {
  controlId: string;
  mitigatedRisks: MitigatedRiskItem[];
  availableRisks: AvailableRisk[];
}

export function MitigatedRisksPanel({
  controlId,
  mitigatedRisks,
  availableRisks,
}: Props) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState('');
  const [effectiveness, setEffectiveness] = useState(70);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resetForm = () => {
    setSelectedRisk('');
    setEffectiveness(70);
    setNotes('');
    setError(null);
  };

  const handleAdd = () => {
    if (!selectedRisk) {
      setError('Selecciona un riesgo');
      return;
    }
    startTransition(async () => {
      const res = await linkControlToRisk({
        controlId,
        riskId: selectedRisk,
        effectiveness,
        notes,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setModalOpen(false);
      resetForm();
    });
  };

  const handleRemove = (mappingId: string) => {
    if (!confirm('¿Desvincular este riesgo del control?')) return;
    startTransition(async () => {
      await unlinkControlFromRisk(mappingId);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Riesgos Mitigados
          </h2>
          <span className="text-xs text-slate-400 ml-1">({mitigatedRisks.length})</span>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          disabled={availableRisks.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          title={availableRisks.length === 0 ? 'No hay más riesgos disponibles' : 'Vincular riesgo'}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar riesgo
        </button>
      </div>

      {mitigatedRisks.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">Este control aún no está vinculado a riesgos.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="px-6 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Escenario</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Residual</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tratamiento</th>
                <th className="px-6 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Efectividad</th>
                <th className="px-6 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mitigatedRisks.map((r) => (
                <tr key={r.mapping_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link
                      href={`/risks/${r.risk_id}`}
                      className="font-mono text-xs text-sky-600 hover:text-sky-700 hover:underline"
                    >
                      {r.code}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-700">{r.name}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.risk_level_residual} />
                      <span className="font-mono text-xs text-slate-500">
                        {Number(r.risk_residual).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={r.treatment} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            r.effectiveness >= 80 ? 'bg-emerald-500' :
                            r.effectiveness >= 50 ? 'bg-amber-500' : 'bg-rose-400'
                          }`}
                          style={{ width: `${r.effectiveness}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-600 w-10 text-right">
                        {r.effectiveness}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(r.mapping_id)}
                      disabled={pending}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                      title="Desvincular"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Vincular riesgo a control"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Riesgo</label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Selecciona un riesgo...</option>
              {availableRisks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Efectividad (%)
              <span className="ml-2 font-mono text-sky-600">{effectiveness}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={effectiveness}
              onChange={(e) => setEffectiveness(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Detalles sobre cómo este control mitiga el riesgo..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={pending}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending || !selectedRisk}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Vincular
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
