import fs from 'node:fs/promises';
import path from 'node:path';
import { query } from './db.js';

/**
 * Uploads live outside the repository on the server so that a `git pull`
 * deploy can never delete them. Locally they fall back to public/uploads.
 */
export function uploadRoot() {
  return process.env.MEDIA_ROOT || path.join(process.cwd(), 'public', 'uploads');
}

export function safeFilename(name) {
  const raw = String(name || '');
  const base = raw.split(/[\\/]+/).filter((s) => s && s !== '..' && s !== '.').join('-');
  const ext = path.extname(base).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const stem = base.slice(0, base.length - path.extname(base).length);
  const clean = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (clean || 'file') + ext;
}

export async function saveUpload({ buffer, filename, mime }) {
  const dir = uploadRoot();
  await fs.mkdir(dir, { recursive: true });

  let name = safeFilename(filename);
  // Never silently overwrite an existing asset.
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let n = 1;
  while (true) {
    try {
      await fs.access(path.join(dir, name));
      name = `${stem}-${n}${ext}`;
      n += 1;
    } catch {
      break;
    }
  }

  await fs.writeFile(path.join(dir, name), buffer);
  const publicPath = `/uploads/${name}`;
  const res = await query(
    'INSERT INTO media (path, bytes, mime, alt) VALUES (?, ?, ?, ?)',
    [publicPath, buffer.length, mime || '', JSON.stringify({})]
  );
  return { id: res.insertId, path: publicPath };
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
