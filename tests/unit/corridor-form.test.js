import { describe, it, expect } from 'vitest';
import { parseChainageField, localeMap } from '../../lib/corridor/form.js';

describe('parseChainageField', () => {
  it("accepts the engineers' notation", () => {
    expect(parseChainageField('K3+900')).toBe(3900);
    expect(parseChainageField('k21+900')).toBe(21900);
  });

  it('accepts a plain metre count', () => {
    expect(parseChainageField('3900')).toBe(3900);
  });

  it('throws a message that tells the editor the format', () => {
    expect(() => parseChainageField('three km')).toThrow(/K3\+900/);
    expect(() => parseChainageField('')).toThrow(/K3\+900/);
    expect(() => parseChainageField(null)).toThrow(/K3\+900/);
  });

  it('rejects a malformed metre part rather than guessing', () => {
    expect(() => parseChainageField('K3+9000')).toThrow(/K3\+900/);
  });

  it("marks its throw with code 'VALIDATION' so the action layer lets it through", () => {
    // parseChainageField throws BEFORE the actions' try/catch, so it reaches
    // the caller either way — but the marking has to hold, because the rule
    // "a message an editor sees is one we marked" must be uniform.
    let caught;
    try { parseChainageField('three km'); } catch (e) { caught = e; }
    expect(caught.code).toBe('VALIDATION');
  });
});

function form(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe('localeMap', () => {
  it('collects the three per-locale fields under one prefix', () => {
    const fd = form({ 'class.en': 'Car', 'class.bn': 'গাড়ি', 'class.zh': '小汽车' });
    expect(localeMap(fd, 'class')).toEqual({ en: 'Car', bn: 'গাড়ি', zh: '小汽车' });
  });

  it('drops empty and whitespace-only values instead of storing ""', () => {
    // The readers fall back to English on a missing OR empty key, so an empty
    // string would only bloat the JSON column.
    const fd = form({ 'label.en': 'Vogra to K21', 'label.bn': '', 'label.zh': '   ' });
    expect(localeMap(fd, 'label')).toEqual({ en: 'Vogra to K21' });
  });

  it('trims surrounding whitespace', () => {
    expect(localeMap(form({ 'name.en': '  Mirer Bazar  ' }), 'name')).toEqual({ en: 'Mirer Bazar' });
  });

  it('returns {} when the form carries no field for the prefix', () => {
    expect(localeMap(form({ 'other.en': 'x' }), 'message')).toEqual({});
  });

  it('reads only its own prefix, not one that merely starts with it', () => {
    const fd = form({ 'class.en': 'Car', 'class_order.en': '1' });
    expect(localeMap(fd, 'class')).toEqual({ en: 'Car' });
  });

  it('never returns a prototype-polluting key, because the keys are ours', () => {
    // The locale list is a fixed allowlist from lib/i18n/locales.js, so a
    // forged field name cannot introduce a key here at all.
    const fd = form({ 'name.constructor': 'boom', 'name.__proto__': 'boom', 'name.en': 'ok' });
    expect(localeMap(fd, 'name')).toEqual({ en: 'ok' });
  });
});
