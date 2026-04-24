import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? 'noreply@bc-security.com';
const APP_URL = process.env.APP_URL ?? 'https://bctrust.bc-security.com';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder_add_real_key') {
    console.warn('[email] RESEND_API_KEY not configured — email skipped:', payload.subject);
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: `BC Trust GRC <${FROM}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    if (error) { console.error('[email] Resend error:', error); return false; }
    return true;
  } catch (e) {
    console.error('[email] send failed:', e);
    return false;
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

function baseLayout(title: string, body: string, ctaLabel?: string, ctaUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 24px; }
  .card { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
  .header { background: #0f172a; padding: 20px 28px; }
  .header h1 { color: #fff; font-size: 16px; margin: 0; font-weight: 600; }
  .header p { color: #94a3b8; font-size: 12px; margin: 4px 0 0; }
  .body { padding: 24px 28px; }
  .body h2 { font-size: 18px; color: #1e293b; margin: 0 0 8px; }
  .body p { color: #475569; font-size: 14px; line-height: 1.6; margin: 8px 0; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-amber { background: #fef3c7; color: #d97706; }
  .badge-blue { background: #dbeafe; color: #2563eb; }
  .cta { display: block; margin: 20px 0 0; text-align: center; background: #0ea5e9; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 28px; }
  .footer p { color: #94a3b8; font-size: 11px; margin: 0; }
  table.items { width: 100%; border-collapse: collapse; margin: 12px 0; }
  table.items th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  table.items td { padding: 8px 10px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>BC Trust GRC</h1>
    <p>Plataforma de Gestión de Riesgos y Cumplimiento</p>
  </div>
  <div class="body">
    ${body}
    ${ctaLabel && ctaUrl ? `<a href="${ctaUrl}" class="cta">${ctaLabel}</a>` : ''}
  </div>
  <div class="footer"><p>Este correo fue generado automáticamente por BC Trust GRC. No responda a este mensaje.</p></div>
</div>
</body></html>`;
}

export interface AlertItem {
  code: string;
  title: string;
  daysUntil: number;
  href: string;
  type: 'risk' | 'audit' | 'nc' | 'document' | 'capa' | 'training';
}

export function buildAlertEmail(orgName: string, items: AlertItem[]): string {
  const overdueItems = items.filter(i => i.daysUntil < 0);
  const urgentItems = items.filter(i => i.daysUntil >= 0 && i.daysUntil <= 7);
  const upcomingItems = items.filter(i => i.daysUntil > 7);

  const typeLabel: Record<string, string> = {
    risk: 'Riesgo', audit: 'Auditoría', nc: 'No Conformidad',
    document: 'Documento', capa: 'CAPA', training: 'Formación',
  };
  const typeIcon: Record<string, string> = {
    risk: '🔴', audit: '📋', nc: '⚠️', document: '📄', capa: '🔧', training: '🎓',
  };

  function renderItems(list: AlertItem[], badgeClass: string, badgeText: (d: number) => string) {
    if (!list.length) return '';
    return `<table class="items">
      <tr><th>Tipo</th><th>Código</th><th>Título</th><th>Estado</th></tr>
      ${list.map(i => `<tr>
        <td>${typeIcon[i.type] ?? ''} ${typeLabel[i.type] ?? i.type}</td>
        <td><strong>${i.code}</strong></td>
        <td>${i.title}</td>
        <td><span class="badge ${badgeClass}">${badgeText(i.daysUntil)}</span></td>
      </tr>`).join('')}
    </table>`;
  }

  const body = `
    <h2>Alertas de Cumplimiento — ${orgName}</h2>
    <p>Se han detectado <strong>${items.length} elemento(s)</strong> que requieren atención.</p>

    ${overdueItems.length ? `
      <p><strong>🔴 Vencidos (${overdueItems.length})</strong></p>
      ${renderItems(overdueItems, 'badge-red', d => `Vencido hace ${Math.abs(d)} días`)}
    ` : ''}

    ${urgentItems.length ? `
      <p><strong>🟡 Vencen en menos de 7 días (${urgentItems.length})</strong></p>
      ${renderItems(urgentItems, 'badge-amber', d => d === 0 ? 'Hoy' : `En ${d} día${d !== 1 ? 's' : ''}`)}
    ` : ''}

    ${upcomingItems.length ? `
      <p><strong>🔵 Próximos (${upcomingItems.length})</strong></p>
      ${renderItems(upcomingItems, 'badge-blue', d => `En ${d} días`)}
    ` : ''}
  `;

  return baseLayout(
    `Alertas GRC — ${orgName}`,
    body,
    'Ver Dashboard',
    `${APP_URL}/dashboard`,
  );
}

export function buildTrainingReminderEmail(
  userName: string,
  sessionTitle: string,
  campaignTitle: string,
  dueDate: string | null,
): string {
  const body = `
    <h2>Recordatorio de Formación</h2>
    <p>Hola <strong>${userName}</strong>,</p>
    <p>Tienes una formación pendiente de completar:</p>
    <table class="items">
      <tr><th>Sesión</th><td>${sessionTitle}</td></tr>
      <tr><th>Campaña</th><td>${campaignTitle}</td></tr>
      ${dueDate ? `<tr><th>Fecha límite</th><td><span class="badge badge-amber">${new Date(dueDate).toLocaleDateString('es-CO', { dateStyle: 'long' })}</span></td></tr>` : ''}
    </table>
    <p>Por favor completa la formación a la brevedad posible.</p>
  `;
  return baseLayout(
    'Recordatorio de formación',
    body,
    'Ir a Formación',
    `${APP_URL}/training`,
  );
}
