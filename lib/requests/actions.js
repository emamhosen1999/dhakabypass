'use server';

import { headers } from 'next/headers';
import { query, dbEnabled } from '../db.js';
import { rateLimit, clientIp } from '../rate-limit.js';
import { PUBLIC_WRITE_LIMIT, PUBLIC_WRITE_WINDOW_MS, MAX_MESSAGE_CHARS } from '../public-write-policy.js';
import { isKind, fieldPlan, validateRequest, makeTrackingNo, dueAt, standardDays } from './policy.js';
import { getSetting } from '../settings.js';

/**
 * The `request-form` block's submit handler.
 *
 * Same discipline as lib/contact/actions.js — length check that costs the
 * sender nothing, then the rate limit, then the honeypot, then validation,
 * then one INSERT — with two additions: the row gets a tracking number the
 * sender is shown and can quote back, and a due date from the block's SLA.
 *
 * `config` is the block's own configuration (kind, which fields are asked,
 * SLA days). It arrives BOUND by the server component
 * (`submitServiceRequest.bind(null, config)`), not from a hidden input: Next
 * encrypts bound arguments, so a visitor cannot file a "breakdown" as a
 * "grievance" with a 999-day deadline by editing the form. The kind is still
 * whitelisted here, because a bound value is still a value.
 *
 * Returns a plain object rather than throwing, because it drives
 * useActionState.
 */
export async function submitServiceRequest(config, _prev, formData) {
  const kind = isKind(config?.kind) ? config.kind : 'general';
  const plan = fieldPlan(config || {});
  const raw = Object.fromEntries(
    ['name', 'phone', 'email', 'vehicle_no', 'location', 'subject', 'message']
      .map((k) => [k, String(formData.get(k) || '')]),
  );

  if (raw.message.trim().length > MAX_MESSAGE_CHARS) return { status: 'too_long' };

  let ip = 'unknown';
  try { ip = clientIp(await headers()); } catch { ip = 'unknown'; }
  // One bucket with the contact form: they protect the same disk, and a
  // flood is a flood whichever form it comes through.
  if (!rateLimit('contact', ip, { limit: PUBLIC_WRITE_LIMIT, windowMs: PUBLIC_WRITE_WINDOW_MS }).ok) {
    return { status: 'ratelimited' };
  }

  // Honeypot: a bot gets a plausible success and nothing to tune against.
  if (String(formData.get('company') || '').trim()) {
    return { status: 'ok', trackingNo: makeTrackingNo(kind) };
  }

  const checked = validateRequest(raw, plan, MAX_MESSAGE_CHARS);
  if (!checked.ok) return checked.tooLong ? { status: 'too_long' } : { status: 'invalid', fields: checked.fields };

  if (!dbEnabled()) return { status: 'unavailable' };

  const v = checked.value;
  const clip = (s, n) => (s.length > n ? s.slice(0, n) : s);
  const locale = String(config?.locale || 'en').slice(0, 5);
  let standards = {};
  try { standards = standardDays(await getSetting('requests.sla_days', {})); } catch { standards = {}; }
  const due = dueAt(kind, config?.slaDays, new Date(), standards);

  // The tracking number is random; the UNIQUE index is the arbiter. Three
  // tries covers a collision probability that is already negligible, and a
  // fourth failure is reported honestly rather than looped on.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const trackingNo = makeTrackingNo(kind);
    try {
      await query(
        `INSERT INTO service_requests
           (tracking_no, kind, locale, name, phone, email, vehicle_no, location, subject, message, due_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trackingNo, kind, locale, clip(v.name, 191), clip(v.phone, 40), clip(v.email, 191),
          clip(v.vehicle_no, 40), clip(v.location, 191), clip(v.subject, 255), v.message, due,
        ],
      );
      return { status: 'ok', trackingNo };
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') continue;
      // The error text may contain the sender's own data, so it is logged
      // without the parameters and never shown to the sender.
      console.error('requests: failed to record request:', err && err.code);
      return { status: 'unavailable' };
    }
  }
  return { status: 'unavailable' };
}
