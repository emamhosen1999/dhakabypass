import { describe, it, expect, vi, beforeEach } from 'vitest';

const headerMap = new Map();
vi.mock('next/headers', () => ({ headers: vi.fn(async () => headerMap) }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url) => { const e = new Error(`REDIRECT ${url}`); e.digest = `NEXT_REDIRECT;replace;${url};307;`; throw e; }),
}));
vi.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: (e) => typeof e?.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT'),
}));

import { redirect } from 'next/navigation';
import { runAction, noticeUrl } from '../../lib/admin/run-action.js';
import { validationError, friendly } from '../../lib/errors.js';

/**
 * In a production build Next redacts the message of an error thrown from a
 * Server Action. runAction() is what turns a validation error into something
 * an operator can read: a redirect back to the form with the sentence in the
 * query string.
 */
describe('runAction', () => {
  beforeEach(() => { headerMap.clear(); vi.clearAllMocks(); headerMap.set('referer', 'http://localhost:3000/admin/users?x=1'); });

  it('returns the body result when nothing throws', async () => {
    expect(await runAction(async () => 42)).toBe(42);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('turns a validation error into a redirect back to the form with the sentence', async () => {
    await expect(runAction(async () => { throw validationError('Give the page a title'); }))
      .rejects.toThrow('REDIRECT /admin/users?x=1&notice=Give%20the%20page%20a%20title');
  });

  it("carries friendly()'s fallback the same way", async () => {
    await expect(runAction(async () => friendly(new Error('ER_DUP_ENTRY: x'), 'The page could not be saved.')))
      .rejects.toThrow('notice=The%20page%20could%20not%20be%20saved.');
  });

  it('never forwards an internal error message; it logs it and shows the generic sentence', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(runAction(async () => { throw new TypeError("Cannot read properties of null (reading 'id')"); }))
      .rejects.toThrow(/notice=The%20change%20was%20not%20made/);
    expect(spy).toHaveBeenCalled();
    const url = redirect.mock.calls[0][0];
    expect(url).not.toMatch(/Cannot%20read|null/);
  });

  it("lets Next's own redirect through untouched — an action that redirects on success has not failed", async () => {
    const own = new Error('REDIRECT /admin/pages-v2/9'); own.digest = 'NEXT_REDIRECT;push;/admin/pages-v2/9;307;';
    await expect(runAction(async () => { throw own; })).rejects.toBe(own);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('lands on the dashboard when the referer is missing or is not an admin page', async () => {
    headerMap.delete('referer');
    expect(await noticeUrl('x')).toBe('/admin?notice=x');
    headerMap.set('referer', 'https://evil.example/phish');
    expect(await noticeUrl('x')).toBe('/admin?notice=x');
    headerMap.set('referer', 'http://localhost:3000/en/travel/toll');
    expect(await noticeUrl('x')).toBe('/admin?notice=x');
  });

  it('replaces a stale notice rather than stacking them', async () => {
    headerMap.set('referer', 'http://localhost:3000/admin/media?notice=old&page=2');
    expect(await noticeUrl('new')).toBe('/admin/media?page=2&notice=new');
  });
});
