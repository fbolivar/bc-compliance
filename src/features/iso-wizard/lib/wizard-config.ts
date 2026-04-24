export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'not_applicable';
export type PhaseStatus = 'pending' | 'in_progress' | 'completed';

export interface WizardTask {
  key: string;
  label: string;
  description: string;
  isoClause: string;
  linkedEntityType?: 'document' | 'policy' | 'risk';
}

export interface WizardPhase {
  number: number;
  title: string;
  subtitle: string;
  isoClause: string;
  icon: string;
  color: string;
  tasks: WizardTask[];
}

export const WIZARD_PHASES: WizardPhase[] = [
  {
    number: 1,
    title: 'Contexto de la Organización',
    subtitle: 'Comprensión del entorno interno y externo',
    isoClause: '4.1 – 4.2',
    icon: 'Building2',
    color: 'sky',
    tasks: [
      { key: 'p1_internal_context', label: 'Análisis del contexto interno', description: 'Documentar la misión, visión, estructura organizacional, cultura y capacidades que pueden afectar el SGSI.', isoClause: '4.1', linkedEntityType: 'document' },
      { key: 'p1_external_context', label: 'Análisis del contexto externo', description: 'Identificar factores legales, regulatorios, tecnológicos, competitivos y sociales del entorno.', isoClause: '4.1', linkedEntityType: 'document' },
      { key: 'p1_interested_parties', label: 'Identificación de partes interesadas', description: 'Listar stakeholders y sus requisitos relevantes para el SGSI.', isoClause: '4.2', linkedEntityType: 'document' },
      { key: 'p1_scope_definition', label: 'Definición del alcance del SGSI', description: 'Determinar los límites y aplicabilidad del SGSI considerando interfaces y dependencias.', isoClause: '4.3', linkedEntityType: 'document' },
      { key: 'p1_scope_document_approved', label: 'Documento de alcance aprobado', description: 'El documento de alcance debe ser revisado y aprobado formalmente por la dirección.', isoClause: '4.3', linkedEntityType: 'document' },
      { key: 'p1_legal_register', label: 'Registro de requisitos legales y regulatorios', description: 'Identificar y documentar las leyes, reglamentos y acuerdos contractuales aplicables.', isoClause: '4.2', linkedEntityType: 'document' },
    ],
  },
  {
    number: 2,
    title: 'Liderazgo',
    subtitle: 'Compromiso de la dirección y política del SGSI',
    isoClause: '5.1 – 5.3',
    icon: 'Users',
    color: 'violet',
    tasks: [
      { key: 'p2_management_commitment', label: 'Acta de compromiso de la dirección', description: 'La alta dirección debe emitir un acta o comunicado formal de compromiso con el SGSI.', isoClause: '5.1', linkedEntityType: 'document' },
      { key: 'p2_isms_policy', label: 'Política del SGSI aprobada', description: 'Redactar y aprobar la Política de Seguridad de la Información.', isoClause: '5.2', linkedEntityType: 'policy' },
      { key: 'p2_policy_communicated', label: 'Política comunicada a toda la organización', description: 'Evidenciar que la política fue comunicada a empleados, contratistas y partes interesadas.', isoClause: '5.2' },
      { key: 'p2_roles_responsibilities', label: 'Roles y responsabilidades asignados', description: 'Designar el CISO o Responsable de Seguridad y definir responsabilidades en el SGSI.', isoClause: '5.3', linkedEntityType: 'document' },
      { key: 'p2_isms_committee', label: 'Comité de seguridad constituido', description: 'Formar el comité de seguridad con representantes de áreas clave.', isoClause: '5.1', linkedEntityType: 'document' },
      { key: 'p2_objectives_defined', label: 'Objetivos de seguridad definidos y medibles', description: 'Establecer objetivos de seguridad con métricas, responsables y plazos.', isoClause: '6.2', linkedEntityType: 'document' },
    ],
  },
  {
    number: 3,
    title: 'Planificación',
    subtitle: 'Evaluación de riesgos y oportunidades',
    isoClause: '6.1 – 6.2',
    icon: 'ShieldAlert',
    color: 'amber',
    tasks: [
      { key: 'p3_risk_methodology', label: 'Metodología de evaluación de riesgos documentada', description: 'Definir los criterios de aceptación de riesgos y el proceso de evaluación (MAGERIT, ISO 31000, etc.).', isoClause: '6.1.2', linkedEntityType: 'document' },
      { key: 'p3_asset_inventory', label: 'Inventario de activos de información completo', description: 'Identificar y clasificar todos los activos de información en el alcance del SGSI.', isoClause: '6.1.2', linkedEntityType: 'document' },
      { key: 'p3_risk_assessment', label: 'Evaluación de riesgos ejecutada', description: 'Completar la evaluación de riesgos identificando amenazas, vulnerabilidades, probabilidad e impacto.', isoClause: '6.1.2', linkedEntityType: 'risk' },
      { key: 'p3_risk_register', label: 'Registro de riesgos actualizado', description: 'El registro de riesgos debe reflejar el resultado de la evaluación con niveles inherente y residual.', isoClause: '6.1.2', linkedEntityType: 'risk' },
      { key: 'p3_risk_treatment_plan', label: 'Plan de tratamiento de riesgos elaborado', description: 'Para cada riesgo, definir la opción de tratamiento y las acciones concretas.', isoClause: '6.1.3', linkedEntityType: 'risk' },
      { key: 'p3_risk_owners_assigned', label: 'Propietarios de riesgo asignados', description: 'Cada riesgo debe tener un propietario responsable de su gestión.', isoClause: '6.1.2' },
      { key: 'p3_soa_draft', label: 'Declaración de Aplicabilidad (SOA) borrador', description: 'Generar el borrador del SOA seleccionando controles del Anexo A aplicables.', isoClause: '6.1.3', linkedEntityType: 'document' },
    ],
  },
  {
    number: 4,
    title: 'Soporte',
    subtitle: 'Recursos, competencia y documentación',
    isoClause: '7.1 – 7.5',
    icon: 'BookOpen',
    color: 'emerald',
    tasks: [
      { key: 'p4_resources_plan', label: 'Plan de recursos del SGSI aprobado', description: 'Presupuesto, herramientas y personal necesarios para el SGSI, aprobados por la dirección.', isoClause: '7.1', linkedEntityType: 'document' },
      { key: 'p4_competence_matrix', label: 'Matriz de competencias y capacitación', description: 'Identificar las competencias requeridas para el SGSI y planificar formación.', isoClause: '7.2', linkedEntityType: 'document' },
      { key: 'p4_awareness_program', label: 'Programa de concienciación ejecutado', description: 'Realizar sesiones de sensibilización en seguridad para todo el personal.', isoClause: '7.3', linkedEntityType: 'document' },
      { key: 'p4_document_control_procedure', label: 'Procedimiento de control de documentos', description: 'Establecer el proceso para crear, actualizar, aprobar y distribuir documentos del SGSI.', isoClause: '7.5', linkedEntityType: 'policy' },
      { key: 'p4_mandatory_docs_in_place', label: 'Documentación obligatoria de la norma creada', description: 'Asegurar los documentos mínimos exigidos: política, SOA, metodología de riesgos.', isoClause: '7.5', linkedEntityType: 'document' },
      { key: 'p4_communication_plan', label: 'Plan de comunicación interna y externa', description: 'Definir qué comunicar sobre el SGSI, a quién, cuándo y por qué canal.', isoClause: '7.4', linkedEntityType: 'document' },
    ],
  },
  {
    number: 5,
    title: 'Operación',
    subtitle: 'Tratamiento de riesgos y controles Anexo A',
    isoClause: '8.1 – 8.3',
    icon: 'Shield',
    color: 'rose',
    tasks: [
      { key: 'p5_risk_treatment_implemented', label: 'Controles del plan de tratamiento implementados', description: 'Ejecutar las acciones de tratamiento e implementar los controles seleccionados del Anexo A.', isoClause: '8.3', linkedEntityType: 'risk' },
      { key: 'p5_soa_finalized', label: 'SOA finalizada y aprobada por la dirección', description: 'La Declaración de Aplicabilidad completa debe estar aprobada formalmente.', isoClause: '6.1.3', linkedEntityType: 'document' },
      { key: 'p5_operational_procedures', label: 'Procedimientos operativos de seguridad documentados', description: 'Procesos clave como gestión de accesos, backups, gestión de incidentes deben estar documentados.', isoClause: '8.1', linkedEntityType: 'policy' },
      { key: 'p5_supplier_security', label: 'Seguridad en la cadena de suministro evaluada', description: 'Evaluar y documentar los requisitos de seguridad para proveedores y terceros.', isoClause: '8.1', linkedEntityType: 'document' },
      { key: 'p5_incident_management', label: 'Proceso de gestión de incidentes operativo', description: 'Asegurar que el procedimiento de respuesta a incidentes está activo y el personal lo conoce.', isoClause: '8.1', linkedEntityType: 'policy' },
      { key: 'p5_bcp_in_place', label: 'Plan de continuidad del negocio definido', description: 'Documentar el plan de continuidad de negocio para los servicios críticos en el alcance.', isoClause: '8.1', linkedEntityType: 'document' },
      { key: 'p5_risk_treatment_approved', label: 'Riesgos residuales aceptados por propietarios', description: 'Los propietarios de riesgo deben aceptar formalmente los riesgos residuales.', isoClause: '8.3' },
    ],
  },
  {
    number: 6,
    title: 'Evaluación del Desempeño',
    subtitle: 'Auditorías internas y revisión por la dirección',
    isoClause: '9.1 – 9.3',
    icon: 'ClipboardCheck',
    color: 'indigo',
    tasks: [
      { key: 'p6_monitoring_metrics', label: 'Métricas de desempeño del SGSI definidas', description: 'Determinar qué medir, con qué métodos, cuándo y quién analiza los resultados.', isoClause: '9.1', linkedEntityType: 'document' },
      { key: 'p6_internal_audit_program', label: 'Programa de auditoría interna elaborado', description: 'Planificar el ciclo de auditorías internas con alcance, criterios, frecuencia y auditores.', isoClause: '9.2', linkedEntityType: 'document' },
      { key: 'p6_first_internal_audit', label: 'Primera auditoría interna ejecutada', description: 'Completar la primera ronda de auditoría interna y documentar el informe.', isoClause: '9.2', linkedEntityType: 'document' },
      { key: 'p6_audit_findings_logged', label: 'Hallazgos de auditoría registrados como NC', description: 'Los hallazgos deben generar no conformidades trazadas en el sistema.', isoClause: '9.2' },
      { key: 'p6_management_review', label: 'Revisión por la dirección realizada', description: 'La alta dirección debe revisar el SGSI evaluando resultados de auditorías, riesgos y desempeño.', isoClause: '9.3', linkedEntityType: 'document' },
      { key: 'p6_management_review_minutes', label: 'Acta de revisión por la dirección aprobada', description: 'El acta debe registrar temas, decisiones y acciones acordadas.', isoClause: '9.3', linkedEntityType: 'document' },
    ],
  },
  {
    number: 7,
    title: 'Mejora Continua',
    subtitle: 'No conformidades y mejora del SGSI',
    isoClause: '10.1 – 10.2',
    icon: 'TrendingUp',
    color: 'teal',
    tasks: [
      { key: 'p7_nc_process_operational', label: 'Proceso de gestión de no conformidades activo', description: 'Asegurar que el proceso para identificar, registrar y cerrar no conformidades está funcionando.', isoClause: '10.2' },
      { key: 'p7_corrective_actions_tracked', label: 'Acciones correctivas con seguimiento', description: 'Todas las NC abiertas deben tener acción correctiva asignada con responsable y fecha de cierre.', isoClause: '10.2' },
      { key: 'p7_improvement_opportunities', label: 'Oportunidades de mejora identificadas', description: 'Documentar oportunidades de mejora identificadas en auditorías y monitoreo.', isoClause: '10.1', linkedEntityType: 'document' },
      { key: 'p7_continual_improvement_plan', label: 'Plan de mejora continua del SGSI documentado', description: 'Formalizar el plan de mejora con acciones, recursos, plazos y KPIs.', isoClause: '10.1', linkedEntityType: 'document' },
      { key: 'p7_isms_updated_post_review', label: 'SGSI actualizado con resultados de la revisión', description: 'Las decisiones de la revisión por la dirección se reflejan en actualizaciones del SGSI.', isoClause: '10.1' },
      { key: 'p7_certification_readiness', label: 'Evaluación de preparación para certificación', description: 'Realizar una evaluación de brecha final (pre-auditoría) para la auditoría de certificación.', isoClause: '10.2', linkedEntityType: 'document' },
    ],
  },
];

export const TASK_MAP: Record<string, WizardTask & { phaseNumber: number }> = {};
for (const phase of WIZARD_PHASES) {
  for (const task of phase.tasks) {
    TASK_MAP[task.key] = { ...task, phaseNumber: phase.number };
  }
}

export const TOTAL_TASKS = WIZARD_PHASES.reduce((sum, p) => sum + p.tasks.length, 0);
