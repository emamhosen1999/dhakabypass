import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildSitemap, lastModifiedFor } from '../../lib/seo/sitemap.js';
import { STATIC_LOCALISED_PATHS } from '../../lib/seo/routes.js';
import { LOCALES } from '../../lib/i18n/locales.js';

const original = process.env.SITE_URL;

beforeEach(() => { process.env.SITE_URL = 'https://dhakabypass.com'; });
afterEach(() => {
  if (original === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = original;
});

const PAGE_AT = new Date('2026-08-31T12:57:26Z');
const TR_AT = new Date('2026-09-03T06:32:16Z');

const homeRow = {
  id: 1,
  slug: 'home',
  status: 'published',
  updatedAt: PAGE_AT,
  translations: LOCALES.map((locale) => ({ locale, status: 'published', updatedAt: TR_AT })),
};

const urls = (entries) => entries.map((e) => e.url);

describe('buildSitemap', () => {
  it('emits one entry per locale for a published page', () => {
    const got = urls(buildSitemap({ pages: [homeRow] }));
    expect(got).toContain('https://dhakabypass.com/en');
    expect(got).toContain('https://dhakabypass.com/bn');
    expect(got).toContain('https://dhakabypass.com/zh');
  });

  it('never emits a draft page', () => {
    const draft = { ...homeRow, id: 2, slug: 'about', status: 'draft' };
    const got = urls(buildSitemap({ pages: [homeRow, draft] }));
    for (const locale of LOCALES) {
      expect(got).not.toContain(`https://dhakabypass.com/${locale}/about`);
    }
  });

  it('emits a second published page at its own slug path', () => {
    const about = { ...homeRow, id: 3, slug: 'about/partners' };
    const got = urls(buildSitemap({ pages: [homeRow, about] }));
    expect(got).toContain('https://dhakabypass.com/en/about/partners');
    expect(got).toContain('https://dhakabypass.com/zh/about/partners');
  });

  it('includes the travel routes for every locale', () => {
    const got = urls(buildSitemap({ pages: [homeRow] }));
    for (const locale of LOCALES) {
      expect(got).toContain(`https://dhakabypass.com/${locale}/travel/toll`);
      expect(got).toContain(`https://dhakabypass.com/${locale}/travel/route`);
      expect(got).toContain(`https://dhakabypass.com/${locale}/travel/status`);
      expect(got).toContain(`https://dhakabypass.com/${locale}/travel/rules`);
      expect(got).toContain(`https://dhakabypass.com/${locale}/travel/facilities`);
    }
  });

  it('omits /[locale]/travel, which only redirects', () => {
    const got = urls(buildSitemap({ pages: [homeRow] }));
    for (const locale of LOCALES) {
      expect(got).not.toContain(`https://dhakabypass.com/${locale}/travel`);
    }
  });

  it('contains no legacy route', () => {
    const got = urls(buildSitemap({ pages: [homeRow] }));
    for (const path of ['/project', '/gallery', '/contact', '/stakeholders',
      '/economic-impact', '/latest-updates', '/routes-facilities', '/chinese-contribution']) {
      // Compared as a whole pathname, not with endsWith. `/en/contact` ends
      // with `/contact` but is the LOCALISED contact page, a different page in
      // a different tree from the legacy `/contact` under app/(site)/. The
      // invariant is that no UNPREFIXED legacy URL is emitted, which the
      // locale-prefix assertion below states directly.
      expect(got.some((u) => new URL(u).pathname === path)).toBe(false);
    }
    // And no unprefixed URL at all: every entry lives under a locale.
    for (const u of got) {
      expect(new URL(u).pathname).toMatch(/^\/(en|bn|zh)(\/|$)/);
    }
  });

  it('never emits /<locale>/home', () => {
    const got = urls(buildSitemap({ pages: [homeRow] }));
    for (const locale of LOCALES) {
      expect(got).not.toContain(`https://dhakabypass.com/${locale}/home`);
    }
  });

  it('returns the static routes when the database gave nothing', () => {
    // The dead-database path. It must still answer, and it must still include
    // the front door.
    const got = urls(buildSitemap({ pages: [] }));
    expect(got).toContain('https://dhakabypass.com/en');
    expect(got).toContain('https://dhakabypass.com/bn/travel/toll');
    // home + every code route in STATIC_LOCALISED_PATHS, in each locale.
    // Asserted against the list rather than a literal, so adding a route
    // updates this with it instead of failing for the wrong reason — the
    // drift guard in seo-routes.test.js is what keeps that list honest.
    expect(got.length).toBe(LOCALES.length * (STATIC_LOCALISED_PATHS.length + 1));
  });

  it('survives being called with no argument at all', () => {
    expect(buildSitemap().length).toBeGreaterThan(0);
  });

  it('emits no duplicate URL when the home row and the static fallback overlap', () => {
    const got = urls(buildSitemap({ pages: [homeRow] }));
    expect(new Set(got).size).toBe(got.length);
  });

  it('carries a real lastModified on the database-backed entries', () => {
    const entries = buildSitemap({ pages: [homeRow] });
    const en = entries.find((e) => e.url === 'https://dhakabypass.com/en');
    expect(en.lastModified).toEqual(TR_AT);
  });

  it('omits lastModified on code routes rather than inventing "now"', () => {
    const entries = buildSitemap({ pages: [homeRow] });
    const toll = entries.find((e) => e.url === 'https://dhakabypass.com/en/travel/toll');
    expect('lastModified' in toll).toBe(false);
  });

  it('declares all three locales plus x-default on every entry', () => {
    for (const entry of buildSitemap({ pages: [homeRow] })) {
      expect(Object.keys(entry.alternates.languages).sort())
        .toEqual(['bn', 'en', 'x-default', 'zh']);
    }
  });

  it('rejects a row whose status field is missing entirely', () => {
    // Defensive: a hand-rolled caller passing rows without `status` must not
    // get its pages published into the sitemap by accident.
    const got = urls(buildSitemap({ pages: [{ id: 9, slug: 'secret', translations: [] }] }));
    expect(got.some((u) => u.includes('/secret'))).toBe(false);
  });
});

describe('lastModifiedFor', () => {
  it('prefers the published translation timestamp when it is newer', () => {
    expect(lastModifiedFor(homeRow, 'bn')).toEqual(TR_AT);
  });

  it('uses the page timestamp when it is the newer of the two', () => {
    const page = {
      ...homeRow,
      updatedAt: new Date('2026-10-01T00:00:00Z'),
    };
    expect(lastModifiedFor(page, 'en')).toEqual(new Date('2026-10-01T00:00:00Z'));
  });

  it('ignores an unpublished translation row', () => {
    // The URL renders English there; dating it by an unpublished Bangla draft
    // would advertise freshness nothing on that page reflects.
    const page = {
      ...homeRow,
      translations: [{ locale: 'bn', status: 'draft', updatedAt: new Date('2026-12-01T00:00:00Z') }],
    };
    expect(lastModifiedFor(page, 'bn')).toEqual(PAGE_AT);
  });

  it('parses a MySQL datetime string', () => {
    const page = { slug: 'home', status: 'published', updatedAt: '2026-08-31 12:57:26', translations: [] };
    expect(lastModifiedFor(page, 'en')).toBeInstanceOf(Date);
  });

  it('returns null when there is no usable timestamp anywhere', () => {
    expect(lastModifiedFor({ slug: 'home', updatedAt: null, translations: [] }, 'en')).toBeNull();
    expect(lastModifiedFor({ slug: 'home', updatedAt: 'not a date', translations: [] }, 'en')).toBeNull();
  });

  it('tolerates a missing translations array', () => {
    expect(lastModifiedFor({ slug: 'home', updatedAt: PAGE_AT }, 'zh')).toEqual(PAGE_AT);
  });
});
