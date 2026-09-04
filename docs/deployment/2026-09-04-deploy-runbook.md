# Deploy model and runbook

**Status:** this document is the single source of truth for how this project is
deployed. Where any plan or spec document disagrees with it, this wins — three of
them describe a deploy contract that `.gitignore` made impossible, and they carry
a banner pointing here.

**Supersedes the open questions in** `docs/deployment/2026-09-04-readiness-review.md`,
which is still the reference for *why* each of these decisions is the way it is.

---

## The model, in one line

**Build here. Push the built artifact to a deploy branch. `git pull` on the
server.** No SSH at deploy time, no file copying on the server, no directory
created by hand, no `npm install` and no `next build` on the shared host.

```
  developer machine / cloud session          server (cPanel, Passenger)
  ─────────────────────────────────          ──────────────────────────
  npm run build                              git pull
  npm run deploy:release -- --target=…       node preflight.mjs
        │                                    touch tmp/restart.txt
        └── pushes deploy/staging ───────────────┘
```

The only step that is not a file copy is the database, and that is SQL imported
through phpMyAdmin — see `db/sql/README.md`. The SQL files travel inside the
release, so after a pull they are already on the server at `db/sql/`.

### Why this model and not the alternatives

The readiness review set out three options. This is (a), "commit the artifact",
made actually workable — the host is a memory-limited cPanel account that must
never run a Next build, and it has git. What made (a) impossible was never the
idea; it was that `.next/` is gitignored and, more importantly, that
`output: 'standalone'` leaves `public/` and `.next/static` **outside** the
standalone directory, so there had never been a complete thing to commit. A
`git pull` deploy would have produced a site with every stylesheet, script and
font 404ing.

Two changes fix that:

- `scripts/package-standalone.mjs` runs automatically after every `next build`
  (as `postbuild`) and copies the missing pieces in, then verifies the result is
  complete and refuses to continue if it is not.
- `scripts/release-to-branch.mjs` commits that artifact to an **orphan branch** —
  `deploy/staging` or `deploy/production` — holding only built output and sharing
  no history with `main`.

Option (b), tarball-and-scp, was the review's recommendation and would also work,
but it needs SSH on every deploy and manual extraction on the server. Option (c),
building on the host, stays forbidden: a Next 15 build will exhaust a shared
account's memory.

### What the orphan branch costs

The deploy branch grows by roughly the artifact size (~58 MB) per release,
because every chunk Next emits is content-hashed and so essentially all of it
changes each build. The server's clone is shallow and does not care; the remote
does. **Re-orphan the branch when it gets uncomfortable** — every 20–30 releases
is ample:

```bash
git checkout --orphan deploy/staging-fresh deploy/staging
git commit -m "release: re-orphaned to drop history"
git push -f origin deploy/staging-fresh:deploy/staging
```

The server then needs one `git fetch --depth 1 && git reset --hard origin/deploy/staging`,
which it is doing anyway.

---

## Ground rules

- **Staging before production, always.** `staging.dhakabypass.com` (or any
  subdomain that is not the live one) gets every release first. The live domain
  is touched only after staging has been checked and the client has said go *in
  the moment* — approval for one deploy is not approval for the next.
- **The clone does not go in the web root.** `/home/aeos365/dhakabypass.com` is
  served over HTTP. A `.git` directory under a served root hands the entire
  repository — source, history, and any secret ever committed — to anyone who
  requests `/.git/config`. The clone goes in a sibling directory that Passenger
  points at. A defensive `.htaccess` ships in the release as a second line of
  defence, not as permission to ignore this.
- **An artifact belongs to exactly one origin.** `next build` prerenders the
  localised pages and the sitemap, so `SITE_URL` is written into 74 files at
  build time — measured, not assumed. A staging artifact promoted to production
  would publish staging canonicals. The app refuses to start when the two
  disagree; do not work around it, rebuild.
- **The analytics settings are baked at build time too**, for the same reason and
  in the same files. `ANALYTICS_PROVIDER` and its companions must be set for the
  build, not just for the running app, and changing them means rebuilding. Leave
  them unset on staging so staging traffic never reaches the production numbers.
  Choosing `ga4` also switches on a consent banner, because Google Analytics sets
  cookies; the cookieless providers do not need one.
- **Back up the database before any SQL import.** phpMyAdmin → Export → Quick →
  SQL. It is the only database rollback that exists.

---

## One-time setup on the server

Done once per target. Not repeated on later deploys.

### 1. Subdomain

cPanel → **Domains** → create `staging.dhakabypass.com`. Set its document root
to something *other* than the app directory — e.g. `/home/aeos365/staging-docroot`.
Issue SSL (AutoSSL).

### 2. Database

cPanel → **MySQL Databases**. Create the database and a user, grant the user All
Privileges on it. Note the names — cPanel prefixes both with `aeos365_`.

Then cPanel → **phpMyAdmin** → select the database → **Import**:
`db/sql/01-schema.sql`, then `db/sql/02-seed.sql`. Details and the re-import
rules are in `db/sql/README.md`.

### 3. Clone the release branch

The app directory is **not** the web root:

```bash
cd /home/aeos365
/usr/local/cpanel/3rdparty/lib/path-bin/git clone \
  --branch deploy/staging --single-branch --depth 1 \
  <repository URL> apps/dhakabypass-staging
```

`git` is not on `PATH` on this account, hence the full path. The repository is
private, so this needs credentials: either a read-only **deploy key** added to
the repository and referenced from `~/.ssh/config`, or an HTTPS URL with a
personal access token. A deploy key is preferable — it is scoped to one
repository and read-only.

### 4. Node app

cPanel → **Setup Node.js App**:

| Field | Value |
|---|---|
| Node version | 22 |
| Application root | `apps/dhakabypass-staging` |
| Application URL | `staging.dhakabypass.com` |
| Application startup file | `server.js` |

Then add the environment variables in the same screen:

| Variable | Value | If it is wrong |
|---|---|---|
| `SITE_URL` | `https://staging.dhakabypass.com` | **App refuses to start.** Must match the origin the release was built for. |
| `DB_HOST` | `127.0.0.1` | **App refuses to start.** |
| `DB_PORT` | `3306` | harmless |
| `DB_NAME` | `aeos365_…` | **App refuses to start.** |
| `DB_USER` | `aeos365_…` | **App refuses to start.** |
| `DB_PASSWORD` | the user's password | site renders empty |
| `AUTH_SECRET` | 32 random bytes, base64 | admin 500s; public site fine |
| `ADMIN_EMAILS` | comma-separated addresses | nobody can sign in |
| `MEDIA_ROOT` | *optional* — see below | uploads land in `var/uploads` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Google button hidden |
| `ANALYTICS_PROVIDER` | *leave unset on staging* | nothing measured — correct for staging |
| `ANALYTICS_SITE_ID` / `ANALYTICS_SCRIPT_URL` | with a provider | preflight warns; nothing rendered |

Do **not** set `PORT` or `HOSTNAME`. Passenger supplies both, and the generated
server reads them correctly.

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**On `MEDIA_ROOT`.** Leaving it unset is acceptable under this deploy model and
only under this one: uploads go to `var/uploads` inside the app directory, that
path is git-ignored by the release, and `git pull` never deletes untracked files
— so uploads survive every deploy. The app knows which model it was packaged for
and only warns. Two things still bite, and the warning says so: a *fresh clone
into a new directory* starts with an empty media library while the database still
references every file, and a database-only backup will not carry the images. If
you want it robust, set `MEDIA_ROOT=/home/aeos365/media/dhakabypass`, create that
directory, and move the existing files across.

### 5. Start it

Start the app in the Node.js App screen, then work through **Verify** below.

---

## Every deploy after that

### Here

```bash
# 1. Build for the target this release is going to.
SITE_URL=https://staging.dhakabypass.com npm run build

# 2. Regenerate the SQL if any migration or seed changed.
npm run db:sql

# 3. Check what you are about to ship.
npm test
npm run preflight        # optional: validates a set of env values

# 4. Publish the release.
npm run deploy:release -- --target=staging
```

`deploy:release` refuses to publish an artifact that was built with no
`SITE_URL`, that was built from a dirty working tree, that was built on a
platform other than Linux, or that was packaged for a different deploy model. For
`--target=production` it additionally requires `--yes`.

**Build on Linux.** `sharp`'s native bindings are traced into the artifact; a
Windows build ships win32 bindings the host cannot load. Nothing imports
`next/image` today, so it is latent rather than broken — but it is one import
away from being an outage, and the release script blocks it.

### On the server

```bash
cd ~/apps/dhakabypass-staging
/usr/local/cpanel/3rdparty/lib/path-bin/git pull
node preflight.mjs        # exit 0 means it will boot
touch tmp/restart.txt
```

`preflight.mjs` checks the environment *without* starting the app, so a
misconfiguration is found deliberately rather than by a visitor. If it exits 1 it
prints each problem, what will happen because of it, and the fix.

If a migration changed, import the new `db/sql/*.sql` in phpMyAdmin — **after an
Export backup** — before touching `tmp/restart.txt`.

---

## Verify, before telling anyone it is up

Run these against the target's own hostname.

| # | Check | What a failure means |
|---|---|---|
| 1 | `curl https://HOST/robots.txt` — the `Sitemap:` line names the real host | `SITE_URL` did not land. This is the fastest single check that it did. |
| 2 | `curl https://HOST/sitemap.xml` — absolute URLs, all three locales | as above, or the database is unreachable |
| 3 | Load `/en`, `/bn`, `/zh` — **styled**, with the corridor strip showing real data | no styling means `.next/static` did not ship; an empty strip means the database is unreachable and the page's `try/catch` swallowed it |
| 4 | Load `/en/travel/toll` and `/en/travel/status` | as above |
| 5 | Sign in at `/admin` | a 500 means `AUTH_SECRET` is missing; a rejected valid address means `ADMIN_EMAILS` is |
| 6 | Upload one image in the admin, then confirm the file exists on disk under the media root | if it is missing, `MEDIA_ROOT` points somewhere unexpected |
| 7 | **Production only:** every legacy URL still returns 200 — `/`, `/project`, `/project/overview`, `/gallery`, `/contact`, `/stakeholders`, `/economic-impact`, `/latest-updates`, `/routes-facilities`, `/chinese-contribution` | the legacy site is still live and none of these has a replacement yet |

Check 3 is the one that catches the failure this whole deploy path was built to
prevent. Look at the page, do not just check the status code — a 200 with no
stylesheet is exactly what a missing `.next/static` produces.

---

## Rollback

**The site.** Every release is a commit on the deploy branch, so rolling back is
checking out the previous one:

```bash
cd ~/apps/dhakabypass-staging
git log --oneline -5                     # each entry names its source commit and origin
git reset --hard <previous release>
touch tmp/restart.txt
```

That is the whole procedure, it needs no files moved, and it works because the
artifact is complete in git rather than assembled on the server.

If the app itself is the problem, stop it in cPanel's Node.js App screen. The
legacy static site is untouched by any of this — it is 111 tracked files in
`old_dhakabypass/`, plus `arch.zip` and `backup.zip` already sitting in the site
folder.

**The database.** There is no automatic rollback and nothing in this project
creates one. The only restore point is a phpMyAdmin **Export** taken before the
import. Take one every time.

The new schema is purely additive and the legacy site does not read any of it, so
the site and the database roll back independently — a site rollback needs no
database change.

---

## Still open

Not blockers for a staging deploy; each needs an answer before the live domain.

- **Cutover URL policy** (readiness review §5, Q1–Q5). What serves `/`, which
  legacy paths get redirected and to what, and whether the indexed URLs carry
  trailing slashes. Get the indexed list from Search Console first — it cannot be
  determined from this repository.
- **`<html lang>` for `/bn` and `/zh`** (Q6, S5). The root layout hardcodes
  `lang="en"`, so every non-English page contradicts its own hreflang tags.
- **Whether `admin.dhakabypass.com` exists** with DNS and SSL (Q9).
- **Google Analytics / Search Console** verification for the new site.
