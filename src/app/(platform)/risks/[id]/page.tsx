import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRiskById } from '@/features/risks/services/riskService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RiskDetailPage({ params }: Props) {
  const { id } = await params;
  const risk = await getRiskById(id);
  if (!risk) notFound();

  const dimensions = [
    { label: 'Confidencialidad [C]', deg: risk.degradation_c, impact: risk.impact_c, color: 'text-sky-600' },
    { label: 'Integridad [I]', deg: risk.degradation_i, impact: risk.impact_i, color: 'text-blue-400' },
    { label: 'Disponibilidad [D]', deg: risk.degradation_a, impact: risk.impact_a, color: 'text-emerald-400' },
    { label: 'Autenticidad [A]', deg: risk.degradation_au, impact: risk.impact_au, color: 'text-amber-400' },
    { label: 'Trazabilidad [T]', deg: risk.degradation_t, impact: risk.impact_t, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/risks" className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader title={risk.name} description={`${risk.code} - Escenario de Riesgo MAGERIT`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk calculation panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk levels summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Riesgo Inherente</p>
              <p className="text-3xl font-bold font-mono text-slate-700">{Number(risk.risk_potential).toFixed(1)}</p>
              <div className="mt-2"><StatusBadge status={risk.risk_level_inherent} /></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Riesgo Residual</p>
              <p className="text-3xl font-bold font-mono text-slate-700">{Number(risk.risk_residual).toFixed(1)}</p>
              <div className="mt-2"><StatusBadge status={risk.risk_level_residual} /></div>
            </div>
          </div>

          {/* MAGERIT calculation detail */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-4">Calculo MAGERIT</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-xs text-slate-500">Dimension</th>
                  <th className="text-right py-2 text-xs text-slate-500">Degradacion (%)</th>
                  <th className="text-right py-2 text-xs text-slate-500">Impacto</th>
                </tr>
              </thead>
              <tbody>
                {dimensions.map(d => (
                  <tr key={d.label} className="border-b border-slate-200/50">
                    <td className={`py-2 ${d.color}`}>{d.label}</td>
                    <td className="py-2 text-right font-mono text-slate-600">{d.deg}%</td>
                    <td className="py-2 text-right font-mono text-slate-600">{Number(d.impact).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td className="py-2 font-medium text-slate-700">Impacto Maximo</td>
                  <td></td>
                  <td className="py-2 text-right font-mono font-bold text-white">{Number(risk.impact_max).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Frecuencia (0-5)</td>
                  <td></td>
                  <td className="py-2 text-right font-mono text-slate-600">{risk.frequency}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Riesgo Potencial</td>
                  <td></td>
                  <td className="py-2 text-right font-mono font-bold text-amber-400">{Number(risk.risk_potential).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-600">Efectividad Salvaguardas</td>
                  <td></td>
                  <td className="py-2 text-right font-mono text-emerald-400">{risk.safeguard_effectiveness}%</td>
                </tr>
                <tr className="border-t border-sky-200">
                  <td className="py-2 font-bold text-sky-600">Riesgo Residual</td>
                  <td></td>
                  <td className="py-2 text-right font-mono text-xl font-bold text-sky-600">{Number(risk.risk_residual).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Activo Afectado</h3>
            <Link href={`/assets/${risk.asset_id}`} className="text-sm text-sky-500 hover:text-sky-600">
              {risk.assets?.code} - {risk.assets?.name}
            </Link>
            <p className="text-xs text-slate-500 mt-1 capitalize">{risk.assets?.asset_type?.replace('_', ' ')}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Amenaza</h3>
            <p className="text-sm text-slate-700">{risk.threat_catalog?.code} - {risk.threat_catalog?.name}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">Origen: {risk.threat_catalog?.origin}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Tratamiento</h3>
            <StatusBadge status={risk.treatment} />
            {risk.treatment_justification && (
              <p className="text-xs text-slate-400 mt-2">{risk.treatment_justification}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
