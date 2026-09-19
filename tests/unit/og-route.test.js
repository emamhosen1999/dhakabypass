// The generated share card, rendered for real (E3). The renderer is slow
// enough to matter, so this covers the contract — a PNG of the right size,
// with the page's own title and a cache header — rather than every case.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const pageBySlug = vi.fn();
const seoSettings = vi.fn();

vi.mock('../../lib/content/cache.js', () => ({ getPageBySlugCached: (slug) => pageBySlug(slug) }));
vi.mock('../../lib/seo/cache.js', () => ({ getSeoSettingsCached: (locale) => seoSettings(locale) }));
vi.mock('../../lib/log.js', () => ({
  log: vi.fn(), logError: vi.fn(), orLog: (_event, fallback) => () => fallback,
}));

const req = (qs) => new Request(`https://dhakabypass.com/api/public/og${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
  pageBySlug.mockResolvedValue({
    id: 4,
    translations: [{ locale: 'en', status: 'published', title: 'Toll rates', seo_title: null }],
  });
  seoSettings.mockResolvedValue({ siteTitle: 'Dhaka Bypass Expressway' });
});

const png = (buf) => buf.slice(1, 4).toString() === 'PNG';

describe('/api/public/og', () => {
  it('answers a PNG of the size every scraper asks for', async () => {
    const { GET } = await import('../../app/api/public/og/route.js');
    const res = await GET(req('?path=%2Fen%2Ftravel%2Ftoll&locale=en'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(png(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  }, 30000);

  it('reads the title from the page, never from the query string', async () => {
    const { GET } = await import('../../app/api/public/og/route.js');
    await GET(req('?path=%2Fen%2Ftravel%2Ftoll&locale=en&title=Free+money'));
    expect(pageBySlug).toHaveBeenCalledWith('travel/toll');
  }, 30000);

  it('asks for no page at all on the home path', async () => {
    const { GET } = await import('../../app/api/public/og/route.js');
    const res = await GET(req('?path=%2Fen&locale=en'));
    expect(pageBySlug).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  }, 30000);

  it('lets the edge keep the card for a week', async () => {
    const { GET } = await import('../../app/api/public/og/route.js');
    const res = await GET(req('?path=%2Fen&locale=en'));
    expect(res.headers.get('cache-control')).toContain('s-maxage=604800');
  }, 30000);

  it('still draws a card when the page cannot be read', async () => {
    pageBySlug.mockRejectedValue(new Error('ECONNREFUSED'));
    seoSettings.mockRejectedValue(new Error('ECONNREFUSED'));
    const { GET } = await import('../../app/api/public/og/route.js');
    const res = await GET(req('?path=%2Fen%2Ftravel%2Ftoll&locale=en'));
    expect(res.status).toBe(200);
    expect(png(Buffer.from(await res.arrayBuffer()))).toBe(true);
  }, 30000);

  it('falls back to English rather than trusting an unknown locale', async () => {
    const { GET } = await import('../../app/api/public/og/route.js');
    const res = await GET(req('?path=%2Fxx&locale=xx'));
    expect(res.status).toBe(200);
  }, 30000);
});
