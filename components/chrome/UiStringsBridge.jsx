'use client';

import { applyUiOverrides } from '../../lib/i18n/overrides.js';

/**
 * Carries the database UI-string overrides into the BROWSER's copy of the
 * lib/i18n/overrides.js store.
 *
 * Two components in the client bundle read a string through `t()` —
 * ConsentBanner and TravelSubnav — and the server's module store is not the
 * browser's, so without this they would be the only strings on the site an
 * operator could not change. (ContactForm and CorridorExplorer look like they
 * belong on that list and do not: both receive their labels as props already
 * resolved on the server, which is why neither appears here.)
 *
 * ONE LOCALE, not three. A page is in one language and both components render
 * for the page's locale, so the other two tables would be payload and nothing
 * else — 33 KB rather than 16 KB in the RSC stream of every request once an
 * operator has edited a reasonable number of strings. The one case the single
 * locale cannot serve is `t()`'s English-override step, which only fires for a
 * key that has no code value at all; the save action refuses to create such a
 * key (app/admin/(dash)/translations/actions.js), so there is none to serve.
 *
 * Renders null and applies during render on purpose. It is placed above
 * `children` in app/[locale]/layout.jsx, so React runs this component's body
 * before it renders any client component that reads a string — an effect would
 * run after the first paint and the labels would visibly change under the
 * reader. The write is idempotent (the same props always produce the same
 * store), so a double render in StrictMode or a re-render costs nothing.
 *
 * `applyUiOverrides` validates and REPLACES, so a malformed prop cannot leave
 * half a table behind, and an absent one — the shape sent when `ui_strings` is
 * empty or the database is unreachable — puts the browser on the code values,
 * which is the site exactly as it shipped.
 */
export default function UiStringsBridge({ locale, table }) {
  // No locale means no page locale to apply to. Doing nothing is right: the
  // store keeps whatever the server already primed, and `t()` falls back to
  // the code tables regardless.
  if (locale) applyUiOverrides(locale, table);
  return null;
}
