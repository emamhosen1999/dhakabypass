import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

/**
 * The history, trash and activity engine (W7.4, W7.5) against a real database
 * built from the numbered SQL files, so the tables, the RESTRICT foreign keys
 * and the generated fare column are exactly what production has.
 */
const ROOT = path.resolve(import.meta.dirname, '../..');
const DB = `${process.env.DB_NAME_TEST || 'dhakabypass_test'}_history`;
const HOST = process.env.DB_HOST || '127.0.0.1';
const USER = process.env.DB_USER || 'root';
const PASS = process.env.DB_PASSWORD || '';

let H;
let query;

beforeAll(async () => {
  const admin = await mysql.createConnection({ host: HOST, user: USER, password: PASS });
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await admin.query(`CREATE DATABASE \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();
  const files = fs.readdirSync(path.join(ROOT, 'db/sql')).filter((f) => /^\d\d-.*\.sql$/.test(f)).sort();
  for (const f of files) {
    const c = await mysql.createConnection({ host: HOST, user: USER, password: PASS, database: DB, charset: 'utf8mb4', multipleStatements: true });
    try { await c.query(fs.readFileSync(path.join(ROOT, 'db/sql', f), 'utf8')); } finally { await c.end(); }
  }
  process.env.DB_NAME = DB;
  process.env.DB_HOST = HOST;
  process.env.DB_USER = USER;
  process.env.DB_PASSWORD = PASS;
  ({ query } = await import('../../lib/db.js'));
  H = await import('../../lib/admin/history.js');
}, 300_000);

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  await getPool()?.end();
  const admin = await mysql.createConnection({ host: HOST, user: USER, password: PASS });
  await admin.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await admin.end();
});

const plazaWithFares = async () => (await query(
  `SELECT i.id, COUNT(*) AS fares FROM interchanges i JOIN toll_od_rates r ON r.origin_interchange_id = i.id OR r.destination_interchange_id = i.id
    GROUP BY i.id ORDER BY fares DESC LIMIT 1`,
))[0];

describe('fares cannot vanish with their interchange', () => {
  it('the database refuses a bare delete of an interchange that has fares', async () => {
    const plaza = await plazaWithFares();
    expect(Number(plaza.fares)).toBeGreaterThan(0);
    await expect(query('DELETE FROM interchanges WHERE id = ?', [plaza.id])).rejects.toMatchObject({ code: expect.stringMatching(/ROW_IS_REFERENCED/) });
  });

  it('moves the interchange and every fare to the trash, and restores them with their ids', async () => {
    const plaza = await plazaWithFares();
    const before = await query('SELECT * FROM toll_od_rates WHERE origin_interchange_id = ? OR destination_interchange_id = ? ORDER BY id', [plaza.id, plaza.id]);
    const entry = await H.trashEntity('interchange', plaza.id);
    expect(entry.summary).toBe(`and ${before.length} fares`);
    expect((await query('SELECT COUNT(*) AS n FROM interchanges WHERE id = ?', [plaza.id]))[0].n).toBe(0);

    const restored = await H.restoreTrash(entry.trashId);
    expect(restored.type).toBe('interchange');
    const after = await query('SELECT * FROM toll_od_rates WHERE origin_interchange_id = ? OR destination_interchange_id = ? ORDER BY id', [plaza.id, plaza.id]);
    expect(after.map((r) => [r.id, String(r.amount_bdt), r.is_provisional])).toEqual(before.map((r) => [r.id, String(r.amount_bdt), r.is_provisional]));
    expect((await query('SELECT COUNT(*) AS n FROM trash WHERE id = ?', [entry.trashId]))[0].n).toBe(0);
    const log = await query("SELECT action FROM audit_log WHERE target = ? ORDER BY id", [`interchange:${plaza.id}`]);
    expect(log.map((r) => r.action)).toEqual(['interchange.delete', 'interchange.restore']);
  });
});

describe('history', () => {
  it('keeps the record before a change and puts it back, keeping the present too', async () => {
    const [seg] = await query('SELECT id, status, labels FROM segments ORDER BY id LIMIT 1');
    await H.withHistory('segment', seg.id, () => query("UPDATE segments SET status = 'planned' WHERE id = ?", [seg.id]));
    const list = await H.listHistory('segment', seg.id);
    expect(list[0].changes.some((c) => c.field === 'status')).toBe(seg.status !== 'planned');

    await H.restoreHistory(list[0].id);
    expect((await query('SELECT status FROM segments WHERE id = ?', [seg.id]))[0].status).toBe(seg.status);
    const again = await H.listHistory('segment', seg.id);
    expect(again[0].action).toBe('restore');
  });

  it('never writes a sealed camera password into history, and a trashed camera comes back whole', async () => {
    const [cam] = await query('SELECT id FROM cameras ORDER BY id LIMIT 1');
    await query("UPDATE cameras SET password_sealed = 'v1:sealed' WHERE id = ?", [cam.id]);
    await H.recordHistory('camera', cam.id);
    const [h] = await query("SELECT snapshot FROM record_history WHERE entity_type = 'camera' AND entity_id = ? ORDER BY id DESC LIMIT 1", [String(cam.id)]);
    expect(JSON.stringify(h.snapshot)).not.toContain('v1:sealed');

    const entry = await H.trashEntity('camera', cam.id);
    await H.restoreTrash(entry.trashId);
    expect((await query('SELECT password_sealed FROM cameras WHERE id = ?', [cam.id]))[0].password_sealed).toBe('v1:sealed');
  });

  it('refuses a save over a newer change', async () => {
    const [seg] = await query('SELECT id, updated_at FROM segments ORDER BY id LIMIT 1');
    const stale = '2000-01-01 00:00:00';
    await expect(H.assertUnchanged('segment', seg.id, stale)).rejects.toThrow(/after you opened it/);
    await expect(H.assertUnchanged('segment', seg.id, H.stampOf(seg.updated_at))).resolves.toBeUndefined();
  });
});

describe('pages', () => {
  it('a trashed page brings back its translations, blocks and block texts', async () => {
    const [page] = await query("SELECT p.id FROM pages p WHERE p.slug NOT IN ('home','not-found') AND EXISTS (SELECT 1 FROM blocks b WHERE b.page_id = p.id) ORDER BY p.id LIMIT 1");
    const count = async () => (await query(
      'SELECT (SELECT COUNT(*) FROM blocks WHERE page_id = ?) AS b, (SELECT COUNT(*) FROM block_translations bt JOIN blocks bl ON bl.id = bt.block_id WHERE bl.page_id = ?) AS t, (SELECT COUNT(*) FROM page_translations WHERE page_id = ?) AS p',
      [page.id, page.id, page.id],
    ))[0];
    const before = await count();
    const entry = await H.trashEntity('page', page.id);
    expect((await count()).b).toBe(0);
    await H.restoreTrash(entry.trashId);
    expect(await count()).toEqual(before);
  });
});
