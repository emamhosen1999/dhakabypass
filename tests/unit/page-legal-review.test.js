// W8C.2: a commitment page stays marked "under review" until someone is named
// as having approved it; the notice itself is a ui string in every language.
import { describe, it, expect } from 'vitest';
import { parsePageSettings } from '../../lib/content/page-settings.js';
import { UI } from '../../lib/i18n/ui.js';

function form(extra) {
  const fd = new FormData();
  fd.set('slug', 'privacy');
  fd.set('status', 'published');
  for (const l of ['en', 'bn', 'zh']) fd.set(`title_${l}`, `Privacy ${l}`);
  for (const [k, v] of Object.entries(extra)) fd.set(k, v);
  return fd;
}
const current = { slug: 'privacy', status: 'published', legal_status: 'review' };

describe('legal review state', () => {
  it('keeps the current state when the form omits it', () => {
    expect(parsePageSettings(form({}), current).legalStatus).toBe('review');
  });
  it('refuses approval without a named approver', () => {
    expect(() => parsePageSettings(form({ legal_status: 'approved' }), current)).toThrow(/approved/i);
  });
  it('accepts approval with an approver', () => {
    const out = parsePageSettings(form({ legal_status: 'approved', legal_approved_by: 'Company Secretary' }), current);
    expect(out).toMatchObject({ legalStatus: 'approved', legalApprovedBy: 'Company Secretary' });
  });
  it('rejects an unknown state', () => {
    expect(() => parsePageSettings(form({ legal_status: 'maybe' }), current)).toThrow();
  });
  it('has the public notice in every language', () => {
    for (const l of ['en', 'bn', 'zh']) {
      expect(UI[l].legalReviewTag).toBeTruthy();
      expect(UI[l].legalReviewBody).toBeTruthy();
    }
  });
});
