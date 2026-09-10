'use server';

import { revalidatePath } from 'next/cache';
import { revalidateNews } from '../../lib/revalidate.js';
import { assertCan } from '../../lib/auth/assert-can';
import { saveContent, getContent } from '../../lib/content';
import { query, dbEnabled } from '../../lib/db';
import { rateLimit, clientIp } from '../../lib/rate-limit.js';
import {
  PUBLIC_WRITE_LIMIT, PUBLIC_WRITE_WINDOW_MS, MAX_MESSAGE_CHARS,
} from '../../lib/public-write-policy.js';
import { t } from '../../lib/i18n/ui.js';
import { DEFAULT_LOCALE } from '../../lib/i18n/locales.js';
import { headers } from 'next/headers';

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

/** Save a whole content section (object of field -> value). */
export async function saveSectionAction(sectionKey, formData) {
  await requireAdmin('manage_pages'); // editing site content

  const current = (await getContent(sectionKey)) || {};
  const updated = structuredClone(current);

  for (const [name, value] of formData.entries()) {
    if (name.startsWith('$')) continue; // next internals
    setByPath(updated, name, value);
  }

  await saveContent(sectionKey, updated);
  revalidateSite();
  return { ok: true };
}

/**
 * Sets a value at a dotted/bracketed path, e.g. "stats.0.value" or "paragraphs.2".
 * Numeric segments index arrays. Keeps the original type where sensible.
 */
// A form field name becomes an object path here, and the field names come
// from the request. Without this guard a field called `__proto__.x` walks to
// Object.prototype and assigns to it -- process-wide until Passenger restarts,
// and invisible in the saved JSON because no own property is ever created.
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function setByPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  if (parts.some((k) => UNSAFE_KEYS.has(k))) return;
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (node[k] == null) node[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    node = node[k];
  }
  node[parts.at(-1)] = value;
}

/** Gallery: add / update caption / reorder / delete. */
export async function saveGalleryAction(formData) {
  await requireAdmin('manage_media'); // gallery images are media
  if (!dbEnabled()) throw new Error('Database is not configured');

  const ids = formData.getAll('id');
  for (const id of ids) {
    const caption = formData.get(`caption_${id}`) ?? '';
    const sort = Number(formData.get(`sort_${id}`) ?? 0);
    await query('UPDATE gallery_images SET caption = ?, sort_order = ? WHERE id = ?', [
      String(caption),
      Number.isFinite(sort) ? sort : 0,
      Number(id),
    ]);
  }
  revalidateSite();
  return { ok: true };
}

export async function deleteGalleryImageAction(formData) {
  await requireAdmin('manage_media'); // gallery images are media
  if (!dbEnabled()) throw new Error('Database is not configured');
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) {
    await query('DELETE FROM gallery_images WHERE id = ?', [id]);
  }
  revalidateSite();
}

/**
 * The legacy `uploadImageAction` used to live here. It took the stored file
 * extension straight from the client-supplied `file.name`, never looked at
 * `file.type`, allowed `.svg`, and wrote into `public/` — where Next's static
 * handler serves the bytes with none of the protections
 * app/uploads/[...path]/route.js applies (extension-derived Content-Type,
 * nosniff, a sandbox CSP, and Content-Disposition: attachment for SVG). An
 * uploaded SVG carrying a <script> therefore executed on the admin's own
 * origin and could drive every server action as that admin.
 *
 * Uploads now go through lib/media.js's saveUpload(), which derives the
 * extension from a validated MIME type and writes outside public/ — see
 * app/admin/api/upload/route.js, the single entry point all three admin
 * uploaders (FieldInput, GalleryManager, NewsForm) now use.
 */

/** Contact messages (from the public contact form). */
export async function deleteMessageAction(formData) {
  await requireAdmin('manage_users'); // contact_messages holds personal data; keep it to admins
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) {
    await query('DELETE FROM contact_messages WHERE id = ?', [id]);
  }
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}

export async function toggleMessageReadAction(formData) {
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

/**
 * The two intentionally-PUBLIC actions in this file — no session, no
 * assertCan. They are the site's only unauthenticated write paths, which is
 * why the limits below exist (C-D16 / C-S4).
 *
 * The limit, the window and the message cap are the same policy the localised
 * contact form uses, read from lib/public-write-policy.js so there is one
 * declaration rather than two that drift.
 *
 * Separate rate-limit BUCKETS from that form, though, so a reader using the
 * modern contact page cannot exhaust this endpoint's budget or vice versa.
 */

/** The caller's rate-limit key, degrading to one shared bucket. */
async function requestIp() {
  try {
    return clientIp(await headers());
  } catch {
    return 'unknown';
  }
}

/** Public contact form submission */
export async function submitContactAction(formData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const subject = String(formData.get('subject') || '').trim();
  const message = String(formData.get('message') || '').trim();

  // `message` is longtext and was unbounded: one request could store
  // megabytes. Checked before the rate limit so a person who pasted a long
  // document is not also locked out for ten minutes.
  if (message.length > MAX_MESSAGE_CHARS) {
    return { ok: false, error: t(DEFAULT_LOCALE, 'formErrorTooLong') };
  }

  if (!rateLimit('legacy-contact', await requestIp(), {
    limit: PUBLIC_WRITE_LIMIT, windowMs: PUBLIC_WRITE_WINDOW_MS,
  }).ok) {
    return { ok: false, error: t(DEFAULT_LOCALE, 'formErrorRateLimited') };
  }

  if (!name || !email || !message) {
    return { ok: false, error: 'Please fill in all required fields (Name, Email, Message).' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  if (dbEnabled()) {
    try {
      await query(
        'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
        [name, email, subject, message]
      );
      revalidatePath('/admin/messages');
      revalidatePath('/admin');
    } catch (err) {
      /**
       * C-D17. This used to log and `return { ok: true }` anyway, with the
       * comment "Still return success to user so public UX doesn't crash" —
       * thanking the sender for a message that does not exist. Not crashing
       * the page is the right instinct and is preserved: the throw is still
       * caught. What changes is that the sender is now TOLD, so a person
       * reporting a hazard or making a compensation claim knows to use
       * another route instead of waiting for a reply that cannot come.
       *
       * Logged without the parameters: they contain the sender's own data.
       */
      console.error('Failed to save contact message to DB:', err && err.code);
      return { ok: false, error: t(DEFAULT_LOCALE, 'formErrorUnavailable') };
    }
  }

  return { ok: true };
}

/** Public newsletter subscription */
export async function subscribeNewsletterAction(formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();

  if (!rateLimit('legacy-newsletter', await requestIp(), {
    limit: PUBLIC_WRITE_LIMIT, windowMs: PUBLIC_WRITE_WINDOW_MS,
  }).ok) {
    return { ok: false, error: t(DEFAULT_LOCALE, 'formErrorRateLimited') };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  if (dbEnabled()) {
    try {
      await query(
        'INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)',
        [email]
      );
    } catch (err) {
      // Same correction as the contact action above. INSERT IGNORE means a
      // duplicate address is NOT an error and still reports success, so a
      // throw reaching here is a real failure and is reported as one.
      console.error('Failed to save newsletter subscriber:', err && err.code);
      return { ok: false, error: t(DEFAULT_LOCALE, 'formErrorUnavailable') };
    }
  }

  return { ok: true };
}

/** News / Latest Updates CRUD */
export async function saveNewsAction(formData) {
  await requireAdmin('publish'); // news goes straight to the public site
  if (!dbEnabled()) throw new Error('Database is not configured');

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

export async function deleteNewsAction(formData) {
  await requireAdmin('publish'); // unpublishing is publishing
  if (!dbEnabled()) throw new Error('Database is not configured');

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
