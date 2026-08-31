import fs from 'node:fs/promises';
import path from 'node:path';
import { query, dbEnabled } from './db.js';

/**
 * Uploads live outside the repository on the server so that a `git pull`
 * deploy can never delete them. MEDIA_ROOT must be an absolute path outside
 * the repo in production; locally it falls back to var/uploads, which is
 * also outside `public/` on purpose — see app/uploads/[...path]/route.js,
 * which is what actually serves files from this directory. Falling back to
 * public/uploads/ here would make the local and production paths behave
 * differently (one served by Next's static handler, one not served at all).
 */
export function uploadRoot() {
  return process.env.MEDIA_ROOT || path.join(process.cwd(), 'var', 'uploads');
}

export function safeFilename(name) {
  const raw = String(name || '');
  const base = raw.split(/[\\/]+/).filter((s) => s && s !== '..' && s !== '.').join('-');
  const ext = path.extname(base).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const stem = base.slice(0, base.length - path.extname(base).length);
  const clean = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return (clean || 'file') + ext;
}

/**
 * The stored extension MUST come from here, never from the client-supplied
 * filename. `file.type` on a multipart part is attacker-controlled input
 * validated against an allowlist by the caller — but the filename's own
 * extension is never validated at all. Without this mapping, a request
 * could send filename="x.html" with a validated Content-Type of image/png
 * and have the file land on disk (and be served) as .html.
 */
const MIME_EXTENSIONS = {
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
};

export const ALLOWED_MIME_TYPES = Object.keys(MIME_EXTENSIONS);

export function extensionForMime(mime) {
  return MIME_EXTENSIONS[mime] || null;
}

export async function saveUpload({ buffer, filename, mime }) {
  const ext = extensionForMime(mime);
  if (!ext) {
    throw new Error(`Unsupported file type: ${mime || 'unknown'}`);
  }

  const dir = uploadRoot();
  await fs.mkdir(dir, { recursive: true });

  // Use the sanitised filename only for its STEM — its own extension is
  // untrusted client input and is discarded in favour of `ext` above.
  const safeName = safeFilename(filename);
  const safeExt = path.extname(safeName);
  const stem = (safeExt ? safeName.slice(0, -safeExt.length) : safeName) || 'file';

  // Never silently overwrite an existing asset, and never race a concurrent
  // upload for the same name: the `wx` flag makes "does this name exist"
  // and "write it" one atomic operation, so two requests can't both listen
  // for "not found" and then both win the same path.
  let name = `${stem}${ext}`;
  let n = 1;
  const MAX_ATTEMPTS = 50;
  for (;;) {
    try {
      await fs.writeFile(path.join(dir, name), buffer, { flag: 'wx' });
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      if (n > MAX_ATTEMPTS) {
        throw new Error('Could not find a free filename for this upload. Rename the file and try again.');
      }
      name = `${stem}-${n}${ext}`;
      n += 1;
    }
  }

  const publicPath = `/uploads/${name}`;
  try {
    if (!dbEnabled()) {
      throw new Error('Cannot save this upload: the database is not configured (DB_HOST/DB_NAME/DB_USER).');
    }
    const res = await query(
      'INSERT INTO media (path, bytes, mime, alt) VALUES (?, ?, ?, ?)',
      [publicPath, buffer.length, mime || '', JSON.stringify({})]
    );
    return { id: res.insertId, path: publicPath };
  } catch (err) {
    // The file already landed on disk; don't leave it orphaned if the
    // database row never got created.
    await fs.unlink(path.join(dir, name)).catch(() => {});
    throw err;
  }
}

export async function listMedia() {
  const rows = (await query('SELECT id, path, width, height, alt FROM media ORDER BY id DESC')) || [];
  return rows.map((r) => ({ ...r, alt: typeof r.alt === 'string' ? JSON.parse(r.alt) : r.alt || {} }));
}

export async function setMediaAlt(id, locale, text) {
  const rows = await query('SELECT alt FROM media WHERE id = ? LIMIT 1', [id]);
  const current = rows?.[0]?.alt;
  const alt = { ...(typeof current === 'string' ? JSON.parse(current) : current || {}), [locale]: text };
  await query('UPDATE media SET alt = ? WHERE id = ?', [JSON.stringify(alt), id]);
}
