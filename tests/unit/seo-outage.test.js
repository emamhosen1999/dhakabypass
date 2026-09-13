/**
 * THE DATABASE IS GONE. What does the site still say about itself?
 *
 * The other SEO test files check the readers in lib/seo/ one at a time, with
 * `query` mocked at the module boundary. This one checks the WIRING: it imports
 * a real root layout (`app/[...unmatched]/layout.jsx`, the same metadata every root layout uses), `app/robots.js` and `app/sitemap.js` — the three
 * files whose output reaches a crawler — and runs them against a connection
 * that refuses.
 *
 * The distinction is the point. Every reader in lib/seo/ degrading correctly
 * proves nothing on its own if a route forgot to call one of them, or called it
 * outside a try, or spread the result in a way that turns a fallback into
 * `undefined`. W1.24 replaced three module-level literals with three database
 * reads, and these are the three places where that swap could have turned a
 * missing row into a 500 on every URL on the hostname, or into
 * `<title></title>` — a search result nobody can click.
 *
 * All three assertions are about NOT losing something the site had before the
 * database was involved at all.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// A pool that refuses. `query` rejecting is what a real outage looks like to
// every reader in this project: an unreachable host, exhausted connections,
// or credentials the server has stopped accepting.
vi.mock('../../lib/db.js', () => ({
  query: vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))),
  dbEnabled: vi.fn(() => true),
  getPool: vi.fn(() => null),
  withTransaction: vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))),
}));

// `unstable_cache` is a pass-through here: this file is about what happens on a
// MISS, which is the state a cold server is in when the database is down.
vi.mock('next/cache', () => ({
  unstable_cache: (fn) => async (...args) => fn(...args),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: async () => new Map([['host', 'dhakabypass.com']]),
}));

import { query } from '../../lib/db.js';
import { SEO_DEFAULTS } from '../../lib/seo/settings.js';
import { loadOrganization } from '../../lib/seo/identity.js';
import { ORG_NAME } from '../../lib/seo/organization.js';

const original = process.env.SITE_URL;
beforeEach(() => {
  vi.clearAllMocks();
  process.env.SITE_URL = 'https://dhakabypass.com';
});
afterEach(() => {
  if (original === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = original;
});

describe('the root layout with no database', () => {
  it('still emits the title and description that used to be literals', async () => {
    // app/layout.jsx wraps the localised site, the legacy tree AND the admin.
    // A throw here is a 500 on every page on the hostname.
    const { generateMetadata } = await import('../../app/[...unmatched]/layout.jsx');
    const meta = await generateMetadata();

    expect(meta.title).toBe(SEO_DEFAULTS.siteTitle);
    expect(meta.description).toBe(SEO_DEFAULTS.siteDescription);
    // The assertion that actually matters. An empty string is a valid string
    // and would sail past a toBeDefined().
    expect(meta.title).not.toBe('');
    expect(String(meta.title).trim().length).toBeGreaterThan(0);

    // Guards the guard. Without this the assertions above would pass just as
    // happily against the old app/layout.jsx, which read nothing and could not
    // fail — so they would prove the fallback works while silently also
    // accepting a version that never attempts the read at all. This is what
    // makes it a test of the degradation rather than of the constant.
    expect(query).toHaveBeenCalled();
  });

  it('still points at a favicon', async () => {
    // The icon path was hardcoded before W1.24, so it could not go missing.
    // Now it comes from a row, and this is the guard against the read that
    // replaced it returning nothing.
    const { generateMetadata } = await import('../../app/[...unmatched]/layout.jsx');
    const meta = await generateMetadata();
    expect(meta.icons.icon[0].url).toBe('/favicon.ico');
    expect(meta.icons.icon[0].type).toBe('image/x-icon');
  });

  it('claims no share image it cannot substantiate', async () => {
    // Degrading to "no og:image" is correct. Degrading to a guessed one would
    // publish a picture nobody chose onto every share card.
    const { generateMetadata } = await import('../../app/[...unmatched]/layout.jsx');
    expect((await generateMetadata()).openGraph).toBeUndefined();
  });
});

describe('robots.txt with no database', () => {
  it('serves the built-in rules rather than an empty file', async () => {
    // An empty robots.txt means "crawl everything". On the public host that is
    // merely wrong; the admin rule below is the one that must not be lost.
    const robots = (await import('../../app/robots.js')).default;
    const r = await robots();
    expect(r.rules[0].allow).toBe('/');
    expect(r.rules[0].disallow).toEqual(expect.arrayContaining(['/admin', '/api/']));
    expect(r.sitemap).toBe('https://dhakabypass.com/sitemap.xml');
  });

  it('does not fall into block_all because a read failed', async () => {
    // The failure direction matters. `robotsMode` is unreadable here, and
    // defaulting an unreadable value to "block everything" would delist the
    // entire site the first time MySQL hiccupped.
    const robots = (await import('../../app/robots.js')).default;
    const r = await robots();
    expect(r.rules).not.toEqual([{ userAgent: '*', disallow: '/' }]);
  });
});

describe('sitemap.xml with no database', () => {
  it('still answers, and still contains the front door', async () => {
    // A 500 on this route can get the sitemap dropped from Search Console
    // entirely, which outlasts the outage that caused it by weeks.
    const sitemap = (await import('../../app/sitemap.js')).default;
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(entries.length).toBeGreaterThan(0);
    expect(urls).toContain('https://dhakabypass.com/en');
    expect(urls).toContain('https://dhakabypass.com/bn/travel/toll');
  });

  it('hides nothing, because it cannot read what the operator hid', async () => {
    // listNoindexRoutesCached returns [] on failure. Leaving a hidden URL
    // listed is a Search Console warning; the alternative — treating an
    // unreadable list as "hide everything" — is an empty sitemap.
    const sitemap = (await import('../../app/sitemap.js')).default;
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain('https://dhakabypass.com/en/gallery');
  });
});

describe('the organisation block with no database', () => {
  it('degrades to the code constants and states no dimensions it did not measure', async () => {
    // Rendered by app/[locale]/layout.jsx on every localised page. The logo
    // dimensions come from the `media` row first and the file second, so this
    // also proves the file probe still answers when the row cannot.
    const o = await loadOrganization();
    expect(o['@type']).toBe('Organization');
    expect(o.name).toBe(ORG_NAME);
    expect(o.logo.url).toBe('https://dhakabypass.com/logo.webp');
    // public/logo.webp is real and measurable, so the fallback chain reaches
    // step 2 rather than giving up.
    expect(o.logo.width).toBe(215);
    expect(o.logo.height).toBe(204);
  });
});
