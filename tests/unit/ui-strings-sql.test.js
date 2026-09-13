/**
 * db/sql/09-ui-strings.sql — the `ui_strings` table.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE SEEDS NOTHING
 * ---------------------------------------------------------------------------
 * The first draft of it inserted all 546 rows — every key in
 * lib/i18n/ui.js and lib/i18n/map-ui.js, in all three locales — so that the
 * table would arrive full. That is wrong three times over, and the tests below
 * are what stop it coming back:
 *
 *   1. It erases the distinction the screen exists to show. `ui_strings` is an
 *      OVERRIDE table: a row means "an operator changed this". Seed every row
 *      and every one of the 182 strings reads as "changed here" on a database
 *      nobody has touched, so an operator can no longer see what they edited
 *      or what "use the built-in wording again" would restore.
 *
 *   2. It silently pins the site to the wording of the release that seeded it.
 *      The import is `INSERT IGNORE` and it is run by hand, months later
 *      (db/sql/README.md). A later release that corrects an English label would
 *      ship a code value the database already outranks — and nothing would say
 *      so.
 *
 *   3. It costs every page a payload it does not need. The overrides are
 *      handed to the browser for the client components that read them
 *      (components/chrome/UiStringsBridge.jsx); a fully seeded table is 16 KB
 *      of that per request to say exactly what the code already says.
 *
 * The table therefore ships EMPTY, every string falls back to code, and the
 * rows are only ever what an operator typed.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'db', 'sql', '09-ui-strings.sql');
const sql = fs.readFileSync(FILE, 'utf8');

/** The file without its `--` comments, so prose about DROP is not read as one. */
const statements = sql
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('--'))
  .join('\n');

describe('db/sql/09-ui-strings.sql creates the table', () => {
  it('creates `ui_strings` with the columns the repository queries', () => {
    expect(statements).toMatch(/CREATE TABLE IF NOT EXISTS `ui_strings`/);
    for (const column of ['string_key', 'locale', 'value']) {
      expect(statements).toMatch(new RegExp(`\`${column}\``));
    }
  });

  it('holds the value column wide enough for a full sentence', () => {
    // consentBody and contactDetailsPending are paragraphs; a truncated legal
    // notice is worse than a long column.
    expect(statements).toMatch(/`value`\s+text/i);
  });

  it('makes (string_key, locale) unique, so a save can upsert', () => {
    // lib/i18n/strings-repo.js writes ON DUPLICATE KEY UPDATE. Without this
    // key every save would append a second row and the reader would serve
    // whichever the engine returned first.
    expect(statements).toMatch(/UNIQUE KEY[^\n]*\(`string_key`,\s*`locale`\)/);
  });

  it('stores utf8mb4, because Bangla and Chinese are first-class here', () => {
    expect(statements).toMatch(/utf8mb4/);
  });
});

describe('db/sql/09-ui-strings.sql is safe to import twice', () => {
  it('drops and truncates nothing', () => {
    expect(statements).not.toMatch(/\bDROP\b/i);
    expect(statements).not.toMatch(/\bTRUNCATE\b/i);
  });

  it('guards the CREATE with IF NOT EXISTS', () => {
    expect(statements).not.toMatch(/CREATE TABLE(?! IF NOT EXISTS)/);
  });

  it('never overwrites a row an operator has edited', () => {
    // Any INSERT at all would have to be an IGNORE; there are none, and the
    // next test is why.
    for (const statement of statements.match(/INSERT[^;]*/gi) || []) {
      expect(statement).toMatch(/INSERT IGNORE/i);
    }
  });
});

describe('db/sql/09-ui-strings.sql ships the table EMPTY', () => {
  it('seeds no rows — a row means "an operator changed this"', () => {
    expect(statements).not.toMatch(/INSERT\b/i);
    expect(statements).not.toMatch(/\bREPLACE\s+INTO\b/i);
  });

  it('carries no hex-encoded string values from the code tables', () => {
    // The abandoned generator emitted `CONVERT(0x… USING utf8mb4)` tuples.
    expect(statements).not.toMatch(/CONVERT\(0x/i);
  });

  it('has no generator script left behind to regenerate a seed', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'scripts', 'generate-ui-strings-sql.mjs')))
      .toBe(false);
  });
});
