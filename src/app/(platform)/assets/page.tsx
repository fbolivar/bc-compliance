import { requireOrg } from '@/shared/lib/get-org';
import { getAssets } from '@/features/assets/services/assetService';
import { AssetList } from '@/features/assets/components/AssetList';
import { PageHeader } from '@/shared/components/PageHeader';

interface Props {
  searchParams: Promise<{ page?: string; type?: string; status?: string }>;
}

export default async function AssetsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getAssets(orgId, { page, pageSize: 25 }, {
    asset_type: params.type,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de Activos (CMDB)"
        description="Inventario y clasificacion de activos de informacion"
      />
      <AssetList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
