import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB; // lib/db.js reads this

let query;
let withTransaction;
let applyMediaReplacement;

const notFound = () => new Error('gone');

beforeAll(async () => {
  execFileSync('node', ['scripts/db-setup-v2.mjs', `--database=${DB}`], { stdio: 'inherit' });
  // media.origin/credit arrive in v4, which takes its database from DB_NAME
  // rather than a flag. load-env.mjs never overrides an env var that is
  // already set, so passing it here keeps the migration off the dev database.
  execFileSync('node', ['scripts/db-setup-v4.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, DB_NAME: DB },
  });
  ({ query, withTransaction } = await import('../../lib/db.js'));
  ({ applyMediaReplacement } = await import('../../lib/media/replace.js'));
});

beforeEach(async () => {
  await query('DELETE FROM block_translations');
  await query('DELETE FROM blocks');
  await query('DELETE FROM page_translations');
  await query('DELETE FROM pages');
  await query('DELETE FROM media');
});

afterAll(async () => {
  const { getPool } = await import('../../lib/db.js');
  const pool = getPool();
  if (pool) await pool.end();
});

async function seedRow({ path = '/old.webp', alt, focal_x = 0.2, focal_y = 0.8 } = {}) {
  const res = await query(
    `INSERT INTO media (path, width, height, bytes, mime, alt, focal_x, focal_y, origin)
     VALUES (?, 686, 386, 1000, 'image/webp', ?, ?, ?, 'legacy')`,
    [
      path,
      JSON.stringify(alt ?? {
        en: 'A paver laying asphalt at dusk, lit by the low sun',
        bn: 'সন্ধ্যায় পেভার',
        zh: '摊铺机在黄昏时铺设沥青',
      }),
      focal_x,
      focal_y,
    ],
  );
  return res.insertId;
}

const read = async (id) => (await query('SELECT * FROM media WHERE id = ?', [id]))[0];

const replace = (opts) =>
  withTransaction((q) =>
    applyMediaReplacement(q, {
      width: 2400, height: 1350, bytes: 900000, mime: 'image/webp', notFound, ...opts,
    }));

describe('applyMediaReplacement — alt text and the focal point describe the bytes', () => {
  it('clears the alt text in every language rather than carrying it to a different photograph', async () => {
    const id = await seedRow();
    await replace({ id, oldPath: '/old.webp', newPath: '/uploads/new.webp' });

    const row = await read(id);
    const alt = typeof row.alt === 'string' ? JSON.parse(row.alt) : row.alt;
    expect(alt).toEqual({});
    // The point of the whole thing: nothing describing the OLD frame survives.
    expect(JSON.stringify(alt)).not.toContain('paver');
    expect(JSON.stringify(alt)).not.toContain('摊铺机');
  });

  it('returns the focal point to dead centre, the value a fresh upload starts at', async () => {
    const id = await seedRow({ focal_x: 0.2, focal_y: 0.8 });
    await replace({ id, oldPath: '/old.webp', newPath: '/uploads/new.webp' });

    const row = await read(id);
    expect(Number(row.focal_x)).toBe(0.5);
    expect(Number(row.focal_y)).toBe(0.5);
  });

  it('keeps the id and takes the new path, size and origin', async () => {
    const id = await seedRow();
    await replace({ id, oldPath: '/old.webp', newPath: '/uploads/new.webp' });

    const row = await read(id);
    expect(row.id).toBe(id);
    expect(row.path).toBe('/uploads/new.webp');
    expect(row.width).toBe(2400);
    expect(row.height).toBe(1350);
    expect(row.origin).toBe('upload');
  });

  it('throws and changes nothing when the target row is gone', async () => {
    await expect(
      replace({ id: 999999, oldPath: '/old.webp', newPath: '/uploads/new.webp' })
    ).rejects.toThrow();
  });
});

describe('applyMediaReplacement — repointing the references', () => {
  async function seedBlock(data) {
    const p = await query("INSERT INTO pages (slug, status) VALUES ('home', 'published')");
    await query(
      `INSERT INTO page_translations (page_id, locale, title, og_image, status)
       VALUES (?, 'en', 'Home', '/old.webp', 'published')`,
      [p.insertId],
    );
    const b = await query("INSERT INTO blocks (page_id, type, sort_order) VALUES (?, 'hero', 0)", [p.insertId]);
    await query(
      `INSERT INTO block_translations (block_id, locale, data, status)
       VALUES (?, 'en', ?, 'published')`,
      [b.insertId, JSON.stringify(data)],
    );
    return b.insertId;
  }

  it('repoints a whole-string image reference and reports the page slug', async () => {
    const id = await seedRow();
    const blockId = await seedBlock({ image: '/old.webp', headline: 'Hi' });

    const slugs = await replace({ id, oldPath: '/old.webp', newPath: '/uploads/new.webp' });
    expect(slugs).toContain('home');

    const [bt] = await query('SELECT data FROM block_translations WHERE block_id = ?', [blockId]);
    const data = typeof bt.data === 'string' ? JSON.parse(bt.data) : bt.data;
    expect(data.image).toBe('/uploads/new.webp');
  });

  it('repoints the social preview image column too', async () => {
    const id = await seedRow();
    await seedBlock({ image: '/old.webp' });

    await replace({ id, oldPath: '/old.webp', newPath: '/uploads/new.webp' });
    const [pt] = await query('SELECT og_image FROM page_translations');
    expect(pt.og_image).toBe('/uploads/new.webp');
  });

  it('deletes the surplus upload row so the target row can take the new path', async () => {
    const id = await seedRow();
    const surplus = await query(
      `INSERT INTO media (path, bytes, mime, alt) VALUES ('/uploads/new.webp', 1, 'image/webp', '{}')`,
    );
    await replace({
      id, oldPath: '/old.webp', newPath: '/uploads/new.webp', surplusId: surplus.insertId,
    });

    const rows = await query('SELECT id FROM media WHERE path = ?', ['/uploads/new.webp']);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(id);
  });
});
