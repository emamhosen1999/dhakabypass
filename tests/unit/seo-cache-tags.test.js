/**
 * The SEO readers' cache options, and what they do when MySQL is not there.
 *
 * Two mechanisms bound staleness, not one — the same pair, and for the same
 * reason, as lib/content/cache.js and lib/corridor/cache.js.
 *
 * Tag invalidation is the fast path: an admin save fires the tag and the change
 * is live without a rebuild. `revalidate: 300` is the recovery floor for
 * everything that is NOT an admin save, and it exists because of the deploy
 * model: the site is built LOCALLY and shipped with `git pull`, so an entry
 * warmed against the developer's own database travels to production inside
 * .next/cache. With tags alone nothing in production would ever evict it.
 * lib/corridor/cache.js records that exact accident happening once already.
 *
 * The outage tests are the ones that matter most here. These readers feed the
 * ROOT layout's <title> and the sitemap; a throw in either is a 500 on every
 * page of the site, and a 500 on /sitemap.xml can get the sitemap dropped from
 * Search Console entirely.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = [];
vi.mock('next/cache', () => ({
  unstable_cache: (fn, keys, options) => {
    calls.push({ keys, options });
    return async (...args) => fn(...args);
  },
  revalidateTag: vi.fn(),
}));

vi.mock('../../lib/seo/route-meta.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, listRouteMeta: vi.fn() };
});
vi.mock('../../lib/seo/settings.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, getSeoSettings: vi.fn() };
});

import { revalidateTag } from 'next/cache';
import { listRouteMeta } from '../../lib/seo/route-meta.js';
import { getSeoSettings, SEO_DEFAULTS } from '../../lib/seo/settings.js';
import { ROUTE_META_TAG, SEO_TAG, revalidateRouteMeta, revalidateSeo } from '../../lib/revalidate.js';

const FLOOR = 300;

let readers;
beforeEach(async () => {
  calls.length = 0;
  vi.clearAllMocks();
  readers = await import('../../lib/seo/cache.js');
});

describe('cache tags', () => {
  it('names a tag family for route meta and for site-level SEO', () => {
    expect(ROUTE_META_TAG).toBe('route-meta');
    expect(SEO_TAG).toBe('seo');
  });

  it('revalidateRouteMeta fires only the route-meta tag', () => {
    revalidateRouteMeta();
    expect(revalidateTag).toHaveBeenCalledWith(ROUTE_META_TAG);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });

  it('revalidateSeo fires both, because a site-level value is read per route', () => {
    // The DEFAULT share image is site-level but is resolved inside every
    // route's metadata. Evicting only the site-level entry would leave every
    // route serving the old default until its own floor expired.
    revalidateSeo();
    expect(revalidateTag).toHaveBeenCalledWith(SEO_TAG);
    expect(revalidateTag).toHaveBeenCalledWith(ROUTE_META_TAG);
  });
});

describe('reader options', () => {
  it('gives listRouteMetaCached the route-meta tag and the recovery floor', async () => {
    listRouteMeta.mockResolvedValue([]);
    await readers.listRouteMetaCached();
    expect(calls).toHaveLength(1);
    expect(calls[0].options.tags).toEqual([ROUTE_META_TAG]);
    expect(calls[0].options.revalidate).toBe(FLOOR);
  });

  it('gives getSeoSettingsCached the seo tag and the recovery floor', async () => {
    getSeoSettings.mockResolvedValue(SEO_DEFAULTS);
    await readers.getSeoSettingsCached('en');
    expect(calls).toHaveLength(1);
    expect(calls[0].options.tags).toEqual([SEO_TAG]);
    expect(calls[0].options.revalidate).toBe(FLOOR);
  });

  it('keys the settings entry by locale, so /bn does not serve /en\'s title', async () => {
    getSeoSettings.mockResolvedValue(SEO_DEFAULTS);
    await readers.getSeoSettingsCached('bn');
    expect(calls[0].keys).toContain('bn');
  });
});

describe('a database outage', () => {
  it('routeMetaFor returns null rather than throwing', async () => {
    listRouteMeta.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(readers.routeMetaFor('/news/x', 'en')).resolves.toBe(null);
  });

  it('listNoindexRoutesCached returns an empty list rather than throwing', async () => {
    // The sitemap calls this. An exception here is a 500 on /sitemap.xml.
    listRouteMeta.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(readers.listNoindexRoutesCached()).resolves.toEqual([]);
  });

  it('siteSeoCached returns the code defaults rather than throwing', async () => {
    // The root layout's <title>. This is the "a DB outage must still emit a
    // valid title" requirement, at the exact call site that would break it.
    getSeoSettings.mockRejectedValue(new Error('ECONNREFUSED'));
    const seo = await readers.siteSeoCached('en');
    expect(seo.siteTitle).toBe(SEO_DEFAULTS.siteTitle);
    expect(seo.siteTitle).not.toBe('');
  });
});
