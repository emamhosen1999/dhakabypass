import { describe, it, expect } from 'vitest';
import { groupSiteIndex } from '../../lib/blocks/sitemapList.js';

const P = (slug, title, href) => ({ slug, title, href });
const PAGES = [
  P('home', 'Home', '/en'),
  P('travel', 'Travel', '/en/travel'),
  P('travel/toll', 'Toll rates', '/en/travel/toll'),
  P('travel/route', 'Route', '/en/travel/route'),
  P('about', 'About', '/en/about'),
  P('about/governance', 'Governance', '/en/about/governance'),
  P('land-acquisition/notices', 'Notices', '/en/land-acquisition/notices'),
  P('contact', 'Contact', '/en/contact'),
];

describe('groupSiteIndex', () => {
  it('returns one flat list in the given order when not grouped', () => {
    const [only] = groupSiteIndex(PAGES, false);
    expect(only.heading).toBe('');
    expect(only.links.map((l) => l.title)).toEqual(
      ['Home', 'Travel', 'Toll rates', 'Route', 'About', 'Governance', 'Notices', 'Contact'],
    );
  });

  it('groups children under their parent page, which becomes the linked heading', () => {
    const groups = groupSiteIndex(PAGES, true);
    const travel = groups.find((g) => g.key === 'travel');
    expect(travel.heading).toBe('Travel');
    expect(travel.href).toBe('/en/travel');
    expect(travel.links.map((l) => l.title)).toEqual(['Toll rates', 'Route']);
  });

  it('keeps loose top-level pages in an unheaded first group, home first', () => {
    const [top] = groupSiteIndex(PAGES, true);
    expect(top.heading).toBe('');
    expect(top.links.map((l) => l.title)).toEqual(['Home', 'Contact']);
  });

  it('does not list a section parent twice', () => {
    const groups = groupSiteIndex(PAGES, true);
    const all = groups.flatMap((g) => g.links.map((l) => l.href));
    expect(all).not.toContain('/en/travel');
    expect(all).not.toContain('/en/about');
  });

  it('falls back to a humanised heading when no parent page exists', () => {
    const groups = groupSiteIndex(PAGES, true);
    const land = groups.find((g) => g.key === 'land-acquisition');
    expect(land.heading).toBe('Land acquisition');
    expect(land.href).toBe('');
  });

  it('drops rows with no title or no href and survives garbage', () => {
    expect(groupSiteIndex([{ slug: 'x', title: '', href: '/en/x' }, null, 5], true)).toEqual([]);
    expect(groupSiteIndex(undefined)).toEqual([]);
  });
});

describe('groupSiteIndex labelFor', () => {
  it('prefers the translated label for a parentless section and humanises otherwise', () => {
    const pages = [
      { slug: 'travel/toll', title: 'Toll', href: '/bn/travel/toll' },
      { slug: 'land-acquisition/x', title: 'X', href: '/bn/land-acquisition/x' },
    ];
    const groups = groupSiteIndex(pages, true, (seg) => (seg === 'travel' ? 'ভ্রমণ তথ্য' : ''));
    expect(groups.find((g) => g.key === 'travel').heading).toBe('ভ্রমণ তথ্য');
    expect(groups.find((g) => g.key === 'land-acquisition').heading).toBe('Land acquisition');
  });
});
