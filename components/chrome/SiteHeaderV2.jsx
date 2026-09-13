import Link from 'next/link';
import LocaleSwitch from './LocaleSwitch.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { t } from '../../lib/i18n/ui.js';
import { getMenuCached } from '../../lib/menus/cache.js';
import { MAIN_NAV, CTA_NAV } from '../../lib/menus/builtin.js';
import { siteSeoCached } from '../../lib/seo/cache.js';
import { localeHref } from '../../lib/blocks/href.js';
import { resolveLogo } from '../../lib/seo/identity.js';

/**
 * The primary navigation.
 *
 * This is deliberately NOT the old site's shape. That site is organised around
 * `project`, `economic-impact`, `stakeholders` and `chinese-contribution` — a
 * brochure about the project's promoters, published at the address a driver
 * reaches for when they want to know what a truck costs to take through Gazipur.
 *
 * What operators of comparable roads lead with is journey planning, road safety,
 * sustainability and governance; PLUS Malaysia, the closest comparable, is
 * organised in exactly those terms. `/impact` is gone rather than renamed: an
 * economic-impact page is an argument for the road's existence, and every figure
 * that would fill one is in the unverified pile.
 *
 * Six items is the most this header carries before the desktop row wraps. The
 * statutory pages — disclosures, procurement, grievances, governance — are one
 * click deeper, from the footer and from About, because a road user needs them
 * rarely and needs the toll rate constantly.
 */
const NAV = MAIN_NAV;

export default async function SiteHeaderV2({ locale }) {
  /**
   * A menu named `main` in the database OVERRIDES the list above; anything
   * else — no menu, no items, no database — leaves the built-in one in place.
   *
   * That asymmetry is the whole design. The labels above live in code so the
   * navigation cannot empty itself during an outage (see lib/i18n/ui.js), and
   * an override that only ever ADDS a source of truth keeps that property: the
   * worst a database failure can do here is give you the navigation you already
   * had.
   */
  let items = [];
  let ctaItems = [];
  try {
    [items, ctaItems] = await Promise.all([getMenuCached('main', locale), getMenuCached('cta', locale)]);
  } catch {
    items = [];
    ctaItems = [];
  }
  // The button is the `cta` menu (audit 4.3); built-in: Contact.
  const ctas = (ctaItems || []).length
    ? ctaItems.filter((i) => i.href).map((i) => ({ key: i.id, href: localeHref(i.href, locale), label: i.label }))
    : CTA_NAV.map((n) => ({ key: n.href, href: `/${locale}${n.href}`, label: t(locale, n.key) }));
  const brand = await siteSeoCached(locale);
  // The picture's own proportions, measured (audit 2.14): the mark is drawn
  // 34px tall, so the width attribute follows whatever file is configured.
  let logoWidth = null;
  try {
    const logo = await resolveLogo(brand.headerLogo);
    if (logo.width > 0 && logo.height > 0) logoWidth = Math.round((34 * logo.width) / logo.height);
  } catch {
    logoWidth = null;
  }

  const links = items.length
    ? items.map((i) => ({ key: i.id, href: localeHref(i.href, locale), label: i.label }))
    : NAV.map((n) => ({ key: n.href, href: `/${locale}${n.href}`, label: t(locale, n.key) }));

  return (
    <header className="db-header">
      <a href="#main" className="db-skip">{t(locale, 'skipToContent')}</a>
      <div className="db-header-inner">
        {/* W1.10: the short name and the header picture come from
            /admin/settings (Organisation); the tagline is the brandTagline
            string under Wording, per language. Nothing on this line is typed
            here. The default picture is DBEDC's own emblem, cropped from the
            logo file DBEDC supplied — not a redrawn SVG. */}
        <Link href={`/${locale}`} className="db-brand">
          <img className="db-brand-mark db-brand-mark-img" src={brand.headerLogo} alt="" width={logoWidth || undefined} height={34} />
          <span>
            <b className="db-brand-name">{brand.orgShortName}</b>
            <small className="db-brand-tag">{t(locale, 'brandTagline')}</small>
          </span>
        </Link>

        {/* Visible from md, not xl — the old header vanished between 1024 and 1279px. */}
        <nav className="db-nav" aria-label={t(locale, 'navPrimary')}>
          {links.map((item) => (
            <Link key={item.key} href={item.href} className="db-nav-link">
              {item.label}
            </Link>
          ))}
          {ctas.map((c) => <Link key={c.key} href={c.href} className="db-nav-cta">{c.label}</Link>)}
        </nav>

        <div className="db-header-utils">
          <LocaleSwitch current={locale} label={t(locale, 'language')} />
          <ThemeToggle label={t(locale, 'theme')} labels={{ light: t(locale, 'themeLight'), dark: t(locale, 'themeDark'), system: t(locale, 'themeSystem') }} />
        </div>

        {/* Below 768px the same links live here, in a horizontally scrollable
            row, so no destination is ever unreachable on a narrow screen. */}
        <nav className="db-nav-mobile" aria-label={t(locale, 'navPrimaryCompact')}>
          {links.map((item) => (
            <Link key={item.key} href={item.href} className="db-nav-link">
              {item.label}
            </Link>
          ))}
          {ctas.map((c) => <Link key={c.key} href={c.href} className="db-nav-cta">{c.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
