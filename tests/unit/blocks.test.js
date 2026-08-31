import { describe, it, expect, beforeEach } from 'vitest';
import { resetRegistry, getBlock, validateBlockData, defaultBlockData } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';

beforeEach(() => { resetRegistry(); registerAllBlocks(); });

describe('block types', () => {
  it('registers rich-text and stat-row', () => {
    expect(getBlock('rich-text')).toBeTruthy();
    expect(getBlock('stat-row')).toBeTruthy();
  });

  it('requires a body on rich-text', () => {
    expect(validateBlockData('rich-text', { heading: 'Hi' }).ok).toBe(false);
    expect(validateBlockData('rich-text', { heading: 'Hi', body: '<p>x</p>' }).ok).toBe(true);
  });

  it('requires a stats list on stat-row', () => {
    expect(validateBlockData('stat-row', {}).ok).toBe(false);
    expect(validateBlockData('stat-row', { stats: [{ value: '48', unit: 'KM', label: 'Corridor' }] }).ok).toBe(true);
  });

  it('gives every block type usable defaults', () => {
    expect(defaultBlockData('rich-text')).toEqual({ heading: '', body: '' });
    expect(defaultBlockData('stat-row')).toEqual({ stats: [] });
  });

  it('is safe to register twice', () => {
    expect(() => registerAllBlocks()).not.toThrow();
  });
});
