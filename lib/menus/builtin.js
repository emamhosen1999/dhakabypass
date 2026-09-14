/**
 * The built-in navigation — the links the header, footer and travel sub-nav
 * render while their menu in the database is empty (lib/menus/repo.js:
 * override, never replace).
 *
 * One home for the three lists, so the chrome and the admin's "start from
 * the built-in links" (W1.11) read the same definition. Labels are string
 * KEYS into lib/i18n/ui.js; the chrome renders them through t(), the seed
 * copies the code table's value for each locale into `menu_items.labels`.
 */
import { LOCALES } from '../i18n/locales.js';
import { t } from '../i18n/ui.js';

export const MAIN_NAV = [
  { key: 'navTravel', href: '/travel' },
  { key: 'navSafety', href: '/safety' },
  { key: 'navProject', href: '/project' },
  { key: 'navSustainability', href: '/sustainability' },
  { key: 'navAbout', href: '/about' },
  { key: 'navNews', href: '/news' },
];

export const FOOTER_GROUPS = [
  {
    heading: 'footerTravel',
    links: [
      { key: 'travelStatus', href: '/travel/status' },
      { key: 'travelToll', href: '/travel/toll' },
      { key: 'travelRoute', href: '/travel/route' },
      { key: 'navAdvisories', href: '/travel/advisories' },
      { key: 'navVehicleClasses', href: '/travel/vehicle-classes' },
      { key: 'navFreight', href: '/travel/freight' },
      { key: 'navSafety', href: '/safety' },
    ],
  },
  {
    heading: 'footerCompany',
    links: [
      { key: 'navAbout', href: '/about' },
      { key: 'navGovernance', href: '/about/governance' },
      { key: 'navConcession', href: '/about/concession' },
      { key: 'navSustainability', href: '/sustainability' },
      { key: 'navCareers', href: '/about/careers' },
      { key: 'navNews', href: '/news' },
      { key: 'navMedia', href: '/media' },
    ],
  },
  {
    heading: 'footerDisclosure',
    links: [
      { key: 'navDisclosures', href: '/disclosures' },
      { key: 'navTariff', href: '/disclosures/tariff' },
      { key: 'navLandAcquisition', href: '/disclosures/land-acquisition' },
      { key: 'navProcurement', href: '/procurement' },
      { key: 'navRti', href: '/disclosures/right-to-information' },
      { key: 'navCitizenCharter', href: '/disclosures/citizen-charter' },
      { key: 'navIntegrity', href: '/about/integrity' },
    ],
  },
  {
    heading: 'footerContact',
    links: [
      { key: 'navContact', href: '/contact' },
      { key: 'navGrievances', href: '/grievances' },
      { key: 'navFaq', href: '/faq' },
      { key: 'navDownloads', href: '/downloads' },
      { key: 'navGallery', href: '/gallery' },
      { key: 'navSitemap', href: '/sitemap' },
    ],
  },
];

export const TRAVEL_NAV = [
  { key: 'travelStatus', href: '/travel/status' },
  { key: 'travelToll', href: '/travel/toll' },
  { key: 'travelRoute', href: '/travel/route' },
  { key: 'navMap', href: '/travel/map' },
  { key: 'travelFacilities', href: '/travel/facilities' },
  { key: 'travelRules', href: '/travel/rules' },
  { key: 'navAdvisories', href: '/travel/advisories' },
];

/** The footer's bottom bar: the policy pages every visitor must be able to reach. */
export const LEGAL_NAV = [
  { key: 'footerPrivacy', href: '/privacy' },
  { key: 'footerTerms', href: '/terms' },
  { key: 'footerAccessibility', href: '/accessibility' },
  { key: 'navSearch', href: '/search' },
];

/** The header's call-to-action button (desktop and compact). */
export const CTA_NAV = [
  { key: 'navContact', href: '/contact' },
];

/** `{ en, bn, zh }` labels for one key, from the code table. */
export const labelsFor = (key) => Object.fromEntries(LOCALES.map((l) => [l, t(l, key)]));

/**
 * The rows to insert for a menu slug, flat, in order: `{ href, labels,
 * sortOrder, parentIndex }` where parentIndex points at the heading row a
 * footer link sits under (null at top level). A heading row has no href.
 */
// Seeded rows carry the AUTHORED form of a link — no leading slash — so
// lib/blocks/href.js localises them per reader. The code tables keep the
// slash because the chrome prefixes `/${locale}` to them directly.
const authored = (href) => String(href || '').replace(/^\/+/, '');

export function builtinRows(slug) {
  if (slug === 'main') return MAIN_NAV.map((n, i) => ({ href: authored(n.href), labels: labelsFor(n.key), sortOrder: i, parentIndex: null }));
  if (slug === 'travel') return TRAVEL_NAV.map((n, i) => ({ href: authored(n.href), labels: labelsFor(n.key), sortOrder: i, parentIndex: null }));
  if (slug === 'legal') return LEGAL_NAV.map((n, i) => ({ href: authored(n.href), labels: labelsFor(n.key), sortOrder: i, parentIndex: null }));
  if (slug === 'cta') return CTA_NAV.map((n, i) => ({ href: authored(n.href), labels: labelsFor(n.key), sortOrder: i, parentIndex: null }));
  if (slug === 'footer') {
    const rows = [];
    FOOTER_GROUPS.forEach((g, gi) => {
      const headingIndex = rows.length;
      rows.push({ href: '', labels: labelsFor(g.heading), sortOrder: gi, parentIndex: null });
      g.links.forEach((l, li) => rows.push({ href: authored(l.href), labels: labelsFor(l.key), sortOrder: li, parentIndex: headingIndex }));
    });
    return rows;
  }
  return [];
}
