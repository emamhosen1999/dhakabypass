import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_TABLES } from '../../lib/db/tables.js';

const ROOT = path.resolve(import.meta.dirname, '../..');

describe('lib/db/tables.js', () => {
  it('matches the tables the numbered SQL files create and do not later drop', () => {
    const files = fs.readdirSync(path.join(ROOT, 'db/sql')).filter((f) => /^\d\d-.*\.sql$/.test(f)).sort();
    const tables = new Set();
    for (const f of files) {
      const sql = fs.readFileSync(path.join(ROOT, 'db/sql', f), 'utf8');
      for (const m of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?`([a-z_]+)`|DROP TABLE (?:IF EXISTS )?`([a-z_]+)`/g)) {
        if (m[1]) tables.add(m[1]); else tables.delete(m[2]);
      }
    }
    expect([...tables].sort()).toEqual([...EXPECTED_TABLES].sort());
  });
});
