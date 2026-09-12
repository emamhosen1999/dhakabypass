import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';

const DB = process.env.DB_NAME_TEST;
process.env.DB_NAME = DB; // lib/db.js reads this

let query;
let withTransaction;
let applyMediaReplacement, pageSlugsUsingMedia;

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
  // v6 adds media.original_path, which applyMediaReplacement writes and the
  // legacy import reads back. Same DB_NAME handling as v4.
  execFileSync('node', ['scripts/db-setup-v6.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, DB_NAME: DB },
  });
  ({ query, withTransaction } = await import('../../lib/db.js'));
  ({ applyMediaReplacement, pageSlugsUsingMedia } = await import('../../lib/media/replace.js'));
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

/**
 * These two tests used to assert the OPPOSITE — that Replace cleared the alt
 * text and reset the focal point, on the reasoning that a description belongs
 * to the bytes and the bytes are gone. That was sound as far as it went, and
 * it was reversed deliberately in the alt-text work (task 0.9), for three
 * reasons this file should carry so nobody flips it back:
 *
 *   1. The documented use of Replace on this site — stated on the Media
 *      screen itself — is swapping the small web copies inherited from the old
 *      site for the ORIGINAL camera files of the SAME photographs. Thirty
 *      images, three languages. Clearing alt on each would destroy ninety
 *      correct descriptions and leave every picture undescribed by default.
 *
 *   2. When the old behaviour was written there was no way to write alt text
 *      back — no input existed anywhere in the admin. "Clear" therefore meant
 *      "lose forever, and email a developer". Now the alt fields sit on the
 *      same screen as the Replace button; an operator swapping in a genuinely
 *      different photograph can see the old sentence and change it.
 *
 *   3. A silently undescribed image is an accessibility regression by default,
 *      and Bangladesh's ICTD guideline treats WCAG 2.1 as the floor. Discarding
 *      the description must be a deliberate act — emptying the three boxes —
 *      not a side effect of a file upload.
 *
 * The unit test tests/unit/media-replace-preserves-alt.test.js asserts the
 * same contract against a mocked database; this one proves it against real
 * rows. CI caught the two disagreeing on its first ever run.
 */
describe('applyMediaReplacement — swapping the file keeps the description', () => {
  it('keeps the alt text in every language — replacing a file is not discarding its description', async () => {
    const id = await seedRow();
    const before = await read(id);
    const altBefore = typeof before.alt === 'string' ? JSON.parse(before.alt) : before.alt;
    expect(Object.keys(altBefore).length).toBeGreaterThan(0);

    await replace({ id, oldPath: '/old.webp', newPath: '/uploads/new.webp' });

    const row = await read(id);
    const alt = typeof row.alt === 'string' ? JSON.parse(row.alt) : row.alt;
    expect(alt).toEqual(altBefore);
  });

  it('keeps the focal point — the same photograph at a higher resolution has the same subject in the same place', async () => {
    const id = await seedRow({ focal_x: 0.2, focal_y: 0.8 });
    await replace({ id, oldPath: '/old.webp', newPath: '/uploads/new.webp' });

    const row = await read(id);
    expect(Number(row.focal_x)).toBe(0.2);
    expect(Number(row.focal_y)).toBe(0.8);
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

  it('repoints an image pasted into a richtext body, which the LIKE prefilter must also reach', async () => {
    const id = await seedRow();
    const blockId = await seedBlock({ body: '<p>Text</p><img src="/old.webp" alt="x">' });

    const slugs = await replace({ id, oldPath: '/old.webp', newPath: '/uploads/new.webp' });
    expect(slugs).toContain('home');

    const [bt] = await query('SELECT data FROM block_translations WHERE block_id = ?', [blockId]);
    const data = typeof bt.data === 'string' ? JSON.parse(bt.data) : bt.data;
    expect(data.body).toBe('<p>Text</p><img src="/uploads/new.webp" alt="x">');
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


describe('pageSlugsUsingMedia — against a real database', () => {
  // The unit tests mock `q`, which is how a broken ESCAPE literal in the
  // LIKE prefilter (`'\'` in a template string became SQL `''`) shipped
  // unnoticed: every call threw, the media alt action fell over AFTER saving,
  // and the delete guard could never have run. This is the test that would
  // have caught it.
  async function seedPage(slug, data) {
    const p = await query('INSERT INTO pages (slug, status) VALUES (?, ?)', [slug, 'published']);
    await query(
      "INSERT INTO page_translations (page_id, locale, title, status) VALUES (?, 'en', ?, 'published')",
      [p.insertId, slug],
    );
    const b = await query("INSERT INTO blocks (page_id, type, sort_order) VALUES (?, 'hero', 0)", [p.insertId]);
    await query(
      "INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, 'en', ?, 'published')",
      [b.insertId, JSON.stringify(data)],
    );
  }

  it('names the pages whose blocks reference the path, and no others', async () => {
    await seedPage('uses-it', { image: '/photo/1.webp' });
    await seedPage('nested', { body: '<p>x</p><img src="/photo/1.webp">' });
    await seedPage('prefix-only', { image: '/photo/10.webp' });
    await seedPage('unrelated', { image: '/other.webp' });
    expect((await pageSlugsUsingMedia(query, '/photo/1.webp')).sort()).toEqual(['nested', 'uses-it']);
    expect(await pageSlugsUsingMedia(query, '/nowhere.webp')).toEqual([]);
  });

  it('survives LIKE metacharacters in the path', async () => {
    await seedPage('under', { image: '/uploads/a_b%c.webp' });
    await seedPage('near', { image: '/uploads/aXb-c.webp' });
    expect(await pageSlugsUsingMedia(query, '/uploads/a_b%c.webp')).toEqual(['under']);
  });
});
