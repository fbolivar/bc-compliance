import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import {
  getMspiPosture,
  getTopCriticalGaps,
} from '@/features/dashboard/services/executiveDashboardService';
import { getFrameworksWithCompliance } from '@/features/compliance/services/complianceService';
import { getSnapshotHistory } from '@/features/dashboard/services/snapshotService';
import { ExecutiveMonthlyReport } from '@/features/reporting/pdf/ExecutiveMonthlyReport';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const { orgId, organization } = await requireOrg();
  const supabase = await createClient();
  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';

  const reportMonth = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const [posture, frameworks, history, gaps, opMetrics] = await Promise.all([
    getMspiPosture(orgId),
    getFrameworksWithCompliance(orgId),
    getSnapshotHistory(orgId, 30),
    getTopCriticalGaps(orgId, 8),
    getOperationalSummary(orgId, supabase),
  ]);

  const topGaps = gaps.map((g) => ({
    code: g.code, title: g.title, level: g.level, type: g.type,
  }));

  const props = {
    orgName, reportMonth, posture, frameworks, history,
    metrics: opMetrics, topGaps,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(ExecutiveMonthlyReport as any, props as any) as any;
  const buffer = await renderToBuffer(element);

  const filename = `bc-trust-informe-ejecutivo-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

async function getOperationalSummary(
  orgId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
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
