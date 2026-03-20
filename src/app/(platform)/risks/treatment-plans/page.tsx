import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import Link from 'next/link';
import { ArrowLeft, Calendar, Shield } from 'lucide-react';

export default async function RiskTreatmentPlansPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const { data: plans, count } = await supabase
    .from('risk_treatment_plans')
    .select(`
      *,
      risk_scenarios(id, code, name, risk_level)
    `, { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);

  const planList = plans || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/risks" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Planes de Tratamiento"
          description={`${count || 0} planes de tratamiento de riesgos`}
        />
      </div>

      {/* Summary by status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { status: 'pending', label: 'Pendientes', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
          { status: 'in_progress', label: 'En progreso', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
          { status: 'completed', label: 'Completados', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
          { status: 'cancelled', label: 'Cancelados', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
        ].map((item) => (
          <div key={item.status} className={`rounded-xl border p-4 ${item.color}`}>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">{item.label}</p>
            <p className="text-2xl font-bold mt-1">
              {planList.filter((p) => (p as Record<string, unknown>).status === item.status).length}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {planList.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No hay planes de tratamiento registrados</p>
            <p className="text-xs text-slate-600 mt-1">Los planes se crean al evaluar escenarios de riesgo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Riesgo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estrategia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Responsable</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {planList.map((plan) => {
                  const p = plan as Record<string, unknown>;
                  const risk = p.risk_scenarios as { code: string; name: string; risk_level: string } | null;

                  return (
                    <tr key={p.id as string} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        {risk ? (
                          <>
                            <Link href={`/risks/${risk.code}`} className="text-sm font-medium text-slate-700 hover:text-sky-500 transition-colors">
                              {risk.name}
                            </Link>
                            <div className="mt-0.5">
                              <StatusBadge status={risk.risk_level} />
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-600 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 capitalize">
                          {String(p.treatment_strategy || '-').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status as string || 'pending'} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {p.responsible as string || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {p.due_date ? (
                          <span className="flex items-center gap-1 text-sm text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                            {new Date(p.due_date as string).toLocaleDateString('es-CO')}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
