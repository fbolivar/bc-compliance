import { requireOrg } from '@/shared/lib/get-org';
import { getRiskDistribution } from '@/features/risks/services/riskService';
import { PageHeader } from '@/shared/components/PageHeader';

export default async function RiskMatrixPage() {
  const { orgId } = await requireOrg();
  const distribution = await getRiskDistribution(orgId);
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  const levels = [
    { key: 'critical', label: 'Critico', color: 'bg-rose-500', textColor: 'text-rose-400', barColor: 'bg-rose-500' },
    { key: 'high', label: 'Alto', color: 'bg-orange-500', textColor: 'text-orange-400', barColor: 'bg-orange-500' },
    { key: 'medium', label: 'Medio', color: 'bg-amber-500', textColor: 'text-amber-400', barColor: 'bg-amber-500' },
    { key: 'low', label: 'Bajo', color: 'bg-emerald-500', textColor: 'text-emerald-400', barColor: 'bg-emerald-500' },
    { key: 'negligible', label: 'Despreciable', color: 'bg-slate-500', textColor: 'text-slate-500', barColor: 'bg-slate-500' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matriz de Riesgos"
        description="Distribucion de riesgos residuales por nivel"
      />

      <div className="grid grid-cols-5 gap-4">
        {levels.map(l => (
          <div key={l.key} className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
            <div className={`w-4 h-4 rounded-full ${l.color} mx-auto mb-3`} />
            <p className={`text-3xl font-bold font-mono ${l.textColor}`}>{distribution[l.key] || 0}</p>
            <p className="text-xs text-slate-500 mt-1">{l.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Distribucion</h3>
        <div className="space-y-3">
          {levels.map(l => (
            <div key={l.key} className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${l.color}`} />
              <span className="text-sm text-slate-500 w-28">{l.label}</span>
              <div className="flex-1 h-3 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${l.barColor} transition-all`}
                  style={{ width: total > 0 ? `${((distribution[l.key] || 0) / total) * 100}%` : '0%' }}
                />
              </div>
              <span className={`text-sm font-mono ${l.textColor} w-8 text-right`}>{distribution[l.key] || 0}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between text-sm">
          <span className="text-slate-500">Total escenarios</span>
          <span className="font-mono text-slate-600">{total}</span>
        </div>
      </div>
    </div>
  );
}
