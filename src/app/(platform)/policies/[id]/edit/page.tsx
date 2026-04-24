import { requireOrg } from '@/shared/lib/get-org';
import { getPolicyById } from '@/features/policies/services/policyService';
import { PageHeader } from '@/shared/components/PageHeader';
import { PolicyEditForm } from '@/features/policies/components/PolicyEditForm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PolicyEditPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const policy = await getPolicyById(id);
  if (!policy) notFound();

  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/policies/${id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav
          className="text-xs text-slate-500 flex items-center gap-2 flex-wrap"
          aria-label="Breadcrumb"
        >
          <Link href="/policies" className="hover:text-slate-700 transition-colors">
            Políticas
          </Link>
          <span>/</span>
          <Link href={`/policies/${id}`} className="hover:text-slate-700 font-mono transition-colors">
            {policy.code}
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Editar</span>
        </nav>
      </div>

      <PageHeader
        title={`Editar: ${policy.title}`}
        description="Actualiza los datos, contenido y vigencia del documento."
      />

      <PolicyEditForm policy={policy} />
    </div>
  );
}
