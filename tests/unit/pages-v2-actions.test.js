// tests/unit/pages-v2-actions.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('../../lib/content/pages.js', () => ({
  listPages: vi.fn(),
  createPage: vi.fn(),
  deletePage: vi.fn(),
  getPageBySlug: vi.fn(),
}));
vi.mock('../../lib/revalidate.js', () => ({ revalidatePage: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '../../auth.js';
import { listPages, createPage, deletePage, getPageBySlug } from '../../lib/content/pages.js';
import { revalidatePage } from '../../lib/revalidate.js';
import { revalidatePath } from 'next/cache';
import {
  assertCan,
  listPagesAction,
  createPageAction,
  deletePageAction,
} from '../../app/admin/(dash)/pages-v2/actions.js';

function formData(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe('assertCan — the authorization chokepoint', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when there is no session', async () => {
    auth.mockResolvedValue(null);
    await expect(assertCan('manage_pages')).rejects.toThrow('Sign in to continue');
  });

  it('throws when isAdmin is false, even with a role that would permit the action', async () => {
    // Stale JWT scenario: role still says admin, but ADMIN_EMAILS no longer
    // includes this user — isAdmin must be re-derived per request and checked
    // first, or a revoked admin keeps access on an unexpired token.
    auth.mockResolvedValue({ user: { isAdmin: false, role: 'admin' } });
    await expect(assertCan('manage_pages')).rejects.toThrow('Sign in to continue');
  });

  it('throws when isAdmin is true but the role lacks the permission', async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'translator' } });
    await expect(assertCan('manage_pages')).rejects.toThrow('Your role cannot manage pages');
  });

  it('succeeds and returns the session when both checks pass', async () => {
    const session = { user: { isAdmin: true, role: 'editor' } };
    auth.mockResolvedValue(session);
    await expect(assertCan('manage_pages')).resolves.toBe(session);
  });
});

describe('listPagesAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires manage_pages before reading', async () => {
    auth.mockResolvedValue(null);
    await expect(listPagesAction()).rejects.toThrow('Sign in to continue');
    expect(listPages).not.toHaveBeenCalled();
  });

  it('returns the page list once authorized', async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'admin' } });
    listPages.mockResolvedValue([{ id: 1, slug: 'home' }]);
    await expect(listPagesAction()).resolves.toEqual([{ id: 1, slug: 'home' }]);
  });
});

describe('createPageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'admin' } });
  });

  it('is blocked by assertCan before any read or write happens', async () => {
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'translator' } });
    await expect(createPageAction(formData({ title: 'Travel' }))).rejects.toThrow('Your role cannot manage pages');
    expect(getPageBySlug).not.toHaveBeenCalled();
    expect(createPage).not.toHaveBeenCalled();
  });

  it('rejects a blank title', async () => {
    await expect(createPageAction(formData({ title: '' }))).rejects.toThrow('Give the page a title');
  });

  it('rejects a duplicate slug with a clear message, not a database error', async () => {
    getPageBySlug.mockResolvedValue({ id: 5, slug: 'travel' });
    await expect(createPageAction(formData({ title: 'Travel' }))).rejects.toThrow('A page already lives at "travel"');
    expect(createPage).not.toHaveBeenCalled();
  });

  it('creates the page, then revalidates the page and the admin list', async () => {
    getPageBySlug.mockResolvedValue(null);
    createPage.mockResolvedValue(9);
    await createPageAction(formData({ title: 'Travel Info', slug: 'Travel/Toll Rates' }));
    expect(createPage).toHaveBeenCalledWith({ slug: 'travel/toll-rates', title: 'Travel Info' });
    expect(revalidatePage).toHaveBeenCalledWith('travel/toll-rates');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2');
  });
});

describe('deletePageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'admin' } });
  });

  it('is blocked by assertCan before touching data', async () => {
    auth.mockResolvedValue({ user: { isAdmin: false, role: 'admin' } });
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow('Sign in to continue');
    expect(listPages).not.toHaveBeenCalled();
    expect(deletePage).not.toHaveBeenCalled();
  });

  it('requires a page id', async () => {
    await expect(deletePageAction(formData({ id: '', slug: '' }))).rejects.toThrow('No page selected');
  });

  it('refuses to delete a page with children, naming the count, and does not touch the row', async () => {
    // pages.parent_id has no FK constraint — the DB will not cascade or null
    // it, so deleting a parent here would orphan its children.
    listPages.mockResolvedValue([
      { id: 1, slug: 'travel', parent_id: null },
      { id: 2, slug: 'travel/toll', parent_id: 1 },
      { id: 3, slug: 'travel/routes', parent_id: 1 },
    ]);
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow(
      'This page has 2 sub-pages. Delete or move them first.'
    );
    expect(deletePage).not.toHaveBeenCalled();
    expect(revalidatePage).not.toHaveBeenCalled();
  });

  it('uses singular phrasing for exactly one child', async () => {
    listPages.mockResolvedValue([
      { id: 1, slug: 'travel', parent_id: null },
      { id: 2, slug: 'travel/toll', parent_id: 1 },
    ]);
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow(
      'This page has 1 sub-page. Delete or move them first.'
    );
    expect(deletePage).not.toHaveBeenCalled();
  });

  it('deletes a childless page and revalidates', async () => {
    listPages.mockResolvedValue([{ id: 1, slug: 'travel', parent_id: null }]);
    await deletePageAction(formData({ id: '1', slug: 'travel' }));
    expect(deletePage).toHaveBeenCalledWith(1);
    expect(revalidatePage).toHaveBeenCalledWith('travel');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2');
  });
});
