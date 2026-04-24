import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, buildAlertEmail, type AlertItem } from '@/features/notifications/services/emailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Vercel Cron: envía email de alertas GRC a admins de cada org.
 * Schedule: 0 8 * * * (8 AM UTC = 3 AM Bogotá)
 *
 * Evalúa:
 *   - Riesgos críticos sin controles
 *   - NCs vencidas o por vencer en 7 días
 *   - CAPAs vencidas
 *   - Documentos vencidos o por vencer en 30 días
 *   - Planes BCP con prueba vencida
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();
  const today = new Date();
  const in7 = new Date(today.getTime() + 7 * 86400000);
  const in30 = new Date(today.getTime() + 30 * 86400000);

  const { data: orgs } = await supabase.from('organizations').select('id, name');
  const results: Array<{ org: string; items: number; sent: boolean }> = [];

  for (const org of orgs ?? []) {
    const orgId = org.id;
    const items: AlertItem[] = [];

    // 1) Riesgos críticos sin controles
    const { data: critRisks } = await supabase
      .from('risk_scenarios')
      .select('id, code, name')
      .eq('organization_id', orgId)
      .eq('risk_level_residual', 'critical');
    if ((critRisks ?? []).length > 0) {
      const { data: covered } = await supabase
        .from('control_risk_mappings')
        .select('risk_scenario_id')
        .eq('organization_id', orgId)
        .in('risk_scenario_id', critRisks!.map(r => r.id));
      const coveredSet = new Set((covered ?? []).map(c => c.risk_scenario_id));
      for (const r of critRisks!) {
        if (!coveredSet.has(r.id)) {
          items.push({
            code: r.code, title: r.name, type: 'risk',
            daysUntil: -1,
            href: `/risks/${r.id}`,
          });
        }
      }
    }

    // 2) NCs vencidas o por vencer en 7 días
    const { data: ncs } = await supabase
      .from('nonconformities')
      .select('id, code, title, target_close_date')
      .eq('organization_id', orgId)
      .neq('status', 'closed')
      .not('target_close_date', 'is', null)
      .lte('target_close_date', in7.toISOString());
    for (const nc of ncs ?? []) {
      const due = new Date(nc.target_close_date!);
      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      items.push({ code: nc.code, title: nc.title, type: 'nc', daysUntil, href: `/nonconformities/${nc.id}` });
    }

    // 3) CAPAs vencidas
    const { data: capas } = await supabase
      .from('capas')
      .select('id, code, title, due_date')
      .eq('organization_id', orgId)
      .neq('status', 'closed')
      .not('due_date', 'is', null)
      .lte('due_date', in7.toISOString());
    for (const c of capas ?? []) {
      const due = new Date(c.due_date!);
      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      items.push({ code: c.code, title: c.title, type: 'capa', daysUntil, href: `/capas/${c.id}` });
    }

    // 4) Documentos vencidos o por vencer en 30 días
    const { data: docs } = await supabase
      .from('documents')
      .select('id, code, title, expiry_date')
      .eq('organization_id', orgId)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', in30.toISOString());
    for (const d of docs ?? []) {
      const due = new Date(d.expiry_date!);
      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      items.push({ code: d.code, title: d.title, type: 'document', daysUntil, href: `/documents/${d.id}` });
    }

    // 5) Planes BCP con próxima prueba vencida
    const { data: bcpPlans } = await supabase
      .from('bcp_plans')
      .select('id, code, title, next_test_date')
      .eq('organization_id', orgId)
      .neq('status', 'retired')
      .not('next_test_date', 'is', null)
      .lte('next_test_date', in7.toISOString());
    for (const p of bcpPlans ?? []) {
      const due = new Date(p.next_test_date!);
      const daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      items.push({ code: p.code, title: p.title, type: 'audit', daysUntil, href: `/business-continuity/${p.id}` });
    }

    if (items.length === 0) {
      results.push({ org: org.name, items: 0, sent: false });
      continue;
    }

    // Get admin emails via existing RPC
    const { data: users } = await supabase.rpc('get_user_emails_in_org', { p_org_id: orgId });
    const emails = ((users ?? []) as Array<{ email: string }>).map(u => u.email).filter(Boolean);
    if (emails.length === 0) {
      results.push({ org: org.name, items: items.length, sent: false });
      continue;
    }

    const html = buildAlertEmail(org.name, items);
    const sent = await sendEmail({
      to: emails,
      subject: `BC Trust · ${items.length} alerta${items.length !== 1 ? 's' : ''} GRC — ${org.name}`,
      html,
    });

    results.push({ org: org.name, items: items.length, sent });
  }

  return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
}
