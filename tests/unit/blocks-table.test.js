// tests/unit/blocks-table.test.js
//
// The shaping rules behind data-table and map-pin-list. These are pure so the
// awkward cases — a short row, an extra cell, a coordinate someone typed as a
// string, a row that is not a row at all — can be pinned down without a DOM.
import { describe, it, expect } from 'vitest';
import { normaliseTable } from '../../lib/blocks/table.js';
import { formatCoordinates } from '../../lib/blocks/coords.js';
import { listItems } from '../../lib/blocks/items.js';

describe('normaliseTable', () => {
  it('accepts columns as bare strings or as objects', () => {
    const t = normaliseTable({ columns: ['Class', { label: 'Amount', numeric: true }], rows: [] });
    expect(t.columns).toEqual([
      { label: 'Class', numeric: false },
      { label: 'Amount', numeric: true },
    ]);
  });

  it('accepts a row as an array of cells or as { cells }', () => {
    const t = normaliseTable({
      columns: ['A', 'B'],
      rows: [['1', '2'], { cells: ['3', '4'] }],
    });
    expect(t.rows).toEqual([['1', '2'], ['3', '4']]);
  });

  it('pads a short row and truncates a long one so every row matches the header count', () => {
    const t = normaliseTable({ columns: ['A', 'B', 'C'], rows: [['1'], ['1', '2', '3', '4']] });
    expect(t.rows).toEqual([['1', '', ''], ['1', '2', '3']]);
  });

  it('coerces numbers and blanks anything that is not a printable cell', () => {
    const t = normaliseTable({ columns: ['A', 'B', 'C', 'D'], rows: [[150, null, { x: 1 }, undefined]] });
    expect(t.rows).toEqual([['150', '', '', '']]);
  });

  it('drops a row that is neither an array nor a { cells } object', () => {
    const t = normaliseTable({ columns: ['A'], rows: ['nope', 42, null, ['keep']] });
    expect(t.rows).toEqual([['keep']]);
  });

  it('yields nothing at all when no column headers are declared', () => {
    // A table with no headers cannot be read by a screen reader, so it is not
    // rendered as a half-table — the block renders nothing and the operator
    // sees an empty block in preview.
    expect(normaliseTable({ columns: [], rows: [['1', '2']] })).toEqual({ columns: [], rows: [] });
    expect(normaliseTable({ columns: 'nope', rows: [['1']] })).toEqual({ columns: [], rows: [] });
    expect(normaliseTable(null)).toEqual({ columns: [], rows: [] });
  });

  it('survives a rows value that is not an array', () => {
    expect(normaliseTable({ columns: ['A'], rows: 'nope' }).rows).toEqual([]);
  });
});

describe('formatCoordinates', () => {
  it('formats a numeric pair', () => {
    expect(formatCoordinates(23.9012, 90.4123)).toBe('23.9012, 90.4123');
  });

  it('accepts strings, because the admin posts every field as text', () => {
    expect(formatCoordinates('23.9012', '90.4123')).toBe('23.9012, 90.4123');
  });

  it('rounds to six decimals and drops trailing zeros', () => {
    expect(formatCoordinates(23.900000, 90.1234567)).toBe('23.9, 90.123457');
  });

  it('returns nothing for a pair that is not a real place on earth', () => {
    expect(formatCoordinates(91, 0)).toBe('');
    expect(formatCoordinates(0, 181)).toBe('');
    expect(formatCoordinates('', 90)).toBe('');
    expect(formatCoordinates(null, null)).toBe('');
    expect(formatCoordinates('north', 'east')).toBe('');
    expect(formatCoordinates(23.9, undefined)).toBe('');
  });

  it('treats 0,0 as unset rather than as the Gulf of Guinea', () => {
    expect(formatCoordinates(0, 0)).toBe('');
  });
});

describe('listItems', () => {
  it('keeps only the plain objects in a list field', () => {
    expect(listItems([{ a: 1 }, null, 'x', 3, ['y'], { b: 2 }])).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('returns an empty array for anything that is not a list', () => {
    expect(listItems(null)).toEqual([]);
    expect(listItems('nope')).toEqual([]);
    expect(listItems(undefined)).toEqual([]);
  });
});
