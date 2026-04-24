'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Eye, Loader2 } from 'lucide-react';
import { FormModal } from '@/shared/components/FormModal';
import { FormField } from '@/shared/components/FormField';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { createBcpPlan, deleteBcpPlan } from '../actions/bcpActions';
import { createBiaRecord, deleteBiaRecord } from '../actions/biaActions';
import { createBcpTest, deleteBcpTest } from '../actions/bcpTestActions';

interface BcpPlan {
  id: string;
  code: string;
  title: string;
  version: string | null;
  status: string;
  owner: string | null;
  rto_target_hours: number | null;
  rpo_target_hours: number | null;
  next_test_date: string | null;
}

interface BiaRecord {
  id: string;
  process_name: string;
  process_owner: string | null;
  criticality: string;
  mdt_hours: number | null;
  rto_hours: number | null;
  rpo_hours: number | null;
  financial_impact: string | null;
}

interface BcpTest {
  id: string;
  bcp_plan_id: string;
  test_date: string;
  test_type: string;
  result: string;
  rto_achieved_hours: number | null;
  conducted_by: string | null;
}

interface Props {
  plans: BcpPlan[];
  biaRecords: BiaRecord[];
  tests: BcpTest[];
  activeTab: string;
}

const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-700 bg-white';

const TABS = [
  { key: 'planes', label: 'Planes BCP/DRP' },
  { key: 'bia', label: 'Analisis de Impacto (BIA)' },
  { key: 'pruebas', label: 'Pruebas y Ejercicios' },
];

export function BcpClient({ plans, biaRecords, tests, activeTab }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showBiaModal, setShowBiaModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const currentTab = TABS.find((t) => t.key === activeTab)?.key ?? 'planes';

  function refresh() {
    router.refresh();
  }

  // ── Plan handlers ──────────────────────────────────────────────────────────
  function handlePlanSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBcpPlan(formData);
      if (result.error) { setError(result.error); return; }
      setShowPlanModal(false);
      refresh();
    });
  }

  function handleDeletePlan(id: string) {
    if (!confirm('¿Eliminar este plan BCP?')) return;
    startTransition(async () => {
      await deleteBcpPlan(id);
      refresh();
    });
  }

  // ── BIA handlers ───────────────────────────────────────────────────────────
  function handleBiaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBiaRecord(formData);
      if (result.error) { setError(result.error); return; }
      setShowBiaModal(false);
      refresh();
    });
  }

  function handleDeleteBia(id: string) {
    if (!confirm('¿Eliminar este registro BIA?')) return;
    startTransition(async () => {
      await deleteBiaRecord(id);
      refresh();
    });
  }

  // ── Test handlers ──────────────────────────────────────────────────────────
  function handleTestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBcpTest(formData);
      if (result.error) { setError(result.error); return; }
      setShowTestModal(false);
      refresh();
    });
  }

  function handleDeleteTest(id: string) {
    if (!confirm('¿Eliminar esta prueba?')) return;
    startTransition(async () => {
      await deleteBcpTest(id);
      refresh();
    });
  }

  function formatDate(iso: string | null) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' });
  }

  return (
    <div className="space-y-4">
      {/* Tabs bar */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/business-continuity?tab=${tab.key}`}
            className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTab === tab.key
                ? 'border-b-2 border-teal-500 text-teal-600'
                : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
          {error}
        </div>
      )}

      {/* ── PLANES tab ─────────────────────────────────────────────────────── */}
      {currentTab === 'planes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Plan BCP
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Codigo</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Titulo</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Estado</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">Responsable</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">RTO objetivo</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">Proxima prueba</th>
                    <th className="px-4 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-widest w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-400">
                        No hay planes BCP definidos. Crea el primero.
                      </td>
                    </tr>
                  ) : (
                    plans.map((plan, idx) => (
                      <tr
                        key={plan.id}
                        className={`hover:bg-teal-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                      >
                        <td className="px-4 py-3.5 text-sm font-mono text-teal-600">{plan.code}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-700 font-medium">{plan.title}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={plan.status} /></td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{plan.owner ?? '-'}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                          {plan.rto_target_hours !== null ? `${plan.rto_target_hours}h` : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                          {formatDate(plan.next_test_date)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/business-continuity/${plan.id}`}
                              className="p-2 text-slate-400 hover:text-teal-500 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeletePlan(plan.id)}
                              disabled={isPending}
                              className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plan modal */}
          <FormModal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title="Nuevo Plan BCP/DRP">
            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Codigo" name="code" required placeholder="BCP-001" />
                <FormField label="Version" name="version" defaultValue="1.0" />
              </div>
              <FormField label="Titulo" name="title" required />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Estado"
                  name="status"
                  type="select"
                  options={[
                    { value: 'draft', label: 'Borrador' },
                    { value: 'approved', label: 'Aprobado' },
                    { value: 'active', label: 'Activo' },
                    { value: 'obsolete', label: 'Obsoleto' },
                  ]}
                />
                <FormField label="Responsable" name="owner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="RTO objetivo (hrs)" name="rto_target_hours" type="number" />
                <FormField label="RPO objetivo (hrs)" name="rpo_target_hours" type="number" />
              </div>
              <FormField label="Alcance" name="scope" type="textarea" />
              <FormField label="Criterios de activacion" name="activation_criteria" type="textarea" />
              <FormField label="Notas" name="notes" type="textarea" />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </FormModal>
        </div>
      )}

      {/* ── BIA tab ─────────────────────────────────────────────────────────── */}
      {currentTab === 'bia' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowBiaModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Evaluacion BIA
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Proceso</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">Responsable</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Criticidad</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">MTD (hrs)</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">RTO (hrs)</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">RPO (hrs)</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">Impacto financiero</th>
                    <th className="px-4 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-widest w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {biaRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-sm text-slate-400">
                        No hay registros BIA. Agrega el primero.
                      </td>
                    </tr>
                  ) : (
                    biaRecords.map((rec, idx) => (
                      <tr
                        key={rec.id}
                        className={`hover:bg-teal-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                      >
                        <td className="px-4 py-3.5 text-sm text-slate-700 font-medium">{rec.process_name}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell">{rec.process_owner ?? '-'}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={rec.criticality} /></td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell font-mono">
                          {rec.mdt_hours !== null ? rec.mdt_hours : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell font-mono">
                          {rec.rto_hours !== null ? rec.rto_hours : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell font-mono">
                          {rec.rpo_hours !== null ? rec.rpo_hours : '-'}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          {rec.financial_impact ? <StatusBadge status={rec.financial_impact} /> : <span className="text-slate-400 text-sm">-</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteBia(rec.id)}
                            disabled={isPending}
                            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BIA modal */}
          <FormModal isOpen={showBiaModal} onClose={() => setShowBiaModal(false)} title="Nueva Evaluacion BIA">
            <form onSubmit={handleBiaSubmit} className="space-y-4">
              <FormField label="Nombre del proceso" name="process_name" required />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Responsable" name="process_owner" />
                <FormField
                  label="Criticidad"
                  name="criticality"
                  type="select"
                  defaultValue="medium"
                  options={[
                    { value: 'critical', label: 'Critica' },
                    { value: 'high', label: 'Alta' },
                    { value: 'medium', label: 'Media' },
                    { value: 'low', label: 'Baja' },
                  ]}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="MTD (hrs)" name="mdt_hours" type="number" />
                <FormField label="RTO (hrs)" name="rto_hours" type="number" />
                <FormField label="RPO (hrs)" name="rpo_hours" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ImpactField label="Impacto Financiero" name="financial_impact" />
                <ImpactField label="Impacto Operacional" name="operational_impact" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ImpactField label="Impacto Reputacional" name="reputational_impact" />
                <ImpactField label="Impacto Legal" name="legal_impact" />
              </div>
              <FormField label="Dependencias" name="dependencies" type="textarea" />
              <FormField label="Notas" name="notes" type="textarea" />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBiaModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </FormModal>
        </div>
      )}

      {/* ── PRUEBAS tab ─────────────────────────────────────────────────────── */}
      {currentTab === 'pruebas' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Prueba
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Fecha</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">Plan</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Tipo</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Resultado</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">RTO logrado</th>
                    <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">Realizado por</th>
                    <th className="px-4 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-widest w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-400">
                        No hay pruebas registradas aun.
                      </td>
                    </tr>
                  ) : (
                    tests.map((test, idx) => {
                      const plan = plans.find((p) => p.id === test.bcp_plan_id);
                      return (
                        <tr
                          key={test.id}
                          className={`hover:bg-teal-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                        >
                          <td className="px-4 py-3.5 text-sm text-slate-700">{formatDate(test.test_date)}</td>
                          <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell font-mono">
                            {plan ? plan.code : '-'}
                          </td>
                          <td className="px-4 py-3.5"><StatusBadge status={test.test_type} /></td>
                          <td className="px-4 py-3.5"><StatusBadge status={test.result} /></td>
                          <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell font-mono">
                            {test.rto_achieved_hours !== null ? `${test.rto_achieved_hours}h` : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-500 hidden lg:table-cell">
                            {test.conducted_by ?? '-'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteTest(test.id)}
                              disabled={isPending}
                              className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test modal */}
          <FormModal isOpen={showTestModal} onClose={() => setShowTestModal(false)} title="Nueva Prueba BCP">
            <form onSubmit={handleTestSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="test_date" className="block text-sm font-medium text-slate-600">
                    Fecha <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="test_date"
                    name="test_date"
                    type="date"
                    required
                    className={inputClass}
                  />
                </div>
                <FormField
                  label="Tipo"
                  name="test_type"
                  type="select"
                  options={[
                    { value: 'tabletop', label: 'Mesa de Trabajo' },
                    { value: 'walkthrough', label: 'Recorrido' },
                    { value: 'simulation', label: 'Simulacion' },
                    { value: 'full_test', label: 'Prueba Completa' },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Resultado"
                  name="result"
                  type="select"
                  options={[
                    { value: 'passed', label: 'Aprobada' },
                    { value: 'partial', label: 'Parcial' },
                    { value: 'failed', label: 'Fallida' },
                  ]}
                />
                <div className="space-y-1.5">
                  <label htmlFor="bcp_plan_id" className="block text-sm font-medium text-slate-600">Plan BCP</label>
                  <select id="bcp_plan_id" name="bcp_plan_id" className={inputClass}>
                    <option value="">Seleccionar...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} — {p.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="RTO logrado (hrs)" name="rto_achieved_hours" type="number" />
                <FormField label="RPO logrado (hrs)" name="rpo_achieved_hours" type="number" />
              </div>
              <FormField label="Realizado por" name="conducted_by" />
              <FormField label="Hallazgos" name="findings" type="textarea" />
              <FormField label="Mejoras identificadas" name="improvements" type="textarea" />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </FormModal>
        </div>
      )}
    </div>
  );
}

// Helper inline component for impact selects
function ImpactField({ label, name }: { label: string; name: string }) {
  const baseClass =
    'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors';
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-slate-600">{label}</label>
      <select id={name} name={name} className={baseClass}>
        <option value="">Seleccionar...</option>
        <option value="none">Ninguno</option>
        <option value="low">Bajo</option>
        <option value="medium">Medio</option>
        <option value="high">Alto</option>
        <option value="critical">Critico</option>
      </select>
    </div>
  );
}
