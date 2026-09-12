import { describe, it, expect } from 'vitest';
import { filterText, tagValue, tagUnion, SHOW_FILTER_FIELD, wantsFilter } from '../../lib/blocks/filter.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import { getBlock } from '../../lib/blocks/registry.js';

describe('the shared list filter (INT.5)', () => {
  it('flattens what a row shows into one searchable string, markup stripped', () => {
    expect(filterText('How do I pay?', '<p>Cash at the <b>plaza</b>&nbsp;only.</p>')).toBe('how do i pay? cash at the plaza only.');
    expect(filterText(undefined, 42, null)).toBe('');
  });

  it('normalises tags and keeps the first-seen label', () => {
    expect(tagValue(' Toilets ')).toBe('toilets');
    expect(tagValue('a|b')).toBe('a b');
    expect(tagUnion([['Toilets', 'Fuel'], ['toilets', 'Mosque'], null])).toEqual([
      { value: 'toilets', label: 'Toilets' }, { value: 'fuel', label: 'Fuel' }, { value: 'mosque', label: 'Mosque' },
    ]);
  });

  it('is off by default on every block that offers it, so existing pages do not change', () => {
    registerAllBlocks();
    for (const type of ['faq', 'document-list', 'news-list', 'map-pin-list']) {
      const f = getBlock(type).fields.find((x) => x.name === 'showFilter');
      expect(f, type).toEqual(SHOW_FILTER_FIELD);
      expect(f.default).toBe('no');
    }
    expect(wantsFilter({})).toBe(false);
    expect(wantsFilter({ showFilter: 'yes' })).toBe(true);
  });
});
