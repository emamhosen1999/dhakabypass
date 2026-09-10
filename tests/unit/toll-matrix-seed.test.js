// tests/unit/toll-matrix-seed.test.js
//
// db/sql/12-toll-od-matrix.sql, read as data and checked against the formula
// module it claims to have been generated from.
//
// The seeded matrix is 270 hand-committed literals. Literals do not carry
// their own derivation, and "these numbers came out of DBEDC's published
// formula" is exactly the sort of claim that is true on the day it is written
// and quietly false a year later. So the file is parsed here and every amount
// recomputed. A row that no longer follows from the formula fails the suite
// rather than shipping as a fare somebody budgets against.
//
// It also pins the STRUCTURAL half of provisional status, because that is the
// half a reviewer cannot see by reading a component: the flag is a generated
// column, so no statement anywhere — admin action, migration or phpMyAdmin
// session — can mark a fare confirmed without the citation that makes it true.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { odFare, DERIVATIONS } from '../../lib/corridor/toll-formula.js';

const sql = readFileSync(
  fileURLToPath(new URL('../../db/sql/12-toll-od-matrix.sql', import.meta.url)),
  'utf8'
);

/** (@p_<origin chainage>, @p_<dest chainage>, direction, class, metres, amount, date, derivation) */
const ROW_RE =
  /\(\s*@p_(\d+)\s*,\s*@p_(\d+)\s*,\s*'([a-z]+)'\s*,\s*'([a-z_]+)'\s*,\s*(\d+)\s*,\s*([\d.]+)\s*,\s*'([\d-]+)'\s*,\s*'([a-z0-9-]+)'\s*\)/gi;

const seeded = [...sql.matchAll(ROW_RE)].map((m) => ({
  originChainage: Number(m[1]),
  destChainage: Number(m[2]),
  direction: m[3],
  vehicle_class: m[4],
  distance_m: Number(m[5]),
  amount_bdt: Number(m[6]),
  effective_from: m[7],
  derivation: m[8],
}));

describe('the seed file', () => {
  it('is idempotent in the way db/sql/README.md requires of every numbered file', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS `toll_od_rates`/);
    expect(sql).toMatch(/INSERT IGNORE INTO `toll_od_rates`/);
    // Statements, not the words. The file's own header explains that it
    // contains no DROP and no TRUNCATE, so a bare word match fails on the
    // sentence saying so.
    expect(sql).not.toMatch(/\bDROP\s+(TABLE|DATABASE|INDEX|COLUMN|CONSTRAINT)\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\s+(TABLE\s+)?`/i);
    expect(sql).not.toMatch(/ON DUPLICATE KEY UPDATE/i);
  });

  it('does not touch toll_rates — the live flat rates stay exactly as they are', () => {
    // /travel/toll, the `toll-table` block and `toll-preview` all read
    // toll_rates today. This table is added ALONGSIDE; migrating the flat
    // rates onto it is a separate, later decision.
    expect(sql).not.toMatch(/ALTER TABLE `toll_rates`/i);
    expect(sql).not.toMatch(/(INSERT\s+(IGNORE\s+)?INTO|UPDATE|DELETE\s+FROM)\s+`?toll_rates`?/i);
  });

  it('seeds 270 fares — 30 ordered plaza pairs across 9 vehicle classes', () => {
    expect(seeded).toHaveLength(270);
    expect(new Set(seeded.map((r) => r.vehicle_class)).size).toBe(9);
    expect(new Set(seeded.map((r) => `${r.originChainage}-${r.destChainage}`)).size).toBe(30);
  });
});

describe('provisional status is enforced by the schema, not by prose', () => {
  it('derives is_provisional from the citation as a STORED generated column', () => {
    // A STORED generated column cannot appear in the SET list of an UPDATE.
    // That is the whole mechanism: `UPDATE toll_od_rates SET is_provisional=0`
    // is rejected by the server, so the ONLY way a fare stops being
    // provisional is by someone typing the S.R.O. number that makes it true.
    expect(sql).toMatch(
      /`is_provisional`\s+tinyint\(1\)\s+GENERATED ALWAYS AS[\s\S]{0,120}?`sro_number`[\s\S]{0,80}?STORED/i
    );
  });

  it('refuses a half-written citation', () => {
    expect(sql).toMatch(/CONSTRAINT `chk_toll_od_citation` CHECK/i);
  });

  it('refuses a fare from a plaza to itself', () => {
    expect(sql).toMatch(/CONSTRAINT `chk_toll_od_distinct` CHECK/i);
  });

  it('never writes is_provisional in an INSERT — it is not a writable column', () => {
    // The INSERT's own column list, not the whole file: the DDL above has to
    // declare the column, and the header comment names it repeatedly.
    const head = sql.slice(sql.search(/INSERT IGNORE INTO `toll_od_rates`/i));
    expect(head.slice(0, head.indexOf('VALUES'))).not.toMatch(/is_provisional/i);
  });

  it('seeds every row with an empty citation, so every seeded row is provisional', () => {
    // The column list must not carry sro_number at all: it defaults to '',
    // which the generated column reads as provisional.
    const insertHead = sql.slice(sql.search(/INSERT IGNORE INTO `toll_od_rates`/i));
    const columns = insertHead.slice(0, insertHead.indexOf('VALUES'));
    expect(columns).not.toMatch(/sro_number|sro_date|sro_link/i);
  });
});

describe('every seeded fare recomputes from the published formula', () => {
  it('has rows to check', () => {
    expect(seeded.length).toBeGreaterThan(0);
  });

  it.each(seeded)(
    '$vehicle_class $originChainage->$destChainage over $distance_m m is ৳$amount_bdt',
    (row) => {
      expect(row.distance_m).toBe(Math.abs(row.destChainage - row.originChainage));
      expect(row.direction).toBe(
        row.destChainage > row.originChainage ? 'southbound' : 'northbound'
      );

      if (row.derivation === DERIVATIONS.published) {
        // The one pair DBEDC has already published a rate for. Not computed —
        // taken from toll_rates so the matrix and /travel/toll cannot quote
        // two different prices for the same journey.
        return;
      }
      const computed = odFare(row.vehicle_class, row.distance_m);
      expect(computed).not.toBeNull();
      expect(row.amount_bdt).toBe(computed.amount_bdt);
      expect(row.derivation).toBe(computed.derivation);
    }
  );

  it('uses only derivations the formula module names', () => {
    const known = new Set(Object.values(DERIVATIONS));
    for (const row of seeded) expect(known.has(row.derivation)).toBe(true);
  });

  it('quotes the operator’s own published rate for Vogra–Purbachal, both ways', () => {
    // toll_rates already carries nine rates for section "Vogra – Purbachal".
    // Deriving that pair from chainage instead would put ৳160 in the matrix
    // beside the ৳150 the toll page publishes for the same trip.
    const published = seeded.filter((r) => r.derivation === DERIVATIONS.published);
    expect(published).toHaveLength(18);
    expect(new Set(published.map((r) => r.amount_bdt))).toEqual(
      new Set([150, 180, 190, 210, 260, 310, 400, 610, 740])
    );
  });
});
