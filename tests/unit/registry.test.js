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

/**
 * W1.22 — `select`. Before this, media-prose's "image side" was free text and
 * `Left` silently rendered as `right`, because MediaProseBlock tests
 * `data.side === 'left'`. A field whose only valid values are known to the
 * block type declares them, and the validator refuses anything else instead
 * of publishing a page that ignores what the operator typed.
 */
describe('select fields', () => {
  const Sided = (extra = {}) => ({
    type: 'sided',
    label: 'Sided',
    fields: [{
      name: 'side', type: 'select', label: 'Image side', default: 'right',
      options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }],
      ...extra,
    }],
    Component: () => null,
  });

  it('accepts a declared option', () => {
    registerBlock(Sided());
    expect(validateBlockData('sided', { side: 'left' })).toEqual({ ok: true, errors: [] });
  });

  it('rejects a value that is not one of the options, naming them', () => {
    registerBlock(Sided());
    const r = validateBlockData('sided', { side: 'Left' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/left/);
    expect(r.errors[0]).toMatch(/right/);
  });

  it('treats an unset optional select as absent, not as invalid', () => {
    registerBlock(Sided());
    expect(validateBlockData('sided', { side: '' }).ok).toBe(true);
  });

  it('still enforces required', () => {
    registerBlock(Sided({ required: true }));
    expect(validateBlockData('sided', { side: '' }).ok).toBe(false);
  });

  it('defaults to the declared default, or to the first option', () => {
    registerBlock(Sided());
    expect(defaultBlockData('sided')).toEqual({ side: 'right' });
    resetRegistry();
    registerBlock(Sided({ default: undefined }));
    expect(defaultBlockData('sided')).toEqual({ side: 'left' });
  });

  it('refuses a select with no options — an unauthorable field', () => {
    expect(() => registerBlock({
      type: 'no-options', label: 'N',
      fields: [{ name: 'side', type: 'select', label: 'Side' }],
      Component: () => null,
    })).toThrow(/options/i);
  });

  it('refuses an option with no value or no label', () => {
    expect(() => registerBlock({
      type: 'bad-option', label: 'B',
      fields: [{ name: 'side', type: 'select', label: 'Side', options: [{ value: 'left' }] }],
      Component: () => null,
    })).toThrow(/option/i);
  });

  it('refuses options declared on a field that is not a select', () => {
    expect(() => registerBlock({
      type: 'not-a-select', label: 'N',
      fields: [{ name: 'heading', type: 'text', label: 'H', options: [{ value: 'a', label: 'A' }] }],
      Component: () => null,
    })).toThrow(/select/i);
  });
});
