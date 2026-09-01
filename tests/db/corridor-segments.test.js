import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB;

let S, I;
beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  execFileSync('node', ['scripts/db-setup-v3.mjs', `--database=${DB}`], { stdio: 'inherit' });
  S = await import('../../lib/corridor/segments.js');
  I = await import('../../lib/corridor/interchanges.js');
});

beforeEach(async () => {
  const { query } = await import('../../lib/db.js');
  await query('DELETE FROM segments');
  await query('DELETE FROM interchanges');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
});

describe('segments', () => {
  it('stores and lists in chainage order', async () => {
    await S.saveSegment({ from_m: 21900, to_m: 48000, status: 'construction', labels: { en: 'South' } });
    await S.saveSegment({ from_m: 0, to_m: 21900, status: 'open', labels: { en: 'North' } });
    const rows = await S.listSegments();
    expect(rows.map((r) => r.from_m)).toEqual([0, 21900]);
    expect(rows[0].labels.en).toBe('North');
  });

  it('rejects a segment that ends before it starts', async () => {
    await expect(S.saveSegment({ from_m: 500, to_m: 100, status: 'open' }))
      .rejects.toThrow(/end.*after.*start/i);
  });

  it('rejects a segment overlapping an existing one', async () => {
    await S.saveSegment({ from_m: 0, to_m: 10000, status: 'open' });
    await expect(S.saveSegment({ from_m: 5000, to_m: 15000, status: 'open' }))
      .rejects.toThrow(/overlap/i);
  });

  it('allows a segment that starts exactly where another ends', async () => {
    await S.saveSegment({ from_m: 0, to_m: 10000, status: 'open' });
    await expect(S.saveSegment({ from_m: 10000, to_m: 20000, status: 'construction' }))
      .resolves.toBeTypeOf('number');
  });

  it('lets a segment be updated without colliding with itself', async () => {
    const id = await S.saveSegment({ from_m: 0, to_m: 10000, status: 'open' });
    await expect(S.saveSegment({ id, from_m: 0, to_m: 12000, status: 'open' }))
      .resolves.toBe(id);
    expect((await S.listSegments())[0].to_m).toBe(12000);
  });

  it('derives the corridor summary from stored segments', async () => {
    await S.saveSegment({ from_m: 0, to_m: 3900, status: 'construction' });
    await S.saveSegment({ from_m: 3900, to_m: 21900, status: 'open' });
    await S.saveSegment({ from_m: 21900, to_m: 48000, status: 'construction' });
    const summary = await S.corridorSummary();
    expect(summary.extent.length_m).toBe(48000);
    expect(summary.openLength).toBe(18000);
    expect(summary.percentOpen).toBe(37.5);
    expect(summary.segments).toHaveLength(3);
  });

  it('deletes', async () => {
    const id = await S.saveSegment({ from_m: 0, to_m: 100, status: 'open' });
    await S.deleteSegment(id);
    expect(await S.listSegments()).toEqual([]);
  });
});

describe('interchanges', () => {
  it('stores and lists in chainage order', async () => {
    await I.saveInterchange({ chainage_m: 21900, names: { en: 'Purbachal' }, kind: 'interchange' });
    await I.saveInterchange({ chainage_m: 0, names: { en: 'Kodda' }, kind: 'interchange' });
    const rows = await I.listInterchanges();
    expect(rows.map((r) => r.chainage_m)).toEqual([0, 21900]);
  });

  it('requires an English name', async () => {
    await expect(I.saveInterchange({ chainage_m: 0, names: {}, kind: 'interchange' }))
      .rejects.toThrow(/english name/i);
  });

  it('keeps coordinates nullable until the survey data arrives', async () => {
    const id = await I.saveInterchange({ chainage_m: 100, names: { en: 'X' }, kind: 'interchange' });
    const row = (await I.listInterchanges()).find((r) => r.id === id);
    expect(row.lat).toBe(null);
    expect(row.lng).toBe(null);
  });

  it('reads a localised name with English fallback', () => {
    const row = { names: { en: 'Bhulta', bn: 'ভুলতা' } };
    expect(I.localeName(row, 'bn')).toBe('ভুলতা');
    expect(I.localeName(row, 'zh')).toBe('Bhulta');
    expect(I.localeName({ names: {} }, 'en')).toBe('');
  });

  it('deletes', async () => {
    const id = await I.saveInterchange({ chainage_m: 0, names: { en: 'X' }, kind: 'interchange' });
    await I.deleteInterchange(id);
    expect(await I.listInterchanges()).toEqual([]);
  });
});
