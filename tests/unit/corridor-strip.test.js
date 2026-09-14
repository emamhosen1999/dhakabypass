import { describe, it, expect } from 'vitest';

describe('the strip spans the corridor, not only the recorded segments', () => {
  it('spreads markers beyond the last recorded segment instead of stacking them on the right edge', async () => {
    const { buildStripModel } = await import('../../lib/corridor/strip.js');
    const segments = [{ id: 1, from_m: 0, to_m: 35000, status: 'open', labels: {} }];
    const interchanges = [
      { id: 1, chainage_m: 34353, kind: 'toll_plaza', names: { en: 'Bhulta' } },
      { id: 2, chainage_m: 40000, kind: 'interchange', names: { en: 'Bostul' } },
      { id: 3, chainage_m: 45965, kind: 'toll_plaza', names: { en: 'Madanpur' } },
    ];
    // Without a published length the farthest interchange is the far end.
    const byInterchange = buildStripModel({ segments, interchanges }).markers.map((m) => m.leftPct);
    expect(byInterchange).toEqual([74.74, 87.02, 100]);
    // With one, the corridor's own length is.
    const spread = buildStripModel({ segments, interchanges, publishedLengthKm: 48 }).markers.map((m) => m.leftPct);
    expect(spread).toEqual([71.57, 83.33, 95.76]);
  });
});
