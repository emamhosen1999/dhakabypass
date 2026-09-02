// tests/db/corridor-seed.test.js
//
// Runs the real seed script (scripts/seed-corridor.mjs) against the
// throwaway test database and asserts on the ROWS IT ACTUALLY WROTE — not on
// the script's source — so a future edit that reintroduces a motorcycle or
// three-wheeler toll row, or breaks the class_order sequencing, fails loudly
// here instead of only being caught by someone reading the diff.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB;

let T;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/seed-corridor.mjs', `--database=${DB}`], { stdio: 'inherit' });
  T = await import('../../lib/corridor/tolls.js');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
});

describe('seeded toll table', () => {
  it('contains no motorcycle or three-wheeler vehicle class', async () => {
    const rows = await T.listAllTollRates();
    const classes = rows.map((r) => r.vehicle_class);
    const bannedPattern = /motor|cycle|three.?wheel|cng|rickshaw/i;

    expect(classes).not.toContain('motorcycle');
    for (const row of rows) {
      expect(row.vehicle_class, `vehicle_class "${row.vehicle_class}"`).not.toMatch(bannedPattern);
      expect(row.class_labels.en, `class_labels.en for "${row.vehicle_class}"`).not.toMatch(bannedPattern);
    }
  });

  it('seeds exactly the nine real vehicle classes', async () => {
    const rows = await T.listAllTollRates();
    expect(rows.map((r) => r.vehicle_class).sort()).toEqual(
      [
        'car', 'pickup', 'microbus', 'minibus', 'small_truck',
        'large_bus', 'medium_truck', 'heavy_truck', 'large_truck',
      ].sort()
    );
  });

  it('orders the seeded rates cheapest-first by class_order', async () => {
    const rows = await T.listAllTollRates();
    const byOrder = [...rows].sort((a, b) => a.class_order - b.class_order);
    const amounts = byOrder.map((r) => Number(r.amount_bdt));
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    expect(amounts).toEqual(sortedAmounts);
    expect(amounts[0]).toBe(150);
    expect(amounts.at(-1)).toBe(740);
  });
});

describe('seeded prohibited-vehicles setting', () => {
  it('lists motorcycles and three-wheelers in every locale', async () => {
    const { getProhibitedVehicles } = await import('../../lib/settings.js');
    for (const locale of ['en', 'bn', 'zh']) {
      const list = await getProhibitedVehicles(locale);
      expect(list.length).toBeGreaterThanOrEqual(2);
    }
    expect(await getProhibitedVehicles('en')).toEqual([
      'Motorcycles',
      'Three-wheelers (CNG and auto-rickshaw)',
    ]);
  });
});

describe('seeded interchange coordinates', () => {
  it('leaves the first two interchanges without coordinates and fills the rest', async () => {
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    expect(rows).toHaveLength(7);

    const [first, second, ...rest] = rows;
    expect(first.lat).toBe(null);
    expect(first.lng).toBe(null);
    expect(second.lat).toBe(null);
    expect(second.lng).toBe(null);

    for (const row of rest) {
      expect(row.lat).not.toBe(null);
      expect(row.lng).not.toBe(null);
    }
  });
});
