# Dhaka Bypass (DBEDC) — Master Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take dhakabypass.com from a partially-migrated brochure site to a complete, fully admin-manageable toll-concession website that meets Bangladeshi PPP disclosure norms and international operator standards, with no user-visible content left in code.

**Architecture:** Six sequenced workstreams behind one blocking phase. Phase 0 fixes what is live-broken, insecure, or unshippable. W1 rebuilds the CMS engine *before* any new content work, because 40 new pages authored under today's editor would be 40 more hardcoded pages. W2 refills what the migration dropped. W3 and W4 close the corporate/statutory and road-user gaps the peer benchmark found. W5 adds media and engagement. W6 pays down engineering debt continuously, with its `Critical`/`High` items pulled forward into Phase 0.

**Tech Stack:** Next.js 15.2.3 → 15.5.x (App Router, `output: 'standalone'`), React 19, MySQL via `mysql2`, NextAuth v5, Tailwind + `app/design-tokens.css`, Vitest (752 tests) + Playwright (60 tests), cPanel/Passenger deploy with `revalidateTag` ISR.

**Spec / source of truth — read all four before starting any task:**
- `docs/audit/2026-09-06/findings-agent-a-legacy-parity-cms.md` — legacy parity + CMS editability (51 findings, `A-*`)
- `docs/audit/2026-09-06/findings-agent-b-peer-benchmark.md` — peer benchmark, 18 operator sites (74 findings, `B-*`)
- `docs/audit/2026-09-06/findings-agent-c-tech-debt.md` — technical debt (71 findings, `C-*`)
- `docs/audit/2026-09-06/traceability-checklist.md` — **the audit instrument.** 196 findings → tasks → status.

**How this plan stays honest:** every task below names the finding IDs it discharges. When a task completes, tick it here *and* in the traceability checklist. Before closing any phase, re-read the three findings files against the checklist — the checklist is a summary and summaries drift.

## Global Constraints

- **Nothing user-visible may be added in code.** Every page, heading, paragraph, label, stat and image added by W2–W5 must be authorable from the admin panel. If a workstream needs a capability to satisfy this, that capability is a W1 task and lands first.
- **Trilingual or it does not ship.** Every new string needs `en`, `bn`, `zh`. Bangla is authoritative for statutory and legal notices (B-ST-6, B-E7).
- **No new hardcoded copy.** After W1.6 lands, adding a user-visible string to `lib/i18n/ui.js` or `lib/i18n/map-ui.js` is forbidden; those files become fallback-only.
- **Toll figures carry provenance.** Every published rate cites its SRO/gazette number and date and links the PDF (B-ST-4). Never publish a rate without it.
- **Legal review gate.** No page may assert RTI Act 2009 applicability, statutory compliance, or a service-level commitment until counsel confirms (B-MC-3). Author in `status='draft'`; publish after sign-off.
- **Operator-verified facts only.** Emergency numbers, officer names, board members, financial figures and certifications are confirmed with DBEDC before publishing. Never placeholder a number a driver might dial.
- **DB changes ship as numbered idempotent SQL.** There is no migration runner (`db/sql/README.md`); every schema change is a re-runnable `db/sql/NN-*.sql` added to the deploy runbook checklist, until W6.6 replaces this.
- **Verify before claiming done.** Every task ends with a command run and its real output recorded. No task is ticked on inspection alone.

---

## Phase map

| Phase | Workstream | Findings | Why here |
|---|---|---|---|
| **0** | Stop the bleeding | C-D1/D5/D6/D7/D15/D16, A-P0-1..5, B-C5 | Live defects, an unpatched RCE, a repo that cannot ship itself, and an admin panel lying to its operator |
| **1** | W1 — CMS engine | A-P1-6..11, A-P2-14..20, A-HC-5.1..5.15 | Everything downstream authors through it |
| **2** | W2 — Legacy content recovery | A-LEG-01..11, A-MED-1..3 | Refill what the migration dropped, using the now-capable editor |
| **3** | W3 — Corporate & statutory | B-A1..A14, B-B1..B10, B-ST-1..8 | Largest credibility gap; legal review runs in parallel so start early |
| **4** | W4 — Road-user services | B-C1..C15 | Revenue- and safety-facing |
| **5** | W5 — Media & engagement | B-D1..D11, B-E1..E8 | High query-deflection value, lower risk |
| **6** | W6 — Tech debt | C-D2..D24, C-DEL-*, C-T*, C-R* | Continuous; Critical/High pulled into Phase 0 |

**The hard dependency:** W3 cannot be built well before W1. Agent B wants ~40 new pages; agent A found only 11 of 20 routes are block-editable, list fields are raw JSON, rich text is raw HTML, and images are typed paths. Building W3 first means 40 pages a developer must maintain forever.

---

# PHASE 0 — Stop the bleeding

Blocking. Nothing in W1–W6 starts until 0.1 lands, and 0.1–0.6 should complete inside a week.

### Task 0.1: Commit the working tree — BLOCKS EVERYTHING

**Discharges:** C-D1, C-P0.1, C-R4 · **Severity:** Critical

The nine legacy-retirement redirects exist in the working tree only. Verified: `git log -S "'/economic-impact', '/en/project'" -- next.config.mjs` returns nothing, and `git show HEAD:next.config.mjs` contains `/routes-facilities` only as a redirect *destination*, never as a source. `db/sql/03-content-recovery.sql` (258 KB) and `scripts/apply-content-recovery.mjs` are untracked — and `.github/workflows/production-release.yml:46` already invokes the latter. `scripts/release-to-branch.mjs:135` refuses to publish from a dirty tree, so **the repo cannot currently ship its own current behaviour.**

- [ ] **Step 1:** `git status --porcelain` — record the full list (12 modified, 3 untracked)
- [ ] **Step 2:** Review each modified file's diff; confirm nothing unintended is in the tree
- [ ] **Step 3:** Run `npm test` and record the real output before committing
- [ ] **Step 4:** Commit in coherent groups — redirects + legacy spec; content-recovery SQL + script + CI step; the rest
- [ ] **Step 5:** `git log --oneline -5` and `git status` to confirm a clean tree
- [ ] **Step 6:** Confirm `node scripts/release-to-branch.mjs --dry-run` no longer refuses on a dirty tree

### Task 0.2: Upgrade Next, next-auth, mysql2, nanoid

**Discharges:** C-D5, C-S1, C-S2, C-P0.2 · **Severity:** Critical · **Depends on:** 0.1

`next@15.2.3` carries an RCE in the React flight protocol (GHSA-9qr9-h5gf-34mp), Server Actions source-code exposure (GHSA-w37m-7fhw-fmv9), HTTP request smuggling in rewrites (GHSA-ggv3-7p47-pfv8 — this app uses `rewrites()` at `next.config.mjs:127-131` and a host rewrite at `middleware.js:30`), and middleware SSRF (GHSA-4342-x723-ch2f). The flight endpoint is reachable unauthenticated at `/en/contact`.

- [ ] **Step 1:** Record `npm audit --omit=dev` output verbatim as the before-state
- [ ] **Step 2:** Upgrade to `next@15.5.x` and the current `next-auth` v5; the 15.2→15.5 delta touches `unstable_cache` (`lib/content/cache.js:47`), awaited `params`, and `headers()` (`app/robots.js:21`, `app/uploads/[...path]/route.js:38`) — all used here
- [ ] **Step 3:** `npm test` — all 752 must pass; record output
- [ ] **Step 4:** `npm run build` then the Playwright suite against the build; record output
- [ ] **Step 5:** `npm audit --omit=dev` again; record the after-state
- [ ] **Step 6:** Commit

### Task 0.3: Add error boundaries

**Discharges:** C-D7, C-P0.3 · **Severity:** High

Zero `error.jsx` or `global-error.jsx` exist (verified). Any uncaught throw shows Next's raw "Application error: a server-side exception has occurred" on a government-linked infrastructure site.

- [ ] **Step 1:** Test asserting a thrown error in a page renders the branded boundary, not the raw Next error
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Create `app/global-error.jsx` (must render its own `<html>`/`<body>`) and `app/[locale]/error.jsx`; both localised, both linking back to `/{locale}`, both surfacing the error digest
- [ ] **Step 4:** Run test; force a throw locally and confirm the boundary renders in all three locales
- [ ] **Step 5:** Commit

### Task 0.4: Add the missing role check on the upload endpoint

**Discharges:** C-D15, C-S3, C-P0.4, C-T3 · **Severity:** Medium, exploitable today

`app/admin/api/upload/route.js:29` gates on `session.user.isAdmin` alone. Its sibling `app/admin/api/media/route.js:11,20` correctly requires `can(role, 'manage_media')`. A `translator` — permission set exactly `['translate']` (`lib/auth/roles.js:7`) — can upload an 8 MB file and insert a `gallery_images` row, publishing it. `tests/unit/admin-legacy-guards.test.js:34-38` covers server actions; the API route was never in that list — which is exactly how this survived.

- [ ] **Step 1:** Test asserting a `translator` session is rejected by the upload route
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Import `can` and add the `manage_media` check mirroring `media/route.js:11`
- [ ] **Step 4:** Run test, confirm pass
- [ ] **Step 5:** Commit

### Task 0.5: Add CI on push and pull_request

**Discharges:** C-D6, C-P0.5, C-R5 · **Severity:** High · **Depends on:** 0.1

`.github/workflows/production-release.yml:2-3` is `workflow_dispatch` only. Tests run only when a human cuts a release. Because the build is Linux-only, CI is also the only production path.

- [ ] **Step 1:** Create `.github/workflows/ci.yml` on `push` and `pull_request`, reusing the MariaDB service block from `production-release.yml:13-31`
- [ ] **Step 2:** `npm ci`, DB prep, `npm test`. No build, no release step
- [ ] **Step 3:** Push a branch and confirm the workflow runs green; record the run URL
- [ ] **Step 4:** Commit

### Task 0.6: Rate-limit the public write paths and stop lying about failures

**Discharges:** C-D16, C-D17, C-S4, C-P1.7 · **Severity:** Medium, exploitable trivially

`app/[locale]/contact/actions.js` has a honeypot (`:32`) and nothing else; the legacy contact and newsletter actions have neither. `message` is `longtext` and unbounded — one request can store megabytes into a table the runbook has no rollback for. Separately `app/admin/actions.js:170-174` returns `{ok:true}` after a failed insert, thanking the sender for a message that does not exist.

- [ ] **Step 1:** Tests — the 6th submission from one IP inside the window is rejected; a 1 MB message is rejected; a simulated DB failure returns `ok:false`
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Per-IP sliding-window bucket in module scope (sufficient on single-process Passenger), hard cap on `message`, fix the `{ok:true}` return
- [ ] **Step 4:** Run tests, confirm pass
- [ ] **Step 5:** Commit

### Task 0.7: Seed `/travel/rules` — a linked page that renders empty

**Discharges:** A-P0-1 · **Severity:** High

`db/sql/02-seed.sql:624-634` seeds 11 `pages` rows; none is `travel/*` (verified). `app/[locale]/travel/rules/page.jsx:11` looks for slug `travel/rules`. The page is linked from `TravelSubnav.jsx:13`, the homepage CTA (`02-seed.sql:78`) and the safety hero (`02-seed.sql:126`), and ships showing its empty state.

- [ ] **Step 1:** Test asserting a `travel/rules` page exists with ≥1 published block per locale
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Author speed limits, prohibited vehicles, lane discipline, emergency stopping, overtaking as blocks in `db/sql/04-travel-rules.sql`, idempotent
- [ ] **Step 4:** Run test; load the page in all three locales
- [ ] **Step 5:** Commit

### Task 0.8: Gallery must populate from the main seed alone

**Discharges:** A-P0-2, A-MED-2 · **Severity:** High

Every `media` row seeds `in_gallery=0` (`02-seed.sql:545-572`); only `03-content-recovery.sql:38` flips four on, and that is a separate manual phpMyAdmin step. Import the main seed alone and `/en/gallery` is blank.

- [ ] **Step 1:** Test asserting `02-seed.sql` alone yields `COUNT(*) WHERE in_gallery=1 > 0`
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Move the four flags into `02-seed.sql`; keep `03-content-recovery.sql` idempotent
- [ ] **Step 4:** Drop and re-import into a scratch DB, load `/en/gallery`
- [ ] **Step 5:** Commit

### Task 0.9: Make alt text writable and stop destroying it

**Discharges:** A-P0-3, A-HC-5.11 (partial) · **Severity:** High

Verified: no `alt` input exists anywhere in `app/admin` or `components/admin`. `lib/media.js:99-101` inserts `alt = {}` and probes no dimensions. `media/actions.js:39` resets alt and focal point on Replace. Every uploaded image is permanently undescribed, and replacing one silently removes its screen-reader text. `docs/admin/replacing-images.md` tells the operator to email a developer.

- [ ] **Step 1:** Tests — `saveUpload` records real width/height; `updateMediaAltAction` persists per-locale alt; Replace preserves alt and focal point
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Add a dimension probe, per-locale alt inputs on the Media row, `updateMediaAltAction`; stop Replace clearing `alt`/`focal_x`/`focal_y`
- [ ] **Step 4:** Run tests; upload, set Bangla alt, replace the file, confirm alt survives
- [ ] **Step 5:** Update `docs/admin/replacing-images.md` to drop the email-a-developer step
- [ ] **Step 6:** Commit

### Task 0.10: Privacy, terms and accessibility pages

**Discharges:** A-P0-4, A-HC-5.4, B-A9, B-B10, B-P0-6, B-ST-7 · **Severity:** High, compliance

GA4 and `components/chrome/ConsentBanner.jsx` are live. Grep for `privacy|terms of service` across `components/chrome/` and `lib/institutional/pages.js` returns zero. The legacy footer carried Privacy, Terms and Sitemap; all three were dropped.

- [ ] **Step 1:** Test asserting `/{locale}/privacy`, `/terms`, `/accessibility` return 200 in all three locales and are linked from the footer
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Author privacy (contact-form data, newsletter, GA4, cookies, retention, erasure contact), terms, and an honest accessibility statement naming known gaps — the VINCI "partially compliant" pattern. Seed as `pages` rows in `db/sql/05-legal-pages.sql`. Add footer links.
- [ ] **Step 4:** Run test; confirm the consent banner links to the policy
- [ ] **Step 5:** **Legal gate** — hold in `draft` until counsel signs off, then publish
- [ ] **Step 6:** Commit

### Task 0.11: Stop the admin panel lying to its operator

**Discharges:** A-P0-5, C-D3 (partial) · **Severity:** High

`next.config.mjs` 308s all nine legacy URLs, making `app/(site)/` unreachable — yet `/admin/pages`, `/admin/section/[key]` and `/admin/gallery` still edit it, and the dashboard claims *"Every heading, paragraph, statistic, news article, and image on the site is editable here"* (`(dash)/page.jsx:46`). `/admin/gallery` edits `gallery_images`, a table no public page reads.

- [ ] **Step 1:** Test asserting the admin nav exposes no route whose edits cannot reach a live URL
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Remove the three dead screens from the nav with an interstitial explaining where content moved; rewrite the dashboard claim to state what *is* editable
- [ ] **Step 4:** Run test; click every nav item and confirm each maps to a reachable public URL
- [ ] **Step 5:** Commit. Full deletion is W6.1 — this task only stops the deception

### Task 0.12: Fix redirect chains and three hard 404s

**Discharges:** A-P1-13, A-MED-3 · **Severity:** Medium

`/project/route`, `/project/impact` and `/project/timeline` were linked from the legacy `/project/overview` and now 404. `/about-project` → `/project/overview` → 308 → `/en/project` is a double hop, as is `/expressway-route` → `/routes-facilities` → `/en/travel/map`.

- [ ] **Step 1:** Extend `tests/e2e/legacy.spec.js` — every legacy URL reaches its destination in one hop; the three orphans resolve
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Add the three redirects; collapse the double hops to point directly at `/en/*`
- [ ] **Step 4:** Run the spec, confirm pass
- [ ] **Step 5:** Commit

### Task 0.13: Publish emergency contact numbers

**Discharges:** B-C5, B-P0-5 · **Severity:** High, life-safety

No patrol, ambulance, tow, fire or police number is published anywhere. NHAI publishes named toll managers and per-plaza field-officer numbers; PLUS runs a 1-800 emergency line. On a 48 km access-controlled highway a stranded driver cannot walk off.

- [ ] **Step 1:** Test — an emergency block renders on every travel page and in the footer, all three locales, with working `tel:` links
- [ ] **Step 2:** Run, confirm fail
- [ ] **Step 3:** Add emergency fields to `site_settings` (patrol, ambulance, tow, fire, highway police, control room); render a persistent strip; make them editable at `/admin/settings`
- [ ] **Step 4:** Run test; verify `tel:` links dial on a real phone
- [ ] **Step 5:** **Publish role numbers only — DECIDED 2026-09-06.** The operator supplied DBEDC's internal Emergency Contact List. It carries **nine personal mobile numbers of named staff**. Those must NOT be published. Publishing an individual's personal handset on a public website exposes them to spam, harassment and out-of-hours calls from strangers, permanently, and breaks the moment they change role. No peer operator does it — NHAI publishes role numbers per plaza, PLUS publishes one 1-800 line. **Publish:** `999` (national emergency, first and most prominent); one **dedicated DBEDC 24/7 control-room number** on its own SIM, not a person's handset; and the government police lines (Gazipur Metropolitan Police, Vogra Traffic Inspector, Kanchan Highway Police) **only after those agencies confirm they want them public**. The internal sheet stays internal. If no dedicated control-room number exists yet, ship `999` plus the confirmed police lines and leave a labelled gap — never a staff mobile.
- [ ] **Step 6:** Commit

### Task 0.14: Correct the runbook and the load-bearing false comments

**Discharges:** C-D10, C-P0.6, C-S7, A-P2-22 · **Severity:** High

The runbook's post-deploy step 7 (`docs/deployment/2026-09-04-deploy-runbook.md:263`) tells the operator to confirm all nine legacy URLs return **200**. They return 308. An operator following it concludes a correct deploy is broken and may "fix" it by reverting the redirects. Four more files assert the legacy tree is live as *justification* for real decisions: `lib/seo/routes.js:6-43`, `next.config.mjs:39-46` (justifies the report-only CSP), `components/chrome/DocumentLang.jsx:13-22`, `docs/source-data/2026-09-04-legacy-content-audit.md:4`. `middleware.js:7-9` names the wrong guard file. `db/sql/README.md:5` says "these two files" then lists three.

- [ ] **Step 1:** Rewrite runbook step 7 to expect 308s; delete the resolved "Cutover URL policy" item at `:302-306`
- [ ] **Step 2:** Correct all six comment/doc sites to state what is true
- [ ] **Step 3:** Grep for other assertions that `app/(site)` is live; fix what turns up
- [ ] **Step 4:** Commit

### Task 0.15: Get the 13.7 MB GeoJSON off the app server

**Discharges:** C-D11, C-DEL-15, C-P1.8 · **Severity:** High

`public/maps/corridor-geography.geojson` is 13.7 MB, tracked in git, and offered as a public download (`lib/corridor/view.js:110`). Each click costs 13.7 MB of egress and a 13.7 MB read on a memory-limited shared host. `corridor-geography.svg` is a further 3.5 MB.

- [ ] **Step 1:** **DECIDED 2026-09-06 — remove the public download and untrack the file.** Keep the map itself. Raw survey geometry is not a web asset. If a download is genuinely wanted later, ship a simplified sub-1 MB version, not the source.
- [ ] **Step 2:** Drop the download affordance at `lib/corridor/view.js:110`; `git rm --cached` the file; record `public/` weight before and after
- [ ] **Step 3:** Confirm the map still renders and `public/` weight is recorded before and after
- [ ] **Step 4:** Commit

### Task 0.16: Split the test scripts

**Discharges:** C-D20, C-P1.6 · **Severity:** Medium

`npm test` runs unit *and* DB suites together. The 9 DB files need a live MySQL and an untracked `.env.local`; on a clean checkout they fail in `beforeAll` and a newcomer cannot tell a real failure from a missing database.

- [ ] **Step 1:** Add `test:unit` → `vitest run tests/unit`, `test:db` → `vitest run tests/db`; `test` runs both
- [ ] **Step 2:** Update `production-release.yml:48` and the new `ci.yml`
- [ ] **Step 3:** Run `npm run test:unit` with no MySQL available; confirm green
- [ ] **Step 4:** Commit

### Task 0.17: Recolour the header to the DBEDC brand palette

**Discharges:** A-HC-5.3 (partial), UI review item 1 & 2 · **Requested by the operator 2026-09-06**

The header plate is `--db-plate-bg:#0B1620` (neutral near-black) with `--db-plate-accent:#FFB000` — a generic highway amber that appears nowhere in the DBEDC logo. Colours sampled from `public/logo.webp`: **blue `#1172BA`**, **orange `#EF8221`**.

**Measured before choosing — the naive swap is an accessibility regression:**

| Combination | Ratio | Verdict |
|---|---|---|
| Logo orange `#EF8221` on logo blue `#1172BA` | 2.64:1 | Fails AA text (4.5:1) **and** UI component (3:1) |
| `#EDF2F5` on logo blue `#1172BA` | 4.50:1 | Exactly on the line, no headroom |
| White on logo blue `#1172BA` | 5.07:1 | Passes, thin |
| Current `#FFB000` on `#0B1620` | 9.97:1 | What we have today |
| **`#EDF2F5` on `#06263D`** | **13.76:1** | Chosen |
| **`#EF8221` on `#06263D`** | **5.83:1** | Chosen |

The logo's orange cannot sit on the logo's blue — not for text, not even as a border. So a literal `#1172BA` header would force white-only text and destroy the accent system. Driving the brand blue to plate depth keeps the signage character the design system deliberately built, makes the plate unmistakably DBEDC blue-black rather than neutral black, and lets the **real logo orange replace the generic amber**.

- [ ] **Step 1:** Test asserting `--db-plate-fg` on `--db-plate-bg` ≥ 4.5:1 and `--db-plate-accent` on `--db-plate-bg` ≥ 4.5:1, in both light and dark blocks
- [ ] **Step 2:** Run, confirm it passes today (9.97:1) so the test is a real guard, not a rubber stamp
- [ ] **Step 3:** Set `--db-plate-bg:#06263D`, keep `--db-plate-fg:#EDF2F5`, set `--db-plate-accent:#EF8221` at `app/design-tokens.css:48-50`; update the dark-mode lift at `:98,:119` to a matching deeper blue; record the measured ratios in the token comment, matching the file's existing discipline
- [ ] **Step 4:** Replace the `DB` text monogram at `SiteHeaderV2.jsx:63` with `public/brand/dbedc-mark.svg`; keep the wordmark as live text so it stays translatable
- [ ] **Step 5:** Run the test; screenshot the header in light and dark, all three locales
- [ ] **Step 6:** **Brand gate — confirm `dbedc-mark.svg` against DBEDC's official artwork before it also becomes the favicon and the JSON-LD logo.** It is a redraw from a 215px raster, not a vectorisation, and it omits a small circle detail on the right of the ring.
- [ ] **Step 7:** Commit

**Phase 0 exit gate:** no linked page renders empty · gallery populates from the main seed alone · alt text writable and durable · privacy/terms/accessibility live and linked · every admin nav item reaches a live URL · zero legacy 404s and zero redirect chains · emergency numbers published and operator-verified · `npm audit --omit=dev` clean · CI green on push · error boundaries in place · working tree committed.

---

# W1 — CMS engine

**Gate:** W1 is complete when a non-technical operator can author a new multi-block trilingual page with images, lists, rich text and per-page SEO, without a developer. Prove it by building one W3 page end-to-end from the admin UI only.

| # | Task | Discharges | Files | Acceptance |
|---|---|---|---|---|
| W1.1 | Image picker in the block editor | A-P1-6 | `components/admin/BlockFields.jsx` (no `image` branch today — verified), reuse `FieldInput.jsx:41-58` | Operator picks or uploads an image with a thumbnail; never types a path |
| W1.2 | Repeater UI for `list` fields | A-P1-7 | `BlockFields.jsx:8-16` (raw JSON textarea today) | `card-grid`, `figure-grid`, `stat-row`, `partner-row`, `toll-preview` editable without JSON |
| W1.3 | Rich-text editor | A-P1-7 | `BlockFields.jsx:17-24` (plain textarea, operator writes HTML) | Toolbar with headings, bold, links, lists; output sanitised |
| W1.4 | Drag-and-drop reordering | A-P1-8 | `pages-v2/[id]/page.jsx:72-84`, add `@dnd-kit/sortable` | One drag = one `reorderBlocksAction`; today 9→1 is eight page reloads |
| W1.5 | `corridor-summary` block; remove hero hoisting | A-P1-9, A-HC-5.5 | `app/[locale]/page.jsx:113-135` | Editor order is what renders; corridor section movable and removable |
| W1.6 **[x]** | `ui_strings` table + writable `/admin/translations` | A-P1-10, A-HC-5.1, A-HC-5.2 | `lib/i18n/ui.js` (154 keys / 462 strings), `lib/i18n/map-ui.js` (28 / 84), `admin/(dash)/translations` (read-only, not in nav) | **Done.** All 182 keys × 3 locales = 546 strings editable at `/admin/translations` (in nav as "Wording"); code values are the fallback and a database outage renders the site in all three languages; `ui-strings` revalidate tag; `db/sql/09-ui-strings.sql` creates an empty override table. Counts corrected from the audit's 152/29/543. |
| W1.7 | `route_meta` per-page SEO for code routes | A-P1-11, A-HC-5.10 | new table; every `generateMetadata` | Title, description, OG image editable per route; JSON-LD logo dimensions derived not literal |
| W1.8 | **Every public route becomes a block document** — REWRITTEN, see below | A-HC-5.6, 5.7, 5.8, 5.9 | All of `app/[locale]/**/page.jsx` | No public route has a page-specific React skeleton. `app/[locale]/[...slug]/page.jsx` is the only public renderer. |
| W1.9 | *(folded into W1.8 — making copy editable inside a fixed page was the wrong target)* | — | — | — |
| W1.10 | Header/footer branding and logo from settings | A-P2-14, A-HC-5.3, 5.4 | `SiteHeaderV2.jsx:63-66`, `SiteFooterV2.jsx:111-112` | Live header renders the logo image (today a `DB` text monogram); legal name and tagline from `site_settings` |
| W1.11 | Menus: seed built-ins, incremental edit, drag reorder, `TravelSubnav` menu-driven | A-P2-15, A-P2-16 | `menus/page.jsx:36-39`, `lib/menus/slugs.js`, `TravelSubnav.jsx:7-14` | Adding one nav item no longer replaces the whole menu |
| W1.12 | Live preview + draft preview URL | A §6 | `pages-v2/[id]` | Operator sees the page before publishing |
| W1.13 | Write `revisions`; add undo | A-P2-18, C-D22 | `db/sql/01-schema.sql:335` (table exists, never written) | Every block save records a revision; one-click restore |
| W1.14 | Block nesting — columns, tabs, accordions | A §6 | `blocks` needs `parent_id` (`01-schema.sql:81`) | Blocks nest; layout is composable |
| W1.15 | Per-block styling controls | A §6 | `lib/blocks/types/*` | Background, spacing, alignment as validated enums — `media-prose.side` is free text today and `Left` silently does nothing |
| W1.16 | Brand tokens in admin | A-P2-19, A-HC-5.12 | `app/design-tokens.css` (75 properties) | A curated subset (accent, status colours, shell width) editable; rebrand without a redeploy |
| W1.17 | `/admin/users` screen | A-P2-17, A-HC-5.15 | `lib/auth/roles.js`, `(dash)/layout.jsx` | Add or remove an editor without SSH or SQL |
| W1.18 | Media: add, delete, focal point, crop | A-HC-5.11 | `media/page.jsx:93-105`, `media/actions.js` | Media screen has an Add button and a delete; `focal_x`/`focal_y` finally used |
| W1.19 | Port the 404 off the dead `content` table | A-LEG-11, A-HC-5.14, C-D18 | `app/not-found.jsx:8`, `app/[locale]/layout.jsx:44` | 404 renders localised, with chrome, and does not go blank during a DB outage |
| W1.20 | Contact address/email from settings | A-P2-20, A-HC-5.8 | `contact/page.jsx:88,90` | English-only hardcoded fallbacks deleted; per-locale values seeded |
| W1.21 | Map labels and context editable | A-HC-5.13, A-HC-5.2 | `lib/i18n/map-ui.js`, `lib/corridor/map-labels.js:11-38` | Map control panel, legend and label rules editable without a rebuild |
| W1.22 | **Ten new block types W3–W5 cannot ship without** | UI-9 | `lib/blocks/types/*`, `components/blocks/*` | `person-card` (board/management), `document-list` (downloads, disclosures), `faq` (accordion), `data-table` (tolls, statistics), `timeline` (project chronology), `tabs`, `contact-directory`, `map-pin-list` (offices, rest areas), `stat-dashboard`, `logo-row` (partner marks). Today there are 9 types and none of these. |
| W1.23 | Page templates + duplicate a page | A §6 | `pages-v2/actions.js` | An operator can duplicate a page. Today only a block can be duplicated, so every one of the ~25 W3 pages is built from scratch. |
| W1.24 | Favicon, robots, OG default image from admin | A-HC-5.10 | `app/layout.jsx:7`, `app/robots.js`, `lib/seo/organization.js:71-74` | Operator can replace the favicon and the social share image, and block a page from crawling, without a deploy. JSON-LD logo dimensions derived from the file, not literals. |
| W1.25 | Preview: side-by-side draft preview at real breakpoints | A §6 | `pages-v2/[id]`, a signed preview route | Operator sees the exact page before publishing, in all three locales, at mobile and desktop widths. Expands W1.12 from "a preview exists" to "preview is the primary editing surface". |
| W1.26 | Reversed brand mark wiring | OP-3, UI-4 | `SiteHeaderV2.jsx`, `public/brand/dbedc-mark.svg` | One SVG serves both grounds via `currentColor`; blue on light, plate-fg on dark. Measured: DBEDC blue on `#06263D` is 3.06:1 and disappears, so the reverse variant is required, not cosmetic. |
| W1.27 | Partner logo assets wired into `partner-row` | OP-4, UI-8 | `public/brand/{rhd,udc,sdig-srbg,dbedc}.{png,webp}`, `lib/blocks/types/partner-row.js` | Replace the typographic-credit fallback with the real marks. **Light surfaces only** — see UI-8. Update the block's header comment, which currently states no vector marks are held. |
| W1.28 | Chinese typography | UI-3, UI-4, UI-5 | `public/fonts/`, `components/chrome/FontPreload.jsx`, `app/design-tokens.css:74,154,437` | A subset CJK webfont ships and is preloaded, so `/zh` does not depend on the reader's OS having a Chinese font. Drop `text-transform:uppercase` from `.db-h1` for non-latin locales — Bengali and Chinese have no case. |
| W1.29 | **Give the admin panel a design language** | UI-10, UI-11, UI-12 | `app/admin/**`, `components/admin/**` | Admin adopts the `db-*` tokens: DBEDC blue instead of Tailwind's `bg-blue-900`, shared form/field/button primitives instead of per-screen `className="border rounded px-3 py-2"`, dark mode parity with the public site, and nav labels named for what an operator understands. This is the surface the client uses every day and it is currently the least designed part of the product. |

---

## W1.8 (rewritten) — every public route becomes a block document

**The requirement, stated plainly by the client: the block editor is the only way the public site is edited. Every page, every section, every block, authored and previewed in the admin panel. No page-specific React skeletons that a developer has to change later.**

The original W1.8/W1.9 did not meet this. They added a block *region* inside fixed React pages and made the surrounding copy editable — leaving the H1, the lede, the toll table, the map, the traffic strip and the interchange table hardcoded. That is a CMS window cut into a hardcoded wall. Rewritten:

### W1.8a — Convert every public route to a `pages` row
Today 11 of ~20 routes are block documents. These are not, and must become so: `home`, `travel/status`, `travel/toll`, `travel/route`, `travel/facilities`, `travel/map`, `travel/rules`, `news` (index), `gallery`, `contact`, `not-found`.

### W1.8b — Delete the per-route page files
Once converted, these stop existing: `app/[locale]/page.jsx`, `app/[locale]/travel/{status,toll,route,facilities,map,rules}/page.jsx`, `app/[locale]/gallery/page.jsx`, `app/[locale]/news/page.jsx`, `app/[locale]/contact/page.jsx`. `app/[locale]/[...slug]/page.jsx` becomes the single public renderer. This is the test of whether the work is real: **if a page file still exists, that page is still hardcoded.**

### W1.30 — Functional block types (the hard part)
The widgets currently welded into those pages must become blocks an operator places, configures and previews. These are *dynamic* blocks — they read live data from the corridor, news and media tables and take configuration from block fields, rather than storing authored prose:

`corridor-map` · `toll-table` · `traffic-status` · `progress-bar` · `interchange-table` · `corridor-strip` · `news-list` · `gallery-grid` · `contact-form` · `newsletter-form` · `emergency-strip` · `section-subnav`

Each needs: configurable fields (how many items, which section, which columns, sort order), a preview that renders real data in the editor, and graceful empty/error states. Note `news-list` and `gallery-grid` currently carry hardcoded caps (24 items, 200 photos) — those become fields.

### W1.31 — Route behaviour from admin
`app/[locale]/travel/page.jsx:6` hardcodes `redirect('/travel/status')`. Route-level behaviour — landing targets, redirects, per-page item caps — moves into page settings.

### What genuinely cannot be a pure block document — decide explicitly, do not discover later

1. **`/news/[slug]`** is a *template*, not a document: one layout rendering N articles from `news_updates`. Its chrome can be blocks; the article body comes from the record. This is a template page, and there will be more of them (any future `/projects/[slug]`).
2. **`app/layout.jsx`** — the root `<html>`/`<head>` shell. Not content.
3. **The admin panel itself.**

Everything else is a block document. If a fourth exception appears during implementation, it is escalated and written down here — not absorbed silently.

---

## What "100% admin-editable" means here — and what it deliberately does not

The stated goal is that every pixel, block and section of the public site is editable from the admin panel with preview. W1.1–W1.28 gets there for **all content, copy, media, navigation, SEO, arrangement and brand colour**, with preview (W1.25). Three things stay in code, on purpose:

1. **New *kinds* of section still need a developer.** `lib/blocks/registry.js:24` requires every block type to have a React `Component`. W1.22 ships the ten types W3–W5 need, so an operator composes pages freely from a rich palette — but inventing an eleventh kind of section is a code change. Making block types themselves user-authorable means shipping a template language, which is a product, not a task.
2. **Interactive apparatus becomes a block, but its internals stay code.** After W1.30 the corridor map, toll table, traffic strip and progress bar are all blocks an operator places, configures, reorders and previews like any other. What stays in code is their *implementation* — the map's projection maths, the toll query. Nobody drags a projection algorithm. The operator controls where it sits, what it shows and what it is called; a developer maintains how it computes.
3. **The full 75-token design system is not exposed** — W1.16 exposes a curated subset (accent, status colours, shell width). Handing an operator every spacing and colour token is how a considered design system becomes an inconsistent one, and it would silently break the measured contrast ratios the tokens exist to guarantee.

**This is a real limit and it is the right one.** A literal every-pixel drag-and-drop builder produces pages that are off-brand, inaccessible and unmaintainable — it moves the cost from "ask a developer" to "every page is broken differently". If the client wants a general-purpose page builder rather than a governed editor for a concession website, that is a different product and should be decided explicitly, not arrived at by accident.

**Honest status:** as originally written, W1 did **not** reach the goal — it lacked the ten block types W3–W5 depend on, page duplication, favicon/robots control, and a preview strong enough to edit against. W1.22–W1.28 close that gap. Without W1.22 in particular, W3 cannot be built from the admin panel at all, and the ~25 governance pages would arrive as hardcoded React.

---

# W2 — Legacy content recovery

Source of truth is `old_dhakabypass/*/index.txt` (text) plus `index.html` (images, links, structure). **Gate:** a diff of every legacy page against its live replacement shows no unexplained content loss.

| # | Task | Discharges | What to restore |
|---|---|---|---|
| W2.1 | Home | A-LEG-01 | 4 overview stats (48 km / 75% reduction / 1st PPP / 25 years), 4 impact metrics (1,000+ jobs, 75%, US$412M, 4 highways), "12 bridges, 7 flyovers, 27 underpasses", footer address/email/phone |
| W2.2 | Project | A-LEG-02 | 6-category progress breakdown (93.9/82.89/53.95/100/90.9/54.21, dated 31 Dec 2024), 5 key achievements, 5-entry timeline, 8 spec tiles, the entire semi-rigid pavement section with `/semi.webp` + `/cp.webp`, Vision & Mission |
| W2.3 | Project overview | A-LEG-03 | 8 objectives, 9-item technical-spec grid, Project Documents list (make the links real — they were `href="#"` on the old site too) |
| W2.4 | Routes & facilities | A-LEG-04 | Full-distance toll column ৳200–৳1600, calculation formulas, 5 key-location narratives, Expressway Facilities section, "Partial Opening Success" panel |
| W2.5 | Stakeholders | A-LEG-05 | 6 partner outbound links (scrbg.com, udccl.com.bd, rhd.gov.bd, cdb.com.cn, pppo.gov.bd, biffl.org.bd), 3 header stats, ৳224cr→৳674cr VGF revision, ৳1,614cr CDB loan, ৳1,075cr BIFFL loan, ৳42.5cr first instalment, Governance Structure |
| W2.6 | Chinese contribution | A-LEG-06 | 6 contribution cards, $412M/60%/1000+ counters, pavement case study, Belt & Road section, Knowledge Transfer (50+ engineers, 2 technologies), 3 CSR cards |
| W2.7 | Economic impact | A-LEG-07 | 4 counters, trade figures (0.8% of GDP exports, 15-20% cost reduction), 4 growth metrics, employment (2,000+ direct / 10,000+ indirect / 500+ trained), regional development (Purbachal +46%, Gazipur +38%, Narayanganj +52%) |
| W2.8 | Newsletter form | A-LEG-08 | Restore the subscribe form (`NewsletterForm.jsx` is currently imported only by a dead route) |
| W2.9 | Gallery | A-LEG-09, A-MED-1, A-P1-12 | Restore the 32 missing photos; classify the 13 images in neither AUDITED nor REJECTED; add pagination and a lightbox; raise or remove the 200-photo ceiling |
| W2.10 | Contact | A-LEG-10 | Decide the real phone number with the operator (the legacy `+880 12345-6789` was a placeholder, correctly dropped) |

---

# W3 — Corporate & statutory disclosure

**Depends on W1.** ~25 new pages, all authored from the admin panel. **Legal gate applies to W3.15–W3.25.**

- **W3.0** — Pre-flight: re-verify agent B's feature matrix against the live site (B-MC-1); the agent was 403-blocked from fetching dhakabypass.com
- **W3.1–W3.4** — Company page (B-A1), shareholding SRBG 70 / Shamim+UDC 30 (B-A2), board & management (B-A3), organogram (B-A4)
- **W3.5–W3.6** — Concession summary: DBFOM, 6 Dec 2018, 25 years, RHD, handback, toll-revision mechanism (B-A5); financing: USD 358.83m, BIFFL ৳1,075cr, ADB USD 50m (B-A6, A-LEG-05)
- **W3.7–W3.8** — Annual report + audited accounts (B-A7); traffic & revenue statistics dashboard (B-A8, B-B8)
- **W3.9–W3.14** — Policy library (B-A9), ISO certs incl. 39001 (B-A10), CSR/ESG (B-A11), careers (B-A12), procurement + supplier registration (B-A13), awards (B-A14)
- **W3.15–W3.17** — **RTI page** with named Information Officer, Appeal Authority, forms, proactive-disclosure index (B-B1, B-ST-1, B-ST-2); **Citizen Charter** (B-B2, B-ST-3); **GRS** with tracking number, SLA, named ONIC and Appeal officer, published resolution stats (B-B3)
- **W3.18** — Toll-violation and overcharge dispute/appeal (B-B4)
- **W3.19–W3.20** — ESIA/ESMP (B-B5, B-ST-8); land acquisition & resettlement with entitlement matrix and claimant grievance path (B-B6)
- **W3.21–W3.22** — Public consultation notices (B-B7); National Integrity Strategy corner (B-B9)
- **W3.23** — **Gazette citation on every toll page** — SRO number, date, linked PDF, revision mechanism (B-ST-4). This also repairs the provenance A-LEG-04 lost.
- **W3.24–W3.25** — PPPA Dataroom alignment and link (B-ST-5); Bangla-authoritative statutory pages and a Bangla parity audit (B-ST-6, B-E7)

---

# W4 — Road-user services

**W4.1 is the highest value-to-effort item in the entire audit** — the toll, interchange and segment data already exist; the calculator is a UI over them.

- **W4.1** — O–D toll calculator: entry × exit × vehicle class → fare, distance, estimated time (B-C1, B-P0-1)
- **W4.2–W4.3** — Vehicle classification guide with diagrams and edge cases: CNG, easy-bike, covered van, trailer (B-C2); payment methods incl. bKash/Nagad/Rocket (B-C3)
- **W4.4** — ETC/RFID account self-service; integrate with the national scheme rather than building one (B-C4)
- **W4.6–W4.8** — Breakdown assistance request (B-C6); live CCTV (B-C7); forward-looking roadworks and closures calendar (B-C8)
- **W4.9–W4.10** — Rest-area directory with amenity filters and map pins (B-C9); **freight section** — axle loads, weighbridges, oversize permits, freight tolling (B-C10), currently invisible on a corridor whose purpose is freight
- **W4.11–W4.12** — Weather and flood advisories, the defining operational risk on this alignment (B-C11); lost & found (B-C12)
- **W4.13–W4.15** — SMS/WhatsApp advisories before any app (B-C13); loyalty scheme (B-C14); fleet portal (B-C15)

---

# W5 — Media, downloads & engagement

- **W5.1–W5.2** — Downloads centre: brochure EN/BN, printable corridor map, toll-rate card, forms, policies (B-D1); media kit with press contact, boilerplate, fact sheet, hi-res imagery, logo usage rules (B-D2)
- **W5.3–W5.4** — Video and drone gallery (B-D3); before/after and construction milestones with % complete (B-D4) — this is the evidence that rebuts the published time-and-cost-overrun narrative
- **W5.5–W5.7** — FAQ (B-D5); structures register with chainage (B-D6); design standards and technical specifications (B-D7)
- **W5.8–W5.10** — Road-safety education programme (B-D8); press releases as a dated archive distinct from news (B-D9); virtual 360° tour (B-D10)
- **W5.11** — Put real figures on `/economic-impact` (B-D11) — pairs with W2.7
- **W5.12–W5.16** — Departmental contact directory (B-E1); office locations map (B-E2); site search (B-E3); HTML sitemap (B-E4); social channels and a push advisory feed (B-E5)
- **W5.17–W5.18** — WCAG 2.1 AA audit of the map, toll tables and traffic status, then update the accessibility statement to match reality (B-E6, B-ST-7); print/share on toll tables (B-E8)

---

# W6 — Tech debt & hardening

- **W6.1** — Delete the legacy tree: `app/(site)/**`, 7 legacy components, 4 legacy admin routes, 3 legacy admin components, `lib/gallery.js` — **6,485 lines** (C-D2, C-DEL-1..4,6). Requires 0.1 committed and 0.5 CI watching. Keep `FieldInput.jsx` and `NewsForm.jsx`.
- **W6.2–W6.3** — Port `not-found` and the dashboard off `lib/content.js`, then delete it and `lib/admin-sections.js` (C-DEL-5); port the news admin off `lib/news.js` to `newsroom/repo.js`, then delete (C-DEL-7)
- **W6.4–W6.5** — Promote the CSP to enforcing on `/:path*` once its stated justification is gone (C-S5); simplify `DocumentLang` via a route-group root layout, replacing a JS-dependent WCAG 3.1.1 workaround with a server-rendered `lang` (C-P1.5)
- **W6.6** — **Real migrations**: a `schema_migrations` table, numbered idempotent files that record their own application, and a `preflight.mjs` version gate that refuses to boot when the DB is behind (C-D9, C-R1..R3, C-R6). Turns a silent 500 into a refused boot.
- **W6.7–W6.9** — ESLint + Prettier + CI lint gate (C-D13); structured logging wired into the boundaries and `lib/errors.js:43` (C-D8); admin e2e coverage — sign-in, create page, add block, save translation, upload, replace (C-T1, C-P2.4)
- **W6.10–W6.11** — Drop dead tables and scripts, and replace the `tables.length!==28` magic number with a checked-in table list (C-D21, C-D22, C-D23, C-DEL-8,13,14); reduce the deploy branch, currently 2,471 tracked files per release (C-D14) — do this last, it touches the one thing that reliably works
- **W6.12–W6.16** — Declare `sharp` in devDependencies (C-D12); `.extract/` ignored, `admin-dash.png` and `var/shots.mjs` untracked (C-D24); archive `old_dhakabypass/` off `main` **only after** replacing it as the runbook's named rollback target (C-DEL-11); remove `content/*.json` after CI stops reading `content/seed.json` (C-DEL-9)
- **W6.17–W6.18** — Filter `block_translations` by locale in SQL instead of fetching all three and discarding two-thirds (C-D19); resolve `isrFlushToDisk:false` + multi-process Passenger staleness and the CI-seed-warmed cache baked into the artifact (A-P2-21, C-R7)
- **W6.19** — Close the test gaps: auth callbacks and bcrypt path, both upload endpoints, contact submission and honeypot, toll pricing, i18n fallback rendering (C-T2..T6)

---

## Self-review against the spec

- **Coverage:** all 196 findings map to a task; the mapping is `docs/audit/2026-09-06/traceability-checklist.md`. Three rows are deliberately `[~]` (C-S6 and C-S8 verified clean, B-MC-2 accepted) with reasons recorded.
- **Sequencing risk:** the one dependency that would waste the most work is building W3 before W1. Called out in the phase map and enforced by the W1 gate.
## Decisions taken 2026-09-06

| # | Decision | Rationale |
|---|---|---|
| 0.13 | **Publish `999` + one dedicated DBEDC control-room number + confirmed police lines. Never a staff mobile.** | The supplied internal list carries nine named staff members' personal handsets. Peer practice is role numbers (NHAI per-plaza roles, PLUS 1-800). Personal numbers on a public site are permanent exposure and break on any role change. |
| 0.15 | **Remove the 13.7 MB GeoJSON download; untrack it. Keep the map.** | Raw survey geometry is not a web asset. A simplified sub-1 MB export can be offered later if genuinely wanted. |
| 0.17 | **`--db-plate-bg:#06263D`, `--db-plate-accent:#EF8221` (the real logo orange).** | Logo orange on logo blue measures 2.64:1 — fails both text and UI-component thresholds. Deep brand navy gets both brand colours onto the header at 13.76:1 and 5.83:1. |
| W2.10 | **Office landline for general enquiries + control-room number for operations.** | Two different jobs. Do not overload one number, and do not use a personal mobile for either. |
| W6.15 | **Tag `legacy-site-archive`, push an orphan branch, remove `old_dhakabypass/` from `main`, repoint the runbook's rollback target at the tag.** | Nothing is lost, `main` sheds 11 MB, and the rollback path stays real. |
| **Traffic data source** | **TomTom.** Live section conditions come from the TomTom Flow API, not operator entry. `lib/corridor/tomtom.js` already implements this — flowSegmentData with a 15-minute freshness window, writing `condition_key`, `avg_speed_kmh` and `measured_at` onto `corridor_sections`. `traffic_source` accepts `sample \| operator \| tomtom` and, per `lib/corridor/traffic-admin.js:89`, **tomtom is enabled only by a successful refresh** — it cannot be switched on blind. The CSP already allows `https://api.tomtom.com`. Outstanding: `TOMTOM_API_KEY` must be set on the server, and a refresh scheduled. Until then sections honestly render "Not measured". |
| **Monthly traffic source** | **Our own toll plaza counts**, entered by DBEDC — not TomTom, not sample. `traffic_monthly` is already keyed `(month, plaza)` with a `vehicles` count, which is exactly a per-plaza monthly total, and `monthly_source` accepts `sample \| operator` only. Edited at `/admin/corridor/monthly`. |
| **Work with existing data** | Do not block delivery on data DBEDC has not supplied. Blocks render honest empty states and dated provenance rather than placeholders. A gap that announces itself is correct; an invented figure is not. |
| Partner logos | **Do not redraw RHD, SRBG/SDIG or UDC marks. Request official SVG/EPS from each organisation.** | RHD's emblem contains a photograph and is a government seal — unvectorisable by hand and misleading if approximated. SRBG/SDIG carries Chinese characters that a hand trace would render *wrong*. UDC's source is a defocused photo of a screen. `lib/blocks/types/partner-row.js` already documents this conclusion and it stands. `public/brand/dbedc-mark.svg` was produced because it is DBEDC's own mark and can be checked against the official file. |

- **Still open:** none blocking. Confirm `dbedc-mark.svg` against official artwork (0.17 step 6); obtain a dedicated control-room number (0.13); chase partner brand files.
