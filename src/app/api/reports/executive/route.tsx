import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { ExecutiveReportPdf } from '@/features/reporting/pdf/ExecutiveReportPdf';
import { createClient } from '@/lib/supabase/server';
import React from 'react';

export const dynamic = 'force-dynamic';

async function getOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();
  return data?.organization_id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const orgId = await getOrgId(supabase);
  if (!orgId) return new Response('Unauthorized', { status: 401 });

  // Fetch org name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  // Risk zones
  const { data: risks } = await supabase
    .from('risk_scenarios')
    .select('id, risk_zone, treatment_plan_id')
    .eq('organization_id', orgId);

  const riskZone = {
    total: risks?.length ?? 0,
    extremo: risks?.filter((r) => r.risk_zone === 'Extremo').length ?? 0,
    alto: risks?.filter((r) => r.risk_zone === 'Alto').length ?? 0,
    moderado: risks?.filter((r) => r.risk_zone === 'Moderado').length ?? 0,
    bajo: risks?.filter((r) => r.risk_zone === 'Bajo').length ?? 0,
    withPlan: risks?.filter((r) => r.treatment_plan_id != null).length ?? 0,
  };

  // Incidents
  const { data: incidents } = await supabase
    .from('incidents')
    .select('id, severity, status')
    .eq('organization_id', orgId)
    .neq('status', 'closed');

  // Controls
  const { count: totalControls } = await supabase
    .from('controls')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active');

  // NCs
  const { count: openNCs } = await supabase
    .from('nonconformities')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['open', 'in_progress']);

  const data = {
    orgName: org?.name ?? 'Organización',
    generatedAt: new Date().toLocaleDateString('es-CO', { dateStyle: 'long' }),
    risks: riskZone,
    openIncidents: incidents?.length ?? 0,
    criticalIncidents: incidents?.filter((i) => i.severity === 'critical').length ?? 0,
    openControls: totalControls ?? 0,
    totalControls: totalControls ?? 0,
    openNCs: openNCs ?? 0,
  };

  const buffer = await renderToBuffer(
    React.createElement(ExecutiveReportPdf, { data }) as React.ReactElement<DocumentProps>,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-ejecutivo-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
