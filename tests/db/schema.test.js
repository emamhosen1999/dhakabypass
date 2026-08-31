import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql from 'mysql2/promise';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
let conn;

beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: DB,
  });
});
afterAll(async () => { if (conn) await conn.end(); });

async function columns(table) {
  const [rows] = await conn.query(
    'SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
    [DB, table]
  );
  return rows.map((r) => r.c);
}

describe('structural schema', () => {
  it('creates every structural table', async () => {
    const [rows] = await conn.query(
      'SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA=?', [DB]
    );
    const tables = rows.map((r) => r.t);
    for (const t of ['pages','page_translations','blocks','block_translations',
                     'media','menus','menu_items','revisions','audit_log','redirects','users']) {
      expect(tables, `missing ${t}`).toContain(t);
    }
  });

  it('scopes block content by locale with a publication status', async () => {
    const cols = await columns('block_translations');
    expect(cols).toEqual(expect.arrayContaining(['block_id','locale','data','status','updated_by','updated_at']));
  });

  it('gives users a role', async () => {
    expect(await columns('users')).toEqual(expect.arrayContaining(['email','role','password_hash']));
  });

  it('is safe to run twice', () => {
    execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  });
});
