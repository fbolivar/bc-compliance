import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOrg } from '@/shared/lib/get-org';
import { getIncidentById } from '@/features/incidents/services/incidentService';
import { PageHeader } from '@/shared/components/PageHeader';
import { IncidentEditForm } from '@/features/incidents/components/IncidentEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function IncidentEditPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const incident = await getIncidentById(id);
  if (!incident) notFound();

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/incidents/${id}`}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver al detalle"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/incidents" className="hover:text-slate-700">Incidentes</Link>
          <span>/</span>
          <Link href={`/incidents/${id}`} className="hover:text-slate-700 font-mono">{incident.code}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Editar</span>
        </nav>
      </div>

      <PageHeader
        title={`Editar ${incident.title}`}
        description="Actualiza los datos del incidente de seguridad."
      />

      <IncidentEditForm incident={incident} />
    </div>
  );
}
