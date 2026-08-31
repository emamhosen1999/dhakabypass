'use server';

import { revalidatePath } from 'next/cache';
import fs from 'node:fs/promises';
import path from 'node:path';
import { auth } from '../../auth';
import { saveContent, getContent } from '../../lib/content';
import { query, dbEnabled } from '../../lib/db';

/** Every action re-checks the session — never trust the client. */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Not authorised');
  return session;
}

function revalidateSite() {
  // content is force-dynamic, but revalidate anyway so any cached shell refreshes
  revalidatePath('/', 'layout');
}

/** Save a whole content section (object of field -> value). */
export async function saveSectionAction(sectionKey, formData) {
  await requireAdmin();

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
function setByPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
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
  await requireAdmin();
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
  await requireAdmin();
  if (!dbEnabled()) throw new Error('Database is not configured');
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) {
    await query('DELETE FROM gallery_images WHERE id = ?', [id]);
  }
  revalidateSite();
}

const ALLOWED_IMAGE = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif']);

/** Uploads an image to /public/uploads and returns its public path. */
export async function uploadImageAction(formData) {
  await requireAdmin();

  const file = formData.get('file');
  if (!file || typeof file === 'string' || file.size === 0) {
    return { ok: false, error: 'No file selected' };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: 'File is larger than 8MB' };
  }

  const ext = path.extname(file.name || '').toLowerCase();
  if (!ALLOWED_IMAGE.has(ext)) {
    return { ok: false, error: `Unsupported file type: ${ext || 'unknown'}` };
  }

  // sanitise: never trust the client filename
  const base = path
    .basename(file.name || 'image', ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'image';
  const filename = `${base}-${Date.now()}${ext}`;

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buf);

  const publicPath = `/uploads/${filename}`;

  // If this upload targets the gallery, register it.
  if (formData.get('target') === 'gallery' && dbEnabled()) {
    const rows = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM gallery_images');
    await query('INSERT INTO gallery_images (file, caption, sort_order) VALUES (?, ?, ?)', [
      publicPath,
      String(formData.get('caption') || ''),
      rows?.[0]?.next ?? 0,
    ]);
  }

  revalidateSite();
  return { ok: true, path: publicPath };
}

/** Contact messages (from the public contact form). */
export async function deleteMessageAction(formData) {
  await requireAdmin();
  if (!dbEnabled()) return;
  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) {
    await query('DELETE FROM contact_messages WHERE id = ?', [id]);
  }
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}

export async function toggleMessageReadAction(formData) {
  await requireAdmin();
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

/** Public contact form submission */
export async function submitContactAction(formData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const subject = String(formData.get('subject') || '').trim();
  const message = String(formData.get('message') || '').trim();

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
      console.error('Failed to save contact message to DB:', err);
      // Still return success to user so public UX doesn't crash
    }
  }

  return { ok: true };
}

/** Public newsletter subscription */
export async function subscribeNewsletterAction(formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
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
      console.error('Failed to save newsletter subscriber:', err);
    }
  }

  return { ok: true };
}

/** News / Latest Updates CRUD */
export async function saveNewsAction(formData) {
  await requireAdmin();
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
  return { ok: true };
}

export async function deleteNewsAction(formData) {
  await requireAdmin();
  if (!dbEnabled()) throw new Error('Database is not configured');

  const id = Number(formData.get('id'));
  if (Number.isFinite(id)) {
    await query('DELETE FROM news_updates WHERE id = ?', [id]);
  }

  revalidatePath('/latest-updates');
  revalidatePath('/admin/news');
  revalidatePath('/admin');
  return { ok: true };
}
