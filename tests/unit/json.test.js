// tests/unit/json.test.js
//
// lib/json.js is the single home for asJson() and isPlainObject(),
// consolidated from four byte-identical copies in lib/corridor/*.js (plus a
// fifth isPlainObject in lib/settings.js). The whole point of both is that a
// malformed value in ONE row degrades that row instead of throwing and taking
// down a page that renders many.

import { describe, it, expect } from 'vitest';
import { asJson, isPlainObject } from '../../lib/json.js';

describe('asJson', () => {
  it('parses a JSON string column (the MariaDB case)', () => {
    expect(asJson('{"en":"Car"}', {})).toEqual({ en: 'Car' });
    expect(asJson('["cash","card"]', [])).toEqual(['cash', 'card']);
  });

  it('passes an already-parsed value straight through (the MySQL case)', () => {
    const obj = { en: 'Car' };
    expect(asJson(obj, {})).toBe(obj);
    const arr = ['cash'];
    expect(asJson(arr, [])).toBe(arr);
  });

  it('returns the fallback for null and undefined', () => {
    expect(asJson(null, {})).toEqual({});
    expect(asJson(undefined, [])).toEqual([]);
  });

  it('returns the fallback for a string that is not JSON', () => {
    // The exact case the doc comment names: a bare scalar such as `cafe`
    // arriving unwrapped. JSON.parse throws on it; the row must survive.
    expect(asJson('cafe', {})).toEqual({});
    expect(asJson('{not json', [])).toEqual([]);
    expect(asJson('', {})).toEqual({});
  });

  it('returns the fallback given, whatever it is', () => {
    expect(asJson('nope', null)).toBeNull();
    expect(asJson('nope', 'sentinel')).toBe('sentinel');
  });

  it('passes non-string scalars through unchanged', () => {
    // Only strings are candidates for parsing; a number or boolean column is
    // already the value.
    expect(asJson(42, {})).toBe(42);
    expect(asJson(false, {})).toBe(false);
  });

  it('parses valid JSON that is not the expected shape, which is why callers still guard', () => {
    // asJson does not validate shape. `"null"` and `"[]"` are valid JSON, so
    // they parse rather than falling back — every caller pairs this with
    // isPlainObject/Array.isArray for exactly that reason.
    expect(asJson('null', { en: 'x' })).toBeNull();
    expect(asJson('[]', {})).toEqual([]);
    expect(asJson('"a string"', {})).toBe('a string');
  });
});

describe('isPlainObject', () => {
  it('accepts an object', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ en: 'Car' })).toBe(true);
  });

  it('rejects null, which typeof reports as "object"', () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it('rejects an array, so a JSON array column cannot pass as a locale map', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(['en'])).toBe(false);
  });

  it('rejects every primitive', () => {
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject('')).toBe(false);
    expect(isPlainObject('en')).toBe(false);
    expect(isPlainObject(0)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
  });
});
