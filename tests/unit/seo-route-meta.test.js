/**
 * `route_meta` — the per-route SEO layer, and the boundary it must not cross.
 *
 * The site is moving to a world where every ordinary public page is a block
 * document: a `pages` row rendered by `app/[locale]/[[...slug]]/page.jsx`, whose
 * title and description already live on `page_translations.seo_title` /
 * `seo_description`. A second table that ALSO carried a title for those URLs
 * would be a second source of truth for the same fact, and the operator would
 * have no way to tell which one the page was using.
 *
 * So the boundary these tests enforce is:
 *
 *   TEXT      — title, description, share image. The DOCUMENT wins, always.
 *               route_meta only FILLS a gap the document left empty. That is
 *               what makes it useful for a TEMPLATE route (`/news/[slug]`),
 *               which has no `pages` row at all and today falls straight
 *               through to a hardcoded `t()` string.
 *
 *   DIRECTIVES — robots and canonical. route_meta OVERRIDES, because
 *               `page_translations` has no column that can express either, and
 *               an operator who cannot mark a page noindex has to ask a
 *               developer for a deploy.
 *
 * Anything that blurs that line is the bug these tests exist to catch.
 */
import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_ROUTES, ROBOTS_DIRECTIVES,
  matchesTemplate, routeForPath, resolveRouteMeta, applyRouteMeta, normaliseRoute,
} from '../../lib/seo/route-meta.js';

/** A row as lib/seo/route-meta.js's repo shapes it. */
const row = (over = {}) => ({
  route: '/news/[slug]', locale: 'en',
  seoTitle: '', seoDescription: '', ogImage: '', robots: '', canonical: '',
  ...over,
});

describe('normaliseRoute', () => {
  it('keeps a route locale-less and leading-slashed', () => {
    expect(normaliseRoute('news')).toBe('/news');
    expect(normaliseRoute('/news/')).toBe('/news');
    expect(normaliseRoute('  /travel/toll  ')).toBe('/travel/toll');
  });

  it('rejects a route that carries a locale prefix', () => {
    // A row keyed `/en/news` would never match: every lookup here is done with
    // the locale-less path, and the locale is a separate column. Storing one
    // would produce a row that is silently never read — the worst failure mode
    // for an editor, because the screen shows their edit saved.
    expect(() => normaliseRoute('/en/news')).toThrow(/locale/i);
    expect(() => normaliseRoute('/bn/travel/toll')).toThrow(/locale/i);
  });

  it('maps an empty route to the home path rather than to an empty string', () => {
    expect(normaliseRoute('/')).toBe('/');
    expect(normaliseRoute('')).toBe('/');
  });
});

describe('matchesTemplate', () => {
  it('matches a dynamic segment against one real segment', () => {
    expect(matchesTemplate('/news/[slug]', '/news/vogra-reopens')).toBe(true);
  });

  it('does not match across a slash', () => {
    // `/news/a/b` is not an article URL. A greedy match here would apply the
    // newsroom's robots directive to a route nobody meant it for.
    expect(matchesTemplate('/news/[slug]', '/news/a/b')).toBe(false);
    expect(matchesTemplate('/news/[slug]', '/news')).toBe(false);
  });

  it('matches literal segments exactly', () => {
    expect(matchesTemplate('/news/[slug]', '/updates/vogra')).toBe(false);
  });
});

describe('routeForPath', () => {
  const rows = [row({ route: '/news' }), row({ route: '/news/[slug]' })];

  it('prefers an exact route over a template that would also match', () => {
    // `/news` must not be swallowed by `/news/[slug]` — and if a future
    // template were `/[slug]`, an exact `/about` row must still win.
    expect(routeForPath(rows, '/news')).toBe('/news');
  });

  it('falls back to a template route for a URL no exact row names', () => {
    expect(routeForPath(rows, '/news/vogra-reopens')).toBe('/news/[slug]');
  });

  it('returns null when nothing addresses the path', () => {
    expect(routeForPath(rows, '/travel/toll')).toBe(null);
    expect(routeForPath([], '/news/anything')).toBe(null);
  });
});

describe('resolveRouteMeta', () => {
  it('returns null for a path no row addresses, so the caller changes nothing', () => {
    expect(resolveRouteMeta([], '/news/x', 'en')).toBe(null);
  });

  it('returns null when the matching rows are entirely empty', () => {
    // An operator who opened the screen and saved without typing must not
    // produce a row that overrides a real title with an empty string.
    expect(resolveRouteMeta([row()], '/news/x', 'en')).toBe(null);
  });

  it('reads the requested locale', () => {
    const rows = [
      row({ locale: 'en', seoTitle: 'Newsroom' }),
      row({ locale: 'bn', seoTitle: 'সংবাদকক্ষ' }),
    ];
    expect(resolveRouteMeta(rows, '/news/x', 'bn').title).toBe('সংবাদকক্ষ');
  });

  it('falls back to English per FIELD, not per row', () => {
    // The Bangla row has a title and no description. Falling back row-wise
    // would drop the Bangla title along with the missing description; falling
    // back field-wise gives the reader the Bangla title AND a description.
    const rows = [
      row({ locale: 'en', seoTitle: 'Newsroom', seoDescription: 'Operational notices.' }),
      row({ locale: 'bn', seoTitle: 'সংবাদকক্ষ' }),
    ];
    const got = resolveRouteMeta(rows, '/news/x', 'bn');
    expect(got.title).toBe('সংবাদকক্ষ');
    expect(got.description).toBe('Operational notices.');
  });

  it('takes robots and canonical from the English row for every locale', () => {
    // A robots directive is a fact about the URL, not a translation. An
    // operator who marks a route noindex in the only language they read must
    // not leave the other two indexed.
    const rows = [
      row({ locale: 'en', robots: 'noindex', canonical: '/news' }),
      row({ locale: 'zh', seoTitle: '新闻' }),
    ];
    const got = resolveRouteMeta(rows, '/news/x', 'zh');
    expect(got.robots).toBe('noindex');
    expect(got.canonical).toBe('/news');
  });

  it('ignores a robots value that is not one of the allowed directives', () => {
    // The column is free text at the database level. A hand-edited row saying
    // `robots = 'index'` (or anything else) must not be emitted verbatim into
    // a meta tag.
    const got = resolveRouteMeta([row({ robots: 'index, follow, please' })], '/news/x', 'en');
    expect(got).toBe(null);
  });

  it('offers only directives that restrict, never one that asserts indexability', () => {
    // `index,follow` is the default. Emitting it as an explicit tag adds
    // nothing and invites an operator to believe they have made a page rank.
    expect(ROBOTS_DIRECTIVES).not.toContain('index');
    for (const d of ROBOTS_DIRECTIVES.filter(Boolean)) {
      expect(d).toMatch(/^(noindex|nofollow|noindex,nofollow)$/);
    }
  });

  it('names /news/[slug] as a template route', () => {
    expect(TEMPLATE_ROUTES).toContain('/news/[slug]');
  });
});

describe('applyRouteMeta — the boundary', () => {
  it('never overwrites a title the document supplied', () => {
    const base = { title: 'Vogra to Mirer Bazar reopens', description: 'The section is carrying traffic again.' };
    const meta = resolveRouteMeta(
      [row({ seoTitle: 'Newsroom', seoDescription: 'Operational notices.' })], '/news/x', 'en',
    );
    const got = applyRouteMeta(base, meta);
    expect(got.title).toBe('Vogra to Mirer Bazar reopens');
    expect(got.description).toBe('The section is carrying traffic again.');
  });

  it('fills a title the document left empty', () => {
    const meta = resolveRouteMeta([row({ seoTitle: 'Newsroom' })], '/news/x', 'en');
    expect(applyRouteMeta({ title: '' }, meta).title).toBe('Newsroom');
    expect(applyRouteMeta({}, meta).title).toBe('Newsroom');
  });

  it('overrides robots even when the document set one', () => {
    // Only route_meta can express this. `page_translations` has no column for
    // it, so there is nothing to defer to.
    const meta = resolveRouteMeta([row({ robots: 'noindex' })], '/news/x', 'en');
    const got = applyRouteMeta({ title: 'A page', robots: { index: true } }, meta);
    expect(got.robots).toEqual({ index: false, follow: true });
  });

  it('translates noindex,nofollow into both flags', () => {
    const meta = resolveRouteMeta([row({ robots: 'noindex,nofollow' })], '/news/x', 'en');
    expect(applyRouteMeta({}, meta).robots).toEqual({ index: false, follow: false });
  });

  it('overrides the canonical without disturbing the hreflang alternates', () => {
    // A canonical override is a deliberate "this URL is a duplicate of that
    // one" claim. The `languages` map is a different statement — about which
    // URLs exist — and must survive it.
    const base = {
      alternates: {
        canonical: 'https://dhakabypass.com/en/news/x',
        languages: { en: 'https://dhakabypass.com/en/news/x' },
      },
    };
    const meta = resolveRouteMeta([row({ canonical: 'https://dhakabypass.com/en/news' })], '/news/x', 'en');
    const got = applyRouteMeta(base, meta);
    expect(got.alternates.canonical).toBe('https://dhakabypass.com/en/news');
    expect(got.alternates.languages).toEqual(base.alternates.languages);
  });

  it('returns the base object unchanged when there is no meta', () => {
    const base = { title: 'A page' };
    expect(applyRouteMeta(base, null)).toEqual(base);
  });

  it('does not mutate the object it was given', () => {
    // generateMetadata results are handed around; a mutating helper would let
    // one route's directive leak into another's cached metadata.
    const base = { title: '', alternates: { canonical: 'https://x/en' } };
    const meta = resolveRouteMeta([row({ seoTitle: 'Newsroom', canonical: '/news' })], '/news/x', 'en');
    applyRouteMeta(base, meta);
    expect(base.title).toBe('');
    expect(base.alternates.canonical).toBe('https://x/en');
  });
});
