import { requireOrg } from '@/shared/lib/get-org';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import { PageHeader } from '@/shared/components/PageHeader';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

function getComplianceColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-sky-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getComplianceBadgeClass(pct: number): string {
  if (pct >= 80) return 'text-emerald-400 bg-emerald-400/10';
  if (pct >= 60) return 'text-sky-600 bg-sky-50';
  if (pct >= 40) return 'text-amber-400 bg-amber-400/10';
  return 'text-rose-400 bg-rose-400/10';
}

export default async function CompliancePage() {
  const { orgId } = await requireOrg();
  const frameworks = await getFrameworksWithCompliance(orgId);

  const avgCompliance = frameworks.length > 0
    ? Math.round(frameworks.reduce((sum, fw) => sum + fw.compliance_percentage, 0) / frameworks.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cumplimiento Multi-Norma"
        description="Estado de cumplimiento por framework normativo"
      />

      {/* Summary KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <p className="text-sm text-sky-600">Cumplimiento Promedio</p>
          <p className="mt-2 text-4xl font-bold text-sky-600">{avgCompliance}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-400">Frameworks Activos</p>
          <p className="mt-2 text-4xl font-bold text-slate-700">{frameworks.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-400">Total Requisitos</p>
          <p className="mt-2 text-4xl font-bold text-slate-700">
            {frameworks.reduce((sum, fw) => sum + fw.total_requirements, 0)}
          </p>
        </div>
      </div>

      {/* Framework list with progress bars */}
      <div className="space-y-4">
        {frameworks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <p className="text-sm text-slate-500">No hay frameworks configurados</p>
          </div>
        ) : (
          frameworks.map((fw) => (
            <Link
              key={fw.id}
              href={`/compliance/${fw.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all group shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                      {fw.name}
                    </h3>
                    {fw.version && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">
                        {fw.version}
                      </span>
                    )}
                  </div>
                  {fw.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-1">{fw.description}</p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {fw.compliant_count} cumplidos / {fw.total_requirements} requisitos
                      </span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${getComplianceBadgeClass(fw.compliance_percentage)}`}>
                        {fw.compliance_percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getComplianceColor(fw.compliance_percentage)}`}
                        style={{ width: `${fw.compliance_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span className="text-emerald-400">{fw.compliant_count} implementados</span>
                    <span className="text-amber-400">{fw.partial_count} parciales</span>
                    <span className="text-rose-400">{fw.non_compliant_count} no implementados</span>
                    <span>{fw.total_requirements - fw.compliant_count - fw.partial_count - fw.non_compliant_count} sin evaluar</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 shrink-0 mt-1 transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href="/compliance/soa"
          className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-700 transition-colors"
        >
          Ver SOA (Declaracion de Aplicabilidad)
        </Link>
        <Link
          href="/compliance/gap-analysis"
          className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-700 transition-colors"
        >
          Analisis de Brechas
        </Link>
      </div>
    </div>
  );
}
