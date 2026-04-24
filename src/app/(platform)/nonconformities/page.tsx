import { requireOrg } from '@/shared/lib/get-org';
import { getNonConformities } from '@/features/nonconformities/services/ncService';
import { NCList } from '@/features/nonconformities/components/NCList';
import { PageHeader } from '@/shared/components/PageHeader';
import { FileSpreadsheet } from 'lucide-react';

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
        actions={
          <a
            href="/api/nonconformities/export"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar Excel
          </a>
        }
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
