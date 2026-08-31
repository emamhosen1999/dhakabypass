import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB; // lib/db.js reads this

let M;
let tmpRoot;

beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dhakabypass-media-'));
  process.env.MEDIA_ROOT = tmpRoot; // uploadRoot() reads this per-call, so this takes effect immediately
  M = await import('../../lib/media.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM media');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
  delete process.env.MEDIA_ROOT;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe('saveUpload — the stored extension is never trusted from the client filename', () => {
  it('stores an html-named file sent as image/png with a .png extension, not .html', async () => {
    const saved = await M.saveUpload({
      buffer: Buffer.from('not really png bytes'),
      filename: 'x.html',
      mime: 'image/png',
    });
    expect(saved.path.endsWith('.png')).toBe(true);
    expect(saved.path.endsWith('.html')).toBe(false);
  });

  it('stores a php-named file sent as image/png with a .png extension, not .php', async () => {
    const saved = await M.saveUpload({
      buffer: Buffer.from('<?php nope ?>'),
      filename: 'shell.php',
      mime: 'image/png',
    });
    expect(saved.path.endsWith('.png')).toBe(true);
    expect(saved.path.endsWith('.php')).toBe(false);
  });

  it('stores an svg-named file sent as image/png with a .png extension, not .svg', async () => {
    const saved = await M.saveUpload({
      buffer: Buffer.from('<svg onload="alert(1)"></svg>'),
      filename: 'x.svg',
      mime: 'image/png',
    });
    expect(saved.path.endsWith('.png')).toBe(true);
    expect(saved.path.endsWith('.svg')).toBe(false);
  });

  it('rejects a mime type outside the allowlist before touching disk or the database', async () => {
    await expect(
      M.saveUpload({ buffer: Buffer.from('x'), filename: 'a.txt', mime: 'text/plain' })
    ).rejects.toThrow();
  });

  it('rejects mime "constructor" rather than writing a file with an inherited "extension"', async () => {
    await expect(
      M.saveUpload({ buffer: Buffer.from('x'), filename: 'a.png', mime: 'constructor' })
    ).rejects.toThrow();
    const files = await fs.readdir(tmpRoot);
    expect(files.some((f) => f.startsWith('a'))).toBe(false);
  });
});

describe('saveUpload — never overwrites, even under a name collision', () => {
  it('appends -1 when the target name already exists on disk', async () => {
    await fs.writeFile(path.join(tmpRoot, 'dup.png'), 'first-bytes');
    const saved = await M.saveUpload({ buffer: Buffer.from('second-bytes'), filename: 'dup.png', mime: 'image/png' });
    expect(saved.path).toBe('/uploads/dup-1.png');
    const original = await fs.readFile(path.join(tmpRoot, 'dup.png'), 'utf8');
    expect(original).toBe('first-bytes'); // untouched
  });
});

describe('saveUpload — cleans up the file if the database write fails', () => {
  it('throws a clear, non-leaking error and does not leave the file on disk when the DB is unconfigured', async () => {
    const saved = { DB_HOST: process.env.DB_HOST, DB_NAME: process.env.DB_NAME, DB_USER: process.env.DB_USER };
    delete process.env.DB_HOST;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    try {
      await expect(
        M.saveUpload({ buffer: Buffer.from('x'), filename: 'orphan.png', mime: 'image/png' })
      ).rejects.toThrow(/database/i);
    } finally {
      process.env.DB_HOST = saved.DB_HOST;
      process.env.DB_NAME = saved.DB_NAME;
      process.env.DB_USER = saved.DB_USER;
    }
    const files = await fs.readdir(tmpRoot);
    expect(files.some((f) => f.startsWith('orphan'))).toBe(false);
  });
});
