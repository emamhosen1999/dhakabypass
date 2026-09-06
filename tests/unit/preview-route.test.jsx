// tests/unit/preview-route.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../auth.js', () => ({ auth: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((to) => { const e = new Error(`REDIRECT:${to}`); e.digest = 'redirect'; throw e; }),
  notFound: vi.fn(() => { throw new Error('NOT_FOUND'); }),
}));
vi.mock('../../lib/content/pages.js', () => ({
  listPages: vi.fn(),
  getPageBlocks: vi.fn(),
}));

import { auth } from '../../auth.js';
import { redirect, notFound } from 'next/navigation';
import { listPages, getPageBlocks } from '../../lib/content/pages.js';
import PreviewPage from '../../app/[locale]/preview/[id]/page.jsx';

const params = (locale, id) => Promise.resolve({ locale, id });

const DRAFT_BLOCK = {
  id: 1,
  type: 'rich-text',
  translations: [
    { locale: 'en', status: 'draft', data: { heading: 'Not published yet', body: '<p>secret draft</p>' } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  listPages.mockResolvedValue([{ id: 12, slug: 'about', status: 'draft', title: 'About' }]);
  getPageBlocks.mockResolvedValue([DRAFT_BLOCK]);
});

/**
 * The preview renders UNPUBLISHED content, so the gate is the whole security
 * story of this route. It mirrors app/admin/(dash)/layout.jsx: isAdmin or you
 * are sent to the admin sign-in.
 */
describe('draft preview — session gate', () => {
  it('redirects an anonymous request to the admin sign-in and reads no content', async () => {
    auth.mockResolvedValue(null);
    await expect(PreviewPage({ params: params('en', '12') })).rejects.toThrow('REDIRECT:/admin/login');
    expect(redirect).toHaveBeenCalledWith('/admin/login');
    expect(getPageBlocks).not.toHaveBeenCalled();
    expect(listPages).not.toHaveBeenCalled();
  });

  it('redirects a signed-in user who is not an admin', async () => {
    auth.mockResolvedValue({ user: { id: 4, email: 'someone@example.com', isAdmin: false } });
    await expect(PreviewPage({ params: params('en', '12') })).rejects.toThrow('REDIRECT:/admin/login');
    expect(getPageBlocks).not.toHaveBeenCalled();
  });

  it('checks the session BEFORE it looks at the locale or the id', async () => {
    auth.mockResolvedValue(null);
    await expect(PreviewPage({ params: params('not-a-locale', 'nonsense') })).rejects.toThrow('REDIRECT:/admin/login');
    expect(notFound).not.toHaveBeenCalled();
  });
});

describe('draft preview — what it renders', () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: { id: 1, email: 'admin@example.com', isAdmin: true, role: 'admin' } });
  });

  it('renders an unpublished draft block for an admin', async () => {
    const html = renderToStaticMarkup(await PreviewPage({ params: params('en', '12') }));
    expect(html).toContain('Not published yet');
    expect(html).toContain('<p>secret draft</p>');
  });

  it('previews a page whose own status is draft — the public route 404s that, this must not', async () => {
    const html = renderToStaticMarkup(await PreviewPage({ params: params('en', '12') }));
    expect(html).not.toBe('');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('renders the requested locale, not always English', async () => {
    getPageBlocks.mockResolvedValue([{
      id: 2,
      type: 'rich-text',
      translations: [
        { locale: 'en', status: 'published', data: { heading: 'English', body: '<p>en</p>' } },
        { locale: 'zh', status: 'draft', data: { heading: '中文草稿', body: '<p>zh</p>' } },
      ],
    }]);
    const html = renderToStaticMarkup(await PreviewPage({ params: params('zh', '12') }));
    expect(html).toContain('中文草稿');
  });

  it.each(['en', 'bn', 'zh'])('serves locale %s', async (locale) => {
    const html = renderToStaticMarkup(await PreviewPage({ params: params(locale, '12') }));
    expect(html).toContain('secret draft');
  });

  it('uses the UNCACHED readers, so a draft never enters the ISR cache', async () => {
    await PreviewPage({ params: params('en', '12') });
    expect(getPageBlocks).toHaveBeenCalledWith(12);
  });
});

describe('draft preview — bad input', () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: { id: 1, isAdmin: true, role: 'admin' } });
  });

  it.each([['fr'], ['admin'], ['']])('404s an unsupported locale %s', async (locale) => {
    await expect(PreviewPage({ params: params(locale, '12') })).rejects.toThrow('NOT_FOUND');
    expect(getPageBlocks).not.toHaveBeenCalled();
  });

  it.each([['abc'], ['0'], ['-3'], ['1.5'], ['']])('404s a page id of %s', async (id) => {
    await expect(PreviewPage({ params: params('en', id) })).rejects.toThrow('NOT_FOUND');
    expect(getPageBlocks).not.toHaveBeenCalled();
  });

  it('404s a page id that does not exist', async () => {
    await expect(PreviewPage({ params: params('en', '999') })).rejects.toThrow('NOT_FOUND');
    expect(getPageBlocks).not.toHaveBeenCalled();
  });
});
