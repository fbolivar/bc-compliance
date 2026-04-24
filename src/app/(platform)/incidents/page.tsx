import { requireOrg } from '@/shared/lib/get-org';
import { getIncidents } from '@/features/incidents/services/incidentService';
import { IncidentList } from '@/features/incidents/components/IncidentList';
import { PageHeader } from '@/shared/components/PageHeader';
import { FileSpreadsheet } from 'lucide-react';

interface Props {
  searchParams: Promise<{ page?: string; severity?: string; status?: string }>;
}

export default async function IncidentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getIncidents(orgId, { page, pageSize: 25 }, {
    severity: params.severity,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de Incidentes"
        description="Registro, seguimiento y respuesta a incidentes de seguridad"
        actions={
          <a
            href="/api/incidents/export"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar Excel
          </a>
        }
      />
      <IncidentList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
