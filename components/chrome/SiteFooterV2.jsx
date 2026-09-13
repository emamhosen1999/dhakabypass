import Link from 'next/link';
import { t } from '../../lib/i18n/ui.js';
import { getMenuCached } from '../../lib/menus/cache.js';
import { FOOTER_GROUPS, LEGAL_NAV } from '../../lib/menus/builtin.js';
import { localeHref } from '../../lib/blocks/href.js';
import { getContactDetailsCached } from '../../lib/settings-cache.js';
import EmergencyNumbers from '../contact/EmergencyNumbers.jsx';
import { siteSeoCached } from '../../lib/seo/cache.js';

/**
 * The footer carries the statutory pages.
 *
 * A PPP toll road has obligations that a road user needs rarely and an affected
 * landowner, a supplier or a journalist needs badly: tariff notifications, land
 * acquisition and resettlement disclosure, open tenders, governance, and a route
 * for grievances. Putting them in the header would push the toll rate — which
 * every visitor wants — further away; leaving them out entirely would make them
 * findable only by someone who already knew they existed.
 *
 * Grouped rather than listed flat, because eight undifferentiated links is a
 * list nobody reads.
 */
const GROUPS = FOOTER_GROUPS;

export default async function SiteFooterV2({ locale }) {
  const year = new Date().getFullYear();

  /**
   * A `footer` menu in the database overrides the groups above, using
   * `menu_items.parent_id`: a top-level item is a column heading and its
   * children are the links beneath it. A heading needs no href.
   *
   * As in the header, this only ever overrides — no menu, no items or no
   * database leaves the built-in groups in place, so the statutory links a
   * landowner or a supplier comes here for cannot vanish because a query failed.
   */
  let menu = [];
  let legalMenu = [];
  try {
    [menu, legalMenu] = await Promise.all([getMenuCached('footer', locale), getMenuCached('legal', locale)]);
  } catch {
    menu = [];
    legalMenu = [];
  }
  const legal = (legalMenu || []).length
    ? legalMenu.filter((i) => i.href).map((i) => ({ key: i.id, href: localeHref(i.href, locale), label: i.label }))
    : LEGAL_NAV.map((n) => ({ key: n.href, href: `/${locale}${n.href}`, label: t(locale, n.key) }));

  /**
   * The emergency number sits on every page, in the footer, because that is
   * where a person on the hard shoulder with a phone will look: the bottom of
   * whatever page they landed on. NHAI publishes a helpline in the same place;
   * PLUS Malaysia puts its 1-800 line in the footer of every page. It is read
   * from the setting the operator edits at /admin/settings, so a change there
   * reaches every page at once. An empty setting renders nothing rather than a
   * placeholder — a number nobody answers is worse than no number.
   */
  const brand = await siteSeoCached(locale);
  let details = {};
  try {
    details = await getContactDetailsCached(locale);
  } catch {
    details = {};
  }
  const social = details.social || {};

  const groups = menu.length
    ? menu.map((g) => ({
        key: g.id,
        heading: g.label,
        links: (g.children || []).map((c) => ({
          key: c.id, href: localeHref(c.href, locale), label: c.label,
        })),
      }))
    : GROUPS.map((group) => ({
        key: group.heading,
        heading: t(locale, group.heading),
        links: group.links.map((link) => ({
          key: link.href, href: `/${locale}${link.href}`, label: t(locale, link.key),
        })),
      }));

  return (
    <footer className="db-footer">
      <nav className="db-footer-nav" aria-label={t(locale, 'footerNavLabel')}>
        {groups.map((group) => (
          <div key={group.key} className="db-footer-group">
            <h2 className="db-footer-heading">{group.heading}</h2>
            <ul className="db-footer-links">
              {group.links.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="db-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {details.emergency || details.nationalEmergency ? (
        <div className="db-footer-emergency">
          <EmergencyNumbers locale={locale} emergency={details.emergency} national={details.nationalEmergency} />
        </div>
      ) : null}
      <div className="db-footer-inner">
        {/* The organisation's full name from /admin/settings (W1.10). */}
        <p className="db-footer-brand">{brand.orgName}</p>
        {/* The policy links sit in the bottom bar, where a reader looks for
            them. They are the `legal` menu (audit 4.2) — an operator can rename,
            re-point or add one — and fall back to the three built-in policy
            pages whenever that menu is empty or unreadable, so they cannot
            quietly disappear. */}
        <ul className="db-footer-legal-links">
          {legal.map((l) => <li key={l.key}><Link href={l.href}>{l.label}</Link></li>)}
        </ul>
        {/* DBEDC's official accounts, from /admin/settings (Contact). Only
            https links are ever stored, and none renders until one is set. */}
        {Object.keys(social).length ? (
          <ul className="db-footer-social" aria-label={t(locale, 'footerSocial')}>
            {Object.entries(social).map(([name, url]) => (
              <li key={name}><a href={url} rel="noopener me">{t(locale, `social_${name}`)}</a></li>
            ))}
          </ul>
        ) : null}
        <p className="db-footer-legal">© {year} {brand.orgShortName}. {t(locale, 'allRights')}</p>
      </div>
    </footer>
  );
}
