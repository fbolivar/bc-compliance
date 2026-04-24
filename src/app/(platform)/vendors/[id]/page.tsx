import { requireOrg } from '@/shared/lib/get-org';
import { getVendorById, getAssessmentsForVendor } from '@/features/vendors/services/vendorService';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PageHeader } from '@/shared/components/PageHeader';
import { VendorAssessmentPanel } from '@/features/vendors/components/VendorAssessmentPanel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Mail, Phone, Calendar, ShieldCheck, FileCheck, FileWarning, Pencil } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-700">{value || <span className="text-slate-400">-</span>}</div>
    </div>
  );
}

function ComplianceBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
        active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
      }`}
    >
      {active ? <FileCheck className="w-3 h-3" /> : <FileWarning className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default async function VendorDetailPage({ params }: Props) {
  const { id } = await params;
  await requireOrg();
  const [vendor, assessments] = await Promise.all([
    getVendorById(id),
    getAssessmentsForVendor(id),
  ]);

  if (!vendor) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendors" className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={vendor.name}
          description={`${vendor.code} · ${vendor.vendor_type?.replace(/_/g, ' ') ?? 'Proveedor'}`}
        />
        <Link
          href={`/vendors/${vendor.id}/edit`}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={vendor.status} />
        {vendor.risk_level && <StatusBadge status={vendor.risk_level} />}
        {vendor.handles_pii && (
          <span className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-700 border border-amber-200">
            Procesa PII
          </span>
        )}
        {vendor.handles_financial_data && (
          <span className="px-2.5 py-1 rounded-lg text-xs bg-rose-50 text-rose-700 border border-rose-200">
            Procesa datos financieros
          </span>
        )}
        {vendor.risk_score !== null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Score {vendor.risk_score}/100
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Informacion General</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Codigo" value={<span className="font-mono text-sky-600">{vendor.code}</span>} />
            <DetailRow label="Tipo" value={vendor.vendor_type?.replace(/_/g, ' ')} />
            <DetailRow label="Estado" value={<StatusBadge status={vendor.status} />} />
            <DetailRow label="Nivel de riesgo" value={vendor.risk_level ? <StatusBadge status={vendor.risk_level} /> : null} />
            <DetailRow label="País" value={vendor.country} />
            <DetailRow label="NIT / Tax ID" value={vendor.tax_id ? <span className="font-mono">{vendor.tax_id}</span> : null} />
            <DetailRow label="Ubicación de datos" value={vendor.data_location} />
            {vendor.website && (
              <DetailRow label="Sitio web" value={
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-500 hover:text-sky-600">
                  <Globe className="w-3.5 h-3.5" />
                  {vendor.website}
                </a>
              } />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Contacto y Contrato</h2>
          <div className="divide-y divide-slate-100">
            <DetailRow label="Contacto" value={vendor.contact_name} />
            {vendor.contact_email && (
              <DetailRow label="Email" value={
                <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-1 text-sky-500 hover:text-sky-600">
                  <Mail className="w-3.5 h-3.5" />
                  {vendor.contact_email}
                </a>
              } />
            )}
            {vendor.contact_phone && (
              <DetailRow label="Telefono" value={
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {vendor.contact_phone}
                </span>
              } />
            )}
            <DetailRow label="Inicio contrato" value={vendor.contract_start ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(vendor.contract_start).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            <DetailRow label="Fin contrato" value={vendor.contract_end ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(vendor.contract_end).toLocaleDateString('es-CO', { dateStyle: 'long' })}
              </span>
            ) : null} />
            {vendor.contract_value !== null && (
              <DetailRow label="Valor contrato" value={`$${Number(vendor.contract_value).toLocaleString('es-CO')}`} />
            )}
          </div>
        </div>
      </div>

      {/* Certificaciones y cumplimiento */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          <ShieldCheck className="w-4 h-4" />
          Certificaciones y Controles Third-Party
        </h2>
        <div className="flex flex-wrap gap-2">
          <ComplianceBadge label="ISO 27001" active={!!vendor.has_iso27001} />
          <ComplianceBadge label="SOC 2" active={!!vendor.has_soc2} />
          <ComplianceBadge label="Pentest" active={!!vendor.has_pentest} />
          <ComplianceBadge label="Contrato DPA" active={!!vendor.has_dpa} />
          {vendor.has_dpa && vendor.dpa_signed_at && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-50 text-slate-500 border border-slate-200">
              DPA firmado: {new Date(vendor.dpa_signed_at).toLocaleDateString('es-CO')}
            </span>
          )}
        </div>

        {vendor.next_assessment_date && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            Próxima evaluación: <span className="text-amber-600 font-medium">
              {new Date(vendor.next_assessment_date).toLocaleDateString('es-CO', { dateStyle: 'long' })}
            </span>
          </div>
        )}
      </div>

      {vendor.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Descripcion</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{vendor.description}</p>
        </div>
      )}

      {vendor.notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Notas</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}

      <VendorAssessmentPanel vendorId={vendor.id} assessments={assessments} />
    </div>
  );
}
