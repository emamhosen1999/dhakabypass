'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidatePage, revalidateMedia } from '../../../../lib/revalidate';
import { query, withTransaction } from '../../../../lib/db';
import { saveUpload, ALLOWED_MIME_TYPES } from '../../../../lib/media';
import { imageSize } from '../../../../lib/media/probe';
import { applyMediaReplacement } from '../../../../lib/media/replace';
// friendly() is the browser-facing error allowlist; see lib/errors.js before
// touching it. It lives in an ordinary module because a 'use server' file may
// export async functions only.
import { validationError, friendly } from '../../../../lib/errors';

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

/**
 * Replaces the file behind an existing media row.
 *
 * The row keeps its id; the file, its dimensions, its origin, its alt text and
 * its focal point all change. Because blocks reference an image by PATH rather
 * than by id (see lib/media/references.js), every stored reference to the old
 * path is repointed in the same transaction — otherwise the picture would
 * simply vanish from the pages that used it.
 *
 * The alt text and focal point are RESET rather than carried over: they
 * describe the bytes, not the row. lib/media/replace.js explains why at
 * length, and holds everything this does to rows so it can be tested against a
 * real database without an authenticated session.
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

    slugs = await withTransaction((q) =>
      applyMediaReplacement(q, {
        id,
        oldPath: target.path,
        newPath: saved.path,
        width: size.width,
        height: size.height,
        bytes: buffer.length,
        mime: size.mime,
        surplusId: saved.id,
        notFound: () => validationError('That image no longer exists.'),
      }));
  } catch (err) {
    friendly(err, 'The image could not be replaced. Please try again.');
  }

  // The real tag: lib/content/cache.js caches a page's blocks under
  // pageTag(slug) and the page list under LIST_TAG, and revalidatePage() fires
  // both. There is no global 'pages' tag — invalidating one would be a no-op.
  for (const slug of slugs) revalidatePage(slug);
  // The public gallery reads the media library through its own cache entry,
  // which pageTag() does not touch. Replacing a photograph that is in the
  // gallery has to invalidate that too, or the old picture keeps serving there
  // for up to the 300-second recovery floor while the pages show the new one.
  revalidateMedia();
  revalidatePath(ADMIN);
}

/**
 * Show or hide one image in the public gallery.
 *
 * `media.in_gallery` defaults to 0, so a picture uploaded for a page block never
 * reaches the public gallery until someone says it should (see
 * scripts/db-setup-v8.mjs). Without this action that flag would be frozen at
 * whatever the migration set, and the gallery could never be curated.
 *
 * Guarded by the same `edit_blocks` capability as the rest of this screen:
 * deciding what the public sees is an editorial act, not an administrative one.
 */
export async function setGalleryVisibilityAction(formData) {
  await assertCan(ACTION);

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    validationError('That image no longer exists.');
  }
  // The form submits the value it wants, not a toggle. A toggle read from the
  // page's own state double-fires when a request is retried or a button is
  // double-clicked, and lands on the opposite of what the editor chose.
  const show = String(formData.get('show')) === '1' ? 1 : 0;

  try {
    const result = await query('UPDATE media SET in_gallery = ? WHERE id = ?', [show, id]);
    if (result && result.affectedRows === 0) {
      validationError('That image no longer exists.');
    }
  } catch (err) {
    friendly(err, 'The gallery could not be updated. Please try again.');
  }

  revalidateMedia();
  revalidatePath(ADMIN);
}
