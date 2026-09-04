/**
 * The one place that knows the site's own absolute origin.
 *
 * Before this module nothing in the repo did. There is no `metadataBase`, no
 * `NEXTAUTH_URL`, no `NEXT_PUBLIC_*` anything, and no domain constant in
 * `next.config.mjs` — the app has only ever emitted root-relative URLs, which
 * is fine for links and useless for robots.txt, a sitemap or an hreflang
 * alternate, all three of which require absolute URLs.
 *
 * So exactly ONE environment variable is introduced: `SITE_URL`. Every caller
 * reads the origin through this module. The domain must not be written down a
 * second time anywhere in the codebase.
 *
 * Why `SITE_URL` and not `NEXT_PUBLIC_SITE_URL`: a `NEXT_PUBLIC_` value is
 * inlined into the bundle at build time. This project is built LOCALLY and the
 * artefact is uploaded to cPanel (see `next.config.mjs`'s `output: 'standalone'`
 * and the deploy notes), so a public name would freeze whatever domain the
 * builder's machine happened to have into every deployed build. Nothing on the
 * client needs the origin — robots, sitemap and metadata are all server-side —
 * so this stays a server variable, read at request time, and the operator can
 * change the domain by editing the app's environment and restarting.
 *
 * Default `http://localhost:3000`: what `npm run dev` and Playwright's
 * `baseURL` both serve. A missing variable therefore degrades to a locally
 * correct sitemap rather than to a broken one full of `undefined`. It is
 * deliberately NOT defaulted to the production domain — a default that looks
 * right in development is how a staging box ends up publishing canonical URLs
 * pointing at production.
 *
 * Production value to set on the host: `SITE_URL=https://dhakabypass.com`
 */

const DEFAULT_ORIGIN = 'http://localhost:3000';

/**
 * Absolute origin, no trailing slash, e.g. `https://dhakabypass.com`.
 *
 * Read from the environment on every call rather than captured in a module
 * constant, so a test can set the variable and so a long-lived server process
 * is not holding a value from module-evaluation time.
 *
 * A value with no scheme (`dhakabypass.com`) is accepted and treated as https —
 * that is the mistake an operator actually makes in a cPanel environment
 * editor, and failing the whole sitemap over it would be a poor trade. Anything
 * genuinely unparseable falls back to the default rather than throwing: this
 * runs inside `sitemap.xml` and `robots.txt`, where an exception is a 500.
 */
export function siteOrigin() {
  const raw = String(process.env.SITE_URL || '').trim();
  if (!raw) return DEFAULT_ORIGIN;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

/**
 * Join a root-relative path onto the origin.
 *
 * `absoluteUrl('/en')` -> `https://dhakabypass.com/en`
 * `absoluteUrl('/')`   -> `https://dhakabypass.com/`
 *
 * A path that is already absolute is returned untouched, so a caller holding an
 * `og_image` that may or may not be a full URL does not have to branch.
 */
export function absoluteUrl(path) {
  const p = String(path == null ? '' : path);
  if (/^https?:\/\//i.test(p)) return p;
  const origin = siteOrigin();
  if (p === '' || p === '/') return `${origin}/`;
  return `${origin}${p.startsWith('/') ? '' : '/'}${p}`;
}
