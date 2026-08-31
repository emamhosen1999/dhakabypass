import { describe, it, expect, beforeEach } from 'vitest';
import { resetRegistry } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import { parseBlockForm } from '../../lib/blocks/form.js';

beforeEach(() => { resetRegistry(); registerAllBlocks(); });

function form(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe('parseBlockForm', () => {
  it('reads text and richtext fields', () => {
    const data = parseBlockForm('rich-text', form({ 'f.heading': 'Hi', 'f.body': '<p>x</p>' }));
    expect(data).toEqual({ heading: 'Hi', body: '<p>x</p>' });
  });

  it('parses a list field from JSON', () => {
    const stats = JSON.stringify([{ value: '48', unit: 'KM', label: 'Corridor' }]);
    expect(parseBlockForm('stat-row', form({ 'f.stats': stats })).stats).toHaveLength(1);
  });

  it('falls back to an empty list when the JSON is broken', () => {
    expect(parseBlockForm('stat-row', form({ 'f.stats': 'not json' })).stats).toEqual([]);
  });

  it('ignores fields the block type does not declare', () => {
    const data = parseBlockForm('rich-text', form({ 'f.body': '<p>x</p>', 'f.evil': 'nope' }));
    expect(data.evil).toBeUndefined();
  });
});
