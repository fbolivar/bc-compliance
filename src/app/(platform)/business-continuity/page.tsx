import { requireOrg } from '@/shared/lib/get-org';
import { getBcpPlans, getBiaRecords, getBcpTests, getBcpStats } from '@/features/business-continuity/services/bcpService';
import { BcpClient } from '@/features/business-continuity/components/BcpClient';
import { PageHeader } from '@/shared/components/PageHeader';
import { HeartPulse, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function BusinessContinuityPage({ searchParams }: Props) {
  const { orgId } = await requireOrg();
  const { tab } = await searchParams;

  const [plans, biaRecords, tests, stats] = await Promise.all([
    getBcpPlans(orgId),
    getBiaRecords(orgId),
    getBcpTests(orgId),
    getBcpStats(orgId),
  ]);

  function formatNextDate(iso: string | null): string {
    if (!iso) return 'Sin programar';
    return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Continuidad del Negocio"
        description="ISO 27001:2022 A.5.29 · A.5.30 · Planes BCP/DRP y Analisis de Impacto"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Planes BCP</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.totalPlans}</p>
          <p className="text-xs text-slate-400 mt-0.5">planes totales</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Activos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.activePlans}</p>
          <p className="text-xs text-slate-400 mt-0.5">planes activos</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Procesos Criticos</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-slate-800">{stats.criticalProcesses}</p>
          <p className="text-xs text-slate-400 mt-0.5">procesos criticos (BIA)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proxima Prueba</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-800 truncate">{formatNextDate(stats.nextTestDate)}</p>
          <p className="text-xs text-slate-400 mt-0.5">fecha programada</p>
        </div>
      </div>

      <BcpClient
        plans={plans}
        biaRecords={biaRecords}
        tests={tests}
        activeTab={tab ?? 'planes'}
      />
    </div>
  );
}
