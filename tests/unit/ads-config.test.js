/**
 * Advertising configuration.
 *
 * Two rules worth a test each: nothing renders unless a publisher ID is set,
 * and the pages where an advertisement would do real damage are excluded by
 * default — with an explicit override, because the decision is DBEDC's.
 */
import { describe, it, expect } from 'vitest';
import { adsConfig, adsAllowedOn, NEVER_ADS } from '../../lib/ads/config.js';

describe('adsConfig', () => {
  it('is off when no publisher ID is set', () => {
    expect(adsConfig({}).enabled).toBe(false);
    expect(adsConfig({ ADSENSE_CLIENT: '' }).enabled).toBe(false);
    expect(adsConfig({ ADSENSE_CLIENT: '   ' }).enabled).toBe(false);
  });

  it('is on with a publisher ID', () => {
    const c = adsConfig({ ADSENSE_CLIENT: 'ca-pub-1234567890123456' });
    expect(c.enabled).toBe(true);
    expect(c.client).toBe('ca-pub-1234567890123456');
  });

  it('refuses something that is not a publisher ID rather than rendering it', () => {
    // A stray value here becomes a script src on every page.
    const c = adsConfig({ ADSENSE_CLIENT: 'pub-123' });
    expect(c.enabled).toBe(false);
    expect(c.problem).toContain('ca-pub-');
  });

  it('offers a test mode that fills no impressions', () => {
    expect(adsConfig({ ADSENSE_CLIENT: 'ca-pub-1234567890123456', ADSENSE_TEST: '1' }).testMode).toBe(true);
  });
});

describe('adsAllowedOn', () => {
  it('allows an ordinary page', () => {
    expect(adsAllowedOn('project')).toBe(true);
    expect(adsAllowedOn('news')).toBe(true);
    expect(adsAllowedOn('about/careers')).toBe(true);
  });

  it('keeps advertising away from the pages a driver needs in an emergency', () => {
    expect(adsAllowedOn('travel/breakdown')).toBe(false);
    expect(adsAllowedOn('travel/advisories')).toBe(false);
    expect(adsAllowedOn('contact')).toBe(false);
  });

  it('keeps it off the statutory pages', () => {
    expect(adsAllowedOn('disclosures')).toBe(false);
    expect(adsAllowedOn('disclosures/tariff')).toBe(false);
    expect(adsAllowedOn('grievances')).toBe(false);
    expect(adsAllowedOn('travel/toll')).toBe(false);
  });

  it('matches a prefix, not a substring', () => {
    // `contactless-payment` is not `contact`.
    expect(adsAllowedOn('contactless-payment')).toBe(true);
    expect(adsAllowedOn('legal-notice-archive')).toBe(true);
  });

  it('tolerates the shapes a slug arrives in', () => {
    expect(adsAllowedOn('/disclosures/')).toBe(false);
    expect(adsAllowedOn('DISCLOSURES')).toBe(false);
    expect(adsAllowedOn('')).toBe(true);
  });

  it('lets DBEDC override the whole list, because the decision is theirs', () => {
    expect(adsAllowedOn('grievances', { ADS_ALLOW_EVERYWHERE: '1' })).toBe(true);
    expect(adsAllowedOn('disclosures/tariff', { ADS_ALLOW_EVERYWHERE: '1' })).toBe(true);
  });

  it('names the pages it protects, so the list is reviewable', () => {
    expect(NEVER_ADS).toContain('grievances');
    expect(NEVER_ADS).toContain('travel/breakdown');
    expect(NEVER_ADS.length).toBeGreaterThan(5);
  });
});
