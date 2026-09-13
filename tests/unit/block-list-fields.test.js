import { describe, it, expect, beforeEach } from 'vitest';
import { registerBlock, resetRegistry, getBlock } from '../../lib/blocks/registry.js';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import { parseBlockForm } from '../../lib/blocks/form.js';
import { listItemFields, emptyListItem, normalizeListItems } from '../../lib/blocks/list.js';

beforeEach(() => { resetRegistry(); registerAllBlocks(); });

function form(entries) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const listField = (type, name) => getBlock(type).fields.find((f) => f.name === name);
const names = (type, name) => listItemFields(listField(type, name)).map((f) => f.name);

/**
 * W1.2 — every `list` field that ships today declares the shape of one row,
 * so the admin gets a repeater instead of a JSON textarea. The shapes below
 * are the ones actually present in `db/sql/02-seed.sql` and
 * `db/sql/03-content-recovery.sql` (extracted, not guessed).
 */
describe('list fields declare their row shape', () => {
  it('card-grid.items is title / kicker / body plus an optional image', () => {
    // W1.22 added `image`: several W3/W4 pages need a mark or photograph per
    // card, and a card grid that cannot carry one forces a second block type.
    expect(names('card-grid', 'items')).toEqual(['title', 'meta', 'body', 'image']);
  });

  it('figure-grid.items is an image plus a caption', () => {
    expect(names('figure-grid', 'items')).toEqual(['image', 'caption']);
    expect(listItemFields(listField('figure-grid', 'items'))[0].type).toBe('image');
  });

  it('stat-row.stats is a live source or a typed value / unit / label', () => {
    expect(names('stat-row', 'stats')).toEqual(['source', 'value', 'unit', 'label']);
  });

  it('partner-row.items is name / logo / role / share plus an optional link', () => {
    // W1.22 added `href`: a partner named without a link is a dead end on a
    // disclosure page where the reader is checking who the sponsor is.
    // W1.27 added `logo`, an optional image: the name is always printed, so
    // a partner without a mark (SEL) is a typographic credit, not a hole.
    expect(names('partner-row', 'items')).toEqual(['name', 'logo', 'role', 'share', 'href']);
    const logo = getBlock('partner-row').fields.find((f) => f.name === 'items').itemFields.find((f) => f.name === 'logo');
    expect(logo.type).toBe('image');
    expect(logo.required).toBeFalsy();
  });

  it('toll-preview.classes is a list of plain strings, not objects', () => {
    const field = listField('toll-preview', 'classes');
    expect(listItemFields(field)).toBeNull();
    expect(field.itemType).toBe('text');
  });
});

describe('registerBlock validates itemFields', () => {
  const def = (fields) => ({ type: 'x-test', label: 'X', fields, Component() { return null; } });

  it('rejects an itemFields entry with an unknown type', () => {
    expect(() => registerBlock(def([
      { name: 'items', type: 'list', label: 'Items', itemFields: [{ name: 'a', type: 'wat', label: 'A' }] },
    ]))).toThrow(/unknown type/i);
  });

  it('rejects an itemFields entry with no name', () => {
    expect(() => registerBlock(def([
      { name: 'items', type: 'list', label: 'Items', itemFields: [{ type: 'text', label: 'A' }] },
    ]))).toThrow(/name/i);
  });

  it('rejects itemFields on a field that is not a list', () => {
    expect(() => registerBlock(def([
      { name: 'heading', type: 'text', label: 'H', itemFields: [{ name: 'a', type: 'text', label: 'A' }] },
    ]))).toThrow(/list/i);
  });

  it('accepts a well-formed declaration', () => {
    expect(() => registerBlock(def([
      { name: 'items', type: 'list', label: 'Items', itemFields: [{ name: 'a', type: 'text', label: 'A' }] },
    ]))).not.toThrow();
  });
});

describe('emptyListItem', () => {
  it('builds a blank row from the declared shape', () => {
    expect(emptyListItem(listField('stat-row', 'stats'))).toEqual({ source: '', value: '', unit: '', label: '' });
  });

  it('returns an empty string for a scalar list', () => {
    expect(emptyListItem(listField('toll-preview', 'classes'))).toBe('');
  });
});

describe('normalizeListItems', () => {
  const stats = () => listField('stat-row', 'stats');

  it('keeps existing rows exactly as seeded', () => {
    const rows = [{ value: '48', unit: 'KM', label: 'Corridor' }];
    expect(normalizeListItems(stats(), rows)).toEqual(rows);
  });

  it('preserves keys the block type does not declare, so no data is lost', () => {
    const rows = [{ value: '48', unit: 'KM', label: 'Corridor', legacyNote: 'keep me' }];
    expect(normalizeListItems(stats(), rows)[0].legacyNote).toBe('keep me');
  });

  it('drops rows where every declared field is empty', () => {
    const rows = [{ value: '', unit: '', label: '' }, { value: '48', unit: '', label: 'x' }];
    expect(normalizeListItems(stats(), rows)).toHaveLength(1);
  });

  it('keeps a live-source row with no typed value, and refuses an unknown source', () => {
    expect(normalizeListItems(stats(), [{ source: 'corridor-open-length', label: 'Open' }])[0].source).toBe('corridor-open-length');
    expect(normalizeListItems(stats(), [{ source: 'made-up', value: '1', label: 'x' }])[0].source).toBe('');
  });

  it('drops non-object rows from an object list', () => {
    expect(normalizeListItems(stats(), ['nope', null, 7])).toEqual([]);
  });

  it('coerces declared number sub-fields', () => {
    const field = { name: 'items', type: 'list', label: 'I', itemFields: [{ name: 'n', type: 'number', label: 'N' }] };
    expect(normalizeListItems(field, [{ n: '12' }])).toEqual([{ n: 12 }]);
  });

  it('coerces a scalar list to non-empty strings', () => {
    const field = listField('toll-preview', 'classes');
    expect(normalizeListItems(field, ['car', '', 'bus', null])).toEqual(['car', 'bus']);
  });

  it('leaves a list with no declared shape alone', () => {
    const field = { name: 'items', type: 'list', label: 'I' };
    expect(normalizeListItems(field, [{ anything: 1 }, 'x'])).toEqual([{ anything: 1 }, 'x']);
  });

  it('returns an empty array for a non-array value', () => {
    expect(normalizeListItems(stats(), 'not a list')).toEqual([]);
  });
});

describe('parseBlockForm with declared row shapes', () => {
  it('still reads a legacy JSON payload for a list field', () => {
    const stats = JSON.stringify([{ value: '48', unit: 'KM', label: 'Corridor' }]);
    expect(parseBlockForm('stat-row', form({ 'f.stats': stats })).stats)
      .toEqual([{ value: '48', unit: 'KM', label: 'Corridor' }]);
  });

  it('drops blank repeater rows the operator never filled in', () => {
    const stats = JSON.stringify([{ value: '48', unit: 'KM', label: 'Corridor' }, { value: '', unit: '', label: '' }]);
    expect(parseBlockForm('stat-row', form({ 'f.stats': stats })).stats).toHaveLength(1);
  });

  it('drops empty entries from a scalar list', () => {
    const classes = JSON.stringify(['car', '', 'truck']);
    expect(parseBlockForm('toll-preview', form({ 'f.classes': classes })).classes).toEqual(['car', 'truck']);
  });

  it('still falls back to an empty list when the JSON is broken', () => {
    expect(parseBlockForm('stat-row', form({ 'f.stats': 'not json' })).stats).toEqual([]);
  });
});

describe('parseBlockForm sanitises richtext on the way in', () => {
  it('strips a script from a richtext field', () => {
    const data = parseBlockForm('rich-text', form({ 'f.body': '<p>ok</p><script>alert(1)</script>' }));
    expect(data.body).toBe('<p>ok</p>');
  });

  it('keeps the db-pending convention intact', () => {
    const html = '<p class="db-pending"><span class="db-pending-tag">Not yet published</span>Soon.</p>';
    expect(parseBlockForm('rich-text', form({ 'f.body': html })).body).toBe(html);
  });

  it('does not sanitise plain text fields, which are escaped by React anyway', () => {
    expect(parseBlockForm('rich-text', form({ 'f.heading': 'A < B & C' })).heading).toBe('A < B & C');
  });
});

/**
 * W1.22 — the asymmetry this closes: `richtext` was sanitised only as a
 * top-level field, while four blocks (person.bio, faq.answer,
 * timeline.description, tabs.body) hand ROW-level HTML to
 * dangerouslySetInnerHTML. Row rich text now passes through the same single
 * sanitizeHtml call in lib/blocks/form.js — one chokepoint, not two paths.
 */
describe('parseBlockForm sanitises richtext inside list rows', () => {
  const rows = (fields) => ({
    type: 'x-rows', label: 'X', fields, Component() { return null; },
  });

  beforeEach(() => {
    registerBlock(rows([
      {
        name: 'items', type: 'list', label: 'Items',
        itemFields: [
          { name: 'q', type: 'text', label: 'Q' },
          { name: 'a', type: 'richtext', label: 'A' },
        ],
      },
    ]));
  });

  const items = (value) => parseBlockForm('x-rows', form({ 'f.items': JSON.stringify(value) })).items;

  it('strips a script from a row-level richtext sub-field', () => {
    expect(items([{ q: 'How is the toll set?', a: '<p>By gazette.</p><script>alert(1)</script>' }])[0].a)
      .toBe('<p>By gazette.</p>');
  });

  it('strips an event handler and a javascript: link from a row', () => {
    const out = items([{ q: 'x', a: '<p onclick="steal()">hi</p><a href="javascript:alert(1)">go</a>' }])[0].a;
    expect(out).not.toMatch(/onclick/i);
    expect(out).not.toMatch(/javascript:/i);
  });

  it('leaves the plain-text sub-field beside it untouched', () => {
    expect(items([{ q: 'A < B & C', a: '<p>x</p>' }])[0].q).toBe('A < B & C');
  });

  it('keeps the db-pending convention inside a row, exactly as at top level', () => {
    const html = '<p class="db-pending"><span class="db-pending-tag">Not yet published</span>Soon.</p>';
    expect(items([{ q: 'x', a: html }])[0].a).toBe(html);
  });

  it('sanitises every row, not just the first', () => {
    const out = items([
      { q: 'a', a: '<p>one</p><script>a()</script>' },
      { q: 'b', a: '<p>two</p><script>b()</script>' },
    ]);
    expect(out.map((r) => r.a)).toEqual(['<p>one</p>', '<p>two</p>']);
  });

  it('sanitises the real blocks that render row HTML', () => {
    const evil = '<p>ok</p><script>alert(1)</script>';
    expect(parseBlockForm('faq', form({ 'f.items': JSON.stringify([{ question: 'q', answer: evil }]) }))
      .items[0].answer).toBe('<p>ok</p>');
    expect(parseBlockForm('person-card', form({ 'f.people': JSON.stringify([{ name: 'A', bio: evil }]) }))
      .people[0].bio).toBe('<p>ok</p>');
    expect(parseBlockForm('timeline', form({ 'f.items': JSON.stringify([{ title: 'T', description: evil }]) }))
      .items[0].description).toBe('<p>ok</p>');
    expect(parseBlockForm('tabs', form({ 'f.items': JSON.stringify([{ label: 'L', body: evil }]) }))
      .items[0].body).toBe('<p>ok</p>');
  });
});

/**
 * A nested scalar list inside a row: the cells of one data-table row, and the
 * amenity tags on a rest-area pin. A flat object of scalars cannot express a
 * variable-width row.
 */
describe('normalizeListItems with a nested list sub-field', () => {
  const field = {
    name: 'rows', type: 'list', label: 'Rows',
    itemFields: [{ name: 'cells', type: 'list', label: 'Cells' }],
  };

  it('keeps every cell, blanks included, so no value shifts column', () => {
    expect(normalizeListItems(field, [{ cells: ['Car', '', '150'] }]))
      .toEqual([{ cells: ['Car', '', '150'] }]);
  });

  it('coerces a numeric cell and blanks anything that is not printable', () => {
    expect(normalizeListItems(field, [{ cells: [150, null, { x: 1 }] }]))
      .toEqual([{ cells: ['150', '', ''] }]);
  });

  it('drops a row whose cells are all blank', () => {
    expect(normalizeListItems(field, [{ cells: ['', ''] }, { cells: ['x'] }]))
      .toEqual([{ cells: ['x'] }]);
  });

  it('yields an empty list for a row whose cells are not a list at all', () => {
    expect(normalizeListItems(field, [{ cells: 'nope' }, { cells: ['x'] }]))
      .toEqual([{ cells: ['x'] }]);
  });

  it('adopts a row authored as a bare array rather than dropping it', () => {
    // lib/blocks/table.js accepts both `['Car', '150']` and
    // `{ cells: ['Car', '150'] }`, and the seed files write the first. An
    // object list normally drops a non-object row, which would mean the
    // operator's first save of a seeded toll table silently emptied it.
    expect(normalizeListItems(field, [['Car', '150'], { cells: ['Bus', '310'] }]))
      .toEqual([{ cells: ['Car', '150'] }, { cells: ['Bus', '310'] }]);
  });

  it('still drops a bare array row from a list whose rows are ordinary objects', () => {
    const stats = listField('stat-row', 'stats');
    expect(normalizeListItems(stats, [['48', 'KM', 'Corridor']])).toEqual([]);
  });
});

describe('emptyListItem with the W1.22 sub-types', () => {
  it('starts a nested list empty and a richtext blank', () => {
    expect(emptyListItem({
      name: 'items', type: 'list', label: 'I',
      itemFields: [
        { name: 'a', type: 'richtext', label: 'A' },
        { name: 'cells', type: 'list', label: 'C' },
        { name: 'n', type: 'number', label: 'N' },
      ],
    })).toEqual({ a: '', cells: [], n: 0 });
  });
});
