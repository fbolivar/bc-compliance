import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, buildTrainingReminderEmail } from '@/features/notifications/services/emailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Vercel Cron: envía recordatorios de formación a participantes con estado pending/in_progress.
 * Schedule: 0 9 * * 1 (9 AM UTC los lunes = 4 AM Bogotá)
 *
 * Solo envía si la sesión tiene due_date y vence en los próximos 14 días,
 * o si llevan más de 7 días sin completar sin fecha límite.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();
  const today = new Date();
  const in14 = new Date(today.getTime() + 14 * 86400000);
  const ago7 = new Date(today.getTime() - 7 * 86400000);

  const { data: enrollments } = await supabase
    .from('training_enrollments')
    .select(`
      id, user_name, user_email, status, enrolled_at, expiry_date,
      session:training_sessions (
        id, title, format,
        campaign:training_campaigns ( id, title, due_date )
      )
    `)
    .in('status', ['pending', 'in_progress'])
    .not('user_email', 'is', null);

  let sent = 0;
  let skipped = 0;

  for (const e of enrollments ?? []) {
    type SessionShape = { id: string; title: string; format: string; campaign: { id: string; title: string; due_date: string | null } | null };
    const session = (e.session as unknown) as SessionShape | null;

    if (!session || !e.user_email) { skipped++; continue; }

    const campaignDue = session.campaign?.due_date ?? null;
    const enrollDue = e.expiry_date ?? null;
    const effectiveDue = enrollDue ?? campaignDue;

    // Send if: has due date and vence in 14 days, OR enrolled >7 days ago without due date
    const shouldSend = effectiveDue
      ? new Date(effectiveDue) <= in14
      : new Date(e.enrolled_at) <= ago7;

    if (!shouldSend) { skipped++; continue; }

    const html = buildTrainingReminderEmail(
      e.user_name,
      session.title,
      session.campaign?.title ?? 'Formación',
      effectiveDue,
    );

    const ok = await sendEmail({
      to: e.user_email,
      subject: `Recordatorio: Completa tu formación — ${session.title}`,
      html,
    });

    if (ok) sent++;
    else skipped++;
  }

  return NextResponse.json({
    success: true,
    sent,
    skipped,
    total: (enrollments ?? []).length,
    timestamp: new Date().toISOString(),
  });
}
