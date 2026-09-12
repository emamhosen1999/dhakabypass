import { describe, it, expect } from 'vitest';
import { pageOf, pageLinks } from '../../lib/blocks/paging.js';

describe('pageOf (INT.6)', () => {
  it('is 1 for blank, garbage, zero and negative', () => {
    for (const v of [undefined, null, '', 'two', '0', '-3', 0, NaN]) expect(pageOf(v, 100, 20), String(v)).toBe(1);
  });
  it('clamps to the last page and takes the first of a repeated parameter', () => {
    expect(pageOf('99', 100, 20)).toBe(5);
    expect(pageOf('3', 100, 20)).toBe(3);
    expect(pageOf(['4', '9'], 100, 20)).toBe(4);
    expect(pageOf('2.9', 100, 20)).toBe(2);
  });
  it('is 1 when there is nothing', () => {
    expect(pageOf('5', 0, 20)).toBe(1);
  });
});

describe('pageLinks', () => {
  it('renders nothing for a single page and every number otherwise', () => {
    expect(pageLinks(1, 24, 60)).toEqual([]);
    expect(pageLinks(1, 60, 60)).toEqual([]);
    expect(pageLinks(2, 61, 60)).toEqual([1, 2]);
    expect(pageLinks(1, 130, 24)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
