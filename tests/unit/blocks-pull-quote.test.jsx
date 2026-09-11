import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PullQuoteBlock from '../../components/blocks/PullQuoteBlock.jsx';
import { getBlock, validateBlockData } from '../../lib/blocks/registry.js';
import '../../lib/blocks/index.js';

const render = (data) => renderToStaticMarkup(<PullQuoteBlock data={data} />);

describe('pull-quote', () => {
  it('is registered and requires a quotation', () => {
    expect(getBlock('pull-quote')).toBeTruthy();
    expect(validateBlockData('pull-quote', { quote: '' }).ok).toBe(false);
    expect(validateBlockData('pull-quote', { quote: '<p>x</p>' }).ok).toBe(true);
  });

  it('is a blockquote with a cite in a figcaption — the shape assistive tech expects', () => {
    const html = render({ quote: '<p>A road is a promise kept.</p>', attribution: 'Liu Xiaobo', role: 'Managing Director' });
    expect(html).toMatch(/<figure[^>]*><blockquote/);
    expect(html).toContain('<cite>Liu Xiaobo</cite>');
    expect(html).toContain('Managing Director');
  });

  it('carries the source on the blockquote when given', () => {
    const html = render({ quote: '<p>x</p>', sourceHref: 'https://example.org/speech' });
    expect(html).toContain('cite="https://example.org/speech"');
  });

  it('draws no quotation mark in the markup — the mark is CSS, so it is never doubled', () => {
    const html = render({ quote: '<p>x</p>', attribution: 'A' });
    expect(html).not.toContain('“');
    expect(html).not.toContain('&ldquo;');
  });

  it('renders nothing for an empty quotation', () => {
    expect(render({ quote: '  ', attribution: 'Nobody' })).toBe('');
  });
});
