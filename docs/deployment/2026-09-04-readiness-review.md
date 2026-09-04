# Deployment readiness review — 2026-09-04

**Repo:** `dhakabypass` @ `main` (53debc6)
**Target:** cPanel shared hosting (Namecheap `server904.web-hosting.com`, user `aeos365`),
Phusion Passenger, Node 22, MariaDB. Site folder `/home/aeos365/dhakabypass.com`.
**Status of the target today:** the OLD site is live at the domain. The new
`/[locale]/` site has never been deployed.

**Method.** Read from configuration and source only. No build was run, no dev server
started, no remote host contacted, no deploy script executed. `.env.local` was never
printed — only its variable *names* were listed. A concurrent agent was rebuilding
`.next` during this review, so build-output observations are from a snapshot and are
marked where that matters.

**What I could not determine from this repo, and would need to check elsewhere:**

- Whether `admin.dhakabypass.com` exists in cPanel with DNS and SSL.
- Whether the MariaDB user has the `CREATE` privilege (§4 depends on this).
- The host's `sql_mode` (§4 depends on this).
- Which URLs Google currently has indexed, and whether they carry trailing slashes.
  Nothing in the repo records the indexed set; §6 cannot be answered without it.
- Whether cPanel's Node.js selector on this account exposes a startup-file field that
  can point outside the app root, and whether it injects env vars as real process env.
- Passenger's exact handshake with a Node app on this account. The evidence in-repo is
  circumstantial (§5).

---

## 0. Headline — the deploy model and the build output are inconsistent

**This project cannot be deployed by `git pull` today. Not "with difficulty" — at all.**

Three documents state the deploy contract in near-identical words:

- `docs/superpowers/plans/2026-08-31-dhakabypass-foundations-design-system.md:14` —
  *"Build happens locally; **artifacts are committed**; server does `git pull` only."*
- `docs/superpowers/specs/2026-07-13-dhakabypass-dynamic-rebuild-design.md:46` —
  *"build LOCALLY, **commit built artifacts**, `git pull` on server."*
- `docs/superpowers/specs/2026-08-31-dhakabypass-reinnovation-design.md:256` — same.

And `.gitignore:2` says:

```
.next/
```

`git ls-files .next` returns **zero files**. The build artifact has never been
committed and cannot be committed while that line stands. A `git pull` on the server
delivers source code and `public/`, and nothing else. Passenger would have no
`server.js` to boot, because the only `server.js` this project has is the one
`next build` generates at `.next/standalone/server.js` — there is no `server.js`,
`app.js`, `.htaccess` or `.cpanel.yml` at the repo root (verified: `git ls-files`
shows 12 tracked root files, none of them an entry point).

The gap is wider than one ignore line, because `output: 'standalone'` does not produce
a self-contained directory. From the snapshot of a real local build:

| Piece | Where `next build` puts it | Size | In `.next/standalone`? | Tracked by git? |
|---|---|---|---|---|
| `server.js` + traced `node_modules` | `.next/standalone/` | 55 MB | — | **no** |
| Client JS/CSS chunks | `.next/static/` | 1.1 MB | **no** | **no** |
| Prerendered pages, manifests | `.next/standalone/.next/` | (in the 55 MB) | yes | **no** |
| Static assets (fonts, images) | `public/` | 9.5 MB | **no** | yes (66 files) |
| ISR / `unstable_cache` store | `.next/cache/` | 256 MB | no | **no** |

I confirmed by listing the snapshot that `.next/standalone/public` does not exist and
`.next/standalone/.next/static` does not exist. That is Next's documented behaviour:
after `next build` you must manually copy `public/` and `.next/static/` into the
standalone directory. **Nothing in this repo does that copy.** `package.json` has a
bare `"build": "next build"` and no `postbuild`, no deploy script, no
`.github/workflows`.

So the deploy model has three separate breaks, any one of which is fatal:

1. The 55 MB standalone artifact is gitignored, so `git pull` never delivers it.
2. Even if it were committed, `.next/static` and `public/` are not inside it, so the
   deployed app would serve HTML with every stylesheet and script 404ing.
3. There is no entry file at a path Passenger can be pointed at from a fresh clone.

**Two additional facts about the artifact, both from the snapshot:**

- The generated `server.js` bakes in absolute Windows paths:
  `"outputFileTracingRoot":"C:\\laragon\\www\\dhakabypass"` and
  `"turbo":{"root":"C:\\laragon\\www\\dhakabypass"}`. `distDir` is the relative
  `"./.next"`, so this is *probably* inert at runtime, but it has never been booted on
  Linux and I cannot prove it from here.
- `sharp` and its native `@img/*` bindings are traced into
  `.next/standalone/node_modules`. A Windows build ships the **win32** binding. No file
  in `app/`, `components/` or `lib/` imports `next/image` (verified: zero matches), so
  the optimizer route should never load sharp — but if anything ever does, a
  Windows-built artifact will throw on the Linux host.

### What has to change

Pick one. Do not deploy until one is picked.

**(a) Actually commit the artifact.** Remove `.next/` from `.gitignore` (or narrow it),
add a `postbuild` step that copies `public/` and `.next/static/` into
`.next/standalone/`, and commit ~65 MB of binary-ish output on every deploy. This is
what all three design documents describe. It matches the constraint (the shared host
must never run `npm install` or `next build`). It makes the repo large and every diff
unreadable, and it pushes a Windows-built `node_modules` to a Linux host.

**(b) Stop pretending it is a git deploy.** Build locally, run the two copies, `tar` the
standalone directory, `scp` it to the server, swap a symlink, touch `tmp/restart.txt`.
`git pull` then carries only source and is irrelevant to what runs. This is the
honest model for `output: 'standalone'` and is what the artifact's shape actually
wants. It requires SSH at deploy time, which the deploy rule in the specs was written
to avoid.

**(c) Build on the server.** Explicitly forbidden by every plan document ("Never run
`next build` or `npm install` on the shared host") and almost certainly correct to
keep forbidding — a Next 15 build on a CageFS shared host with a typical 1 GB memory
cap will OOM.

I recommend **(b)**, and recommend that whichever is chosen is written into
`docs/deployment/` as the single source of truth, because the three plan documents
currently assert (a) as settled fact and no reader would think to check `.gitignore`.

---

## 1. Environment variables

Complete enumeration of `process.env.*` reads in `lib/`, `app/`, `scripts/`,
`next.config.mjs`, `auth.js`, `middleware.js` (tests excluded).

### Read at runtime by the app

| Variable | Read at | Default | In `.env.example`? | If missing in production |
|---|---|---|---|---|
| `DB_HOST` | `lib/db.js:7,14` | none | yes | **Silent.** `dbEnabled()` false → `getPool()` null → `query()` returns `null` → home page renders "No home page has been created yet.", travel pages render empty. HTTP 200 throughout. |
| `DB_NAME` | `lib/db.js:7,18` | none | yes | as above |
| `DB_USER` | `lib/db.js:7,16` | none | yes | as above |
| `DB_PORT` | `lib/db.js:15` | `3306` | yes | harmless |
| `DB_PASSWORD` | `lib/db.js:17` | `''` | yes | Auth failure on first query. `app/[locale]/page.jsx` swallows it in a `try/catch` and renders a degraded page; the admin surfaces a driver error. Semi-silent. |
| `MEDIA_ROOT` | `lib/media.js:15` | `<cwd>/var/uploads` | yes | **Silent and destructive.** See §2. |
| `SITE_URL` | `lib/seo/site.js:49` | `http://localhost:3000` | yes — extensively | **Silent and actively harmful.** `robots.txt`, `sitemap.xml`, every canonical and every hreflang alternate publish `http://localhost:3000/...`. Nothing errors. This is the newest variable and it is the best-documented one in the repo; the risk is not that it is undocumented, it is that its default is *plausible* and its failure is invisible. |
| `ADMIN_EMAILS` | `auth.js:17` | `''` | yes | Fails **closed** — `isAllowedAdmin` returns false on an empty list by explicit design (`auth.js:24`). Nobody can sign in. Loud at the login screen, silent in logs. |
| `AUTH_GOOGLE_ID` | `auth.js:74,77`, `app/admin/login/page.jsx:8` | none | yes | Google provider not registered, button hidden. Credentials login still works. Correct optional handling. |
| `AUTH_GOOGLE_SECRET` | `auth.js:74,78` | none | yes | as above |

### Read by libraries, not by repo code

| Variable | Consumer | In `.env.example`? | If missing in production |
|---|---|---|---|
| `AUTH_SECRET` | NextAuth v5 internals | yes | **Every `/admin/*` route and `/api/auth/*` 500s** with `MissingSecret`. No file in this repo reads or asserts it, so nothing fails at boot — it fails on the first admin request. Loud, but only for the admin. |
| `AUTH_TRUST_HOST` | NextAuth v5 | yes | Redundant. `auth.js:143` already sets `trustHost: true` in the config object. Harmless, but the example file implies it is load-bearing when it is not. |
| `PORT` | generated `.next/standalone/server.js:8` (`parseInt(process.env.PORT,10) \|\| 3000`) | **no** | Supplied by Passenger. Should be documented as *"set by Passenger — do not set"*. |
| `HOSTNAME` | generated `server.js:9` (`\|\| '0.0.0.0'`) | **no** | as above |
| `KEEP_ALIVE_TIMEOUT` | generated `server.js:11` | no | optional, fine |
| `NODE_ENV` | forced to `production` by `server.js:5` | n/a | n/a |

### Read only by scripts

| Variable | Read at | In `.env.example`? |
|---|---|---|
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | `scripts/db-seed.mjs` (`--admin` only) | yes |
| `DB_NAME_TEST` | `vitest.config.mjs:6`, `tests/db/*` | **no** (test-only; minor gap) |

### Verdict on `.env.example`

**It exists and it is unusually good.** It was modified today, it carries names and
shapes with no values, and it documents `SITE_URL` at length — including *why* it is
not `NEXT_PUBLIC_`, which is exactly the trap this deploy model sets. `lib/seo/site.js`
repeats the reasoning in a 30-line header. The new SEO variable is **properly
documented**; that box is ticked.

Three real gaps remain:

1. **It does not distinguish "required in production" from "optional".** An operator
   filling it in has no way to know that leaving `SITE_URL` blank silently publishes a
   localhost sitemap while leaving `AUTH_GOOGLE_ID` blank is entirely fine.
2. **It does not say `AUTH_SECRET` is consumed by a library.** Nothing in the repo
   greps for it, so a reader auditing "which variables does this code use" will not
   find it and may conclude it is vestigial.
3. **`.env.local` on this machine does not set `SITE_URL`.** Harmless locally (the
   default is the dev origin), but it means the production path has never been
   exercised even in development.

There is also no mechanism documented for *how* env reaches the server. `.env.local` is
gitignored, so `git pull` cannot deliver it. `@next/env` is traced into the standalone
bundle, which suggests the standalone server does load `.env` files at boot — but I did
not verify that, and either way the file would have to be created by hand on the server
or the values entered in cPanel's Node.js environment editor. **Neither is written
down anywhere.**

---

## 2. `MEDIA_ROOT`

**The intent is correct and the code is careful. The enforcement is missing.**

`lib/media.js:15`:

```js
export function uploadRoot() {
  return process.env.MEDIA_ROOT || path.join(process.cwd(), 'var', 'uploads');
}
```

What is genuinely right here:

- Uploads are written outside `public/` on purpose, and served by
  `app/uploads/[...path]/route.js` rather than by Next's static handler — so the local
  and production paths behave identically. The header comment says exactly this.
- The serving route has a path-traversal guard, an extension allowlist that ignores the
  stored MIME, `nosniff`, `default-src 'none'; sandbox`, and
  `Content-Disposition: attachment` for SVG.
- `saveUpload` derives the extension from the validated MIME, never the filename, and
  writes with the `wx` flag so it can never overwrite or race.
- `var/uploads/` is gitignored (`.gitignore:12`), so a `git pull` into a checkout would
  not delete it.

**What is not enforced:** nothing checks that `MEDIA_ROOT` is absolute, and nothing
checks that it is outside the repo. There is no startup assertion, no
`path.isAbsolute()` guard, no "refuse to run in production without it". The invariant
lives entirely in a comment and in the operator's discipline.

**What happens today if it is unset in production:** uploads land in
`<process.cwd()>/var/uploads`. Under `output: 'standalone'`, `process.cwd()` is the
directory Passenger starts the app in — the standalone root. So every uploaded image
lands *inside the deployed build artifact*. Then:

- Under deploy model (b) or any tar/swap, the next deploy replaces that directory and
  **every upload since the last deploy is gone**, with no error and no trace.
- Under deploy model (a), `var/uploads/` is gitignored so `git pull` spares it — but
  only by luck, and only as long as nobody ever does a clean checkout.

The failure is silent in both directions: the upload succeeds, the DB row is written,
the image serves correctly, and it disappears at the next deploy.

**What the operator must create on the server before the first upload:**

```
mkdir -p /home/aeos365/media/dhakabypass
chmod 750 /home/aeos365/media/dhakabypass
```

— a directory **outside** `/home/aeos365/dhakabypass.com`, owned by the app user,
writable by it, and included in whatever backs the account up. Then set
`MEDIA_ROOT=/home/aeos365/media/dhakabypass` in the app environment and restart.

The directory must exist and be writable *before* the first upload, not after:
`saveUpload` does `fs.mkdir(dir, { recursive: true })`, so a wrong-but-creatable path
will be created silently and will look like it worked.

One inherited wrinkle, already recorded in the carried findings: `public/uploads/` (the
old uploader's target, gitignored) and `MEDIA_ROOT` share the `/uploads/*` URL
namespace, and Next serves `public/` first. Files written by the old admin before this
change still resolve; new ones go through the route. That is fine, but it means
`/uploads/x.webp` can resolve from either place depending on history.

---

## 3. Migrations and seeds

Twelve scripts write. Only six have `npm run` entries, and **two of the schema
migrations (`v4`, `v5`) have none at all** — so following `package.json` alone gets you
an incomplete schema.

### Correct order on a fresh production database

| # | Script | npm script | Writes | Idempotent? |
|---|---|---|---|---|
| 1 | `db-setup.mjs` | `db:setup` | `CREATE DATABASE IF NOT EXISTS`; tables `content`, `gallery_images`, `admin_users`, `contact_messages`, `news_updates`, `newsletter_subscribers` | Yes — all `CREATE TABLE IF NOT EXISTS` |
| 2 | `db-setup-v2.mjs` | `db:setup:v2` | `CREATE DATABASE IF NOT EXISTS`; tables `users`, `pages`, `page_translations`, `blocks`, `block_translations`, `media`, `menus`, `menu_items`, `revisions`, `audit_log`, `redirects` | Yes |
| 3 | `db-setup-v3.mjs` | `db:setup:v3` | tables `segments`, `interchanges`, `toll_rates`, `advisories`, `site_settings` | Yes |
| 4 | `db-setup-v4.mjs` | **none** | `ALTER TABLE media ADD COLUMN origin, credit` | Yes — each `ALTER` guarded by an `information_schema` check |
| 5 | `db-setup-v5.mjs` | **none** | `ALTER TABLE interchanges MODIFY kind` to add `'waypoint'` | Yes — skips if already present; exits 1 with a clear message if `v3` has not run |
| 6 | `migrate-users.mjs` | `db:migrate:users` | `INSERT INTO users SELECT … FROM admin_users`, role `'admin'` | Yes — genuine no-op on conflict; never overwrites an existing `users` row |
| 7 | `db-seed.mjs` | `db:seed` | `content` (upsert, all keys); `gallery_images` and `news_updates` **only if the table is empty**; with `--admin`, upserts one `admin_users` row | Yes, and deliberately conservative |
| 8 | `seed-corridor.mjs` | `db:seed:corridor` | **`DELETE FROM segments`, `DELETE FROM interchanges`, `DELETE FROM toll_rates`**, then re-inserts; upserts 3 `site_settings` keys | Re-runnable, **not** non-destructive |
| 9 | `seed-home-v2.mjs` | `db:seed:home` | **Deletes every `block` and `block_translation` for `pages.slug='home'`**, forces `pages.status='published'`, re-inserts 9 blocks × 3 locales, upserts 3 `page_translations` | Re-runnable, **not** non-destructive |
| 10 | `import-legacy-media.mjs` | **none** | Upserts `media` rows for the audited legacy images. `alt` and `credit` are deliberately excluded from the `ON DUPLICATE KEY UPDATE` list | Yes, and explicitly non-clobbering. Requires step 4 |
| 11 | `translate-media-alt.mjs` | **none** | Adds *missing* locale keys to `media.alt`. Never overwrites an existing key | Yes, and explicitly non-clobbering |
| — | `cleanup-corridor-tables.mjs` | **none** | `DROP TABLE IF EXISTS advisories, toll_rates, interchanges, segments, site_settings` | n/a — **never run this in production** |

`convert-pages.mjs`, `restructure-routes.mjs`, `fix-svg-attrs.mjs`, `fix-svg-tags.mjs`
and `fetch-fonts.mjs` write to the **filesystem**, not the database. They are one-time
codegen that has already been applied. Running any of them again would rewrite source
files. They are correctly absent from `package.json`.

### Ordering constraints that are not obvious

- **`v5` before `seed-corridor`.** `seed-corridor.mjs` inserts 6 rows with
  `kind: 'waypoint'`. Before `v5`, that value is not in the `interchanges.kind` ENUM.
  On a strict `sql_mode` this errors. On a **non-strict** `sql_mode` — which the carried
  findings flag as the likely MariaDB default on this host — MariaDB silently coerces
  the out-of-range ENUM write to `''`. You get six corrupt interchange rows, no error,
  and a corridor strip that renders wrong. **Verify `sql_mode` before seeding.**
- **`v2` + `migrate-users` before the app serves a single request.** The credentials
  provider (`auth.js:44`) selects from `users`. If that table is missing or empty, every
  password login fails closed and the admin is locked out. Already recorded as a
  precondition in `docs/superpowers/specs/2026-09-01-p0-p1-carried-findings.md:28`.
- **`v4` before `import-legacy-media`.** The import writes `origin` and `credit`.
- **`CREATE DATABASE` privilege.** Steps 1 and 2 both issue
  `CREATE DATABASE IF NOT EXISTS`. On cPanel the database is created through the control
  panel and the grant usually does **not** include `CREATE` at the server level. MariaDB
  requires the `CREATE` privilege for that statement even when the database already
  exists, so **both scripts may abort on their first statement**. This is the most
  likely way the first deploy fails, and nothing in the repo anticipates it. If it
  happens, the statement must be commented out or the scripts run with a privileged
  user.

### Which scripts would destroy live content

Three, in descending order of blast radius.

1. **`cleanup-corridor-tables.mjs` — catastrophic.** One unguarded
   `DROP TABLE IF EXISTS advisories, toll_rates, interchanges, segments, site_settings`.
   No confirmation prompt, no `--force`, no environment check, no dry run. It takes
   `--database=` which *defaults to `process.env.DB_NAME`* — so on a server whose
   `.env` points at production, `node scripts/cleanup-corridor-tables.mjs` with no
   arguments drops five production tables, including `site_settings`, which holds
   `corridor.published_length_km` (live on two pages). Its header calls it "Used when
   schema changes require a fresh recreation" — accurate about itself, silent about the
   consequence. It has no `npm run` entry, which is the only thing standing between it
   and an accident.

2. **`seed-corridor.mjs` (`npm run db:seed:corridor`) — destroys operator edits.**
   Three unconditional `DELETE FROM` statements against `segments`, `interchanges` and
   `toll_rates`. Any toll rate, segment status or interchange the operator has edited
   through `/admin/corridor/*` is replaced by the seed. It also overwrites
   `corridor.illustrative`, `corridor.prohibited_vehicles` and
   `corridor.published_length_km` — and the script's own comment (lines 218–228) states
   that `published_length_km` is the live denominator of the "x km / 48 km" figure on
   the home page and `/travel/status`. This is `npm`-reachable under a friendly name.
   The deletes are inside a `try/catch` but **not inside a transaction**: a failure
   partway through leaves the corridor tables emptied and half-repopulated, and the
   public pages render a broken corridor until someone re-runs it.

3. **`seed-home-v2.mjs` (`npm run db:seed:home`) — destroys the home page.** Deletes
   every `block` and `block_translation` for the home page and re-inserts the nine seeded
   blocks, and forces `pages.status = 'published'`. Every edit the operator has made to
   the home page through the admin is gone. Also not transactional. Its header does say
   "Re-running replaces the home page's blocks wholesale", which is honest — the danger
   is that it sits behind an inviting `npm run db:seed:home`.

**This is the same class of accident as commit `81f930a`**, which had to delete
`scripts/seed-home.mjs` because `npm run db:seed:home` pointed at a scaffold opening
with `DELETE FROM pages WHERE slug = 'home'`. That commit fixed *which script* the npm
name pointed at. It did not fix the underlying shape: **a destructive script behind a
friendly `npm run` name with no production guard.** Three such scripts remain, and one
of them (`cleanup-corridor-tables`) is worse than the one that was deleted.

There is no scripted backup step anywhere in the repo. No `mysqldump`, no pre-migration
snapshot, nothing.

---

## 4. Passenger

### What Passenger needs

| Requirement | Status |
|---|---|
| A startup file | `.next/standalone/server.js`, **generated by the build, gitignored, not in the repo** |
| Listen on `process.env.PORT` | The generated `server.js:8` does exactly this: `parseInt(process.env.PORT, 10) \|\| 3000`, with `HOSTNAME \|\| '0.0.0.0'`. Correct by construction — no repo change needed. |
| `tmp/restart.txt` for restarts | **No `tmp/` directory in the repo**, and none could be tracked (git does not track empty directories). No script creates it. Nothing documents that touching it is how you restart. |
| App root, Node version, env vars | Configured in cPanel's Node.js selector. Not represented in the repo at all — no `.cpanel.yml`, no `.htaccess`. |
| `node_modules` present | Only inside the standalone artifact, which is not in git. The host must never run `npm install`. |

So: **the only thing Passenger needs that this repo actually provides is correct `PORT`
handling**, and that comes free from Next's generated server rather than from anything
anyone wrote. Everything else — the entry file, the restart hook, the app
configuration — exists nowhere in version control.

I could not verify Passenger's Node handshake on this account from the repo. The
supporting evidence is one line in
`docs/superpowers/specs/2026-07-13-dhakabypass-dynamic-rebuild-design.md:44` noting a
working Passenger Node app already exists on the account
(`~/nodevenv/finslate.aeos365.com`), which establishes the runtime works but says
nothing about this app.

### Memory

Shared cPanel accounts are typically capped around 1 GB, and CageFS counts the whole
process tree. Two things matter:

**The home page's database load is bounded, and that was done deliberately.** Rendering
`/[locale]` touches: `getPageBySlugCached`, `getPageBlocksCached`, and five corridor
reads (`summary`, `interchanges`, `tolls`, `illustrative`, `publishedLengthKm`) issued
in one `Promise.all`, plus `AdvisoryBar` in the layout. Roughly eight queries — but every
one is wrapped in **both** `unstable_cache` (300s revalidate, tag-invalidated) **and**
React `cache()`. The comment in `lib/corridor/cache.js` explains that the double wrap is
because `unstable_cache` alone does not dedupe on a cold entry, so `generateMetadata`
and the component would each hit the database. That is a real, tested concern, correctly
handled. `lib/db.js` sets `connectionLimit: 5`, which is conservative and appropriate.
**The steady-state DB load is low.** Good work.

**The unresolved memory/staleness issue is `.next/cache`.** The local snapshot showed
**256 MB**. `unstable_cache` and ISR both persist there, and `isrFlushToDisk` is on. Two
consequences:

- If `.next/cache` is shipped with the artifact, you ship the build machine's cached
  database reads to production. The `lib/corridor/cache.js` header says this **already
  happened once during testing** — "a stale `unstable_cache` entry baked in from the
  developer's own database would otherwise persist in production forever" — which is
  why the 300-second `revalidate` floor exists. That floor is the mitigation, and it is
  a good one, but the correct answer is to not ship `.next/cache` at all.
- If it is not shipped, the server writes it from scratch and it grows unbounded on a
  shared host's disk quota. Nothing prunes it.

**A related, unresolved trap:** `app/[locale]/layout.jsx` exports `generateStaticParams`
returning all three locales, and neither `app/[locale]/page.jsx` nor the travel pages
export `dynamic = 'force-dynamic'`. So the localised pages are **statically prerendered
at build time, on the build machine, against the build machine's database.** The carried
findings recorded this precisely
(`docs/superpowers/specs/2026-09-01-p0-p1-carried-findings.md:26`): if the build machine
has no `DB_*` env, `"No home page has been created yet."` ships as static HTML and
nothing invalidates it until an admin edit fires `revalidateTag`. It is still true.
**The build machine must have a database with production-shaped content at build time**,
or the front door ships broken. That constraint is written in a findings file and in no
runbook.

---

## 5. Cutover decisions

These are decisions, not findings. Each is stated as a question with a recommendation
and the cost of getting it wrong. **None of them is decided here.**

Today: `app/(site)/` serves the legacy tree at `/`, `/project`, `/project/overview`,
`/gallery`, `/contact`, `/stakeholders`, `/economic-impact`, `/latest-updates`,
`/routes-facilities`, `/chinese-contribution`. `app/[locale]/` serves the new site at
`/en`, `/bn`, `/zh` and `/{locale}/travel/*`. `middleware.js` does **not** touch either —
it only rewrites the `admin.` subdomain onto `/admin/*`. They coexist because no legacy
slug collides with a locale code.

**Q1 — What serves `/`?**
Options: keep the legacy home; redirect `/` to a negotiated locale; render the new home
unprefixed.
*Recommendation:* a **302** (not 301) from `/` to `/{negotiated locale}` during a
probation period, promoted to 301 only after the new site has been verified live.
*Cost of getting it wrong:* a 301 is cached by browsers effectively permanently. If you
301 `/` → `/en` and then need `/` back, every visitor who hit it during the window keeps
being redirected, and you cannot reach them. A 302 costs a little ranking signal for a
few weeks and is fully reversible.

**Q2 — Which legacy paths get redirected, and to what?**
`lib/seo/routes.js` already lays out the reasoning at length and recommends: 301 each
legacy path to its localised replacement **once a replacement exists**; leave the rest
reachable and unlisted. Today `/[locale]/` has a home page and `travel/*` and nothing
else, so `/gallery`, `/contact`, `/stakeholders`, `/economic-impact`,
`/latest-updates`, `/chinese-contribution` and `/project/*` have **no replacement**.
*Recommendation:* adopt exactly what that file argues — redirect nothing that has no
equivalent, and do not `Disallow` the legacy paths in robots.txt (which `app/robots.js`
already deliberately does not do, so the eventual 301s stay discoverable).
*Cost of getting it wrong:* redirecting a page to something that does not answer the same
question is treated by Google as a soft 404. The ranking is discarded either way, and
you also lose the working page. Blocking them in robots.txt is worse: Google stops
re-crawling, never sees the 301, and the accumulated ranking is stranded permanently.

**Q3 — Where do redirects live?**
Three mechanisms exist. `next.config.mjs` already has eight (build-time; changing one
requires a full rebuild and redeploy). `db-setup-v2.mjs` creates a `redirects` **table**
that was built for this and has **no reader** — nothing in `lib/` or `app/` queries it.
Middleware could read either.
*Recommendation:* keep the fixed legacy set in `next.config.mjs` and accept the rebuild
cost; wire the `redirects` table only if the operator genuinely needs to add redirects
without a deploy, and if so read it in middleware with a cached lookup, never a
per-request query.
*Cost of getting it wrong:* a per-request database read in middleware puts a query on
**every** request including static assets, on a memory-limited host. That is the one
change most likely to take the site down under load.
*Note:* Next emits **308** for `permanent: true`, not 301. Google treats them
equivalently; some older tooling and analytics do not.

**Q4 — What does `middleware.js` do at cutover?**
The plan (`docs/.../foundations-design-system.md:9`) says explicitly: *"Middleware is
not changed to force locale redirects in this plan — that switch is flipped at cutover
(P10)."* The switch has not been flipped, and there is no P10 plan in `docs/`.
*Recommendation:* if locale negotiation is added, do it in middleware using
`Accept-Language` plus a sticky cookie, and nothing else — middleware runs on the edge
runtime where `mysql2` and `bcryptjs` are unavailable (the existing header at
`middleware.js:5` already says this). Keep the matcher as narrow as possible.
*Cost of getting it wrong:* the current matcher `'/((?!_next/static|_next/image|favicon.ico).*)'`
already runs on nearly every request. Anything expensive added there multiplies across
the whole site.

**Q5 — Trailing slashes.**
`next.config.mjs` has no `trailingSlash` setting, so it defaults to `false`. The old site
was a static export (`old_dhakabypass/` contains `index.html` and per-page directories),
which typically serves and gets indexed **with** trailing slashes. Someone has already
hit this: four of the eight redirects in `next.config.mjs` are duplicates that exist only
to cover the trailing-slash variant.
*Recommendation:* pull the actual indexed URL list from Search Console before writing any
redirect, and cover both forms for every one.
*Cost of getting it wrong:* half the indexed URLs 404 on cutover day and the redirects
you wrote never fire. **I cannot determine the indexed set from this repo.**

**Q6 — `<html lang>` for `/bn` and `/zh`.**
`app/layout.jsx:23` hardcodes `<html lang="en">`. `app/[locale]/layout.jsx` puts the real
locale on a `<div lang=…>` instead, because the root layout is shared with the legacy
site and the admin.
*Recommendation:* decide before indexing, not after. Either the root layout learns the
locale, or the localised tree gets its own root.
*Cost of getting it wrong:* every Bangla and Chinese page ships `<html lang="en">`.
Screen readers use the wrong voice, and Google's language detection disagrees with the
hreflang tags the sitemap and `alternatesFor` are carefully emitting — undermining the
entire SEO layer that was just built.

**Q7 — `/en/home` and `/en` are the same page.**
`app/[locale]/[...slug]/page.jsx` resolves slug `home`, so `/en/home` returns 200 with
the home content. It is not in the sitemap, and `pathForSlug('home')` returns `/` so its
canonical correctly points at `/en`. The carried findings listed this as a
must-fix-before-SEO-work item; the canonical **has** since been added, so it is now
cosmetic.
*Recommendation:* leave it, or 301 `/{locale}/home` → `/{locale}` when convenient.

**Q8 — `lib/content.js` vs `lib/content/`.**
Both exist and resolve correctly only because webpack tries the file first. Deleting the
legacy `lib/content.js` at cutover breaks ~17 legacy imports.
*Recommendation:* this is a loud build error, not a silent wrong import — but do it
deliberately, in its own commit, with a build in between.

**Q9 — Does the admin subdomain exist?**
`middleware.js` and `app/robots.js` both assume `admin.dhakabypass.com` is a real host.
**I cannot verify from the repo** that the subdomain, its DNS record, or its SSL
certificate exist. If it does not, the admin is still reachable at
`dhakabypass.com/admin` — `app/robots.js` disallows `/admin` on the public host, so that
is at least not indexed.

---

## 6. Rollback

**Can you get back? Yes for the site, no for the database, and the site path is
manual and undocumented.**

**What exists in your favour:** the complete old static site is **tracked in git** —
`old_dhakabypass/` is 111 tracked files, 11 MB, with `index.html` at its root. The
rollback bytes are in version control and cannot be lost. That is a genuine and
uncommon piece of foresight.

**The site rollback path:** stop the Passenger app in cPanel's Node.js selector, then
restore the static export to the document root. The design spec states this
(`2026-07-13-…-design.md:142`): *"Rollback = restore the static export from backup and
repoint the domain (Passenger app off)."* It is one sentence. It is not a procedure, it
has never been rehearsed, and it depends on a detail nobody has settled: **whether the
Passenger app root and the document root are the same directory.** If
`/home/aeos365/dhakabypass.com` is both, then "turn off the app and serve the old files"
requires moving files around under time pressure, not flipping a switch. If they are
separate, rollback is genuinely fast. **I cannot determine which from the repo.**

*Recommendation:* make them separate before the first deploy. Deploy the app to
`/home/aeos365/apps/dhakabypass-<timestamp>` with `/home/aeos365/dhakabypass.com` as a
symlink. Rollback then becomes repointing one symlink and touching `tmp/restart.txt`.

**The database rollback path does not exist.**

- No script in the repo takes a backup. No `mysqldump`, no pre-migration snapshot.
- Nothing is reversible. Every migration is forward-only; the only "down" is
  `cleanup-corridor-tables.mjs`, which drops five tables.
- The destructive seeds (§3) have no undo. Once `seed-home-v2.mjs` has deleted the
  home page's blocks, they are gone.
- The new schema (`v2`–`v5`) is **additive** and does not touch the legacy tables — the
  header of `db-setup-v2.mjs` says so and it is true. So a rollback to the old *static*
  site is unaffected by the migrations. That is the saving grace: the legacy site does
  not read the new tables, so the database and the site can be rolled back independently.

**Verdict:** rolling back the *site* is possible today but manual, unrehearsed and
dependent on an unsettled directory layout. Rolling back the *database* is not possible
today at all — there is nothing to roll back to unless a human remembers to take a dump
first, and no document tells them to.

---

## 7. Checklist

### Blocker — do not deploy until each is resolved

| # | Item | The failure it prevents |
|---|---|---|
| B1 | **Reconcile the deploy model with the build output.** Pick (a), (b) or (c) from §0 and write it down. | Today, a `git pull` on the server delivers no build at all. There is nothing for Passenger to start. The deploy simply cannot happen. |
| B2 | **Add the `public/` and `.next/static/` copy step into the build.** | Even with the artifact delivered, every stylesheet, script chunk, font and image 404s. The site renders as unstyled HTML. |
| B3 | **Decide how environment variables reach the server, and document it.** `.env.local` is gitignored and cannot be pulled. | Missing `DB_*` fails **silently**: every page returns 200 with "No home page has been created yet." Nothing alerts. |
| B4 | **Set `SITE_URL` on the host and verify `/robots.txt` and `/sitemap.xml` after boot.** | Unset, the default is `http://localhost:3000`. Google is handed a sitemap and canonicals full of localhost URLs, and the entire SEO layer that was just built silently deindexes the site. |
| B5 | **Set `MEDIA_ROOT` to an absolute path outside `/home/aeos365/dhakabypass.com`, and create the directory first.** | Unset, uploads land inside the build artifact and are destroyed by the next deploy. Silent in both directions. |
| B6 | **Take a `mysqldump` before every migration and seed, and add it to the runbook.** | Three scripts destroy content (§3) and none is reversible. There is currently nothing to restore from. |
| B7 | **Verify the DB user's `CREATE` privilege before running `db:setup` / `db:setup:v2`.** | Both issue `CREATE DATABASE IF NOT EXISTS`. A typical cPanel grant lacks server-level `CREATE`, and the script aborts on its first statement. |
| B8 | **Verify `sql_mode` on the host, then run `db-setup-v5.mjs` before `seed-corridor.mjs`.** | On non-strict MariaDB, seeding `kind='waypoint'` into a pre-v5 ENUM writes six rows as `''` with no error, corrupting the corridor data invisibly. |
| B9 | **Run `db:setup:v2` and `db:migrate:users` before the app serves a request.** | The credentials provider selects from `users`. Without it, password login fails closed and the admin is locked out of a live site. |
| B10 | **Ensure the build machine has a production-shaped database at `next build` time.** | `/[locale]` is statically prerendered from `generateStaticParams`. A build against an empty database ships "No home page has been created yet." as static HTML that nothing invalidates. |
| B11 | **Settle whether the Passenger app root and document root are the same directory, and create `tmp/restart.txt`.** | Without a separated layout, rollback is a manual file shuffle under pressure. Without `tmp/restart.txt`, there is no documented way to restart after an env change. |

### Should-fix — before or immediately after first deploy

| # | Item | The failure it prevents |
|---|---|---|
| S1 | **Guard the three destructive scripts.** A production check, a `--force` flag, or a confirmation prompt on `cleanup-corridor-tables.mjs`, `seed-corridor.mjs` and `seed-home-v2.mjs`. | `cleanup-corridor-tables.mjs` with no arguments drops five production tables. This is the same shape as the accident commit `81f930a` had to fix, and worse. |
| S2 | **Wrap `seed-corridor.mjs` and `seed-home-v2.mjs` in transactions.** `lib/db.js` already exports `withTransaction`. | A mid-run failure leaves the corridor tables emptied and half-populated, or the home page with no blocks, on a live site. |
| S3 | **Add `npm run` entries for `db-setup-v4` and `db-setup-v5`.** | An operator following `package.json` gets an incomplete schema and hits B8. |
| S4 | **Enforce `MEDIA_ROOT` in code** — assert `path.isAbsolute()` and refuse to fall back when `NODE_ENV === 'production'`. | Makes B5 impossible to get wrong twice. The invariant currently lives only in a comment. |
| S5 | **Fix `<html lang>` for `/bn` and `/zh`** (Q6). | Every non-English page ships `lang="en"`, contradicting the hreflang layer and giving screen readers the wrong voice. |
| S6 | **Do not ship `.next/cache` (256 MB), and confirm the 300s revalidate floor covers the gap.** | Shipping it bakes the developer's database reads into production — which the `lib/corridor/cache.js` header records as already having happened once. |
| S7 | **Mark required-vs-optional in `.env.example`, and note that `AUTH_SECRET` is read by NextAuth, not by repo code.** | An operator has no way to tell that a blank `SITE_URL` is silently catastrophic while a blank `AUTH_GOOGLE_ID` is fine. |
| S8 | **Verify no code path reaches `/_next/image`.** Zero `next/image` imports today, but Windows-built `sharp` bindings are traced into the artifact. | A Linux host throws on a win32 native binding the moment the optimizer is touched. |
| S9 | **Get the indexed URL list from Search Console before writing redirects** (Q5). | Trailing-slash mismatch means half the indexed URLs 404 and the redirects never fire. |

### Nice-to-have

| # | Item |
|---|---|
| N1 | 301 `/{locale}/home` → `/{locale}` (Q7). Canonical already handles it; this is tidiness. |
| N2 | Document `PORT` / `HOSTNAME` in `.env.example` as Passenger-supplied, do-not-set. |
| N3 | Add `DB_NAME_TEST` to `.env.example`. |
| N4 | Drop the redundant `AUTH_TRUST_HOST` from `.env.example`, or note that `auth.js` already sets `trustHost: true`. |
| N5 | Prune `.next/cache` on the server, or cap it — nothing does today. |
| N6 | Either wire a reader for the `redirects` table or drop it from the schema; it has been dead since `db-setup-v2.mjs` was written. |
| N7 | `playwright.config.mjs` hardcodes `baseURL: 'http://localhost:3000'` with `command: 'npm run dev'`. A post-deploy smoke run against the live URL needs a `PLAYWRIGHT_BASE_URL` override. |

---

## 8. First deploy runbook

Steps marked **[BLOCKED]** cannot be performed today. Steps marked **[UNDEFINED]** have
no documented answer in the repo and need a human decision first.

### Before deploy day

1. **[BLOCKED — B1]** Choose the deploy model (§0) and write it into
   `docs/deployment/`. Nothing below step 8 can proceed until this exists.
2. **[BLOCKED — B2]** Add the `public/` → `.next/standalone/public` and
   `.next/static/` → `.next/standalone/.next/static` copy to the build. Verify by
   listing the standalone directory.
3. **[UNDEFINED — B11]** Decide the server directory layout: app root vs document root,
   symlink or not. Recommend the timestamped-directory-plus-symlink layout in §6.
4. **[UNDEFINED — B3]** Decide how env reaches the server: cPanel's Node.js environment
   editor, or a hand-created `.env` on the server. Verify the standalone server actually
   reads it, whichever is chosen.
5. **[UNDEFINED — Q1–Q5]** Decide the cutover URL policy. Get the indexed URL list from
   Search Console first.
6. Verify on the server: the DB user's `CREATE` privilege (B7), and `sql_mode` (B8).
7. Create `MEDIA_ROOT` outside the repo (§2) and confirm the app user can write to it.

### Deploy day

8. **Back up.** `mysqldump` the production database. Snapshot the live static site
   (`old_dhakabypass/` is already in git, but snapshot the *server's* copy too — it may
   have diverged). **[B6 — no script does this; it is manual.]**
9. Create the MySQL database and user in cPanel, and the `admin.dhakabypass.com`
   subdomain with SSL if it does not exist (Q9).
10. Run the migrations **in this order**, checking each exits 0:
    ```
    node scripts/db-setup.mjs
    node scripts/db-setup-v2.mjs
    node scripts/db-setup-v3.mjs
    node scripts/db-setup-v4.mjs      # no npm script
    node scripts/db-setup-v5.mjs      # no npm script — MUST precede step 12
    node scripts/migrate-users.mjs
    ```
    **[UNDEFINED]** — from where? These are Node scripts needing `mysql2`, and the host
    must never run `npm install`. Either run them from the local machine against the
    remote database (requires remote MySQL access, which cPanel disables by default and
    which is not documented anywhere), or ship `node_modules` for them. **This is a real
    gap in the deploy model that nobody has answered.**
11. Seed base content: `node scripts/db-seed.mjs` (and `--admin` once, if password login
    is wanted).
12. Seed the corridor: `node scripts/seed-corridor.mjs`. **Destructive — see §3.**
    Verify step 10's `db-setup-v5.mjs` ran first, then spot-check that no
    `interchanges.kind` is `''`.
13. Seed the home page: `node scripts/seed-home-v2.mjs`. **Destructive — see §3.**
    Verify 9 blocks × 3 locales landed.
14. Optionally: `node scripts/import-legacy-media.mjs`, then
    `node scripts/translate-media-alt.mjs`. Both non-destructive.
15. **[B10]** Build locally with `DB_*` pointing at a production-shaped database and
    `SITE_URL=https://dhakabypass.com`. Run the copies from step 2.
16. Ship the artifact by whatever step 1 decided.
17. Create the cPanel Node.js app: Node 22, app root per step 3, startup file
    `server.js`. Set env: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
    `AUTH_SECRET`, `ADMIN_EMAILS`, `MEDIA_ROOT`, `SITE_URL`, and optionally
    `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`. Do **not** set `PORT` or `HOSTNAME`.
18. `mkdir -p tmp && touch tmp/restart.txt`. **[B11 — not in the repo.]**
19. Start the app. Point `dhakabypass.com` and `admin.dhakabypass.com` at it.

### Verify before announcing

20. `curl https://dhakabypass.com/robots.txt` — confirm the `Sitemap:` line says the real
    domain, not `localhost:3000`. **This is the fastest single check that `SITE_URL`
    landed.** (B4)
21. `curl https://dhakabypass.com/sitemap.xml` — confirm absolute URLs, all three
    locales, and that the home page is present.
22. Load `/en`, `/bn`, `/zh` — confirm the corridor strip renders with real data, not the
    `EMPTY_SUMMARY` fallback. An empty strip means the database is not reachable and the
    `try/catch` in `app/[locale]/page.jsx` swallowed it.
23. Load `/en/travel/toll` and `/en/travel/status`.
24. Sign in at `admin.dhakabypass.com` (or `/admin`). If it 500s, `AUTH_SECRET` is
    missing. If it rejects a valid address, `ADMIN_EMAILS` is missing or wrong.
25. Upload one image through the admin. Confirm the file appears under `MEDIA_ROOT` on
    disk and **not** anywhere under the app directory. (B5)
26. Load every legacy URL: `/`, `/project`, `/project/overview`, `/gallery`, `/contact`,
    `/stakeholders`, `/economic-impact`, `/latest-updates`, `/routes-facilities`,
    `/chinese-contribution`. All must still return 200 — none of them has a replacement
    yet.
27. `npm run test:e2e` against the live URL. **[N7 — `playwright.config.mjs` hardcodes
    `localhost:3000` and starts `npm run dev`; it needs a base-URL override to be
    useful here.]**

### Rollback trigger

28. If any of 20–26 fails and is not fixable within the window: stop the Passenger app
    and restore the static site (§6). **[UNDEFINED — depends on step 3's layout; the
    procedure is one sentence in a spec and has never been rehearsed.]** The database
    needs no rollback for this path: the new schema is additive and the legacy site does
    not read it.

---

## 9. What is genuinely ready

Being blunt about what is not ready earns saying what is. The following were checked and
are correct:

- **The upload security model.** MIME-derived extensions, `wx` writes that cannot race or
  overwrite, a traversal guard on the serving route, `nosniff`, a sandbox CSP, and
  `Content-Disposition: attachment` for SVG. Layered and consistent.
- **The auth model.** Two independent gates (`ADMIN_EMAILS` re-derived per request,
  `can(role, …)` from the JWT), both failing closed, with the reasoning for the
  no-default-role decision written at the call site.
- **Database read pressure.** The `cache()` + `unstable_cache` double wrap is correct and
  the reason for it is documented. `connectionLimit: 5` is right for a shared host.
- **Degradation on a dead database.** `sitemap.xml`, the home page and the travel pages
  all render something rather than 500ing. That decision was made deliberately in three
  separate files with the reasoning attached.
- **The SEO layer's design.** One module owns the origin, no domain is hardcoded twice,
  canonicals are per-locale, `x-default` points at `/en` rather than `/`, and
  `lib/seo/routes.js` records the legacy-URL decision as an open question rather than
  deciding it silently. It needs `SITE_URL` set (B4) and `<html lang>` fixed (S5), and
  then it is good.
- **Migration idempotency.** Every `db-setup*` script re-runs cleanly, `v4` and `v5`
  guard their `ALTER`s on `information_schema`, and `migrate-users`,
  `import-legacy-media` and `translate-media-alt` are explicitly non-clobbering with the
  reasoning written down.
- **The rollback bytes exist.** `old_dhakabypass/` is 111 tracked files in git.

The gap is not code quality. It is that **the deployment itself has never been designed
or written down** — three plan documents assert a deploy model that `.gitignore`
contradicts, and no runbook has ever been executed.
