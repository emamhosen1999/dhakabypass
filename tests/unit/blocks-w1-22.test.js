// tests/unit/blocks-w1-22.test.js
//
// W1.22: the ten block types W3-W5 cannot ship without. These assertions are
// about the CONTRACT the admin panel derives its form from — field names,
// field types, what is required — because a page authored against a field
// name is broken forever if that name changes.
import { describe, it, expect, beforeAll } from 'vitest';
import { getBlock, validateBlockData, defaultBlockData, allBlocks } from '../../lib/blocks/registry.js';

beforeAll(async () => { await import('../../lib/blocks/index.js'); });

const NEW_TYPES = [
  'person-card', 'document-list', 'faq', 'data-table', 'timeline',
  'tabs', 'contact-directory', 'map-pin-list', 'stat-dashboard', 'logo-row',
];

const fieldMap = (type) => Object.fromEntries(getBlock(type).fields.map((f) => [f.name, f]));

describe('the ten new block types', () => {
  it.each(NEW_TYPES)('registers %s with a label and a component', (type) => {
    const def = getBlock(type);
    expect(def).toBeTruthy();
    expect(typeof def.label).toBe('string');
    expect(def.label.length).toBeGreaterThan(0);
    expect(typeof def.Component).toBe('function');
  });

  it('leaves the original nine registered', () => {
    for (const t of ['hero', 'media-prose', 'figure-grid', 'card-grid', 'cta-band',
      'partner-row', 'toll-preview', 'rich-text', 'stat-row']) {
      expect(getBlock(t)).toBeTruthy();
    }
    // 19 after W1.22's ten; 22 after the three live corridor blocks
    // (toll-table, traffic-status, interchange-table) of build-order item 6;
    // 23 after INT.1's toll-matrix; 24 after INT.2's toll-calculator.
    // The number is here as a guard against a type silently disappearing from
    // lib/blocks/index.js, so it moves with a deliberate addition and only then.
    expect(allBlocks()).toHaveLength(34);
  });

  it.each(NEW_TYPES)('gives %s a default record covering every declared field', (type) => {
    const def = getBlock(type);
    const d = defaultBlockData(type);
    for (const f of def.fields) expect(d).toHaveProperty(f.name);
  });

  it.each(NEW_TYPES)('declares a row shape for every list field on %s', (type) => {
    // itemFields is what lets the admin render a real row editor instead of a
    // JSON textarea. A list field with no declared shape is unauthorable.
    for (const f of getBlock(type).fields) {
      if (f.type !== 'list') continue;
      expect(Array.isArray(f.itemFields), `${type}.${f.name} needs itemFields`).toBe(true);
      expect(f.itemFields.length).toBeGreaterThan(0);
      for (const item of f.itemFields) {
        expect(typeof item.name).toBe('string');
        expect(typeof item.label).toBe('string');
        expect(['text', 'richtext', 'image', 'number', 'list']).toContain(item.type);
      }
    }
  });
});

describe('person-card', () => {
  it('takes a list of people with photo, name, role, bio and affiliation', () => {
    const people = fieldMap('person-card').people;
    expect(people.type).toBe('list');
    const names = people.itemFields.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['photo', 'name', 'role', 'bio', 'affiliation']));
    expect(people.itemFields.find((f) => f.name === 'photo').type).toBe('image');
    expect(people.itemFields.find((f) => f.name === 'bio').type).toBe('richtext');
  });

  it('accepts a full record', () => {
    expect(validateBlockData('person-card', {
      heading: 'Board of Directors', intro: '',
      people: [{ photo: '/media/chair.webp', name: 'A. Rahman', role: 'Chairman', bio: '<p>x</p>', affiliation: 'SRBG' }],
    })).toEqual({ ok: true, errors: [] });
  });

  it('rejects a non-array people value', () => {
    expect(validateBlockData('person-card', { heading: 'Board', people: 'nope' }).ok).toBe(false);
  });
});

describe('document-list', () => {
  it('carries title, description, file, file type, size and date per document', () => {
    const docs = fieldMap('document-list').documents;
    expect(docs.type).toBe('list');
    expect(docs.itemFields.map((f) => f.name))
      .toEqual(expect.arrayContaining(['title', 'description', 'file', 'fileType', 'fileSize', 'date']));
  });

  it('accepts a full record', () => {
    expect(validateBlockData('document-list', {
      heading: 'Downloads', intro: '',
      documents: [{ title: 'Toll rate card', description: '', file: '/uploads/toll.pdf', fileType: 'PDF', fileSize: '240 KB', date: '6 September 2026' }],
    }).ok).toBe(true);
  });
});

describe('faq', () => {
  it('takes question and answer pairs', () => {
    const items = fieldMap('faq').items;
    expect(items.type).toBe('list');
    expect(items.itemFields.map((f) => f.name)).toEqual(expect.arrayContaining(['question', 'answer']));
    expect(items.itemFields.find((f) => f.name === 'answer').type).toBe('richtext');
  });
});

describe('data-table', () => {
  it('requires a caption, because a table with no caption is unusable to a screen reader', () => {
    expect(fieldMap('data-table').caption.required).toBe(true);
    expect(validateBlockData('data-table', { caption: '', columns: [], rows: [] }).ok).toBe(false);
  });

  it('takes columns and rows', () => {
    expect(fieldMap('data-table').columns.type).toBe('list');
    expect(fieldMap('data-table').rows.type).toBe('list');
    expect(validateBlockData('data-table', {
      caption: 'Toll rates in force', note: '', rowHeaderColumn: 0,
      columns: [{ label: 'Class' }, { label: 'Amount', numeric: true }],
      rows: [['Car', '150']],
    }).ok).toBe(true);
  });
});

describe('timeline', () => {
  it('takes dated entries with an optional image', () => {
    const items = fieldMap('timeline').items;
    expect(items.itemFields.map((f) => f.name))
      .toEqual(expect.arrayContaining(['date', 'title', 'description', 'image']));
    expect(items.itemFields.find((f) => f.name === 'image').type).toBe('image');
  });
});

describe('tabs', () => {
  it('takes labelled panels', () => {
    const items = fieldMap('tabs').items;
    expect(items.itemFields.map((f) => f.name)).toEqual(expect.arrayContaining(['label', 'body']));
    expect(items.itemFields.find((f) => f.name === 'body').type).toBe('richtext');
  });
});

describe('contact-directory', () => {
  it('carries department, role, phone and email', () => {
    const items = fieldMap('contact-directory').items;
    expect(items.itemFields.map((f) => f.name))
      .toEqual(expect.arrayContaining(['department', 'role', 'phone', 'email']));
  });

  it('has no required item field, so a role number can be published without a person', () => {
    const items = fieldMap('contact-directory').items;
    const named = items.itemFields.find((f) => f.name === 'name');
    expect(named).toBeTruthy();
    expect(named.required).toBeFalsy();
  });
});

describe('map-pin-list', () => {
  it('carries name, type, address, coordinates and notes', () => {
    const items = fieldMap('map-pin-list').items;
    expect(items.itemFields.map((f) => f.name))
      .toEqual(expect.arrayContaining(['name', 'type', 'address', 'lat', 'lng', 'notes']));
  });
});

describe('stat-dashboard', () => {
  it('requires an as-at date, because a published statistic without one has no provenance', () => {
    expect(fieldMap('stat-dashboard').asOf.required).toBe(true);
    expect(validateBlockData('stat-dashboard', { asOf: '', stats: [] }).ok).toBe(false);
  });

  it('carries an authored source and link', () => {
    const f = fieldMap('stat-dashboard');
    expect(f.source).toBeTruthy();
    expect(f.sourceHref).toBeTruthy();
    expect(validateBlockData('stat-dashboard', {
      heading: 'Traffic', intro: '', asOfLabel: 'As at', asOf: 'August 2026',
      source: 'DBEDC toll system', sourceHref: '',
      stats: [{ value: '18,400', unit: 'AADT', label: 'Daily traffic', note: '' }],
    }).ok).toBe(true);
  });

  it('is a different type from the decorative stat-row', () => {
    expect(getBlock('stat-dashboard')).not.toBe(getBlock('stat-row'));
  });
});

describe('logo-row', () => {
  it('carries a mark, a name and an optional link per partner', () => {
    const items = fieldMap('logo-row').items;
    expect(items.itemFields.map((f) => f.name))
      .toEqual(expect.arrayContaining(['logo', 'name', 'href']));
    expect(items.itemFields.find((f) => f.name === 'logo').type).toBe('image');
  });

  it('accepts the real brand assets', () => {
    expect(validateBlockData('logo-row', {
      heading: 'Concession partners', intro: '',
      items: [
        { logo: '/brand/rhd.webp', name: 'Roads and Highways Department', href: '', role: 'Contracting authority' },
        { logo: '/brand/sdig-srbg.webp', name: 'SDIG / SRBG', href: '', role: 'Lead sponsor' },
      ],
    }).ok).toBe(true);
  });
});
