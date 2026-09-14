// tests/unit/pages-v2-actions.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('../../lib/content/pages.js', () => ({
  listPages: vi.fn(),
  createPage: vi.fn(),
  deletePageIfChildless: vi.fn(),
  getPageBySlug: vi.fn(),
}));
vi.mock('../../lib/revalidate.js', () => ({ revalidatePage: vi.fn(), revalidateRedirects: vi.fn(), revalidateSeo: vi.fn() }));
vi.mock('../../lib/content/page-settings.js', () => ({
  getPageForAdmin: vi.fn(), parsePageSettings: vi.fn(), savePageSettings: vi.fn(),
  isProtectedPage: (slug) => ['home', 'not-found'].includes(slug),
}));
vi.mock('../../lib/admin/history.js', () => ({ recordHistory: vi.fn(), logAudit: vi.fn() }));
vi.mock('../../lib/admin/record-actions.js', () => ({ deleteRecord: vi.fn() }));
vi.mock('../../lib/db.js', () => ({ query: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn((to) => { const e = new Error(`REDIRECT ${to}`); e.redirectTo = to; throw e; }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
// The production transport (redirect-with-notice) is tested on its own in
// run-action.test.js; here the bodies' thrown messages are the subject.
vi.mock('../../lib/admin/run-action.js', () => ({ runAction: (fn) => fn() }));

import { auth } from '../../auth.js';
import { listPages, createPage, deletePageIfChildless, getPageBySlug } from '../../lib/content/pages.js';
import { revalidatePage } from '../../lib/revalidate.js';
import { getPageForAdmin } from '../../lib/content/page-settings.js';
import { deleteRecord } from '../../lib/admin/record-actions.js';
import { revalidatePath } from 'next/cache';
import {
  listPagesAction,
  createPageAction,
  deletePageAction,
} from '../../app/admin/(dash)/pages-v2/actions.js';

// assertCan itself now lives in lib/auth/assert-can.js (not exported from
// this 'use server' module — see tests/unit/assert-can.test.js) and is
// exercised indirectly here through the actions that call it.

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

  it('creates the page as a draft, revalidates, then opens it in the editor', async () => {
    getPageBySlug.mockResolvedValue(null);
    createPage.mockResolvedValue(9);
    await expect(createPageAction(formData({ title: 'Travel Info', slug: 'Travel/Toll Rates' }))).rejects.toThrow('REDIRECT /admin/pages-v2/9');
    expect(createPage).toHaveBeenCalledWith({ slug: 'travel/toll-rates', title: 'Travel Info', actor: expect.any(String) });
    expect(revalidatePage).toHaveBeenCalledWith('travel/toll-rates');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2');
  });

  it('refuses a reserved address', async () => {
    getPageBySlug.mockResolvedValue(null);
    await expect(createPageAction(formData({ title: 'Home', slug: 'home' }))).rejects.toThrow('reserved');
    expect(createPage).not.toHaveBeenCalled();
  });
});

describe('deletePageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { isAdmin: true, role: 'admin' } });
    getPageForAdmin.mockResolvedValue({ id: 1, slug: 'travel', translations: {} });
  });

  it('is blocked by assertCan before touching data', async () => {
    auth.mockResolvedValue({ user: { isAdmin: false, role: 'admin' } });
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow('Sign in to continue');
    expect(deleteRecord).not.toHaveBeenCalled();
  });

  it('requires a page id', async () => {
    await expect(deletePageAction(formData({ id: '', slug: '' }))).rejects.toThrow('No page selected');
  });

  it.each(['home', 'not-found'])('never deletes the %s page', async (slug) => {
    getPageForAdmin.mockResolvedValue({ id: 1, slug, translations: {} });
    await expect(deletePageAction(formData({ id: '1', slug }))).rejects.toThrow('cannot be deleted');
    expect(deleteRecord).not.toHaveBeenCalled();
  });

  it('refuses a page with children from inside the trash transaction, naming the count', async () => {
    deleteRecord.mockImplementation(async (_type, _id, { remove }) => remove(async (sql) => (sql.startsWith('SELECT') ? [{ id: 2 }, { id: 3 }] : {})));
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow('This page has 2 sub-pages. Delete or move them first.');
    expect(revalidatePage).not.toHaveBeenCalled();
  });

  it('turns a database failure into a generic message, never the driver text', async () => {
    const otherErr = new Error('connection lost');
    otherErr.code = 'PROTOCOL_CONNECTION_LOST';
    deleteRecord.mockRejectedValue(otherErr);
    await expect(deletePageAction(formData({ id: '1', slug: 'travel' }))).rejects.toThrow('Could not delete the page. Please try again.');
  });

  it('moves a childless page to the trash and revalidates', async () => {
    deleteRecord.mockResolvedValue({ trashId: 4, label: 'Travel', summary: '' });
    await deletePageAction(formData({ id: '1', slug: 'travel' }));
    expect(deleteRecord).toHaveBeenCalledWith('page', 1, expect.objectContaining({ remove: expect.any(Function) }));
    expect(revalidatePage).toHaveBeenCalledWith('travel');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/pages-v2');
  });
});
