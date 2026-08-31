import { describe, it, expect } from 'vitest';
import { summarizeTranslations } from '../../lib/content/summary.js';

const en = (s = 'published') => ({ locale: 'en', data: {}, status: s });
const bn = (s) => ({ locale: 'bn', data: {}, status: s });

describe('summarizeTranslations', () => {
  it('counts blocks still needing each locale', () => {
    const [row] = summarizeTranslations([{
      id: 1, slug: 'travel', title: 'Travel Info',
      blocks: [
        { id: 1, translations: [en(), bn('published')] },
        { id: 2, translations: [en()] },
        { id: 3, translations: [en(), bn('draft')] },
      ],
    }]);
    expect(row).toMatchObject({ pageId: 1, slug: 'travel', total: 3 });
    expect(row.missing.bn).toBe(2);
    expect(row.missing.zh).toBe(3);
  });

  it('handles a page with no blocks', () => {
    const [row] = summarizeTranslations([{ id: 9, slug: 'empty', title: 'Empty', blocks: [] }]);
    expect(row.total).toBe(0);
    expect(row.missing.bn).toBe(0);
  });

  it('returns an empty array for no pages', () => {
    expect(summarizeTranslations([])).toEqual([]);
  });
});
