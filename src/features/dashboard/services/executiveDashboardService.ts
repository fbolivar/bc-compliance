import { createClient } from '@/lib/supabase/server';

// ─── MSPI Maturity Level (MinTIC) ────────────────────────────────────────────

export type MaturityLevel = 'inexistente' | 'inicial' | 'repetible' | 'definido' | 'gestionado' | 'optimizado';

export interface MspiPosture {
  /** 0-100 overall security posture score */
  score: number;
  level: MaturityLevel;
  levelLabel: string;
  /** PHVA cycle breakdown */
  phva: {
    planear: number;
    hacer: number;
    verificar: number;
    actuar: number;
  };
  /** % vs same value 30 days ago */
  trend: number;
}

export function maturityFromScore(score: number): { level: MaturityLevel; label: string } {
  if (score >= 80) return { level: 'optimizado', label: 'Optimizado' };
  if (score >= 60) return { level: 'gestionado', label: 'Gestionado' };
  if (score >= 40) return { level: 'definido', label: 'Definido' };
  if (score >= 20) return { level: 'repetible', label: 'Repetible' };
  if (score > 0) return { level: 'inicial', label: 'Inicial' };
  return { level: 'inexistente', label: 'Inexistente' };
}

export interface MspiSnapshot {
  snapshot_date: string;
  score: number;
  planear: number;
  hacer: number;
  verificar: number;
  actuar: number;
}

export async function getMspiHistory(orgId: string, months = 6): Promise<MspiSnapshot[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const { data } = await supabase
    .from('mspi_snapshots')
    .select('snapshot_date, score, planear, hacer, verificar, actuar')
    .eq('organization_id', orgId)
    .gte('snapshot_date', since.toISOString().slice(0, 10))
    .order('snapshot_date', { ascending: true });
  return (data ?? []) as MspiSnapshot[];
}

export async function getMspiPosture(orgId: string): Promise<MspiPosture> {
  const supabase = await createClient();

  // Plan = % riesgos con tratamiento definido + % docs políticas vigentes
  const [{ data: risks }, { data: policies }] = await Promise.all([
    supabase.from('risk_scenarios').select('treatment').eq('organization_id', orgId),
    supabase.from('documents').select('status, document_type').eq('organization_id', orgId)
      .in('document_type', ['policy', 'procedure', 'standard']),
  ]);

  const totalRisks = risks?.length ?? 0;
  const treatedRisks = (risks ?? []).filter((r) => r.treatment && r.treatment !== 'accept').length;
  const planRisks = totalRisks > 0 ? (treatedRisks / totalRisks) * 100 : 0;

  const totalPolicies = policies?.length ?? 0;
  const activePolicies = (policies ?? []).filter((d) => d.status === 'published' || d.status === 'approved').length;
  const planDocs = totalPolicies > 0 ? (activePolicies / totalPolicies) * 100 : 0;

  const planear = totalRisks + totalPolicies > 0
    ? (planRisks * totalRisks + planDocs * totalPolicies) / (totalRisks + totalPolicies)
    : 0;

  // Hacer = % controles implementados (ponderado por overall_effectiveness)
  const { data: controls } = await supabase
    .from('controls').select('status, overall_effectiveness').eq('organization_id', orgId);
  const totalControls = controls?.length ?? 0;
  const implementedControls = (controls ?? []).filter((c) => c.status === 'implemented').length;
  const partialControls = (controls ?? []).filter((c) => c.status === 'partially_implemented').length;
  const avgEff = (controls ?? []).reduce((sum, c) => sum + (c.overall_effectiveness ?? 0), 0) /
    Math.max(1, totalControls);
  const hacer = totalControls > 0
    ? ((implementedControls + partialControls * 0.5) / totalControls) * 100 * (avgEff / 100 + 0.5) / 1.5
    : 0;

  // Verificar = % auditorías completadas último año + % SOA evaluadas
  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString();
  const [{ data: audits }, { data: soa }] = await Promise.all([
    supabase.from('audit_programs').select('status, actual_end').eq('organization_id', orgId)
      .gte('created_at', oneYearAgo),
    supabase.from('soa_entries').select('implementation_status').eq('organization_id', orgId),
  ]);
  const totalAudits = audits?.length ?? 0;
  const completedAudits = (audits ?? []).filter((a) => a.status === 'completed').length;
  const audVerify = totalAudits > 0 ? (completedAudits / totalAudits) * 100 : 0;
  const totalSoa = soa?.length ?? 0;
  const evaluatedSoa = (soa ?? []).filter((s) => s.implementation_status !== 'not_assessed').length;
  const soaVerify = totalSoa > 0 ? (evaluatedSoa / totalSoa) * 100 : 0;
  const verificar = (audVerify * 0.4 + soaVerify * 0.6);

  // Actuar = % NCs cerradas + % CAPA effective
  const [{ data: ncs }, { data: capas }] = await Promise.all([
    supabase.from('nonconformities').select('status').eq('organization_id', orgId),
    supabase.from('capa_actions').select('status, is_effective').eq('organization_id', orgId),
  ]);
  const totalNcs = ncs?.length ?? 0;
  const closedNcs = (ncs ?? []).filter((n) => n.status === 'closed').length;
  const ncRatio = totalNcs > 0 ? (closedNcs / totalNcs) * 100 : 100;
  const totalCapas = capas?.length ?? 0;
  const effectiveCapas = (capas ?? []).filter((c) => c.is_effective === true || c.status === 'completed' || c.status === 'verified').length;
  const capaRatio = totalCapas > 0 ? (effectiveCapas / totalCapas) * 100 : 100;
  const actuar = (ncRatio * 0.5 + capaRatio * 0.5);

  // Score global ponderado PHVA (Hacer pesa más por ser ejecución)
  const score = Math.round(planear * 0.20 + hacer * 0.40 + verificar * 0.20 + actuar * 0.20);
  const { level, label } = maturityFromScore(score);

  // Upsert today's snapshot (one row per org per day)
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from('mspi_snapshots').upsert(
    { organization_id: orgId, snapshot_date: today, score, planear: Math.round(planear), hacer: Math.round(hacer), verificar: Math.round(verificar), actuar: Math.round(actuar) },
    { onConflict: 'organization_id,snapshot_date' }
  );

  // Fetch 30-day-ago snapshot for trend
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data: oldSnap } = await supabase
    .from('mspi_snapshots')
    .select('score')
    .eq('organization_id', orgId)
    .lte('snapshot_date', thirtyDaysAgo)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  const trend = oldSnap ? score - oldSnap.score : 0;

  return {
    score,
    level,
    levelLabel: label,
    phva: {
      planear: Math.round(planear),
      hacer: Math.round(hacer),
      verificar: Math.round(verificar),
      actuar: Math.round(actuar),
    },
    trend,
  };
}

// ─── Process Health (17 procesos PNNC) ──────────────────────────────────────

export interface ProcessHealth {
  asset_id: string;
  code: string;
  name: string;
  category: string;
  criticality: string;
  /** 0-100 health score for this process */
  health: number;
  riskCount: number;
  criticalRiskCount: number;
  controlCount: number;
  implementedControlCount: number;
  incidentCount: number;
}

export async function getProcessesHealth(orgId: string): Promise<ProcessHealth[]> {
  const supabase = await createClient();

  // All processes (assets de tipo intangible/service que son procesos)
  const { data: assets } = await supabase
    .from('assets')
    .select('id, code, name, criticality, category_id, asset_categories(name)')
    .eq('organization_id', orgId)
    .or('code.like.PE-%,code.like.PM-%,code.like.PA-%,code.like.PV-%,code.like.PROC-%')
    .order('code');

  type RawAsset = {
    id: string; code: string; name: string; criticality: string; category_id: string | null;
    asset_categories: { name: string } | null;
  };
  const processes = (assets as unknown as RawAsset[] | null) ?? [];
  if (processes.length === 0) return [];

  const processIds = processes.map((p) => p.id);

  // Riesgos por proceso
  const { data: risks } = await supabase
    .from('risk_scenarios')
    .select('asset_id, risk_level_residual')
    .eq('organization_id', orgId)
    .in('asset_id', processIds);
  const riskByAsset = new Map<string, { total: number; critical: number }>();
  for (const r of risks ?? []) {
    const cur = riskByAsset.get(r.asset_id) ?? { total: 0, critical: 0 };
    cur.total++;
    if (r.risk_level_residual === 'critical' || r.risk_level_residual === 'high') cur.critical++;
    riskByAsset.set(r.asset_id, cur);
  }

  // Controles vinculados a riesgos del proceso (vía control_risk_mappings)
  // Simplificado: controles del proceso por department match (best-effort sin tabla intermedia)
  const { data: controls } = await supabase
    .from('controls')
    .select('id, status, department')
    .eq('organization_id', orgId);
  const controlByDept = new Map<string, { total: number; impl: number }>();
  for (const c of controls ?? []) {
    const key = (c.department ?? '').toLowerCase();
    const cur = controlByDept.get(key) ?? { total: 0, impl: 0 };
    cur.total++;
    if (c.status === 'implemented') cur.impl++;
    controlByDept.set(key, cur);
  }

  // Incidentes vinculados al activo (vía incident_assets)
  const { data: incidentLinks } = await supabase
    .from('incident_assets')
    .select('asset_id, incidents(status)')
    .in('asset_id', processIds);
  const incidentByAsset = new Map<string, number>();
  type IncLink = { asset_id: string; incidents: { status: string } | null };
  for (const il of (incidentLinks as unknown as IncLink[] | null) ?? []) {
    if (il.incidents?.status !== 'closed') {
      incidentByAsset.set(il.asset_id, (incidentByAsset.get(il.asset_id) ?? 0) + 1);
    }
  }

  return processes.map((p) => {
    const risk = riskByAsset.get(p.id) ?? { total: 0, critical: 0 };
    const ctrl = controlByDept.get((p.name ?? '').toLowerCase()) ?? { total: 0, impl: 0 };
    const incidents = incidentByAsset.get(p.id) ?? 0;

    // Health score:
    //  - Critical risks penalize -20 each
    //  - Implemented controls bonus +5 each (cap)
    //  - Open incidents -15 each
    const baseScore = 100;
    const penaltyRisks = risk.critical * 20;
    const penaltyIncidents = incidents * 15;
    const bonusControls = Math.min(40, ctrl.impl * 5);
    const health = Math.max(0, Math.min(100, baseScore - penaltyRisks - penaltyIncidents + (bonusControls - 20)));

    return {
      asset_id: p.id,
      code: p.code,
      name: p.name,
      category: p.asset_categories?.name ?? 'Sin categoría',
      criticality: p.criticality,
      health: Math.round(health),
      riskCount: risk.total,
      criticalRiskCount: risk.critical,
      controlCount: ctrl.total,
      implementedControlCount: ctrl.impl,
      incidentCount: incidents,
    };
  });
}

// ─── Top critical gaps ───────────────────────────────────────────────────────

export interface CriticalGap {
  type: 'risk' | 'control' | 'requirement' | 'nc' | 'vulnerability';
  id: string;
  code: string;
  title: string;
  level: string;
  href: string;
  hint: string;
}

export async function getTopCriticalGaps(orgId: string, limit = 8): Promise<CriticalGap[]> {
  const supabase = await createClient();
  const gaps: CriticalGap[] = [];

  // Critical risks without controls
  const { data: critRisks } = await supabase
    .from('risk_scenarios')
    .select('id, code, name, risk_level_residual')
    .eq('organization_id', orgId)
    .in('risk_level_residual', ['critical', 'high'])
    .limit(limit);
  for (const r of critRisks ?? []) {
    gaps.push({
      type: 'risk',
      id: r.id,
      code: r.code,
      title: r.name,
      level: r.risk_level_residual,
      href: `/risks/${r.id}`,
      hint: r.risk_level_residual === 'critical' ? 'Riesgo crítico' : 'Riesgo alto',
    });
  }

  // Open critical vulnerabilities
  const { data: critVulns } = await supabase
    .from('vulnerabilities')
    .select('id, code, title, severity')
    .eq('organization_id', orgId)
    .eq('severity', 'critical')
    .eq('status', 'open')
    .limit(limit);
  for (const v of critVulns ?? []) {
    gaps.push({
      type: 'vulnerability',
      id: v.id,
      code: v.code,
      title: v.title,
      level: 'critical',
      href: `/vulnerabilities/${v.id}`,
      hint: 'Vulnerabilidad crítica abierta',
    });
  }

  // Major NCs not closed
  const { data: majorNcs } = await supabase
    .from('nonconformities')
    .select('id, code, title, nc_type, target_close_date')
    .eq('organization_id', orgId)
    .eq('nc_type', 'major')
    .neq('status', 'closed')
    .limit(limit);
  for (const n of majorNcs ?? []) {
    const overdue = n.target_close_date && new Date(n.target_close_date) < new Date();
    gaps.push({
      type: 'nc',
      id: n.id,
      code: n.code,
      title: n.title,
      level: overdue ? 'critical' : 'high',
      href: `/nonconformities/${n.id}`,
      hint: overdue ? 'NC mayor vencida' : 'NC mayor abierta',
    });
  }

  return gaps.slice(0, limit);
}

// ─── Operational metrics (lifecycle dashboards) ─────────────────────────────

export interface OperationalMetrics {
  incidents: { byStatus: Record<string, number>; totalActive: number };
  vulnerabilities: { bySeverity: Record<string, number>; totalOpen: number };
  nonconformities: { byStatus: Record<string, number>; totalOpen: number; overdue: number };
  capa: { byStatus: Record<string, number>; totalActive: number };
}

export async function getOperationalMetrics(orgId: string): Promise<OperationalMetrics> {
  const supabase = await createClient();

  const [
    { data: incidents },
    { data: vulns },
    { data: ncs },
    { data: capas },
  ] = await Promise.all([
    supabase.from('incidents').select('status').eq('organization_id', orgId),
    supabase.from('vulnerabilities').select('severity, status').eq('organization_id', orgId).eq('status', 'open'),
    supabase.from('nonconformities').select('status, target_close_date').eq('organization_id', orgId),
    supabase.from('capa_actions').select('status').eq('organization_id', orgId),
  ]);

  const incByStatus: Record<string, number> = {};
  let totalActiveInc = 0;
  for (const i of incidents ?? []) {
    incByStatus[i.status] = (incByStatus[i.status] ?? 0) + 1;
    if (i.status !== 'closed' && i.status !== 'post_incident') totalActiveInc++;
  }

  const vulnBySev: Record<string, number> = {};
  for (const v of vulns ?? []) vulnBySev[v.severity] = (vulnBySev[v.severity] ?? 0) + 1;

  const ncByStatus: Record<string, number> = {};
  let totalOpenNc = 0;
  let overdueNc = 0;
  const today = new Date();
  for (const n of ncs ?? []) {
    ncByStatus[n.status] = (ncByStatus[n.status] ?? 0) + 1;
    if (n.status !== 'closed') {
      totalOpenNc++;
      if (n.target_close_date && new Date(n.target_close_date) < today) overdueNc++;
    }
  }

  const capaByStatus: Record<string, number> = {};
  let totalActiveCapa = 0;
  for (const c of capas ?? []) {
    capaByStatus[c.status] = (capaByStatus[c.status] ?? 0) + 1;
    if (c.status !== 'completed' && c.status !== 'verified' && c.status !== 'cancelled') totalActiveCapa++;
  }

  return {
    incidents: { byStatus: incByStatus, totalActive: totalActiveInc },
    vulnerabilities: { bySeverity: vulnBySev, totalOpen: vulns?.length ?? 0 },
    nonconformities: { byStatus: ncByStatus, totalOpen: totalOpenNc, overdue: overdueNc },
    capa: { byStatus: capaByStatus, totalActive: totalActiveCapa },
  };
}

// ─── Upcoming actions (next 30/60/90 days) ──────────────────────────────────

export interface UpcomingAction {
  type: 'audit' | 'nc' | 'capa' | 'document' | 'control';
  id: string;
  title: string;
  date: string;
  daysUntil: number;
  level: 'critical' | 'high' | 'medium';
  href: string;
}

export async function getUpcomingActions(orgId: string): Promise<UpcomingAction[]> {
  const supabase = await createClient();
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 86400000).toISOString();

  const items: UpcomingAction[] = [];

  // Audits planeadas en 90 días
  const { data: audits } = await supabase
    .from('audit_programs')
    .select('id, code, title, planned_start, status')
    .eq('organization_id', orgId)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .lte('planned_start', in90Days)
    .limit(5);
  for (const a of audits ?? []) {
    if (!a.planned_start) continue;
    const days = Math.ceil((new Date(a.planned_start).getTime() - now.getTime()) / 86400000);
    items.push({
      type: 'audit',
      id: a.id,
      title: `${a.code} · ${a.title}`,
      date: a.planned_start,
      daysUntil: days,
      level: days < 14 ? 'critical' : days < 30 ? 'high' : 'medium',
      href: `/audits/${a.id}`,
    });
  }

  // NCs vencidas o por vencer 30 días
  const { data: ncs } = await supabase
    .from('nonconformities')
    .select('id, code, title, target_close_date')
    .eq('organization_id', orgId)
    .neq('status', 'closed')
    .not('target_close_date', 'is', null)
    .limit(10);
  for (const n of ncs ?? []) {
    if (!n.target_close_date) continue;
    const days = Math.ceil((new Date(n.target_close_date).getTime() - now.getTime()) / 86400000);
    if (days <= 30) {
      items.push({
        type: 'nc',
        id: n.id,
        title: `${n.code} · ${n.title}`,
        date: n.target_close_date,
        daysUntil: days,
        level: days < 0 ? 'critical' : days < 7 ? 'high' : 'medium',
        href: `/nonconformities/${n.id}`,
      });
    }
  }

  // CAPA actions due in 30 days
  const { data: capas } = await supabase
    .from('capa_actions')
    .select('id, code, title, due_date, status')
    .eq('organization_id', orgId)
    .not('status', 'in', '(completed,verified,cancelled)')
    .not('due_date', 'is', null)
    .limit(10);
  for (const c of capas ?? []) {
    if (!c.due_date) continue;
    const days = Math.ceil((new Date(c.due_date).getTime() - now.getTime()) / 86400000);
    if (days <= 30) {
      items.push({
        type: 'capa',
        id: c.id,
        title: `${c.code} · ${c.title}`,
        date: c.due_date,
        daysUntil: days,
        level: days < 0 ? 'critical' : days < 7 ? 'high' : 'medium',
        href: '/nonconformities',
      });
    }
  }

  // Documentos por revisar
  const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString();
  const { data: docs } = await supabase
    .from('documents')
    .select('id, code, title, review_date')
    .eq('organization_id', orgId)
    .lte('review_date', in30Days)
    .limit(5);
  for (const d of docs ?? []) {
    if (!d.review_date) continue;
    const days = Math.ceil((new Date(d.review_date).getTime() - now.getTime()) / 86400000);
    items.push({
      type: 'document',
      id: d.id,
      title: `${d.code} · ${d.title}`,
      date: d.review_date,
      daysUntil: days,
      level: days < 0 ? 'critical' : days < 14 ? 'high' : 'medium',
      href: `/documents/${d.id}`,
    });
  }

  return items.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 12);
}

// ─── Risk zone KPIs ──────────────────────────────────────────────────────────

export interface RiskZoneSummary {
  total: number;
  extremo: number;
  alto: number;
  moderado: number;
  bajo: number;
  withPlan: number;
}

const LEVEL_ZONE: Record<string, string> = {
  critical: 'Extremo', high: 'Alto', medium: 'Moderado', low: 'Bajo', negligible: 'Bajo',
};

export async function getRisksByZone(orgId: string): Promise<RiskZoneSummary> {
  const supabase = await createClient();
  const [{ data: risks }, { data: planLinks }] = await Promise.all([
    supabase
      .from('risk_scenarios')
      .select('id, risk_zone, risk_level_residual')
      .eq('organization_id', orgId),
    supabase
      .from('treatment_plan_risks')
      .select('risk_scenario_id'),
  ]);

  const linkedRiskIds = new Set((planLinks ?? []).map((l) => l.risk_scenario_id));
  const summary: RiskZoneSummary = { total: 0, extremo: 0, alto: 0, moderado: 0, bajo: 0, withPlan: 0 };
  for (const r of risks ?? []) {
    summary.total++;
    const zone = r.risk_zone ?? LEVEL_ZONE[r.risk_level_residual ?? ''] ?? '';
    if (zone === 'Extremo') summary.extremo++;
    else if (zone === 'Alto') summary.alto++;
    else if (zone === 'Moderado') summary.moderado++;
    else summary.bajo++;
    if (linkedRiskIds.has(r.id)) summary.withPlan++;
  }
  return summary;
}
