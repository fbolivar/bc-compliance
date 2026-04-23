import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAssetById } from '@/features/assets/services/assetService';
import { getProcessById } from '@/features/assets/services/processService';
import { requireOrg } from '@/shared/lib/get-org';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { ArrowLeft, Pencil } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function formatBoolean(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return '-';
  return v ? 'Sí' : 'No';
}

function formatDate(v: string | null | undefined): string {
  if (!v) return '-';
  try {
    return new Date(v).toLocaleDateString('es-CO', { dateStyle: 'medium' });
  } catch {
    return v;
  }
}

function formatEnum(v: string | null | undefined): string {
  if (!v || v === 'na') return '-';
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  full?: boolean;
}) {
  const display =
    value === null || value === undefined || value === ''
      ? '-'
      : typeof value === 'boolean'
        ? value ? 'Sí' : 'No'
        : String(value);

  return (
    <div className={full ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap break-words">{display}</p>
    </div>
  );
}

function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/60 flex items-center gap-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 text-sm font-bold border border-sky-200">
          {number}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
        {children}
      </div>
    </div>
  );
}

function BoolPill({ label, value, description }: { label: string; value: boolean | null | undefined; description?: string }) {
  const bg =
    value === true ? 'bg-rose-50 border-rose-200 text-rose-700' :
    value === false ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
    'bg-slate-50 border-slate-200 text-slate-500';
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${bg}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs font-bold">{formatBoolean(value)}</span>
      </div>
      {description && <p className="text-[11px] opacity-80 mt-0.5">{description}</p>}
    </div>
  );
}

export default async function AssetDetailPage({ params }: Props) {
  const { id } = await params;
  const { orgId } = await requireOrg();
  const asset = await getAssetById(id);
  if (!asset) notFound();

  // Fetch the linked process (if any) for breadcrumb
  const process = asset.category_id
    ? await getProcessById(asset.category_id, orgId)
    : null;

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      {/* Header with breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href={process ? `/assets/process/${process.id}` : '/assets'}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <nav className="text-xs text-slate-500 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/assets" className="hover:text-slate-700">Activos</Link>
          {process && (
            <>
              <span>/</span>
              <span className="text-slate-600">{process.family_name}</span>
              <span>/</span>
              <Link href={`/assets/process/${process.id}`} className="hover:text-slate-700">
                {process.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-700 font-medium font-mono">{asset.code}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider font-mono">
              {asset.code}
            </p>
            <PageHeader
              title={asset.name}
              description={asset.description ?? ''}
            />
          </div>
          <div className="flex flex-col items-end gap-3">
            <Link
              href={`/assets/${asset.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={asset.status} />
              <StatusBadge status={asset.criticality_cid ?? asset.criticality} />
              {asset.icc_is_critical && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  ICC
                </span>
              )}
              {asset.contains_personal_data && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  Datos personales
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Identificación */}
      <Section number="1" title="Identificación del Activo" subtitle="Parámetros básicos de identificación">
        <Field label="Código" value={asset.code} />
        <Field label="Nombre del Activo" value={asset.name} full />
        <Field label="Tipo de Activo" value={formatEnum(asset.asset_type)} />
        <Field label="Tipo de Proceso" value={formatEnum(asset.process_type)} />
        <Field label="Proceso" value={asset.process_name} />
        <Field label="Sede" value={asset.sede} />
        <Field label="ID del Activo (interno)" value={asset.asset_id_custom} />
        <Field label="TRD Serie-Subserie" value={asset.trd_serie} />
        <Field label="Descripción" value={asset.description} full />
        <Field label="Fecha Generación" value={formatDate(asset.info_generation_date)} />
        <Field label="Fecha Ingreso" value={formatDate(asset.entry_date)} />
        <Field label="Fecha Salida" value={formatDate(asset.exit_date)} />
        <Field label="Idioma" value={formatEnum(asset.language)} />
        <Field label="Formato" value={asset.format} />
      </Section>

      {/* 2. Ubicación */}
      <Section number="1.2" title="Ubicación" subtitle="Soporte y lugar de consulta">
        <Field label="Soporte" value={formatEnum(asset.support)} />
        <Field label="Lugar de Consulta" value={asset.consultation_place} full />
      </Section>

      {/* 3. Propiedad */}
      <Section number="1.3" title="Propiedad del Activo" subtitle="Responsables y frecuencia de actualización">
        <Field label="Propietario" value={asset.info_owner} />
        <Field label="Custodio" value={asset.info_custodian} />
        <Field label="Frecuencia Actualización" value={formatEnum(asset.update_frequency)} />
      </Section>

      {/* 4. ICC */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/60 flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 text-sm font-bold border border-sky-200">2</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Infraestructura Crítica Cibernética (ICC)</h3>
            <p className="text-xs text-slate-500">Criterios de identificación según CONPES 3995</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <BoolPill
            label="Impacto Social"
            value={asset.icc_social_impact}
            description="0.5% de población nacional (250.000 personas)"
          />
          <BoolPill
            label="Impacto Económico"
            value={asset.icc_economic_impact}
            description="PIB de un día o 0.123% del PIB anual"
          />
          <BoolPill
            label="Impacto Ambiental"
            value={asset.icc_environmental_impact}
            description="3 años en recuperación"
          />
          <BoolPill
            label="Activo de ICC"
            value={asset.icc_is_critical}
            description="Resultado consolidado ICC"
          />
        </div>
      </div>

      {/* 5. CIA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/60 flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 text-sm font-bold border border-sky-200">3</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Clasificación CIA</h3>
            <p className="text-xs text-slate-500">Atributos de seguridad — Confidencialidad · Integridad · Disponibilidad</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Field label="Confidencialidad" value={formatEnum(asset.confidentiality)} />
            <Field label="Integridad" value={formatEnum(asset.integrity)} />
            <Field label="Disponibilidad" value={formatEnum(asset.availability)} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">C (1-5)</p>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{asset.confidentiality_value ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">I (1-5)</p>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{asset.integrity_value ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">D (1-5)</p>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{asset.availability_value ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">V (Total)</p>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{asset.total_value ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Criticidad CID</p>
              <div className="mt-0.5"><StatusBadge status={asset.criticality_cid ?? asset.criticality} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Ley 1712 */}
      <Section
        number="4"
        title="Información Clasificada y Reservada"
        subtitle="Ley 1712 de 2014 · Decreto 103 de 2015"
      >
        <Field label="Objetivo de la Excepción" value={asset.exception_objective} />
        <Field label="Fundamento Constitucional / Legal" value={asset.constitutional_basis} full />
        <Field label="Fundamento Jurídico" value={asset.legal_exception_basis} full />
        <Field label="Excepción Total / Parcial" value={asset.exception_scope} />
        <Field label="Fecha Calificación" value={formatDate(asset.classification_date)} />
        <Field label="Plazo de Reserva" value={asset.classification_term} />
      </Section>

      {/* 7. Ley 1581 */}
      <Section
        number="5"
        title="Datos Personales"
        subtitle="Ley 1581 de 2012 · Decreto 1377 de 2013"
      >
        <Field label="¿Contiene datos personales?" value={asset.contains_personal_data} />
        <Field label="¿Contiene datos de menores?" value={asset.contains_minors_data} />
        <Field label="Tipo de Datos Personales" value={formatEnum(asset.personal_data_type)} />
        <Field label="Finalidad de la Recolección" value={asset.personal_data_purpose} full />
        <Field label="¿Existe Autorización del Titular?" value={asset.has_data_authorization} />
      </Section>

      {/* Metadatos */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 flex gap-8 text-xs text-slate-500 flex-wrap">
        <div>
          <span className="font-medium">Creado:</span>{' '}
          {formatDate(asset.created_at)}
        </div>
        <div>
          <span className="font-medium">Actualizado:</span>{' '}
          {formatDate(asset.updated_at)}
        </div>
        <div>
          <span className="font-medium">ID:</span>{' '}
          <span className="font-mono">{asset.id}</span>
        </div>
      </div>
    </div>
  );
}
