import { requireOrg } from '@/shared/lib/get-org';
import { PageHeader } from '@/shared/components/PageHeader';
import { ensureWizardInitialized, getWizardSummary } from '@/features/iso-wizard/services/wizardService';
import { WizardOverview } from '@/features/iso-wizard/components/WizardOverview';

export const dynamic = 'force-dynamic';

export default async function IsoWizardPage() {
  const { orgId } = await requireOrg();
  await ensureWizardInitialized(orgId);
  const summary = await getWizardSummary(orgId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asistente ISO 27001:2022"
        description="Guia paso a paso para implementar tu Sistema de Gestion de Seguridad de la Informacion"
      />
      <WizardOverview summary={summary} />
    </div>
  );
}
