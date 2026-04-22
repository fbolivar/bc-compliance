import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/shared/components/PageHeader';
import { RiskHeatmap } from '@/features/risks/components/RiskHeatmap';

export const dynamic = 'force-dynamic';

export default async function RiskMatrixPage() {
  const { orgId } = await requireOrg();
  const supabase = await createClient();

  const { data: risks } = await supabase
    .from('risk_scenarios')
    .select('id, code, name, frequency, impact_max, risk_potential, risk_residual, risk_level_inherent, risk_level_residual, treatment')
    .eq('organization_id', orgId);

  type Risk = {
    id: string;
    code: string;
    name: string;
    frequency: number;
    impact_max: number;
    risk_potential: number;
    risk_residual: number;
    risk_level_inherent: string;
    risk_level_residual: string;
    treatment: string;
  };

  const rows = (risks ?? []) as Risk[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matriz de Riesgos"
        description="Matriz interactiva de frecuencia × impacto. Click en una celda para ver los escenarios."
      />
      <RiskHeatmap risks={rows} />
    </div>
  );
}
