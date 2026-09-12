'use server';

import { validationError } from '../../lib/errors';
import { runAction } from '../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { revalidateNews } from '../../lib/revalidate.js';
import { assertCan } from '../../lib/auth/assert-can';
import { query, dbEnabled } from '../../lib/db';

/**
 * Every action re-checks the session AND the caller's role.
 *
 * This used to check `isAdmin` alone, which made the whole legacy admin
 * invisible to the role model: `isAdmin` only means the address is on
 * ADMIN_EMAILS, and PERMISSIONS in lib/auth/roles.js is what separates an
 * editor from a translator. A translator could therefore publish news to the
 * public site, delete gallery images, and read and delete every row of
 * contact_messages -- which holds submitted personal data.
 *
 * Worse, someone on ADMIN_EMAILS with no `users` row has role `undefined`;
 * can() fails closed on that in the new admin, while this tree handed them
 * full content control.
 *
 * The permission is per action, not one blanket grant, because these are not
 * equivalent privileges: deleting a member of the public's message is not the
 * same act as saving a page section.
 */
async function requireAdmin(action) {
  return assertCan(action);
}

function revalidateSite() {
  // content is force-dynamic, but revalidate anyway so any cached shell refreshes
  revalidatePath('/', 'layout');
}

async function deleteMessageAction$inner(formData) {
  await requireAdmin('manage_users'); // contact_messages holds personal data; keep it to admins
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) {
    await query('DELETE FROM contact_messages WHERE id = ?', [id]);
  }
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}

async function toggleMessageReadAction$inner(formData) {
  await requireAdmin('manage_users'); // same table, same data
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  const isRead = formData.get('read') === 'true';
  if (Number.isFinite(id)) {
    await query(
      'UPDATE contact_messages SET read_at = ? WHERE id = ?',
      [isRead ? null : new Date(), id]
    );
  }
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}

/** News / Latest Updates CRUD */
async function saveNewsAction$inner(formData) {
  await requireAdmin('publish'); // news goes straight to the public site
  if (!dbEnabled()) throw validationError('Database is not configured');

  const id = Number(formData.get('id'));
  const title = String(formData.get('title') || '').trim();
  let slug = String(formData.get('slug') || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `news-${Date.now()}`;
  }

  const category = String(formData.get('category') || 'Operations').trim();
  const source = String(formData.get('source') || '').trim();
  const url = String(formData.get('url') || '').trim();
  const excerpt = String(formData.get('excerpt') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const image = String(formData.get('image') || '').trim();
  const published_at = String(formData.get('published_at') || new Date().toISOString().slice(0, 10));
  const is_published = formData.get('is_published') === '1' || formData.get('is_published') === 'on' ? 1 : 0;

  if (!title) {
    return { ok: false, error: 'Title is required' };
  }

  if (Number.isFinite(id) && id > 0) {
    await query(
      `UPDATE news_updates
       SET title = ?, slug = ?, category = ?, source = ?, url = ?, excerpt = ?, body = ?, image = ?, published_at = ?, is_published = ?
       WHERE id = ?`,
      [title, slug, category, source, url, excerpt, body, image, published_at, is_published, id]
    );
  } else {
    await query(
      `INSERT INTO news_updates (title, slug, category, source, url, excerpt, body, image, published_at, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, category, source, url, excerpt, body, image, published_at, is_published]
    );
  }

  revalidatePath('/latest-updates');
  revalidatePath('/admin/news');
  revalidatePath('/admin');
  // The localised newsroom reads through unstable_cache with a 300-second
  // recovery floor. Without this tag an editor's change would take up to five
  // minutes to appear at /en/news while showing instantly on the legacy page —
  // which reads as the new site being broken.
  revalidateNews();
  return { ok: true };
}

async function deleteNewsAction$inner(formData) {
  await requireAdmin('publish'); // unpublishing is publishing
  if (!dbEnabled()) throw validationError('Database is not configured');

  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) {
    await query('DELETE FROM news_updates WHERE id = ?', [id]);
  }

  revalidatePath('/latest-updates');
  revalidatePath('/admin/news');
  revalidatePath('/admin');
  revalidateNews();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function deleteMessageAction(formData) {
  return runAction(() => deleteMessageAction$inner(formData));
}
export async function toggleMessageReadAction(formData) {
  return runAction(() => toggleMessageReadAction$inner(formData));
}
export async function saveNewsAction(formData) {
  return runAction(() => saveNewsAction$inner(formData));
}
export async function deleteNewsAction(formData) {
  return runAction(() => deleteNewsAction$inner(formData));
}
