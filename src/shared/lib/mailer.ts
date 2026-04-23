import nodemailer, { type Transporter } from 'nodemailer';

/**
 * SMTP mailer configurable por env vars.
 * Soporta Gmail (recomendado con App Password de 16 chars), Office365,
 * AWS SES o cualquier proveedor SMTP estándar.
 *
 * Variables requeridas:
 *   SMTP_HOST       — ej. smtp.gmail.com
 *   SMTP_PORT       — ej. 587 (STARTTLS) o 465 (SSL)
 *   SMTP_USER       — ej. tu-cuenta@gmail.com
 *   SMTP_PASS       — App Password (Gmail: 16 chars sin espacios)
 *   SMTP_FROM       — ej. "BC Trust <tu-cuenta@gmail.com>" o solo email
 */

let cached: Transporter | null = null;

export interface MailerConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function readMailerConfig(): MailerConfig | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  if (!host || !user || !pass || !from) return null;
  return { host, port, user, pass, from };
}

export function getMailer(): Transporter | null {
  if (cached) return cached;
  const cfg = readMailerConfig();
  if (!cfg) return null;
  cached = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465, // true para 465 (SSL), false para 587 (STARTTLS)
    auth: { user: cfg.user, pass: cfg.pass },
  });
  return cached;
}

export interface SendMailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
}

export interface SendMailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const cfg = readMailerConfig();
  if (!cfg) return { ok: false, error: 'SMTP no configurado (faltan env vars SMTP_HOST/USER/PASS)' };

  const mailer = getMailer();
  if (!mailer) return { ok: false, error: 'No se pudo inicializar el mailer' };

  try {
    const info = await mailer.sendMail({
      from: cfg.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments,
      replyTo: params.replyTo,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido SMTP';
    console.error('[mailer] sendMail error:', err);
    return { ok: false, error: msg };
  }
}

/**
 * Verifica conectividad SMTP. Útil para endpoint de healthcheck.
 */
export async function verifyMailer(): Promise<{ ok: boolean; error?: string }> {
  const mailer = getMailer();
  if (!mailer) return { ok: false, error: 'SMTP no configurado' };
  try {
    await mailer.verify();
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { ok: false, error: msg };
  }
}
