# Dhaka Bypass — Dynamic Rebuild + Admin Panel — Design

**Date:** 2026-07-13
**Status:** Approved (design), pending spec review

## 1. Goal

Reproduce the existing Dhaka Bypass Expressway website — currently a static Next.js
export living locally in `old_dhakabypass/` and live at `https://dhakabypass.com` — as a
**visually 100% identical** site, but with all content driven by a database and editable
through an **admin panel** at `admin.dhakabypass.com`.

The only intentional change from the original is that page content (text, stats, images,
gallery, news) is dynamic and editable. Pixels on the public pages stay identical.

## 0. Approach: phased, bitwise-identical first

Delivered in two strict phases (per Boss directive 2026-07-13):

- **Phase 1 — bitwise-identical public site.** The public site is the **original static
  export served verbatim** (the exact `old_dhakabypass/` bytes), NOT a re-rendered Next.js
  page. Verified byte-for-byte with a `sha256` manifest. A fresh Next render is only
  *visually* identical (different `_next` chunk hashes / build id / HTML serialization), so
  it cannot be the source of truth for "bitwise identical."
- **Phase 2 — admin panel.** The admin app edits content by writing to MySQL and
  **regenerating the specific static HTML file** from the original HTML treated as a
  template (marked content regions substituted). When a page's content is unchanged its
  bytes stay identical to the original; edited pages change only the intended
  text/image/caption. Public pages therefore remain fast static files, which is also the
  most robust option on the shared host.

Implication: the public pages are **static HTML files**, not SSR. MySQL is the content
source of record; the admin renders it into the static files. This supersedes any
"SSR-from-MySQL for public pages" reading below.

## 2. Constraints (from environment probe)

- **Host:** Namecheap cPanel shared box `server904.web-hosting.com` (user `aeos365`), same
  box as aeos365.com / erp.dhakabypass.com. SSH via `~/.ssh/aeos365_deploy` port 21098.
- **Site folder:** `/home/aeos365/dhakabypass.com` — currently holds the old static export
  plus `backup.zip` / `arch.zip` (rollback points).
- **Node:** available via CloudLinux selector (Node **22** at
  `/opt/alt/alt-nodejs22/root/usr/bin/node`). No node on default PATH. Existing working
  Passenger Node app on the account: `~/nodevenv/finslate.aeos365.com` (proves the runtime).
- **DB:** MariaDB 11.4 (`/usr/bin/mysql`).
- **Deploy rule:** build LOCALLY, commit built artifacts, `git pull` on server. No
  `next build` / `npm install` on the shared host (memory-limited; matches account pattern).
- Deploy only when the Boss explicitly authorizes it.

## 3. Tech stack

| Concern        | Choice                                                              |
|----------------|--------------------------------------------------------------------|
| Framework      | Next.js 15 (App Router) — same as original                          |
| Styling        | Tailwind CSS (reuse original's compiled output / config)            |
| Icons / anim   | lucide-react, AOS (scroll animations), Radix Dialog (route-map modal)|
| DB access      | `mysql2` + thin query helper (NOT Prisma — engine binary fragile on CageFS) |
| Auth           | Auth.js (NextAuth v5): Google + Credentials, JWT sessions           |
| Server runtime | `output: 'standalone'`, run under cPanel Node.js App (Passenger, Node 22) |

## 4. Public site — pages to reproduce

Reproduced from the exact exported markup (`old_dhakabypass/*/index.html`) and real
`.webp` assets copied into `/public`:

- `/` — Home (hero, project overview + 4 stat cards, economic impact, expressway route)
- `/project` and `/project/overview`
- `/economic-impact`
- `/routes-facilities`
- `/stakeholders`
- `/chinese-contribution`
- `/gallery` — 36 photos (`photo/1.webp` … `photo/36.webp`)
- `/latest-updates` — news list
- `/contact` — includes `mailto:info@dbedc.com`, `tel:+880123456789`
- `404`

Nav in the original also references `/about-project`, `/expressway-route`, `/virtual-tour`
(no exported folders). Replicate the nav hrefs exactly as the original emits them; where the
original had no real page, match its actual served behavior. Confirm during build.

Assets to copy: `bg-hero, bypass-ex, cbri, cp, eco-eff, friends, hma, logo, map, road,
route, semi, DSC02357, DSC02396, IMG_6282 (.webp)`, `favicon.ico`, `photo/1..36.webp`, svgs.

In Phase 1 these are served verbatim from the original export. In Phase 2 each dynamic
text/stat/image/caption becomes a marked region in the template; the admin regenerates the
static file from MySQL content. Structural markup is never touched, guaranteeing fidelity.

## 5. Data model (MySQL)

- **`content`** — `section_key` VARCHAR PK, `data` JSON, `updated_at`. One row per editable
  section (e.g. `home.hero`, `home.overview`, `economic_impact`, `routes`, `contact`, …).
  Server components read these; admin forms write them.
- **`gallery_images`** — `id`, `filename`, `caption`, `sort_order`, `created_at`.
- **`news_updates`** — `id`, `title`, `slug`, `published_at`, `body` (HTML/markdown),
  `image`, `created_at`.
- **`admin_users`** — `id`, `email`, `name`, `password_hash` (bcrypt), `created_at`. Used
  only by the Credentials provider. Google users are authorized by allowlist, not this table.

Seed script imports the current copy/stats/gallery from the old export so the dynamic site
launches identical to today.

## 6. Admin panel

- Same Next.js app; reachable at **`admin.dhakabypass.com`** (subdomain pointed at the app;
  middleware maps the host to the `/admin` route tree). `/admin` path works as a fallback.
- **Structured forms**, one screen per editable area:
  - Home sections (hero headline/subheadline/bg image, overview paragraphs + 4 stats,
    economic impact, route section)
  - Each inner page's copy
  - Gallery manager: upload / reorder / caption / delete images
  - Latest Updates: CRUD news posts
  - Contact info (email, phone, address)
  - Optional: SEO title/description per page (confirm in review — small add)
- **Image upload:** stored under a writable uploads dir served by the app (e.g.
  `/public/uploads` locally; a persistent path on the server). Filenames sanitized.
- On save → write to MySQL → revalidate affected public path(s) so changes show immediately.

## 7. Auth

- Auth.js v5 with two providers: **Google** and **Credentials** (email + bcrypt password
  against `admin_users`).
- **JWT session strategy** (no DB session table).
- **`ADMIN_EMAILS`** env (comma-separated allowlist). `signIn` callback rejects any email not
  in the list, for BOTH providers. Non-allowlisted Google logins are denied.
- Middleware protects the entire admin surface (`admin.` host and `/admin/*` + admin API
  routes); unauthenticated → login page.
- Secrets (`AUTH_SECRET`, Google client id/secret, DB creds) in server env / `.env` (never
  committed).

## 8. Deployment

1. Create MySQL DB + user and the `admin.dhakabypass.com` subdomain in cPanel.
2. Back up the current live static folder (already have `backup.zip`; also snapshot before
   switch).
3. GitHub repo for the project (public site + admin). Local `next build`
   (`output: 'standalone'`) → commit artifacts.
4. On server: `git pull` into `/home/aeos365/dhakabypass.com`, install as a **cPanel Node.js
   App** (Node 22) with the standalone `server.js` as the startup file; set env vars.
5. Point `dhakabypass.com` and `admin.dhakabypass.com` at the Passenger app.
6. Run DB seed once. Verify, then cut over.

Rollback = restore the static export from backup and repoint the domain (Passenger app off).

## 9. Testing / verification

- **Local:** run against local MySQL; visually diff each page against the old export;
  confirm admin edits round-trip to MySQL and re-render; confirm the allowlist rejects a
  non-listed email (both providers); gallery upload works.
- **Post-deploy (only when authorized):** Playwright smoke each live URL (0 console errors),
  one Google/password admin login, one content edit visible on the public page.

## 10. Out of scope / decisions

- Replaces the current Pages Router placeholder attempt (SVG placeholders, simplified copy).
- `mysql2` chosen over Prisma for shared-host robustness.
- Admin is the same app under the `admin.` subdomain, not a separate application.
- No multi-user roles/audit log for v1 (single admin group via allowlist). Can add later.
