import { describe, it, expect } from 'vitest';
import { searchDocs, blockText, plainText, terms } from '../../lib/search/index.js';

const DOCS = [
  { href: '/en/travel/toll', title: 'Toll rates', text: 'Toll rates for the section open to traffic, and the fare between any two toll plazas.' },
  { href: '/en/travel/rules', title: 'Rules of the road', text: 'Speed limits: cars 80 km/h. Motorcycles are not permitted on the toll carriageways.' },
  { href: '/bn/travel/toll', title: 'টোল হার', text: 'যান চলাচলের জন্য খোলা অংশের টোল হার' },
];

describe('site search', () => {
  it('ranks a title match above a body match and needs every word', () => {
    expect(searchDocs(DOCS, 'toll').map((r) => r.href)).toEqual(['/en/travel/toll', '/en/travel/rules']);
    expect(searchDocs(DOCS, 'toll motorcycles').map((r) => r.href)).toEqual(['/en/travel/rules']);
    expect(searchDocs(DOCS, 'nothing-here')).toEqual([]);
    expect(searchDocs(DOCS, '  ')).toEqual([]);
  });

  it('finds Bangla text and returns an excerpt around the match', () => {
    const [hit] = searchDocs(DOCS, 'টোল');
    expect(hit.href).toBe('/bn/travel/toll');
    expect(searchDocs(DOCS, 'motorcycles')[0].excerpt).toMatch(/Motorcycles/);
  });

  it('reads words from block data but not addresses or settings', () => {
    const text = blockText({ heading: 'Where to join', body: '<p>At <strong>Vogra</strong> &amp; Kanchan</p>', linkHref: 'travel/route', image: '/x.webp', items: [{ title: 'Exit' }] });
    expect(text).toBe('Where to join At Vogra & Kanchan Exit');
    expect(plainText('a&nbsp;b &#8211; c')).toBe('a b – c');
    expect(terms('The toll, TOLL and a')).toEqual(['the', 'toll', 'and']);
  });
});
