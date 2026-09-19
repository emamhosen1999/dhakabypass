/**
 * Static assets were revalidating on every visit.
 *
 * Measured against the live site on 19 September 2026: `/_next/static/*` came
 * back `public, max-age=31536000, immutable`, and everything this app ships
 * under `public/` — the fonts, the corridor map, every photograph — came back
 * `public, max-age=0`. A reader who visits two pages fetches the same 35 kB
 * font twice, and Cloudflare cannot hold any of it.
 */
import { describe, it, expect } from 'vitest';
import config from '../../next.config.mjs';

const rules = async () => config.headers();
const valueFor = (rule, key) => rule.headers.find((h) => h.key.toLowerCase() === key)?.value || '';
const cacheRules = async () => (await rules()).filter((r) => valueFor(r, 'cache-control'));

describe('static asset caching', () => {
  it('keeps the fonts for a year, because a changed subset ships under a new name', async () => {
    const font = (await cacheRules()).find((r) => r.source.includes('fonts'));
    expect(font).toBeTruthy();
    expect(valueFor(font, 'cache-control')).toContain('max-age=31536000');
    expect(valueFor(font, 'cache-control')).toContain('immutable');
  });

  it('keeps the shipped pictures for a month', async () => {
    const asset = (await cacheRules()).find((r) => r.source.includes('webp'));
    expect(asset).toBeTruthy();
    const value = valueFor(asset, 'cache-control');
    expect(value).toContain('public');
    expect(value).toMatch(/max-age=(2592000|604800)/);
  });

  it('never caches an upload by its path, because a replaced file keeps it', async () => {
    // /uploads/[...path] is a route handler and sets its own headers. A month
    // here would outlive a media replacement.
    for (const rule of await cacheRules()) {
      expect(rule.source, rule.source).not.toMatch(/^\/uploads/);
    }
    const asset = (await cacheRules()).find((r) => r.source.includes('webp'));
    expect(asset.source).toContain('uploads');
    expect(asset.source).toContain('?!');
  });

  it('leaves the security headers alone', async () => {
    const all = await rules();
    const common = all.find((r) => r.headers.some((h) => h.key === 'Strict-Transport-Security'));
    expect(common).toBeTruthy();
    expect(all.some((r) => r.headers.some((h) => h.key === 'Content-Security-Policy'))).toBe(true);
  });

  it('caches no HTML: a page is a database read behind a CMS', async () => {
    for (const rule of await cacheRules()) {
      expect(rule.source).not.toBe('/:path*');
    }
  });
});
