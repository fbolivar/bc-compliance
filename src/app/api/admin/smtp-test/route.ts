import { NextResponse } from 'next/server';
import { requireOrg } from '@/shared/lib/get-org';
import { sendMail, verifyMailer, readMailerConfig } from '@/shared/lib/mailer';

export const dynamic = 'force-dynamic';

/**
 * GET — verifica conectividad SMTP (no envía nada).
 * POST — envía un email de prueba al usuario actual.
 *
 * Solo usuarios autenticados.
 */
export async function GET() {
  const cfg = readMailerConfig();
  if (!cfg) {
    return NextResponse.json({
      configured: false,
      missing: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'].filter(
        (v) => !process.env[v],
      ),
    });
  }
  const verify = await verifyMailer();
  return NextResponse.json({
    configured: true,
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    from: cfg.from,
    connection: verify.ok ? 'ok' : 'fail',
    error: verify.error,
  });
}

export async function POST() {
  const { user } = await requireOrg();
  if (!user.email) {
    return NextResponse.json({ ok: false, error: 'Usuario sin email' }, { status: 400 });
  }

  const result = await sendMail({
    to: user.email,
    subject: 'BC Trust · Prueba de envío SMTP',
    html: `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 500px; padding: 24px;">
        <h2 style="color: #0ea5e9;">SMTP Test ✓</h2>
        <p>Si recibes este correo, la configuración SMTP de BC Trust está funcionando.</p>
        <p style="color: #64748b; font-size: 12px;">
          Enviado desde el endpoint de prueba el ${new Date().toLocaleString('es-CO')}.
        </p>
      </div>
    `,
    text: 'BC Trust SMTP Test OK',
  });

  return NextResponse.json(result);
}
