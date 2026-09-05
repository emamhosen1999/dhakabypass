// tests/e2e/seo.spec.js
//
// The SEO surface is the one part of the site nobody looks at by eye: a broken
// hreflang cluster or a sitemap full of draft URLs renders perfectly and is
// only discovered weeks later in Search Console. These assertions run against
// the real server with the real database behind it.
//
// Absolute URLs come from SITE_URL, which lib/seo/site.js defaults to
// http://localhost:3000 when unset — the normal state in development.
//
// The origin is READ here rather than assumed. This file used to hardcode
// localhost and .env.example shipped a real production domain, so every fresh
// environment failed 41 of these tests for a configuration reason that had
// nothing to do with the SEO surface they exist to protect. Deriving it means
// the suite is equally correct against a developer's machine and against a
// staging deployment via PLAYWRIGHT_BASE_URL.
import { test, expect } from '@playwright/test';

const ORIGIN = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const LOCALES = ['en', 'bn', 'zh'];

// The old site, still live at unprefixed paths under app/(site)/. None of it
// belongs in the sitemap — see lib/seo/routes.js for what happens to it.
const LEGACY_PATHS = [
  '/project', '/project/overview', '/gallery', '/contact', '/stakeholders',
  '/economic-impact', '/latest-updates', '/routes-facilities', '/chinese-contribution',
];

test.describe('robots.txt', () => {
  test('is served, allows the site and points at the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('User-Agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  test('keeps crawlers out of the admin and the API', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /api/');
  });

  test('does not disallow the legacy tree', async ({ request }) => {
    // Deliberate. Those URLs must stay crawlable so the 301s planned for
    // cutover can be seen and followed; blocking them would strand their
    // ranking. They are excluded from the SITEMAP instead.
    const body = await (await request.get('/robots.txt')).text();
    for (const path of LEGACY_PATHS) {
      expect(body).not.toContain(`Disallow: ${path}`);
    }
  });
});

test.describe('sitemap.xml', () => {
  test('is served as XML', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('xml');
  });

  test('lists the home page once per locale', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const locale of LOCALES) {
      expect(xml).toContain(`<loc>${ORIGIN}/${locale}</loc>`);
    }
  });

  test('lists the travel routes for every locale', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const locale of LOCALES) {
      for (const page of ['toll', 'route', 'status', 'rules', 'facilities']) {
        expect(xml).toContain(`<loc>${ORIGIN}/${locale}/travel/${page}</loc>`);
      }
    }
  });

  test('contains no legacy route', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const path of LEGACY_PATHS) {
      expect(xml).not.toContain(`<loc>${ORIGIN}${path}</loc>`);
    }
  });

  test('every listed URL is under a locale prefix', async ({ request }) => {
    // Catches a legacy path, an admin path or a bare root sneaking in, without
    // having to enumerate them.
    const xml = await (await request.get('/sitemap.xml')).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(new URL(loc).pathname).toMatch(/^\/(en|bn|zh)(\/|$)/);
    }
  });

  test('omits the redirect-only /[locale]/travel', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const locale of LOCALES) {
      expect(xml).not.toContain(`<loc>${ORIGIN}/${locale}/travel</loc>`);
    }
  });

  test('never lists /[locale]/home', async ({ request }) => {
    // The home page is the `home` row rendered at /[locale]. /[locale]/home is
    // not a route, so listing it would put a 404 in the sitemap.
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const locale of LOCALES) {
      expect(xml).not.toContain(`${ORIGIN}/${locale}/home`);
    }
  });

  test('every listed URL actually resolves', async ({ request }) => {
    // The strongest available check that no draft or dead page is listed: a
    // draft page 404s, so if one leaked into the sitemap this fails.
    //
    // Fetched in batches rather than one at a time. The sitemap grew from 21
    // URLs to 75 as the institutional pages, the newsroom and the gallery
    // landed, and a serial walk of 75 pages against a dev server that compiles
    // each one on demand runs past any sane timeout — the test started failing
    // for its own length rather than for anything it was asserting. The
    // concurrency is bounded because the point is to check the pages, not to
    // load-test the dev server.
    const xml = await (await request.get('/sitemap.xml')).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length, 'the sitemap should not be empty').toBeGreaterThan(0);

    test.setTimeout(Math.max(30_000, locs.length * 2_000));

    const BATCH = 6;
    for (let i = 0; i < locs.length; i += BATCH) {
      const batch = locs.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(async (loc) => [loc, (await request.get(loc, { maxRedirects: 0 })).status()]),
      );
      for (const [loc, status] of results) {
        expect(status, `${loc} should return 200`).toBe(200);
      }
    }
  });

  test('dates the database-backed entries and not the code routes', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const homeBlock = xml.split('<url>').find((b) => b.includes(`<loc>${ORIGIN}/en</loc>`));
    expect(homeBlock).toContain('<lastmod>');
    const tollBlock = xml.split('<url>').find((b) => b.includes(`<loc>${ORIGIN}/en/travel/toll</loc>`));
    // No row exists to date this page by, and "now" would be a lie.
    expect(tollBlock).not.toContain('<lastmod>');
  });
});

test.describe('hreflang', () => {
  const PAGES = ['/', '/travel/toll', '/travel/route', '/travel/status', '/travel/rules', '/travel/facilities'];

  for (const path of PAGES) {
    for (const locale of LOCALES) {
      const url = path === '/' ? `/${locale}` : `/${locale}${path}`;

      test(`${url} declares all three locales and x-default`, async ({ page }) => {
        await page.goto(url);
        const hrefs = {};
        for (const link of await page.locator('link[rel="alternate"][hreflang]').all()) {
          hrefs[await link.getAttribute('hreflang')] = await link.getAttribute('href');
        }
        for (const l of LOCALES) {
          expect(hrefs[l]).toBe(`${ORIGIN}${path === '/' ? `/${l}` : `/${l}${path}`}`);
        }
        expect(hrefs['x-default']).toBe(`${ORIGIN}${path === '/' ? '/en' : `/en${path}`}`);
      });

      test(`${url} is canonical to itself`, async ({ page }) => {
        await page.goto(url);
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toBe(`${ORIGIN}${url}`);
      });
    }
  }
});
