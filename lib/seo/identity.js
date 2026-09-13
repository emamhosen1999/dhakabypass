import fs from 'node:fs/promises';
import path from 'node:path';
import { getMediaByPath } from '../media/repo.js';
import { imageSize } from '../media/probe.js';
import { uploadRoot } from '../media.js';
import { getSeoSettings, SEO_DEFAULTS } from './settings.js';
import { organizationJsonLd, DEFAULT_LOGO_PATH } from './organization.js';

/**
 * The organisation identity block, assembled rather than asserted.
 *
 * ---------------------------------------------------------------------------
 * The literal that had to go
 * ---------------------------------------------------------------------------
 * `lib/seo/organization.js` used to carry
 *
 *     const LOGO = { path: '/logo.webp', width: 215, height: 204 };
 *
 * — a machine-readable ASSERTION about a file, written down by hand. It was
 * true on the day it was written. Replacing the logo through /admin/media
 * changes the file and leaves 215x204 asserted in structured data, wrong, with
 * nothing anywhere to notice: no test fails, no page looks different, and the
 * only symptom is a knowledge panel with a squashed logo.
 *
 * So the dimensions are DERIVED, in this order:
 *
 *   1. the `media` row, which the import already probed. Free — no file read.
 *   2. the file itself, through the same header reader the import used.
 *   3. nothing at all.
 *
 * Step 3 is a real outcome, not a failure. An SVG has no pixel dimensions to
 * read, and an SVG logo is a plausible future value for this setting. schema.org
 * accepts an ImageObject with only a `url`; an absent width means "not
 * stated", a guessed one means "stated, and wrong". That is the same rule
 * lib/seo/organization.js already follows for every field DBEDC has not
 * supplied.
 *
 * (Raster or vector for the JSON-LD logo? Raster, and the default stays
 * /logo.webp. Google's structured-data logo guidance asks for a raster it can
 * measure and crop, and the 112x112 minimum is stated in pixels — which an SVG
 * does not have. The vector mark is the right asset for the site chrome, where
 * it scales and reverses; it is the wrong one for this claim. Nothing stops an
 * operator pointing the setting at it, which is why step 3 exists.)
 */

const PUBLIC_DIR = () => path.join(process.cwd(), 'public');

/**
 * Where a public URL path actually lives on disk, or null if it does not.
 *
 * `/uploads/...` is served by `app/uploads/[...path]/route.js` from MEDIA_ROOT,
 * which is OUTSIDE the repository on purpose so a `git pull` deploy cannot
 * delete it — probing `public/uploads/x.webp` would always miss. Everything
 * else is a repository asset under `public/`.
 *
 * Returns null for anything that climbs out of its directory or is not a local
 * path at all. The value comes from a `site_settings` column an operator can
 * type into, and this function's whole output is a filename handed to
 * `fs.readFile`.
 */
export function localFileForPublicPath(publicPath) {
  const raw = String(publicPath || '').trim();
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  if (/^https?:\/\//i.test(raw)) return null;

  const isUpload = raw.startsWith('/uploads/');
  const root = isUpload ? uploadRoot() : PUBLIC_DIR();
  const relative = isUpload ? raw.slice('/uploads/'.length) : raw.slice(1);
  const resolved = path.resolve(root, relative);
  // path.resolve collapses `..` — compare the RESULT against the root rather
  // than scanning the input for '..', which misses encoded and mixed forms.
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (!resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

/** Read a file's real pixel dimensions, or null. Never throws. */
async function measure(publicPath) {
  const file = localFileForPublicPath(publicPath);
  if (!file) return null;
  try {
    // The header is all `imageSize` needs; reading the whole file is fine for
    // a logo and avoids a partial-read dance for four formats.
    const buf = await fs.readFile(file);
    const size = imageSize(buf);
    return size && size.width > 0 && size.height > 0
      ? { width: size.width, height: size.height }
      : null;
  } catch {
    // A missing or unreadable file must not throw out of a layout.
    return null;
  }
}

/**
 * `{ path, width?, height? }` for the configured logo.
 *
 * Width and height are present only when something actually measured them.
 */
export async function resolveLogo(logoPath) {
  const p = String(logoPath || DEFAULT_LOGO_PATH);

  let row = null;
  try {
    row = await getMediaByPath(p);
  } catch {
    // A database outage degrades to reading the file, which is the better
    // source anyway — it just costs an fs call.
    row = null;
  }
  if (row && Number(row.width) > 0 && Number(row.height) > 0) {
    return { path: p, width: Number(row.width), height: Number(row.height) };
  }

  const measured = await measure(p);
  return measured ? { path: p, ...measured } : { path: p };
}

/**
 * The complete `Organization` JSON-LD node for the site.
 *
 * Rendered by `app/[locale]/layout.jsx` on every localised page, so it must
 * degrade rather than throw. Both reads are independently guarded: settings
 * fall back to the code constants, and the logo falls back to its path alone.
 * The worst case is the block exactly as it shipped.
 */
export async function loadOrganization() {
  let seo = SEO_DEFAULTS;
  try {
    seo = await getSeoSettings();
  } catch {
    seo = SEO_DEFAULTS;
  }
  const logo = await resolveLogo(seo.logoPath || SEO_DEFAULTS.logoPath);
  // Official accounts as schema.org `sameAs` (audit 3.2): only the https
  // links an operator has entered at /admin/settings; none is ever guessed.
  let sameAs = [];
  try {
    const { getContactDetails } = await import('../settings.js');
    sameAs = Object.values((await getContactDetails()).social || {});
  } catch {
    sameAs = [];
  }
  return organizationJsonLd({ name: seo.orgName, alternateName: seo.orgShortName, logo, sameAs });
}
