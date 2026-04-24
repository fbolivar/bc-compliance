import { getBcpPlanById, getBcpProceduresByPlan, getBcpTestsByPlan } from '@/features/business-continuity/services/bcpService';
import { ProceduresPanel } from '@/features/business-continuity/components/ProceduresPanel';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Calendar, Clock, User, Target } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-700">{value ?? <span className="text-slate-400">-</span>}</div>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'long' });
}

export default async function BcpPlanDetailPage({ params }: Props) {
  const { id } = await params;

  const [plan, procedures, tests] = await Promise.all([
    getBcpPlanById(id),
    getBcpProceduresByPlan(id),
    getBcpTestsByPlan(id),
  ]);

  if (!plan) notFound();

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/business-continuity"
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver a continuidad"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={plan.title}
          description={`${plan.code}${plan.version ? ` · v${plan.version}` : ''}`}
        />
        <Link
          href={`/business-continuity/${plan.id}/edit`}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </Link>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={plan.status} />
        {plan.version && (
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200">
            v{plan.version}
          </span>
        )}
        {plan.owner && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-teal-50 text-teal-700 border border-teal-200">
            <User className="w-3 h-3" />
            {plan.owner}
          </span>
        )}
      </div>

      {/* Two-column info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-teal-600">{plan.code}</span>} />
            <DetailRow label="Estado" value={<StatusBadge status={plan.status} />} />
            <DetailRow label="Responsable" value={plan.owner} />
            <DetailRow label="Aprobado por" value={plan.approved_by} />
            <DetailRow label="Fecha de aprobacion" value={formatDate(plan.approved_at)} />
            {plan.scope && (
              <DetailRow label="Alcance" value={<span className="whitespace-pre-wrap leading-relaxed">{plan.scope}</span>} />
            )}
            {plan.activation_criteria && (
              <DetailRow label="Criterios de activacion" value={<span className="whitespace-pre-wrap leading-relaxed">{plan.activation_criteria}</span>} />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            <Target className="w-4 h-4" />
            Objetivos de Recuperacion
          </h2>
          <div className="divide-y divide-slate-100">
            <DetailRow
              label="RTO objetivo"
              value={
                plan.rto_target_hours !== null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono font-medium text-slate-700">{plan.rto_target_hours}h</span>
                  </span>
                ) : null
              }
            />
            <DetailRow
              label="RPO objetivo"
              value={
                plan.rpo_target_hours !== null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono font-medium text-slate-700">{plan.rpo_target_hours}h</span>
                  </span>
                ) : null
              }
            />
            <DetailRow
              label="Ultima prueba"
              value={
                plan.last_test_date ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {formatDate(plan.last_test_date)}
                  </span>
                ) : null
              }
            />
            <DetailRow
              label="Proxima prueba"
              value={
                plan.next_test_date ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(plan.next_test_date)}
                  </span>
                ) : null
              }
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      {plan.notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Notas</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{plan.notes}</p>
        </div>
      )}

      {/* Procedures panel */}
      <ProceduresPanel planId={plan.id} procedures={procedures} />

      {/* Test history */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">Historial de Pruebas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Resultado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">RTO logrado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">Realizado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    Sin pruebas registradas para este plan
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(test.test_date).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={test.test_type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={test.result} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono hidden lg:table-cell">
                      {test.rto_achieved_hours !== null ? `${test.rto_achieved_hours}h` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden lg:table-cell">
                      {test.conducted_by ?? '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
