/**
 * The hero image is the LCP element, and Lighthouse measured 26% of LCP as
 * *load delay* — the browser does not discover the picture until it has
 * parsed the CSS and the first scripts. fetchPriority on the <img> cannot fix
 * that, because the tag is in the body. A preload in the head can.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../lib/media/repo.js', () => ({
  getMediaByPath: (path) => mediaFor(path),
  mediaAlt: () => '',
}));

let mediaFor;

import HeroBlock from '../../components/blocks/HeroBlock.jsx';

const html = async (data) => renderToStaticMarkup(await HeroBlock({ data, locale: 'en' }));

beforeEach(() => {
  mediaFor = vi.fn(async (path) => ({ path, width: 686, height: 386, focal_x: 0.5, focal_y: 0.5, alt: {} }));
});

describe('the hero preloads its own picture', () => {
  it('asks for the image before the body reaches it', async () => {
    const out = await html({ headline: 'Dhaka Bypass Expressway', image: '/bg-hero.webp' });
    expect(out).toContain('rel="preload"');
    expect(out).toContain('href="/bg-hero.webp"');
    expect(out).toContain('as="image"');
  });

  it('marks it high priority, so it does not queue behind the fonts', async () => {
    const out = await html({ headline: 'x', image: '/bg-hero.webp' });
    const link = out.slice(out.indexOf('<link'), out.indexOf('>', out.indexOf('<link')));
    expect(link.toLowerCase()).toContain('fetchpriority="high"');
  });

  it('still renders the picture itself, eagerly', async () => {
    const out = await html({ headline: 'x', image: '/bg-hero.webp' });
    expect(out).toContain('loading="eager"');
    expect(out).toContain('src="/bg-hero.webp"');
  });

  it('preloads nothing when the page has no hero picture', async () => {
    const out = await html({ headline: 'A page with no picture' });
    expect(out).not.toContain('rel="preload"');
  });

  it('preloads nothing when the picture is named but missing from the library', async () => {
    // A path that resolves to no media row renders no <img>, so a preload
    // would be a request for a file the page never shows.
    mediaFor = vi.fn(async () => null);
    const out = await html({ headline: 'x', image: '/gone.webp' });
    expect(out).not.toContain('rel="preload"');
  });
});
