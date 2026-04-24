import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';
import { requireOrg } from '@/shared/lib/get-org';
import { createClient } from '@/lib/supabase/server';
import { BcpPlanPdf } from '@/features/business-continuity/pdf/BcpPlanPdf';
import type { BcpPlan, BcpProcedure, BcpTest } from '@/features/business-continuity/services/bcpService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { orgId, organization } = await requireOrg();
  const orgName = (organization as { name?: string } | null)?.name ?? 'Organización';
  const planId = req.nextUrl.searchParams.get('id');
  if (!planId) return new NextResponse('Missing plan id', { status: 400 });

  const supabase = await createClient();

  const [{ data: plan }, { data: procedures }, { data: tests }] = await Promise.all([
    supabase.from('bcp_plans').select('*').eq('id', planId).eq('organization_id', orgId).single(),
    supabase.from('bcp_procedures').select('*').eq('bcp_plan_id', planId).eq('organization_id', orgId).order('phase').order('step_number'),
    supabase.from('bcp_tests').select('*').eq('bcp_plan_id', planId).eq('organization_id', orgId).order('test_date', { ascending: false }),
  ]);

  if (!plan) return new NextResponse('Plan not found', { status: 404 });

  const buffer = await renderToBuffer(
    <BcpPlanPdf
      plan={plan as BcpPlan}
      procedures={(procedures ?? []) as BcpProcedure[]}
      tests={(tests ?? []) as BcpTest[]}
      orgName={orgName}
    />
  );

  const filename = `BCP-${(plan as BcpPlan).code}-v${(plan as BcpPlan).version ?? '1'}.pdf`;
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
