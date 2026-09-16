// W8N: the navigation audit's structural fixes, guarded where a regression
// would be invisible — a number that leaves the header, a menu list that
// freezes back into code, a site map that publishes a 404.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { FOOTER_GROUPS, LEGAL_NAV } from '../../lib/menus/builtin.js';
import { CHROME_MENU_SLUGS, SECTION_MENU_SLUGS, MENU_SLUGS } from '../../lib/menus/slugs.js';
import { UI } from '../../lib/i18n/ui.js';

const root = path.resolve(import.meta.dirname, '../..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');

describe('the emergency number is in the header (W8N.1)', () => {
  const header = read('components/chrome/SiteHeaderV2.jsx');
  it('reads it from settings rather than printing a number', () => {
    expect(header).toMatch(/getContactDetailsCached/);
    expect(header).toMatch(/nationalEmergency \|\| details\.emergency/);
    expect(header).not.toMatch(/tel:999|>999</);
  });
  it('renders a tel: link and nothing at all when the setting is blank', () => {
    expect(header).toMatch(/href=\{`tel:\$\{sos\.replace/);
    expect(header).toMatch(/\{sos \? \(/);
  });
});

describe('the footer link map (W8N.3, W8N.5)', () => {
  const hrefs = FOOTER_GROUPS.flatMap((g) => g.links.map((l) => l.href));
  it('lists the disclosure pages a lender and a regulator come for', () => {
    for (const href of ['/disclosures/reports', '/disclosures/environment', '/disclosures/policies', '/disclosures/consultations']) {
      expect(hrefs, href).toContain(href);
    }
  });
  it('lists what a driver needs after something has gone wrong', () => {
    for (const href of ['/travel/payment', '/travel/breakdown', '/travel/toll-dispute']) {
      expect(hrefs, href).toContain(href);
    }
  });
  it('reaches the press releases from the company column', () => {
    expect(hrefs).toContain('/press-releases');
  });
  it('collapses on a phone without dropping a link', () => {
    const footer = read('components/chrome/SiteFooterV2.jsx');
    expect(footer).toMatch(/<details [^>]*className="db-footer-group" open>/);
    expect(footer).toMatch(/FooterGroups/);
  });
  it('keeps search out of the bottom bar, now that it is a field in the header', () => {
    expect(LEGAL_NAV.map((l) => l.href)).not.toContain('/search');
  });
});

describe('section menus come from the database (W8N.3)', () => {
  it('names the chrome menus that a section sub-nav may not render', () => {
    expect(CHROME_MENU_SLUGS).toEqual(['main', 'cta', 'footer', 'legal']);
    for (const slug of CHROME_MENU_SLUGS) expect(MENU_SLUGS).toContain(slug);
  });
  it('keeps travel as the offline fallback', () => {
    expect(SECTION_MENU_SLUGS).toContain('travel');
  });
  it('declares the field as record-sourced, so the admin lists what exists', () => {
    const def = read('lib/blocks/types/section-subnav.js');
    expect(def).toMatch(/optionsFrom: 'section-menus'/);
  });
});

describe('the ways out of a 404 (W8N.6)', () => {
  const notFound = read('app/[locale]/not-found.jsx');
  it('names itself in the tab', () => {
    expect(notFound).toMatch(/export async function generateMetadata/);
    expect(notFound).toMatch(/notFoundHeading/);
  });
  it('offers a search field and the site map', () => {
    expect(notFound).toMatch(/action=\{`\/\$\{locale\}\/search`\}/);
    expect(notFound).toMatch(/\/sitemap/);
  });
});

describe('the site map excludes the page that renders 404s (W8N.7)', () => {
  it('filters the not-found slug in the query, as sitemap.xml does', () => {
    const src = read('lib/content/site-index.js');
    expect(src).toMatch(/NOT_FOUND_SLUG/);
    expect(src).toMatch(/p\.`?slug`? <> \?/);
  });
});

describe('the remembered language survives the cache (W8N.7)', () => {
  it('chooses the cookie, then the browser language, then English', async () => {
    const { pickLocale } = await import('../../lib/i18n/pick-locale.js');
    expect(pickLocale({ cookie: 'bn', acceptLanguage: 'zh-CN' })).toBe('bn');
    expect(pickLocale({ cookie: '', acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8' })).toBe('zh');
    expect(pickLocale({ cookie: 'fr', acceptLanguage: 'bn-BD,bn;q=0.9' })).toBe('bn');
    expect(pickLocale({ cookie: '', acceptLanguage: 'en-GB,bn;q=0.9' })).toBe('en');
    expect(pickLocale({})).toBe('en');
  });
  it('answers the bare domain with a 307 that no cache may keep', async () => {
    const { GET } = await import('../../app/route.js');
    const request = {
      cookies: { get: (k) => (k === 'db_locale' ? { value: 'zh' } : undefined) },
      headers: new Headers({ 'accept-language': 'en-GB' }),
    };
    const res = GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/zh');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('vary')).toMatch(/Cookie/);
  });
});


describe('the breadcrumb (W8N.4)', () => {
  it('is named in every language', () => {
    for (const locale of ['en', 'bn', 'zh']) expect(UI[locale].breadcrumbLabel, locale).toBeTruthy();
  });
  it('marks the page itself as current and does not link it', () => {
    const src = read('components/chrome/Breadcrumbs.jsx');
    expect(src).toMatch(/aria-current="page"/);
    expect(src).toMatch(/crumbs\.length < 2/);
  });
});
