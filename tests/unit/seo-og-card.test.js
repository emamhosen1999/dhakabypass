// The generated share card (E3): what it says, decided without a renderer.
import { describe, it, expect } from 'vitest';
import { cardText, slugFromPath } from '../../lib/seo/og-card.js';

describe('slugFromPath', () => {
  it('drops the locale segment', () => {
    expect(slugFromPath('/bn/travel/toll')).toBe('travel/toll');
    expect(slugFromPath('/en/disclosures')).toBe('disclosures');
  });

  it('treats a bare locale as the home page', () => {
    expect(slugFromPath('/en')).toBe('');
    expect(slugFromPath('/')).toBe('');
  });

  it('tolerates a trailing slash and a missing leading one', () => {
    expect(slugFromPath('zh/travel/status/')).toBe('travel/status');
  });
});

describe('cardText', () => {
  const site = 'Dhaka Bypass Expressway';

  it('puts the page title above the road name', () => {
    expect(cardText({ pageTitle: 'Toll rates', siteTitle: site })).toEqual({ title: 'Toll rates', brand: site });
  });

  it('falls back to the road name when the page has no title of its own', () => {
    expect(cardText({ pageTitle: '', siteTitle: site }).title).toBe(site);
  });

  it('does not print the road name twice', () => {
    // The home page is titled after the road.
    expect(cardText({ pageTitle: site, siteTitle: site })).toEqual({ title: site, brand: '' });
  });

  it('clamps a long title rather than letting it overflow the card', () => {
    const long = 'Notification of revised toll rates for all vehicle classes at every plaza on the corridor, effective immediately';
    const out = cardText({ pageTitle: long, siteTitle: site });
    expect(out.title.length).toBeLessThanOrEqual(90);
    expect(out.title.endsWith('…')).toBe(true);
  });

  it('cuts at a word boundary in English', () => {
    const long = 'a'.repeat(40) + ' ' + 'b'.repeat(60);
    expect(cardText({ pageTitle: long, siteTitle: site }).title.includes('bbbb')).toBe(false);
  });

  it('still says something when everything is blank', () => {
    expect(cardText({ pageTitle: '', siteTitle: '' }).title).toBe('Dhaka Bypass Expressway');
  });

  it('collapses the whitespace a CMS title can carry', () => {
    expect(cardText({ pageTitle: '  Toll   rates \n', siteTitle: site }).title).toBe('Toll rates');
  });
});
