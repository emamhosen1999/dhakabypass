import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../lib/html/sanitize.js';

/**
 * W1.3 — the block editor now produces HTML from a contenteditable surface,
 * so nothing that reaches `block_translations.data` may be trusted. The
 * renderers (`RichTextBlock`, `MediaProseBlock`) hand `data.body` straight to
 * `dangerouslySetInnerHTML`, so this function is the only thing standing
 * between the editor and the public page.
 *
 * It must also *preserve* the seeded conventions: `db-pending`,
 * `db-pending-tag` and `db-provisional-inline` all appear in
 * `db/sql/02-seed.sql` and are styled in `app/design-tokens.css`.
 */
describe('sanitizeHtml', () => {
  it('keeps ordinary prose markup untouched', () => {
    expect(sanitizeHtml('<p>Hello</p>')).toBe('<p>Hello</p>');
    expect(sanitizeHtml('<p>a</p><p>b</p>')).toBe('<p>a</p><p>b</p>');
  });

  it('keeps the toolbar formats: headings, bold, italic, lists', () => {
    const html = '<h2>Head</h2><h3>Sub</h3><p><strong>b</strong><em>i</em></p><ul><li>one</li></ul><ol><li>two</li></ol>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('preserves the seeded db-pending callout convention', () => {
    const html = '<p class="db-pending"><span class="db-pending-tag">Not yet published</span>Text follows.</p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('preserves db-provisional-inline', () => {
    expect(sanitizeHtml('<p class="db-provisional-inline">x</p>'))
      .toBe('<p class="db-provisional-inline">x</p>');
  });

  it('drops classes that are not part of the db- design system', () => {
    expect(sanitizeHtml('<p class="db-pending evil">x</p>')).toBe('<p class="db-pending">x</p>');
    expect(sanitizeHtml('<p class="evil">x</p>')).toBe('<p>x</p>');
  });

  it('removes script elements and their contents', () => {
    expect(sanitizeHtml('<p>a</p><script>alert(1)</script><p>b</p>')).toBe('<p>a</p><p>b</p>');
  });

  it('removes style, iframe, object and embed elements and their contents', () => {
    expect(sanitizeHtml('<style>p{x}</style><iframe src="//evil"></iframe><p>ok</p>')).toBe('<p>ok</p>');
    expect(sanitizeHtml('<object data="x"><p>gone</p></object><p>ok</p>')).toBe('<p>ok</p>');
  });

  it('strips event-handler attributes', () => {
    expect(sanitizeHtml('<p onclick="alert(1)">x</p>')).toBe('<p>x</p>');
    expect(sanitizeHtml('<a href="/en" onmouseover="x()">y</a>')).toBe('<a href="/en">y</a>');
  });

  it('strips style attributes', () => {
    expect(sanitizeHtml('<p style="position:fixed">x</p>')).toBe('<p>x</p>');
  });

  it('keeps safe link targets and drops dangerous schemes', () => {
    expect(sanitizeHtml('<a href="/en/travel/toll">t</a>')).toBe('<a href="/en/travel/toll">t</a>');
    expect(sanitizeHtml('<a href="https://rhd.gov.bd">t</a>')).toBe('<a href="https://rhd.gov.bd">t</a>');
    expect(sanitizeHtml('<a href="mailto:a@b.com">t</a>')).toBe('<a href="mailto:a@b.com">t</a>');
    expect(sanitizeHtml('<a href="javascript:alert(1)">t</a>')).toBe('<a>t</a>');
    // Entity-obfuscated and whitespace-obfuscated forms are the classic bypass.
    expect(sanitizeHtml('<a href="java\tscript:alert(1)">t</a>')).toBe('<a>t</a>');
    expect(sanitizeHtml('<a href="&#106;avascript:alert(1)">t</a>')).toBe('<a>t</a>');
  });

  it('forces rel=noopener noreferrer on target=_blank links', () => {
    expect(sanitizeHtml('<a href="https://x.test" target="_blank">t</a>'))
      .toBe('<a href="https://x.test" target="_blank" rel="noopener noreferrer">t</a>');
  });

  it('normalises the tags browsers emit into the ones the design system styles', () => {
    expect(sanitizeHtml('<b>x</b>')).toBe('<strong>x</strong>');
    expect(sanitizeHtml('<i>x</i>')).toBe('<em>x</em>');
    expect(sanitizeHtml('<div>x</div>')).toBe('<p>x</p>');
    // execCommand leaves <font> behind; unwrap it rather than losing the text.
    expect(sanitizeHtml('<p><font color="red">x</font></p>')).toBe('<p>x</p>');
  });

  it('balances unclosed and stray tags', () => {
    expect(sanitizeHtml('<p>x')).toBe('<p>x</p>');
    expect(sanitizeHtml('x</p>')).toBe('x');
    expect(sanitizeHtml('<p>a<p>b</p>')).toBe('<p>a</p><p>b</p>');
  });

  it('escapes text that is not markup', () => {
    expect(sanitizeHtml('5 < 6 & 7 > 4')).toBe('5 &lt; 6 &amp; 7 &gt; 4');
    expect(sanitizeHtml('<p>caf&eacute; &amp; co</p>')).toBe('<p>caf&eacute; &amp; co</p>');
  });

  it('drops comments, doctypes and processing instructions', () => {
    expect(sanitizeHtml('<!-- <script>x</script> --><p>ok</p>')).toBe('<p>ok</p>');
    expect(sanitizeHtml('<!DOCTYPE html><p>ok</p>')).toBe('<p>ok</p>');
  });

  it('keeps <br> as a void element', () => {
    expect(sanitizeHtml('<p>a<br>b</p>')).toBe('<p>a<br>b</p>');
    expect(sanitizeHtml('<p>a<br/>b</p>')).toBe('<p>a<br>b</p>');
  });

  it('returns an empty string for anything that is not a string', () => {
    for (const v of [null, undefined, 42, {}, []]) expect(sanitizeHtml(v)).toBe('');
  });
});
