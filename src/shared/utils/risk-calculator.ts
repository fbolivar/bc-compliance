// ============================================
// MOTOR DE CÁLCULO DE RIESGOS MAGERIT 3.0
// Implementa la metodología de análisis y
// gestión de riesgos según MAGERIT v3.0
// ============================================

import {
  type DimensionCode,
  type RiskLevel,
  MAGERIT_DIMENSIONS,
  MAGERIT_FREQUENCY_SCALE,
  MAGERIT_IMPACT_SCALE,
  RISK_LEVEL_THRESHOLDS,
  type MageritThreat,
  type AssetType,
} from '@/shared/constants/magerit'

// --------------------------------------------
// TIPOS DE DOMINIO PARA CÁLCULO DE RIESGOS
// --------------------------------------------

export interface Asset {
  id: string
  name: string
  asset_type: AssetType
  /** Valor del activo en escala 0-10 por dimensión */
  value_dimensions: Partial<Record<DimensionCode, number>>
}

export interface ThreatDegradation {
  /** Código de la dimensión afectada */
  dimension: DimensionCode
  /** Porcentaje de degradación que la amenaza causa sobre la dimensión (0-100) */
  degradation_percentage: number
}

export interface RiskScenario {
  id: string
  asset_id: string
  threat_code: string
  threat: MageritThreat
  /** Frecuencia en escala MAGERIT 0-5 */
  frequency: number
  /** Degradación por dimensión */
  degradations: ThreatDegradation[]
}

export interface ControlWithEffectiveness {
  id: string
  name: string
  /** Efectividad del control en porcentaje (0-100) */
  effectiveness_percentage: number
  /** Dimensiones que cubre el control */
  covers_dimensions: DimensionCode[]
}

export interface DimensionImpact {
  dimension: DimensionCode
  dimension_name: string
  /** Valor del activo en esta dimensión */
  asset_value: number
  /** Porcentaje de degradación */
  degradation_percentage: number
  /** Impacto calculado = valor_activo * (degradación / 100) */
  impact_value: number
}

export interface PotentialRiskByDimension {
  dimension: DimensionCode
  dimension_name: string
  impact_value: number
  frequency: number
  risk_value: number
}

export interface ResidualRiskByDimension {
  dimension: DimensionCode
  dimension_name: string
  potential_risk: number
  safeguard_effectiveness: number
  residual_risk_value: number
  risk_level: RiskLevel
  risk_level_label: string
}

export interface CompleteRiskCalculation {
  scenario_id: string
  asset_id: string
  asset_name: string
  threat_code: string
  threat_name: string
  frequency: number
  frequency_label: string
  /** Impactos por dimensión */
  impacts: DimensionImpact[]
  /** Impacto máximo entre todas las dimensiones afectadas */
  max_impact: number
  /** Riesgos potenciales por dimensión */
  potential_risks: PotentialRiskByDimension[]
  /** Riesgo potencial máximo (peor caso) */
  max_potential_risk: number
  /** Efectividad promedio de salvaguardas */
  safeguard_effectiveness: number
  /** Riesgos residuales por dimensión */
  residual_risks: ResidualRiskByDimension[]
  /** Riesgo residual máximo (peor caso) */
  max_residual_risk: number
  /** Nivel de riesgo residual global */
  risk_level: RiskLevel
  risk_level_label: string
  /** Valor normalizado de riesgo residual (0-100) para reportes */
  normalized_risk_score: number
}

// --------------------------------------------
// 1. CÁLCULO DE IMPACTO
// --------------------------------------------

/**
 * Calcula el impacto de una amenaza sobre un activo en una dimensión específica.
 *
 * Fórmula MAGERIT: Impacto = Valor_Activo * (Degradación / 100)
 *
 * @param assetValue - Valor del activo en la dimensión (0-10)
 * @param degradation - Porcentaje de degradación de la amenaza (0-100)
 * @returns Valor de impacto (0-10)
 */
export function calculateImpact(assetValue: number, degradation: number): number {
  if (assetValue < 0 || assetValue > 10) {
    throw new Error(`El valor del activo debe estar entre 0 y 10. Recibido: ${assetValue}`)
  }
  if (degradation < 0 || degradation > 100) {
    throw new Error(`La degradación debe estar entre 0 y 100. Recibida: ${degradation}`)
  }
  return assetValue * (degradation / 100)
}

/**
 * Calcula el impacto por cada dimensión de seguridad para un escenario de riesgo.
 *
 * @param asset - Activo sobre el que se calcula el impacto
 * @param scenario - Escenario de riesgo (amenaza + degradaciones)
 * @returns Array de impactos calculados por dimensión
 */
export function calculateRiskScenarioImpacts(
  asset: Asset,
  scenario: RiskScenario,
): DimensionImpact[] {
  return scenario.degradations
    .filter((degradation) => {
      // Solo calcular dimensiones que el activo valora
      const assetValue = asset.value_dimensions[degradation.dimension]
      return assetValue !== undefined && assetValue > 0
    })
    .map((degradation) => {
      const assetValue = asset.value_dimensions[degradation.dimension] ?? 0
      const impactValue = calculateImpact(assetValue, degradation.degradation_percentage)
      const dimensionInfo = MAGERIT_DIMENSIONS[degradation.dimension]

      return {
        dimension: degradation.dimension,
        dimension_name: dimensionInfo.name,
        asset_value: assetValue,
        degradation_percentage: degradation.degradation_percentage,
        impact_value: Math.round(impactValue * 100) / 100,
      }
    })
}

// --------------------------------------------
// 2. CÁLCULO DE RIESGO POTENCIAL
// --------------------------------------------

/**
 * Calcula el riesgo potencial a partir del impacto y la frecuencia.
 *
 * Fórmula MAGERIT: Riesgo = Impacto * Frecuencia
 *
 * Nota: Ambos valores están en escala MAGERIT (Impacto 0-10, Frecuencia 0-5).
 * El resultado se normaliza a escala 0-100 para facilitar comparaciones.
 *
 * @param impactMax - Impacto máximo calculado (0-10)
 * @param frequency - Frecuencia de la amenaza en escala MAGERIT (0-5)
 * @returns Riesgo potencial normalizado (0-100)
 */
export function calculatePotentialRisk(impactMax: number, frequency: number): number {
  if (impactMax < 0 || impactMax > 10) {
    throw new Error(`El impacto debe estar entre 0 y 10. Recibido: ${impactMax}`)
  }
  if (frequency < 0 || frequency > 5) {
    throw new Error(`La frecuencia debe estar entre 0 y 5. Recibida: ${frequency}`)
  }
  // Normalizar a escala 0-100
  // Impacto máximo posible: 10, Frecuencia máxima: 5 => producto máximo: 50
  // Factor de normalización: 2 (50 * 2 = 100)
  const rawRisk = impactMax * frequency
  return Math.round((rawRisk / 50) * 100 * 100) / 100
}

/**
 * Calcula el riesgo potencial por dimensión para un escenario.
 *
 * @param impacts - Impactos calculados por dimensión
 * @param frequency - Frecuencia en escala MAGERIT (0-5)
 * @returns Array de riesgos potenciales por dimensión
 */
export function calculatePotentialRisksByDimension(
  impacts: DimensionImpact[],
  frequency: number,
): PotentialRiskByDimension[] {
  return impacts.map((impact) => ({
    dimension: impact.dimension,
    dimension_name: impact.dimension_name,
    impact_value: impact.impact_value,
    frequency,
    risk_value: calculatePotentialRisk(impact.impact_value, frequency),
  }))
}

// --------------------------------------------
// 3. CÁLCULO DE EFECTIVIDAD DE SALVAGUARDAS
// --------------------------------------------

/**
 * Calcula la efectividad combinada de un conjunto de controles/salvaguardas.
 *
 * Utiliza una media ponderada de las efectividades individuales.
 * La efectividad combinada no puede superar el 95% (límite realista MAGERIT).
 *
 * @param controls - Lista de controles con su efectividad por dimensión
 * @param dimension - Dimensión para la cual calcular la efectividad (opcional)
 * @returns Efectividad combinada (0-100)
 */
export function calculateSafeguardEffectiveness(
  controls: ControlWithEffectiveness[],
  dimension?: DimensionCode,
): number {
  if (controls.length === 0) {
    return 0
  }

  // Filtrar controles relevantes para la dimensión si se especifica
  const relevantControls = dimension
    ? controls.filter(
        (control) =>
          control.covers_dimensions.includes(dimension) ||
          control.covers_dimensions.length === 0,
      )
    : controls

  if (relevantControls.length === 0) {
    return 0
  }

  // Media ponderada de efectividades (todos con el mismo peso en ausencia de ponderación)
  const totalEffectiveness = relevantControls.reduce(
    (sum, control) => sum + control.effectiveness_percentage,
    0,
  )
  const averageEffectiveness = totalEffectiveness / relevantControls.length

  // Límite realista: ningún conjunto de controles puede garantizar 100% de protección
  const MAX_EFFECTIVENESS = 95
  return Math.min(Math.round(averageEffectiveness * 100) / 100, MAX_EFFECTIVENESS)
}

// --------------------------------------------
// 4. CÁLCULO DE RIESGO RESIDUAL
// --------------------------------------------

/**
 * Calcula el riesgo residual después de aplicar salvaguardas.
 *
 * Fórmula MAGERIT: Riesgo_Residual = Riesgo_Potencial * (1 - Efectividad_Salvaguardas / 100)
 *
 * @param potentialRisk - Riesgo potencial calculado (0-100)
 * @param safeguardEffectiveness - Efectividad de las salvaguardas (0-100)
 * @returns Riesgo residual (0-100)
 */
export function calculateResidualRisk(
  potentialRisk: number,
  safeguardEffectiveness: number,
): number {
  if (potentialRisk < 0 || potentialRisk > 100) {
    throw new Error(`El riesgo potencial debe estar entre 0 y 100. Recibido: ${potentialRisk}`)
  }
  if (safeguardEffectiveness < 0 || safeguardEffectiveness > 100) {
    throw new Error(
      `La efectividad de salvaguardas debe estar entre 0 y 100. Recibida: ${safeguardEffectiveness}`,
    )
  }
  const residual = potentialRisk * (1 - safeguardEffectiveness / 100)
  return Math.round(residual * 100) / 100
}

// --------------------------------------------
// 5. DETERMINACIÓN DEL NIVEL DE RIESGO
// --------------------------------------------

/**
 * Determina el nivel cualitativo de riesgo a partir de un valor numérico.
 *
 * Mapea el valor numérico (0-100) a un nivel de riesgo según los umbrales
 * definidos en RISK_LEVEL_THRESHOLDS.
 *
 * @param riskValue - Valor numérico de riesgo (0-100)
 * @returns Nivel de riesgo cualitativo
 */
export function determineRiskLevel(riskValue: number): RiskLevel {
  if (riskValue < 0) {
    return 'very_low'
  }

  for (const threshold of RISK_LEVEL_THRESHOLDS) {
    if (riskValue >= threshold.min_value && riskValue <= threshold.max_value) {
      return threshold.level
    }
  }

  // Si supera el máximo umbral, es crítico
  return 'critical'
}

/**
 * Obtiene la etiqueta en español del nivel de riesgo
 *
 * @param level - Nivel de riesgo
 * @returns Etiqueta en español
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    very_low: 'Muy Bajo',
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    critical: 'Crítico',
  }
  return labels[level]
}

/**
 * Obtiene el color hexadecimal asociado al nivel de riesgo
 *
 * @param level - Nivel de riesgo
 * @returns Color en formato hexadecimal
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const threshold = RISK_LEVEL_THRESHOLDS.find((t) => t.level === level)
  return threshold?.color ?? '#6b7280'
}

// --------------------------------------------
// 6. CÁLCULO COMPLETO DEL ESCENARIO DE RIESGO
// --------------------------------------------

/**
 * Ejecuta el pipeline completo de cálculo de riesgo MAGERIT para un escenario.
 *
 * Pipeline:
 * 1. Calcular impactos por dimensión
 * 2. Calcular riesgos potenciales por dimensión
 * 3. Calcular efectividad combinada de salvaguardas
 * 4. Calcular riesgos residuales por dimensión
 * 5. Determinar nivel de riesgo global
 *
 * @param asset - Activo bajo análisis
 * @param scenario - Escenario de amenaza
 * @param controls - Controles/salvaguardas implementados
 * @returns Cálculo completo de riesgo
 */
export function calculateFullRiskScenario(
  asset: Asset,
  scenario: RiskScenario,
  controls: ControlWithEffectiveness[],
): CompleteRiskCalculation {
  // PASO 1: Calcular impactos por dimensión
  const impacts = calculateRiskScenarioImpacts(asset, scenario)

  // PASO 2: Obtener impacto máximo
  const maxImpact = impacts.reduce(
    (max, impact) => Math.max(max, impact.impact_value),
    0,
  )

  // PASO 3: Calcular riesgos potenciales por dimensión
  const potentialRisks = calculatePotentialRisksByDimension(impacts, scenario.frequency)

  // PASO 4: Obtener riesgo potencial máximo
  const maxPotentialRisk = potentialRisks.reduce(
    (max, risk) => Math.max(max, risk.risk_value),
    0,
  )

  // PASO 5: Calcular efectividad global de salvaguardas
  const safeguardEffectiveness = calculateSafeguardEffectiveness(controls)

  // PASO 6: Calcular riesgos residuales por dimensión
  const residualRisks: ResidualRiskByDimension[] = potentialRisks.map((potentialRisk) => {
    // Efectividad específica por dimensión si hay controles dimensionales
    const dimensionEffectiveness = calculateSafeguardEffectiveness(
      controls,
      potentialRisk.dimension,
    )
    const residualRiskValue = calculateResidualRisk(
      potentialRisk.risk_value,
      dimensionEffectiveness,
    )
    const riskLevel = determineRiskLevel(residualRiskValue)

    return {
      dimension: potentialRisk.dimension,
      dimension_name: potentialRisk.dimension_name,
      potential_risk: potentialRisk.risk_value,
      safeguard_effectiveness: dimensionEffectiveness,
      residual_risk_value: residualRiskValue,
      risk_level: riskLevel,
      risk_level_label: getRiskLevelLabel(riskLevel),
    }
  })

  // PASO 7: Obtener riesgo residual máximo global
  const maxResidualRisk = residualRisks.reduce(
    (max, risk) => Math.max(max, risk.residual_risk_value),
    0,
  )

  // PASO 8: Determinar nivel de riesgo global
  const globalRiskLevel = determineRiskLevel(maxResidualRisk)

  // PASO 9: Obtener etiqueta de frecuencia
  const frequencyInfo = MAGERIT_FREQUENCY_SCALE.find(
    (f) => f.value === scenario.frequency,
  )

  return {
    scenario_id: scenario.id,
    asset_id: asset.id,
    asset_name: asset.name,
    threat_code: scenario.threat_code,
    threat_name: scenario.threat.name,
    frequency: scenario.frequency,
    frequency_label: frequencyInfo?.label ?? `Nivel ${scenario.frequency}`,
    impacts,
    max_impact: Math.round(maxImpact * 100) / 100,
    potential_risks: potentialRisks,
    max_potential_risk: Math.round(maxPotentialRisk * 100) / 100,
    safeguard_effectiveness: Math.round(safeguardEffectiveness * 100) / 100,
    residual_risks: residualRisks,
    max_residual_risk: Math.round(maxResidualRisk * 100) / 100,
    risk_level: globalRiskLevel,
    risk_level_label: getRiskLevelLabel(globalRiskLevel),
    normalized_risk_score: Math.round(maxResidualRisk * 100) / 100,
  }
}

// --------------------------------------------
// 7. UTILIDADES DE AGREGACIÓN
// --------------------------------------------

/**
 * Calcula el riesgo agregado de múltiples escenarios para un activo.
 * Retorna el riesgo más alto encontrado entre todos los escenarios (enfoque conservador).
 *
 * @param calculations - Lista de cálculos completos de riesgo
 * @returns Nivel de riesgo agregado y valor numérico
 */
export function aggregateAssetRisk(calculations: CompleteRiskCalculation[]): {
  risk_level: RiskLevel
  risk_level_label: string
  max_risk_score: number
  scenario_count: number
  critical_scenarios: number
  high_scenarios: number
} {
  if (calculations.length === 0) {
    return {
      risk_level: 'very_low',
      risk_level_label: 'Muy Bajo',
      max_risk_score: 0,
      scenario_count: 0,
      critical_scenarios: 0,
      high_scenarios: 0,
    }
  }

  const maxRiskScore = Math.max(...calculations.map((c) => c.normalized_risk_score))
  const aggregatedLevel = determineRiskLevel(maxRiskScore)

  const criticalScenarios = calculations.filter(
    (c) => c.risk_level === 'critical',
  ).length
  const highScenarios = calculations.filter((c) => c.risk_level === 'high').length

  return {
    risk_level: aggregatedLevel,
    risk_level_label: getRiskLevelLabel(aggregatedLevel),
    max_risk_score: Math.round(maxRiskScore * 100) / 100,
    scenario_count: calculations.length,
    critical_scenarios: criticalScenarios,
    high_scenarios: highScenarios,
  }
}

/**
 * Calcula estadísticas de riesgo para un conjunto de cálculos.
 *
 * @param calculations - Lista de cálculos de riesgo
 * @returns Estadísticas de riesgo
 */
export function calculateRiskStatistics(calculations: CompleteRiskCalculation[]): {
  total_scenarios: number
  average_risk_score: number
  max_risk_score: number
  min_risk_score: number
  by_level: Record<RiskLevel, number>
} {
  if (calculations.length === 0) {
    return {
      total_scenarios: 0,
      average_risk_score: 0,
      max_risk_score: 0,
      min_risk_score: 0,
      by_level: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        very_low: 0,
      },
    }
  }

  const scores = calculations.map((c) => c.normalized_risk_score)
  const sum = scores.reduce((a, b) => a + b, 0)

  const byLevel: Record<RiskLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    very_low: 0,
  }

  for (const calc of calculations) {
    byLevel[calc.risk_level]++
  }

  return {
    total_scenarios: calculations.length,
    average_risk_score: Math.round((sum / calculations.length) * 100) / 100,
    max_risk_score: Math.max(...scores),
    min_risk_score: Math.min(...scores),
    by_level: byLevel,
  }
}

/**
 * Obtiene información detallada de un nivel de impacto para mostrar en UI.
 *
 * @param impactValue - Valor de impacto (0-10)
 * @returns Información del nivel de impacto o undefined si está fuera de rango
 */
export function getImpactInfo(impactValue: number): {
  value: number
  label: string
  description: string
} | undefined {
  const rounded = Math.round(impactValue)
  const level = MAGERIT_IMPACT_SCALE.find((l) => l.value === rounded)
  if (!level) return undefined
  return {
    value: level.value,
    label: level.label,
    description: level.description,
  }
}

/**
 * Valida que un escenario de riesgo tiene datos coherentes para el cálculo.
 *
 * @param scenario - Escenario a validar
 * @returns Array de errores encontrados (vacío si es válido)
 */
export function validateRiskScenario(scenario: RiskScenario): string[] {
  const errors: string[] = []

  if (scenario.frequency < 0 || scenario.frequency > 5) {
    errors.push(`Frecuencia fuera de rango MAGERIT (0-5): ${scenario.frequency}`)
  }

  if (scenario.degradations.length === 0) {
    errors.push('El escenario debe tener al menos una degradación definida')
  }

  for (const degradation of scenario.degradations) {
    if (degradation.degradation_percentage < 0 || degradation.degradation_percentage > 100) {
      errors.push(
        `Degradación fuera de rango (0-100) para dimensión ${degradation.dimension}: ${degradation.degradation_percentage}`,
      )
    }

    if (!MAGERIT_DIMENSIONS[degradation.dimension]) {
      errors.push(`Dimensión no válida: ${degradation.dimension}`)
    }
  }

  return errors
}

/**
 * Valida que un activo tiene datos coherentes para el cálculo de riesgo.
 *
 * @param asset - Activo a validar
 * @returns Array de errores encontrados (vacío si es válido)
 */
export function validateAsset(asset: Asset): string[] {
  const errors: string[] = []

  if (Object.keys(asset.value_dimensions).length === 0) {
    errors.push('El activo debe tener al menos una dimensión valorada')
  }

  for (const [dimension, value] of Object.entries(asset.value_dimensions)) {
    if (value !== undefined && (value < 0 || value > 10)) {
      errors.push(`Valor de dimensión ${dimension} fuera de rango (0-10): ${value}`)
    }
  }

  return errors
}
