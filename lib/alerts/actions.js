'use server';

import { headers } from 'next/headers';
import { query, dbEnabled } from '../db.js';
import { rateLimit, clientIp } from '../rate-limit.js';
import { PUBLIC_WRITE_LIMIT, PUBLIC_WRITE_WINDOW_MS } from '../public-write-policy.js';
import { normaliseBdMobile, CHANNELS } from './policy.js';
import { logError } from '../log.js';

/**
 * The `alert-signup` block's handler: subscribe or unsubscribe a mobile
 * number. Same discipline as the newsletter: rate limit, honeypot, and an
 * answer that never reveals whether a number was already on the list.
 */
export async function alertSignup(_prev, formData) {
  let ip = 'unknown';
  try { ip = clientIp(await headers()); } catch { ip = 'unknown'; }
  if (!rateLimit('contact', ip, { limit: PUBLIC_WRITE_LIMIT, windowMs: PUBLIC_WRITE_WINDOW_MS }).ok) return { status: 'ratelimited' };
  if (String(formData.get('company') || '').trim()) return { status: 'ok' };

  const phone = normaliseBdMobile(formData.get('phone'));
  const channel = String(formData.get('channel') || 'sms');
  const mode = formData.get('mode') === 'unsubscribe' ? 'unsubscribe' : 'subscribe';
  const locale = ['en', 'bn', 'zh'].includes(String(formData.get('locale'))) ? String(formData.get('locale')) : 'en';
  if (!phone || !CHANNELS.includes(channel)) return { status: 'invalid' };
  if (mode === 'subscribe' && formData.get('consent') !== 'on') return { status: 'consent' };
  if (!dbEnabled()) return { status: 'unavailable' };
  try {
    if (mode === 'unsubscribe') {
      await query("UPDATE alert_subscribers SET status = 'unsubscribed' WHERE phone = ? AND channel = ?", [phone, channel]);
    } else {
      await query(
        `INSERT INTO alert_subscribers (phone, channel, locale, status) VALUES (?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE locale = VALUES(locale), status = 'active'`,
        [phone, channel, locale],
      );
    }
  } catch (err) {
    logError('alerts.signup_failed', err);
    return { status: 'unavailable' };
  }
  return { status: mode === 'unsubscribe' ? 'unsubscribed' : 'ok' };
}
