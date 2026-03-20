import { requireOrg } from '@/shared/lib/get-org';
import { getVendors } from '@/features/vendors/services/vendorService';
import { VendorList } from '@/features/vendors/components/VendorList';
import { PageHeader } from '@/shared/components/PageHeader';

interface Props {
  searchParams: Promise<{ page?: string; status?: string; risk_level?: string }>;
}

export default async function VendorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getVendors(orgId, { page, pageSize: 25 }, {
    status: params.status,
    risk_level: params.risk_level,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de Proveedores"
        description="Evaluacion y monitoreo de riesgo de terceros (TPRM)"
      />
      <VendorList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
