// lib/media/replace.js
import { swapMediaPath } from './references.js';

/**
 * The body of a media replacement, as a plain function over a transaction's
 * `q` so it can be tested against a real database without a server action,
 * an authenticated session or an HTTP request. app/admin/(dash)/media/actions.js
 * validates the upload and owns the transaction; everything the replacement
 * does to rows lives here.
 */

/**
 * ALT TEXT AND THE FOCAL POINT DESCRIBE THE BYTES, NOT THE ROW.
 *
 * The row keeps its id and its path is repointed, so every block that used the
 * old picture now shows the new one. The alt text is a sentence about what is
 * in the OLD frame, written in up to three languages by someone who looked at
 * it; the focal point is a pair of coordinates chosen against the OLD
 * composition. Neither survives the bytes changing, and carrying them over
 * means a screen-reader user in three languages hears a confident, specific
 * description of a photograph that is no longer on the page — while a sighted
 * operator sees nothing wrong at all.
 *
 * That is the exact failure docs/source-data/2026-09-03-image-library-audit.md
 * opens by naming: "nobody writes alt text for a picture they have not seen.
 * That mistake is why the old site describes a Belt and Road infographic as
 * bridge construction."
 *
 * So both are reset. An empty alt renders as alt="" (see components/SiteImage.jsx),
 * which a screen reader skips: the reader learns nothing, which is recoverable,
 * rather than something false, which is not. The focal point returns to the
 * schema default — dead centre, the same value every fresh upload starts at.
 *
 * The alternative considered was keeping both and flagging the row for review.
 * It was rejected because there is nowhere for that flag to be acted on: the
 * media screen has no alt editor and no review queue, so the flag would need a
 * new column, a queue and an editor before it changed anything, and until then
 * the false sentence would still be read aloud on the live site. An empty alt
 * is its own flag, and the media screen now shows it as one.
 */
export const RESET_ALT = {};
export const RESET_FOCAL_X = 0.5;
export const RESET_FOCAL_Y = 0.5;

/** LIKE treats % and _ as wildcards. A media path should contain neither, but
 *  the prefilter below must not silently widen if one ever does. */
export function likeEscape(value) {
  return String(value).replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Which of `paths` this database has already seen replaced.
 *
 * A replacement rewrites the row's `path`, so after one there is no row left
 * holding `/photo/16.webp` — and scripts/import-legacy-media.mjs, whose upsert
 * is keyed on the UNIQUE `path`, would find no duplicate and register the
 * placeholder all over again. `media.original_path` (scripts/db-setup-v6.mjs)
 * is the row's memory of the path it was first registered under; this reads it
 * back so the import can skip a file the operator has already dealt with.
 *
 * Takes a `q(sql, params)` returning rows rather than importing lib/db.js, so
 * the import script can pass its own standalone connection and the tests can
 * run it inside a transaction — the same shape applyMediaReplacement takes.
 *
 * Returns a Set, empty for an empty input, so a caller can `.has()` without
 * checking anything first.
 */
export async function replacedLegacyPaths(q, paths) {
  const wanted = [...new Set((paths || []).filter((p) => typeof p === 'string' && p))];
  if (wanted.length === 0) return new Set();
  const rows = await q(
    `SELECT original_path FROM media
      WHERE original_path IN (${wanted.map(() => '?').join(', ')})`,
    wanted,
  );
  return new Set((rows || []).map((r) => r.original_path).filter(Boolean));
}

/**
 * Repoints every stored reference from `oldPath` to `newPath` and rewrites the
 * media row in place. Returns the slugs of the pages that changed, so the
 * caller can revalidate exactly those.
 *
 * `surplusId` is the throwaway media row saveUpload() inserted for the new
 * file: media.path is UNIQUE, so it has to release the new path before the
 * target row can take it. Deleting it inside the same transaction means a
 * failure anywhere below rolls it back and the upload stays an ordinary one.
 *
 * `oldPath` is also recorded on the row as `original_path` (first replacement
 * only) so scripts/import-legacy-media.mjs can tell that this placeholder has
 * been dealt with and must not be registered again — see replacedLegacyPaths().
 *
 * Throws `notFound` (a caller-supplied factory) when the target row is gone.
 */
export async function applyMediaReplacement(q, {
  id, oldPath, newPath, width, height, bytes, mime, surplusId = null, notFound,
}) {
  if (surplusId !== null) await q('DELETE FROM media WHERE id = ?', [surplusId]);

  // COALESCE, not a plain assignment: original_path records the path the row
  // was FIRST registered under, which is the one the legacy import knows about.
  // Replacing an already-replaced row must not move the memory forward to an
  // /uploads/... path, or the placeholder it stands in for becomes importable
  // again on the second replacement.
  const res = await q(
    `UPDATE media
        SET path = ?, width = ?, height = ?, bytes = ?, mime = ?, origin = 'upload',
            alt = ?, focal_x = ?, focal_y = ?, original_path = COALESCE(original_path, ?)
      WHERE id = ?`,
    [newPath, width, height, bytes, mime, JSON.stringify(RESET_ALT), RESET_FOCAL_X, RESET_FOCAL_Y,
      oldPath, id],
  );
  if (!res || res.affectedRows === 0) throw notFound();

  const touched = new Set();

  // LIKE is only a prefilter to keep the scan small; swapMediaPath decides
  // what actually matches, by whole-string equality.
  const blocks = await q(
    `SELECT bt.block_id, bt.locale, bt.data, p.slug
       FROM block_translations bt
       JOIN blocks b ON b.id = bt.block_id
       JOIN pages  p ON p.id = b.page_id
      WHERE bt.data LIKE CONCAT('%', ?, '%') ESCAPE '\\\\'`,
    [likeEscape(oldPath)],
  );
  for (const row of blocks || []) {
    let data;
    try {
      data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch {
      continue; // A hand-edited row that no longer parses is left alone.
    }
    const { data: next, changed } = swapMediaPath(data, oldPath, newPath);
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
    [oldPath],
  );
  for (const row of og || []) if (row.slug) touched.add(row.slug);
  await q('UPDATE page_translations SET og_image = ? WHERE og_image = ?', [newPath, oldPath]);

  return [...touched];
}
