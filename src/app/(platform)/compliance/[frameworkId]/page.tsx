import { requireOrg } from '@/shared/lib/get-org';
import {
  getFrameworkById,
  getFrameworkRequirements,
  getControlMappingsByRequirements,
} from '@/features/compliance/services/complianceService';
import { initFrameworkSoaEntries } from '@/features/compliance/actions/complianceActions';
import { createClient } from '@/lib/supabase/server';
import { FrameworkDetailClient } from '@/features/compliance/components/FrameworkDetailClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ frameworkId: string }>;
}

export default async function FrameworkDetailPage({ params }: Props) {
  const { frameworkId } = await params;
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const framework = await getFrameworkById(frameworkId);
  if (!framework) notFound();

  // Auto-create SOA entries (not_assessed) for any requirements without entries
  await initFrameworkSoaEntries(orgId, frameworkId);

  const requirements = await getFrameworkRequirements(frameworkId);

  const reqIds = requirements.map((r) => r.id);

  const { data: soaEntries } = reqIds.length > 0
    ? await supabase
        .from('soa_entries')
        .select('id, requirement_id, implementation_status, is_applicable, compliance_status')
        .eq('organization_id', orgId)
        .in('requirement_id', reqIds)
    : { data: [] };

  const controlMappings = await getControlMappingsByRequirements(reqIds);

  return (
    <div className="space-y-1">
      {/* Back navigation */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/compliance"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 transition-colors group"
          aria-label="Volver a cumplimiento"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Cumplimiento
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-600 font-medium">{framework.name}</span>
      </div>

      <FrameworkDetailClient
        framework={framework}
        requirements={requirements}
        soaEntries={soaEntries ?? []}
        controlMappings={controlMappings}
      />
    </div>
  );
}
