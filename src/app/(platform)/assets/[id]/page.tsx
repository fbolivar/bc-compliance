import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAssetById } from '@/features/assets/services/assetService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function Field({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  const display =
    value === null || value === undefined || value === ''
      ? '-'
      : typeof value === 'boolean'
      ? value ? 'Si' : 'No'
      : String(value);

  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{display}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

export default async function AssetDetailPage({ params }: Props) {
  const { id } = await params;
  const asset = await getAssetById(id);

  if (!asset) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/assets"
          className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title={asset.name}
          description={`${asset.code} — ${asset.asset_type.replace(/_/g, ' ')}`}
        />
      </div>

      <div className="space-y-4">
        {/* 1. Identificacion */}
        <Section title="1. Identificacion">
          <Field label="Codigo" value={asset.code} />
          <Field label="Nombre" value={asset.name} />
          <Field label="Tipo Activo" value={asset.asset_type.replace(/_/g, ' ')} />
          <div className="col-span-2 sm:col-span-3">
            <p className="text-xs text-slate-500">Descripcion</p>
            <p className="text-sm text-slate-800 font-medium">{asset.description || '-'}</p>
          </div>
        </Section>

        {/* 2. Ubicacion */}
        <Section title="2. Ubicacion">
          <Field label="Tipo Proceso" value={asset.process_type} />
          <Field label="Nombre Proceso" value={asset.process_name} />
          <Field label="Sede" value={asset.sede} />
          <Field label="Departamento" value={asset.department} />
          <Field label="Ubicacion" value={asset.location} />
        </Section>

        {/* 3. Propiedad */}
        <Section title="3. Propiedad">
          <Field label="Responsable de Informacion" value={asset.info_owner} />
          <div>
            <p className="text-xs text-slate-500">Estado</p>
            <StatusBadge status={asset.status} />
          </div>
          <Field label="Activo Critico" value={asset.is_critical} />
        </Section>

        {/* 4. ICC */}
        <Section title="4. Criticidad CID">
          <div>
            <p className="text-xs text-slate-500">Criticidad CID</p>
            <StatusBadge status={asset.criticality_cid ?? asset.criticality} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Criticidad (general)</p>
            <StatusBadge status={asset.criticality} />
          </div>
        </Section>

        {/* 5. Clasificacion CIA */}
        <Section title="5. Clasificacion CIA">
          <Field label="Confidencialidad" value={asset.confidentiality} />
          <Field label="Integridad" value={asset.integrity} />
          <Field label="Disponibilidad" value={asset.availability} />
          <Field label="Val. Confidencialidad" value={asset.val_confidentiality} />
          <Field label="Val. Integridad" value={asset.val_integrity} />
          <Field label="Val. Disponibilidad" value={asset.val_availability} />
          <Field label="Val. Autenticidad" value={asset.val_authenticity} />
          <Field label="Val. Trazabilidad" value={asset.val_traceability} />
        </Section>

        {/* 6. Informacion Clasificada */}
        <Section title="6. Informacion Clasificada">
          <Field label="Clasificacion de Datos" value={asset.data_classification} />
          <Field label="IP" value={asset.ip_address} />
          <Field label="Hostname" value={asset.hostname} />
        </Section>

        {/* 7. Datos Personales */}
        <Section title="7. Datos Personales">
          <Field label="Datos PII" value={asset.pii_data} />
          <Field label="Datos Financieros" value={asset.financial_data} />
        </Section>

        {/* Metadatos */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 flex gap-8 text-xs text-slate-500">
          <div>
            <span className="font-medium">Creado:</span>{' '}
            {new Date(asset.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
          </div>
          <div>
            <span className="font-medium">Actualizado:</span>{' '}
            {new Date(asset.updated_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
          </div>
        </div>
      </div>
    </div>
  );
}
