/**
 * Blocks reference an image by its PUBLIC PATH, not by its media id.
 *
 * `hero` and `media-prose` store the path in `data.image`; `figure-grid`
 * stores one per entry in `data.items[].image`. So replacing the file behind a
 * media row and rewriting that row's `path` is only half the job — every block
 * would still be pointing at a path that no longer resolves, `getMediaByPath`
 * would return null, and the picture would silently disappear from the page.
 * Repointing the references is what makes "replace it once, every page follows"
 * actually true.
 *
 * The match is string EQUALITY, never a substring. `/photo/2.webp` must not
 * match inside `/photo/20.webp`, and a richtext field whose prose happens to
 * mention a filename must not be rewritten.
 *
 * Pure and shape-agnostic: it walks whatever the block stored rather than
 * knowing each block type's field names, so a block type added later is
 * covered without editing this file.
 */
export function swapMediaPath(value, from, to) {
  if (typeof from !== 'string' || typeof to !== 'string' || !from || !to || from === to) {
    return { data: value, changed: 0 };
  }

  let changed = 0;

  const walk = (v) => {
    if (typeof v === 'string') {
      if (v !== from) return v;
      changed += 1;
      return to;
    }
    if (Array.isArray(v)) return v.map(walk);
    // `typeof null === 'object'`, so the null guard has to come first.
    if (v && typeof v === 'object') {
      const out = {};
      for (const [k, inner] of Object.entries(v)) out[k] = walk(inner);
      return out;
    }
    return v;
  };

  const data = walk(value);
  return { data, changed };
}
