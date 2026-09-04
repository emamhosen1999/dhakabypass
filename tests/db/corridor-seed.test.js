// tests/db/corridor-seed.test.js
//
// Runs the real seed script (scripts/seed-corridor.mjs) against the
// throwaway test database and asserts on the ROWS IT ACTUALLY WROTE — not on
// the script's source — so a future edit that reintroduces a motorcycle or
// three-wheeler toll row, breaks the class_order sequencing, or drifts the
// real corridor geometry (Task 13b: waypoints, toll plazas and bridges
// supplied by the client, see
// .superpowers/sdd/2026-09-01-dhakabypass-domain-data-travel-info/REAL-DATA-FROM-BOSS.md)
// fails loudly here instead of only being caught by someone reading the diff.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB;

let T;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  // v5 adds the 'waypoint' kind. seed-corridor.mjs writes rows using it, so
  // omitting this migration makes the seed fail with a truncated-column error
  // and the whole file reports as SKIPPED rather than failed.
  execFileSync('node', ['scripts/db-setup-v5.mjs', `--database=${DB}`], { stdio: 'inherit' });
  // v6 adds media.original_path, which lib/media/replace.js reads and writes.
  execFileSync('node', ['scripts/db-setup-v6.mjs', `--database=${DB}`], { stdio: 'inherit' });
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

describe('seeded published length setting', () => {
  it('records the official 48 km design figure, separate from the measured extent', async () => {
    const { getPublishedLengthKm } = await import('../../lib/settings.js');
    expect(await getPublishedLengthKm()).toBe(48);
  });
});

describe('seeded corridor geometry (real client data)', () => {
  it('spans the full measured corridor, 0 to 47611 m', async () => {
    const S = await import('../../lib/corridor/segments.js');
    const summary = await S.corridorSummary();
    expect(summary.extent.from_m).toBe(0);
    expect(summary.extent.to_m).toBe(47611);
    expect(summary.extent.length_m).toBe(47611);
  });

  it('seeds exactly twenty points (8 waypoints + 9 toll plazas + 3 bridges)', async () => {
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    expect(rows).toHaveLength(20);
  });

  it('gives every point both a lat and a lng — none null', async () => {
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    for (const row of rows) {
      expect(row.lat, `lat for "${row.names.en}"`).not.toBe(null);
      expect(row.lng, `lng for "${row.names.en}"`).not.toBe(null);
    }
  });

  it('orders points by strictly increasing chainage', async () => {
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    const chainages = rows.map((r) => r.chainage_m);
    const sorted = [...new Set(chainages)].sort((a, b) => a - b);
    expect(chainages.every((c, idx) => idx === 0 || c > chainages[idx - 1])).toBe(true);
    expect(chainages).toEqual(sorted);
  });

  it('places Vogra Toll Plaza (RHS) at K3+218, replacing the old fictional Bhogra interchange', async () => {
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    const vogra = rows.find((r) => r.chainage_m === 3218 && r.kind === 'toll_plaza');
    expect(vogra).toBeTruthy();
    expect(vogra.names.en).toBe('Vogra Toll Plaza (RHS)');
  });

  it('carries no invented Bangla for corridor facility names', async () => {
    // Client decision 2026-09-03. These rows held Bengali transliterations we
    // wrote ourselves; nobody at DBEDC had seen them. Publishing an invented
    // spelling of the operator's own facilities is worse than showing the Latin
    // name a driver reads off the gantry.
    //
    // This asserts the ABSENCE of a bn key, so re-adding one without the
    // official list fails here rather than reaching a page. When DBEDC supplies
    // the spellings, delete this test in the same commit that adds them.
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(Object.hasOwn(row.names, 'bn')).toBe(false);
      // Falling back to English is what makes Latin render on /bn at all.
      expect(I.localeName(row, 'bn')).toBe(row.names.en);
      expect(I.localeName(row, 'bn')).not.toBe('');
    }
  });

  it('places Purbachal Toll Plaza at K24+522, not the old K21+900 interchange', async () => {
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    const purbachal = rows.find((r) => r.names.en === 'Purbachal Toll Plaza');
    expect(purbachal).toBeTruthy();
    expect(purbachal.chainage_m).toBe(24522);
  });

  it('does not seed a Bhaowal service area (it does not exist in the real data)', async () => {
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    expect(rows.some((r) => /bhaowal/i.test(r.names.en))).toBe(false);
  });

  it('seeds the three named bridges under the bridge kind', async () => {
    const I = await import('../../lib/corridor/interchanges.js');
    const rows = await I.listInterchanges();
    const bridgeNames = ['Nagda Bridge', 'Ulukhola Bridge', 'Kanchan Bridge'];
    for (const name of bridgeNames) {
      const row = rows.find((r) => r.names.en === name);
      expect(row, `expected a row for "${name}"`).toBeTruthy();
      expect(row.kind).toBe('bridge');
    }
  });
});

describe('seeded segments (real open-section geometry)', () => {
  it('opens exactly Vogra Toll Plaza (K3+218) to K21+218', async () => {
    const S = await import('../../lib/corridor/segments.js');
    const rows = await S.listSegments();
    const open = rows.find((r) => r.status === 'open');
    expect(open).toBeTruthy();
    expect(open.from_m).toBe(3218);
    expect(open.to_m).toBe(21218);
  });

  it('is exactly 18000 m (18.000 km) long, per the Boss-confirmed figure', async () => {
    const S = await import('../../lib/corridor/segments.js');
    const summary = await S.corridorSummary();
    expect(summary.openLength).toBe(18000);
  });
});

describe('corridor.illustrative stays on', () => {
  it('is still true — facilities, rules and toll-section labelling remain reconstructed', async () => {
    const { isDataIllustrative } = await import('../../lib/settings.js');
    expect(await isDataIllustrative()).toBe(true);
  });
});
