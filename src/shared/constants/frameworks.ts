// ============================================
// CONSTANTES DE MARCOS DE CUMPLIMIENTO
// Marcos de cumplimiento soportados por BC Trust
// ============================================

// --------------------------------------------
// TIPOS BASE
// --------------------------------------------

export type FrameworkCategory = 'international' | 'regional' | 'national' | 'industry'

export type FrameworkCountry =
  | 'INT'  // Internacional
  | 'US'   // Estados Unidos
  | 'EU'   // Unión Europea
  | 'CO'   // Colombia
  | 'ES'   // España

export type FrameworkCode =
  | 'iso27001'
  | 'iso27002'
  | 'iso27701'
  | 'iso27032'
  | 'iso22301'
  | 'nist_csf'
  | 'nis2'
  | 'pci_dss'
  | 'gdpr'
  | 'ley_1581'
  | 'ley_1273'
  | 'decreto_1078'
  | 'decreto_338'

export interface Framework {
  code: FrameworkCode
  name: string
  version: string
  issuing_body: string
  category: FrameworkCategory
  country: FrameworkCountry
  description: string
  focus_areas: string[]
  is_certifiable: boolean
  url_reference: string
}

// --------------------------------------------
// CATÁLOGO DE MARCOS DE CUMPLIMIENTO
// --------------------------------------------

export const FRAMEWORKS: Framework[] = [
  // ==========================================
  // ESTÁNDARES ISO/IEC INTERNACIONALES
  // ==========================================
  {
    code: 'iso27001',
    name: 'ISO/IEC 27001:2022',
    version: '2022',
    issuing_body: 'ISO/IEC',
    category: 'international',
    country: 'INT',
    description:
      'Estándar internacional que especifica los requisitos para establecer, implementar, mantener y mejorar continuamente un Sistema de Gestión de Seguridad de la Información (SGSI). Es el principal estándar de certificación en seguridad de la información a nivel mundial.',
    focus_areas: [
      'Gobierno de seguridad de la información',
      'Gestión de riesgos',
      'Controles de seguridad',
      'Mejora continua',
      'Certificación de terceros',
    ],
    is_certifiable: true,
    url_reference: 'https://www.iso.org/standard/27001',
  },
  {
    code: 'iso27002',
    name: 'ISO/IEC 27002:2022',
    version: '2022',
    issuing_body: 'ISO/IEC',
    category: 'international',
    country: 'INT',
    description:
      'Código de práctica para controles de seguridad de la información. Proporciona directrices para las normas de seguridad de la información organizacional y las prácticas de gestión de seguridad de la información, incluyendo la selección, implementación y gestión de controles. Es la guía de referencia de controles de ISO 27001:2022.',
    focus_areas: [
      'Controles organizacionales',
      'Controles de personas',
      'Controles físicos',
      'Controles tecnológicos',
      'Gestión de activos',
    ],
    is_certifiable: false,
    url_reference: 'https://www.iso.org/standard/75652.html',
  },
  {
    code: 'iso27701',
    name: 'ISO/IEC 27701:2019',
    version: '2019',
    issuing_body: 'ISO/IEC',
    category: 'international',
    country: 'INT',
    description:
      'Extensión de ISO 27001 e ISO 27002 para la gestión de información de privacidad. Especifica requisitos y proporciona directrices para establecer, implementar, mantener y mejorar un Sistema de Gestión de Información de Privacidad (PIMS). Facilita el cumplimiento del GDPR y otras regulaciones de privacidad.',
    focus_areas: [
      'Privacidad de datos personales',
      'Gestión de información de privacidad',
      'Derechos de los titulares de datos',
      'Roles de controlador y procesador',
      'Cumplimiento GDPR',
    ],
    is_certifiable: true,
    url_reference: 'https://www.iso.org/standard/71670.html',
  },
  {
    code: 'iso27032',
    name: 'ISO/IEC 27032:2023',
    version: '2023',
    issuing_body: 'ISO/IEC',
    category: 'international',
    country: 'INT',
    description:
      'Directrices para la ciberseguridad. Proporciona orientación para mejorar el estado de la ciberseguridad, destacando los aspectos únicos de esa actividad y sus dependencias de otros dominios de seguridad. Cubre la seguridad en internet, la protección de infraestructuras críticas y la coordinación entre organizaciones.',
    focus_areas: [
      'Ciberseguridad',
      'Seguridad en internet',
      'Protección de infraestructuras críticas',
      'Coordinación de partes interesadas',
      'Gestión de incidentes cibernéticos',
    ],
    is_certifiable: false,
    url_reference: 'https://www.iso.org/standard/44375.html',
  },
  {
    code: 'iso22301',
    name: 'ISO 22301:2019',
    version: '2019',
    issuing_body: 'ISO',
    category: 'international',
    country: 'INT',
    description:
      'Sistemas de gestión de continuidad de negocio. Especifica los requisitos para planificar, establecer, implementar, operar, monitorizar, revisar, mantener y mejorar continuamente un sistema de gestión documentado para proteger, reducir la probabilidad de ocurrencia, preparar, responder y recuperarse de incidentes disruptivos cuando surjan.',
    focus_areas: [
      'Continuidad de negocio',
      'Gestión de crisis',
      'Recuperación ante desastres',
      'Análisis de impacto en el negocio (BIA)',
      'Planes de continuidad',
    ],
    is_certifiable: true,
    url_reference: 'https://www.iso.org/standard/75106.html',
  },

  // ==========================================
  // MARCOS DE ESTADOS UNIDOS
  // ==========================================
  {
    code: 'nist_csf',
    name: 'NIST Cybersecurity Framework',
    version: '2.0',
    issuing_body: 'NIST',
    category: 'international',
    country: 'US',
    description:
      'Marco de ciberseguridad desarrollado por el Instituto Nacional de Estándares y Tecnología (NIST) de Estados Unidos. Proporciona un enfoque basado en riesgos para gestionar el riesgo de ciberseguridad, organizado en seis funciones principales: Gobernar, Identificar, Proteger, Detectar, Responder y Recuperar. Ampliamente adoptado a nivel mundial.',
    focus_areas: [
      'Gobierno de ciberseguridad',
      'Identificación de activos y riesgos',
      'Protección de sistemas',
      'Detección de amenazas',
      'Respuesta a incidentes',
      'Recuperación de incidentes',
    ],
    is_certifiable: false,
    url_reference: 'https://www.nist.gov/cyberframework',
  },

  // ==========================================
  // REGULACIONES EUROPEAS
  // ==========================================
  {
    code: 'nis2',
    name: 'NIS2 Directive',
    version: '2022/2555',
    issuing_body: 'European Union',
    category: 'regional',
    country: 'EU',
    description:
      'Directiva de la Unión Europea sobre la seguridad de las redes y sistemas de información (NIS2). Establece medidas para un nivel común elevado de ciberseguridad en toda la Unión Europea. Amplía el alcance de la NIS original, incluyendo más sectores y requisitos más estrictos de gestión de riesgos y notificación de incidentes.',
    focus_areas: [
      'Ciberseguridad en sectores críticos',
      'Gestión de riesgos de ciberseguridad',
      'Notificación de incidentes',
      'Seguridad de la cadena de suministro',
      'Gobernanza de ciberseguridad',
    ],
    is_certifiable: false,
    url_reference: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2555',
  },
  {
    code: 'gdpr',
    name: 'General Data Protection Regulation',
    version: '2016/679',
    issuing_body: 'European Union',
    category: 'regional',
    country: 'EU',
    description:
      'Reglamento General de Protección de Datos de la Unión Europea. Regula el tratamiento de datos personales de ciudadanos europeos. Establece derechos para los titulares de datos y obligaciones para los controladores y procesadores de datos. Aplica a cualquier organización que trate datos de ciudadanos europeos, independientemente de su ubicación.',
    focus_areas: [
      'Protección de datos personales',
      'Derechos de los titulares de datos',
      'Base legal para el tratamiento',
      'Transferencias internacionales de datos',
      'Notificación de brechas de seguridad',
      'Privacidad desde el diseño',
    ],
    is_certifiable: false,
    url_reference: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679',
  },

  // ==========================================
  // ESTÁNDARES DE INDUSTRIA
  // ==========================================
  {
    code: 'pci_dss',
    name: 'PCI DSS',
    version: '4.0',
    issuing_body: 'PCI SSC',
    category: 'industry',
    country: 'INT',
    description:
      'Estándar de Seguridad de Datos para la Industria de Tarjetas de Pago. Conjunto de requisitos técnicos y operativos diseñados para proteger los datos de los titulares de tarjetas de pago. Aplica a todas las entidades que almacenan, procesan o transmiten datos de titulares de tarjetas. Es administrado por el Consejo de Estándares de Seguridad PCI (PCI SSC).',
    focus_areas: [
      'Seguridad de datos de tarjetas de pago',
      'Seguridad de redes',
      'Control de acceso',
      'Monitorización y pruebas',
      'Políticas de seguridad de la información',
      'Gestión de vulnerabilidades',
    ],
    is_certifiable: true,
    url_reference: 'https://www.pcisecuritystandards.org/',
  },

  // ==========================================
  // NORMATIVA COLOMBIANA
  // ==========================================
  {
    code: 'ley_1581',
    name: 'Ley 1581 de 2012',
    version: '2012',
    issuing_body: 'Congreso de Colombia',
    category: 'national',
    country: 'CO',
    description:
      'Ley de Protección de Datos Personales de Colombia. Establece los principios, derechos y obligaciones para el tratamiento de datos personales en el territorio colombiano. Es la ley marco de protección de datos en Colombia y reglamenta el artículo 15 de la Constitución Política que reconoce el derecho a la intimidad y al habeas data.',
    focus_areas: [
      'Protección de datos personales',
      'Habeas data',
      'Derechos de los titulares',
      'Tratamiento de datos sensibles',
      'Registro Nacional de Bases de Datos (RNBD)',
      'Transferencia internacional de datos',
    ],
    is_certifiable: false,
    url_reference:
      'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981',
  },
  {
    code: 'ley_1273',
    name: 'Ley 1273 de 2009',
    version: '2009',
    issuing_body: 'Congreso de Colombia',
    category: 'national',
    country: 'CO',
    description:
      'Ley de Delitos Informáticos de Colombia. Por medio de la cual se modifica el Código Penal, se crea un nuevo bien jurídico tutelado denominado "de la protección de la información y de los datos" y se preservan integralmente los sistemas que utilicen las tecnologías de la información y las comunicaciones. Tipifica delitos como acceso abusivo a sistemas informáticos, interceptación de datos, uso de software malicioso y violación de datos personales.',
    focus_areas: [
      'Delitos informáticos',
      'Protección de sistemas informáticos',
      'Acceso abusivo a sistemas',
      'Interceptación de datos',
      'Daño informático',
      'Suplantación de sitios web',
    ],
    is_certifiable: false,
    url_reference:
      'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=34492',
  },
  {
    code: 'decreto_1078',
    name: 'Decreto 1078 de 2015',
    version: '2015',
    issuing_body: 'Gobierno de Colombia',
    category: 'national',
    country: 'CO',
    description:
      'Decreto Único Reglamentario del Sector de Tecnologías de la Información y las Comunicaciones. Compila y racionaliza las normas del sector TIC en Colombia. Incluye disposiciones sobre el Gobierno en Línea (GEL), lineamientos de política de seguridad digital, y el Marco de Referencia de Arquitectura Empresarial para la gestión de TI en el Estado colombiano.',
    focus_areas: [
      'Gobierno digital en Colombia',
      'Seguridad digital del Estado',
      'Arquitectura empresarial del Estado',
      'Servicios en línea',
      'Interoperabilidad',
      'Gestión TIC en el Estado',
    ],
    is_certifiable: false,
    url_reference:
      'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77596',
  },
  {
    code: 'decreto_338',
    name: 'Decreto 338 de 2022',
    version: '2022',
    issuing_body: 'Gobierno de Colombia',
    category: 'national',
    country: 'CO',
    description:
      'Decreto por el cual se adiciona el Decreto Único Reglamentario del Sector de Tecnologías de la Información y las Comunicaciones, Decreto 1078 de 2015, en lo relacionado con los lineamientos generales de ciberseguridad. Establece la Política Nacional de Ciberseguridad de Colombia y define los lineamientos para la implementación de medidas de ciberseguridad en entidades del Estado.',
    focus_areas: [
      'Política Nacional de Ciberseguridad',
      'Ciberseguridad en entidades del Estado',
      'Centro Cibernético Policial',
      'Respuesta a incidentes cibernéticos',
      'Gestión de riesgos digitales',
      'Resiliencia digital',
    ],
    is_certifiable: false,
    url_reference:
      'https://www.mintic.gov.co/portal/inicio/Sala-de-Prensa/Noticias/225040:Gobierno-Nacional-expidio-el-Decreto-338-de-2022',
  },
]

// --------------------------------------------
// ÍNDICE POR CÓDIGO PARA ACCESO RÁPIDO
// --------------------------------------------

export const FRAMEWORKS_BY_CODE: Record<FrameworkCode, Framework> = FRAMEWORKS.reduce(
  (acc, framework) => {
    acc[framework.code] = framework
    return acc
  },
  {} as Record<FrameworkCode, Framework>,
)

// --------------------------------------------
// AGRUPACIONES POR CATEGORÍA
// --------------------------------------------

export const FRAMEWORKS_BY_CATEGORY: Record<FrameworkCategory, Framework[]> = {
  international: FRAMEWORKS.filter((f) => f.category === 'international'),
  regional: FRAMEWORKS.filter((f) => f.category === 'regional'),
  national: FRAMEWORKS.filter((f) => f.category === 'national'),
  industry: FRAMEWORKS.filter((f) => f.category === 'industry'),
}

// --------------------------------------------
// AGRUPACIONES POR PAÍS
// --------------------------------------------

export const FRAMEWORKS_BY_COUNTRY: Record<FrameworkCountry, Framework[]> = {
  INT: FRAMEWORKS.filter((f) => f.country === 'INT'),
  US: FRAMEWORKS.filter((f) => f.country === 'US'),
  EU: FRAMEWORKS.filter((f) => f.country === 'EU'),
  CO: FRAMEWORKS.filter((f) => f.country === 'CO'),
  ES: FRAMEWORKS.filter((f) => f.country === 'ES'),
}

// --------------------------------------------
// MARCOS COLOMBIANOS (SUBCONJUNTO FRECUENTE)
// --------------------------------------------

export const COLOMBIAN_FRAMEWORKS: Framework[] = FRAMEWORKS.filter(
  (f) => f.country === 'CO',
)

// --------------------------------------------
// MARCOS CERTIFICABLES
// --------------------------------------------

export const CERTIFIABLE_FRAMEWORKS: Framework[] = FRAMEWORKS.filter(
  (f) => f.is_certifiable,
)

// --------------------------------------------
// UTILIDADES DE CONSULTA
// --------------------------------------------

/**
 * Obtiene un marco por su código
 */
export function getFrameworkByCode(code: FrameworkCode): Framework | undefined {
  return FRAMEWORKS_BY_CODE[code]
}

/**
 * Obtiene todos los marcos de una categoría
 */
export function getFrameworksByCategory(category: FrameworkCategory): Framework[] {
  return FRAMEWORKS_BY_CATEGORY[category] ?? []
}

/**
 * Obtiene todos los marcos de un país
 */
export function getFrameworksByCountry(country: FrameworkCountry): Framework[] {
  return FRAMEWORKS_BY_COUNTRY[country] ?? []
}

/**
 * Obtiene la etiqueta legible de una categoría
 */
export function getCategoryLabel(category: FrameworkCategory): string {
  const labels: Record<FrameworkCategory, string> = {
    international: 'Internacional',
    regional: 'Regional',
    national: 'Nacional',
    industry: 'Industria',
  }
  return labels[category]
}

/**
 * Obtiene la etiqueta legible de un país
 */
export function getCountryLabel(country: FrameworkCountry): string {
  const labels: Record<FrameworkCountry, string> = {
    INT: 'Internacional',
    US: 'Estados Unidos',
    EU: 'Unión Europea',
    CO: 'Colombia',
    ES: 'España',
  }
  return labels[country]
}
