import { notFound } from 'next/navigation';
import { requireOrg } from '@/shared/lib/get-org';
import { PageHeader } from '@/shared/components/PageHeader';
import { ensureWizardInitialized, getPhaseWithTasks } from '@/features/iso-wizard/services/wizardService';
import { WIZARD_PHASES } from '@/features/iso-wizard/lib/wizard-config';
import { PhaseDetailClient } from '@/features/iso-wizard/components/PhaseDetailClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ phase: string }>;
}

export default async function PhaseDetailPage({ params }: Props) {
  const { phase: phaseParam } = await params;
  const phaseNumber = parseInt(phaseParam, 10);

  if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 7) notFound();

  const { orgId } = await requireOrg();
  await ensureWizardInitialized(orgId);

  const phaseDef = WIZARD_PHASES.find((p) => p.number === phaseNumber);
  if (!phaseDef) notFound();

  const phaseData = await getPhaseWithTasks(orgId, phaseNumber);
  if (!phaseData) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/iso-wizard"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al asistente
      </Link>
      <PageHeader
        title={`Fase ${phaseNumber}: ${phaseDef.title}`}
        description={`${phaseDef.subtitle} — ISO 27001:2022 clausula ${phaseDef.isoClause}`}
      />
      <PhaseDetailClient
        phaseDef={phaseDef}
        phaseData={phaseData}
        phaseNumber={phaseNumber}
      />
    </div>
  );
}
