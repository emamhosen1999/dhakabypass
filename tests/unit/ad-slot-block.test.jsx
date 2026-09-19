/**
 * The advertisement block, server-rendered.
 *
 * The rules that matter are all refusals: nothing renders when advertising is
 * off, nothing renders on a page that carries none, and nothing renders
 * without a real ad unit ID — a labelled empty box is worse than no box, and
 * a made-up ID is a policy violation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AdSlotBlock from '../../components/blocks/AdSlotBlock.jsx';

const CLIENT = 'ca-pub-1234567890123456';
const original = process.env.ADSENSE_CLIENT;

beforeEach(() => { process.env.ADSENSE_CLIENT = CLIENT; });
afterEach(() => {
  if (original === undefined) delete process.env.ADSENSE_CLIENT;
  else process.env.ADSENSE_CLIENT = original;
  delete process.env.ADS_ALLOW_EVERYWHERE;
});

const html = (data, pageSlug = 'project') =>
  renderToStaticMarkup(<AdSlotBlock data={data} locale="en" pageSlug={pageSlug} />);

describe('AdSlotBlock', () => {
  it('renders a labelled, reserved unit on an ordinary page', () => {
    const out = html({ format: 'rectangle', slot: '1234567890' });
    expect(out).toContain('Advertisement');
    expect(out).toContain('adsbygoogle');
    expect(out).toContain('data-ad-slot="1234567890"');
    expect(out).toContain(CLIENT);
  });

  it('reserves the box before anything loads, so nothing shifts', () => {
    const out = html({ format: 'rectangle', slot: '1234567890' });
    expect(out).toContain('--ad-w:336px');
    expect(out).toContain('--ad-h:280px');
    expect(out).toContain('--ad-w-phone:300px');
  });

  it('renders nothing at all when advertising is off', () => {
    delete process.env.ADSENSE_CLIENT;
    expect(html({ format: 'rectangle', slot: '1234567890' })).toBe('');
  });

  it('renders nothing on a page that carries no advertising', () => {
    expect(html({ format: 'rectangle', slot: '1234567890' }, 'grievances')).toBe('');
    expect(html({ format: 'rectangle', slot: '1234567890' }, 'disclosures/tariff')).toBe('');
    expect(html({ format: 'rectangle', slot: '1234567890' }, 'travel/breakdown')).toBe('');
  });

  it('honours an explicit override, because the decision is DBEDC-s', () => {
    process.env.ADS_ALLOW_EVERYWHERE = '1';
    expect(html({ format: 'rectangle', slot: '1234567890' }, 'grievances')).toContain('adsbygoogle');
  });

  it('renders nothing until a real ad unit ID is entered', () => {
    // This is the state every unit ships in: placed, inert, waiting for the
    // AdSense account.
    expect(html({ format: 'rectangle', slot: '' })).toBe('');
    expect(html({ format: 'rectangle' })).toBe('');
    expect(html({ format: 'rectangle', slot: 'ca-pub-1234567890123456' })).toBe('');
    expect(html({ format: 'rectangle', slot: 'abcdef' })).toBe('');
  });

  it('falls back to the rectangle for an unknown size rather than an unsized box', () => {
    const out = html({ format: 'skyscraper', slot: '1234567890' });
    expect(out).toContain('--ad-w:336px');
  });

  it('labels in the reader-s language', () => {
    const bn = renderToStaticMarkup(<AdSlotBlock data={{ format: 'banner', slot: '1234567890' }} locale="bn" pageSlug="project" />);
    expect(bn).toContain('বিজ্ঞাপন');
  });
});

describe('the renderer hands the block its page', () => {
  it('passes pageSlug, without which every refusal above fails open', async () => {
    // AdSlotBlock decides by page. If BlockRenderer stops passing the slug the
    // block sees undefined, adsAllowedOn treats that as "no page named", and
    // advertising appears on the emergency and disclosure pages.
    const fs = await import('node:fs');
    const src = fs.readFileSync('components/blocks/BlockRenderer.jsx', 'utf8');
    expect(src).toContain('pageSlug={pageSlug}');
    expect(src).toMatch(/BlockRenderer\(\{[^}]*pageSlug/);

    const page = fs.readFileSync('app/[locale]/[[...slug]]/page.jsx', 'utf8');
    expect(page).toMatch(/<BlockRenderer[^>]*pageSlug=/);
  });
});
