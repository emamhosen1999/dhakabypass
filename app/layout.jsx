import './globals.css';
import { siteSeoCached } from '../lib/seo/cache.js';
import { rootMetadata } from '../lib/seo/settings.js';

/**
 * The site title, description and favicon were literals here (W1.24). They are
 * now `site_settings` rows edited at /admin/settings, so an operator can change
 * the title that appears in a search result, or replace the favicon, without a
 * deploy. The favicon in particular could not be changed at all before: the
 * path was hardcoded and the file is in the repository.
 *
 * THIS READ CANNOT FAIL. `siteSeoCached` degrades to the code defaults - which
 * are the exact strings that used to be written above - on a missing row, an
 * unconfigured database, a refused connection or a malformed stored value. That
 * matters more here than anywhere else on the site: this layout wraps the
 * localised tree, the legacy tree AND the admin, so a throw would be a 500 on
 * every URL on the hostname, and an empty string would emit `<title></title>`,
 * which is a search result nobody can click.
 *
 * English, not the request's locale. A root layout has no locale segment to
 * read - `app/[locale]/layout.jsx` is the first place that knows one - and
 * every route that renders real content states its own title anyway. This is
 * the fallback for the routes that do not, and the stored value is per-locale
 * so that a localised caller can ask for its own.
 */
export async function generateMetadata() {
  return rootMetadata(await siteSeoCached('en'));
}

/**
 * Root layout is html/body only. The public site chrome (header/footer) lives in
 * app/(site)/layout.jsx and the admin chrome in app/admin/(dash)/layout.jsx, so
 * the admin never inherits the public header.
 */
export default function RootLayout({ children }) {
  // suppressHydrationWarning is required, not cosmetic: the new site's theme
  // script (components/chrome/ThemeScript.jsx) stamps data-theme on this element
  // before paint so the page never flashes the wrong theme. That attribute is
  // absent from the server-rendered HTML by design, which React would otherwise
  // report as a hydration mismatch on every dark-theme load. It suppresses the
  // warning for this element's own attributes ONLY, one level deep — it does not
  // affect children, and it changes nothing for the legacy site.
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
