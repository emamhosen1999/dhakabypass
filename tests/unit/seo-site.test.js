import { describe, it, expect, afterEach } from 'vitest';
import { siteOrigin, absoluteUrl } from '../../lib/seo/site.js';

const original = process.env.SITE_URL;

afterEach(() => {
  if (original === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = original;
});

describe('siteOrigin', () => {
  it('falls back to the dev origin when SITE_URL is unset', () => {
    delete process.env.SITE_URL;
    expect(siteOrigin()).toBe('http://localhost:3000');
  });

  it('falls back when SITE_URL is empty or whitespace', () => {
    process.env.SITE_URL = '';
    expect(siteOrigin()).toBe('http://localhost:3000');
    process.env.SITE_URL = '   ';
    expect(siteOrigin()).toBe('http://localhost:3000');
  });

  it('uses the configured origin', () => {
    process.env.SITE_URL = 'https://dhakabypass.com';
    expect(siteOrigin()).toBe('https://dhakabypass.com');
  });

  it('strips a trailing slash and any path', () => {
    process.env.SITE_URL = 'https://dhakabypass.com/';
    expect(siteOrigin()).toBe('https://dhakabypass.com');
  });

  it('accepts a bare hostname and assumes https', () => {
    // The mistake an operator actually makes in a cPanel environment editor.
    process.env.SITE_URL = 'dhakabypass.com';
    expect(siteOrigin()).toBe('https://dhakabypass.com');
  });

  it('keeps a non-default port', () => {
    process.env.SITE_URL = 'http://localhost:3001';
    expect(siteOrigin()).toBe('http://localhost:3001');
  });

  it('falls back rather than throwing on an unparseable value', () => {
    // This is read inside sitemap.xml and robots.txt, where a throw is a 500.
    process.env.SITE_URL = 'https://';
    expect(siteOrigin()).toBe('http://localhost:3000');
  });
});

describe('absoluteUrl', () => {
  it('joins a root-relative path onto the origin', () => {
    process.env.SITE_URL = 'https://dhakabypass.com';
    expect(absoluteUrl('/bn/travel/toll')).toBe('https://dhakabypass.com/bn/travel/toll');
  });

  it('adds the missing leading slash', () => {
    process.env.SITE_URL = 'https://dhakabypass.com';
    expect(absoluteUrl('en')).toBe('https://dhakabypass.com/en');
  });

  it('renders the root as a single trailing slash', () => {
    process.env.SITE_URL = 'https://dhakabypass.com';
    expect(absoluteUrl('/')).toBe('https://dhakabypass.com/');
    expect(absoluteUrl('')).toBe('https://dhakabypass.com/');
  });

  it('passes an already-absolute URL through untouched', () => {
    process.env.SITE_URL = 'https://dhakabypass.com';
    expect(absoluteUrl('https://cdn.example.org/a.webp')).toBe('https://cdn.example.org/a.webp');
  });

  it('never emits the string undefined or null', () => {
    process.env.SITE_URL = 'https://dhakabypass.com';
    expect(absoluteUrl(undefined)).toBe('https://dhakabypass.com/');
    expect(absoluteUrl(null)).toBe('https://dhakabypass.com/');
  });
});
