import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Every numbered SQL file sets its connection charset before its first
 * statement. On 14 September 2026 two files imported through a MariaDB client
 * defaulting to latin1 stored all Bangla, Chinese and typographic punctuation
 * double-encoded on the live site.
 */
const DIR = path.resolve(import.meta.dirname, '../../db/sql');

describe('SQL files declare utf8mb4', () => {
  const files = fs.readdirSync(DIR).filter((f) => /^\d\d-.*\.sql$/.test(f));
  it.each(files)('%s sets NAMES utf8mb4 before any statement', (file) => {
    const statements = fs.readFileSync(path.join(DIR, file), 'utf8')
      .split('\n').filter((l) => l.trim() && !l.trim().startsWith('--') && !l.trim().startsWith('/*'));
    expect(statements[0]).toMatch(/^SET NAMES utf8mb4;/);
  });
});
