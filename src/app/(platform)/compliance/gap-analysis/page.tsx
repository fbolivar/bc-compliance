import { requireOrg } from '@/shared/lib/get-org';
import { getGapAnalysis } from '@/features/compliance/services/complianceService';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AlertTriangle } from 'lucide-react';

export default async function GapAnalysisPage() {
  const { orgId } = await requireOrg();
  const gaps = await getGapAnalysis(orgId);

  const byStatus = {
    not_implemented: gaps.filter((g) => g.compliance_status === 'not_implemented'),
    partially_implemented: gaps.filter((g) => g.compliance_status === 'partially_implemented'),
    not_assessed: gaps.filter((g) => g.compliance_status === 'not_assessed'),
  };

  const byFramework = gaps.reduce<Record<string, typeof gaps>>((acc, gap) => {
    if (!acc[gap.framework_name]) acc[gap.framework_name] = [];
    acc[gap.framework_name].push(gap);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analisis de Brechas"
        description="Requisitos normativos no cumplidos que requieren atencion"
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
          <p className="text-xs text-rose-400 font-medium uppercase tracking-wider">No Implementados</p>
          <p className="text-3xl font-bold text-rose-400 mt-1">{byStatus.not_implemented.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">Parcialmente Implementados</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">{byStatus.partially_implemented.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sin Evaluar</p>
          <p className="text-3xl font-bold text-slate-600 mt-1">{byStatus.not_assessed.length}</p>
        </div>
      </div>

      {gaps.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-16 text-center">
          <p className="text-sm text-emerald-400 font-medium">Excelente! No se detectaron brechas de cumplimiento</p>
          <p className="text-xs text-emerald-500/60 mt-1">Todos los requisitos evaluados estan implementados</p>
        </div>
      ) : (
        Object.entries(byFramework).map(([frameworkName, frameworkGaps]) => (
          <div key={frameworkName} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-700">{frameworkName}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {frameworkGaps.length} brechas
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {frameworkGaps.map((gap, idx) => (
                <div key={idx} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs text-sky-600 w-24 shrink-0 mt-0.5">
                      {gap.requirement_code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{gap.requirement_title}</p>
                      {gap.gap_description && (
                        <p className="mt-0.5 text-xs text-slate-500">{gap.gap_description}</p>
                      )}
                    </div>
                    <StatusBadge status={gap.compliance_status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
