// progress-bar, corridor-strip and corridor-map are the three blocks that let
// /travel/status and /travel/map become block documents. Each is a thin
// wrapper over a component the page already used, reading through the same
// cached readers — so the point of these tests is that the wrapper is wired,
// degrades the way the page did, and cannot hide the honesty notices.
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../lib/corridor/cache.js', () => ({
  getCorridorSummaryCached: vi.fn(),
  getInterchangesCached: vi.fn(),
  getIllustrativeCached: vi.fn(),
  getPublishedLengthKmCached: vi.fn(),
}));
vi.mock('../../lib/corridor/traffic-cache.js', () => ({
  getMapTrafficCached: vi.fn(),
}));

import {
  getCorridorSummaryCached, getInterchangesCached, getIllustrativeCached, getPublishedLengthKmCached,
} from '../../lib/corridor/cache.js';
import { getMapTrafficCached } from '../../lib/corridor/traffic-cache.js';
import { getBlock } from '../../lib/blocks/registry.js';
import '../../lib/blocks/index.js';
import ProgressBarBlock from '../../components/blocks/ProgressBarBlock.jsx';
import CorridorStripBlock from '../../components/blocks/CorridorStripBlock.jsx';
import CorridorMapBlock from '../../components/blocks/CorridorMapBlock.jsx';

const SUMMARY = {
  extent: { from_m: 0, to_m: 47611, length_m: 47611 },
  openLength: 18000, percentOpen: 37.8,
  segments: [
    { id: 1, from_m: 0, to_m: 3218, status: 'construction', labels: { en: 'Naojor approach' } },
    { id: 2, from_m: 3218, to_m: 21218, status: 'open', labels: { en: 'Vogra – Purbachal' } },
    { id: 3, from_m: 21218, to_m: 47611, status: 'construction', labels: { en: 'Purbachal – Madanpur' } },
  ],
};

async function html(Component, data, locale = 'en') {
  const el = await Component({ data, locale });
  return renderToStaticMarkup(el);
}

describe('registration', () => {
  it('registers all three', () => {
    for (const type of ['progress-bar', 'corridor-strip', 'corridor-map']) {
      expect(getBlock(type), type).toBeTruthy();
    }
  });
});

describe('progress-bar', () => {
  it('renders the live percentage, and the sample notice when the corridor flag says so', async () => {
    getCorridorSummaryCached.mockResolvedValue(SUMMARY);
    getIllustrativeCached.mockResolvedValue(true);
    getPublishedLengthKmCached.mockResolvedValue(48.07);
    const out = await html(ProgressBarBlock, { heading: 'How far along' });
    expect(out).toContain('How far along');
    expect(out).toMatch(/db-progress/);
    expect(out).toContain('db-illustrative');
  });

  it('hides the notice only when the data says it is real — no block field reaches it', async () => {
    getCorridorSummaryCached.mockResolvedValue(SUMMARY);
    getIllustrativeCached.mockResolvedValue(false);
    getPublishedLengthKmCached.mockResolvedValue(48.07);
    const out = await html(ProgressBarBlock, { heading: 'x', illustrative: false, hideNotice: true });
    expect(out).not.toContain('db-illustrative');
    expect(getBlock('progress-bar').fields.map((f) => f.name)).toEqual(['heading', 'intro']);
  });

  it('degrades to a zero bar when the readers throw — never a stack trace on a public page', async () => {
    getCorridorSummaryCached.mockRejectedValue(new Error('ECONNREFUSED'));
    getIllustrativeCached.mockRejectedValue(new Error('ECONNREFUSED'));
    getPublishedLengthKmCached.mockRejectedValue(new Error('ECONNREFUSED'));
    const out = await html(ProgressBarBlock, { heading: 'x' });
    expect(out).toContain('db-block');
    expect(out).not.toContain('ECONNREFUSED');
  });
});

describe('corridor-strip', () => {
  it('draws every segment from the live summary', async () => {
    getCorridorSummaryCached.mockResolvedValue(SUMMARY);
    getInterchangesCached.mockResolvedValue([]);
    const out = await html(CorridorStripBlock, { heading: 'The corridor' });
    expect(out).toContain('The corridor');
    expect(out).toMatch(/db-strip/);
  });

  it('degrades on a dead reader', async () => {
    getCorridorSummaryCached.mockRejectedValue(new Error('down'));
    getInterchangesCached.mockRejectedValue(new Error('down'));
    const out = await html(CorridorStripBlock, {});
    expect(out).toContain('db-block');
  });
});

describe('corridor-map', () => {
  it('shows the sample-data notice whenever the source is sample, regardless of block config', async () => {
    getMapTrafficCached.mockResolvedValue({
      waypoints: [], sections: [], geometry: [], geoSource: null, source: 'sample', monthly: [], monthlySource: 'sample',
    });
    getInterchangesCached.mockResolvedValue([]);
    const out = await html(CorridorMapBlock, { heading: 'Map', showLegend: 'no', hideNotice: true });
    expect(out).toContain('db-pending');
    expect(getBlock('corridor-map').fields.map((f) => f.name)).toEqual(['heading', 'intro', 'showLegend']);
  });

  it('renders the no-geometry state, not a blank, when there is nothing to draw', async () => {
    getMapTrafficCached.mockResolvedValue({
      waypoints: [], sections: [], geometry: [], geoSource: null, source: 'tomtom', monthly: [], monthlySource: 'operator',
    });
    getInterchangesCached.mockResolvedValue([]);
    const out = await html(CorridorMapBlock, { heading: 'Map' });
    expect(out).toContain('db-empty');
    expect(out).not.toContain('db-pending');
  });

  it('degrades to the no-geometry state when the reader throws', async () => {
    getMapTrafficCached.mockRejectedValue(new Error('down'));
    getInterchangesCached.mockRejectedValue(new Error('down'));
    const out = await html(CorridorMapBlock, {});
    expect(out).toContain('db-empty');
  });
});
