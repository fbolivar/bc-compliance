import { requireOrg } from '@/shared/lib/get-org';
import { getIncidents } from '@/features/incidents/services/incidentService';
import { IncidentList } from '@/features/incidents/components/IncidentList';
import { PageHeader } from '@/shared/components/PageHeader';

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
