'use server';

import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { query, dbEnabled } from '../../../../lib/db';
import { isStatus, KIND_VALUES, standardDays } from '../../../../lib/requests/policy.js';
import { setSetting } from '../../../../lib/settings';
import { validationError } from '../../../../lib/errors';

const ADMIN = '/admin/requests';
const NOTE_MAX = 4000;

/**
 * The service request queue's actions.
 *
 * Gated on `manage_users` like the contact inbox: service_requests holds
 * names, phone numbers, plate numbers and the substance of grievances —
 * personal data — and only admins hold that permission (lib/auth/roles.js).
 */

/** Move a request through new -> in_progress -> resolved -> closed, with an
 *  optional note. `resolved_at` is stamped the first time it reaches
 *  resolved or closed and cleared if it is reopened, so the queue's overdue
 *  arithmetic stays honest. */
async function updateRequestAction$inner(formData) {
  await assertCan('manage_users');
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  const status = String(formData.get('status') || '');
  const note = String(formData.get('admin_note') || '').trim().slice(0, NOTE_MAX);
  if (!Number.isFinite(id) || !isStatus(status)) return;
  const done = status === 'resolved' || status === 'closed';
  await query(
    `UPDATE service_requests
        SET status = ?, admin_note = ?,
            resolved_at = CASE WHEN ? THEN COALESCE(resolved_at, NOW()) ELSE NULL END
      WHERE id = ?`,
    [status, note, done ? 1 : 0, id],
  );
  revalidatePath(ADMIN);
  revalidatePath('/admin');
}

async function deleteRequestAction$inner(formData) {
  await assertCan('manage_users');
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) await query('DELETE FROM service_requests WHERE id = ?', [id]);
  revalidatePath(ADMIN);
  revalidatePath('/admin');
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
/** The standard response deadline per kind (audit 5.4). */
async function saveStandardsAction$inner(formData) {
  await assertCan('manage_users');
  const raw = {};
  for (const k of KIND_VALUES) {
    const v = String(formData.get(`sla_${k}`) ?? '').trim();
    if (v === '') continue;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      throw validationError('Each response deadline must be a whole number of days from 1 to 365, or blank for the built-in standard.');
    }
    raw[k] = n;
  }
  await setSetting('requests.sla_days', standardDays(raw));
  revalidatePath(ADMIN);
}

export async function saveStandardsAction(formData) {
  return runAction(() => saveStandardsAction$inner(formData));
}
export async function updateRequestAction(formData) {
  return runAction(() => updateRequestAction$inner(formData));
}
export async function deleteRequestAction(formData) {
  return runAction(() => deleteRequestAction$inner(formData));
}
