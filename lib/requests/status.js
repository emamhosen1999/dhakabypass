import { query, dbEnabled } from '../db.js';
import { TRACKING_RE } from './policy.js';

/**
 * Looking up a request by its tracking number (concession audit CON-CS-03).
 *
 * The number alone is not enough: it is printed on a screen and read out on
 * the phone, so anyone who saw it could follow the case. The reader also
 * gives the last four digits of the phone number or the email address the
 * request was filed with, and only a match returns anything. What comes back
 * is the status, the dates and the kind — never the message, the name or the
 * contact details themselves.
 */
export function normaliseTracking(value) {
  const v = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  return TRACKING_RE.test(v) ? v : '';
}

export function contactMatches(row, proof) {
  const p = String(proof || '').trim().toLowerCase();
  if (!p) return false;
  const phone = String(row.phone || '').replace(/\D/g, '');
  if (/^\d{4}$/.test(p) && phone.length >= 4 && phone.endsWith(p)) return true;
  const email = String(row.email || '').trim().toLowerCase();
  return Boolean(email) && p === email;
}

export async function lookupRequest(tracking, proof) {
  const no = normaliseTracking(tracking);
  if (!no || !dbEnabled()) return { outcome: 'invalid' };
  const rows = await query(
    'SELECT tracking_no, kind, status, phone, email, created_at, due_at, resolved_at FROM service_requests WHERE tracking_no = ? LIMIT 1',
    [no],
  );
  const row = rows?.[0];
  if (!row || !contactMatches(row, proof)) return { outcome: 'not_found' };
  return {
    outcome: 'found',
    trackingNo: row.tracking_no,
    kind: row.kind,
    status: row.status,
    createdAt: row.created_at,
    dueAt: row.due_at,
    resolvedAt: row.resolved_at,
    overdue: Boolean(row.due_at && !row.resolved_at && new Date(row.due_at) < new Date()),
  };
}
