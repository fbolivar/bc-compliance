'use client';

import { useState } from 'react';
import { createEntity } from '@/shared/lib/actions-helpers';
import { ChevronDown, Save, X, Loader2 } from 'lucide-react';

// Process dependencies
const processMap: Record<string, string[]> = {
  estrategico: [
    'Direccionamiento Estrategico',
    'Gestion de Conocimiento y la Innovacion',
    'Gestion de Tecnologias y Seguridad de la Informacion',
    'Asuntos Internacionales, Cooperacion y Gestion de Alianzas',
  ],
  misional: [
    'Fortalecimiento del SINAP',
    'Administracion y Manejo de Areas Protegidas',
    'Territorios Sostenibles e Innovadores',
    'Autoridad Ambiental',
    'Gobernanza y Participacion',
  ],
  apoyo: [
    'Talento Humano',
    'Recursos Financieros',
    'Recursos Fisicos e Infraestructura',
    'Gestion Contractual',
    'Gestion Juridica y Predial',
    'Servicio al Ciudadano',
  ],
  seguimiento_control: [
    'Evaluacion Independiente',
    'Control Disciplinario',
  ],
};

const sedes = [
  'Nivel Central',
  'Direccion Territorial Caribe',
  'Direccion Territorial Pacifico',
  'Direccion Territorial Andes Nororientales',
  'Direccion Territorial Andes Orientales',
  'Direccion Territorial Orinoquia',
  'Direccion Territorial Amazonia',
];

const assetTypes = [
  'Hardware', 'Informacion', 'Recurso Humano', 'Servicio',
  'Software', 'Datos', 'Recurso Cloud', 'Dispositivo IoT', 'Otro',
];

const formats = [
  'Documento Fisico',
  'Texto (txt, docx, rtf, pdf)',
  'Hoja de Calculo (xlsx, xlt, csv)',
  'Presentacion (pptx, ppsx)',
  'Graficos (jpg, png, gif, tiff)',
  'Base de Datos (SQL, Oracle, MySQL, PostgreSQL, mdb, otro)',
  'Audio (wav, mp3, mp4, mpeg, mov)',
  'Animacion (swf)',
  'Compresion (zip, rar)',
  'Otro',
];

const supports = [
  { value: 'fisico', label: 'Fisico' },
  { value: 'electronico', label: 'Electronico' },
  { value: 'digital', label: 'Digital' },
  { value: 'fisico_electronico', label: 'Fisico / Electronico' },
  { value: 'fisico_digital', label: 'Fisico / Digital' },
  { value: 'electronico_digital', label: 'Electronico / Digital' },
  { value: 'fisico_electronico_digital', label: 'Fisico / Electronico / Digital' },
  { value: 'na', label: 'N/A' },
];

interface AssetFormProps {
  onClose: () => void;
}

interface SectionProps {
  title: string;
  subtitle: string;
  number: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, subtitle, number, isOpen, onToggle, children }: SectionProps) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen ? 'true' : 'false'}
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-600 text-sm font-bold shrink-0">
          {number}
        </span>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 animate-[fadeIn_0.15s_ease-out]">
          {children}
        </div>
      )}
    </div>
  );
}

export function AssetForm({ onClose }: AssetFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['1']);
  const [processType, setProcessType] = useState('');
  const [confidentiality, setConfidentiality] = useState(1);
  const [integrity, setIntegrity] = useState(1);
  const [availability, setAvailability] = useState(1);

  const toggleSection = (id: string) => {
    setOpenSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const totalValue = ((confidentiality + integrity + availability) / 3).toFixed(1);
  const criticalityCID =
    Number(totalValue) >= 4 ? 'Alto' : Number(totalValue) >= 2.5 ? 'Medio' : 'Bajo';
  const criticalityColor =
    criticalityCID === 'Alto'
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : criticalityCID === 'Medio'
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-emerald-600 bg-emerald-50 border-emerald-200';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('confidentiality_value', String(confidentiality));
    formData.set('integrity_value', String(integrity));
    formData.set('availability_value', String(availability));

    const fields = [
      'name', 'description', 'asset_type', 'process_type', 'process_name', 'sede',
      'asset_id_custom', 'trd_serie', 'info_generation_date', 'entry_date', 'exit_date',
      'language', 'format', 'support', 'consultation_place', 'info_owner', 'info_custodian',
      'update_frequency', 'icc_social_impact', 'icc_economic_impact', 'icc_environmental_impact',
      'icc_is_critical', 'confidentiality', 'integrity', 'availability',
      'confidentiality_value', 'integrity_value', 'availability_value',
      'exception_objective', 'constitutional_basis', 'legal_exception_basis',
      'exception_scope', 'classification_date', 'classification_term',
      'contains_personal_data', 'contains_minors_data', 'personal_data_type',
      'personal_data_purpose', 'has_data_authorization',
    ];

    const result = await createEntity('assets', formData, fields, '/assets');

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    }
    setLoading(false);
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1';
  const selectClass = inputClass;

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <p className="text-sm text-emerald-700 font-medium">Activo registrado exitosamente</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600" role="alert">
          {error}
        </div>
      )}

      {/* Section 1: Identification */}
      <Section
        title="Identificacion del Activo de Informacion"
        subtitle="Parametros basicos de identificacion"
        number="1"
        isOpen={openSections.includes('1')}
        onToggle={() => toggleSection('1')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="process_type" className={labelClass}>Tipo de Proceso</label>
            <select
              id="process_type"
              name="process_type"
              className={selectClass}
              onChange={e => setProcessType(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="estrategico">Estrategicos</option>
              <option value="misional">Misionales</option>
              <option value="apoyo">Apoyo</option>
              <option value="seguimiento_control">Seguimiento y Control</option>
            </select>
          </div>
          <div>
            <label htmlFor="process_name" className={labelClass}>Proceso</label>
            <select
              id="process_name"
              name="process_name"
              className={selectClass}
              disabled={!processType}
            >
              <option value="">Seleccionar proceso...</option>
              {(processMap[processType] || []).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sede" className={labelClass}>Sede</label>
            <select id="sede" name="sede" className={selectClass}>
              <option value="">Seleccionar...</option>
              {sedes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="asset_id_custom" className={labelClass}>ID del Activo</label>
            <input
              id="asset_id_custom"
              type="text"
              name="asset_id_custom"
              placeholder="Autogenerado"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="trd_serie" className={labelClass}>TRD Serie - Sub Serie</label>
            <input
              id="trd_serie"
              type="text"
              name="trd_serie"
              placeholder="Codigo TRD"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>Nombre del Activo *</label>
            <input
              id="name"
              type="text"
              name="name"
              required
              placeholder="Nombre del activo"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="asset_type" className={labelClass}>Tipo de Activo *</label>
            <select id="asset_type" name="asset_type" required className={selectClass}>
              <option value="">Seleccionar...</option>
              {assetTypes.map(t => (
                <option key={t} value={t.toLowerCase().replace(/ /g, '_')}>{t}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className={labelClass}>Descripcion del Activo</label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Descripcion breve del activo"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="info_generation_date" className={labelClass}>Fecha Generacion Informacion</label>
            <input
              id="info_generation_date"
              type="date"
              name="info_generation_date"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="entry_date" className={labelClass}>Fecha Ingreso del Activo</label>
            <input
              id="entry_date"
              type="date"
              name="entry_date"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exit_date" className={labelClass}>Fecha Salida del Activo</label>
            <input
              id="exit_date"
              type="date"
              name="exit_date"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="language" className={labelClass}>Idioma</label>
            <select id="language" name="language" className={selectClass}>
              <option value="espanol">Espanol</option>
              <option value="ingles">Ingles</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label htmlFor="format" className={labelClass}>Formato</label>
            <select id="format" name="format" className={selectClass}>
              <option value="">Seleccionar...</option>
              {formats.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* Section 1.2: Location */}
      <Section
        title="Ubicacion del Activo de Informacion"
        subtitle="Soporte y lugar de consulta"
        number="1.2"
        isOpen={openSections.includes('1.2')}
        onToggle={() => toggleSection('1.2')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="support" className={labelClass}>Soporte</label>
            <select id="support" name="support" className={selectClass}>
              {supports.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="consultation_place" className={labelClass}>Lugar de Consulta</label>
            <input
              id="consultation_place"
              type="text"
              name="consultation_place"
              placeholder="Lugar de consulta / Informacion publicada o disponible"
              className={inputClass}
            />
          </div>
        </div>
      </Section>

      {/* Section 1.3: Ownership */}
      <Section
        title="Propiedad del Activo de Informacion"
        subtitle="Responsables y frecuencia de actualizacion"
        number="1.3"
        isOpen={openSections.includes('1.3')}
        onToggle={() => toggleSection('1.3')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="info_owner" className={labelClass}>Propietario del Activo</label>
            <input
              id="info_owner"
              type="text"
              name="info_owner"
              placeholder="Responsable de la produccion"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="info_custodian" className={labelClass}>Custodio del Activo</label>
            <input
              id="info_custodian"
              type="text"
              name="info_custodian"
              placeholder="Responsable de la custodia"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="update_frequency" className={labelClass}>Frecuencia de Actualizacion</label>
            <select id="update_frequency" name="update_frequency" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
              <option value="segun_requerimiento">Segun requerimiento</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Section 2: ICC */}
      <Section
        title="Infraestructura Critica Cibernetica (ICC)"
        subtitle="Criterios de identificacion de activos ICC"
        number="2"
        isOpen={openSections.includes('2')}
        onToggle={() => toggleSection('2')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            htmlFor="icc_social_impact"
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
          >
            <input
              id="icc_social_impact"
              type="checkbox"
              name="icc_social_impact"
              value="true"
              className="accent-sky-500 w-4 h-4 shrink-0"
            />
            <div>
              <p className="text-sm text-slate-700 font-medium">Impacto Social</p>
              <p className="text-xs text-slate-500">0,5% de Poblacion Nacional (250.000 personas)</p>
            </div>
          </label>
          <label
            htmlFor="icc_economic_impact"
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
          >
            <input
              id="icc_economic_impact"
              type="checkbox"
              name="icc_economic_impact"
              value="true"
              className="accent-sky-500 w-4 h-4 shrink-0"
            />
            <div>
              <p className="text-sm text-slate-700 font-medium">Impacto Economico</p>
              <p className="text-xs text-slate-500">PIB de un dia o 0,123% del PIB Anual</p>
            </div>
          </label>
          <label
            htmlFor="icc_environmental_impact"
            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
          >
            <input
              id="icc_environmental_impact"
              type="checkbox"
              name="icc_environmental_impact"
              value="true"
              className="accent-sky-500 w-4 h-4 shrink-0"
            />
            <div>
              <p className="text-sm text-slate-700 font-medium">Impacto Ambiental</p>
              <p className="text-xs text-slate-500">3 anos en recuperacion</p>
            </div>
          </label>
          <label
            htmlFor="icc_is_critical"
            className="flex items-center gap-3 p-3 rounded-lg border border-sky-200 bg-sky-50 cursor-pointer"
          >
            <input
              id="icc_is_critical"
              type="checkbox"
              name="icc_is_critical"
              value="true"
              className="accent-sky-500 w-4 h-4 shrink-0"
            />
            <div>
              <p className="text-sm text-sky-700 font-medium">Activo de ICC</p>
              <p className="text-xs text-sky-500">Infraestructura Critica Cibernetica</p>
            </div>
          </label>
        </div>
      </Section>

      {/* Section 3: Classification CIA */}
      <Section
        title="Clasificacion de los Activos de Informacion"
        subtitle="Atributos de seguridad (Confidencialidad, Integridad, Disponibilidad)"
        number="3"
        isOpen={openSections.includes('3')}
        onToggle={() => toggleSection('3')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="confidentiality" className={labelClass}>Confidencialidad</label>
              <select
                id="confidentiality"
                name="confidentiality"
                className={selectClass}
                onChange={e => {
                  const v = e.target.value;
                  setConfidentiality(v === 'alto' ? 5 : v === 'medio' ? 3 : 1);
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="alto">Alto</option>
                <option value="medio">Medio</option>
                <option value="bajo">Bajo</option>
              </select>
            </div>
            <div>
              <label htmlFor="integrity" className={labelClass}>Integridad</label>
              <select
                id="integrity"
                name="integrity"
                className={selectClass}
                onChange={e => {
                  const v = e.target.value;
                  setIntegrity(v === 'alto' ? 5 : v === 'medio' ? 3 : 1);
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="alto">Alto</option>
                <option value="medio">Medio</option>
                <option value="bajo">Bajo</option>
              </select>
            </div>
            <div>
              <label htmlFor="availability" className={labelClass}>Disponibilidad</label>
              <select
                id="availability"
                name="availability"
                className={selectClass}
                onChange={e => {
                  const v = e.target.value;
                  setAvailability(v === 'alto' ? 5 : v === 'medio' ? 3 : 1);
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="alto">Alto</option>
                <option value="medio">Medio</option>
                <option value="bajo">Bajo</option>
              </select>
            </div>
          </div>

          {/* Calculated CID values */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200"
            aria-live="polite"
            aria-label="Valores calculados de criticidad"
          >
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">C (Confidencialidad)</p>
              <p className="text-xl font-bold text-slate-800">{confidentiality}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">I (Integridad)</p>
              <p className="text-xl font-bold text-slate-800">{integrity}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">D (Disponibilidad)</p>
              <p className="text-xl font-bold text-slate-800">{availability}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">V (Valor Total)</p>
              <p className="text-xl font-bold text-slate-800">{totalValue}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Criticidad del Activo (CID):</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${criticalityColor}`}>
              {criticalityCID}
            </span>
          </div>
        </div>
      </Section>

      {/* Section 4: Classified Information Index */}
      <Section
        title="Indice de Informacion Clasificada y Reservada"
        subtitle="Ley 1712 de 2014 - Decreto 103 de 2015"
        number="4"
        isOpen={openSections.includes('4')}
        onToggle={() => toggleSection('4')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="exception_objective" className={labelClass}>
              Objetivo legitimo de la excepcion
            </label>
            <select id="exception_objective" name="exception_objective" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="Publica">Publica</option>
              <option value="Reservada">Reservada</option>
            </select>
          </div>
          <div>
            <label htmlFor="constitutional_basis" className={labelClass}>
              Fundamento constitucional o legal
            </label>
            <select id="constitutional_basis" name="constitutional_basis" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="Decreto 2372 del 1 de julio de 2010, Decreto 1076 de 2015, CONPES 4050 de 2021">
                Decreto 2372/2010, Decreto 1076/2015, CONPES 4050/2021
              </option>
              <option value="N/A">N/A</option>
            </select>
          </div>
          <div>
            <label htmlFor="legal_exception_basis" className={labelClass}>
              Fundamento Juridico de la Excepcion
            </label>
            <select id="legal_exception_basis" name="legal_exception_basis" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="Pendiente">Pendiente</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
          <div>
            <label htmlFor="exception_scope" className={labelClass}>Excepcion Total o Parcial</label>
            <select id="exception_scope" name="exception_scope" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="Total">Total</option>
              <option value="Parcial">Parcial</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
          <div>
            <label htmlFor="classification_date" className={labelClass}>Fecha de la Calificacion</label>
            <input
              id="classification_date"
              type="date"
              name="classification_date"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="classification_term" className={labelClass}>
              Plazo de clasificacion o reserva
            </label>
            <select id="classification_term" name="classification_term" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="Ilimitada">Ilimitada</option>
              <option value="Reservada">Reservada</option>
              <option value="Publica">Publica</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Section 5: Personal Data */}
      <Section
        title="Datos Personales"
        subtitle="Ley 1581 de 2012 - Identificacion de datos personales"
        number="5"
        isOpen={openSections.includes('5')}
        onToggle={() => toggleSection('5')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="contains_personal_data" className={labelClass}>
              Contiene Datos Personales
            </label>
            <select id="contains_personal_data" name="contains_personal_data" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="true">SI</option>
              <option value="false">NO</option>
            </select>
          </div>
          <div>
            <label htmlFor="contains_minors_data" className={labelClass}>
              Contiene datos de ninos, ninas o adolescentes
            </label>
            <select id="contains_minors_data" name="contains_minors_data" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="true">SI</option>
              <option value="false">NO</option>
            </select>
          </div>
          <div>
            <label htmlFor="personal_data_type" className={labelClass}>Tipo de Datos Personales</label>
            <select id="personal_data_type" name="personal_data_type" className={selectClass}>
              <option value="na">N/A</option>
              <option value="publico">Dato Personal Publico</option>
              <option value="privado">Dato Personal Privado</option>
              <option value="semiprivado">Dato Semiprivado</option>
              <option value="sensible">Dato Sensible</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="personal_data_purpose" className={labelClass}>
              Finalidad de la recoleccion de los datos personales
            </label>
            <textarea
              id="personal_data_purpose"
              name="personal_data_purpose"
              rows={2}
              placeholder="Describe la finalidad del tratamiento de datos"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="has_data_authorization" className={labelClass}>
              Autorizacion para tratamiento de datos
            </label>
            <select id="has_data_authorization" name="has_data_authorization" className={selectClass}>
              <option value="">Seleccionar...</option>
              <option value="true">SI</option>
              <option value="false">NO</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            : <Save className="w-4 h-4" aria-hidden="true" />
          }
          {loading ? 'Guardando...' : 'Registrar Activo'}
        </button>
      </div>
    </form>
  );
}
