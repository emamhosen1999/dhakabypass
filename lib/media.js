import fs from 'node:fs/promises';
import path from 'node:path';
import { query, dbEnabled } from './db.js';
import { imageSize } from './media/probe.js';

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
  // Object.hasOwn guards against prototype keys (e.g. mime === 'constructor',
  // 'toString', '__proto__') — a bare MIME_EXTENSIONS[mime] lookup would
  // resolve those up the prototype chain and return a truthy inherited
  // value, which saveUpload's `if (!ext)` guard would then wrongly accept.
  return Object.hasOwn(MIME_EXTENSIONS, mime) ? MIME_EXTENSIONS[mime] : null;
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
    // Read the real pixel dimensions out of the file's own header.
    //
    // Without them the row lands at width = 0, height = 0, and TWO things go
    // wrong that nobody connects back to the upload: the Media screen reports
    // "Size unknown" for every image an operator ever uploads, and
    // components/SiteImage.jsx omits the width/height attributes — so the
    // browser reserves no box and the page jumps under the reader while the
    // bytes arrive.
    //
    // imageSize() returns null rather than throwing for anything it cannot
    // read — an SVG (which has no pixel header but is an allowed type here),
    // a truncated file, a format the four header readers do not cover. Zero is
    // the honest answer in that case and is exactly what the screen and
    // SiteImage already treat as unknown; refusing the upload would be a new
    // failure mode on a file type this module deliberately admits. The
    // per-screen decision about which types to accept belongs to the caller —
    // app/admin/(dash)/media/actions.js rejects SVG for this reason.
    const size = imageSize(buffer);
    const res = await query(
      'INSERT INTO media (path, bytes, mime, width, height, alt) VALUES (?, ?, ?, ?, ?, ?)',
      [publicPath, buffer.length, mime || '', size?.width || 0, size?.height || 0,
        JSON.stringify({})]
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

// setMediaAlt lives in lib/media/repo.js, alongside mediaAlt() which reads the
// same column. It was previously duplicated here with a per-locale signature
// that nothing called; two functions of the same name writing the same column
// with different argument shapes is a trap, so there is now exactly one.
