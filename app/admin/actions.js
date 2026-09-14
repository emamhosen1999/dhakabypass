'use server';

import { validationError } from '../../lib/errors';
import { runAction } from '../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { revalidateNews } from '../../lib/revalidate.js';
import { assertCan } from '../../lib/auth/assert-can';
import { query, dbEnabled } from '../../lib/db';
import { saveRecord, deleteRecord } from '../../lib/admin/record-actions';
import { logAudit } from '../../lib/admin/history';
import { setFlash } from '../../lib/admin/context';
import { LOCALES } from '../../lib/i18n/locales';

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
    // Personal data: deleted outright when asked, but the deletion is logged.
    const rows = await query('SELECT email, subject FROM contact_messages WHERE id = ? LIMIT 1', [id]);
    await query('DELETE FROM contact_messages WHERE id = ?', [id]);
    await logAudit({ action: 'contact_message.delete', id, label: rows?.[0] ? `message "${rows[0].subject || '(no subject)'}"` : `message ${id}` });
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

  if (!title) throw validationError('Title is required');

  const existing = Number.isFinite(id) && id > 0
    ? (await query('SELECT slug FROM news_updates WHERE id = ? LIMIT 1', [id]))?.[0]
    : null;
  const clash = await query('SELECT id FROM news_updates WHERE slug = ? AND id <> ? LIMIT 1', [slug, Number.isFinite(id) ? id : 0]);
  if (clash?.length) throw validationError(`Another article already uses the address "${slug}". Choose a different one.`);

  try {
    await saveRecord('news', existing ? id : null, formData, async () => {
      if (existing) {
        await query(
          `UPDATE news_updates
           SET title = ?, slug = ?, category = ?, source = ?, url = ?, excerpt = ?, body = ?, image = ?, published_at = ?, is_published = ?
           WHERE id = ?`,
          [title, slug, category, source, url, excerpt, body, image, published_at, is_published, id]
        );
        return id;
      }
      const res = await query(
        `INSERT INTO news_updates (title, slug, category, source, url, excerpt, body, image, published_at, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, slug, category, source, url, excerpt, body, image, published_at, is_published]
      );
      return res.insertId;
    });
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') throw validationError(`Another article already uses the address "${slug}". Choose a different one.`);
    throw err;
  }

  // A changed address keeps shared links working (audit M3).
  let moved = false;
  if (existing && existing.slug && existing.slug !== slug) {
    moved = true;
    for (const locale of LOCALES) {
      const source = `/${locale}/news/${existing.slug}`;
      const destination = `/${locale}/news/${slug}`;
      await query(
        `INSERT INTO redirects (source, destination, status_code) VALUES (?, ?, 301)
         ON DUPLICATE KEY UPDATE destination = VALUES(destination), status_code = 301`,
        [source, destination],
      );
      await query('DELETE FROM redirects WHERE source = ?', [destination]);
    }
  }
  setFlash(`${is_published ? 'Saved and published' : 'Saved as a draft'}.${moved ? ` The old address now redirects to /news/${slug}.` : ''}`);

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
    // With its translations, to the trash.
    await deleteRecord('news', id, { formData });
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
  return runAction(() => deleteMessageAction$inner(formData), { name: 'deleteMessageAction', form: formData });
}
export async function toggleMessageReadAction(formData) {
  return runAction(() => toggleMessageReadAction$inner(formData), { name: 'toggleMessageReadAction', form: formData });
}
export async function saveNewsAction(formData) {
  return runAction(() => saveNewsAction$inner(formData), { name: 'saveNewsAction', form: formData });
}
export async function deleteNewsAction(formData) {
  return runAction(() => deleteNewsAction$inner(formData), { name: 'deleteNewsAction', form: formData });
}
