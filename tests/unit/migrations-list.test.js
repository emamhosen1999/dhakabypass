import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MIGRATIONS, missingMigrations, migrationProblem, readAppliedMigrations } from '../../lib/db/migrations.js';

const root = path.resolve(import.meta.dirname, '../..');

/**
 * W6.6: the list of SQL files the code expects is checked in. These keep it
 * honest against db/sql/ and pin the gate's behaviour.
 */
describe('MIGRATIONS', () => {
  const onDisk = fs.readdirSync(path.join(root, 'db/sql'))
    .filter((f) => /^\d\d-.*\.sql$/.test(f)).map((f) => f.replace(/\.sql$/, '')).sort();

  it('matches db/sql/ exactly, in order', () => {
    expect([...MIGRATIONS]).toEqual(onDisk);
  });

  it('has no two files with the same number', () => {
    const numbers = MIGRATIONS.map((m) => m.slice(0, 2));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('every file after the ledger records itself', () => {
    const after = MIGRATIONS.slice(MIGRATIONS.indexOf('26-schema-migrations') + 1);
    for (const name of after) {
      const sql = fs.readFileSync(path.join(root, 'db/sql', `${name}.sql`), 'utf8');
      expect(sql, `${name}.sql must end with its schema_migrations row`).toMatch(new RegExp(`INSERT IGNORE INTO \`schema_migrations\`[^;]*'${name}'`));
    }
    const ledger = fs.readFileSync(path.join(root, 'db/sql/26-schema-migrations.sql'), 'utf8');
    for (const name of MIGRATIONS.slice(0, MIGRATIONS.indexOf('26-schema-migrations') + 1)) {
      expect(ledger, name).toContain(`('${name}')`);
    }
  });
});

describe('the schema gate', () => {
  it('names the missing files in import order', () => {
    const applied = MIGRATIONS.filter((m) => m !== '19-service-requests' && m !== '24-legacy-content');
    expect(missingMigrations(applied)).toEqual(['19-service-requests', '24-legacy-content']);
    expect(missingMigrations(MIGRATIONS)).toEqual([]);
    expect(missingMigrations([])).toEqual([...MIGRATIONS]);
  });

  it('reports the exact files to import, and nothing when complete', () => {
    const p = migrationProblem(['19-service-requests'], null);
    expect(p.key).toBe('DB_MIGRATIONS');
    expect(p.message).toContain('behind this build by 1 SQL file: 19-service-requests');
    expect(p.fix).toContain('db/sql/19-service-requests.sql');
    expect(migrationProblem([], null)).toBeNull();
    expect(migrationProblem([], 'ER_ACCESS_DENIED_ERROR').message).toContain('Could not read schema_migrations');
  });

  it('treats a database without the ledger table as having none applied', async () => {
    const noTable = async () => { const e = new Error('no such table'); e.code = 'ER_NO_SUCH_TABLE'; throw e; };
    expect(await readAppliedMigrations(noTable)).toEqual({ applied: [], error: null });
    const denied = async () => { const e = new Error('denied'); e.code = 'ER_ACCESS_DENIED_ERROR'; throw e; };
    expect((await readAppliedMigrations(denied)).error).toBe('ER_ACCESS_DENIED_ERROR');
    expect(await readAppliedMigrations(async () => [{ name: '01-schema' }])).toEqual({ applied: ['01-schema'], error: null });
  });
});
