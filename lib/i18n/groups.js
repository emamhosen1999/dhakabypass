/**
 * Which surface of the site a UI string belongs to.
 *
 * 182 keys in three languages is 546 inputs. Handing an editor one flat list of
 * them is the same as handing them nothing, so /admin/translations groups by
 * the screen the string appears on — the unit a person actually thinks in
 * ("the contact form", "the map legend"), not the unit the code is organised in.
 *
 * Pure and data-driven so the grouping is testable and so adding a key never
 * lands it somewhere the screen cannot render: the last rule matches
 * everything, and `groupForKey` always returns a member of UI_STRING_GROUPS.
 */

export const GROUPS = {
  NAV: 'Navigation and footer',
  CHROME: 'Site chrome',
  PROVENANCE: 'Provenance and status notices',
  CONTACT: 'Contact page and form',
  NEWS: 'Newsroom',
  GALLERY: 'Gallery',
  TRAVEL: 'Travel pages',
  MAP: 'Corridor map',
  HOME: 'Home page',
  OTHER: 'Other',
};

/** Render order on the admin screen. */
export const UI_STRING_GROUPS = [
  GROUPS.NAV, GROUPS.CHROME, GROUPS.PROVENANCE, GROUPS.HOME, GROUPS.TRAVEL,
  GROUPS.MAP, GROUPS.CONTACT, GROUPS.NEWS, GROUPS.GALLERY, GROUPS.OTHER,
];

/**
 * First match wins, so order matters: `mapHeading`/`mapIntro`/`mapAltText` are
 * travel-map page copy and must be caught by the map rule before the generic
 * travel one, and `navMap`/`navGallery` must be caught by the nav rule first.
 */
const RULES = [
  [/^map\./, GROUPS.MAP],
  [/^ui\.(nav|footer)/, GROUPS.NAV],
  [/^ui\.(pendingTag|legacyData|provisional|illustrative)/, GROUPS.PROVENANCE],
  [/^ui\.(contact|form)/, GROUPS.CONTACT],
  [/^ui\.news/, GROUPS.NEWS],
  [/^ui\.gallery/, GROUPS.GALLERY],
  [/^ui\.map/, GROUPS.MAP],
  [/^ui\.(home|seeAll|seeRoute)/, GROUPS.HOME],
  [
    /^ui\.(travel|col|toll|route|rules|prohibited|kind|status|open|interchange|sev|noToll|noInterchanges|noFacilities|vehicle)/,
    GROUPS.TRAVEL,
  ],
  [/^ui\.(consent|skip|language|theme|allRights|emergency)/, GROUPS.CHROME],
];

export function groupForKey(fullKey) {
  const key = String(fullKey || '');
  for (const [pattern, group] of RULES) if (pattern.test(key)) return group;
  return GROUPS.OTHER;
}
