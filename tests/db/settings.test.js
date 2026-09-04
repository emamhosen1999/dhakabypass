import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB;

let S;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  // v5 adds the 'waypoint' kind. seed-corridor.mjs writes rows using it, so
  // omitting this migration makes the seed fail with a truncated-column error
  // and the whole file reports as SKIPPED rather than failed.
  execFileSync('node', ['scripts/db-setup-v5.mjs', `--database=${DB}`], { stdio: 'inherit' });
  // v6 adds media.original_path, which lib/media/replace.js reads and writes.
  execFileSync('node', ['scripts/db-setup-v6.mjs', `--database=${DB}`], { stdio: 'inherit' });
  S = await import('../../lib/settings.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM site_settings');
});

describe('settings', () => {
  it('round-trips a value', async () => {
    await S.setSetting('demo.key', { a: 1 });
    expect(await S.getSetting('demo.key')).toEqual({ a: 1 });
  });

  it('returns the fallback for a missing key', async () => {
    expect(await S.getSetting('nope', 'default')).toBe('default');
    expect(await S.getSetting('nope')).toBe(null);
  });

  it('overwrites rather than duplicating', async () => {
    await S.setSetting('demo.key', 1);
    await S.setSetting('demo.key', 2);
    expect(await S.getSetting('demo.key')).toBe(2);
  });

  it('defaults the illustrative flag to TRUE when unset', async () => {
    expect(await S.isDataIllustrative()).toBe(true);
  });

  it('honours the flag once set', async () => {
    await S.setSetting('corridor.illustrative', false);
    expect(await S.isDataIllustrative()).toBe(false);
    await S.setSetting('corridor.illustrative', true);
    expect(await S.isDataIllustrative()).toBe(true);
  });
});
