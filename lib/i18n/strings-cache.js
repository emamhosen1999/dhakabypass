import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { loadUiStrings } from './strings-repo.js';
import { applyUiOverrides } from './overrides.js';
import { LOCALES } from './locales.js';
import { UI_STRINGS_TAG } from '../revalidate.js';

/**
 * The cached UI-string overrides.
 *
 * A separate file from ./overrides.js because that module is imported by client
 * components, and `next/cache` cannot be — the same split, for the same reason,
 * as lib/settings.js and lib/settings-cache.js.
 *
 * All three locales come back in ONE entry rather than one per locale. The
 * whole table is 546 short rows at most; splitting it would triple the queries
 * on the busiest code path on the site to save nothing, and would let the three
 * locales fall out of step with each other after a save.
 *
 * Both the double wrap and the 300-second floor are the pattern documented at
 * length in lib/content/cache.js, and both matter here for the reasons given
 * there. The floor especially: the site is built LOCALLY and shipped with a
 * `git pull`, so an entry warmed against a developer's database is baked into
 * .next/cache and carried into production, where nothing ever fires
 * `revalidateUiStrings()` for it. With tags alone the developer's strings would
 * be the site's strings until the next deploy.
 */
const RECOVERY_FLOOR_SECONDS = 300;

export const getUiStringsCached = cache(() =>
  unstable_cache(() => loadUiStrings(), ['ui-strings'], {
    tags: [UI_STRINGS_TAG],
    revalidate: RECOVERY_FLOOR_SECONDS,
  })(),
);

/**
 * Fill the synchronous store that `t()` and `mapUi()` read.
 *
 * Called by app/[locale]/layout.jsx and awaited there, so it completes before
 * React renders anything inside the layout. Returns the tables so the layout
 * can hand them to <UiStringsBridge> for the browser.
 *
 * Note the empty-table call for a locale with no overrides: `applyUiOverrides`
 * REPLACES, so this is what makes a string an editor has just reset go back to
 * its code value on the very next request instead of lingering in a warm
 * process. Never skip a locale here.
 */
export async function primeUiStrings() {
  const overrides = await getUiStringsCached();
  const tables = {};
  for (const locale of LOCALES) {
    tables[locale] = overrides?.[locale] || {};
    applyUiOverrides(locale, tables[locale]);
  }
  return tables;
}
