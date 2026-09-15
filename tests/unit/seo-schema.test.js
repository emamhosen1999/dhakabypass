import { describe, it, expect } from 'vitest';
import { webSiteJsonLd, breadcrumbJsonLd, faqJsonLd, organizationJsonLd } from '../../lib/seo/organization.js';

describe('structured data from records (W8C.8)', () => {
  it('describes the site with its search box, per language', () => {
    const w = webSiteJsonLd('bn', 'DBEDC');
    expect(w['@type']).toBe('WebSite');
    expect(w.inLanguage).toBe('bn');
    expect(w.potentialAction.target.urlTemplate).toMatch(/\/bn\/search\?q=\{search_term_string\}$/);
    expect(w.publisher['@id']).toMatch(/#organization$/);
  });

  it('lists breadcrumbs in order and needs at least two', () => {
    expect(breadcrumbJsonLd([{ name: 'Home', path: '/en' }])).toBeNull();
    const b = breadcrumbJsonLd([{ name: 'Home', path: '/en' }, { name: 'Travel', path: '/en/travel' }, { name: 'Toll rates', path: '/en/travel/toll' }]);
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(b.itemListElement[2].item).toMatch(/\/en\/travel\/toll$/);
  });

  it('turns an FAQ block into FAQPage with tags stripped', () => {
    const f = faqJsonLd([{ question: 'How much?', answer: '<p>It <b>depends</b>.</p>' }, { question: '', answer: 'x' }]);
    expect(f.mainEntity).toHaveLength(1);
    expect(f.mainEntity[0].acceptedAnswer.text).toBe('It depends .');
    expect(f.mainEntity[0].acceptedAnswer.text).not.toMatch(/</);
    expect(faqJsonLd([])).toBeNull();
  });

  it('adds contact points and an address to the organisation only when set', () => {
    const bare = organizationJsonLd({ name: 'DBEDC' });
    expect(bare.contactPoint).toBeUndefined();
    expect(bare.address).toBeUndefined();
    const full = organizationJsonLd({ name: 'DBEDC', address: 'Level 8, Dhaka', contactPoints: [{ '@type': 'ContactPoint', contactType: 'emergency', telephone: '999' }] });
    expect(full.contactPoint[0].telephone).toBe('999');
    expect(full.address.addressCountry).toBe('BD');
  });
});
