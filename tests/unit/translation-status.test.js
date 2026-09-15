import { describe, it, expect } from 'vitest';
import { shapeRow, SOURCES } from '../../lib/admin/translation-status.js';

describe('translation status (audit T1)', () => {
  it('covers every kind of three-language content', () => {
    expect(SOURCES.map((s) => s.label)).toEqual(expect.arrayContaining(['Page blocks', 'News articles', 'Menu links', 'Interchanges and plazas', 'Picture descriptions']));
  });

  it('splits records into published, draft and missing without exceeding the total', () => {
    const r = shapeRow({ label: 'x', href: '/', drafts: true }, { total: 10, bn_published: 6, bn_draft: 3, zh_published: 12, zh_draft: 4 });
    expect(r.langs.bn).toEqual({ published: 6, draft: 3, missing: 1 });
    expect(r.langs.zh).toEqual({ published: 10, draft: 0, missing: 0 });
  });

  it('ignores draft counts for sources that have no drafts', () => {
    const r = shapeRow({ label: 'x', href: '/', drafts: false }, { total: 4, bn_published: 1, bn_draft: 2 });
    expect(r.langs.bn).toEqual({ published: 1, draft: 0, missing: 3 });
  });
});
