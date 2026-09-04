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
 * There are TWO ways a block can hold a path, and both have to be repointed:
 *
 * 1. As the WHOLE VALUE of a field — `data.image`, `data.items[].image`. Here
 *    the match is string EQUALITY, never a substring. `/photo/2.webp` must not
 *    match inside `/photo/20.webp`, and prose that merely mentions a filename
 *    must not be rewritten.
 *
 * 2. INSIDE MARKUP — `media-prose.body` and `rich-text.body` are richtext,
 *    edited as raw HTML in a textarea and rendered with dangerouslySetInnerHTML.
 *    An operator can and does paste `<img src="/photo/18.webp">` into one. That
 *    string is never EQUAL to the bare path, so case 1 never touched it: the
 *    old file is still sitting in public/, nothing 404s, and the picture simply
 *    never changes. Silently — which is worse than a broken image, because
 *    nobody discovers it. The admin promises the opposite in
 *    app/admin/(dash)/media/GuideNotice.jsx ("Every page using that picture
 *    updates at once — there is nothing else to edit") and again in
 *    docs/admin/replacing-images.md.
 *
 * Case 2 is handled by a DELIMITER-ANCHORED pattern, never a substring replace.
 * The path has to be followed by the quote that opened it (or, unquoted, by
 * whitespace, `/`, `>` or the end of the string), so `/photo/2.webp` cannot
 * match inside `src="/photo/20.webp"` — that is the same corruption case 1 is
 * careful about, and the reason a plain `String.replaceAll` is wrong here.
 *
 * Only `src` is rewritten. A path appearing in prose, in an `href`, or in an
 * attribute we do not know the meaning of is left exactly as written: this
 * function repoints pictures, it does not edit copy.
 *
 * Pure and shape-agnostic: it walks whatever the block stored rather than
 * knowing each block type's field names, so a block type added later is
 * covered without editing this file.
 */

/** Regex-escape a path before it goes into a pattern. Media paths are ordinary
 *  slugs today, but `.` alone already matters — an unescaped `/photo/2.webp`
 *  would match `/photo/2Xwebp`. */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrites `src="<from>"` (and `src='<from>'`, and unquoted `src=<from>`) to
 * point at `to`, leaving every other occurrence of the path alone. Returns the
 * new string and how many attributes were rewritten.
 */
function swapSrcAttributes(html, from, to) {
  // (1) `src`, any spacing around `=`. (2) the opening quote, optional.
  // \2 closes with the SAME quote that opened, and the lookahead anchors the
  // unquoted form, so the match can only end where the path really ends.
  const pattern = new RegExp(
    `(src\\s*=\\s*)(["']?)${escapeRegExp(from)}\\2(?=[\\s/>]|$)`,
    'gi',
  );
  let changed = 0;
  const out = html.replace(pattern, (_match, attr, quote) => {
    changed += 1;
    return `${attr}${quote}${to}${quote}`;
  });
  return { out, changed };
}

export function swapMediaPath(value, from, to) {
  if (typeof from !== 'string' || typeof to !== 'string' || !from || !to || from === to) {
    return { data: value, changed: 0 };
  }

  let changed = 0;

  const walk = (v) => {
    if (typeof v === 'string') {
      if (v === from) {
        changed += 1;
        return to;
      }
      // Not the whole value, so it may still be markup carrying the path.
      // Cheap reject first: most strings are not markup at all.
      if (!v.includes(from)) return v;
      const { out, changed: n } = swapSrcAttributes(v, from, to);
      changed += n;
      return out;
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
