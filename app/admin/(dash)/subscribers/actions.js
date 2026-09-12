'use server';

import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { query, dbEnabled } from '../../../../lib/db';

/**
 * Removing an address from the sign-up list. `manage_users`, like the
 * contact inbox: an email address is personal data, and the erasure request
 * the privacy page promises has to be something an admin can actually do.
 */
async function deleteSubscriberAction$inner(formData) {
  await assertCan('manage_users');
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) await query('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
  revalidatePath('/admin/subscribers');
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function deleteSubscriberAction(formData) {
  return runAction(() => deleteSubscriberAction$inner(formData));
}
