'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidatePage } from '../../../../lib/revalidate';
import { query, withTransaction } from '../../../../lib/db';
import { saveUpload, ALLOWED_MIME_TYPES } from '../../../../lib/media';
import { imageSize } from '../../../../lib/media/probe';
import { swapMediaPath } from '../../../../lib/media/references';

const ADMIN = '/admin/media';

/** Swapping the picture on a page is an edit to that page, not a translation. */
const ACTION = 'edit_blocks';

/**
 * The library replaces PHOTOGRAPHS. `lib/media.js` also admits image/svg+xml,
 * which this screen deliberately does not: an SVG is a script-carrying
 * document, and `imageSize` cannot read one anyway, so the row's width and
 * height would be left at zero and every page using it would lose the layout
 * box it reserves before the bytes arrive. The extension still comes from
 * lib/media.js's MIME map — this only narrows which MIME types get that far.
 */
const REPLACEABLE_MIME_TYPES = ALLOWED_MIME_TYPES.filter((m) => m !== 'image/svg+xml');

function validationError(message) {
  const err = new Error(message);
  err.code = 'VALIDATION';
  return err;
}

/**
 * Allowlist, not a denylist — the same sanitiser as
 * app/admin/(dash)/corridor/actions.js and for the same reason. Only errors we
 * raised ourselves and marked `.code = 'VALIDATION'` reach the browser
 * unchanged. Everything else — a driver error, a misconfiguration message
 * naming DB_HOST, an internal TypeError — becomes the caller's generic
 * fallback. A failure mode added later defaults to hidden, not to leaking.
 */
function friendly(err, fallback) {
  if (err?.code === 'VALIDATION') throw err;
  throw new Error(fallback);
}

/** LIKE treats % and _ as wildcards. A media path should contain neither, but
 *  the prefilter below must not silently widen if one ever does. */
function likeEscape(value) {
  return String(value).replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Replaces the file behind an existing media row.
 *
 * The row keeps its id, its alt text and its focal point; only the file, its
 * dimensions and its origin change. Because blocks reference an image by PATH
 * rather than by id (see lib/media/references.js), every stored reference to
 * the old path is repointed in the same transaction — otherwise the picture
 * would simply vanish from the pages that used it.
 */
export async function replaceMediaAction(formData) {
  await assertCan(ACTION);

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw validationError('Pick an image to replace.');

  const file = formData.get('file');
  if (!file || typeof file.arrayBuffer !== 'function' || !file.size) {
    throw validationError('Choose a file to upload.');
  }
  if (!REPLACEABLE_MIME_TYPES.includes(file.type)) {
    throw validationError(`That file type is not allowed. Use ${REPLACEABLE_MIME_TYPES.join(', ')}.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const size = imageSize(buffer);
  if (!size) {
    throw validationError('That file does not look like an image we can read. Send the original camera file.');
  }

  let slugs = [];
  try {
    const existing = await query('SELECT id, path FROM media WHERE id = ? LIMIT 1', [id]);
    const target = existing && existing[0];
    if (!target) throw validationError('That image no longer exists.');

    // saveUpload writes the file under MEDIA_ROOT with an extension derived
    // from the validated MIME type (never from the client's filename) and
    // INSERTs a media row of its own, returning { id, path }. We want the
    // file, not the row: the whole point is to keep the EXISTING row's id.
    const saved = await saveUpload({ buffer, filename: file.name, mime: file.type });

    slugs = await withTransaction(async (q) => {
      // media.path is UNIQUE, so saveUpload's surplus row has to release the
      // new path before the target row can take it. If anything below fails,
      // the rollback restores that row and the upload simply stays an ordinary
      // one — the bytes on disk are never orphaned by a failed replacement.
      await q('DELETE FROM media WHERE id = ?', [saved.id]);

      const res = await q(
        `UPDATE media SET path = ?, width = ?, height = ?, bytes = ?, mime = ?, origin = 'upload'
          WHERE id = ?`,
        [saved.path, size.width, size.height, buffer.length, size.mime, id],
      );
      if (!res || res.affectedRows === 0) throw validationError('That image no longer exists.');

      const touched = new Set();

      // LIKE is only a prefilter to keep the scan small; swapMediaPath decides
      // what actually matches, by whole-string equality.
      const blocks = await q(
        `SELECT bt.block_id, bt.locale, bt.data, p.slug
           FROM block_translations bt
           JOIN blocks b ON b.id = bt.block_id
           JOIN pages  p ON p.id = b.page_id
          WHERE bt.data LIKE CONCAT('%', ?, '%') ESCAPE '\\\\'`,
        [likeEscape(target.path)],
      );
      for (const row of blocks || []) {
        let data;
        try {
          data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        } catch {
          continue; // A hand-edited row that no longer parses is left alone.
        }
        const { data: next, changed } = swapMediaPath(data, target.path, saved.path);
        if (!changed) continue;
        await q(
          'UPDATE block_translations SET data = ? WHERE block_id = ? AND locale = ?',
          [JSON.stringify(next), row.block_id, row.locale],
        );
        if (row.slug) touched.add(row.slug);
      }

      // Social preview images are stored as a plain column, not inside JSON.
      const og = await q(
        `SELECT p.slug FROM page_translations pt
           JOIN pages p ON p.id = pt.page_id
          WHERE pt.og_image = ?`,
        [target.path],
      );
      for (const row of og || []) if (row.slug) touched.add(row.slug);
      await q('UPDATE page_translations SET og_image = ? WHERE og_image = ?', [saved.path, target.path]);

      return [...touched];
    });
  } catch (err) {
    friendly(err, 'The image could not be replaced. Please try again.');
  }

  // The real tag: lib/content/cache.js caches a page's blocks under
  // pageTag(slug) and the page list under LIST_TAG, and revalidatePage() fires
  // both. There is no global 'pages' tag — invalidating one would be a no-op.
  for (const slug of slugs) revalidatePage(slug);
  revalidatePath(ADMIN);
}
