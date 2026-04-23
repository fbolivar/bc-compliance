import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getRiskById } from '@/features/risks/services/riskService';
import { PageHeader } from '@/shared/components/PageHeader';
import { RiskEditForm } from '@/features/risks/components/RiskEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function RiskEditPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const risk = await getRiskById(id);
  if (!risk) notFound();

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/risks/${id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/risks" className="hover:text-slate-700">Riesgos</Link>
          <span>/</span>
          <Link href={`/risks/${id}`} className="hover:text-slate-700 font-mono">{risk.code}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Editar</span>
        </nav>
      </div>

      <PageHeader
        title={`Editar ${risk.name}`}
        description="Actualiza identificación, análisis DAFP y tratamiento del riesgo."
      />

      <RiskEditForm risk={risk} />
    </div>
  );
}
