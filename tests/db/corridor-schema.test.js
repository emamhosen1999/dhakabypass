import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
let conn;

beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: DB,
  });
});
afterAll(async () => { if (conn) await conn.end(); });

async function cols(table) {
  const [rows] = await conn.query(
    'SELECT COLUMN_NAME AS c, COLUMN_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
    [DB, table]
  );
  return Object.fromEntries(rows.map((r) => [r.c, r.t]));
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
    expect(seg.from_m).toMatch(/^int/);
    expect(seg.to_m).toMatch(/^int/);
    expect((await cols('interchanges')).chainage_m).toMatch(/^int/);
  });

  it('scopes segment and advisory status to a known set', async () => {
    expect((await cols('segments')).status).toBe("enum('open','construction','planned')");
    expect((await cols('advisories')).severity).toBe("enum('info','warning','closure')");
  });

  it('carries per-locale names as JSON and nullable coordinates', async () => {
    const ic = await cols('interchanges');
    expect(ic.names).toMatch(/^json/);
    expect(ic.lat).toMatch(/^decimal/);
    expect(ic.lng).toMatch(/^decimal/);
  });

  it('keys toll rates by class and effective date', async () => {
    const t = await cols('toll_rates');
    expect(t).toHaveProperty('vehicle_class');
    expect(t).toHaveProperty('amount_bdt');
    expect(t).toHaveProperty('effective_from');
  });

  it('is safe to run twice', () => {
    execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  });
});
