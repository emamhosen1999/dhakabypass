import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
let conn;

beforeAll(async () => {
  const setup = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: DB,
  });
  // Drop corridor tables to ensure fresh schema (not cumulative via IF NOT EXISTS)
  await setup.query('DROP TABLE IF EXISTS advisories, toll_rates, interchanges, segments, site_settings');
  await setup.end();

  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  // v5 adds the 'waypoint' kind. seed-corridor.mjs writes rows using it, so
  // omitting this migration makes the seed fail with a truncated-column error
  // and the whole file reports as SKIPPED rather than failed.
  execFileSync('node', ['scripts/db-setup-v5.mjs', `--database=${DB}`], { stdio: 'inherit' });
  conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: DB,
  });
});
afterAll(async () => { if (conn) await conn.end(); });

async function cols(table) {
  const [rows] = await conn.query(
    'SELECT COLUMN_NAME AS c, COLUMN_TYPE AS t, IS_NULLABLE AS nullable FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
    [DB, table]
  );
  return Object.fromEntries(rows.map((r) => [r.c, { type: r.t, nullable: r.nullable === 'YES' }]));
}

describe('domain schema', () => {
  it('creates every domain table', async () => {
    const [rows] = await conn.query(
      'SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA=?', [DB]
    );
    const tables = rows.map((r) => r.t);
    for (const t of ['segments', 'interchanges', 'toll_rates', 'advisories', 'site_settings']) {
      expect(tables, `missing ${t}`).toContain(t);
    }
  });

  it('stores chainage as integer metres, not text', async () => {
    const seg = await cols('segments');
    expect(seg.from_m.type).toMatch(/^int/);
    expect(seg.to_m.type).toMatch(/^int/);
    expect((await cols('interchanges')).chainage_m.type).toMatch(/^int/);
  });

  it('scopes segment and advisory status to a known set', async () => {
    expect((await cols('segments')).status.type).toBe("enum('open','construction','planned')");
    expect((await cols('advisories')).severity.type).toBe("enum('info','warning','closure')");
  });

  it('carries per-locale names as JSON and nullable coordinates', async () => {
    const ic = await cols('interchanges');
    // JSON type may be 'json' on MySQL or 'longtext' on MariaDB (both store JSON with CHECK constraint)
    expect(ic.names.type).toMatch(/^(json|longtext)/);
    expect(ic.lat.type).toMatch(/^decimal/);
    expect(ic.lat.nullable).toBe(true);
    expect(ic.lng.type).toMatch(/^decimal/);
    expect(ic.lng.nullable).toBe(true);
  });

  it('keys toll rates by class and effective date', async () => {
    const t = await cols('toll_rates');
    expect(t).toHaveProperty('vehicle_class');
    expect(t).toHaveProperty('amount_bdt');
    expect(t).toHaveProperty('effective_from');
    // payment_methods JSON column is reserved for future use per spec
    expect(t).toHaveProperty('payment_methods');
    expect(t.payment_methods.type).toMatch(/^(json|longtext)/);
    expect(t.payment_methods.nullable).toBe(true);
  });

  it('enforces unique constraint on (vehicle_class, effective_from)', async () => {
    // Verify that inserting two rates with same class and effective_from fails.
    // This constraint ensures "one rate per class in force on a date" is a database guarantee,
    // not a hope. Task 6 depends on this for correct "rate in force today" queries.
    const now = new Date().toISOString().split('T')[0];
    const classLabels = JSON.stringify({ en: 'Car', bn: 'গাড়ি' });

    // First insert succeeds
    const [inserted] = await conn.query(
      'INSERT INTO toll_rates (vehicle_class, class_labels, amount_bdt, effective_from) VALUES (?, ?, ?, ?)',
      ['car', classLabels, 500, now]
    );

    try {
      // Second insert with same class and date must fail
      try {
        await conn.query(
          'INSERT INTO toll_rates (vehicle_class, class_labels, amount_bdt, effective_from) VALUES (?, ?, ?, ?)',
          ['car', classLabels, 600, now]
        );
        throw new Error('Expected duplicate key error but insert succeeded');
      } catch (err) {
        // Expected: Duplicate entry for key 'uq_class_effective'
        expect(err.message).toMatch(/Duplicate entry.*uq_class_effective/);
      }
    } finally {
      // This test verifies structure, not data — it must leave the table as it
      // found it. Delete only the row it created (by id), never a blanket
      // TRUNCATE/DELETE-by-class, since a sibling test running in another
      // Vitest worker against this same shared database may legitimately hold
      // rows of its own at this moment.
      await conn.query('DELETE FROM toll_rates WHERE id = ?', [inserted.insertId]);
    }
  });

  it('is safe to run twice', () => {
    execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  });
});
