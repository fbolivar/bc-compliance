import { requireOrg } from '@/shared/lib/get-org';
import { getAudits } from '@/features/audits/services/auditService';
import { AuditList } from '@/features/audits/components/AuditList';
import { PageHeader } from '@/shared/components/PageHeader';

interface Props {
  searchParams: Promise<{ page?: string; status?: string; audit_type?: string }>;
}

export default async function AuditsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getAudits(orgId, { page, pageSize: 25 }, {
    status: params.status,
    audit_type: params.audit_type,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programas de Auditoria"
        description="Planificacion, ejecucion y seguimiento de auditorias internas y externas"
      />
      <AuditList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
