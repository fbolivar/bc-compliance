import { createClient } from '@/lib/supabase/server';
import { getMspiPosture } from '@/features/dashboard/services/executiveDashboardService';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';

export interface SnapshotRow {
  capture_date: string;
  mspi_score: number;
  phva_planear: number;
  phva_hacer: number;
  phva_verificar: number;
  phva_actuar: number;
  total_risks: number;
  critical_risks: number;
  high_risks: number;
  total_controls: number;
  implemented_controls: number;
  total_incidents: number;
  active_incidents: number;
  total_vulns: number;
  open_vulns: number;
  critical_vulns: number;
  total_ncs: number;
  open_ncs: number;
  overdue_ncs: number;
  avg_compliance: number;
}

/**
 * Captura snapshot de métricas del día actual para una organización.
 * Idempotente: si ya existe snapshot del día, lo actualiza (UNIQUE org+date).
 */
export async function captureSnapshot(orgId: string): Promise<SnapshotRow | null> {
  const supabase = await createClient();

  const [posture, frameworks] = await Promise.all([
    getMspiPosture(orgId),
    getFrameworksWithCompliance(orgId),
  ]);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [
    risksRes, ctrlRes, incRes, vulnRes, ncRes,
  ] = await Promise.all([
    supabase.from('risk_scenarios').select('risk_level_residual').eq('organization_id', orgId),
    supabase.from('controls').select('status').eq('organization_id', orgId),
    supabase.from('incidents').select('status').eq('organization_id', orgId),
    supabase.from('vulnerabilities').select('status, severity').eq('organization_id', orgId),
    supabase.from('nonconformities').select('status, target_close_date').eq('organization_id', orgId),
  ]);

  const risks = risksRes.data ?? [];
  const ctrls = ctrlRes.data ?? [];
  const incs = incRes.data ?? [];
  const vulns = vulnRes.data ?? [];
  const ncs = ncRes.data ?? [];

  const avgCompliance = frameworks.length > 0
    ? Math.round(frameworks.reduce((s, f) => s + f.compliance_percentage, 0) / frameworks.length)
    : 0;

  const overdueNcs = ncs.filter((n) =>
    n.status !== 'closed' && n.target_close_date && new Date(n.target_close_date) < today
  ).length;

  const row: Omit<SnapshotRow, 'capture_date'> & { organization_id: string; capture_date: string } = {
    organization_id: orgId,
    capture_date: todayStr,
    mspi_score: posture.score,
    phva_planear: posture.phva.planear,
    phva_hacer: posture.phva.hacer,
    phva_verificar: posture.phva.verificar,
    phva_actuar: posture.phva.actuar,
    total_risks: risks.length,
    critical_risks: risks.filter((r) => r.risk_level_residual === 'critical').length,
    high_risks: risks.filter((r) => r.risk_level_residual === 'high').length,
    total_controls: ctrls.length,
    implemented_controls: ctrls.filter((c) => c.status === 'implemented').length,
    total_incidents: incs.length,
    active_incidents: incs.filter((i) => i.status !== 'closed' && i.status !== 'post_incident').length,
    total_vulns: vulns.length,
    open_vulns: vulns.filter((v) => v.status === 'open').length,
    critical_vulns: vulns.filter((v) => v.status === 'open' && v.severity === 'critical').length,
    total_ncs: ncs.length,
    open_ncs: ncs.filter((n) => n.status !== 'closed').length,
    overdue_ncs: overdueNcs,
    avg_compliance: avgCompliance,
  };

  const { data, error } = await supabase
    .from('dashboard_metrics_snapshots')
    .upsert(row, { onConflict: 'organization_id,capture_date' })
    .select('*')
    .single();

  if (error) {
    console.error('[captureSnapshot] error:', error);
    return null;
  }
  return data as SnapshotRow;
}

export async function captureSnapshotsForAllOrgs(): Promise<{ ok: number; failed: number }> {
  const supabase = await createClient();
  const { data: orgs } = await supabase.from('organizations').select('id');
  let ok = 0;
  let failed = 0;
  for (const o of orgs ?? []) {
    const res = await captureSnapshot(o.id);
    if (res) ok++; else failed++;
  }
  return { ok, failed };
}

export async function getSnapshotHistory(orgId: string, days = 30): Promise<SnapshotRow[]> {
  const supabase = await createClient();
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const { data } = await supabase
    .from('dashboard_metrics_snapshots')
    .select('*')
    .eq('organization_id', orgId)
    .gte('capture_date', from)
    .order('capture_date', { ascending: true });

  return (data ?? []) as SnapshotRow[];
}

export interface TrendInfo {
  current: number;
  previous: number;
  delta: number;
  pct: number;
  direction: 'up' | 'down' | 'flat';
}

export function trendOf(history: SnapshotRow[], field: keyof SnapshotRow, daysAgo = 30): TrendInfo {
  if (history.length === 0) return { current: 0, previous: 0, delta: 0, pct: 0, direction: 'flat' };
  const current = Number(history[history.length - 1][field] ?? 0);
  const targetDate = new Date(Date.now() - daysAgo * 86400000);
  const past = history.find((h) => new Date(h.capture_date) >= targetDate) ?? history[0];
  const previous = Number(past[field] ?? 0);
  const delta = current - previous;
  const pct = previous > 0 ? Math.round((delta / previous) * 100) : 0;
  return {
    current,
    previous,
    delta,
    pct,
    direction: delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'flat',
  };
}
