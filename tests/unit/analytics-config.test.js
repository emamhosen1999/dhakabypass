/**
 * Analytics configuration.
 *
 * Two failures this guards against, both silent. A provider named but
 * misconfigured renders a broken tag and measures nothing while looking
 * switched on. And a cookie-setting provider treated as cookieless would run
 * Google Analytics with no consent mechanism at all, which is a legal exposure
 * for DBEDC rather than a bug in a dashboard.
 */
import { describe, it, expect } from 'vitest';
import { analyticsConfig, PROVIDERS } from '../../lib/analytics/config.js';

describe('off by default', () => {
  it('is disabled with an empty environment', () => {
    const c = analyticsConfig({});
    expect(c.enabled).toBe(false);
    expect(c.provider).toBe('none');
    expect(c.problems).toEqual([]);
  });

  it('is disabled, quietly, when explicitly set to none', () => {
    // Staging sets this. It must not warn — it is the correct configuration.
    const c = analyticsConfig({ ANALYTICS_PROVIDER: 'none', ANALYTICS_SITE_ID: 'leftover' });
    expect(c.enabled).toBe(false);
    expect(c.problems).toEqual([]);
  });
});

describe('cookieless providers', () => {
  const base = {
    ANALYTICS_SITE_ID: 'dhakabypass.com',
    ANALYTICS_SCRIPT_URL: 'https://analytics.example.org/js/script.js',
  };

  it.each(['plausible', 'umami'])('%s is enabled and needs no consent', (provider) => {
    const c = analyticsConfig({ ...base, ANALYTICS_PROVIDER: provider });
    expect(c.enabled).toBe(true);
    expect(c.provider).toBe(provider);
    // These store nothing on the device, so a banner would be asking permission
    // for cookies that are never set.
    expect(c.requiresConsent).toBe(false);
  });

  it('is disabled without a script URL, because there is no default to guess', () => {
    const c = analyticsConfig({ ANALYTICS_PROVIDER: 'plausible', ANALYTICS_SITE_ID: 'x' });
    expect(c.enabled).toBe(false);
    expect(c.problems.join(' ')).toMatch(/ANALYTICS_SCRIPT_URL/);
  });

  it('rejects an http script URL', () => {
    // Blocked as mixed content on an https page: it would measure nothing while
    // appearing configured.
    const c = analyticsConfig({
      ...base, ANALYTICS_PROVIDER: 'plausible',
      ANALYTICS_SCRIPT_URL: 'http://analytics.example.org/js/script.js',
    });
    expect(c.enabled).toBe(false);
    expect(c.problems.join(' ')).toMatch(/https/);
  });
});

describe('ga4', () => {
  it('is enabled and REQUIRES consent', () => {
    // The whole reason this flag exists: GA4 sets cookies, so selecting it also
    // selects a consent banner.
    const c = analyticsConfig({ ANALYTICS_PROVIDER: 'ga4', ANALYTICS_SITE_ID: 'G-XXXX' });
    expect(c.enabled).toBe(true);
    expect(c.requiresConsent).toBe(true);
  });

  it('needs no script URL of its own', () => {
    // Unlike the self-hosted providers, the tag URL is Google's and fixed.
    expect(analyticsConfig({ ANALYTICS_PROVIDER: 'ga4', ANALYTICS_SITE_ID: 'G-X' }).enabled)
      .toBe(true);
  });
});

describe('misconfiguration is never partial', () => {
  it('disables rather than half-renders when the site id is missing', () => {
    for (const provider of ['plausible', 'umami', 'ga4']) {
      const c = analyticsConfig({ ANALYTICS_PROVIDER: provider });
      expect(c.enabled, provider).toBe(false);
      expect(c.problems.join(' ')).toMatch(/ANALYTICS_SITE_ID/);
    }
  });

  it('reports an unknown provider by name and lists the valid ones', () => {
    const c = analyticsConfig({ ANALYTICS_PROVIDER: 'matomo', ANALYTICS_SITE_ID: 'x' });
    expect(c.enabled).toBe(false);
    expect(c.problems[0]).toMatch(/matomo/);
    for (const p of PROVIDERS) expect(c.problems[0]).toContain(p);
  });

  it('is case-insensitive and tolerates surrounding whitespace', () => {
    // Values pasted into a cPanel environment editor carry both.
    const c = analyticsConfig({
      ANALYTICS_PROVIDER: '  GA4 ', ANALYTICS_SITE_ID: '  G-XXXX  ',
    });
    expect(c.enabled).toBe(true);
    expect(c.provider).toBe('ga4');
    expect(c.siteId).toBe('G-XXXX');
  });
});
