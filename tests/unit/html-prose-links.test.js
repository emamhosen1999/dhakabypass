import { describe, it, expect } from 'vitest';
import { localiseProseLinks } from '../../lib/html/prose-links.js';
import { sanitizeHtml } from '../../lib/html/sanitize.js';

describe('localiseProseLinks', () => {
  it('resolves a bare site path inside prose for the page locale', () => {
    // The C8 failure: on /en/about/concession the browser resolved
    // href="travel/toll" to /en/about/travel/toll, a 404.
    const html = '<p>See the <a href="travel/toll">toll rates</a>.</p>';
    expect(localiseProseLinks(html, 'en')).toBe('<p>See the <a href="/en/travel/toll">toll rates</a>.</p>');
    expect(localiseProseLinks(html, 'bn')).toBe('<p>See the <a href="/bn/travel/toll">toll rates</a>.</p>');
  });

  it('leaves absolute, anchor, mailto and tel links exactly as written', () => {
    const html = [
      '<p><a href="https://example.org/x">x</a>',
      '<a href="#top">top</a>',
      '<a href="mailto:info@dhakabypass.com">mail</a>',
      '<a href="tel:+8801234">call</a>',
      '<a href="/en/travel/toll">already localised</a>',
      '<a href="/contact">literal</a></p>',
    ].join(' ');
    expect(localiseProseLinks(html, 'zh')).toBe(html);
  });

  it('rewrites every link in a body, not just the first', () => {
    const html = '<ul><li><a href="contact">a</a></li><li><a href="travel/toll-dispute">b</a></li></ul>';
    expect(localiseProseLinks(html, 'zh'))
      .toBe('<ul><li><a href="/zh/contact">a</a></li><li><a href="/zh/travel/toll-dispute">b</a></li></ul>');
  });

  it('keeps the other attributes the sanitiser emitted after the href', () => {
    const html = sanitizeHtml('<p><a href="travel/toll" target="_blank" class="db-x">t</a></p>');
    expect(localiseProseLinks(html, 'en'))
      .toBe('<p><a href="/en/travel/toll" target="_blank" rel="noopener noreferrer" class="db-x">t</a></p>');
  });

  it('returns an empty string for anything that is not a string', () => {
    expect(localiseProseLinks(undefined, 'en')).toBe('');
    expect(localiseProseLinks(null, 'en')).toBe('');
    expect(localiseProseLinks('', 'en')).toBe('');
  });

  it('is a no-op on prose without links', () => {
    const html = '<p>No links here &amp; nothing to do.</p>';
    expect(localiseProseLinks(html, 'bn')).toBe(html);
  });
});
