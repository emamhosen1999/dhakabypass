import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

/**
 * 22-callout-migration.sql turns every inline provenance marker the seeds
 * ship — <p class="db-pending">, <div class="db-archive"> — into a callout
 * block. This pins that it covers all of them: a seed row that carries a
 * marker whose block the migration does not name would survive as the
 * fragile hand-typed form the migration exists to remove.
 */
describe('22-callout-migration.sql', () => {
  const migration = read('db/sql/22-callout-migration.sql');
  // One `-- /<slug> sort N (source block N): shape` line per converted block.
  const covered = [...migration.matchAll(/^-- \/(\S+) sort \d+ \(source block (\d+)\): (\S+)$/gm)]
    .map((m) => ({ slug: m[1], sourceId: Number(m[2]), shape: m[3] }));

  it('was generated from seeded blocks that really carry a marker', () => {
    // The migration records the seed id of each block it was generated from.
    // Each must be a block_translations row in the seeds that carries a
    // marker. The converse — that no marker survives — is asserted against a
    // real fresh import in tests/db/fresh-import.test.js, because
    // 03-content-recovery.sql rewrites some 02-seed bodies (block 12's marker
    // is gone before 22 runs) and a textual check would not know that.
    const seeds = ['db/sql/02-seed.sql', 'db/sql/13-travel-rules.sql', 'db/sql/14-legal-pages.sql'];
    const withMarkers = new Set();
    for (const f of seeds) {
      for (const line of read(f).split('\n')) {
        if (!/db-pending|db-archive/.test(line)) continue;
        for (const m of line.matchAll(/\((\d+),\s*'(?:en|bn|zh)',\s*'\{/g)) withMarkers.add(Number(m[1]));
      }
    }
    expect(covered.length).toBe(15);
    for (const c of covered) expect(withMarkers, `source block ${c.sourceId}`).toContain(c.sourceId);
  });

  it('locates blocks by page slug and marker text, never by a bare id or sort order', () => {
    // 02-seed.sql and a re-seeded development database number the same
    // blocks differently, and 07-block-order.sql renumbers sort orders.
    expect(migration).not.toMatch(/WHERE `block_id` = \d+/);
    expect(migration).not.toMatch(/`page_id` = \d+/);
    expect(migration).not.toMatch(/`sort_order` = \d+/);
    for (const c of covered) expect(migration).toContain(`p.\`slug\` = '${c.slug}'`);
    expect(migration).toMatch(/INSTR\(JSON_UNQUOTE\(JSON_EXTRACT\(t\.`data`, '\$\.body'\)\), '/);
  });

  it('is guarded so a re-import is a no-op', () => {
    // Translation rewrites require the marker to still be present; the type
    // flip requires every translation to already carry a tone; inserts
    // require the marker on the source block.
    const statements = migration.split(';\n').filter((s) => /^(UPDATE|INSERT)/m.test(s));
    expect(statements.length).toBeGreaterThan(0);
    for (const s of statements) {
      expect(s).toMatch(/LIKE '%db-(pending|archive)%'|JSON_EXTRACT\(`data`, '\$\.tone'\) IS NULL/);
    }
  });

  it('emits callouts of the two provenance tones only, with no hand-typed tag', () => {
    for (const m of migration.matchAll(/"tone":"(\w+)","heading":"([^"]*)"/g)) {
      expect(['pending', 'legacy']).toContain(m[1]);
      expect(m[2]).toBe('');
    }
    expect(covered.every((c) => /^(pending|legacy|prose,pending|prose,legacy)$/.test(c.shape))).toBe(true);
  });
});
