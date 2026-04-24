import { getBcpPlanById } from '@/features/business-continuity/services/bcpService';
import { BcpEditForm } from '@/features/business-continuity/components/BcpEditForm';
import { PageHeader } from '@/shared/components/PageHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BcpPlanEditPage({ params }: Props) {
  const { id } = await params;
  const plan = await getBcpPlanById(id);

  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/business-continuity/${plan.id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={`Editar: ${plan.title}`}
          description={`${plan.code}${plan.version ? ` · v${plan.version}` : ''}`}
        />
      </div>

      <BcpEditForm plan={plan} />
    </div>
  );
}
