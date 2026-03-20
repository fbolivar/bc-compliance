import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { ThreatsClient } from '@/features/threats/components/ThreatsClient';

export default async function ThreatsPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const { data: threats } = await supabase
    .from('threat_catalog')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${orgId}`)
    .order('origin', { ascending: true })
    .order('code', { ascending: true });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Catalogo de Amenazas"
        description="Amenazas MAGERIT v3 y amenazas personalizadas de la organizacion"
      />
      <ThreatsClient threats={threats || []} />
    </div>
  );
}
