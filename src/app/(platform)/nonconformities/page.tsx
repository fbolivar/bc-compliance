import { requireOrg } from '@/shared/lib/get-org';
import { getNonConformities } from '@/features/nonconformities/services/ncService';
import { NCList } from '@/features/nonconformities/components/NCList';
import { PageHeader } from '@/shared/components/PageHeader';

interface Props {
  searchParams: Promise<{ page?: string; status?: string; type?: string }>;
}

export default async function NonconformitiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getNonConformities(orgId, { page, pageSize: 25 }, {
    status: params.status,
    type: params.type,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="No Conformidades"
        description="Registro de no conformidades, observaciones y acciones correctivas"
      />
      <NCList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
