# Database SQL for cPanel

These two files are how the database is created and seeded on the server.

```
01-schema.sql   every table                       ~17 KB
02-seed.sql     the starting content               ~117 KB
03-content-recovery.sql  reviewed legacy content recovery and gallery additions
```

Both are **generated**. Do not edit them by hand — regenerate with `npm run db:sql`
and commit the result.

Import `03-content-recovery.sql` after the first two files on existing and fresh
installs. It updates only blocks that still match the former seeded content and
records the gallery publication once, preserving later editor choices. Its
sources and remaining gaps are in `docs/source-data/2026-09-06-content-recovery.md`.

## Later numbered files

Files above `03-` are hand-written, single-purpose migrations added by a task
that needed one. Each carries its own header explaining what it does, states
that it is idempotent, and says where in the order to run it. They are imported
the same way, through phpMyAdmin, after `01`/`02` (and `03` on an existing
install).

```
09-ui-strings.sql        creates `ui_strings` — the editable UI strings (W1.6)
12-toll-od-matrix.sql    creates `toll_od_rates` — the O–D fare matrix (INT.1)
```

`12-toll-od-matrix.sql` **does** seed rows, and is the deliberate exception to
the rule below. It is not an override table: there is no code-side fallback
matrix for a row to outrank, and an empty table means no toll calculator, which
is the thing being built. The 270 seeded fares are computed from the toll
formula DBEDC published on the previous website (reconstructed in
`lib/corridor/toll-formula.js`, checked against their own published figures in
`tests/unit/toll-formula.test.js`), and every one of them is marked provisional
**by the schema, not by a note**: `is_provisional` is a stored generated column
over `sro_number`, so no `UPDATE` can set it and a fare becomes authoritative
only by acquiring the S.R.O. citation that makes it so. The seed's column list
omits the citation fields, so every seeded row is provisional on arrival.
Re-importing is safe: `INSERT IGNORE` leaves a fare an operator has confirmed
alone.

It requires the toll-plaza rows from `02-seed.sql` — the fares reference
`interchanges` by foreign key and are skipped rather than orphaned if those are
missing.

`09-ui-strings.sql` **creates an empty table and seeds no rows**, on purpose.
The wording that ships with the site lives in `lib/i18n/ui.js` and
`lib/i18n/map-ui.js` in all three languages; a row in `ui_strings` means "an
operator changed this string at /admin/translations". That is what lets the
admin screen show which strings have been edited and which are still the
built-in wording, and what makes "use the built-in wording again" a thing it can
do. Seeding the code values would mark all 182 strings as edited on a database
nobody had touched, and would silently outrank any later correction to a label.

The site works fully — in English, Bangla and Chinese — whether or not this
file has ever been imported. Until it is, `/admin/translations` shows every
string with a notice that saving will fail, and the public site renders the
code values, which is what it rendered before W1.6.

## Why these exist

The deploy is a `git pull` on a cPanel account. There is no npm and no practical
way to run a Node script against the database there, so migrations — the one part
of a release that is not a file copy — are done as SQL through phpMyAdmin.

They are generated rather than written because the Node scripts in `scripts/` are
the real definition of the schema, they are covered by `tests/db/**`, and several
of their guards took actual incidents to get right. A hand-maintained parallel set
of `.sql` files would drift from them the first time someone added a column, and
the drift would be found in production. `scripts/generate-sql.mjs` runs the real
migration chain against a scratch database and dumps the result, then imports the
dump into a second empty database and compares every table and every row count.
The files cannot describe a schema the scripts do not produce.

## Importing, first time

In cPanel:

1. **MySQL Databases** — create the database and a user, and grant that user
   All Privileges on it.
2. **phpMyAdmin** — select the database, open **Import**, choose `01-schema.sql`,
   Go. Then the same for `02-seed.sql`.
3. Put the database name, user and password into the application's environment
   (see the runbook) and restart the app.

Order matters: `02-seed.sql` writes rows into tables `01-schema.sql` creates.

## Importing again later

Both files are safe to re-import, and this is deliberate — "did that import
actually run?" is a question people have at bad moments.

- `01-schema.sql` has **no `DROP` statements** and every `CREATE TABLE` is
  `IF NOT EXISTS`. Re-importing changes nothing.
- `02-seed.sql` uses **`INSERT IGNORE`** throughout. Re-importing fills in rows
  that are missing and never overwrites one that exists — so content an editor has
  changed through the admin survives.

Both are imported twice by the generator as part of its own verification, so this
is tested rather than asserted.

## What is deliberately NOT in these files

`users`, `admin_users`, `contact_messages`, `newsletter_subscribers`, `revisions`
and `audit_log` are created empty. Their rows are never dumped.

Two separate reasons, both firm: password hashes must not sit in a repository file
where importing them would install a known credential, and messages and
subscriptions belong to the people who sent them, not in version control.

Create the first administrator after importing, either through the admin sign-up
path or locally with:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' node scripts/db-seed.mjs --admin
```

## Upgrading a database that already has an older schema

`01-schema.sql` creates tables. It does **not** alter existing ones, so a column
added by a later migration will not appear in a database created from an older
copy of this file.

When a migration adds or changes a column, the schema file changes with it, and
the difference has to be applied by hand — read the `ALTER` in the matching
`scripts/db-setup-v*.mjs`, which states what it does and why, and run that one
statement in phpMyAdmin. There have been six such migrations so far and each is a
single guarded `ALTER`.

**Take a backup before any of this.** phpMyAdmin's **Export** tab, Quick, SQL —
that is the only rollback that exists for the database, and nothing else in this
project creates one.

## A host note

MariaDB has no real `JSON` type — `JSON` in a `CREATE TABLE` is an alias for
`LONGTEXT`, and `CAST(x AS JSON)` is a parse error. The production host runs
MariaDB 11.4. If you write a migration that touches a JSON column, pass the value
as a string and do not cast it; `scripts/db-seed.mjs` carries a note at the exact
line where this was got wrong once.
