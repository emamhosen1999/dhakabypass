import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { registerAllBlocks } from '../../lib/blocks/index.js';
import { getBlock, validateBlockData } from '../../lib/blocks/registry.js';

const root = path.resolve(import.meta.dirname, '../..');

/**
 * Every block the numbered seed files place must be a registered type and
 * its English data must pass the same validation the editor applies on
 * Publish. A seeded block that fails here would render (BlockRenderer does
 * not validate) but could never be re-saved by an operator without first
 * fixing a field they did not write — the worst kind of surprise.
 *
 * Parses the two seed shapes: single-row `INSERT ... VALUES (id, page, 'type', ...`
 * and the generated `SELECT id, @p, 'type', ...` form, with the matching
 * block_translations rows for locale 'en'.
 */
function seededBlocks() {
  const types = new Map();
  const data = new Map();
  for (const f of fs.readdirSync(path.join(root, 'db/sql')).filter((x) => /^\d\d-.*\.sql$/.test(x)).sort()) {
    const sql = fs.readFileSync(path.join(root, 'db/sql', f), 'utf8');
    for (const m of sql.matchAll(/INSERT IGNORE INTO `blocks`[^;]*?VALUES\s*([\s\S]*?);/g)) {
      for (const row of m[1].matchAll(/\((\d+),\s*(?:\d+|@\w+),\s*'([\w-]+)'/g)) types.set(Number(row[1]), { type: row[2], file: f });
    }
    for (const m of sql.matchAll(/INSERT IGNORE INTO `blocks`[^;]*?SELECT\s+(\d+),\s*@\w+,\s*'([\w-]+)'/g)) types.set(Number(m[1]), { type: m[2], file: f });
    for (const m of sql.matchAll(/INSERT IGNORE INTO `block_translations`[^;]*?SELECT\s+(\d+),\s*'en',\s*'((?:[^']|'')*)'/g)) {
      // Undo the SQL string escaping: two quotes to one, two backslashes to
      // one (MySQL does the same when it stores the row).
      data.set(Number(m[1]), JSON.parse(m[2].replace(/''/g, "'").replace(/\\\\/g, '\\')));
    }
  }
  return { types, data };
}

describe('seeded blocks validate against their types', () => {
  registerAllBlocks();
  const { types, data } = seededBlocks();

  it('found the generated legacy-content blocks', () => {
    expect([...types.keys()].filter((id) => id >= 400).length).toBeGreaterThanOrEqual(33);
  });

  it('every seeded block is a registered type', () => {
    for (const [id, { type, file }] of types) expect(getBlock(type), `${file}: block ${id} type ${type}`).toBeTruthy();
  });

  it('every generated block passes Publish validation', () => {
    let checked = 0;
    for (const [id, d] of data) {
      const t = types.get(id);
      if (!t) continue;
      const v = validateBlockData(t.type, d);
      expect(v.ok, `${t.file}: block ${id} (${t.type}): ${v.errors.join('; ')}`).toBe(true);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(33);
  });
});
