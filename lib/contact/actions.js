'use server';

import { headers } from 'next/headers';
import { query, dbEnabled } from '../db.js';
import { rateLimit, clientIp } from '../rate-limit.js';
import {
  PUBLIC_WRITE_LIMIT, PUBLIC_WRITE_WINDOW_MS, MAX_MESSAGE_CHARS,
} from '../public-write-policy.js';

/**
 * The localised contact form's submit handler.
 *
 * Deliberately NOT `submitContactAction` from app/admin/actions.js. That one
 * serves the legacy site and it carried a decision this page should not
 * inherit: when the database write threw, it logged and returned `{ ok: true }`
 * anyway, so the sender was thanked for a message that no longer existed. Its
 * comment said the reason — not crashing the public page — and that instinct is
 * right; the conclusion was not. Someone reporting a hazard on an expressway,
 * or a landowner making a compensation claim, needs to know their message was
 * not delivered so they can use another route. Silence is the failure mode with
 * the highest cost here. (That action has since been fixed too — C-D17.)
 *
 * So this one degrades honestly: it tells the sender the message could not be
 * recorded and to use another channel.
 *
 * Returns a plain object rather than throwing, because it drives useActionState.
 */

/**
 * The limit, the window and the message cap live in
 * lib/public-write-policy.js, with the reasoning for each number. They cannot
 * live here: this is a `'use server'` module, which may export async functions
 * only, and ContactForm needs the cap for the textarea's maxLength.
 */

export async function submitContactMessage(_prev, formData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const subject = String(formData.get('subject') || '').trim();
  const message = String(formData.get('message') || '').trim();

  /**
   * Length first, and it does NOT spend the sender's budget.
   *
   * Nothing is stored on this path, so it costs the host nothing to answer;
   * charging it against the limit would mean a person who pasted a long
   * document is locked out for ten minutes for a mistake the form has just
   * told them how to fix.
   */
  if (message.length > MAX_MESSAGE_CHARS) return { status: 'too_long' };

  /**
   * Then the rate limit — BEFORE the honeypot, so a bot tripping the honeypot
   * still spends its budget. That traffic is exactly what is being limited,
   * and making honeypot hits free would leave the cheapest flood unbounded.
   *
   * `headers()` can only be read inside a request; it cannot fail here, but a
   * throw would take down a form submission for a defence that is meant to
   * protect it, so it degrades to the shared 'unknown' bucket.
   */
  let ip = 'unknown';
  try {
    ip = clientIp(await headers());
  } catch {
    ip = 'unknown';
  }
  if (!rateLimit('contact', ip, {
    limit: PUBLIC_WRITE_LIMIT, windowMs: PUBLIC_WRITE_WINDOW_MS,
  }).ok) {
    return { status: 'ratelimited' };
  }

  // A field no human sees and no assistive technology announces. Bots fill it;
  // people do not. Returning success rather than an error means a bot gets no
  // signal about what it tripped, so it has nothing to tune against.
  if (String(formData.get('company') || '').trim()) return { status: 'ok' };

  const invalid = [];
  if (!name) invalid.push('name');
  // Validated for shape only. Anything stricter rejects addresses that are
  // genuinely valid, and the cost of a bounced reply is far lower than the cost
  // of refusing a real complaint.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.push('email');
  if (!message) invalid.push('message');
  if (invalid.length) return { status: 'invalid', fields: invalid };

  // Columns are varchar(191)/varchar(255); MariaDB in strict mode rejects an
  // over-length value outright, which would surface as a failed send for what
  // is really a pasted signature. Trimming to fit keeps the message.
  const clipped = (s, n) => (s.length > n ? s.slice(0, n) : s);

  if (!dbEnabled()) return { status: 'unavailable' };

  try {
    await query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [clipped(name, 191), clipped(email, 191), clipped(subject, 255), message],
    );
  } catch (err) {
    // The error text may contain the sender's own data, so it is logged without
    // the parameters and never shown to the sender.
    console.error('contact: failed to record message:', err && err.code);
    return { status: 'unavailable' };
  }

  return { status: 'ok' };
}
