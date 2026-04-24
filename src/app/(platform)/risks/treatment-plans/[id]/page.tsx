import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { PlanActionRow } from '@/features/risks/components/PlanActionRow';
import { PlanStatusChanger } from '@/features/risks/components/PlanStatusChanger';
import { ArrowLeft, Calendar, Shield, Target, DollarSign, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const ZONE_STYLE: Record<string, string> = {
  Extremo: 'bg-rose-100 text-rose-700 border-rose-200',
  Alto: 'bg-amber-100 text-amber-700 border-amber-200',
  Moderado: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Bajo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const LEVEL_TO_ZONE: Record<string, string> = {
  critical: 'Extremo', high: 'Alto', medium: 'Moderado', low: 'Bajo', negligible: 'Bajo',
};

function fmt(v: string | null | undefined) { return v ?? '—'; }

function fmtDate(v: string | null | undefined) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

function fmtCurrency(v: number | null | undefined) {
  if (!v) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

export default async function TreatmentPlanDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const [planRes, linksRes, actionsRes] = await Promise.all([
    supabase
      .from('treatment_plans')
      .select('id, code, title, description, status, start_date, target_date, completed_date, budget, actual_cost, notes, created_at')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single(),
    supabase
      .from('treatment_plan_risks')
      .select('risk_scenarios(id, code, name, risk_zone, risk_level_residual, treatment)')
      .eq('treatment_plan_id', id),
    supabase
      .from('treatment_plan_actions')
      .select('id, title, description, status, due_date, completed_date, notes, sort_order')
      .eq('treatment_plan_id', id)
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: true }),
  ]);

  if (!planRes.data) notFound();

  const plan = planRes.data;
  const risks = (linksRes.data ?? [])
    .map((l) => (l.risk_scenarios as unknown as {
      id: string; code: string; name: string;
      risk_zone: string | null; risk_level_residual: string | null; treatment: string | null;
    } | null))
    .filter(Boolean) as Array<{
      id: string; code: string; name: string;
      risk_zone: string | null; risk_level_residual: string | null; treatment: string | null;
    }>;
  const actions = actionsRes.data ?? [];

  const totalActions = actions.length;
  const doneActions = actions.filter((a) => a.status === 'completed').length;
  const pct = totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0;

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link
          href="/risks/treatment-plans"
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors mt-1"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <PageHeader
            title={plan.title}
            description={plan.code}
          />
        </div>
        <PlanStatusChanger planId={plan.id} status={plan.status ?? 'draft'} />
      </div>

      {/* Progress + meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetaCard icon={<Calendar className="w-4 h-4 text-sky-500" />} label="Inicio → Fin">
          {fmtDate(plan.start_date)} → {fmtDate(plan.target_date)}
        </MetaCard>
        <MetaCard icon={<Target className="w-4 h-4 text-indigo-500" />} label="Progreso de acciones">
          <span className="font-bold text-slate-800">{doneActions}/{totalActions}</span>
          <span className="text-slate-400 ml-1">({pct}%)</span>
        </MetaCard>
        <MetaCard icon={<DollarSign className="w-4 h-4 text-emerald-500" />} label="Presupuesto">
          {fmtCurrency(plan.budget)}
        </MetaCard>
        {plan.completed_date && (
          <MetaCard icon={<Calendar className="w-4 h-4 text-emerald-500" />} label="Completado">
            {fmtDate(plan.completed_date)}
          </MetaCard>
        )}
      </div>

      {/* Progress bar */}
      {totalActions > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Avance del plan</span>
            <span className="text-sm font-semibold text-sky-600">{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-sky-500 h-2 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Riesgos vinculados */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-700">Riesgos vinculados</h2>
            <span className="text-xs text-slate-400">({risks.length})</span>
          </div>
          {risks.length === 0 ? (
            <p className="text-xs text-slate-400 px-4 py-6 text-center">Sin riesgos vinculados</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {risks.map((r) => {
                const zone = r.risk_zone ?? LEVEL_TO_ZONE[r.risk_level_residual ?? ''] ?? '';
                return (
                  <Link
                    key={r.id}
                    href={`/risks/${r.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                  >
                    <span className="font-mono text-xs text-sky-600 w-20 flex-shrink-0 mt-0.5">{r.code}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 line-clamp-2 group-hover:text-sky-600 transition-colors">{r.name}</p>
                      {zone && (
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${ZONE_STYLE[zone] ?? 'bg-slate-100 text-slate-500'}`}>
                          {zone}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Acciones de tratamiento</h2>
            <span className="text-xs text-slate-400">({doneActions}/{totalActions} completadas)</span>
          </div>
          {actions.length === 0 ? (
            <p className="text-xs text-slate-400 px-4 py-8 text-center">
              Sin acciones registradas. Importa la matriz DAFP para generar acciones automáticamente.
            </p>
          ) : (
            <div className="p-3 space-y-2">
              {actions.map((a, i) => (
                <PlanActionRow
                  key={a.id}
                  id={a.id}
                  title={a.title}
                  description={a.description}
                  status={a.status ?? 'pending'}
                  dueDate={a.due_date}
                  notes={a.notes}
                  sortOrder={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notas / descripción */}
      {(plan.description || plan.notes) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-600">Notas del plan</h2>
          </div>
          {plan.description && (
            <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">{fmt(plan.description)}</p>
          )}
          {plan.notes && (
            <p className="text-xs text-slate-500 whitespace-pre-wrap border-t border-slate-100 pt-3">{fmt(plan.notes)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MetaCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  );
}
