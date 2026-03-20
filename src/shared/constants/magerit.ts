// ============================================
// CONSTANTES MAGERIT 3.0
// Metodología de Análisis y Gestión de Riesgos
// de los Sistemas de Información
// Versión 3.0 - Ministerio de Hacienda y Administraciones Públicas (España)
// ============================================

// --------------------------------------------
// TIPOS BASE
// --------------------------------------------

export type DimensionCode = 'D' | 'I' | 'C' | 'A' | 'T'

export type ThreatOrigin = 'N' | 'I' | 'E' | 'A'

export type AssetType =
  | 'essential'     // [E] Activos esenciales: información y servicios
  | 'architecture'  // [A] Arquitectura del sistema
  | 'software'      // [SW] Software
  | 'hardware'      // [HW] Hardware
  | 'communications'// [COM] Redes de comunicaciones
  | 'media'         // [Media] Soportes de información
  | 'auxiliary'     // [AUX] Equipamiento auxiliar
  | 'facilities'    // [L] Instalaciones
  | 'personnel'     // [P] Personal

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'very_low'

// --------------------------------------------
// 1. DIMENSIONES DE SEGURIDAD
// --------------------------------------------

export interface MageritDimension {
  code: DimensionCode
  name: string
  description: string
  abbreviation: string
}

export const MAGERIT_DIMENSIONS: Record<DimensionCode, MageritDimension> = {
  D: {
    code: 'D',
    name: 'Disponibilidad',
    description:
      'Propiedad o característica de los activos consistente en que las entidades o procesos autorizados tienen acceso a los mismos cuando lo requieren. También se denomina habitabilidad, con el sentido de que el activo puede ser usado en el momento requerido.',
    abbreviation: 'DISP',
  },
  I: {
    code: 'I',
    name: 'Integridad de los datos',
    description:
      'Propiedad o característica consistente en que el activo de información no ha sido alterado de manera no autorizada. Se refiere a que la información es mantenida con exactitud y completitud, y no ha sido modificada accidentalmente o fraudulentamente.',
    abbreviation: 'INT',
  },
  C: {
    code: 'C',
    name: 'Confidencialidad de los datos',
    description:
      'Propiedad o característica consistente en que la información ni se pone a disposición, ni se revela a individuos, entidades o procesos no autorizados. También se denomina reserva o privacidad de la información.',
    abbreviation: 'CONF',
  },
  A: {
    code: 'A',
    name: 'Autenticidad',
    description:
      'Propiedad o característica consistente en que una entidad es quien dice ser o bien que garantiza la fuente de la que proceden los datos. También se denomina genuinidad o fidedignidad.',
    abbreviation: 'AUTH',
  },
  T: {
    code: 'T',
    name: 'Trazabilidad',
    description:
      'Propiedad o característica consistente en que las actuaciones de una entidad pueden ser imputadas exclusivamente a dicha entidad. También se denomina rendición de cuentas o no repudio.',
    abbreviation: 'TRAZ',
  },
}

// --------------------------------------------
// 2. CATÁLOGO DE AMENAZAS MAGERIT
// --------------------------------------------

export interface MageritThreat {
  code: string
  name: string
  description: string
  origin: ThreatOrigin
  origin_label: string
  affected_dimensions: DimensionCode[]
  affected_asset_types: AssetType[]
}

export const MAGERIT_THREAT_CATALOG: MageritThreat[] = [
  // ==========================================
  // [N] DESASTRES NATURALES
  // Sucesos que pueden ocurrir sin intervención de los seres humanos como causa directa o indirecta
  // ==========================================
  {
    code: 'N.1',
    name: 'Fuego',
    description:
      'Incendios: posibilidad de que el fuego acabe con recursos del sistema. El fuego puede ser consecuencia de accidentes, negligencia o acción intencionada.',
    origin: 'N',
    origin_label: 'Desastres naturales',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'facilities', 'media', 'auxiliary'],
  },
  {
    code: 'N.2',
    name: 'Daños por agua',
    description:
      'Inundaciones: posibilidad de que el agua acabe con recursos del sistema. El daño por agua puede provenir de lluvias, inundaciones, roturas de cañerías o derrames accidentales.',
    origin: 'N',
    origin_label: 'Desastres naturales',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'facilities', 'media', 'auxiliary'],
  },
  {
    code: 'N.*',
    name: 'Desastres naturales',
    description:
      'Otros desastres naturales: sismos, rayos y otros fenómenos de la naturaleza. Estos eventos, que se producen sin intervención humana, pueden tener consecuencias catastróficas para los activos.',
    origin: 'N',
    origin_label: 'Desastres naturales',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'facilities', 'media', 'auxiliary', 'communications'],
  },

  // ==========================================
  // [I] DE ORIGEN INDUSTRIAL
  // Sucesos que pueden ocurrir de forma accidental, derivados de la actividad humana de tipo industrial
  // ==========================================
  {
    code: 'I.1',
    name: 'Fuego',
    description:
      'Incendio de origen industrial: posibilidad de que el fuego, originado en actividades industriales o humanas, acabe con los recursos del sistema. Incluye cortocircuitos, sobrecargas eléctricas y otros accidentes de origen industrial.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'facilities', 'media', 'auxiliary'],
  },
  {
    code: 'I.2',
    name: 'Daños por agua',
    description:
      'Daños por agua de origen industrial: inundaciones por roturas de tuberías, sistemas de riego, sistemas de extinción de incendios, etc. Incluye los daños causados por el agua utilizada para apagar incendios.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'facilities', 'media', 'auxiliary'],
  },
  {
    code: 'I.3',
    name: 'Contaminación mecánica',
    description:
      'Vibraciones, polvo, suciedad, etc. que afectan al funcionamiento correcto de los equipos. La contaminación mecánica puede provocar fallos en los equipos o degradar su rendimiento de forma prematura.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'media', 'auxiliary'],
  },
  {
    code: 'I.4',
    name: 'Contaminación electromagnética',
    description:
      'Interferencias electromagnéticas de equipos industriales, tendidos eléctricos, equipos de radio y televisión, etc. Las interferencias pueden corromper datos en tránsito o almacenados, o afectar al funcionamiento de equipos.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D', 'I'],
    affected_asset_types: ['hardware', 'communications', 'media'],
  },
  {
    code: 'I.5',
    name: 'Avería de origen físico o lógico',
    description:
      'Fallos en los equipos y/o fallos en los programas. Puede ser debida a un defecto de origen o sobrevenida durante el funcionamiento del sistema. El fallo puede ocurrir de forma espontánea o ser consecuencia de un ataque.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'software', 'communications', 'media', 'auxiliary'],
  },
  {
    code: 'I.6',
    name: 'Corte del suministro eléctrico',
    description:
      'Cese de la alimentación de potencia eléctrica necesaria para el funcionamiento de los equipos. Incluye bajadas de tensión, microcortes, picos de tensión y cortes prolongados del suministro eléctrico.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'communications', 'auxiliary'],
  },
  {
    code: 'I.7',
    name: 'Condiciones inadecuadas de temperatura o humedad',
    description:
      'Funcionamiento fuera de los rangos adecuados de temperatura y/o humedad. Las condiciones ambientales inadecuadas pueden acelerar el desgaste de los equipos o provocar su mal funcionamiento.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'media', 'auxiliary'],
  },
  {
    code: 'I.8',
    name: 'Fallo de servicios de comunicaciones',
    description:
      'Cese de la capacidad de transmitir datos de un lugar a otro. Incluye la caída de líneas de comunicación, problemas con los proveedores de telecomunicaciones y otros fallos en la infraestructura de comunicaciones.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D'],
    affected_asset_types: ['communications'],
  },
  {
    code: 'I.9',
    name: 'Interrupción de otros servicios y suministros esenciales',
    description:
      'Cese de la prestación de servicios esenciales por parte de terceros, diferentes a las comunicaciones y al suministro eléctrico. Incluye el suministro de agua, gas, combustible y otros servicios auxiliares.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D'],
    affected_asset_types: ['auxiliary', 'facilities'],
  },
  {
    code: 'I.10',
    name: 'Degradación de los soportes de almacenamiento de la información',
    description:
      'Como consecuencia del paso del tiempo, los soportes de almacenamiento pueden degradarse y perder la información en ellos contenida. Los soportes electromagnéticos tienen una vida útil limitada y deben mantenerse adecuadamente.',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['D', 'I'],
    affected_asset_types: ['media'],
  },
  {
    code: 'I.11',
    name: 'Emanaciones electromagnéticas',
    description:
      'Emisiones electromagnéticas involuntarias que revelan información procesada en equipos electrónicos. Las emanaciones pueden ser captadas por equipos adecuados y usadas para reconstruir la información procesada (ataque TEMPEST).',
    origin: 'I',
    origin_label: 'De origen industrial',
    affected_dimensions: ['C'],
    affected_asset_types: ['hardware', 'communications'],
  },

  // ==========================================
  // [E] ERRORES Y FALLOS NO INTENCIONADOS
  // Fallos no intencionales causados por las personas
  // ==========================================
  {
    code: 'E.1',
    name: 'Errores de los usuarios',
    description:
      'Equivocaciones de las personas cuando usan los servicios, datos, etc. Los usuarios pueden cometer errores al introducir datos, ejecutar operaciones o configurar parámetros del sistema de manera no intencionada.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['essential', 'software'],
  },
  {
    code: 'E.2',
    name: 'Errores del administrador',
    description:
      'Equivocaciones de personas con responsabilidades de instalación y operación. Los administradores pueden cometer errores de configuración, de operación o de mantenimiento que afecten al correcto funcionamiento del sistema.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['hardware', 'software', 'communications', 'architecture'],
  },
  {
    code: 'E.3',
    name: 'Errores de monitorización (log)',
    description:
      'Inadecuado registro de actividades: falta de registros, registros incompletos, registros incorrectos, registros no protegidos, etc. La ausencia de trazabilidad impide detectar actividades ilícitas y reconstruir incidentes.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['T'],
    affected_asset_types: ['software', 'architecture'],
  },
  {
    code: 'E.4',
    name: 'Errores de configuración',
    description:
      'Introducción de datos de configuración erróneos. Los errores de configuración pueden afectar al comportamiento esperado del sistema, creando vulnerabilidades o degradando las medidas de seguridad implementadas.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['hardware', 'software', 'communications', 'architecture'],
  },
  {
    code: 'E.7',
    name: 'Deficiencias en la organización',
    description:
      'Cuando no está claro quién tiene que hacer qué y cuándo, incluyendo tomar medidas sobre los activos o informar a la jerarquía de gestión. Las deficiencias organizativas derivan en brechas de seguridad por falta de responsabilidades claras.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D', 'I', 'C', 'A', 'T'],
    affected_asset_types: ['personnel'],
  },
  {
    code: 'E.8',
    name: 'Difusión de software dañino',
    description:
      'Propagación inocente de virus, espías (spyware), gusanos, troyanos, bombas lógicas, etc. Se producen por accidente, sin intención maliciosa, pero con resultados igualmente dañinos para la organización.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['software', 'hardware'],
  },
  {
    code: 'E.9',
    name: 'Errores de encaminamiento',
    description:
      'Envío de información a través de sistemas o redes incorrectos. Puede producirse por errores de configuración en los sistemas de encaminamiento o por fallos en los sistemas de resolución de direcciones.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['C', 'I'],
    affected_asset_types: ['communications'],
  },
  {
    code: 'E.10',
    name: 'Errores de secuencia',
    description:
      'Alteración accidental del orden de los mensajes transmitidos. La alteración del orden puede producir resultados incorrectos en el procesamiento de la información o en la ejecución de transacciones.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['I'],
    affected_asset_types: ['communications', 'software'],
  },
  {
    code: 'E.14',
    name: 'Escapes de información',
    description:
      'La información llega accidentalmente al conocimiento de personas que no deberían tener acceso a la misma, sin que se haya producido un acceso deliberado. Puede ocurrir por errores al enviar correos electrónicos, compartir documentos, etc.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['C'],
    affected_asset_types: ['essential', 'personnel'],
  },
  {
    code: 'E.15',
    name: 'Alteración accidental de la información',
    description:
      'Modificación no intencionada de la información, sea por error de los usuarios, o como consecuencia de fallos en los soportes de almacenamiento, transmisión o procesamiento.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['I'],
    affected_asset_types: ['essential', 'software', 'media'],
  },
  {
    code: 'E.18',
    name: 'Destrucción de información',
    description:
      'Pérdida accidental de información. La información puede ser destruida por errores de usuario, fallos en los equipos, problemas en los procesos de copia de seguridad, o cualquier otra causa accidental.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D'],
    affected_asset_types: ['essential', 'media'],
  },
  {
    code: 'E.19',
    name: 'Fugas de información',
    description:
      'La información es accesible a personas que no están autorizadas a ello, bien de forma directa o bien a través de mecanismos de inferencia. Las fugas ocurren por controles de acceso inadecuados o configuración incorrecta de sistemas.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['C'],
    affected_asset_types: ['essential', 'software', 'architecture'],
  },
  {
    code: 'E.20',
    name: 'Vulnerabilidades de los programas (software)',
    description:
      'Defectos en el código que dan pie a una operación defectuosa sin intención por parte del usuario pero con consecuencias sobre la integridad de los datos o la capacidad de operar. Incluye bugs, errores de diseño y fallos de implementación.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['software'],
  },
  {
    code: 'E.21',
    name: 'Errores de mantenimiento / actualización de programas (software)',
    description:
      'Defectos en los procedimientos o controles relativos a actualizaciones y mantenimiento del software que permiten a personas no autorizadas la utilización del sistema con fines no previstos. Incluye actualizaciones incompletas, regresiones o pérdida de funcionalidad.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D', 'I'],
    affected_asset_types: ['software'],
  },
  {
    code: 'E.23',
    name: 'Errores de mantenimiento / actualización de equipos (hardware)',
    description:
      'Defectos en los procedimientos o controles relativos a actualizaciones y mantenimiento del hardware que afectan al funcionamiento normal del sistema. Incluye cambios no planificados, reemplazos incorrectos o incompatibilidades introducidas durante el mantenimiento.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware'],
  },
  {
    code: 'E.24',
    name: 'Caída del sistema por agotamiento de recursos',
    description:
      'La carencia de recursos suficientes provoca la caída del sistema cuando la carga de trabajo es desmesurada. Incluye agotamiento de espacio en disco, memoria, ancho de banda, conexiones simultáneas u otros recursos compartidos.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'software', 'communications'],
  },
  {
    code: 'E.25',
    name: 'Pérdida de equipos',
    description:
      'La pérdida de equipos provoca directamente la carencia de un medio para prestar los servicios, es decir, una indisponibilidad. Incluye extravíos, robos no intencionados y otras formas de pérdida de dispositivos.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D', 'C'],
    affected_asset_types: ['hardware', 'media'],
  },
  {
    code: 'E.28',
    name: 'Indisponibilidad del personal',
    description:
      'La falta de disponibilidad del personal operador provoca una degradación del nivel de servicio. Incluye accidentes, bajas laborales, renuncias, ausencias no planificadas y situaciones de pandemia o emergencia que afecten a la plantilla.',
    origin: 'E',
    origin_label: 'Errores y fallos no intencionados',
    affected_dimensions: ['D'],
    affected_asset_types: ['personnel'],
  },

  // ==========================================
  // [A] ATAQUES DELIBERADOS
  // Fallos deliberados causados por personas
  // ==========================================
  {
    code: 'A.3',
    name: 'Manipulación de los registros de actividad (log)',
    description:
      'Manipulación deliberada de los registros de actividad para evitar la detección de actividades ilícitas o para encubrir responsabilidades. Un atacante con acceso a los registros puede modificarlos, eliminarlos o crear registros falsos.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['T'],
    affected_asset_types: ['software', 'architecture'],
  },
  {
    code: 'A.4',
    name: 'Manipulación de la configuración',
    description:
      'Modificación deliberada de la configuración del sistema para alterar su funcionamiento o crear puertas traseras. La configuración incorrecta permite al atacante actuar fuera de los controles normales del sistema.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['hardware', 'software', 'communications', 'architecture'],
  },
  {
    code: 'A.5',
    name: 'Suplantación de la identidad del usuario',
    description:
      'El abuso de la confianza en el sistema o en la red por parte de un usuario que adopta la identidad de otro. Incluye ataques de phishing, secuestro de sesión, robo de credenciales y otras técnicas de suplantación de identidad.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C', 'A', 'T'],
    affected_asset_types: ['essential', 'software', 'architecture'],
  },
  {
    code: 'A.6',
    name: 'Abuso de privilegios de acceso',
    description:
      'Uso malintencionado de los privilegios asignados a un usuario. El usuario actúa de forma no prevista en sus funciones, utilizando su acceso legítimo para fines no autorizados o para acceder a información más allá de sus atribuciones.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['essential', 'software', 'architecture'],
  },
  {
    code: 'A.7',
    name: 'Uso no previsto',
    description:
      'Utilización de los recursos del sistema para fines no previstos, típicamente de interés personal: juegos, consultas personales en Internet, uso de aplicaciones no autorizadas, etc. Puede derivar en robo de información o instalación de malware.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['hardware', 'software', 'communications'],
  },
  {
    code: 'A.8',
    name: 'Difusión de software dañino',
    description:
      'Propagación intencionada de virus, espías (spyware), gusanos, troyanos, bombas lógicas, ransomware, etc. A diferencia de E.8, en este caso existe intención maliciosa de causar daño al sistema o a la información que contiene.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['software', 'hardware'],
  },
  {
    code: 'A.9',
    name: 'Reencaminamiento de mensajes',
    description:
      'Envío de información a destinos incorrectos de forma intencionada, a través de una intervención activa en los mecanismos de enrutamiento. Incluye ataques de envenenamiento de caché ARP/DNS y ataques man-in-the-middle.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['C', 'I'],
    affected_asset_types: ['communications'],
  },
  {
    code: 'A.10',
    name: 'Alteración de secuencia',
    description:
      'Alteración deliberada del orden de los mensajes transmitidos. El atacante intercepta y reordena los mensajes para provocar resultados incorrectos en el procesamiento o para realizar ataques de repetición de transacciones.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['I'],
    affected_asset_types: ['communications'],
  },
  {
    code: 'A.11',
    name: 'Acceso no autorizado',
    description:
      'El atacante consigue acceso a recursos del sistema sin estar autorizado para ello, bien mediante la explotación de vulnerabilidades técnicas, la obtención de credenciales ajenas o el acceso físico no autorizado a las instalaciones.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['essential', 'hardware', 'software', 'communications', 'architecture'],
  },
  {
    code: 'A.12',
    name: 'Análisis de tráfico',
    description:
      'Análisis del tráfico de comunicaciones para obtener información sobre quién se comunica con quién, cuándo, cuánto tiempo, y en qué forma, aunque el contenido de las comunicaciones esté cifrado.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['C'],
    affected_asset_types: ['communications'],
  },
  {
    code: 'A.13',
    name: 'Repudio',
    description:
      'Negación a posteriori de actuaciones o compromisos adquiridos en el pasado. El repudio pone en cuestión la validez de transacciones realizadas y puede comprometer la responsabilidad legal de las partes implicadas.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['T'],
    affected_asset_types: ['essential', 'architecture'],
  },
  {
    code: 'A.14',
    name: 'Interceptación de información (escucha)',
    description:
      'El atacante accede a información que no le está destinada sin alterar su contenido. Incluye la intercepción de comunicaciones cifradas para obtener claves, la captura de tráfico de red y otras formas de espionaje pasivo.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['C'],
    affected_asset_types: ['communications', 'hardware'],
  },
  {
    code: 'A.15',
    name: 'Modificación deliberada de la información',
    description:
      'Modificación deliberada de la información para causar daño o alterar decisiones basadas en ella. Incluye la manipulación de datos en bases de datos, la alteración de documentos y la modificación de mensajes en tránsito.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['I'],
    affected_asset_types: ['essential', 'software', 'media'],
  },
  {
    code: 'A.18',
    name: 'Destrucción de información',
    description:
      'Eliminación deliberada de información para causar daño a la organización. Incluye el borrado de bases de datos, la eliminación de copias de seguridad, la destrucción física de soportes y ataques de ransomware que cifran la información.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I'],
    affected_asset_types: ['essential', 'media'],
  },
  {
    code: 'A.19',
    name: 'Divulgación de información',
    description:
      'Revelación deliberada de información a personas no autorizadas para causas daño a la organización, obtener un beneficio económico o dañar la reputación. Incluye filtraciones de datos, publicación de información confidencial y venta de información a terceros.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['C'],
    affected_asset_types: ['essential', 'personnel'],
  },
  {
    code: 'A.22',
    name: 'Manipulación de programas',
    description:
      'Alteración del software de manera que realice tareas no previstas y, normalmente, dañinas para el sistema. Incluye la instalación de backdoors, la modificación de binarios, la inserción de código malicioso y los ataques a la cadena de suministro de software.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['software'],
  },
  {
    code: 'A.23',
    name: 'Manipulación de los equipos',
    description:
      'Alteración deliberada del hardware para causar fallos, crear puertas traseras o extraer información. Incluye la instalación de hardware espía (keyloggers físicos), la manipulación de firmware y la sustitución de componentes legítimos por componentes maliciosos.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C'],
    affected_asset_types: ['hardware'],
  },
  {
    code: 'A.24',
    name: 'Denegación de servicio',
    description:
      'La carencia de recursos suficientes provoca la caída del sistema cuando la carga de trabajo es intencionalmente desmesurada. Incluye ataques de denegación de servicio distribuido (DDoS), inundación de red y otras técnicas para agotar los recursos del sistema.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'software', 'communications'],
  },
  {
    code: 'A.25',
    name: 'Robo',
    description:
      'La sustracción de equipos provoca directamente la carencia de un medio para prestar los servicios, es decir, una indisponibilidad. Además, el robo puede llevar consigo una violación de la confidencialidad si los equipos robados contienen información sensible.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'C'],
    affected_asset_types: ['hardware', 'media'],
  },
  {
    code: 'A.26',
    name: 'Ataque destructivo',
    description:
      'Vandalismo, terrorismo, acción militar, etc. Se trata de daños físicos intencionados a los recursos del sistema, con el objetivo de impedir su uso o de causar daño a la organización objetivo.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D'],
    affected_asset_types: ['hardware', 'facilities', 'communications', 'auxiliary'],
  },
  {
    code: 'A.27',
    name: 'Ocupación enemiga',
    description:
      'Toma de control de la organización por parte de elementos hostiles. Incluye escenarios de conflicto armado, ocupación por parte de poderes hostiles y toma de control violenta de las instalaciones de la organización.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C', 'A', 'T'],
    affected_asset_types: ['facilities', 'personnel'],
  },
  {
    code: 'A.28',
    name: 'Indisponibilidad del personal',
    description:
      'La falta de disponibilidad del personal causada de forma deliberada. Incluye huelgas, conflictos laborales, amenazas al personal para que no acuda al trabajo y otros métodos para impedir el acceso del personal a sus puestos de trabajo.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D'],
    affected_asset_types: ['personnel'],
  },
  {
    code: 'A.29',
    name: 'Extorsión',
    description:
      'Presión que, mediante amenazas, se ejerce sobre alguien para obligarle a obrar en determinado sentido. La extorsión puede dirigirse a personas concretas para obligarles a realizar acciones dañinas para la organización o para obtener información sensible.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C', 'A', 'T'],
    affected_asset_types: ['personnel'],
  },
  {
    code: 'A.30',
    name: 'Ingeniería social (engaño)',
    description:
      'Abuso de la buena fe de las personas para que realicen actividades que interesan a un tercero. La ingeniería social explota la confianza, el miedo o la ignorancia de las personas para conseguir que realicen acciones que vulneran la seguridad del sistema.',
    origin: 'A',
    origin_label: 'Ataques deliberados',
    affected_dimensions: ['D', 'I', 'C', 'A', 'T'],
    affected_asset_types: ['personnel'],
  },
]

// --------------------------------------------
// 3. ESCALA DE FRECUENCIA
// --------------------------------------------

export interface MageritFrequencyLevel {
  value: number
  label: string
  description: string
  period: string
}

export const MAGERIT_FREQUENCY_SCALE: MageritFrequencyLevel[] = [
  {
    value: 0,
    label: 'Muy raro',
    description: 'Prácticamente imposible. Se esperaría que ocurriera en siglos.',
    period: 'Siglos',
  },
  {
    value: 1,
    label: 'Raro',
    description: 'Muy poco probable. Podría ocurrir alguna vez en décadas.',
    period: 'Décadas',
  },
  {
    value: 2,
    label: 'Infrecuente',
    description: 'Podría ocurrir alguna vez en el año.',
    period: 'Anual',
  },
  {
    value: 3,
    label: 'Normal',
    description: 'Es razonablemente esperable que ocurra. Podría ocurrir alguna vez al mes.',
    period: 'Mensual',
  },
  {
    value: 4,
    label: 'Frecuente',
    description: 'Es muy probable que ocurra. Podría ocurrir alguna vez a la semana.',
    period: 'Semanal',
  },
  {
    value: 5,
    label: 'Muy frecuente',
    description: 'Es casi seguro que ocurrirá. Podría ocurrir a diario.',
    period: 'Diario',
  },
]

// --------------------------------------------
// 4. ESCALA DE IMPACTO / VALOR
// --------------------------------------------

export interface MageritImpactLevel {
  value: number
  label: string
  description: string
}

export const MAGERIT_IMPACT_SCALE: MageritImpactLevel[] = [
  {
    value: 0,
    label: 'Irrelevante',
    description: 'El impacto es despreciable. No hay consecuencias apreciables.',
  },
  {
    value: 1,
    label: 'Muy bajo',
    description: 'El impacto es muy reducido. Las consecuencias son mínimas y fácilmente recuperables.',
  },
  {
    value: 2,
    label: 'Bajo',
    description: 'El impacto es reducido. Las consecuencias son menores y recuperables con esfuerzo normal.',
  },
  {
    value: 3,
    label: 'Medio',
    description: 'El impacto es moderado. Las consecuencias requieren un esfuerzo notable para ser recuperadas.',
  },
  {
    value: 4,
    label: 'Medio-alto',
    description: 'El impacto es importante. Las consecuencias son significativas y requieren recursos considerables.',
  },
  {
    value: 5,
    label: 'Alto',
    description: 'El impacto es alto. Las consecuencias son graves y pueden comprometer la operación normal.',
  },
  {
    value: 6,
    label: 'Alto+',
    description: 'El impacto es muy alto. Las consecuencias son muy graves y pueden comprometer la organización.',
  },
  {
    value: 7,
    label: 'Muy alto',
    description: 'El impacto es muy alto. Las consecuencias son extremadamente graves.',
  },
  {
    value: 8,
    label: 'Crítico',
    description: 'El impacto es crítico. Las consecuencias pueden ser catastróficas para la organización.',
  },
  {
    value: 9,
    label: 'Muy crítico',
    description: 'El impacto es muy crítico. Las consecuencias son catastróficas e irreversibles.',
  },
  {
    value: 10,
    label: 'Extremo',
    description: 'El impacto es extremo. Las consecuencias son absolutamente catastróficas e implican la destrucción de la organización.',
  },
]

// --------------------------------------------
// 5. UMBRALES DE NIVEL DE RIESGO
// --------------------------------------------

export interface RiskLevelThreshold {
  level: RiskLevel
  label: string
  min_value: number
  max_value: number
  color: string
  description: string
  recommended_action: string
}

export const RISK_LEVEL_THRESHOLDS: RiskLevelThreshold[] = [
  {
    level: 'very_low',
    label: 'Muy Bajo',
    min_value: 0,
    max_value: 5,
    color: '#22c55e',
    description: 'El riesgo es despreciable. No requiere atención especial.',
    recommended_action: 'Aceptar el riesgo. Monitorización rutinaria.',
  },
  {
    level: 'low',
    label: 'Bajo',
    min_value: 6,
    max_value: 15,
    color: '#84cc16',
    description: 'El riesgo es asumible con las salvaguardas actuales.',
    recommended_action: 'Mantener salvaguardas actuales. Revisión periódica.',
  },
  {
    level: 'medium',
    label: 'Medio',
    min_value: 16,
    max_value: 30,
    color: '#f59e0b',
    description: 'El riesgo requiere atención y posibles mejoras en los controles.',
    recommended_action: 'Implementar controles adicionales. Revisión trimestral.',
  },
  {
    level: 'high',
    label: 'Alto',
    min_value: 31,
    max_value: 60,
    color: '#f97316',
    description: 'El riesgo es significativo y requiere tratamiento prioritario.',
    recommended_action: 'Tratamiento urgente. Plan de mitigación inmediato.',
  },
  {
    level: 'critical',
    label: 'Crítico',
    min_value: 61,
    max_value: 100,
    color: '#ef4444',
    description: 'El riesgo es inaceptable y requiere acción inmediata.',
    recommended_action: 'Acción inmediata. Posible interrupción del servicio hasta mitigar.',
  },
]

// --------------------------------------------
// UTILIDADES DE CONSULTA
// --------------------------------------------

/**
 * Obtiene una amenaza por su código
 */
export function getThreatByCode(code: string): MageritThreat | undefined {
  return MAGERIT_THREAT_CATALOG.find((threat) => threat.code === code)
}

/**
 * Obtiene todas las amenazas de un origen específico
 */
export function getThreatsByOrigin(origin: ThreatOrigin): MageritThreat[] {
  return MAGERIT_THREAT_CATALOG.filter((threat) => threat.origin === origin)
}

/**
 * Obtiene todas las amenazas que afectan a un tipo de activo
 */
export function getThreatsByAssetType(assetType: AssetType): MageritThreat[] {
  return MAGERIT_THREAT_CATALOG.filter((threat) =>
    threat.affected_asset_types.includes(assetType),
  )
}

/**
 * Obtiene todas las amenazas que afectan a una dimensión de seguridad
 */
export function getThreatsByDimension(dimension: DimensionCode): MageritThreat[] {
  return MAGERIT_THREAT_CATALOG.filter((threat) =>
    threat.affected_dimensions.includes(dimension),
  )
}

/**
 * Obtiene el nivel de frecuencia por valor numérico
 */
export function getFrequencyLevel(value: number): MageritFrequencyLevel | undefined {
  return MAGERIT_FREQUENCY_SCALE.find((level) => level.value === value)
}

/**
 * Obtiene el nivel de impacto por valor numérico
 */
export function getImpactLevel(value: number): MageritImpactLevel | undefined {
  return MAGERIT_IMPACT_SCALE.find((level) => level.value === value)
}
