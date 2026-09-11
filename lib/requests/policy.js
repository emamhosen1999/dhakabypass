import { randomInt } from 'node:crypto';

/**
 * What a service request is, and what a valid one looks like.
 *
 * Plain module, no database: the Server Action in ./actions.js, the client
 * form and the admin queue all read this, and a `'use server'` file may export
 * async functions only. Everything here is pure so it is testable without a
 * request.
 */

/**
 * The four needs the block catalogue found (grievance redress, toll dispute,
 * breakdown assistance, lost & found) plus a general request. One block type
 * configured five ways, never five block types.
 *
 * `prefix` heads the tracking number so a phone operator hears "GR" and knows
 * which queue to open. `slaDays` is the default deadline; the block's own
 * field overrides it per page. Grievance follows the 30-day acknowledgement
 * window common to GRS frameworks; a breakdown is an immediate matter, so its
 * default is one day — the queue flags it overdue tomorrow, not next month.
 */
export const KINDS = Object.freeze({
  grievance: { prefix: 'GR', slaDays: 30 },
  toll_dispute: { prefix: 'TD', slaDays: 15 },
  breakdown: { prefix: 'BA', slaDays: 1 },
  lost_found: { prefix: 'LF', slaDays: 7 },
  general: { prefix: 'SR', slaDays: 14 },
});

export const KIND_VALUES = Object.freeze(Object.keys(KINDS));
export const STATUSES = Object.freeze(['new', 'in_progress', 'resolved', 'closed']);

export const isKind = (v) => typeof v === 'string' && Object.hasOwn(KINDS, v);
export const isStatus = (v) => STATUSES.includes(v);

/**
 * No 0/O, 1/I/L: a number read over a phone line or typed from a photo of a
 * receipt must not have two characters that look the same.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * `GR-260911-K7M3`: kind prefix, date, four characters. 31^4 is about 920k
 * per kind per day, against a queue that will see tens; the UNIQUE index
 * catches the collision that theory says should not happen and the action
 * retries.
 *
 * `now` and `rand` are parameters so the shape is testable without faking
 * the clock or the CSPRNG.
 */
export function makeTrackingNo(kind, now = new Date(), rand = (n) => randomInt(n)) {
  const k = isKind(kind) ? kind : 'general';
  const d = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const yy = String(d.getUTCFullYear()).slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  let tail = '';
  for (let i = 0; i < 4; i += 1) tail += ALPHABET[rand(ALPHABET.length)];
  return `${KINDS[k].prefix}-${yy}${mm}${dd}-${tail}`;
}

export const TRACKING_RE = /^(GR|TD|BA|LF|SR)-\d{6}-[A-HJ-NP-Z2-9]{4}$/;

/**
 * The deadline. `slaDays` from the block wins when it is a positive number;
 * the kind's default otherwise. The editor stores a blank number field as 0
 * (lib/blocks/form.js), so 0 is "standard for this kind", not "today".
 */
export function dueAt(kind, slaDays, now = new Date()) {
  const n = Math.floor(Number(slaDays));
  const fallback = KINDS[isKind(kind) ? kind : 'general'].slaDays;
  const days = Number.isFinite(n) && n > 0 ? n : fallback;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Which fields the form asks for. Every kind takes a name and a message;
 * the block's selects decide whether phone, email, vehicle number and
 * location are asked. Returned as a plain object so the client form and the
 * server validation read one decision.
 */
export function fieldPlan(data = {}) {
  return {
    phone: data.askPhone !== 'no',
    email: data.askEmail !== 'no',
    vehicle: data.askVehicle === 'yes',
    location: data.askLocation === 'yes',
  };
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits, spaces, +, -, ( ): enough for "+880 1610-285004" and nothing that
// is not a phone number. Validated for shape only, like email.
const PHONE_RE = /^\+?[\d\s\-()]{6,25}$/;

/**
 * Validate a submission. Returns `{ ok: true, value }` or
 * `{ ok: false, fields: [...] }` (plus `tooLong` when that is the reason),
 * the same contract ContactForm's action uses, so the live-region messaging
 * is identical.
 *
 * A request needs SOME way to reach the person back: phone or email,
 * whichever the block asks for; when it asks for both, either will do. A
 * grievance nobody can answer is a row, not a case.
 */
export function validateRequest(raw, plan, maxChars) {
  const value = {
    name: str(raw.name), phone: str(raw.phone), email: str(raw.email),
    vehicle_no: str(raw.vehicle_no), location: str(raw.location),
    subject: str(raw.subject), message: str(raw.message),
  };
  if (value.message.length > maxChars) return { ok: false, tooLong: true, fields: ['message'] };

  const fields = [];
  if (!value.name) fields.push('name');
  if (!value.message) fields.push('message');

  if (!plan.phone) value.phone = '';
  if (!plan.email) value.email = '';
  if (!plan.vehicle) value.vehicle_no = '';
  if (!plan.location) value.location = '';

  const phoneOk = plan.phone && value.phone !== '' && PHONE_RE.test(value.phone);
  const emailOk = plan.email && value.email !== '' && EMAIL_RE.test(value.email);
  // A malformed value is reported on its own field only: the person chose
  // that channel, and "also fill in email" would be noise. Both fields are
  // named together only when both were left empty.
  const malformed = [];
  if (plan.phone && value.phone !== '' && !phoneOk) malformed.push('phone');
  if (plan.email && value.email !== '' && !emailOk) malformed.push('email');
  if (malformed.length) fields.push(...malformed);
  else if ((plan.phone || plan.email) && !phoneOk && !emailOk) {
    if (plan.phone) fields.push('phone');
    if (plan.email) fields.push('email');
  }
  if (plan.vehicle && !value.vehicle_no) fields.push('vehicle_no');
  if (plan.location && !value.location) fields.push('location');

  return fields.length ? { ok: false, fields } : { ok: true, value };
}
