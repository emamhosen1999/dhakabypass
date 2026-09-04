# Database SQL for cPanel

These two files are how the database is created and seeded on the server.

```
01-schema.sql   every table                       ~17 KB
02-seed.sql     the starting content               ~117 KB
```

Both are **generated**. Do not edit them by hand — regenerate with `npm run db:sql`
and commit the result.

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
