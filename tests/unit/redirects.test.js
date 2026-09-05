/**
 * The redirects table's matching rules.
 *
 * The failures that matter here are asymmetric. A redirect that does not fire
 * leaves a 404, which is visible and gets fixed. A redirect that fires WRONGLY
 * sends visitors and search engines somewhere unintended and, if it is
 * permanent, browsers cache it for a very long time — so these tests are mostly
 * about not matching things.
 */
import { describe, it, expect } from 'vitest';
import { normalisePath, resolveRedirect, REDIRECT_STATUSES } from '../../lib/redirects/repo.js';

const rows = [
  { source: '/economic-impact', destination: '/en/project', statusCode: 301 },
  { source: '/old-news/', destination: '/en/news', statusCode: 302 },
];

describe('normalisePath', () => {
  it('treats a trailing slash as the same path', () => {
    // The old site was a static export, so its URLs are indexed both ways —
    // four of the eight build-time redirects exist only to cover the variant.
    expect(normalisePath('/project')).toBe(normalisePath('/project/'));
  });

  it('adds a leading slash', () => {
    expect(normalisePath('project')).toBe('/project');
  });

  it('is case-insensitive', () => {
    expect(normalisePath('/Project')).toBe('/project');
  });

  it('drops the query string and fragment', () => {
    // /gallery?utm_source=x must still match a redirect written for /gallery.
    expect(normalisePath('/gallery?utm_source=x')).toBe('/gallery');
    expect(normalisePath('/gallery#top')).toBe('/gallery');
  });

  it('collapses repeated slashes', () => {
    expect(normalisePath('//project///overview')).toBe('/project/overview');
  });

  it('keeps the root as the root rather than emptying it', () => {
    expect(normalisePath('/')).toBe('/');
  });

  it('returns empty for nothing at all', () => {
    for (const v of [null, undefined, '', '   ']) expect(normalisePath(v)).toBe('');
  });
});

describe('resolveRedirect', () => {
  it('matches regardless of trailing slash or case', () => {
    for (const path of ['/economic-impact', '/economic-impact/', '/Economic-Impact']) {
      expect(resolveRedirect(rows, path).destination).toBe('/en/project');
    }
  });

  it('matches a stored source that itself has a trailing slash', () => {
    expect(resolveRedirect(rows, '/old-news').destination).toBe('/en/news');
  });

  it('carries the status through', () => {
    expect(resolveRedirect(rows, '/economic-impact').statusCode).toBe(301);
    expect(resolveRedirect(rows, '/old-news').statusCode).toBe(302);
  });

  it('does not match a path that merely starts the same', () => {
    // /economic-impact-2 is a different page. A prefix match here would
    // silently swallow every URL beneath a redirected one.
    expect(resolveRedirect(rows, '/economic-impact-2')).toBeNull();
    expect(resolveRedirect(rows, '/economic-impact/detail')).toBeNull();
  });

  it('returns null when nothing matches, so the caller can 404 normally', () => {
    expect(resolveRedirect(rows, '/nothing-here')).toBeNull();
  });

  it('survives an empty or missing table', () => {
    expect(resolveRedirect([], '/x')).toBeNull();
    expect(resolveRedirect(null, '/x')).toBeNull();
  });

  it('ignores an empty request path', () => {
    expect(resolveRedirect(rows, '')).toBeNull();
  });
});

describe('REDIRECT_STATUSES', () => {
  it('offers only the codes that mean "this URL moved"', () => {
    // 303 and 200 are not URL moves; allowing them would let an operator
    // configure something browsers and crawlers treat unpredictably.
    expect(REDIRECT_STATUSES).toEqual([301, 302, 307, 308]);
  });
});
