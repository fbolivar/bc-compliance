import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import {
  getMspiPosture,
  getTopCriticalGaps,
} from '@/features/dashboard/services/executiveDashboardService';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import { getSnapshotHistory } from '@/features/dashboard/services/snapshotService';
import { ExecutiveMonthlyReport } from '@/features/reporting/pdf/ExecutiveMonthlyReport';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Vercel Cron: genera y envía PDF ejecutivo mensual a admins de cada org.
 * Schedule: 0 8 1 * * (8 AM UTC = 3 AM Bogotá del primer día del mes)
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@bc-security.com';
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY no configurado' }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const supabase = await createClient();

  try {
    const { data: orgs } = await supabase.from('organizations').select('id, name');
    const reportMonth = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const results: Array<{ org: string; sent: number; error?: string }> = [];

    for (const org of orgs ?? []) {
      try {
        const [posture, frameworks, history, gaps, opMetrics, members] = await Promise.all([
          getMspiPosture(org.id),
          getFrameworksWithCompliance(org.id),
          getSnapshotHistory(org.id, 30),
          getTopCriticalGaps(org.id, 8),
          getOpSummary(org.id, supabase),
          getOrgRecipients(org.id, supabase),
        ]);

        if (members.length === 0) {
          results.push({ org: org.name, sent: 0, error: 'No hay destinatarios' });
          continue;
        }

        const topGaps = gaps.map((g) => ({
          code: g.code, title: g.title, level: g.level, type: g.type,
        }));

        const props = {
          orgName: org.name, reportMonth, posture, frameworks, history,
          metrics: opMetrics, topGaps,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = React.createElement(ExecutiveMonthlyReport as any, props as any) as any;
        const buffer = await renderToBuffer(element);

        const filename = `bc-trust-${org.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 7)}.pdf`;

        await resend.emails.send({
          from: fromEmail,
          to: members,
          subject: `BC Trust · Informe Ejecutivo SGSI ${reportMonth} · ${org.name}`,
          html: emailBody(org.name, posture.score, posture.levelLabel, reportMonth),
          attachments: [{ filename, content: buffer.toString('base64') }],
        });

        results.push({ org: org.name, sent: members.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        console.error(`[cron/monthly-report] org ${org.name}:`, err);
        results.push({ org: org.name, sent: 0, error: msg });
      }
    }

    return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

async function getOpSummary(orgId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const today = new Date();
  const [incRes, vulnRes, ncRes, ctrlRes] = await Promise.all([
    supabase.from('incidents').select('status').eq('organization_id', orgId),
    supabase.from('vulnerabilities').select('status, severity').eq('organization_id', orgId),
    supabase.from('nonconformities').select('status, target_close_date').eq('organization_id', orgId),
    supabase.from('controls').select('status').eq('organization_id', orgId),
  ]);
  const incs = incRes.data ?? [];
  const vulns = vulnRes.data ?? [];
  const ncs = ncRes.data ?? [];
  const ctrls = ctrlRes.data ?? [];
  return {
    activeIncidents: incs.filter((i) => i.status !== 'closed' && i.status !== 'post_incident').length,
    openVulns: vulns.filter((v) => v.status === 'open').length,
    criticalVulns: vulns.filter((v) => v.status === 'open' && v.severity === 'critical').length,
    openNcs: ncs.filter((n) => n.status !== 'closed').length,
    overdueNcs: ncs.filter((n) =>
      n.status !== 'closed' && n.target_close_date && new Date(n.target_close_date) < today
    ).length,
    implementedControls: ctrls.filter((c) => c.status === 'implemented').length,
    totalControls: ctrls.length,
  };
}

async function getOrgRecipients(
  orgId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string[]> {
  const { data } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('is_active', true);
  const userIds = (data ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return [];
  // Get emails from auth.users via SQL (service role context required, but supabase server client uses auth)
  const { data: users } = await supabase.rpc('get_user_emails_in_org', { p_org_id: orgId });
  if (users && Array.isArray(users)) {
    return (users as Array<{ email: string }>).map((u) => u.email).filter(Boolean);
  }
  return [];
}

function emailBody(orgName: string, score: number, level: string, month: string): string {
  return `
    <div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="border-bottom: 3px solid #0ea5e9; padding-bottom: 12px;">
        <h1 style="color: #0ea5e9; margin: 0; font-size: 24px;">BC Trust</h1>
        <p style="color: #64748b; margin: 4px 0 0 0;">Informe Ejecutivo SGSI</p>
      </div>
      <h2 style="margin-top: 24px;">Hola,</h2>
      <p>Adjunto encontrarás el <strong>Informe Ejecutivo SGSI de ${month}</strong> para <strong>${orgName}</strong>.</p>
      <div style="background: #f0f9ff; border-left: 3px solid #0ea5e9; padding: 12px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Score MSPI actual:</strong> ${score}/100</p>
        <p style="margin: 4px 0 0 0;"><strong>Nivel de madurez:</strong> ${level}</p>
      </div>
      <p>El reporte incluye:</p>
      <ul>
        <li>Postura de seguridad MSPI con tendencia 30 días</li>
        <li>Madurez del ciclo PHVA</li>
        <li>Métricas operativas (incidentes, vulnerabilidades, NCs)</li>
        <li>Cumplimiento por marco normativo</li>
        <li>Top brechas críticas que requieren atención directiva</li>
        <li>Próximos pasos recomendados</li>
      </ul>
      <p style="color: #64748b; font-size: 12px; margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
        Generado automáticamente por BC Trust el ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}.
        <br>Documento confidencial.
      </p>
    </div>
  `;
}
