// The callout block replaces a convention held together by people remembering
// a class name: 129 provenance markers typed as <p class="db-pending"> inside
// rich-text bodies, one careless edit from silently becoming a plain paragraph.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import callout from '../../lib/blocks/types/callout.js';
import CalloutBlock from '../../components/blocks/CalloutBlock.jsx';
import { getBlock, validateBlockData } from '../../lib/blocks/registry.js';
import '../../lib/blocks/index.js';

const render = (data, locale = 'en') =>
  renderToStaticMarkup(<CalloutBlock data={data} locale={locale} />);

describe('callout — registration and schema', () => {
  it('is registered under its type', () => {
    expect(getBlock('callout')).toBe(callout);
  });

  it('makes the tone a closed set, not free text', () => {
    const tone = callout.fields.find((f) => f.name === 'tone');
    expect(tone.type).toBe('select');
    expect(tone.options.map((o) => o.value)).toEqual(['pending', 'legacy', 'warning', 'info']);
  });

  it('refuses a tone outside the set', () => {
    const r = validateBlockData('callout', { tone: 'urgent', body: '<p>x</p>' });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/tone/);
  });

  it('requires a body', () => {
    expect(validateBlockData('callout', { tone: 'info', body: '' }).ok).toBe(false);
  });
});

describe('callout — the standard tags', () => {
  it('uses the shared "Not yet published" tag for pending, so 129 markers and this block read identically', () => {
    const html = render({ tone: 'pending', body: '<p>Awaiting the gazette.</p>' });
    expect(html).toContain('db-callout-pending');
    expect(html).toContain('Not yet published');
  });

  it('localises the standard tag', () => {
    expect(render({ tone: 'pending', body: '<p>x</p>' }, 'bn')).toContain('এখনও প্রকাশিত হয়নি');
    expect(render({ tone: 'legacy', body: '<p>x</p>' }, 'zh')).toContain('旧版网站信息');
  });

  it('lets an authored label override the tag', () => {
    const html = render({ tone: 'warning', heading: 'Road closed tonight', body: '<p>x</p>' });
    expect(html).toContain('Road closed tonight');
  });

  it('never conveys tone by colour alone — every tone that has a standard tag renders it as text', () => {
    for (const tone of ['pending', 'legacy']) {
      const html = render({ tone, body: '<p>x</p>' });
      expect(html).toMatch(/db-callout-tag/);
    }
  });
});

describe('callout — rendering', () => {
  it('is an aside with role=note, parenthetical to the content around it', () => {
    expect(render({ tone: 'info', body: '<p>x</p>' })).toMatch(/<aside[^>]*role="note"/);
  });

  it('renders nothing for an empty body rather than an empty box', () => {
    expect(render({ tone: 'info', body: '   ' })).toBe('');
  });

  it('falls back to info for an unknown tone at render time, never crashing on stored data', () => {
    expect(render({ tone: 'bogus', body: '<p>x</p>' })).toContain('db-callout-info');
  });
});
