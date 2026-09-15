import { describe, it, expect } from 'vitest';
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
    expect(m.openGraph.images[0].url).toMatch(/\/bg-hero\.webp$/);
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
