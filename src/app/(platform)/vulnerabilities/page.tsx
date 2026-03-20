import { requireOrg } from '@/shared/lib/get-org';
import { getVulnerabilities } from '@/features/vulnerabilities/services/vulnService';
import { VulnList } from '@/features/vulnerabilities/components/VulnList';
import { PageHeader } from '@/shared/components/PageHeader';

interface Props {
  searchParams: Promise<{ page?: string; severity?: string; status?: string }>;
}

export default async function VulnerabilitiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getVulnerabilities(orgId, { page, pageSize: 25 }, {
    severity: params.severity,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de Vulnerabilidades"
        description="Vulnerabilidades detectadas, CVEs y estado de remediacion"
      />
      <VulnList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
