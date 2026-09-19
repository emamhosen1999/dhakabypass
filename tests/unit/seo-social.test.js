import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { withSocialCard, firstProse, firstImage } from '../../lib/seo/social.js';

const block = (type, data, locale = 'en') => ({ type, translations: [{ locale, status: 'published', data }] });

describe('a share card on every page', () => {
  it('falls back to the first prose and the corridor aerial when the page has neither', () => {
    const blocks = [
      block('page-header', { heading: 'Toll rates', lede: 'Short' }),
      block('rich-text', { body: '<p>Toll rates on the expressway are fixed by government notification, not by DBEDC, and every figure is cited.</p>' }),
    ];
    const m = withSocialCard({ title: 'Toll rates' }, { blocks, locale: 'en', path: '/en/travel/toll' });
    expect(m.description).toMatch(/^Toll rates on the expressway/);
    // Was the one 686x386 photograph on every URL; the page now gets a card
    // of its own, drawn from its title (E3).
    expect(m.openGraph.images[0].url).toContain('/api/public/og?path=');
    expect(m.openGraph.url).toMatch(/\/en\/travel\/toll$/);
    expect(m.openGraph.locale).toBe('en_GB');
    expect(m.twitter.card).toBe('summary_large_image');
  });

  it('prefers the page sharing image, then the hero picture, then the site default', () => {
    const blocks = [block('hero', { image: '/photo/20.webp', headline: 'x' })];
    expect(withSocialCard({}, { page: { ogImage: '/uploads/card.jpg' }, blocks }).openGraph.images[0].url).toMatch(/\/uploads\/card\.jpg$/);
    expect(withSocialCard({}, { blocks }).openGraph.images[0].url).toMatch(/\/photo\/20\.webp$/);
    expect(withSocialCard({}, { site: { ogImage: '/brand/share.png' } }).openGraph.images[0].url).toMatch(/\/brand\/share\.png$/);
  });

  it('keeps an explicit description and does not invent one from a heading alone', () => {
    const m = withSocialCard({ description: 'Given' }, { blocks: [block('page-header', { heading: 'Only a heading' })] });
    expect(m.description).toBe('Given');
    expect(firstProse([block('page-header', { heading: 'Only a heading' })], 'en')).toBe('');
    expect(firstImage([block('rich-text', { body: 'no image' })], 'en')).toBe('');
  });

  it('cuts a long description at a word boundary near 155 characters', () => {
    const long = 'word '.repeat(60);
    const d = firstProse([block('rich-text', { body: `<p>${long}</p>` })], 'en');
    expect(d.length).toBeLessThanOrEqual(155);
    expect(d.endsWith('…')).toBe(true);
  });
});

describe('the generated share card (E3)', () => {
  const env = process.env.SITE_URL;
  beforeEach(() => { process.env.SITE_URL = 'https://dhakabypass.com'; });
  afterEach(() => {
    if (env === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = env;
  });

  it('draws the page its own card when it has no picture of its own', () => {
    // The old fallback was one 686x386 photograph on all 189 URLs, under the
    // 1200x630 every scraper asks for.
    const m = withSocialCard({ title: 'Toll rates' }, { locale: 'bn', path: '/bn/travel/toll' });
    expect(m.openGraph.images[0].url).toBe('https://dhakabypass.com/api/public/og?path=%2Fbn%2Ftravel%2Ftoll&locale=bn');
  });

  it('states the size of the card it drew', () => {
    const m = withSocialCard({ title: 'Toll rates' }, { locale: 'en', path: '/en/travel/toll' });
    expect(m.openGraph.images[0].width).toBe(1200);
    expect(m.openGraph.images[0].height).toBe(630);
  });

  it('claims no dimensions for a picture it did not draw', () => {
    // We know nothing about an operator's upload; stating 1200x630 for a
    // 686x386 photograph is how a card ends up letterboxed or cropped.
    const m = withSocialCard({ title: 'X' }, { page: { ogImage: '/uploads/aerial.webp' }, locale: 'en', path: '/en' });
    expect(m.openGraph.images[0].url).toMatch(/\/uploads\/aerial\.webp$/);
    expect(m.openGraph.images[0].width).toBeUndefined();
  });

  it('names the other two languages as alternates', () => {
    const m = withSocialCard({ title: 'X' }, { locale: 'bn', path: '/bn' });
    expect(m.openGraph.locale).toBe('bn_BD');
    expect(m.openGraph.alternateLocale.sort()).toEqual(['en_GB', 'zh_CN']);
  });

  it('keeps og:title a string when the page title is marked absolute', () => {
    // brandedTitle returns { absolute } for a page that already carries the
    // road name. Passed through unchecked it renders as [object Object].
    const m = withSocialCard({ title: { absolute: 'Dhaka Bypass Expressway' } }, { locale: 'en', path: '/en' });
    expect(m.openGraph.title).toBe('Dhaka Bypass Expressway');
    expect(m.twitter.title).toBe('Dhaka Bypass Expressway');
  });
});
