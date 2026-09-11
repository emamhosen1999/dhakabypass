'use server';

import { headers } from 'next/headers';
import { query, dbEnabled } from '../db.js';
import { rateLimit, clientIp } from '../rate-limit.js';
import { PUBLIC_WRITE_LIMIT, PUBLIC_WRITE_WINDOW_MS } from '../public-write-policy.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The `newsletter-form` block's submit handler.
 *
 * Writes to the same `newsletter_subscribers` table the legacy action did,
 * with what that action lacked: a honeypot, and outcomes the form can put
 * into words in the reader's own language. The rate limit shares the
 * contact form's bucket — they protect the same disk.
 *
 * INSERT IGNORE against the UNIQUE email: subscribing twice is not an error
 * and is reported as success, which also means the form never confirms to
 * a stranger whether an address is already on the list.
 *
 * Returns a plain object rather than throwing, because it drives
 * useActionState.
 */
export async function subscribeNewsletter(_prev, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();

  let ip = 'unknown';
  try { ip = clientIp(await headers()); } catch { ip = 'unknown'; }
  if (!rateLimit('contact', ip, { limit: PUBLIC_WRITE_LIMIT, windowMs: PUBLIC_WRITE_WINDOW_MS }).ok) {
    return { status: 'ratelimited' };
  }

  if (String(formData.get('company') || '').trim()) return { status: 'ok' };

  if (!email || email.length > 191 || !EMAIL_RE.test(email)) return { status: 'invalid' };

  if (!dbEnabled()) return { status: 'unavailable' };
  try {
    await query('INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)', [email]);
  } catch (err) {
    console.error('newsletter: failed to record subscriber:', err && err.code);
    return { status: 'unavailable' };
  }
  return { status: 'ok' };
}
