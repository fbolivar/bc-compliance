import { redirect } from 'next/navigation';
import { getCurrentOrg } from '@/shared/lib/get-org';
import {
  getMspiPosture,
  getProcessesHealth,
  getOperationalMetrics,
} from '@/features/dashboard/services/executiveDashboardService';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import { getSnapshotHistory } from '@/features/dashboard/services/snapshotService';
import { PresentationDashboard } from '@/features/dashboard/components/PresentationDashboard';

export const dynamic = 'force-dynamic';

export default async function PresentationPage() {
  const { orgId, organization } = await getCurrentOrg();
  if (!orgId) redirect('/login');

  const [posture, frameworks, processes, metrics, history] = await Promise.all([
    getMspiPosture(orgId),
    getFrameworksWithCompliance(orgId),
    getProcessesHealth(orgId),
    getOperationalMetrics(orgId),
    getSnapshotHistory(orgId, 30),
  ]);

  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';
  const mspiHistory = history.map((h) => h.mspi_score);

  return (
    <PresentationDashboard
      orgName={orgName}
      posture={posture}
      frameworks={frameworks}
      processes={processes}
      metrics={metrics}
      mspiHistory={mspiHistory}
    />
  );
}
