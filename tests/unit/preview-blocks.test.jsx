// tests/unit/preview-blocks.test.jsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BlockRenderer from '../../components/blocks/BlockRenderer.jsx';
import { withDraftTranslations } from '../../lib/content/preview.js';

/**
 * The draft preview must reuse the PUBLIC rendering path — BlockRenderer plus
 * resolveTranslation — or the preview and the live page drift apart, which is
 * the one thing a preview exists to prevent.
 *
 * So nothing in the renderer knows about previewing. The preview route runs the
 * block rows through withDraftTranslations() first, which promotes each
 * `draft` row to `published` for that one render. Everything downstream is
 * byte-for-byte the code the public page runs.
 */
const richText = (translations, id = 1) => ({ id, type: 'rich-text', translations });

describe('withDraftTranslations', () => {
  it('promotes a draft translation to published so the preview can render it', () => {
    const out = withDraftTranslations([
      richText([{ locale: 'en', status: 'draft', data: { body: '<p>x</p>' } }]),
    ]);
    expect(out[0].translations[0].status).toBe('published');
  });

  it('leaves an already-published translation exactly as it was', () => {
    const out = withDraftTranslations([
      richText([{ locale: 'en', status: 'published', data: { body: '<p>x</p>' } }]),
    ]);
    expect(out[0].translations[0].status).toBe('published');
  });

  it("never promotes 'missing' — that means no content was ever written, not unpublished content", () => {
    const out = withDraftTranslations([
      richText([{ locale: 'bn', status: 'missing', data: {} }]),
    ]);
    expect(out[0].translations[0].status).toBe('missing');
  });

  it('does not mutate the rows it was given', () => {
    const rows = [richText([{ locale: 'en', status: 'draft', data: { body: '<p>x</p>' } }])];
    withDraftTranslations(rows);
    expect(rows[0].translations[0].status).toBe('draft');
  });

  it('tolerates an empty list and a block with no translations at all', () => {
    expect(withDraftTranslations([])).toEqual([]);
    expect(withDraftTranslations()).toEqual([]);
    expect(withDraftTranslations([{ id: 1, type: 'rich-text' }])[0].translations).toEqual([]);
  });
});

describe('draft preview through the public renderer', () => {
  const draftOnly = richText([
    { locale: 'en', status: 'draft', data: { heading: 'Unpublished heading', body: '<p>draft body</p>' } },
  ]);

  it('renders nothing on the public path, as today', () => {
    expect(renderToStaticMarkup(<BlockRenderer blocks={[draftOnly]} locale="en" />)).toBe('');
  });

  it('renders the draft in the preview, using the same renderer', () => {
    const html = renderToStaticMarkup(
      <BlockRenderer blocks={withDraftTranslations([draftOnly])} locale="en" />
    );
    expect(html).toContain('Unpublished heading');
    expect(html).toContain('<p>draft body</p>');
  });

  it('previews a draft Bangla translation instead of falling back to the published English', () => {
    const block = richText([
      { locale: 'en', status: 'published', data: { heading: 'English', body: '<p>en</p>' } },
      { locale: 'bn', status: 'draft', data: { heading: 'বাংলা', body: '<p>bn</p>' } },
    ]);
    expect(renderToStaticMarkup(<BlockRenderer blocks={[block]} locale="bn" />)).toContain('English');
    const html = renderToStaticMarkup(
      <BlockRenderer blocks={withDraftTranslations([block])} locale="bn" />
    );
    expect(html).toContain('বাংলা');
    expect(html).not.toContain('English');
  });

  it('still falls back to English when the locale has no row at all', () => {
    const block = richText([
      { locale: 'en', status: 'draft', data: { heading: 'English draft', body: '<p>en</p>' } },
    ]);
    const html = renderToStaticMarkup(
      <BlockRenderer blocks={withDraftTranslations([block])} locale="zh" />
    );
    expect(html).toContain('English draft');
  });
});
