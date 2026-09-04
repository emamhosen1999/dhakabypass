import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  STATIC_LOCALISED_PATHS, REDIRECT_LOCALISED_PATHS, DYNAMIC_LOCALISED_PATHS,
  HOME_PATH, pathForSlug, localisedPath,
} from '../../lib/seo/routes.js';

const LOCALE_DIR = path.join(process.cwd(), 'app', '[locale]');

/**
 * Walks app/[locale]/ and returns every locale-less route path that a
 * `page.jsx` actually serves, excluding the two that are database-driven:
 * the locale root (the `home` row) and the `[...slug]` catch-all.
 */
function routesOnDisk(dir = LOCALE_DIR, prefix = '') {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      // Route groups contribute no path segment.
      const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
      found.push(...routesOnDisk(path.join(dir, entry.name), `${prefix}${segment}`));
    } else if (entry.name === 'page.jsx' || entry.name === 'page.js') {
      found.push(prefix === '' ? HOME_PATH : prefix);
    }
  }
  return found;
}

/** A path containing a dynamic segment: `/news/[slug]`, `/[...slug]`. */
const isDynamic = (p) => p.includes('[');

describe('STATIC_LOCALISED_PATHS', () => {
  it('lists every code route under app/[locale]/ except the database-driven ones', () => {
    // Drift guard. Adding app/[locale]/about/page.jsx without listing it here
    // means that page silently never appears in the sitemap, which is a bug
    // nobody notices for months. This test is the noticing.
    const onDisk = routesOnDisk()
      .filter((p) => p !== HOME_PATH && !isDynamic(p))
      .sort();
    const accounted = [...STATIC_LOCALISED_PATHS, ...REDIRECT_LOCALISED_PATHS].sort();
    expect(onDisk).toEqual(accounted);
  });

  it('excludes the redirect-only routes from the indexable list', () => {
    // /[locale]/travel is a bare redirect() to travel/status. A sitemap entry
    // for it is a "Page with redirect" error in Search Console.
    for (const p of REDIRECT_LOCALISED_PATHS) {
      expect(STATIC_LOCALISED_PATHS).not.toContain(p);
    }
    expect(REDIRECT_LOCALISED_PATHS).toContain('/travel');
  });

  it('accounts for the dynamic routes too', () => {
    // The walker used to skip any directory starting with `[`, which meant a
    // new dynamic route — `/news/[slug]` — was invisible to this guard AND
    // absent from the sitemap, with nothing to notice either. Dynamic routes
    // are now walked and matched against their own list, so adding one without
    // deciding how its URLs reach the sitemap fails here.
    //
    // `/[...slug]` is the catch-all that renders `pages` rows; the sitemap gets
    // those from the database, which is why it is listed as accounted for.
    const onDisk = routesOnDisk().filter(isDynamic).sort();
    const accounted = [...DYNAMIC_LOCALISED_PATHS, '/[...slug]'].sort();
    expect(onDisk).toEqual(accounted);
  });

  it('actually found routes to compare against', () => {
    // Guards the guard: a walker that silently returns [] would make the test
    // above pass against an empty list forever.
    expect(routesOnDisk().length).toBeGreaterThan(3);
  });

  it('holds locale-less paths only', () => {
    for (const p of STATIC_LOCALISED_PATHS) {
      expect(p.startsWith('/')).toBe(true);
      expect(p).not.toMatch(/^\/(en|bn|zh)(\/|$)/);
    }
  });

  it('lists only paths that become localised URLs, never legacy ones', () => {
    // This used to assert that no entry EQUALLED a legacy path. That held only
    // while the two trees had no name in common. `/contact` now exists in both:
    // `app/(site)/contact` is the legacy page and `app/[locale]/contact` is the
    // localised one, and they are different pages that happen to share a name.
    //
    // The invariant was never really about the string — it is that nothing in
    // this list can produce an UNPREFIXED legacy URL. localisedPath() is what
    // guarantees that, so that is what is tested.
    const legacy = ['/project', '/project/overview', '/gallery', '/contact', '/stakeholders',
      '/economic-impact', '/latest-updates', '/routes-facilities', '/chinese-contribution'];
    for (const p of STATIC_LOCALISED_PATHS) {
      for (const locale of ['en', 'bn', 'zh']) {
        expect(legacy).not.toContain(localisedPath(p, locale));
      }
    }
  });
});

describe('pathForSlug', () => {
  it('maps the home row to the locale root, not to /home', () => {
    // /[locale]/home is not a route. Emitting it would put a 404 in the sitemap.
    expect(pathForSlug('home')).toBe('/');
  });

  it('maps any other slug to its own path', () => {
    expect(pathForSlug('about')).toBe('/about');
    expect(pathForSlug('about/partners')).toBe('/about/partners');
  });

  it('tolerates stray slashes and whitespace on a hand-edited slug', () => {
    expect(pathForSlug('/about/')).toBe('/about');
    expect(pathForSlug('  about  ')).toBe('/about');
  });

  it('degrades an empty or missing slug to the root rather than emitting //', () => {
    expect(pathForSlug('')).toBe('/');
    expect(pathForSlug(null)).toBe('/');
    expect(pathForSlug(undefined)).toBe('/');
  });
});

describe('localisedPath', () => {
  it('prefixes the locale', () => {
    expect(localisedPath('/travel/toll', 'zh')).toBe('/zh/travel/toll');
  });

  it('renders the root as /<locale> with no trailing slash', () => {
    // /bn/ and /bn are different URLs to a crawler; the app serves /bn.
    expect(localisedPath('/', 'bn')).toBe('/bn');
  });
});
