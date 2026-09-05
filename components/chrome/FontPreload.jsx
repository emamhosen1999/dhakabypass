/**
 * Preloads the faces that decide the header's height.
 *
 * THE BUG THIS FIXES. The chrome — brand, navigation, locale and theme buttons —
 * is set in BarlowSemiCondensed, a CONDENSED face. Until it arrives those runs
 * are laid out in the system fallback, which is materially wider, and the header
 * wraps onto two rows. When the face swaps in, the row collapses and everything
 * below it jumps up ~46px.
 *
 * On English that is a 0.026 layout shift, which is invisible. On Chinese the
 * header sits right at the wrapping threshold, so the same small width change
 * flips the wrap and the measured shift is 0.26 — a tenth of the page moving,
 * and enough to take Lighthouse Performance from 99 to 87. The cause was never
 * Chinese text: it was a Latin font swap landing on a layout balanced on a knife
 * edge, which Chinese happened to expose.
 *
 * Preloading starts these three in the first round trip, so in practice they are
 * ready before first paint and there is no swap to shift.
 *
 * WHY THESE THREE AND NOT ALL SIX. Preload is a priority instruction, and
 * preloading everything is the same as preloading nothing. Archivo (body) and
 * the two Barlow weights (display) total 81KB and are used on every page in
 * every locale, because the chrome is Latin whatever the content language. The
 * three Bengali faces are 219KB, are needed only on /bn, and sit inside body
 * copy rather than in the header — a late swap there reflows a paragraph, not
 * the whole page.
 *
 * `crossOrigin` is required even for same-origin font preloads: fonts are
 * fetched in CORS mode, and a preload without it is fetched a SECOND time,
 * making the page slower rather than faster.
 */

const FACES = [
  '/fonts/BarlowSemiCondensed-latin-700.woff2',
  '/fonts/BarlowSemiCondensed-latin-600.woff2',
  '/fonts/Archivo-latin-400-700.woff2',
];

export default function FontPreload() {
  return (
    <>
      {FACES.map((href) => (
        <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
      ))}
    </>
  );
}
