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
      { key: 'navSafety', href: '/safety' },
    ],
  },
  {
    heading: 'footerCompany',
    links: [
      { key: 'navAbout', href: '/about' },
      { key: 'navGovernance', href: '/about/governance' },
      { key: 'navSustainability', href: '/sustainability' },
      { key: 'navNews', href: '/news' },
      { key: 'navGallery', href: '/gallery' },
    ],
  },
  {
    heading: 'footerDisclosure',
    links: [
      { key: 'navDisclosures', href: '/disclosures' },
      { key: 'navTariff', href: '/disclosures/tariff' },
      { key: 'navLandAcquisition', href: '/disclosures/land-acquisition' },
      { key: 'navProcurement', href: '/procurement' },
    ],
  },
  {
    heading: 'footerContact',
    links: [
      { key: 'navContact', href: '/contact' },
      { key: 'navGrievances', href: '/grievances' },
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
];

/** `{ en, bn, zh }` labels for one key, from the code table. */
export const labelsFor = (key) => Object.fromEntries(LOCALES.map((l) => [l, t(l, key)]));

/**
 * The rows to insert for a menu slug, flat, in order: `{ href, labels,
 * sortOrder, parentIndex }` where parentIndex points at the heading row a
 * footer link sits under (null at top level). A heading row has no href.
 */
export function builtinRows(slug) {
  if (slug === 'main') return MAIN_NAV.map((n, i) => ({ href: n.href, labels: labelsFor(n.key), sortOrder: i, parentIndex: null }));
  if (slug === 'travel') return TRAVEL_NAV.map((n, i) => ({ href: n.href, labels: labelsFor(n.key), sortOrder: i, parentIndex: null }));
  if (slug === 'footer') {
    const rows = [];
    FOOTER_GROUPS.forEach((g, gi) => {
      const headingIndex = rows.length;
      rows.push({ href: '', labels: labelsFor(g.heading), sortOrder: gi, parentIndex: null });
      g.links.forEach((l, li) => rows.push({ href: l.href, labels: labelsFor(l.key), sortOrder: li, parentIndex: headingIndex }));
    });
    return rows;
  }
  return [];
}
