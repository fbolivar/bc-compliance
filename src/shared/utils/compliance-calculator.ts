// ============================================
// MOTOR DE CÁLCULO DE CUMPLIMIENTO
// Calcula el nivel de cumplimiento de marcos
// normativos a partir de controles implementados
// ============================================

import type { FrameworkCode } from '@/shared/constants/frameworks'

// --------------------------------------------
// TIPOS DE DOMINIO
// --------------------------------------------

export type ComplianceStatus =
  | 'compliant'         // Cumple completamente (>= 90%)
  | 'partial'           // Cumple parcialmente (>= 60% y < 90%)
  | 'non_compliant'     // No cumple (>= 20% y < 60%)
  | 'not_applicable'    // No aplica al contexto de la organización
  | 'not_assessed'      // No evaluado aún (< 20% o sin datos)

export type ControlImplementationStatus =
  | 'implemented'       // Implementado y operativo
  | 'partial'           // Implementado parcialmente
  | 'planned'           // Planificado pero no implementado
  | 'not_implemented'   // No implementado
  | 'not_applicable'    // No aplica

export interface FrameworkRequirement {
  id: string
  framework_code: FrameworkCode
  control_reference: string  // Ej: "ISO 27001 A.5.1", "NIST CSF ID.AM-1"
  title: string
  description: string
  is_mandatory: boolean
  weight: number             // Peso relativo (1-10) para cálculo ponderado
}

export interface ControlMapping {
  control_id: string
  requirement_id: string
  framework_code: FrameworkCode
  implementation_status: ControlImplementationStatus
  /** Porcentaje de implementación del control (0-100) */
  implementation_percentage: number
  evidence_available: boolean
  notes: string | null
  last_assessed_at: string | null
}

export interface RequirementComplianceResult {
  requirement_id: string
  control_reference: string
  title: string
  is_mandatory: boolean
  weight: number
  implementation_percentage: number
  status: ComplianceStatus
  mapped_controls_count: number
  evidence_count: number
}

export interface FrameworkComplianceResult {
  framework_code: FrameworkCode
  total_requirements: number
  assessed_requirements: number
  compliant_requirements: number
  partial_requirements: number
  non_compliant_requirements: number
  not_applicable_requirements: number
  not_assessed_requirements: number
  overall_percentage: number
  weighted_percentage: number
  status: ComplianceStatus
  requirement_results: RequirementComplianceResult[]
  mandatory_compliance_percentage: number
  gaps_count: number
}

export interface OverallComplianceResult {
  framework_code: FrameworkCode
  percentage: number
  weighted_percentage: number
  status: ComplianceStatus
  compliant_count: number
  total_count: number
}

export interface ControlCoverageResult {
  control_id: string
  frameworks_covered: FrameworkCode[]
  frameworks_covered_count: number
  requirements_covered: string[]
  requirements_covered_count: number
}

export interface GapAnalysisItem {
  requirement_id: string
  control_reference: string
  title: string
  current_percentage: number
  target_percentage: number
  gap_percentage: number
  is_mandatory: boolean
  weight: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  recommended_actions: string[]
}

export interface GapAnalysisResult {
  framework_code: FrameworkCode
  total_gaps: number
  critical_gaps: number
  high_priority_gaps: number
  medium_priority_gaps: number
  low_priority_gaps: number
  gaps: GapAnalysisItem[]
  estimated_effort_to_close: 'very_high' | 'high' | 'medium' | 'low'
}

// --------------------------------------------
// UMBRALES DE ESTADO DE CUMPLIMIENTO
// --------------------------------------------

const COMPLIANCE_THRESHOLDS = {
  compliant: 90,      // >= 90% => Cumple
  partial: 60,        // >= 60% y < 90% => Parcial
  non_compliant: 20,  // >= 20% y < 60% => No cumple
  // < 20% o sin datos => No evaluado
} as const

const GAP_PRIORITY_THRESHOLDS = {
  critical: 70,  // Más de 70% de brecha
  high: 50,      // 50-70% de brecha
  medium: 25,    // 25-50% de brecha
  // < 25% => Baja prioridad
} as const

// --------------------------------------------
// 1. ESTADO DE CUMPLIMIENTO
// --------------------------------------------

/**
 * Determina el estado de cumplimiento a partir de un porcentaje.
 *
 * @param percentage - Porcentaje de cumplimiento (0-100)
 * @returns Estado de cumplimiento cualitativo
 */
export function getComplianceStatus(percentage: number): ComplianceStatus {
  if (percentage < 0 || percentage > 100) {
    throw new Error(`El porcentaje debe estar entre 0 y 100. Recibido: ${percentage}`)
  }

  if (percentage >= COMPLIANCE_THRESHOLDS.compliant) {
    return 'compliant'
  }
  if (percentage >= COMPLIANCE_THRESHOLDS.partial) {
    return 'partial'
  }
  if (percentage >= COMPLIANCE_THRESHOLDS.non_compliant) {
    return 'non_compliant'
  }
  return 'not_assessed'
}

/**
 * Obtiene la etiqueta en español del estado de cumplimiento.
 *
 * @param status - Estado de cumplimiento
 * @returns Etiqueta en español
 */
export function getComplianceStatusLabel(status: ComplianceStatus): string {
  const labels: Record<ComplianceStatus, string> = {
    compliant: 'Cumple',
    partial: 'Cumplimiento Parcial',
    non_compliant: 'No Cumple',
    not_applicable: 'No Aplica',
    not_assessed: 'No Evaluado',
  }
  return labels[status]
}

/**
 * Obtiene el color asociado al estado de cumplimiento para uso en UI.
 *
 * @param status - Estado de cumplimiento
 * @returns Color en formato hexadecimal
 */
export function getComplianceStatusColor(status: ComplianceStatus): string {
  const colors: Record<ComplianceStatus, string> = {
    compliant: '#22c55e',
    partial: '#f59e0b',
    non_compliant: '#ef4444',
    not_applicable: '#6b7280',
    not_assessed: '#94a3b8',
  }
  return colors[status]
}

// --------------------------------------------
// 2. CUMPLIMIENTO POR REQUISITO
// --------------------------------------------

/**
 * Calcula el porcentaje de cumplimiento de un requisito individual
 * basándose en los controles mapeados a ese requisito.
 *
 * @param requirement - Requisito del marco
 * @param controlMappings - Todos los mapeos de controles disponibles
 * @returns Resultado de cumplimiento del requisito
 */
export function calculateRequirementCompliance(
  requirement: FrameworkRequirement,
  controlMappings: ControlMapping[],
): RequirementComplianceResult {
  // Filtrar mapeos relevantes para este requisito
  const relevantMappings = controlMappings.filter(
    (mapping) => mapping.requirement_id === requirement.id,
  )

  // Si no hay mapeos, el requisito no ha sido evaluado
  if (relevantMappings.length === 0) {
    return {
      requirement_id: requirement.id,
      control_reference: requirement.control_reference,
      title: requirement.title,
      is_mandatory: requirement.is_mandatory,
      weight: requirement.weight,
      implementation_percentage: 0,
      status: 'not_assessed',
      mapped_controls_count: 0,
      evidence_count: 0,
    }
  }

  // Filtrar controles "no aplica" - si TODOS son no_applicable, marcar así
  const applicableMappings = relevantMappings.filter(
    (m) => m.implementation_status !== 'not_applicable',
  )

  if (applicableMappings.length === 0) {
    return {
      requirement_id: requirement.id,
      control_reference: requirement.control_reference,
      title: requirement.title,
      is_mandatory: requirement.is_mandatory,
      weight: requirement.weight,
      implementation_percentage: 100,
      status: 'not_applicable',
      mapped_controls_count: relevantMappings.length,
      evidence_count: 0,
    }
  }

  // Calcular porcentaje promedio de implementación de controles aplicables
  const totalImplementation = applicableMappings.reduce(
    (sum, mapping) => sum + mapping.implementation_percentage,
    0,
  )
  const averageImplementation = totalImplementation / applicableMappings.length
  const roundedPercentage = Math.round(averageImplementation * 100) / 100

  // Contar controles con evidencia disponible
  const evidenceCount = applicableMappings.filter((m) => m.evidence_available).length

  return {
    requirement_id: requirement.id,
    control_reference: requirement.control_reference,
    title: requirement.title,
    is_mandatory: requirement.is_mandatory,
    weight: requirement.weight,
    implementation_percentage: roundedPercentage,
    status: getComplianceStatus(roundedPercentage),
    mapped_controls_count: applicableMappings.length,
    evidence_count: evidenceCount,
  }
}

// --------------------------------------------
// 3. CUMPLIMIENTO DE MARCO COMPLETO
// --------------------------------------------

/**
 * Calcula el cumplimiento completo de un marco normativo.
 *
 * Calcula tanto el porcentaje simple (promedio aritmético) como el
 * porcentaje ponderado (promedio ponderado por el peso de cada requisito).
 *
 * @param requirements - Todos los requisitos del marco
 * @param controlMappings - Mapeos de controles a requisitos
 * @returns Resultado completo de cumplimiento del marco
 */
export function calculateFrameworkCompliance(
  requirements: FrameworkRequirement[],
  controlMappings: ControlMapping[],
): FrameworkComplianceResult {
  if (requirements.length === 0) {
    throw new Error('El marco debe tener al menos un requisito')
  }

  const frameworkCode = requirements[0].framework_code

  // Calcular cumplimiento de cada requisito
  const requirementResults = requirements.map((req) =>
    calculateRequirementCompliance(req, controlMappings),
  )

  // Filtrar requisitos por estado para estadísticas
  const assessedResults = requirementResults.filter(
    (r) => r.status !== 'not_assessed' && r.status !== 'not_applicable',
  )
  const compliantResults = requirementResults.filter((r) => r.status === 'compliant')
  const partialResults = requirementResults.filter((r) => r.status === 'partial')
  const nonCompliantResults = requirementResults.filter(
    (r) => r.status === 'non_compliant',
  )
  const notApplicableResults = requirementResults.filter(
    (r) => r.status === 'not_applicable',
  )
  const notAssessedResults = requirementResults.filter(
    (r) => r.status === 'not_assessed',
  )

  // Calcular porcentaje simple (sobre requisitos evaluados y aplicables)
  let overallPercentage = 0
  if (assessedResults.length > 0) {
    const totalPercentage = assessedResults.reduce(
      (sum, r) => sum + r.implementation_percentage,
      0,
    )
    overallPercentage = Math.round((totalPercentage / assessedResults.length) * 100) / 100
  }

  // Calcular porcentaje ponderado
  let weightedPercentage = 0
  const eligibleForWeight = requirementResults.filter(
    (r) => r.status !== 'not_applicable',
  )
  if (eligibleForWeight.length > 0) {
    const totalWeight = eligibleForWeight.reduce((sum, r) => sum + r.weight, 0)
    const weightedSum = eligibleForWeight.reduce(
      (sum, r) => sum + r.implementation_percentage * r.weight,
      0,
    )
    if (totalWeight > 0) {
      weightedPercentage = Math.round((weightedSum / totalWeight) * 100) / 100
    }
  }

  // Calcular cumplimiento de requisitos obligatorios
  const mandatoryRequirements = requirementResults.filter(
    (r) => r.is_mandatory && r.status !== 'not_applicable',
  )
  let mandatoryCompliancePercentage = 0
  if (mandatoryRequirements.length > 0) {
    const mandatoryTotal = mandatoryRequirements.reduce(
      (sum, r) => sum + r.implementation_percentage,
      0,
    )
    mandatoryCompliancePercentage =
      Math.round((mandatoryTotal / mandatoryRequirements.length) * 100) / 100
  }

  // Contar brechas (requisitos no conformes o parcialmente conformes)
  const gapsCount = nonCompliantResults.length + partialResults.length

  return {
    framework_code: frameworkCode,
    total_requirements: requirements.length,
    assessed_requirements: assessedResults.length,
    compliant_requirements: compliantResults.length,
    partial_requirements: partialResults.length,
    non_compliant_requirements: nonCompliantResults.length,
    not_applicable_requirements: notApplicableResults.length,
    not_assessed_requirements: notAssessedResults.length,
    overall_percentage: overallPercentage,
    weighted_percentage: weightedPercentage,
    status: getComplianceStatus(overallPercentage),
    requirement_results: requirementResults,
    mandatory_compliance_percentage: mandatoryCompliancePercentage,
    gaps_count: gapsCount,
  }
}

// --------------------------------------------
// 4. CUMPLIMIENTO GLOBAL DE MÚLTIPLES MARCOS
// --------------------------------------------

/**
 * Calcula el resumen de cumplimiento para múltiples marcos normativos.
 *
 * @param frameworkResults - Resultados de cumplimiento por marco
 * @returns Array con el resumen de cumplimiento por marco
 */
export function calculateOverallCompliance(
  frameworkResults: FrameworkComplianceResult[],
): OverallComplianceResult[] {
  return frameworkResults.map((result) => ({
    framework_code: result.framework_code,
    percentage: result.overall_percentage,
    weighted_percentage: result.weighted_percentage,
    status: result.status,
    compliant_count: result.compliant_requirements,
    total_count: result.total_requirements - result.not_applicable_requirements,
  }))
}

// --------------------------------------------
// 5. COBERTURA DE CONTROLES
// --------------------------------------------

/**
 * Calcula cuántos marcos y requisitos cubre un control específico.
 *
 * @param controlId - ID del control
 * @param requirementMappings - Todos los mapeos de controles a requisitos
 * @returns Resultado de cobertura del control
 */
export function calculateControlCoverage(
  controlId: string,
  requirementMappings: ControlMapping[],
): ControlCoverageResult {
  // Obtener todos los mapeos de este control
  const controlMappings = requirementMappings.filter(
    (mapping) => mapping.control_id === controlId,
  )

  // Obtener marcos únicos cubiertos
  const frameworksCovered = [
    ...new Set(controlMappings.map((m) => m.framework_code)),
  ]

  // Obtener requisitos únicos cubiertos
  const requirementsCovered = [
    ...new Set(controlMappings.map((m) => m.requirement_id)),
  ]

  return {
    control_id: controlId,
    frameworks_covered: frameworksCovered,
    frameworks_covered_count: frameworksCovered.length,
    requirements_covered: requirementsCovered,
    requirements_covered_count: requirementsCovered.length,
  }
}

// --------------------------------------------
// 6. ANÁLISIS DE BRECHAS
// --------------------------------------------

/**
 * Determina la prioridad de una brecha basándose en el porcentaje de brecha
 * y si el requisito es obligatorio.
 *
 * @param gapPercentage - Porcentaje de brecha (0-100)
 * @param isMandatory - Si el requisito es obligatorio
 * @param weight - Peso del requisito
 * @returns Prioridad de la brecha
 */
function determineGapPriority(
  gapPercentage: number,
  isMandatory: boolean,
  weight: number,
): 'critical' | 'high' | 'medium' | 'low' {
  // Requisitos obligatorios con brecha alta son siempre críticos
  if (isMandatory && gapPercentage >= GAP_PRIORITY_THRESHOLDS.high) {
    return 'critical'
  }

  if (gapPercentage >= GAP_PRIORITY_THRESHOLDS.critical) {
    return isMandatory ? 'critical' : 'high'
  }

  if (gapPercentage >= GAP_PRIORITY_THRESHOLDS.high) {
    return weight >= 7 ? 'high' : 'medium'
  }

  if (gapPercentage >= GAP_PRIORITY_THRESHOLDS.medium) {
    return 'medium'
  }

  return 'low'
}

/**
 * Genera recomendaciones de acciones para cerrar una brecha.
 *
 * @param gapPercentage - Porcentaje de brecha
 * @param isMandatory - Si el requisito es obligatorio
 * @param controlReference - Referencia del control del marco
 * @returns Array de acciones recomendadas
 */
function generateRecommendedActions(
  gapPercentage: number,
  isMandatory: boolean,
  controlReference: string,
): string[] {
  const actions: string[] = []

  if (gapPercentage >= 80) {
    actions.push(`Implementar controles para ${controlReference} desde cero con máxima prioridad`)
    actions.push('Asignar responsable y recursos dedicados')
    actions.push('Establecer fecha límite de implementación urgente')
  } else if (gapPercentage >= 50) {
    actions.push(`Completar implementación parcial de ${controlReference}`)
    actions.push('Revisar controles existentes y reforzar los que presenten deficiencias')
    actions.push('Documentar plan de acción con hitos trimestrales')
  } else if (gapPercentage >= 25) {
    actions.push(`Reforzar controles existentes para ${controlReference}`)
    actions.push('Recopilar evidencias de controles ya implementados')
    actions.push('Identificar y cerrar brechas específicas de implementación')
  } else {
    actions.push(`Completar documentación y evidencias para ${controlReference}`)
    actions.push('Validar efectividad de controles implementados')
  }

  if (isMandatory) {
    actions.push('OBLIGATORIO: Este requisito es mandatorio para el cumplimiento del marco')
  }

  return actions
}

/**
 * Realiza el análisis de brechas para un marco normativo.
 *
 * Identifica todos los requisitos que no alcanzan el nivel de cumplimiento
 * objetivo y los prioriza para su tratamiento.
 *
 * @param framework - Resultado de cumplimiento del marco
 * @param targetPercentage - Porcentaje objetivo de cumplimiento (default: 100%)
 * @returns Resultado del análisis de brechas
 */
export function calculateGapAnalysis(
  framework: FrameworkComplianceResult,
  targetPercentage: number = 100,
): GapAnalysisResult {
  if (targetPercentage < 0 || targetPercentage > 100) {
    throw new Error(
      `El porcentaje objetivo debe estar entre 0 y 100. Recibido: ${targetPercentage}`,
    )
  }

  // Identificar requisitos con brechas (excluir los no aplicables)
  const requirementsWithGaps = framework.requirement_results.filter(
    (req) =>
      req.status !== 'not_applicable' &&
      req.implementation_percentage < targetPercentage,
  )

  // Construir análisis de cada brecha
  const gaps: GapAnalysisItem[] = requirementsWithGaps.map((req) => {
    const gapPercentage = Math.round(
      (targetPercentage - req.implementation_percentage) * 100,
    ) / 100
    const priority = determineGapPriority(gapPercentage, req.is_mandatory, req.weight)
    const recommendedActions = generateRecommendedActions(
      gapPercentage,
      req.is_mandatory,
      req.control_reference,
    )

    return {
      requirement_id: req.requirement_id,
      control_reference: req.control_reference,
      title: req.title,
      current_percentage: req.implementation_percentage,
      target_percentage: targetPercentage,
      gap_percentage: gapPercentage,
      is_mandatory: req.is_mandatory,
      weight: req.weight,
      priority,
      recommended_actions: recommendedActions,
    }
  })

  // Ordenar por prioridad y luego por porcentaje de brecha descendente
  const priorityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  gaps.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return b.gap_percentage - a.gap_percentage
  })

  // Contar brechas por prioridad
  const criticalGaps = gaps.filter((g) => g.priority === 'critical').length
  const highGaps = gaps.filter((g) => g.priority === 'high').length
  const mediumGaps = gaps.filter((g) => g.priority === 'medium').length
  const lowGaps = gaps.filter((g) => g.priority === 'low').length

  // Estimar esfuerzo para cerrar brechas
  let estimatedEffort: 'very_high' | 'high' | 'medium' | 'low'
  const totalGapScore = gaps.reduce((sum, g) => sum + g.gap_percentage * g.weight, 0)
  if (totalGapScore > 500 || criticalGaps > 5) {
    estimatedEffort = 'very_high'
  } else if (totalGapScore > 200 || criticalGaps > 2) {
    estimatedEffort = 'high'
  } else if (totalGapScore > 50 || highGaps > 3) {
    estimatedEffort = 'medium'
  } else {
    estimatedEffort = 'low'
  }

  return {
    framework_code: framework.framework_code,
    total_gaps: gaps.length,
    critical_gaps: criticalGaps,
    high_priority_gaps: highGaps,
    medium_priority_gaps: mediumGaps,
    low_priority_gaps: lowGaps,
    gaps,
    estimated_effort_to_close: estimatedEffort,
  }
}

// --------------------------------------------
// 7. UTILIDADES ADICIONALES
// --------------------------------------------

/**
 * Calcula la tendencia de cumplimiento comparando dos períodos.
 *
 * @param current - Porcentaje de cumplimiento actual
 * @param previous - Porcentaje de cumplimiento del período anterior
 * @returns Objeto con variación y tendencia
 */
export function calculateComplianceTrend(
  current: number,
  previous: number,
): {
  variation: number
  trend: 'improving' | 'stable' | 'declining'
  trend_label: string
} {
  const variation = Math.round((current - previous) * 100) / 100

  let trend: 'improving' | 'stable' | 'declining'
  let trendLabel: string

  if (variation > 2) {
    trend = 'improving'
    trendLabel = 'Mejorando'
  } else if (variation < -2) {
    trend = 'declining'
    trendLabel = 'Deteriorando'
  } else {
    trend = 'stable'
    trendLabel = 'Estable'
  }

  return { variation, trend, trend_label: trendLabel }
}

/**
 * Calcula el porcentaje de cumplimiento requerido adicional
 * para alcanzar un estado objetivo.
 *
 * @param currentPercentage - Porcentaje actual de cumplimiento
 * @param targetStatus - Estado objetivo de cumplimiento
 * @returns Porcentaje adicional requerido para alcanzar el estado objetivo
 */
export function calculateRequiredImprovementForStatus(
  currentPercentage: number,
  targetStatus: Exclude<ComplianceStatus, 'not_applicable' | 'not_assessed'>,
): number {
  const targetPercentages: Record<
    Exclude<ComplianceStatus, 'not_applicable' | 'not_assessed'>,
    number
  > = {
    compliant: COMPLIANCE_THRESHOLDS.compliant,
    partial: COMPLIANCE_THRESHOLDS.partial,
    non_compliant: COMPLIANCE_THRESHOLDS.non_compliant,
  }

  const targetValue = targetPercentages[targetStatus]
  const required = targetValue - currentPercentage
  return Math.max(0, Math.round(required * 100) / 100)
}

/**
 * Genera un resumen ejecutivo del cumplimiento para reportes de dirección.
 *
 * @param frameworkResults - Resultados de cumplimiento de todos los marcos
 * @returns Resumen ejecutivo
 */
export function generateComplianceSummary(frameworkResults: FrameworkComplianceResult[]): {
  total_frameworks: number
  fully_compliant: number
  partially_compliant: number
  non_compliant: number
  not_assessed: number
  average_compliance_percentage: number
  total_critical_gaps: number
  total_high_priority_gaps: number
  overall_status: ComplianceStatus
} {
  if (frameworkResults.length === 0) {
    return {
      total_frameworks: 0,
      fully_compliant: 0,
      partially_compliant: 0,
      non_compliant: 0,
      not_assessed: 0,
      average_compliance_percentage: 0,
      total_critical_gaps: 0,
      total_high_priority_gaps: 0,
      overall_status: 'not_assessed',
    }
  }

  const fullyCompliant = frameworkResults.filter((r) => r.status === 'compliant').length
  const partiallyCompliant = frameworkResults.filter((r) => r.status === 'partial').length
  const nonCompliant = frameworkResults.filter((r) => r.status === 'non_compliant').length
  const notAssessed = frameworkResults.filter((r) => r.status === 'not_assessed').length

  const totalPercentage = frameworkResults.reduce(
    (sum, r) => sum + r.overall_percentage,
    0,
  )
  const averagePercentage =
    Math.round((totalPercentage / frameworkResults.length) * 100) / 100

  // Calcular brechas críticas y de alta prioridad sumando los requisitos no conformes
  const totalCriticalGaps = frameworkResults.reduce(
    (sum, r) =>
      sum +
      r.requirement_results.filter(
        (req) => req.is_mandatory && req.status === 'non_compliant',
      ).length,
    0,
  )
  const totalHighPriorityGaps = frameworkResults.reduce(
    (sum, r) =>
      sum + r.requirement_results.filter((req) => req.status === 'non_compliant').length,
    0,
  )

  return {
    total_frameworks: frameworkResults.length,
    fully_compliant: fullyCompliant,
    partially_compliant: partiallyCompliant,
    non_compliant: nonCompliant,
    not_assessed: notAssessed,
    average_compliance_percentage: averagePercentage,
    total_critical_gaps: totalCriticalGaps,
    total_high_priority_gaps: totalHighPriorityGaps,
    overall_status: getComplianceStatus(averagePercentage),
  }
}
