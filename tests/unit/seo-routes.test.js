import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  STATIC_LOCALISED_PATHS, REDIRECT_LOCALISED_PATHS, HOME_PATH, pathForSlug, localisedPath,
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
      // Dynamic segments are served from the database, not from the filesystem.
      if (entry.name.startsWith('[')) continue;
      // Route groups contribute no path segment.
      const segment = entry.name.startsWith('(') ? '' : `/${entry.name}`;
      found.push(...routesOnDisk(path.join(dir, entry.name), `${prefix}${segment}`));
    } else if (entry.name === 'page.jsx' || entry.name === 'page.js') {
      found.push(prefix === '' ? HOME_PATH : prefix);
    }
  }
  return found;
}

describe('STATIC_LOCALISED_PATHS', () => {
  it('lists every code route under app/[locale]/ except the database-driven ones', () => {
    // Drift guard. Adding app/[locale]/about/page.jsx without listing it here
    // means that page silently never appears in the sitemap, which is a bug
    // nobody notices for months. This test is the noticing.
    const onDisk = routesOnDisk().filter((p) => p !== HOME_PATH).sort();
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

  it('contains no legacy route', () => {
    // The old site's paths live under app/(site)/ and must never be listed.
    const legacy = ['/project', '/project/overview', '/gallery', '/contact', '/stakeholders',
      '/economic-impact', '/latest-updates', '/routes-facilities', '/chinese-contribution'];
    for (const p of legacy) expect(STATIC_LOCALISED_PATHS).not.toContain(p);
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
