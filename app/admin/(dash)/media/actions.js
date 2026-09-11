'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidatePage, revalidateMedia } from '../../../../lib/revalidate';
import { query, withTransaction } from '../../../../lib/db';
import { saveUpload, ALLOWED_MIME_TYPES } from '../../../../lib/media';
import { imageSize } from '../../../../lib/media/probe';
import { applyMediaReplacement, pageSlugsUsingMedia } from '../../../../lib/media/replace';
import { getMediaById, setMediaAlt } from '../../../../lib/media/repo';
import { LOCALES } from '../../../../lib/i18n/locales';
// friendly() is the browser-facing error allowlist; see lib/errors.js before
// touching it. It lives in an ordinary module because a 'use server' file may
// export async functions only.
import { validationError, friendly } from '../../../../lib/errors';

const ADMIN = '/admin/media';

/**
 * Everything on this screen acts on the media library, so it gates on
 * `manage_media` — the same permission as `app/admin/api/media/route.js` and
 * `app/admin/api/upload/route.js`, which is where images otherwise enter.
 *
 * This was `edit_blocks` ("swapping the picture on a page is an edit to that
 * page"), which is true but names the consequence rather than the act. Only
 * `admin` and `editor` hold either, and both hold both (lib/auth/roles.js), so
 * nothing gains or loses access — what changes is that one screen no longer
 * describes the same operation by two different permissions depending on which
 * door it came through.
 */
const ACTION = 'manage_media';

/**
 * How long a description may be.
 *
 * Alt text is read aloud in one uninterrupted breath with no way to pause,
 * rewind or skim, so a paragraph is worse than useless — the listener has to
 * sit through all of it to find out whether it mattered. Roughly two sentences.
 * Long prose belongs in a caption, which is visible to everyone and skimmable.
 */
const MAX_ALT_LENGTH = 500;

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
 * The row keeps its id; the file, its dimensions and its origin change.
 * Because blocks reference an image by PATH rather than by id (see
 * lib/media/references.js), every stored reference to the old path is
 * repointed in the same transaction — otherwise the picture would simply
 * vanish from the pages that used it.
 *
 * The alt text and the focal point are CARRIED OVER. Replacing the file is not
 * the same act as discarding the description, and until 2026-09-11 it was
 * treated as one: an operator swapping a placeholder for a better copy of the
 * same photograph silently lost three languages of screen-reader text with no
 * undo. Clearing a description is now its own explicit act — empty the three
 * boxes on the row and save. lib/media/replace.js carries the full reasoning
 * and holds everything this does to rows so it can be tested against a real
 * database without an authenticated session.
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
    throw validationError('That image no longer exists.');
  }
  // The form submits the value it wants, not a toggle. A toggle read from the
  // page's own state double-fires when a request is retried or a button is
  // double-clicked, and lands on the opposite of what the editor chose.
  const show = String(formData.get('show')) === '1' ? 1 : 0;

  try {
    const result = await query('UPDATE media SET in_gallery = ? WHERE id = ?', [show, id]);
    if (result && result.affectedRows === 0) {
      throw validationError('That image no longer exists.');
    }
  } catch (err) {
    friendly(err, 'The gallery could not be updated. Please try again.');
  }

  revalidateMedia();
  revalidatePath(ADMIN);
}

/**
 * ALT TEXT — the sentence a screen reader says instead of showing the picture.
 *
 * Until now there was no input for it anywhere in the admin: `saveUpload`
 * inserted `{}` for every upload, Replace wiped whatever existed, and
 * `docs/admin/replacing-images.md` told the operator to email a developer a
 * sentence to run as SQL. Bangladesh's ICTD Inclusive Accessibility Guideline
 * 2022 is WCAG 2.1-aligned, so an undescribed photograph on a public
 * infrastructure site is a defect with legal weight, not a nicety.
 *
 * An EMPTY BOX DROPS the locale rather than storing ''. `mediaAlt()` falls back
 * to English when a key is missing, and a stored empty string would satisfy the
 * lookup and defeat that fallback — a Bangla reader would get silence where
 * they should have got the English sentence. Emptying all three is the
 * deliberate reset, and writes `{}`.
 */
const ALT_MAX = 300;

export async function updateMediaAltAction(formData) {
  await assertCan('manage_media');

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    throw validationError('That image no longer exists.');
  }

  const row = await getMediaById(id);
  if (!row) throw validationError('That image no longer exists.');

  const alt = {};
  for (const locale of LOCALES) {
    const value = String(formData.get(`alt_${locale}`) ?? '').trim();
    if (!value) continue;
    if (value.length > ALT_MAX) {
      throw validationError(
        `Keep the description shorter than ${ALT_MAX} characters — it is read aloud in one breath.`,
      );
    }
    alt[locale] = value;
  }

  try {
    await setMediaAlt(id, alt);
  } catch (err) {
    friendly(err, 'The description could not be saved. Please try again.');
  }

  // The library is read through a MEDIA_TAG cache entry, and each page renders
  // the row through its own cached tree. Firing only one of the two leaves the
  // site reading the old sentence for up to the 300-second recovery floor.
  revalidateMedia();
  for (const slug of await pageSlugsUsingMedia(row.path)) revalidatePage(slug);
  revalidatePath(ADMIN);
}
