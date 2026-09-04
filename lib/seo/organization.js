import { absoluteUrl } from './site.js';

/**
 * `Organization` structured data for DBEDC.
 *
 * ---------------------------------------------------------------------------
 * The rule this file is built on
 * ---------------------------------------------------------------------------
 * A JSON-LD block is a machine-readable ASSERTION. Google reads it, Bing reads
 * it, and a knowledge panel can end up quoting it back to the public with the
 * company's name attached. A block that asserts a phone number DBEDC does not
 * have is worse than no block at all: it is a wrong number published by the
 * road operator, and nobody who calls it will know it came from a placeholder.
 *
 * So this emits only what has actually been verified, and emits NO key at all
 * for anything unverified — not an empty string, not a "TBC", not a plausible
 * guess. An absent property means "not stated". A present, empty one means
 * "stated, and empty", which is a different and worse claim.
 *
 * ---------------------------------------------------------------------------
 * INCLUDED, and where each fact comes from
 * ---------------------------------------------------------------------------
 * - `name` — "Dhaka Bypass Expressway Development Company". The company's own
 *   name as it is published in the site footer today
 *   (components/chrome/SiteFooterV2.jsx) and throughout the project plan.
 * - `alternateName` — "DBEDC". Used by the company itself in the site header,
 *   the footer copyright line and the admin.
 * - `url` — the site's own origin, from the one configured variable.
 * - `logo` — /logo.webp, with the real pixel dimensions (215x204) read off the
 *   file by lib/media/probe.js and stored on the `media` row. It is the only
 *   version of the logo that exists; the vector original is still outstanding
 *   from DBEDC. 215x204 clears Google's 112x112 minimum for an organisation
 *   logo, so it is publishable as-is.
 *
 * ---------------------------------------------------------------------------
 * DELIBERATELY OMITTED — do not add these without a source
 * ---------------------------------------------------------------------------
 * docs/source-data/2026-09-03-client-decisions.md, "Still outstanding from
 * DBEDC", lists these as not supplied. Every one is a field a naive
 * Organization snippet would normally carry:
 *
 * - `telephone`     — no phone number has been supplied.
 * - `contactPoint`  — the emergency hotline does not exist yet. The same
 *                     document says the home page "cannot honestly close on
 *                     'report a problem'" for this reason; a schema.org
 *                     ContactPoint would make exactly that claim in machine
 *                     form.
 * - `email`         — no address supplied.
 * - `address` /
 *   `PostalAddress` — no postal address supplied. A `PostalAddress` carrying
 *                     only `addressCountry: 'BD'` was considered and rejected:
 *                     it asserts a structured address that is 90% missing,
 *                     which is what produces a half-populated knowledge panel.
 * - `sameAs`        — no official social or Wikidata profile has been verified.
 *                     `sameAs` is an identity claim; guessing one links DBEDC
 *                     to an account it may not control.
 * - `foundingDate`,
 *   `numberOfEmployees`,
 *   `legalName`,
 *   `parentOrganization` — none established from a source in this repo.
 * - `description`   — the corridor's headline figures (length, cost, lane
 *                     count) are flagged provisional throughout the plan and
 *                     several are explicitly unconfirmed. Anything worth
 *                     saying here would repeat one of them.
 *
 * The result is a short block. Short and true is the point.
 */

/** Dimensions of public/logo.webp, verified by the media import. */
const LOGO = { path: '/logo.webp', width: 215, height: 204 };

export const ORG_NAME = 'Dhaka Bypass Expressway Development Company';
export const ORG_SHORT_NAME = 'DBEDC';

/**
 * @returns {object} a plain object safe to `JSON.stringify` into a
 *   `<script type="application/ld+json">`.
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    // A stable identifier so later pages can reference this same node
    // (`{"@id": ".../#organization"}`) instead of re-declaring the company.
    '@id': `${absoluteUrl('/')}#organization`,
    name: ORG_NAME,
    // The English legal name is used on all three locales. DBEDC has not
    // supplied official Bangla or Chinese forms of its registered name, and
    // inventing a translation of a company's legal name is exactly the class
    // of error docs/source-data/2026-09-03-client-decisions.md #2 warns about
    // for the corridor's own place names.
    alternateName: ORG_SHORT_NAME,
    // The organisation's website, not the page this happens to be embedded in.
    // The root currently serves the legacy site; that is still DBEDC's site,
    // and it is the URL that stays correct through the cutover.
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(LOGO.path),
      width: LOGO.width,
      height: LOGO.height,
    },
  };
}

/**
 * The JSON text to place inside the script tag.
 *
 * Every `<` is escaped so a value containing a closing script tag could never
 * close the tag early. Nothing in the object above contains one today; this is
 * here so that adding a field later cannot quietly open an injection.
 */
export function organizationJsonLdText() {
  return JSON.stringify(organizationJsonLd()).replace(/</g, '\\u003c');
}
