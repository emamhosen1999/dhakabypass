'use server';

import { query, dbEnabled } from '../../../lib/db.js';

/**
 * The localised contact form's submit handler.
 *
 * Deliberately NOT `submitContactAction` from app/admin/actions.js. That one
 * serves the legacy site, which is live and on the do-not-touch list, and it
 * carries a decision this page should not inherit: when the database write
 * throws, it logs and returns `{ ok: true }` anyway, so the sender is thanked
 * for a message that no longer exists. Its comment says the reason — not
 * crashing the public page — and that instinct is right; the conclusion is not.
 * Someone reporting a hazard on an expressway, or a landowner making a
 * compensation claim, needs to know their message was not delivered so they can
 * use another route. Silence is the failure mode with the highest cost here.
 *
 * So this one degrades honestly: it tells the sender the message could not be
 * recorded and to use another channel.
 *
 * Returns a plain object rather than throwing, because it drives useActionState.
 */
export async function submitContactMessage(_prev, formData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const subject = String(formData.get('subject') || '').trim();
  const message = String(formData.get('message') || '').trim();

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
