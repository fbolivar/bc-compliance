import { requireOrg } from '@/shared/lib/get-org';
import { getRisks } from '@/features/risks/services/riskService';
import { RiskList } from '@/features/risks/components/RiskList';
import { PageHeader } from '@/shared/components/PageHeader';

interface Props {
  searchParams: Promise<{ page?: string; level?: string; treatment?: string }>;
}

export default async function RisksPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getRisks(orgId, { page, pageSize: 25 }, {
    risk_level_residual: params.level,
    treatment: params.treatment,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de Riesgos (MAGERIT 3.0)"
        description="Analisis y tratamiento de riesgos de seguridad de la informacion"
      />
      <RiskList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
