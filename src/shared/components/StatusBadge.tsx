interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'risk' | 'compliance' | 'incident' | 'control';
}

const colorMap: Record<string, string> = {
  // Risk levels
  critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  negligible: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  // General statuses
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  // Control statuses
  implemented: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  not_implemented: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  partially_implemented: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  planned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  not_applicable: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  // Compliance
  compliant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  partially_compliant: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  non_compliant: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  not_assessed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  // Incident
  detected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  triaged: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  investigating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  containing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  eradicating: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  recovering: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  post_incident: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  // Vulnerabilities
  in_remediation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mitigated: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  accepted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  false_positive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  // Vendors
  under_evaluation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  terminated: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  // Documents
  under_review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  archived: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  obsolete: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  // NC
  root_cause_analysis: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  action_planned: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  action_in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  verification: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  reopened: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  // Integration
  connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  disconnected: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  configuring: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  // BCP/DRP test results
  partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  passed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  // BCP test types
  tabletop: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  walkthrough: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  simulation: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  full_test: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  // Default
  overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  informational: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  major: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  minor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  observation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const labelMap: Record<string, string> = {
  not_implemented: 'No implementado',
  partially_implemented: 'Parcial',
  not_applicable: 'N/A',
  not_assessed: 'Sin evaluar',
  non_compliant: 'No cumple',
  partially_compliant: 'Parcial',
  in_progress: 'En progreso',
  in_remediation: 'En remediacion',
  false_positive: 'Falso positivo',
  under_evaluation: 'En evaluacion',
  under_review: 'En revision',
  root_cause_analysis: 'Analisis causa raiz',
  action_planned: 'Accion planificada',
  action_in_progress: 'Accion en progreso',
  post_incident: 'Post-incidente',
  opportunity_for_improvement: 'Oportunidad de mejora',
  // BCP/DRP
  partial: 'Parcial',
  passed: 'Aprobada',
  failed: 'Fallida',
  tabletop: 'Mesa de Trabajo',
  walkthrough: 'Recorrido',
  simulation: 'Simulacion',
  full_test: 'Prueba Completa',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = colorMap[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  const label = labelMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${colors}`}
      title={status}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      {label}
    </span>
  );
}
