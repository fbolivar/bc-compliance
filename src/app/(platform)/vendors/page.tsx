import { requireOrg } from '@/shared/lib/get-org';
import { getVendors } from '@/features/vendors/services/vendorService';
import { VendorList } from '@/features/vendors/components/VendorList';
import { PageHeader } from '@/shared/components/PageHeader';
import { FileSpreadsheet } from 'lucide-react';

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
        actions={
          <a
            href="/api/vendors/export"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar Excel
          </a>
        }
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
