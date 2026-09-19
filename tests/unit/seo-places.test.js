/**
 * Place markup for the toll plazas (E4).
 *
 * The master plan recorded this as shipped under W8C.8. It was not: the only
 * types emitted were Organization, WebSite, SearchAction, BreadcrumbList,
 * FAQPage, NewsArticle and WebPage. The coordinates have been in the
 * `interchanges` table since the first schema.
 *
 * The rule throughout: a plaza is published only when it is open and only when
 * it has a coordinate. A planned plaza is not a place a driver can stop at,
 * and a Place with no geo is a claim with nothing in it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { placesJsonLd } from '../../lib/seo/organization.js';

const plaza = (over = {}) => ({
  id: 3, kind: 'toll_plaza', status: 'open', chainage_m: 21000,
  names: { en: 'Vogra Toll Plaza', bn: 'ভোগড়া টোল প্লাজা', zh: '沃格拉收费站' },
  lat: 23.9987, lng: 90.3812, ...over,
});

const original = process.env.SITE_URL;
beforeEach(() => { process.env.SITE_URL = 'https://dhakabypass.com'; });
afterEach(() => {
  if (original === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = original;
});

describe('placesJsonLd', () => {
  it('describes an open plaza with its coordinates', () => {
    const list = placesJsonLd([plaza()], 'en');
    expect(list['@type']).toBe('ItemList');
    const item = list.itemListElement[0].item;
    expect(item['@type']).toBe('Place');
    expect(item.name).toBe('Vogra Toll Plaza');
    expect(item.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 23.9987, longitude: 90.3812 });
  });

  it('names the plaza in the reader language', () => {
    expect(placesJsonLd([plaza()], 'bn').itemListElement[0].item.name).toBe('ভোগড়া টোল প্লাজা');
    expect(placesJsonLd([plaza()], 'zh').itemListElement[0].item.name).toBe('沃格拉收费站');
  });

  it('gives each plaza a stable id so the same node is not re-declared', () => {
    const item = placesJsonLd([plaza()], 'en').itemListElement[0].item;
    expect(item['@id']).toBe('https://dhakabypass.com/#plaza-3');
  });

  it('says who operates it, by reference rather than by repeating the company', () => {
    const item = placesJsonLd([plaza()], 'en').itemListElement[0].item;
    expect(item.containedInPlace).toBeUndefined();
    expect(item.additionalProperty).toBeUndefined();
    expect(item.isAccessibleForFree).toBe(false);
  });

  it('publishes nothing for a plaza that is not open yet', () => {
    expect(placesJsonLd([plaza({ status: 'planned' })], 'en')).toBeNull();
    expect(placesJsonLd([plaza({ status: 'construction' })], 'en')).toBeNull();
  });

  it('publishes nothing for a plaza with no coordinate', () => {
    expect(placesJsonLd([plaza({ lat: null, lng: null })], 'en')).toBeNull();
  });

  it('ignores everything that is not a toll plaza', () => {
    expect(placesJsonLd([plaza({ kind: 'interchange' })], 'en')).toBeNull();
    expect(placesJsonLd([plaza({ kind: 'bridge' })], 'en')).toBeNull();
  });

  it('publishes nothing at all rather than an empty list', () => {
    expect(placesJsonLd([], 'en')).toBeNull();
    expect(placesJsonLd(null, 'en')).toBeNull();
  });

  it('numbers the list in the order the plazas appear on the road', () => {
    const list = placesJsonLd([
      plaza({ id: 9, chainage_m: 40000, names: { en: 'Second' } }),
      plaza({ id: 3, chainage_m: 21000, names: { en: 'First' } }),
    ], 'en');
    expect(list.itemListElement.map((e) => e.position)).toEqual([1, 2]);
    expect(list.itemListElement.map((e) => e.item.name)).toEqual(['First', 'Second']);
  });

  it('skips a plaza whose name is missing rather than publishing an unnamed place', () => {
    expect(placesJsonLd([plaza({ names: {} })], 'en')).toBeNull();
  });

  it('accepts the decimal strings MySQL returns for a coordinate', () => {
    const item = placesJsonLd([plaza({ lat: '23.9987000', lng: '90.3812000' })], 'en').itemListElement[0].item;
    expect(item.geo.latitude).toBe(23.9987);
    expect(item.geo.longitude).toBe(90.3812);
  });
});
