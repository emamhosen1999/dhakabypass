import { describe, it, expect } from 'vitest';
import { localeHref } from '../../lib/blocks/href.js';

describe('localeHref', () => {
  it('localises a site-relative path', () => {
    expect(localeHref('travel/toll', 'bn')).toBe('/bn/travel/toll');
    expect(localeHref('travel/toll', 'en')).toBe('/en/travel/toll');
    expect(localeHref('travel/toll', 'zh')).toBe('/zh/travel/toll');
  });

  it('leaves an absolute path exactly as authored', () => {
    // The escape hatch for routes that are not localised yet. If this
    // prefixed, an editor linking the legacy /contact from a Bangla page
    // would get /bn/contact, which does not exist.
    expect(localeHref('/contact', 'bn')).toBe('/contact');
    expect(localeHref('/gallery', 'zh')).toBe('/gallery');
  });

  it('does not double-prefix a path that already names a locale', () => {
    // The specific failure this guards: a translator copying an /en href
    // into the Bangla record must not produce /bn/en/travel/toll.
    expect(localeHref('en/travel/toll', 'bn')).toBe('/en/travel/toll');
    expect(localeHref('/en/travel/toll', 'bn')).toBe('/en/travel/toll');
  });

  it('never touches an external or non-page target', () => {
    expect(localeHref('https://example.org/x', 'bn')).toBe('https://example.org/x');
    expect(localeHref('//cdn.example.org/x', 'bn')).toBe('//cdn.example.org/x');
    expect(localeHref('mailto:info@dhakabypass.com', 'bn')).toBe('mailto:info@dhakabypass.com');
    expect(localeHref('tel:+8801000000000', 'bn')).toBe('tel:+8801000000000');
    expect(localeHref('#main', 'bn')).toBe('#main');
    expect(localeHref('?page=2', 'bn')).toBe('?page=2');
  });

  it('returns empty string for a missing or blank value', () => {
    // Every renderer guards on `data.linkHref && data.linkLabel`, so an empty
    // string must mean "render no link" rather than "link to /bn/".
    expect(localeHref('', 'bn')).toBe('');
    expect(localeHref('   ', 'bn')).toBe('');
    expect(localeHref(null, 'bn')).toBe('');
    expect(localeHref(undefined, 'bn')).toBe('');
    expect(localeHref(42, 'bn')).toBe('');
  });

  it('trims stray whitespace an editor may paste in', () => {
    expect(localeHref('  travel/route  ', 'en')).toBe('/en/travel/route');
  });
});
