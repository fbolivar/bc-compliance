import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/shared/lib/get-org';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import {
  getMspiPosture,
  getProcessesHealth,
  getTopCriticalGaps,
  getOperationalMetrics,
  getUpcomingActions,
} from '@/features/dashboard/services/executiveDashboardService';

import { MspiPostureHero } from '@/features/dashboard/components/MspiPostureHero';
import { PhvaCycle } from '@/features/dashboard/components/PhvaCycle';
import { OperationalMetricsRow } from '@/features/dashboard/components/OperationalMetricsRow';
import { FrameworksPosture } from '@/features/dashboard/components/FrameworksPosture';
import { ProcessHealthMatrix } from '@/features/dashboard/components/ProcessHealthMatrix';
import { TopGapsAndActions } from '@/features/dashboard/components/TopGapsAndActions';

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

  const [posture, frameworks, processes, gaps, metrics, actions] = await Promise.all([
    getMspiPosture(orgId),
    getFrameworksWithCompliance(orgId),
    getProcessesHealth(orgId),
    getTopCriticalGaps(orgId, 8),
    getOperationalMetrics(orgId),
    getUpcomingActions(orgId),
  ]);

  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      {/* Header narrativo */}
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{getSpanishDate()}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          {getGreeting()}, {userName ?? 'Usuario'}
        </h1>
        <p className="text-sm text-slate-500">
          Tablero ejecutivo del SGSI · <span className="font-medium">{orgName}</span> · Modelo de Seguridad y Privacidad MinTIC
        </p>
      </header>

      {/* 1. Postura MSPI hero */}
      <MspiPostureHero posture={posture} />

      {/* 2. PHVA cycle */}
      <PhvaCycle phva={posture.phva} />

      {/* 3. Operational SecOps */}
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
