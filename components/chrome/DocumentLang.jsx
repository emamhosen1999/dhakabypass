import { LOCALE_HTML_LANG } from '../../lib/i18n/locales.js';

/**
 * Sets the document's language to the one this page is actually written in.
 *
 * THE PROBLEM. `app/layout.jsx` hardcodes `<html lang="en">`, so every Bangla
 * and Chinese page declares itself English. That is a WCAG 3.1.1 failure — a
 * screen reader picks its voice and pronunciation rules from this attribute, so
 * a Bangla page is read out by an English synthesiser — and it contradicts the
 * hreflang tags the sitemap and `alternatesFor` carefully emit, which is the
 * readiness review's S5.
 *
 * WHY NOT JUST FIX THE ROOT LAYOUT. Three ways were considered and rejected:
 *
 *  - Editing `app/layout.jsx` to take the locale: it has no dynamic segment to
 *    read one from, and it is shared with the legacy site and the admin.
 *  - Reading `headers()` there: that makes the root layout dynamic, which makes
 *    EVERY page dynamic and throws away the prerendering the whole deploy model
 *    depends on.
 *  - A second root layout via route groups: Next allows it only when there is no
 *    `app/layout.jsx` at all, and removing it would mean restructuring
 *    `app/(site)/`, which is live and on the do-not-modify list.
 *
 * So the attribute is corrected in place, by an inline script that runs during
 * parse — before the body renders and before assistive technology finishes
 * building the accessibility tree. The wrapper `<div lang>` in the layout stays
 * as well: it is what covers the content region if a user agent has already
 * read the root attribute, and the two agree.
 *
 * The pages are prerendered, so `locale` is baked per document — this is not a
 * runtime negotiation and there is no flash of the wrong language.
 */
export default function DocumentLang({ locale }) {
  const lang = LOCALE_HTML_LANG[locale];
  if (!lang) return null;
  // JSON.stringify quotes and escapes, so a locale value can never break out of
  // the string literal even if the list of locales grows to something exotic.
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang=${JSON.stringify(lang)};`,
      }}
    />
  );
}
