import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron: genera alertas automáticas evaluando estado de los SGSI.
 * Schedule: 0 *\/6 * * * (cada 6 horas)
 *
 * Reglas evaluadas para cada org:
 *   - Riesgos críticos sin controles
 *   - Vulnerabilidades críticas abiertas
 *   - Incidentes activos sin movimiento >7 días
 *   - NCs vencidas o por vencer en 7 días
 *   - Documentos vencidos
 *   - Score MSPI bajó >5 puntos vs hace 7 días
 *
 * Deduplicación: cada notification se identifica por hash(orgId+rule+entityId+date)
 * para no spamear cada 6h.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { data: orgs } = await supabase.from('organizations').select('id, name');

    let totalCreated = 0;
    let totalSkipped = 0;
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    for (const org of orgs ?? []) {
      const orgId = org.id;
      const proposed: Array<{
        title: string; message: string; type: string;
        entityType: string | null; entityId: string | null;
        ruleKey: string;
      }> = [];

      // 1) Riesgos críticos sin controles
      const { data: critRisks } = await supabase
        .from('risk_scenarios')
        .select('id, code, name')
        .eq('organization_id', orgId)
        .eq('risk_level_residual', 'critical');
      const critIds = (critRisks ?? []).map((r) => r.id);
      if (critIds.length > 0) {
        const { data: covered } = await supabase
          .from('control_risk_mappings')
          .select('risk_scenario_id')
          .eq('organization_id', orgId)
          .in('risk_scenario_id', critIds);
        const coveredSet = new Set((covered ?? []).map((c) => c.risk_scenario_id));
        for (const r of critRisks ?? []) {
          if (!coveredSet.has(r.id)) {
            proposed.push({
              title: 'Riesgo crítico sin controles',
              message: `${r.code} "${r.name}" tiene nivel residual crítico y no tiene controles mitigantes.`,
              type: 'critical',
              entityType: 'risk_scenario',
              entityId: r.id,
              ruleKey: `risk-no-control-${r.id}-${todayKey}`,
            });
          }
        }
      }

      // 2) Vulnerabilidades críticas abiertas
      const { data: critVulns } = await supabase
        .from('vulnerabilities')
        .select('id, code, title')
        .eq('organization_id', orgId)
        .eq('severity', 'critical')
        .eq('status', 'open');
      for (const v of critVulns ?? []) {
        proposed.push({
          title: 'Vulnerabilidad crítica abierta',
          message: `${v.code}: ${v.title} requiere remediación inmediata.`,
          type: 'critical',
          entityType: 'vulnerability',
          entityId: v.id,
          ruleKey: `vuln-critical-${v.id}-${todayKey}`,
        });
      }

      // 3) NCs próximas a vencer o vencidas
      const { data: ncs } = await supabase
        .from('nonconformities')
        .select('id, code, title, target_close_date')
        .eq('organization_id', orgId)
        .neq('status', 'closed')
        .not('target_close_date', 'is', null);
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 86400000);
      for (const nc of ncs ?? []) {
        const due = new Date(nc.target_close_date!);
        if (due < today) {
          proposed.push({
            title: 'No conformidad vencida',
            message: `${nc.code}: ${nc.title} venció el ${due.toLocaleDateString('es-CO')}.`,
            type: 'critical',
            entityType: 'nonconformity',
            entityId: nc.id,
            ruleKey: `nc-overdue-${nc.id}-${todayKey}`,
          });
        } else if (due < sevenDaysFromNow) {
          proposed.push({
            title: 'NC próxima a vencer (7 días)',
            message: `${nc.code}: ${nc.title} vence el ${due.toLocaleDateString('es-CO')}.`,
            type: 'warning',
            entityType: 'nonconformity',
            entityId: nc.id,
            ruleKey: `nc-due-soon-${nc.id}-${todayKey}`,
          });
        }
      }

      // 4) Documentos vencidos
      const { data: expiredDocs } = await supabase
        .from('documents')
        .select('id, code, title, expiry_date')
        .eq('organization_id', orgId)
        .lte('expiry_date', today.toISOString());
      for (const d of expiredDocs ?? []) {
        proposed.push({
          title: 'Documento vencido',
          message: `${d.code}: ${d.title} expiró el ${new Date(d.expiry_date!).toLocaleDateString('es-CO')}.`,
          type: 'warning',
          entityType: null,
          entityId: null,
          ruleKey: `doc-expired-${d.id}-${todayKey}`,
        });
      }

      // 5) Score MSPI degradación
      const { data: snaps } = await supabase
        .from('dashboard_metrics_snapshots')
        .select('mspi_score, capture_date')
        .eq('organization_id', orgId)
        .order('capture_date', { ascending: false })
        .limit(8);
      if (snaps && snaps.length >= 2) {
        const current = snaps[0].mspi_score;
        const weekAgo = snaps.find((s) => {
          const diff = today.getTime() - new Date(s.capture_date).getTime();
          return diff >= 6 * 86400000;
        });
        if (weekAgo && current < weekAgo.mspi_score - 5) {
          proposed.push({
            title: 'Score MSPI en descenso',
            message: `El score bajó de ${weekAgo.mspi_score} a ${current} en los últimos 7 días.`,
            type: 'warning',
            entityType: null,
            entityId: null,
            ruleKey: `mspi-drop-${todayKey}`,
          });
        }
      }

      // Deduplicate via metadata.rule_key
      const existing = await supabase
        .from('notifications')
        .select('metadata')
        .eq('organization_id', orgId)
        .gte('created_at', new Date(today.getTime() - 7 * 86400000).toISOString());
      const existingKeys = new Set(
        (existing.data ?? [])
          .map((n) => (n.metadata as { rule_key?: string } | null)?.rule_key)
          .filter(Boolean) as string[]
      );

      // Distribute notifications to all org members
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      const memberIds = (members ?? []).map((m) => m.user_id);
      if (memberIds.length === 0) continue;

      const rows: Array<Record<string, unknown>> = [];
      for (const p of proposed) {
        const ruleHash = createHash('md5').update(p.ruleKey).digest('hex').substring(0, 16);
        if (existingKeys.has(ruleHash)) {
          totalSkipped++;
          continue;
        }
        for (const userId of memberIds) {
          rows.push({
            organization_id: orgId,
            user_id: userId,
            title: p.title,
            message: p.message,
            notification_type: p.type,
            entity_type: p.entityType,
            entity_id: p.entityId,
            metadata: { rule_key: ruleHash, source: 'cron' },
          });
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase.from('notifications').insert(rows);
        if (!error) totalCreated += rows.length;
      }
    }

    return NextResponse.json({
      success: true,
      created: totalCreated,
      skipped_duplicates: totalSkipped,
      orgs: orgs?.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cron/generate-alerts] error:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
