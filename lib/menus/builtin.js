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
  // Search in the header (UI audit UI-NAV-01), overridable like every link.
  { key: 'navSearch', href: '/search' },
];

export const FOOTER_GROUPS = [
  /**
   * Five columns, each for one kind of reader (W8N.3, after the navigation
   * audit). The old four mixed them: "Company" carried the videos and the 360°
   * tour, "Travel" ran to fifteen links with Safety at the bottom, and a
   * journalist had to look under "Contact" for the newsroom. Each column now
   * answers one question — how do I use the road, what accounts and services
   * are there, who runs it, what has it disclosed, and where is the news and
   * the help — and none runs past eleven links.
   *
   * This is the built-in fallback. The live footer is the `footer` menu at
   * /admin/menus, which overrides it group by group.
   */
  {
    heading: 'footerTravel',
    links: [
      { key: 'travelStatus', href: '/travel/status' },
      { key: 'travelToll', href: '/travel/toll' },
      { key: 'navPayment', href: '/travel/payment' },
      { key: 'travelRoute', href: '/travel/route' },
      { key: 'navMap', href: '/travel/map' },
      { key: 'navVehicleClasses', href: '/travel/vehicle-classes' },
      { key: 'navAdvisories', href: '/travel/advisories' },
      { key: 'navCameras', href: '/travel/cameras' },
      { key: 'navBreakdown', href: '/travel/breakdown' },
      { key: 'navTollDispute', href: '/travel/toll-dispute' },
    ],
  },
  {
    heading: 'footerServices',
    links: [
      { key: 'navEtc', href: '/travel/etc' },
      { key: 'navFleet', href: '/travel/fleet' },
      { key: 'navFrequent', href: '/travel/frequent-traveller' },
      { key: 'navAlerts', href: '/travel/alerts' },
      { key: 'navFreight', href: '/travel/freight' },
      { key: 'travelFacilities', href: '/travel/facilities' },
      { key: 'navLostFound', href: '/travel/lost-found' },
      { key: 'travelRules', href: '/travel/rules' },
    ],
  },
  {
    heading: 'footerCompany',
    links: [
      { key: 'navAbout', href: '/about' },
      { key: 'navGovernance', href: '/about/governance' },
      { key: 'navConcession', href: '/about/concession' },
      { key: 'navOrganisation', href: '/about/organisation' },
      { key: 'navIntegrity', href: '/about/integrity' },
      { key: 'navRecognition', href: '/about/recognition' },
      { key: 'navCareers', href: '/about/careers' },
      { key: 'navSustainability', href: '/sustainability' },
      { key: 'navSafety', href: '/safety' },
    ],
  },
  {
    heading: 'footerDisclosure',
    links: [
      { key: 'navDisclosures', href: '/disclosures' },
      { key: 'navTariff', href: '/disclosures/tariff' },
      { key: 'navRti', href: '/disclosures/right-to-information' },
      { key: 'navCitizenCharter', href: '/disclosures/citizen-charter' },
      { key: 'navPolicies', href: '/disclosures/policies' },
      { key: 'navReports', href: '/disclosures/reports' },
      { key: 'navEnvironment', href: '/disclosures/environment' },
      { key: 'navLandAcquisition', href: '/disclosures/land-acquisition' },
      { key: 'navConsultations', href: '/disclosures/consultations' },
      { key: 'navProcurement', href: '/procurement' },
    ],
  },
  {
    heading: 'footerContact',
    links: [
      { key: 'navContact', href: '/contact' },
      { key: 'navGrievances', href: '/grievances' },
      { key: 'navFaq', href: '/faq' },
      { key: 'navNews', href: '/news' },
      { key: 'navPressReleases', href: '/press-releases' },
      { key: 'navMedia', href: '/media' },
      { key: 'navGallery', href: '/gallery' },
      { key: 'navVideos', href: '/gallery/videos' },
      { key: 'navTour', href: '/project/virtual-tour' },
      { key: 'navDownloads', href: '/downloads' },
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
  { key: 'navCameras', href: '/travel/cameras' },
];

/** The footer's bottom bar: the policy pages every visitor must be able to reach. */
export const LEGAL_NAV = [
  { key: 'footerPrivacy', href: '/privacy' },
  { key: 'footerTerms', href: '/terms' },
  { key: 'footerAccessibility', href: '/accessibility' },
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
