// tests/unit/pages-v2-actions.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('../../lib/content/pages.js', () => ({
  listPages: vi.fn(),
  createPage: vi.fn(),
  deletePageIfChildless: vi.fn(),
  getPageBySlug: vi.fn(),
}));
vi.mock('../../lib/revalidate.js', () => ({ revalidatePage: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { auth } from '../../auth.js';
import { listPages, createPage, deletePageIfChildless, getPageBySlug } from '../../lib/content/pages.js';
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

function hasChildrenError(count) {
  const err = new Error(`Page has ${count} child page(s)`);
  err.code = 'HAS_CHILDREN';
  err.childCount = count;
  return err;
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

  it('gives usable guidance when the title normalises to an empty slug (non-Latin script)', async () => {
    await expect(createPageAction(formData({ title: 'ভ্রমণ তথ্য' }))).rejects.toThrow(
      'Could not build a web address from that title. Please type one in the Address field using English letters, numbers and hyphens.'
    );
    expect(createPage).not.toHaveBeenCalled();
  });

  it('rejects a duplicate slug with a clear message, not a database error', async () => {
    getPageBySlug.mockResolvedValue({ id: 5, slug: 'travel' });
    await expect(createPageAction(formData({ title: 'Travel' }))).rejects.toThrow('A page already lives at "travel"');
    expect(createPage).not.toHaveBeenCalled();
  });

  it('translates a duplicate-slug race (ER_DUP_ENTRY from the INSERT) into the same friendly message', async () => {
    getPageBySlug.mockResolvedValue(null); // pre-check passes...
    const dupErr = new Error("Duplicate entry 'travel' for key 'pages.slug'");
    dupErr.code = 'ER_DUP_ENTRY';
    dupErr.sqlMessage = "Duplicate entry 'travel' for key 'pages.slug'";
    createPage.mockRejectedValue(dupErr); // ...but another request won the INSERT race
    await expect(createPageAction(formData({ title: 'Travel' }))).rejects.toThrow('A page already lives at "travel"');
  });

  it('turns any other database error from createPage into a generic message, never the driver text', async () => {
    getPageBySlug.mockResolvedValue(null);
    const dbErr = new Error('Data too long for column \'slug\' at row 1');
    dbErr.code = 'ER_DATA_TOO_LONG';
    dbErr.sqlMessage = 'Data too long for column \'slug\' at row 1';
    dbErr.sql = "INSERT INTO pages (slug, parent_id, status) VALUES ('...', NULL, 'published')";
    createPage.mockRejectedValue(dbErr);
    await expect(createPageAction(formData({ title: 'Travel' }))).rejects.toThrow(
      'Could not create the page. Please try again.'
    );
    // and definitely not the raw driver message
    await expect(createPageAction(formData({ title: 'Travel' }))).rejects.not.toThrow(/Data too long|sqlMessage/);
  });

  it('turns a database error from the getPageBySlug pre-check into the same generic message, never the driver text', async () => {
    // The duplicate pre-check is its own round-trip, separate from
    // createPage — a connection drop or SQL error there must be sanitized
    // just like one from the INSERT itself.
    const dbErr = new Error('Connection lost: The server closed the connection');
    dbErr.code = 'PROTOCOL_CONNECTION_LOST';
    getPageBySlug.mockRejectedValue(dbErr);
    await expect(createPageAction(formData({ title: 'Travel' }))).rejects.toThrow(
      'Could not create the page. Please try again.'
    );
    await expect(createPageAction(formData({ title: 'Travel' }))).rejects.not.toThrow(/Connection lost|PROTOCOL_/);
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
    expect(deletePageIfChildless).not.toHaveBeenCalled();
  });

  it('requires a page id', async () => {
    await expect(deletePageAction(formData({ id: '', slug: '' }))).rejects.toThrow('No page selected');
  });

  it('refuses to delete a page with children, naming the count, translating the HAS_CHILDREN error', async () => {
    // pages.parent_id has no FK constraint — the DB will not cascade or null
    // it, so deleting a parent here would orphan its children.
    // deletePageIfChildless does the check-and-delete atomically; the action
    // just has to translate its error into the user-facing message.
    deletePageIfChildless.mockRejectedValue(hasChildrenError(2));
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow(
      'This page has 2 sub-pages. Delete or move them first.'
    );
    expect(deletePageIfChildless).toHaveBeenCalledWith(1);
    expect(revalidatePage).not.toHaveBeenCalled();
  });

  it('uses singular phrasing for exactly one child', async () => {
    deletePageIfChildless.mockRejectedValue(hasChildrenError(1));
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow(
      'This page has 1 sub-page. Delete or move them first.'
    );
  });

  it('turns any non-HAS_CHILDREN error from deletePageIfChildless into a generic message, never the driver text', async () => {
    const otherErr = new Error('connection lost');
    otherErr.code = 'PROTOCOL_CONNECTION_LOST';
    deletePageIfChildless.mockRejectedValue(otherErr);
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow(
      'Could not delete the page. Please try again.'
    );
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.not.toThrow(
      /connection lost|PROTOCOL_/
    );
  });

  it('deletes a childless page and revalidates', async () => {
    deletePageIfChildless.mockResolvedValue(undefined);
    await deletePageAction(formData({ id: '1', slug: 'travel' }));
    expect(deletePageIfChildless).toHaveBeenCalledWith(1);
    expect(revalidatePage).toHaveBeenCalledWith('travel');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2');
  });
});
