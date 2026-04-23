import Link from 'next/link';
import { ClipboardList, FileSpreadsheet } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getRisks } from '@/features/risks/services/riskService';
import { RiskList } from '@/features/risks/components/RiskList';
import { RiskImportButton } from '@/features/risks/components/RiskImportButton';
import { PageHeader } from '@/shared/components/PageHeader';

interface Props {
  searchParams: Promise<{ page?: string; level?: string; treatment?: string }>;
}

export default async function RisksPage({ searchParams }: Props) {
  const params = await searchParams;
  const { orgId } = await requireOrg();
  const page = Number(params.page) || 1;

  const result = await getRisks(orgId, { page, pageSize: 25 }, {
    risk_level_residual: params.level,
    treatment: params.treatment,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Gestión de Riesgos"
          description="Análisis y tratamiento de riesgos (DAFP 2020 + MAGERIT 3.0)"
        />
        <div className="flex items-center gap-2">
          <Link
            href="/risks/treatment-plans"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            Planes de Tratamiento
          </Link>
          <a
            href="/api/risks/export"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Descargar Mapa de Riesgos DAFP en Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar DAFP
          </a>
          <RiskImportButton />
        </div>
      </div>
      <RiskList
        data={result.data}
        count={result.count}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
