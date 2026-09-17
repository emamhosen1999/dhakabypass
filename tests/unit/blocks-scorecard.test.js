import { describe, it, expect } from 'vitest';
import { parseIsoDate, termProgress, scorecardRows } from '../../lib/blocks/scorecard.js';

describe('parseIsoDate', () => {
  it('accepts only a real ISO calendar date', () => {
    expect(parseIsoDate('2018-12-06').toISOString()).toBe('2018-12-06T00:00:00.000Z');
    for (const bad of ['6/12/2018', '2018-13-01', '2018-02-30', '2018-12-6', '', null, 20181206]) {
      expect(parseIsoDate(bad), String(bad)).toBeNull();
    }
  });
});

describe('termProgress', () => {
  const now = new Date('2026-09-17T00:00:00Z');

  it('counts the days each side of today', () => {
    const p = termProgress('2018-12-06', '2043-12-05', now);
    expect(p.state).toBe('running');
    expect(p.totalDays).toBe(9130);
    expect(p.elapsedDays).toBe(2842);
    expect(p.remainingDays).toBe(6288);
    expect(p.percent).toBe(31.1);
  });

  it('clamps a term not yet begun to 0 and a finished one to 100', () => {
    expect(termProgress('2030-01-01', '2040-01-01', now)).toMatchObject({ state: 'before', percent: 0, elapsedDays: 0 });
    expect(termProgress('2000-01-01', '2010-01-01', now)).toMatchObject({ state: 'ended', percent: 100, remainingDays: 0 });
  });

  it('is null without two parseable dates in order', () => {
    expect(termProgress('', '2043-12-05', now)).toBeNull();
    expect(termProgress('2043-12-05', '2018-12-06', now)).toBeNull();
    expect(termProgress('2018-12-06', '2018-12-06', now)).toBeNull();
  });
});

describe('scorecardRows', () => {
  it('keeps rows with an indicator and trims everything', () => {
    const rows = scorecardRows([
      { indicator: ' Availability ', target: ' 99 ', actual: '', unit: '%' },
      { indicator: '', target: '1' },
      'not a row',
      null,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ indicator: 'Availability', target: '99', actual: '', unit: '%', asOf: '', source: '', sourceHref: '' });
  });
});
