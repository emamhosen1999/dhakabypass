import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

/**
 * The production rehearsal.
 *
 * Production is built by hand-importing db/sql/*.sql in number order through
 * phpMyAdmin — never from the development database. That matters because the
 * development database has been re-seeded and numbers its pages and blocks
 * differently from 02-seed.sql (grievances is page 13 here and page 11 there;
 * the governance prose is block 135 here and 16 there). A numbered file that
 * quietly assumed a development id would import cleanly, do nothing, or do
 * the wrong thing, and nobody would know until the site was live.
 *
 * So: build a database from NOTHING but the SQL files, in order, twice — the
 * second pass proves idempotence — and assert the things each file promised.
 * This is the only test that exercises the files the way production does.
 *
 * Runs under `npm run test:db` only (a throwaway database, a mysql client on
 * PATH or at Laragon's path) — never under `npx vitest run tests/unit`.
 */
const ROOT = path.resolve(import.meta.dirname, '../..');
const DB = `${process.env.DB_NAME_TEST || 'dhakabypass_test'}_fresh`;
const HOST = process.env.DB_HOST || '127.0.0.1';
const USER = process.env.DB_USER || 'root';
const PASS = process.env.DB_PASSWORD || '';

const files = fs.readdirSync(path.join(ROOT, 'db/sql'))
  .filter((f) => /^\d\d-.*\.sql$/.test(f))
  .sort();

let conn;

async function importFile(file) {
  const sql = fs.readFileSync(path.join(ROOT, 'db/sql', file), 'utf8');
  const c = await mysql.createConnection({ host: HOST, user: USER, password: PASS, database: DB, charset: 'utf8mb4', multipleStatements: true });
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }
}

beforeAll(async () => {
  const admin = await mysql.createConnection({ host: HOST, user: USER, password: PASS });
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await admin.query(`CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();
  for (const f of files) await importFile(f);
  for (const f of files) await importFile(f); // idempotence: a second pass must change nothing
  conn = await mysql.createConnection({ host: HOST, user: USER, password: PASS, database: DB, charset: 'utf8mb4' });
}, 300_000);

afterAll(async () => {
  if (conn) await conn.end();
  if (process.env.KEEP_FRESH_DB) return; // leave it for inspection
  const admin = await mysql.createConnection({ host: HOST, user: USER, password: PASS });
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await admin.end();
});

const one = async (sql, params = []) => (await conn.query(sql, params))[0][0];
const all = async (sql, params = []) => (await conn.query(sql, params))[0];

describe('a database built from db/sql/*.sql alone', () => {
  it('imports every numbered file in order, and the ledger records all of them (W6.6)', async () => {
    expect(files.length).toBeGreaterThanOrEqual(18);
    const { MIGRATIONS } = await import('../../lib/db/migrations.js');
    const rows = await all('SELECT name FROM schema_migrations ORDER BY name');
    expect(rows.map((r) => r.name)).toEqual([...MIGRATIONS]);
  });

  it('carries no provenance marker or pending notice after 22, 29 and 30', async () => {
    const r = await one(`SELECT COUNT(*) AS c FROM block_translations
      WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.body')) LIKE '%db-pending%'
         OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.body')) LIKE '%db-archive%'`);
    expect(r.c).toBe(0);
    // 29-legacy-as-current: no block is framed as "from the previous website"
    // any more — the six legacy-tone notices are deleted or plain rich-text,
    // and the restored facts carry no notice. What remains is the 9 pending
    // notices (information DBEDC still has to supply).
    const legacy = await one(`SELECT COUNT(*) AS c FROM block_translations WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.tone')) = 'legacy'`);
    expect(legacy.c).toBe(0);
    const framed = await one(`SELECT COUNT(*) AS c FROM block_translations
      WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.body')) LIKE '%previous website%' OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.heading')) LIKE '%previously published%'`);
    expect(framed.c).toBe(0);
    // 30-pending-drafts: every "Not yet published" notice is content now.
    expect((await one(`SELECT COUNT(*) AS c FROM block_translations WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.tone')) = 'pending'`)).c).toBe(0);
    expect((await one("SELECT COUNT(*) AS c FROM blocks WHERE type = 'callout'")).c).toBe(0);
    expect((await one('SELECT COUNT(*) AS c FROM blocks WHERE id BETWEEN 400 AND 432')).c).toBe(26);
  });

  it('put the home corridor blocks on the home page, after the hero (18)', async () => {
    const rows = await all(`SELECT b.type FROM blocks b JOIN pages p ON p.id = b.page_id
      WHERE p.slug = 'home' ORDER BY b.sort_order, b.id`);
    const types = rows.map((r) => r.type);
    expect(types.slice(0, 4)).toEqual(['hero', 'progress-bar', 'corridor-strip', 'interchange-table']);
    expect(types.filter((t) => t === 'progress-bar')).toHaveLength(1);
  });

  it('put the grievance form on the grievances page and rewrote its cta-band (20)', async () => {
    const rows = await all(`SELECT b.type, b.sort_order FROM blocks b JOIN pages p ON p.id = b.page_id
      WHERE p.slug = 'grievances' ORDER BY b.sort_order, b.id`);
    expect(rows.map((r) => r.type)).toEqual(['hero', 'card-grid', 'rich-text', 'request-form', 'cta-band']);
    const cta = await one(`SELECT JSON_UNQUOTE(JSON_EXTRACT(t.data, '$.body')) AS body
      FROM block_translations t JOIN blocks b ON b.id = t.block_id JOIN pages p ON p.id = b.page_id
      WHERE p.slug = 'grievances' AND b.type = 'cta-band' AND t.locale = 'en'`);
    expect(cta.body).not.toMatch(/Until the dedicated grievance channels/);
  });

  it('seeds the /travel redirect for every locale (21)', async () => {
    const rows = await all("SELECT source, destination FROM redirects WHERE source LIKE '%/travel' ORDER BY source");
    expect(rows).toEqual([
      { source: '/bn/travel', destination: '/bn/travel/status' },
      { source: '/en/travel', destination: '/en/travel/status' },
      { source: '/zh/travel', destination: '/zh/travel/status' },
    ]);
  });

  it('shows 24 gallery images and the provisional O-D matrix', async () => {
    expect((await one('SELECT COUNT(*) AS c FROM media WHERE in_gallery = 1')).c).toBe(24);
    // 23: the four brand marks are in the library but never in the gallery,
    // and the home partner row carries three of them plus RHD as a partner.
    expect((await one("SELECT COUNT(*) AS c FROM media WHERE path LIKE '/brand/%' AND in_gallery = 0")).c).toBe(4);
    const partners = await one(`SELECT JSON_EXTRACT(t.data, '$.items[*].name') AS names, JSON_LENGTH(JSON_EXTRACT(t.data, '$.items[*].logo')) AS logos
      FROM block_translations t JOIN blocks b ON b.id = t.block_id JOIN pages p ON p.id = b.page_id
      WHERE p.slug = 'home' AND b.type = 'partner-row' AND t.locale = 'zh'`);
    expect(JSON.parse(JSON.stringify(partners.names))).toEqual(['SRBG', 'SEL', 'UDC', 'RHD']);
    expect(partners.logos).toBe(3);
    expect((await one('SELECT COUNT(*) AS c FROM toll_od_rates')).c).toBe(270);
    expect((await one('SELECT COUNT(*) AS c FROM service_requests')).c).toBe(0);
  });

  it('has every essential content page published, and every block a translation', async () => {
    for (const slug of ['home', 'contact', 'gallery', 'news', 'travel/status', 'travel/toll', 'travel/route',
      'travel/map', 'travel/facilities', 'travel/rules', 'privacy', 'terms', 'accessibility', 'grievances']) {
      const r = await one('SELECT status FROM pages WHERE slug = ?', [slug]);
      expect(r?.status, slug).toBe('published');
    }
    const orphan = await one(`SELECT COUNT(*) AS c FROM blocks b
      WHERE NOT EXISTS (SELECT 1 FROM block_translations t WHERE t.block_id = b.id AND t.locale = 'en')`);
    expect(orphan.c).toBe(0);
    const dangling = await one(`SELECT COUNT(*) AS c FROM blocks b WHERE NOT EXISTS (SELECT 1 FROM pages p WHERE p.id = b.page_id)`);
    expect(dangling.c).toBe(0);
  });
});
