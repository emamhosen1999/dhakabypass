import { describe, it, expect } from 'vitest';
import { bucketHistory, hasEnough, dayTypeOf, HOURS } from '../../lib/corridor/history.js';

// 09:00 Dhaka on a Wednesday (UTC+6, no daylight saving).
const wed9 = (offsetDays = 0) => new Date(Date.UTC(2026, 8, 16 - offsetDays, 3, 0));
// 22:00 Dhaka on a Friday.
const fri22 = (offsetWeeks = 0) => new Date(Date.UTC(2026, 8, 18 - offsetWeeks * 7, 16, 0));

const row = (section_id, measured_at, avg_speed_kmh, condition_key = 'free') => ({
  section_id, measured_at, avg_speed_kmh, condition_key,
});

describe('bucketHistory', () => {
  it('puts a measurement in its Dhaka hour, on the Bangladeshi weekend split', () => {
    expect(dayTypeOf('Fri')).toBe('weekend');
    expect(dayTypeOf('Sat')).toBe('weekend');
    expect(dayTypeOf('Sun')).toBe('weekday');
    const rows = [row(1, wed9(), 70), row(1, wed9(1), 80), row(1, wed9(2), 75)];
    const b = bucketHistory(rows, { minSamples: 3 });
    const cell = b.sections.get(1).weekday[9];
    expect(cell).toEqual({ n: 3, speed: 75, condition: 'free' });
    expect(b.sections.get(1).weekend[9]).toBeNull();
    expect(b.samples).toBe(3);
  });

  it('shows nothing for a cell under the minimum', () => {
    const rows = [row(1, wed9(), 70), row(1, wed9(1), 80)];
    const b = bucketHistory(rows, { minSamples: 3 });
    expect(b.sections.get(1).weekday[9]).toBeNull();
    expect(hasEnough(b)).toBe(false);
    expect(hasEnough(bucketHistory(rows, { minSamples: 2 }))).toBe(true);
  });

  it('takes the median speed and the condition most readings agreed on, worse on a tie', () => {
    const rows = [
      row(2, fri22(), 30, 'heavy'), row(2, fri22(1), 90, 'free'), row(2, fri22(2), 60, 'slow'), row(2, fri22(3), 62, 'slow'),
    ];
    const cell = bucketHistory(rows, { minSamples: 1 }).sections.get(2).weekend[22];
    expect(cell.speed).toBe(61);
    expect(cell.condition).toBe('slow');
    const tie = bucketHistory([row(3, fri22(), 30, 'heavy'), row(3, fri22(1), 90, 'free')], { minSamples: 1 });
    expect(tie.sections.get(3).weekend[22].condition).toBe('heavy');
  });

  it('ignores rows with no usable speed, date or section', () => {
    const b = bucketHistory([
      row(1, wed9(), null), row(1, wed9(), 0), row(1, 'not a date', 50), row('x', wed9(), 50), null, row(1, wed9(), 50, 'nonsense'),
    ], { minSamples: 1 });
    expect(b.samples).toBe(1);
    expect(b.sections.get(1).weekday[9].condition).toBe('unknown');
  });

  it('records the span of measurements it used', () => {
    const b = bucketHistory([row(1, wed9(5), 50), row(1, wed9(), 50)], { minSamples: 1 });
    expect(b.from.getTime()).toBe(wed9(5).getTime());
    expect(b.to.getTime()).toBe(wed9().getTime());
    expect(HOURS).toHaveLength(24);
  });

  it('is empty for no rows', () => {
    const b = bucketHistory([]);
    expect(b.sections.size).toBe(0);
    expect(hasEnough(b)).toBe(false);
  });
});
