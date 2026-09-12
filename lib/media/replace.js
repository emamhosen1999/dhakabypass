// lib/media/replace.js
import { swapMediaPath, referencesMediaPath } from './references.js';

/**
 * The body of a media replacement, as a plain function over a transaction's
 * `q` so it can be tested against a real database without a server action,
 * an authenticated session or an HTTP request. app/admin/(dash)/media/actions.js
 * validates the upload and owns the transaction; everything the replacement
 * does to rows lives here.
 */

/**
 * ALT TEXT AND THE FOCAL POINT SURVIVE A REPLACEMENT. REVERSED 2026-09-11.
 *
 * This file used to reset both, and the reasoning was not silly: alt text is a
 * sentence about what is in the OLD frame, the focal point a pair of
 * coordinates chosen against the OLD composition, and carrying a confident,
 * specific description onto different bytes means a screen-reader user is told
 * something false while a sighted operator sees nothing wrong at all. That is
 * the failure docs/source-data/2026-09-03-image-library-audit.md opens by
 * naming — "nobody writes alt text for a picture they have not seen. That
 * mistake is why the old site describes a Belt and Road infographic as bridge
 * construction."
 *
 * The reset rested on one stated condition, written into the old comment here:
 * keeping the text and flagging the row for review "was rejected because there
 * is nowhere for that flag to be acted on: the media screen has no alt editor
 * and no review queue." That is no longer true. `updateMediaAltAction` and the
 * per-locale boxes on each Media row are the editor, and the "No description"
 * flag beside them is the queue.
 *
 * With somewhere to act, the trade inverts. Resetting destroys work an operator
 * did in three languages — Bangla and Chinese sentences nobody on the team can
 * reconstruct — with no undo, no record of what it said, and no warning, every
 * time a photograph is swapped. The usual replacement is a BETTER COPY OF THE
 * SAME PICTURE: the placeholders in this library are small web-sized copies of
 * DBEDC's own photographs (see docs/admin/replacing-images.md), so the existing
 * sentence is normally still exactly right, and the focal point normally still
 * frames the same subject. Deleting it in that case is pure loss.
 *
 * The residual risk — a genuinely different photograph inheriting an old
 * description — is handled where it belongs: the operator who chose the new
 * file is the one person who has seen both, the boxes are right there on the
 * row, and the replacing-images guide now says to check them. Clearing a
 * description is an explicit act (empty the three boxes and save), not a side
 * effect of touching the file.
 *
 * Concretely: the UPDATE below names neither `alt` nor `focal_x`/`focal_y`, so
 * it cannot overwrite them with anything. tests/unit/media-replace-preserves-alt.js
 * asserts the statement itself, not just its effect.
 */

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
  // `alt`, `focal_x` and `focal_y` are deliberately absent from this statement
  // — see the long note above. Naming them is what destroyed an operator's
  // three-language description every time a file was swapped.
  const res = await q(
    `UPDATE media
        SET path = ?, width = ?, height = ?, bytes = ?, mime = ?, origin = 'upload',
            original_path = COALESCE(original_path, ?)
      WHERE id = ?`,
    [newPath, width, height, bytes, mime, oldPath, id],
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

/**
 * The slugs of the pages that show the picture at `path`.
 *
 * Editing a picture's DESCRIPTION changes what those pages render, because a
 * block's rendered tree carries the alt sentence with it (components/SiteImage.jsx
 * reads it through getMediaByPath at render time). Firing only the media tag
 * would refresh the gallery and leave every other page reading the old
 * sentence aloud until its own recovery floor expired — which, to the operator
 * who just typed the new one, looks exactly like the save not working.
 *
 * Same two places a reference can live as applyMediaReplacement above, and the
 * same matching rules: the LIKE is only a prefilter to keep the scan small,
 * and `referencesMediaPath` decides what actually counts, so a page that
 * merely mentions a filename in prose is not revalidated and `/photo/2.webp`
 * does not match inside `/photo/20.webp`.
 *
 * Takes a `q(sql, params)` rather than importing lib/db.js, matching
 * applyMediaReplacement — so it is callable inside a transaction and testable
 * without a database.
 */
export async function pageSlugsUsingMedia(q, path) {
  if (typeof path !== 'string' || !path) return [];

  const touched = new Set();

  const blocks = await q(
    `SELECT bt.data, p.slug
       FROM block_translations bt
       JOIN blocks b ON b.id = bt.block_id
       JOIN pages  p ON p.id = b.page_id
      WHERE bt.data LIKE CONCAT('%', ?, '%') ESCAPE '\\\\'`,
    [likeEscape(path)],
  );
  for (const row of blocks || []) {
    if (!row.slug || touched.has(row.slug)) continue;
    let data;
    try {
      data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch {
      continue; // A hand-edited row that no longer parses is left alone.
    }
    if (referencesMediaPath(data, path)) touched.add(row.slug);
  }

  // Social preview images are stored as a plain column, not inside JSON.
  const og = await q(
    `SELECT p.slug FROM page_translations pt
       JOIN pages p ON p.id = pt.page_id
      WHERE pt.og_image = ?`,
    [path],
  );
  for (const row of og || []) if (row.slug) touched.add(row.slug);

  return [...touched];
}
