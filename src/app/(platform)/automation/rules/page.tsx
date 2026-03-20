import { requireOrg } from '@/shared/lib/get-org';
import { getAutomationRules } from '@/features/automation/services/automationService';
import { RuleList } from '@/features/automation/components/RuleList';
import { PageHeader } from '@/shared/components/PageHeader';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AutomationRulesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getAutomationRules(orgId, { page, pageSize: 25 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/automation" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Reglas de Automatizacion"
          description="Configuracion y gestion de reglas de automatizacion SOAR"
        />
      </div>
      <RuleList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
