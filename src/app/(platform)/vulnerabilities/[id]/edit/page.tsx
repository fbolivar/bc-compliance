import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getVulnerabilityById } from '@/features/vulnerabilities/services/vulnService';
import { PageHeader } from '@/shared/components/PageHeader';
import { VulnEditForm } from '@/features/vulnerabilities/components/VulnEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function VulnerabilityEditPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const vuln = await getVulnerabilityById(id);
  if (!vuln) notFound();

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/vulnerabilities/${id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/vulnerabilities" className="hover:text-slate-700">Vulnerabilidades</Link>
          <span>/</span>
          <Link href={`/vulnerabilities/${id}`} className="hover:text-slate-700 font-mono">{vuln.code}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Editar</span>
        </nav>
      </div>

      <PageHeader
        title={`Editar ${vuln.title}`}
        description="Actualiza los datos de la vulnerabilidad."
      />

      <VulnEditForm vuln={vuln} />
    </div>
  );
}
