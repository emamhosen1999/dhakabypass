// tests/unit/block-renderer.test.jsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BlockRenderer from '../../components/blocks/BlockRenderer.jsx';

/**
 * `block_translations.data` is `JSON NOT NULL`, which does NOT exclude the
 * JSON literal `null`, a bare scalar or an array. mysql2 returns those as JS
 * `null` / a string / an array and lib/content/pages.js passes them through
 * untouched, so a single row written by a seed script, the legacy import or
 * hand-written SQL used to throw inside the block component and 500 /en, /bn
 * and /zh at once.
 */
const good = {
  id: 1,
  type: 'rich-text',
  translations: [
    { locale: 'en', status: 'published', data: { heading: 'Still here', body: '<p>ok</p>' } },
  ],
};

const withData = (data) => ({
  id: 2,
  type: 'rich-text',
  translations: [{ locale: 'en', status: 'published', data }],
});

describe('BlockRenderer with unusable block data', () => {
  it.each([
    ['null', null],
    ['a scalar string', 'not an object'],
    ['a number', 42],
    ['a boolean', true],
    ['an array', [{ heading: 'x' }]],
  ])('renders nothing rather than throwing when data is %s', (_label, data) => {
    let html;
    expect(() => {
      html = renderToStaticMarkup(<BlockRenderer blocks={[withData(data)]} locale="en" />);
    }).not.toThrow();
    expect(html).toBe('');
  });

  it('keeps rendering the other blocks on the page around a bad row', () => {
    const html = renderToStaticMarkup(
      <BlockRenderer blocks={[withData(null), good, withData([])]} locale="en" />
    );
    expect(html).toContain('Still here');
    expect(html).toContain('<p>ok</p>');
  });

  it('still renders a block whose data is a plain object', () => {
    const html = renderToStaticMarkup(<BlockRenderer blocks={[good]} locale="en" />);
    expect(html).toContain('db-richtext');
  });

  it('skips an unknown block type and an untranslated block as before', () => {
    const unknown = { id: 3, type: 'no-such-block', translations: [{ locale: 'en', status: 'published', data: {} }] };
    const draft = { id: 4, type: 'rich-text', translations: [{ locale: 'en', status: 'draft', data: { body: 'x' } }] };
    expect(renderToStaticMarkup(<BlockRenderer blocks={[unknown, draft]} locale="en" />)).toBe('');
  });
});
