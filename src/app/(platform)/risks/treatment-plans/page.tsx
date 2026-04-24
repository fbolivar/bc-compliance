import Link from 'next/link';
import { ArrowLeft, Calendar, ClipboardList, Shield } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { TreatmentPlanImportButton } from '@/features/risks/components/TreatmentPlanImportButton';

export const dynamic = 'force-dynamic';

interface PlanRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  budget: number | null;
  notes: string | null;
  owner_id: string | null;
  created_at: string;
}

interface PlanRiskLink {
  treatment_plan_id: string;
  risk_scenarios: { id: string; code: string; name: string; risk_zone: string | null; risk_level_residual: string | null } | null;
}

interface PlanActionRow {
  treatment_plan_id: string;
  id: string;
  status: string | null;
}

const STATUS_COUNTERS: Array<{ key: string; label: string; bg: string; text: string; border: string }> = [
  { key: 'draft', label: 'Borrador', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  { key: 'approved', label: 'Aprobados', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { key: 'in_progress', label: 'En progreso', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { key: 'completed', label: 'Completados', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
];

function formatDate(v: string | null): string {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('es-CO', { dateStyle: 'medium' });
  } catch {
    return v;
  }
}

export default async function RiskTreatmentPlansPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const [plansRes, linksRes, actionsRes] = await Promise.all([
    supabase
      .from('treatment_plans')
      .select('id, code, title, description, status, start_date, target_date, completed_date, budget, notes, owner_id, created_at')
      .eq('organization_id', orgId)
      .order('code', { ascending: true }),
    supabase
      .from('treatment_plan_risks')
      .select('treatment_plan_id, risk_scenarios(id, code, name, risk_zone, risk_level_residual)'),
    supabase
      .from('treatment_plan_actions')
      .select('treatment_plan_id, id, status')
      .eq('organization_id', orgId),
  ]);

  const plans = (plansRes.data ?? []) as PlanRow[];
  const links = (linksRes.data ?? []) as unknown as PlanRiskLink[];
  const actions = (actionsRes.data ?? []) as PlanActionRow[];

  const risksByPlan = new Map<string, Array<NonNullable<PlanRiskLink['risk_scenarios']>>>();
  for (const l of links) {
    if (!l.risk_scenarios) continue;
    const arr = risksByPlan.get(l.treatment_plan_id) ?? [];
    arr.push(l.risk_scenarios);
    risksByPlan.set(l.treatment_plan_id, arr);
  }

  const actionsByPlan = new Map<string, { total: number; done: number }>();
  for (const a of actions) {
    const cur = actionsByPlan.get(a.treatment_plan_id) ?? { total: 0, done: 0 };
    cur.total++;
    if (a.status === 'completed' || a.status === 'verified') cur.done++;
    actionsByPlan.set(a.treatment_plan_id, cur);
  }

  const countByStatus = (s: string) => plans.filter((p) => (p.status ?? 'draft') === s).length;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/risks"
            className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Volver a riesgos"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <PageHeader
            title="Planes de Tratamiento"
            description={`${plans.length} ${plans.length === 1 ? 'plan registrado' : 'planes registrados'}`}
          />
        </div>
        <TreatmentPlanImportButton />
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUS_COUNTERS.map((s) => (
          <div key={s.key} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${s.text}`}>{s.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{countByStatus(s.key)}</p>
          </div>
        ))}
      </div>

      {/* Plans table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {plans.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">No hay planes de tratamiento</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Importa tu matriz DAFP con el botón "Importar planes" o crea un plan desde el detalle de un riesgo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Riesgos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden lg:table-cell">Acciones</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-widest hidden md:table-cell">Inicio → Fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.map((plan) => {
                  const risks = risksByPlan.get(plan.id) ?? [];
                  const acts = actionsByPlan.get(plan.id) ?? { total: 0, done: 0 };
                  return (
                    <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/risks/treatment-plans/${plan.id}`} className="font-mono text-xs text-sky-600 hover:underline">{plan.code}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/risks/treatment-plans/${plan.id}`} className="block hover:text-sky-600 transition-colors">
                          <p className="text-sm font-medium text-slate-800 line-clamp-1">{plan.title}</p>
                          {plan.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{plan.description}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {risks.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {risks.slice(0, 2).map((r) => (
                              <Link
                                key={r.id}
                                href={`/risks/${r.id}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-mono text-slate-700"
                              >
                                <Shield className="w-3 h-3" />
                                {r.code}
                              </Link>
                            ))}
                            {risks.length > 2 && (
                              <span className="text-[11px] text-slate-500">+{risks.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {acts.total === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <span className="text-xs text-slate-600">
                            <span className="font-bold">{acts.done}</span>/{acts.total}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={plan.status ?? 'draft'} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(plan.start_date)} → {formatDate(plan.target_date)}</span>
                        </div>
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
