import { NextResponse } from 'next/server';
import { captureSnapshotsForAllOrgs } from '@/features/dashboard/services/snapshotService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Vercel Cron: captura snapshot diario de métricas para todas las orgs.
 * Schedule: 0 6 * * * (06:00 UTC = 01:00 Bogotá)
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await captureSnapshotsForAllOrgs();
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cron/dashboard-snapshot] error:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
