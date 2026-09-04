# Working on this project in a cloud session

Read this before touching anything. The project has a few load-bearing rules
that are not obvious from the code, and two of them have already caused real
damage.

## Getting a working environment

```bash
npm run setup
```

Idempotent. Installs dependencies, creates `.env.local` from `.env.example`
with a generated `AUTH_SECRET`, starts MariaDB if it can find one, runs the
whole migration chain, and seeds. In a devcontainer this has already run.

If there is no database the app still renders — every reader degrades to safe
defaults rather than throwing, deliberately, because the production host is
memory-limited and a dead query must not take the front door down. But the
eight `tests/db/**` files and every seed script need one.

## Verifying

```bash
npm test          # expect: 51 files / 446 tests, 0 skipped
npm run build     # expect: ✓ Compiled successfully
npm run test:e2e  # expect: 74 passed
```

**A test that reports as `skipped` is not a passing test.** It means the file
failed to collect — almost always a bad relative path. This has bitten the
project twice, and both times the summary line looked green. From
`tests/unit/`, project imports need `../../`.

Vitest only collects `tests/unit/**/*.test.{js,jsx}` and `tests/db/**/*.test.js`.
A test written anywhere else silently never runs.

## Rules that are not negotiable

**Never modify these.** The old site is still live and is being replaced
alongside, not in place. `tests/e2e/legacy.spec.js` is the tripwire.

```
app/(site)/          content/              middleware.js
lib/content.js       lib/admin-sections.js lib/news.js     lib/gallery.js
components/SiteHeader.jsx  components/SiteFooter.jsx
scripts/db-setup.mjs       scripts/db-setup-v2.mjs
```

**Never `git commit --no-verify`.** **Never print or commit `.env.local`.**

**Never deploy, never SSH to the production host, never push to the server**
without the client saying go in the moment. Approval for one deploy is not
approval for the next.

## Things that will waste your time if you do not know them

**Seeding does not invalidate the page cache.** `getPageBlocksCached` wraps
`unstable_cache`, whose entries live in `.next/cache/fetch-cache` and survive a
server restart. Run a seed script, look at the dev server, and you will see
stale content. Stop the server, delete that directory, restart. Only the
admin's own `revalidatePage()` clears it in production, and a standalone script
cannot call it.

**Migration order is load-bearing.** `npm run db:migrate` runs the chain in the
right order. `seed-corridor.mjs` writes rows with `kind='waypoint'`, which only
exists after `db-setup-v5.mjs`; on a non-strict MariaDB those values are
silently coerced to empty strings rather than erroring.

**Destructive scripts exist.** `cleanup-corridor-tables.mjs` drops five tables.
It now refuses without an explicit `--database`, refuses the live database name,
and refuses anything not ending in `_test` without `--force`. Those guards are
there because it used to default to the live database. Do not weaken them.

**Only one agent should build at a time.** Next keeps a single `.next`
directory. Parallel builds wipe each other's chunks and produce pages served
with no stylesheet at all — which looks exactly like a serious CSS bug and has
already sent one agent chasing three phantom defects. Use separate worktrees, or
run builds serially.

## What is true about the content

Most published figures are unverified, and that is deliberate and recorded.

- `docs/source-data/2026-09-04-legacy-content-audit.md` — every claim on the old
  site, classified. **Six of about 116 are confirmed.**
- `docs/source-data/2026-09-03-image-library-audit.md` — every inherited image.
  Seven are rejected as third-party or misrepresentative; four of those are live
  on the old site today.
- `docs/source-data/2026-09-03-client-decisions.md` — what the client has
  decided, and what each decision costs if wrong.

**Do not publish a figure that is not in one of those documents as confirmed.**
If a page needs a fact nobody has, build the shell and record the question. An
invented figure inside a well-built page is worse than a gap, because it looks
authoritative.

The Bangla and Chinese were written by Claude and **have not been reviewed by a
native speaker.** That is the client's explicit decision, and it is the open
risk on the site.

## Where things are

| | |
|---|---|
| New site | `app/[locale]/` — en, bn, zh, English fallback per block |
| Old site | `app/(site)/` — still live, do not touch |
| Blocks | `lib/blocks/types/*.js` + `components/blocks/*.jsx`; a type is one module |
| Admin | `app/admin/(dash)/` — new tree; `app/admin/actions.js` is the legacy one |
| Corridor data | `lib/corridor/`, seeded by `scripts/seed-corridor.mjs` |
| Plans | `docs/superpowers/plans/` |
| Deployment | `docs/deployment/` — read the readiness review before deploying |

## The state of the deployment

**There is no working deploy path yet.** The readiness review found the stated
model and the actual build output are inconsistent: `.next` is gitignored while
three documents say to commit it, `output: 'standalone'` omits `public/` and
`.next/static` with nothing copying them in, and
`/home/aeos365/dhakabypass.com` is not a git repo. Fixing that is the next
piece of work, and it must be proved on a staging subdomain before the live
domain.
