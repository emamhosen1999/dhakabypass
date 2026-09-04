import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { localeAlternates, alternatesFor } from '../../lib/seo/alternates.js';
import { LOCALES } from '../../lib/i18n/locales.js';

const original = process.env.SITE_URL;

beforeEach(() => { process.env.SITE_URL = 'https://dhakabypass.com'; });
afterEach(() => {
  if (original === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = original;
});

describe('localeAlternates', () => {
  it('declares all three locales plus x-default', () => {
    expect(localeAlternates('/travel/toll')).toEqual({
      en: 'https://dhakabypass.com/en/travel/toll',
      bn: 'https://dhakabypass.com/bn/travel/toll',
      zh: 'https://dhakabypass.com/zh/travel/toll',
      'x-default': 'https://dhakabypass.com/en/travel/toll',
    });
  });

  it('covers every configured locale, not a hardcoded three', () => {
    const keys = Object.keys(localeAlternates('/'));
    for (const locale of LOCALES) expect(keys).toContain(locale);
    expect(keys).toContain('x-default');
  });

  it('points x-default at /en, never at the bare root', () => {
    // `/` is the LEGACY site's home page (app/(site)/page.jsx), a different
    // page in a different tree. Pointing x-default there would tell Google the
    // locale-neutral version of /bn is the old site.
    const alt = localeAlternates('/');
    expect(alt['x-default']).toBe('https://dhakabypass.com/en');
    expect(alt['x-default']).not.toBe('https://dhakabypass.com/');
  });

  it('emits absolute URLs, not paths', () => {
    for (const url of Object.values(localeAlternates('/travel/status'))) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });

  it('tracks SITE_URL rather than baking the domain in', () => {
    process.env.SITE_URL = 'http://localhost:3000';
    expect(localeAlternates('/').en).toBe('http://localhost:3000/en');
  });
});

describe('alternatesFor', () => {
  it('makes each locale canonical to itself', () => {
    // A cross-locale canonical would tell Google /bn is a duplicate of /en and
    // drop the Bangla page from the index entirely — the exact failure
    // hreflang exists to prevent.
    expect(alternatesFor('/', 'bn').canonical).toBe('https://dhakabypass.com/bn');
    expect(alternatesFor('/', 'zh').canonical).toBe('https://dhakabypass.com/zh');
    expect(alternatesFor('/travel/toll', 'en').canonical)
      .toBe('https://dhakabypass.com/en/travel/toll');
  });

  it('carries the same language map for every locale of one page', () => {
    const en = alternatesFor('/travel/route', 'en').languages;
    const zh = alternatesFor('/travel/route', 'zh').languages;
    expect(en).toEqual(zh);
  });

  it('is shaped the way Next expects an alternates object', () => {
    const alt = alternatesFor('/', 'en');
    expect(Object.keys(alt).sort()).toEqual(['canonical', 'languages']);
  });

  it('each declared alternate is also the canonical of that locale', () => {
    // The self-referencing requirement: every URL in the set must name itself
    // as canonical, or the cluster is invalid.
    const languages = localeAlternates('/travel/rules');
    for (const locale of LOCALES) {
      expect(alternatesFor('/travel/rules', locale).canonical).toBe(languages[locale]);
    }
  });
});
