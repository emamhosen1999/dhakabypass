import { localeHref } from '../blocks/href.js';

/**
 * Resolve the links inside a sanitised rich-text body for one locale.
 *
 * Editors write links in prose the same way they write them in every other
 * field: `href="travel/toll"`, no leading slash, meaning "this site's toll
 * page, in the reader's language" (see lib/blocks/href.js). Every structured
 * field runs through `localeHref()`; prose did not, so the browser resolved
 * the bare path against the current page instead. On a top-level page that
 * happened to work. On /en/about/concession the same link went to
 * /en/about/travel/toll, which does not exist — 69 links on nested pages were
 * 404s before this ran at render time (audit 2026-09-17, C8).
 *
 * The input is `sanitizeHtml()` output, which is why a regular expression is
 * enough here: the sanitiser emits every `<a>` with `href` first, always
 * double-quoted, always entity-escaped. Nothing else in the tree is allowed to
 * write an `<a>` into a body. Absolute URLs, anchors, `mailto:` and `tel:`
 * are passed through untouched by `localeHref` itself.
 */
const ANCHOR_HREF = /<a href="([^"]*)"/g;

export function localiseProseLinks(html, locale) {
  if (typeof html !== 'string' || html === '' || html.indexOf('<a href="') === -1) return html || '';
  return html.replace(ANCHOR_HREF, (m, href) => {
    const next = localeHref(href, locale);
    return next === href ? m : `<a href="${next}"`;
  });
}
