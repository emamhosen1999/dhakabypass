import { query } from '../db.js';
import { DEFAULT_LOCALE } from '../i18n/locales.js';
import { absoluteUrl } from './site.js';

/**
 * Site-level SEO and identity (W1.24) — the values that used to be literals in
 * `app/layout.jsx` and `lib/seo/organization.js`, moved into `site_settings`
 * so an operator can change them without a deploy.
 *
 * ---------------------------------------------------------------------------
 * THE ONE RULE
 * ---------------------------------------------------------------------------
 * A DATABASE OUTAGE MUST STILL EMIT A VALID TAG.
 *
 * These are read by the ROOT layout, which wraps the localised site, the legacy
 * tree and the admin. A read that can throw there is a 500 on every page on the
 * hostname; a read that can return an empty string emits `<title></title>`,
 * which is worse than a stale title because a search result with no title is
 * unclickable.
 *
 * So `getSeoSettings` never throws and never returns blank. It degrades to
 * `SEO_DEFAULTS`, which is exactly the wording that was hardcoded before this
 * table existed — meaning the failure mode of this whole feature is "the site
 * as it shipped", in every one of these states:
 *
 *   * no `site_settings` row (the normal state on a fresh install)
 *   * no database configured at all (`query()` returns null)
 *   * the database refusing the connection (`query()` rejects)
 *   * a malformed JSON value in one row (that field only, never the object)
 *   * a stored value that is blank, or is not a publishable path/URL
 *
 * ---------------------------------------------------------------------------
 * Why these are settings and not `route_meta` rows
 * ---------------------------------------------------------------------------
 * Every value here has exactly one row for the whole hostname. A per-route
 * table is the wrong shape for that, and putting the site title in it would
 * invite an operator to set a different one per URL — which is what
 * `page_translations.seo_title` and `route_meta.seo_title` are already for.
 */

/** The `site_settings` keys this module owns. */
export const SEO_KEYS = {
  siteTitle: 'seo.site_title',
  siteDescription: 'seo.site_description',
  favicon: 'seo.favicon',
  ogImage: 'seo.og_image',
  robotsMode: 'seo.robots_mode',
  robotsDisallow: 'seo.robots_disallow',
  orgName: 'seo.org_name',
  orgShortName: 'seo.org_short_name',
  logoPath: 'seo.logo_path',
  // W1.10: the picture in the site header. Blank = the built-in DBEDC mark
  // (components/chrome/BrandMark.jsx), which is drawn in currentColor so it
  // reads on both the light and the dark header without a second file.
  headerLogo: 'brand.header_logo',
};

/**
 * The code values. Every one is the literal that shipped, so falling back here
 * reproduces the site exactly as it was before this table existed.
 *
 * Not seeded into the database — see db/sql/10-route-meta.sql's header for why
 * an override table ships empty. The same argument applies to these keys.
 */
export const SEO_DEFAULTS = Object.freeze({
  // app/layout.jsx:4, verbatim.
  siteTitle: "Dhaka Bypass Expressway - Bangladesh's First Fully Access-Controlled Highway",
  // app/layout.jsx:6, verbatim.
  siteDescription:
    'Official website of the Dhaka Bypass Expressway project, spanning 48km and connecting major national highways around Dhaka.',
  favicon: '/favicon.ico',
  ogImage: '',
  robotsMode: 'default',
  robotsDisallow: [],
  // lib/seo/organization.js's exported constants.
  orgName: 'Dhaka Bypass Expressway Development Company',
  orgShortName: 'DBEDC',
  logoPath: '/logo.webp',
  headerLogo: '',
});

/** The two robots.txt postures an operator can choose. */
export const ROBOTS_MODES = ['default', 'block_all'];

/**
 * Paths robots.txt always disallows, whatever the operator adds.
 *
 * `/admin` is reachable on the public host via the path as well as on the admin
 * subdomain; `/api/` is NextAuth callbacks and the admin's JSON endpoints,
 * none of which render. The legacy paths are deliberately NOT here — they now
 * 301 to `/en/...` (next.config.mjs), and a `Disallow` would stop Google
 * re-crawling them, which is what strands the redirect.
 */
export const BUILT_IN_DISALLOW = ['/admin', '/api/'];

const asString = (v) => (typeof v === 'string' ? v.trim() : '');

const isPlainObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

/**
 * A value that is safe to put in `<link rel="icon">`, `og:image` or an
 * `<img src>`.
 *
 * Root-relative (`/uploads/mark.webp`) or an https URL, and nothing else. The
 * value is typed into an admin box and rendered into markup, so `javascript:`,
 * `data:` and a protocol-relative `//evil.example/x` are all refused. Refusing
 * degrades to the default, which for a favicon is the one that shipped.
 */
export function publishablePath(value) {
  const v = asString(value);
  if (!v) return '';
  if (/^https:\/\//i.test(v)) return v;
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  return '';
}

/** Pick a per-locale string, English fallback, tolerating a plain string. */
function localeText(value, locale) {
  if (typeof value === 'string') return value.trim();
  if (!isPlainObject(value)) return '';
  const exact = value[locale];
  if (typeof exact === 'string' && exact.trim()) return exact.trim();
  const base = value[DEFAULT_LOCALE];
  return typeof base === 'string' ? base.trim() : '';
}

/**
 * One newline-separated textarea -> a list of root-relative paths.
 *
 * Anything that is not a path is dropped rather than rejected. A bare word or a
 * full URL in a robots.txt `Disallow` does not mean what the person typing it
 * thought it meant, and silently ignoring one line is better than refusing the
 * save and losing the other four.
 */
export function parseDisallowList(value) {
  if (typeof value !== 'string') return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('/') && !line.startsWith('//'));
}

/**
 * Every site-level SEO value, for one locale, in one query.
 *
 * One read rather than nine: this is called from the root layout's
 * `generateMetadata`, on a pool of five connections, and nine `getSetting`
 * calls would be nine round trips for one small table.
 *
 * NEVER THROWS. See the header.
 */
export async function getSeoSettings(locale = DEFAULT_LOCALE) {
  const keys = Object.values(SEO_KEYS);
  let rows;
  try {
    rows = await query(
      `SELECT setting_key, CAST(value AS CHAR) AS value FROM site_settings
       WHERE setting_key IN (${keys.map(() => '?').join(', ')})`,
      keys,
    );
  } catch {
    // Indistinguishable from "nothing stored" as far as the caller is
    // concerned, and degrading the same way is what keeps a title on the page.
    rows = null;
  }

  const raw = new Map();
  for (const row of rows || []) {
    try {
      raw.set(row.setting_key, typeof row.value === 'string' ? JSON.parse(row.value) : row.value);
    } catch {
      // One malformed row degrades that field, never the whole object.
    }
  }

  const stored = (key) => raw.get(key);

  // An operator who clears the title is asking for the default back, not for an
  // empty <title>. Contact details work the opposite way on purpose — clearing
  // a phone number must un-publish it — but there is no honest "no title"
  // state for a web page.
  const siteTitle = localeText(stored(SEO_KEYS.siteTitle), locale) || SEO_DEFAULTS.siteTitle;
  const siteDescription =
    localeText(stored(SEO_KEYS.siteDescription), locale) || SEO_DEFAULTS.siteDescription;

  const mode = asString(stored(SEO_KEYS.robotsMode));
  const disallow = stored(SEO_KEYS.robotsDisallow);

  return {
    siteTitle,
    siteDescription,
    favicon: publishablePath(stored(SEO_KEYS.favicon)) || SEO_DEFAULTS.favicon,
    // No default share image. An og:image is a claim that this picture
    // represents the page; the site has never had one and inventing it here
    // would put the logo on every share card without anyone choosing it.
    ogImage: publishablePath(stored(SEO_KEYS.ogImage)),
    robotsMode: ROBOTS_MODES.includes(mode) ? mode : SEO_DEFAULTS.robotsMode,
    robotsDisallow: Array.isArray(disallow)
      ? disallow.filter((p) => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//'))
      : SEO_DEFAULTS.robotsDisallow,
    orgName: asString(stored(SEO_KEYS.orgName)) || SEO_DEFAULTS.orgName,
    orgShortName: asString(stored(SEO_KEYS.orgShortName)) || SEO_DEFAULTS.orgShortName,
    logoPath: publishablePath(stored(SEO_KEYS.logoPath)) || SEO_DEFAULTS.logoPath,
    headerLogo: publishablePath(stored(SEO_KEYS.headerLogo)) || '',
  };
}

/**
 * The `robots.txt` body, as Next's `MetadataRoute.Robots`.
 *
 * Pure, so the admin-host rule and the pre-launch switch can be tested without
 * a request. `app/robots.js` supplies the host and the settings.
 *
 * `sitemap` is OMITTED, not emptied, whenever everything is disallowed. A
 * sitemap line alongside `Disallow: /` is a contradiction, and crawlers resolve
 * it in the direction nobody wanted.
 */
export function robotsRulesFor({ siteOrigin, isAdminHost, seo = SEO_DEFAULTS }) {
  if (isAdminHost || seo.robotsMode === 'block_all') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  const disallow = [...BUILT_IN_DISALLOW];
  for (const path of seo.robotsDisallow || []) {
    if (!disallow.includes(path)) disallow.push(path);
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}

/** MIME type for the favicon, from its extension. */
function iconType(path) {
  const ext = String(path || '').toLowerCase().split('?')[0].split('.').pop();
  return { ico: 'image/x-icon', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' }[ext];
}

/**
 * The root layout's `metadata` object.
 *
 * The old literal announced every icon as `type: 'image/x-icon', sizes: '16x16'`
 * — so an operator uploading a 512px PNG would have had it declared a 16x16
 * ICO. The type is now derived from the file's extension, and `sizes` is stated
 * only for the .ico that actually is one; for anything else the browser reads
 * the real dimensions from the file, which beats a number typed here.
 */
export function rootMetadata(seo = SEO_DEFAULTS) {
  const favicon = seo.favicon || SEO_DEFAULTS.favicon;
  const icon = { url: favicon };
  const type = iconType(favicon);
  if (type) icon.type = type;
  if (favicon.toLowerCase().endsWith('.ico')) icon.sizes = '16x16';

  const metadata = {
    title: seo.siteTitle || SEO_DEFAULTS.siteTitle,
    description: seo.siteDescription || SEO_DEFAULTS.siteDescription,
    icons: { icon: [icon] },
  };

  // og:image must be ABSOLUTE. A root-relative one is ignored by every scraper,
  // which is how a share card ends up blank. `metadataBase` would do this too,
  // but it lives on this same root layout and would change the metadata of the
  // legacy tree and the admin along with it.
  if (seo.ogImage) {
    metadata.openGraph = { images: [{ url: absoluteUrl(seo.ogImage) }] };
  }
  return metadata;
}
