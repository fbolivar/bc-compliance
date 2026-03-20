import { requireOrg } from '@/shared/lib/get-org';
import { getControls } from '@/features/controls/services/controlService';
import { ControlList } from '@/features/controls/components/ControlList';
import { PageHeader } from '@/shared/components/PageHeader';

interface Props {
  searchParams: Promise<{ page?: string; status?: string; control_type?: string }>;
}

export default async function ControlsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getControls(orgId, { page, pageSize: 25 }, {
    status: params.status,
    control_type: params.control_type,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de Controles"
        description="Catalogo de controles de seguridad y su estado de implementacion"
      />
      <ControlList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
