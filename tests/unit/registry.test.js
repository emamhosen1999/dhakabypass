import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerBlock, getBlock, allBlocks, validateBlockData, defaultBlockData, resetRegistry,
} from '../../lib/blocks/registry.js';

const Demo = {
  type: 'demo',
  label: 'Demo',
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true },
    { name: 'count', type: 'number', label: 'Count', default: 0 },
    { name: 'items', type: 'list', label: 'Items', default: [] },
  ],
  Component: () => null,
};

beforeEach(() => resetRegistry());

describe('registry', () => {
  it('registers and retrieves a block type', () => {
    registerBlock(Demo);
    expect(getBlock('demo').label).toBe('Demo');
    expect(allBlocks()).toHaveLength(1);
  });

  it('returns null for an unknown type', () => {
    expect(getBlock('nope')).toBe(null);
  });

  it('rejects a duplicate type', () => {
    registerBlock(Demo);
    expect(() => registerBlock(Demo)).toThrow(/already registered/i);
  });

  it('rejects a definition with no fields array', () => {
    expect(() => registerBlock({ type: 'x', label: 'X', Component: () => null })).toThrow(/fields/i);
  });
});

describe('validateBlockData', () => {
  beforeEach(() => registerBlock(Demo));

  it('accepts valid data', () => {
    expect(validateBlockData('demo', { heading: 'Hi', count: 2, items: [] }))
      .toEqual({ ok: true, errors: [] });
  });

  it('reports a missing required field', () => {
    const r = validateBlockData('demo', { count: 1 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/heading/);
  });

  it('reports a wrong type', () => {
    const r = validateBlockData('demo', { heading: 'Hi', count: 'two' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/count/);
  });

  it('rejects data for an unregistered block', () => {
    expect(validateBlockData('ghost', {}).ok).toBe(false);
  });
});

describe('defaultBlockData', () => {
  it('builds an empty record from the field defaults', () => {
    registerBlock(Demo);
    expect(defaultBlockData('demo')).toEqual({ heading: '', count: 0, items: [] });
  });
});
