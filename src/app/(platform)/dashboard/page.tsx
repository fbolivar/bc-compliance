import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import {
  getMspiPosture,
  getMspiHistory,
  getProcessesHealth,
  getTopCriticalGaps,
  getOperationalMetrics,
  getUpcomingActions,
  getRisksByZone,
} from '@/features/dashboard/services/executiveDashboardService';
import { getSnapshotHistory } from '@/features/dashboard/services/snapshotService';

import { MspiPostureHero } from '@/features/dashboard/components/MspiPostureHero';
import { MspiHistoryChart } from '@/features/dashboard/components/MspiHistoryChart';
import { PhvaCycle } from '@/features/dashboard/components/PhvaCycle';
import { OperationalMetricsRow } from '@/features/dashboard/components/OperationalMetricsRow';
import { FrameworksPosture } from '@/features/dashboard/components/FrameworksPosture';
import { ProcessHealthMatrix } from '@/features/dashboard/components/ProcessHealthMatrix';
import { TopGapsAndActions } from '@/features/dashboard/components/TopGapsAndActions';
import { RiskKpiRow } from '@/features/dashboard/components/RiskKpiRow';

export const dynamic = 'force-dynamic';

function getGreeting(): string {
  const now = new Date();
  const hour = (now.getUTCHours() - 5 + 24) % 24;
  if (hour >= 5 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getSpanishDate(): string {
  const now = new Date();
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${days[now.getUTCDay()]}, ${now.getUTCDate()} de ${months[now.getUTCMonth()]} de ${now.getUTCFullYear()}`;
}

export default async function DashboardPage() {
  const { orgId, userName, organization } = await getCurrentOrg();
  if (!orgId) redirect('/login');

  const [posture, frameworks, processes, gaps, metrics, actions, history, riskSummary, mspiHistory6m] = await Promise.all([
    getMspiPosture(orgId),
    getFrameworksWithCompliance(orgId),
    getProcessesHealth(orgId),
    getTopCriticalGaps(orgId, 8),
    getOperationalMetrics(orgId),
    getUpcomingActions(orgId),
    getSnapshotHistory(orgId, 30),
    getRisksByZone(orgId),
    getMspiHistory(orgId, 6),
  ]);

  const mspiHistory = history.map((h) => h.mspi_score);

  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      {/* Header narrativo */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{getSpanishDate()}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            {getGreeting()}, {userName ?? 'Usuario'}
          </h1>
          <p className="text-sm text-slate-500">
            Tablero ejecutivo del SGSI · <span className="font-medium">{orgName}</span> · Modelo de Seguridad y Privacidad MinTIC
          </p>
        </div>
        <a
          href="/dashboard/presentation"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Modo presentación
        </a>
      </header>

      {/* 1. Postura MSPI hero */}
      <MspiPostureHero posture={posture} history={mspiHistory} />

      {/* 1b. MSPI historical chart */}
      {mspiHistory6m.length >= 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <MspiHistoryChart history={mspiHistory6m} />
        </div>
      )}

      {/* 2. PHVA cycle */}
      <PhvaCycle phva={posture.phva} />

      {/* 3. Risk panorama */}
      <RiskKpiRow summary={riskSummary} />

      {/* 4. Operational SecOps */}
      <OperationalMetricsRow metrics={metrics} />

      {/* 4. Frameworks posture */}
      <FrameworksPosture frameworks={frameworks} />

      {/* 5. Top gaps + Upcoming agenda */}
      <TopGapsAndActions gaps={gaps} actions={actions} />

      {/* 6. Process health matrix */}
      <ProcessHealthMatrix processes={processes} />

      {/* Footnote */}
      <footer className="pt-4 text-center">
        <p className="text-[11px] text-slate-400">
          Tablero generado en tiempo real desde el SGSI · Estructura PHVA / MIPG / MSPI
        </p>
      </footer>
    </div>
  );
}
