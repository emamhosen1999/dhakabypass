/**
 * The root 404 boundary — for a miss that never entered app/[locale]/
 * (an unknown /admin path, an /api miss). It renders the same block document
 * as the localised boundary, in English, without the locale chrome; anything
 * under /[locale] uses app/[locale]/not-found.jsx and gets both.
 *
 * The previous file here read the dead `content` table and rendered the
 * legacy site's Tailwind 404 in English under every locale (W1.19).
 */
export { default } from './[locale]/not-found.jsx';
