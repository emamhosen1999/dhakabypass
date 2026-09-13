/**
 * The SQL files this build of the code expects the database to have been
 * given (W6.6), and the check that says which are missing.
 *
 * The list is checked in, not read from db/sql at runtime: the standalone
 * server does not carry that directory, and a list that lived only on disk
 * could not be tested against the code that depends on it.
 * tests/unit/migrations-list.test.js fails when this list and db/sql/
 * disagree, so adding a file without listing it — or listing one that does
 * not exist — is caught at commit, not at boot.
 *
 * Pure: `missingMigrations` takes the ledger rows so it is testable without
 * a database. The reader beside it is what boot-check and preflight call.
 */

export const MIGRATIONS = Object.freeze([
  '01-schema',
  '02-seed',
  '03-content-recovery',
  '07-block-order',
  '09-ui-strings',
  '10-route-meta',
  '11-block-fields',
  '12-toll-od-matrix',
  '13-travel-rules',
  '14-legal-pages',
  '15-emergency-contact',
  '16-travel-pages',
  '17-news-gallery-contact',
  '18-home-corridor',
  '19-service-requests',
  '20-grievance-form',
  '21-travel-redirect',
  '22-callout-migration',
  '23-not-found',
  '24-legacy-content',
  '25-partner-logos',
  '26-schema-migrations',
  '27-gallery-flags',
  '28-toll-calculator-placement',
  '29-legacy-as-current',
  '30-pending-drafts',
  '31-cms-consistency',
]);

/** Names in MIGRATIONS that the ledger does not carry, in import order. */
export function missingMigrations(appliedNames) {
  const applied = new Set((appliedNames || []).map((n) => String(n).trim()));
  return MIGRATIONS.filter((name) => !applied.has(name));
}

/**
 * Read the ledger. A database with no `schema_migrations` table at all has
 * never received 26-schema-migrations.sql, which is reported as "all of them
 * missing" — the honest answer, and the one whose fix (import the files in
 * order) is the same either way. Any other failure is returned as an error
 * rather than thrown, so the caller can report it as a problem of its own.
 */
export async function readAppliedMigrations(query) {
  try {
    const rows = await query('SELECT name FROM schema_migrations');
    return { applied: (rows || []).map((r) => r.name), error: null };
  } catch (err) {
    if (err?.code === 'ER_NO_SUCH_TABLE') return { applied: [], error: null };
    return { applied: [], error: err?.code || err?.message || 'unknown' };
  }
}

/** The problem entry boot-check and preflight print. */
export function migrationProblem(missing, error) {
  if (error) {
    return {
      key: 'DB_MIGRATIONS',
      message: `Could not read schema_migrations (${error}).`,
      why: 'The database answered the connection but not the ledger of applied SQL files, so this build cannot tell whether the schema it expects is there.',
      fix: 'Check DB_HOST/DB_NAME/DB_USER/DB_PASSWORD and the user\'s grants, then restart.',
    };
  }
  if (!missing.length) return null;
  return {
    key: 'DB_MIGRATIONS',
    message: `The database is behind this build by ${missing.length} SQL file${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`,
    why: 'This code reads tables and rows those files create. Booting against a database without them answers pages with 500s and forms with nothing, silently.',
    fix: `Import, in order, through phpMyAdmin: ${missing.map((m) => `db/sql/${m}.sql`).join(', ')} — then restart (touch tmp/restart.txt).`,
  };
}
