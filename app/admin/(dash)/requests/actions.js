'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { query, dbEnabled } from '../../../../lib/db';
import { isStatus } from '../../../../lib/requests/policy.js';

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
export async function updateRequestAction(formData) {
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

export async function deleteRequestAction(formData) {
  await assertCan('manage_users');
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) await query('DELETE FROM service_requests WHERE id = ?', [id]);
  revalidatePath(ADMIN);
  revalidatePath('/admin');
}
