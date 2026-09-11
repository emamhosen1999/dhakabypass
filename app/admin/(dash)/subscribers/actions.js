'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { query, dbEnabled } from '../../../../lib/db';

/**
 * Removing an address from the sign-up list. `manage_users`, like the
 * contact inbox: an email address is personal data, and the erasure request
 * the privacy page promises has to be something an admin can actually do.
 */
export async function deleteSubscriberAction(formData) {
  await assertCan('manage_users');
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) await query('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
  revalidatePath('/admin/subscribers');
}
