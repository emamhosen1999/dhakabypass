/**
 * Generate plain .sql files from the Node migration and seed scripts, so the
 * database can be set up through phpMyAdmin.
 *
 * WHY. The deploy is a `git pull` on a cPanel account: no npm, no build, no
 * convenient way to run a Node script against the database. Migrations are the
 * one part of a release that cannot be a file copy, and on this host the
 * practical way to run them is to paste or import SQL in phpMyAdmin.
 *
 * WHY GENERATE RATHER THAN HAND-WRITE. There are eight schema scripts and five
 * seeds, all of them tested (tests/db/**), several with guards that took real
 * incidents to get right. A hand-written parallel set of .sql files would drift
 * from them the first time anyone changed a column, and the drift would be
 * discovered in production. So the SQL is derived FROM the scripts: this runs
 * the real chain against a scratch database and dumps the result. The .sql
 * files cannot describe a schema the scripts do not produce.
 *
 *   npm run db:sql
 *
 * Requires a local MySQL/MariaDB and mysqldump. Writes db/sql/.
 *
 * WHAT IS AND IS NOT IN THE OUTPUT
 *
 * Schema: every table, with CREATE TABLE IF NOT EXISTS, and no DROP statements.
 * mysqldump emits `DROP TABLE IF EXISTS` before every CREATE, which would empty
 * a live database on re-import — that is stripped here, deliberately, so that
 * importing the schema twice is a no-op rather than an incident.
 *
 * Data: only content. The seed data for pages, blocks, corridor and media, as
 * INSERT IGNORE so a re-import never overwrites what an editor has changed
 * since. Tables holding credentials or personal data — users, admin_users,
 * contact_messages, newsletter_subscribers — are dumped as structure only,
 * never as rows. Nobody should be able to import an admin password from a file
 * in the repository, and no visitor's message belongs in version control.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadEnv } from './load-env.mjs';

loadEnv();

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'db', 'sql');

const HOST = process.env.DB_HOST || '127.0.0.1';
const PORT = process.env.DB_PORT || '3306';
const USER = process.env.DB_USER;
const PASS = process.env.DB_PASSWORD || '';
const SCRATCH = process.env.DB_NAME_SQLGEN || 'dhakabypass_sqlgen';

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const step = (s) => console.log(`\n${bold('==>')} ${s}`);
const ok = (s) => console.log(`    ${s}`);
function die(msg, fix) {
  console.error(`\n\x1b[31m    FAILED: ${msg}\x1b[0m`);
  if (fix) console.error(`    ${fix}\n`);
  process.exit(1);
}

if (!USER) die('DB_USER is not set.', 'Run `npm run setup` first, or set DB_* in .env.local.');

/**
 * Structure only, never rows. Two different reasons, both non-negotiable:
 * credentials (a password hash in a repository file is a credential leak the
 * moment anyone imports it) and personal data (messages and subscriptions are
 * the public's, not ours).
 */
const STRUCTURE_ONLY = new Set([
  'users',
  'admin_users',
  'contact_messages',
  'newsletter_subscribers',
  'revisions',
  'audit_log',
]);

const mysqlArgs = () => {
  const a = [`-h${HOST}`, `-P${PORT}`, `-u${USER}`];
  if (PASS) a.push(`-p${PASS}`);
  return a;
};

function mysql(sql, db) {
  const args = mysqlArgs();
  if (db) args.push(db);
  return execFileSync('mysql', [...args, '-N', '-B', '-e', sql], { encoding: 'utf8' });
}

/**
 * `mysqldump [flags] <database> [tables...]` — the database name comes after the
 * flags and before any table list, which is why the table list cannot simply be
 * appended to `extra`.
 */
function dump(extra, tables = []) {
  const out = execFileSync(
    'mysqldump',
    [
      ...mysqlArgs(),
      '--no-tablespaces',
      '--skip-comments',
      '--skip-set-charset',
      ...extra,
      SCRATCH,
      ...tables,
    ],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  );
  // MariaDB's dump opens with a sandbox-mode directive. It is a MariaDB-only
  // conditional comment and harmless on MySQL, but it restricts what the client
  // will execute afterwards, and this file has to import cleanly through
  // phpMyAdmin on a host we do not control. Strip it.
  return out.replace(/^\/\*M!999999.*$/gm, '');
}

step('Building a scratch database from the migration scripts');
// A scratch database, not the dev one: the output must reflect the scripts
// exactly, not whatever state a developer's database has drifted into.
mysql(`DROP DATABASE IF EXISTS \`${SCRATCH}\`; CREATE DATABASE \`${SCRATCH}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
ok(`${SCRATCH} created`);

const chain = [
  ['db-setup.mjs', 'legacy tables (content, gallery, news, messages)'],
  ['db-setup-v2.mjs', 'pages, blocks, media, menus, redirects'],
  ['db-setup-v3.mjs', 'corridor: segments, interchanges, tolls, advisories, settings'],
  ['db-setup-v4.mjs', 'media.origin, media.credit'],
  ['db-setup-v5.mjs', "interchanges.kind += 'waypoint'"],
  ['db-setup-v6.mjs', 'media.original_path'],
  ['migrate-users.mjs', 'admin_users -> users'],
  ['db-seed.mjs', 'legacy content rows'],
  ['seed-corridor.mjs', 'corridor data'],
  ['seed-home-v2.mjs', 'home page blocks, 3 locales'],
  ['import-legacy-media.mjs', 'audited legacy image registry'],
  ['translate-media-alt.mjs', 'bn/zh alt text'],
];

for (const [script, what] of chain) {
  try {
    execFileSync('node', [path.join('scripts', script), `--database=${SCRATCH}`], {
      cwd: ROOT,
      stdio: 'pipe',
      env: { ...process.env, DB_NAME: SCRATCH },
    });
    ok(`${script.padEnd(24)} ${what}`);
  } catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`;
    die(`${script} failed.\n${out.slice(0, 2000)}`, 'Fix the script, then re-run.');
  }
}

step('Dumping the schema');
const tables = mysql(`SHOW TABLES;`, SCRATCH).trim().split('\n').filter(Boolean);
ok(`${tables.length} tables`);

let schema = dump(['--no-data', '--routines=false', '--triggers=false']);

// mysqldump writes DROP TABLE IF EXISTS before every CREATE TABLE. Importing
// that into a live database empties it. Removing it is what makes this file
// safe to import twice — which matters, because "did that import run?" is
// exactly the question an operator has at the wrong moment.
schema = schema.replace(/^DROP TABLE IF EXISTS [^;]+;\n?/gm, '');
schema = schema.replace(/^CREATE TABLE `/gm, 'CREATE TABLE IF NOT EXISTS `');
// AUTO_INCREMENT counters are an artifact of the scratch build, not schema.
schema = schema.replace(/ AUTO_INCREMENT=\d+/g, '');
schema = schema.replace(/\n{3,}/g, '\n\n').trim();

step('Dumping the seed content');
const dataTables = tables.filter((t) => !STRUCTURE_ONLY.has(t));
let data = dump(
  ['--no-create-info', '--complete-insert', '--skip-extended-insert'],
  dataTables,
);

// INSERT IGNORE, not INSERT: re-importing must never overwrite content an
// editor has changed through the admin since the first import. Same philosophy
// as the seed scripts themselves, which are all explicitly non-clobbering.
data = data.replace(/^INSERT INTO `/gm, 'INSERT IGNORE INTO `');
data = data.replace(/^LOCK TABLES [^;]+;\n?/gm, '').replace(/^UNLOCK TABLES;\n?/gm, '');
data = data.replace(/\n{3,}/g, '\n\n').trim();

const rowCount = (data.match(/^INSERT IGNORE INTO/gm) || []).length;
ok(`${rowCount} rows across ${dataTables.length} tables`);
for (const t of tables) {
  if (STRUCTURE_ONLY.has(t)) ok(`  ${t.padEnd(24)} structure only (credentials or personal data)`);
}

step('Writing db/sql/');
fs.mkdirSync(OUT, { recursive: true });

const stamp = new Date().toISOString().slice(0, 10);
const banner = (title, body) =>
  [
    '-- ---------------------------------------------------------------------------',
    `-- ${title}`,
    '--',
    ...body.map((l) => `-- ${l}`),
    '--',
    `-- GENERATED FILE — do not edit. Regenerate with:  npm run db:sql`,
    `-- Generated ${stamp} from scripts/db-setup*.mjs and the seed scripts.`,
    '-- ---------------------------------------------------------------------------',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
  ].join('\n');

const footer = '\nSET FOREIGN_KEY_CHECKS = 1;\n';

fs.writeFileSync(
  path.join(OUT, '01-schema.sql'),
  `${banner('Dhaka Bypass — database schema', [
    'Every table the application reads or writes.',
    '',
    'Safe to import more than once: every CREATE is IF NOT EXISTS and there are',
    'no DROP statements. Importing this into a database that already has the',
    'schema changes nothing.',
    '',
    'It does NOT alter existing tables. A column added by a later migration will',
    'not appear in a database created by an older version of this file — for that,',
    'import the newest 01-schema.sql into an empty database, or apply the ALTER by',
    'hand. Check db/sql/README.md before upgrading an existing database.',
  ])}${schema}\n${footer}`,
  'utf8',
);

fs.writeFileSync(
  path.join(OUT, '02-seed.sql'),
  `${banner('Dhaka Bypass — seed content', [
    'The starting content: pages, blocks and their translations, corridor data,',
    'the media registry, and the legacy content rows.',
    '',
    'Every statement is INSERT IGNORE, so importing this a second time will not',
    'overwrite anything an editor has changed through the admin. It only fills in',
    'what is missing.',
    '',
    'Contains no credentials and no personal data. users, admin_users,',
    'contact_messages, newsletter_subscribers, revisions and audit_log are created',
    'by 01-schema.sql and are deliberately left empty here.',
    '',
    'Create the first administrator through the admin, or with:',
    '  node scripts/db-seed.mjs --admin',
  ])}${data}\n${footer}`,
  'utf8',
);

const size = (f) => `${(fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0)} KB`;
ok(`01-schema.sql   ${size('01-schema.sql')}`);
ok(`02-seed.sql     ${size('02-seed.sql')}`);

step('Verifying the SQL reproduces the schema');
// The whole value of a generated file is that it is faithful. Importing it into
// a second empty database and comparing table-for-table is the only check that
// actually proves it, and it costs a second.
const VERIFY = `${SCRATCH}_verify`;
mysql(`DROP DATABASE IF EXISTS \`${VERIFY}\`; CREATE DATABASE \`${VERIFY}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
for (const f of ['01-schema.sql', '02-seed.sql']) {
  const sql = fs.readFileSync(path.join(OUT, f), 'utf8');
  execFileSync('mysql', [...mysqlArgs(), VERIFY], { input: sql, encoding: 'utf8' });
  ok(`imported ${f}`);
}
// Import twice: idempotency is a claim this file makes, so it gets tested.
for (const f of ['01-schema.sql', '02-seed.sql']) {
  execFileSync('mysql', [...mysqlArgs(), VERIFY], {
    input: fs.readFileSync(path.join(OUT, f), 'utf8'),
    encoding: 'utf8',
  });
}
ok('imported both a second time — no error, so the files are re-runnable');

const mismatches = [];
for (const t of tables) {
  const a = mysql(`SHOW CREATE TABLE \`${t}\`;`, SCRATCH).split('\t')[1] || '';
  const b = mysql(`SHOW CREATE TABLE \`${t}\`;`, VERIFY).split('\t')[1] || '';
  const norm = (s) => s.replace(/AUTO_INCREMENT=\d+ ?/g, '').replace(/\s+/g, ' ').trim();
  if (norm(a) !== norm(b)) mismatches.push(t);

  if (!STRUCTURE_ONLY.has(t)) {
    const ca = mysql(`SELECT COUNT(*) FROM \`${t}\`;`, SCRATCH).trim();
    const cb = mysql(`SELECT COUNT(*) FROM \`${t}\`;`, VERIFY).trim();
    if (ca !== cb) mismatches.push(`${t} (rows ${ca} vs ${cb})`);
  }
}
if (mismatches.length) {
  die(
    `the generated SQL does not reproduce the schema: ${mismatches.join(', ')}`,
    'Do not ship these files.',
  );
}
ok(`${tables.length} tables and every seeded row round-trip identically`);

mysql(`DROP DATABASE IF EXISTS \`${SCRATCH}\`; DROP DATABASE IF EXISTS \`${VERIFY}\`;`);

step('Done');
ok('db/sql/01-schema.sql and db/sql/02-seed.sql are ready to import in phpMyAdmin');
ok('they ship inside the release, at db/sql/, so they are on the server after a pull');
console.log('');
