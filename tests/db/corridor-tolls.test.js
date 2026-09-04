// tests/db/corridor-tolls.test.js
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB;

let T, A;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  // v5 adds the 'waypoint' kind. seed-corridor.mjs writes rows using it, so
  // omitting this migration makes the seed fail with a truncated-column error
  // and the whole file reports as SKIPPED rather than failed.
  execFileSync('node', ['scripts/db-setup-v5.mjs', `--database=${DB}`], { stdio: 'inherit' });
  // v6 adds media.original_path, which lib/media/replace.js reads and writes.
  execFileSync('node', ['scripts/db-setup-v6.mjs', `--database=${DB}`], { stdio: 'inherit' });
  T = await import('../../lib/corridor/tolls.js');
  A = await import('../../lib/corridor/advisories.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM toll_rates');
  await query('DELETE FROM advisories');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
});

describe('toll rates', () => {
  it('returns the rate in force, not every historical row', async () => {
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2025-01-01' });
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 150, effective_from: '2026-01-01' });

    const rates = await T.listTollRates({ on: new Date('2026-06-01') });
    expect(rates).toHaveLength(1);
    expect(Number(rates[0].amount_bdt)).toBe(150);
  });

  it('ignores a rate that is not yet in force', async () => {
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2025-01-01' });
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 999, effective_from: '2099-01-01' });

    const rates = await T.listTollRates({ on: new Date('2026-06-01') });
    expect(Number(rates[0].amount_bdt)).toBe(100);
  });

  it('orders by class_order, not alphabetically', async () => {
    await T.saveTollRate({ vehicle_class: 'truck', class_labels: { en: 'Truck' }, class_order: 3,
      amount_bdt: 400, effective_from: '2025-01-01' });
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2025-01-01' });

    const rates = await T.listTollRates({ on: new Date('2026-06-01') });
    expect(rates.map((r) => r.vehicle_class)).toEqual(['car', 'truck']);
  });

  it('returns nothing when no rate is in force yet', async () => {
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2099-01-01' });
    expect(await T.listTollRates({ on: new Date('2026-06-01') })).toEqual([]);
  });

  it('rejects a negative amount', async () => {
    await expect(T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' },
      class_order: 1, amount_bdt: -5, effective_from: '2025-01-01' }))
      .rejects.toThrow(/negative|zero or more/i);
  });

  it('shows every row to the admin, superseded and future included', async () => {
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 100, effective_from: '2025-01-01' });
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 150, effective_from: '2099-01-01' });
    expect(await T.listAllTollRates()).toHaveLength(2);
  });

  it('treats "today" as the Dhaka calendar date, not the UTC one', async () => {
    // 2026-06-01T19:00:00Z is still 1 June in UTC but already 01:00 on
    // 2 June in Dhaka (UTC+6). A rate effective 2026-06-02 must already be
    // in force at this instant. Computing the cutoff from toISOString()
    // (UTC) would still see 1 June and wrongly exclude it.
    await T.saveTollRate({ vehicle_class: 'car', class_labels: { en: 'Car' }, class_order: 1,
      amount_bdt: 200, effective_from: '2026-06-02' });

    const rates = await T.listTollRates({ on: new Date('2026-06-01T19:00:00Z') });
    expect(rates).toHaveLength(1);
    expect(Number(rates[0].amount_bdt)).toBe(200);
  });
});

describe('formatTaka', () => {
  it('formats with the taka sign and thousands separators', () => {
    expect(T.formatTaka(1150)).toBe('৳ 1,150');
    expect(T.formatTaka(100)).toBe('৳ 100');
    expect(T.formatTaka('250.00')).toBe('৳ 250');
  });

  it('keeps paisa only when they are non-zero', () => {
    expect(T.formatTaka(99.5)).toBe('৳ 99.50');
  });

  it('returns an empty string for a non-number', () => {
    expect(T.formatTaka(null)).toBe('');
    expect(T.formatTaka('abc')).toBe('');
  });
});

describe('advisories', () => {
  it('returns only active advisories inside their window', async () => {
    await A.saveAdvisory({ severity: 'info', messages: { en: 'Live' },
      starts_at: '2026-01-01 00:00:00', ends_at: '2027-01-01 00:00:00', is_active: 1 });
    await A.saveAdvisory({ severity: 'info', messages: { en: 'Expired' },
      starts_at: '2025-01-01 00:00:00', ends_at: '2025-02-01 00:00:00', is_active: 1 });
    await A.saveAdvisory({ severity: 'info', messages: { en: 'Switched off' },
      starts_at: null, ends_at: null, is_active: 0 });

    const live = await A.activeAdvisories({ at: new Date('2026-06-01') });
    expect(live).toHaveLength(1);
    expect(live[0].messages.en).toBe('Live');
  });

  it('treats null start and end as always-on', async () => {
    await A.saveAdvisory({ severity: 'info', messages: { en: 'Always' },
      starts_at: null, ends_at: null, is_active: 1 });
    expect(await A.activeAdvisories({ at: new Date('2026-06-01') })).toHaveLength(1);
  });

  it('puts the most severe first', async () => {
    await A.saveAdvisory({ severity: 'info', messages: { en: 'I' }, is_active: 1 });
    await A.saveAdvisory({ severity: 'closure', messages: { en: 'C' }, is_active: 1 });
    await A.saveAdvisory({ severity: 'warning', messages: { en: 'W' }, is_active: 1 });
    const live = await A.activeAdvisories({ at: new Date('2026-06-01') });
    expect(live.map((a) => a.severity)).toEqual(['closure', 'warning', 'info']);
  });

  it('reads a localised message with English fallback', () => {
    expect(A.localeMessage({ messages: { en: 'Open', bn: 'খোলা' } }, 'bn')).toBe('খোলা');
    expect(A.localeMessage({ messages: { en: 'Open' } }, 'zh')).toBe('Open');
    expect(A.localeMessage({ messages: {} }, 'en')).toBe('');
  });

  it('reads a localised message even when messages is still a raw JSON string', () => {
    // A future caller may hand localeMessage an unshaped row. Object.hasOwn
    // on a boxed string would otherwise silently resolve to '' instead of
    // parsing the JSON.
    expect(A.localeMessage({ messages: '{"en":"Open","bn":"খোলা"}' }, 'bn')).toBe('খোলা');
  });

  it('activates a closure scheduled for local Dhaka midnight immediately, not ~6 hours late', async () => {
    // 2026-06-01T19:00:00Z is still 1 June in UTC but already 01:00 on
    // 2 June in Dhaka (UTC+6). An advisory starting at local midnight on
    // 2 June must already be active at this instant. Comparing against a
    // UTC "now" would still see 1 June and wrongly treat it as not yet
    // started — a closure hidden for the first six hours of its own day.
    await A.saveAdvisory({ severity: 'closure', messages: { en: 'Bridge closed' },
      starts_at: '2026-06-02 00:00:00', ends_at: null, is_active: 1 });

    const live = await A.activeAdvisories({ at: new Date('2026-06-01T19:00:00Z') });
    expect(live).toHaveLength(1);
    expect(live[0].severity).toBe('closure');
  });
});
