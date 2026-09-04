// tests/unit/content-cache-options.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pageTag, LIST_TAG } from '../../lib/revalidate.js';

/**
 * The page readers must carry a numeric `revalidate` as well as their tags.
 *
 * Tags alone cover the admin: every save calls revalidatePage(). They cover
 * nothing else, and the deploy model is build-locally-then-`git pull`, so an
 * entry warmed against a developer's database travels to production inside
 * .next/cache and — with no time-based floor — is served there forever,
 * because nothing in production ever revalidates that tag. The corridor
 * readers record that this already happened once.
 *
 * unstable_cache is mocked to capture the options each reader passes, since
 * they are otherwise invisible from outside Next's runtime.
 */
const calls = [];

vi.mock('next/cache', () => ({
  unstable_cache: (fn, keys, options) => {
    calls.push({ keys, options });
    return async (...args) => fn(...args);
  },
}));

vi.mock('../../lib/content/pages.js', () => ({
  getPageBySlug: async () => ({ id: 1, slug: 'home' }),
  getPageBlocks: async () => [],
}));

const FLOOR = 300;

let readers;
beforeEach(async () => {
  calls.length = 0;
  readers = await import('../../lib/content/cache.js');
});

describe('lib/content/cache.js reader options', () => {
  it('gives getPageBySlugCached a recovery floor as well as its tags', async () => {
    await readers.getPageBySlugCached('home');
    expect(calls).toHaveLength(1);
    expect(calls[0].options.revalidate).toBe(FLOOR);
    expect(calls[0].options.tags).toEqual([pageTag('home'), LIST_TAG]);
  });

  it('gives getPageBlocksCached a recovery floor as well as its tag', async () => {
    await readers.getPageBlocksCached(7, 'travel/toll');
    expect(calls).toHaveLength(1);
    expect(calls[0].options.revalidate).toBe(FLOOR);
    expect(calls[0].options.tags).toEqual([pageTag('travel/toll')]);
  });

  it('uses the same floor as the corridor readers, so the two halves of a page recover together', async () => {
    // 300 is not picked fresh here: lib/corridor/cache.js already uses it, and
    // two different floors would let a page's blocks and its corridor figures
    // recover at different moments and briefly disagree with each other.
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../lib/corridor/cache.js', import.meta.url), 'utf8'));
    expect(source).toContain('revalidate: 300');
  });
});
