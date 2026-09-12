import { describe, it, expect } from 'vitest';
import {
  PRESENTATION, PRESENTATION_KEYS, presentationOf, presentationClasses, parsePresentationForm,
} from '../../lib/blocks/presentation.js';

const form = (o) => ({ get: (k) => (k in o ? o[k] : null) });

describe('block presentation settings (W1.15)', () => {
  it('every setting is an enum whose default is one of its options', () => {
    for (const key of PRESENTATION_KEYS) {
      const def = PRESENTATION[key];
      expect(def.options.map((o) => o.value)).toContain(def.default);
      expect(new Set(def.options.map((o) => o.value)).size).toBe(def.options.length);
    }
  });

  it('treats an unknown or missing value as the default, never as an error on a public page', () => {
    expect(presentationOf(null)).toEqual({ tone: 'default', spacing: 'normal', width: 'normal', align: 'start' });
    expect(presentationOf({ tone: 'neon', spacing: 'tight' })).toMatchObject({ tone: 'default', spacing: 'tight' });
    expect(presentationOf('garbage').tone).toBe('default');
  });

  it('emits no classes at all for defaults, so untouched pages render as before', () => {
    expect(presentationClasses({})).toBe('');
    expect(presentationClasses(null)).toBe('');
    expect(presentationClasses({ tone: 'default', width: 'normal' })).toBe('');
  });

  it('emits one class per non-default setting', () => {
    expect(presentationClasses({ tone: 'plate', width: 'full' })).toBe('db-p-tone-plate db-p-width-full');
  });

  it('parses the editor form, stores only non-defaults and names a bad control', () => {
    expect(parsePresentationForm(form({ 'p.tone': 'plate', 'p.spacing': 'normal', 'p.width': 'narrow', 'p.align': 'start' })))
      .toEqual({ ok: true, errors: [], settings: { tone: 'plate', width: 'narrow' } });
    const bad = parsePresentationForm(form({ 'p.tone': 'neon' }));
    expect(bad.ok).toBe(false);
    expect(bad.errors[0]).toMatch(/Background/);
    expect(parsePresentationForm(form({})).settings).toEqual({});
  });
});
