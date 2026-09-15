import { log, logError } from './log.js';

/**
 * Outbound email (W8C.7): acknowledgements for requests and grievances.
 *
 * Configured by MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD and MAIL_FROM
 * on the server. Without them nothing is sent and `mailStatus()` says so, the
 * same honest state the SMS and WhatsApp providers report. A send is never
 * awaited on the visitor's path: the request is recorded first, and a mail
 * server that is slow or down cannot cost them their tracking number.
 */
export function mailStatus(env = process.env) {
  const configured = Boolean(env.MAIL_HOST && env.MAIL_FROM);
  return { configured, from: env.MAIL_FROM || '' };
}

let transportPromise = null;

async function transport(env) {
  if (!transportPromise) {
    transportPromise = import('nodemailer').then((m) => (m.default || m).createTransport({
      host: env.MAIL_HOST,
      port: Number(env.MAIL_PORT || 587),
      secure: String(env.MAIL_SECURE || '').toLowerCase() === 'true' || Number(env.MAIL_PORT) === 465,
      ...(env.MAIL_USER ? { auth: { user: env.MAIL_USER, pass: env.MAIL_PASSWORD || '' } } : {}),
      connectionTimeout: 10000,
    }));
  }
  return transportPromise;
}

/**
 * Send one message. Resolves to { sent: true } or { sent: false, reason }.
 * Never throws: the caller's own work has already succeeded.
 */
export async function sendMail({ to, subject, text, replyTo }, env = process.env) {
  if (!mailStatus(env).configured) return { sent: false, reason: 'no_provider' };
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) return { sent: false, reason: 'no_address' };
  try {
    const t = await transport(env);
    await t.sendMail({ from: env.MAIL_FROM, to, subject, text, ...(replyTo ? { replyTo } : {}) });
    log('info', 'mail.sent', { subject });
    return { sent: true };
  } catch (err) {
    logError('mail.failed', err, { subject });
    return { sent: false, reason: 'failed' };
  }
}
