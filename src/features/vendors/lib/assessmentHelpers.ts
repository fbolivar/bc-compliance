export interface QuestionnaireResponses {
  iso27001: boolean;
  soc2: boolean;
  dpa: boolean;
  pentest: boolean;
  bcp: boolean;
  access_controls: boolean;
  training: boolean;
  incident_policy: boolean;
  had_incidents: boolean;
  subcontracts_unvetted: boolean;
}

export function computeAssessmentScore(q: QuestionnaireResponses): number {
  const positive: (keyof QuestionnaireResponses)[] = [
    'iso27001', 'soc2', 'dpa', 'pentest',
    'bcp', 'access_controls', 'training', 'incident_policy',
  ];
  const risk: (keyof QuestionnaireResponses)[] = ['had_incidents', 'subcontracts_unvetted'];

  let score = 0;
  for (const k of positive) if (q[k]) score += 10;
  for (const k of risk) if (!q[k]) score += 10;
  return Math.min(100, Math.max(0, score));
}

export function scoreToRiskLevel(score: number): string {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}
