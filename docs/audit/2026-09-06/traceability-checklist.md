# Traceability Checklist — every finding → every task

> **This file is the audit instrument. The master plan is derived from it, never the reverse.**
>
> **Rules of use:**
> 1. Every finding in the three `findings-agent-*.md` files has exactly one row here. A finding with no row is a process failure.
> 2. Every row names the master-plan task that discharges it. A row with no task is a gap — add the task.
> 3. Mark `[x]` **only** after the task's verification command has been run and its real output recorded in the task. Inspection is not completion.
> 4. Before closing any phase, re-read the three findings files against this table. Do not trust this table alone — it is a summary, and summaries drift.
> 5. A finding deliberately **not** being actioned is marked `[~]` with a one-line reason. Silence is not a decision.
>
> **Status key:** `[ ]` not started · `[>]` in progress · `[x]` done and verified · `[~]` accepted/won't-do (reason required) · `[?]` blocked (blocker named)
>
> **Counts:** Agent A 51 findings · Agent B 74 findings · Agent C 71 findings · **196 total**

---

## Agent A — Legacy parity & CMS editability (51)

### A.1 Legacy page parity (11) — source: findings-agent-a §2

| ID | Old page → what was dropped | Task | Status |
|---|---|---|---|
| A-LEG-01 | `/` — 4 overview stats, 4 impact metrics, "12 bridges/7 flyovers/27 underpasses", callout + virtual-tour CTA, footer address/email/phone, newsletter form, Privacy/Terms/Sitemap links | W2.1, 0.10, 2.8 | [ ] |
| A-LEG-02 | `/project` — 6-category progress breakdown, 5 achievements, 5-entry timeline, 8 spec tiles, entire semi-rigid pavement section, Vision & Mission | W2.2 | [ ] |
| A-LEG-03 | `/project/overview` — 8 objectives, 9-item tech-spec grid, project sub-nav, Project Documents list, "Need More Information?" CTA | W2.3 | [ ] |
| A-LEG-04 | `/routes-facilities` — full-distance toll column ৳200–৳1600, calculation formulas, 5 key-location narratives, Expressway Facilities section, "Partial Opening Success" panel, vehicle-type toll selector, route diagram | W2.4, W4.1 | [ ] |
| A-LEG-05 | `/stakeholders` — 6 partner outbound links, 4-tab UI, 3 header stats, ৳224cr→৳674cr VGF revision, ৳1,614cr CDB loan, ৳1,075cr BIFFL loan, ৳42.5cr first instalment, Governance Structure panel | W2.5, W3.6 | [ ] |
| A-LEG-06 | `/chinese-contribution` — 6 contribution cards, $412M/60%/1000+ counters, pavement case study, Belt & Road section, Knowledge Transfer (50+ engineers), 3 CSR cards, 5 images | W2.6 | [ ] |
| A-LEG-07 | `/economic-impact` — **everything**; content is seeded and editable but the route 308s away | W2.7, W5.11 | [ ] |
| A-LEG-08 | `/latest-updates` — embedded 36-photo grid, newsletter subscribe form | W2.8, W2.9 | [ ] |
| A-LEG-09 | `/gallery` — **32 of 36 photos**, "Load More" pagination | W2.9, 0.8 | [ ] |
| A-LEG-10 | `/contact` — phone number dropped as placeholder; address/email hardcoded not seeded | W2.10, W1.20 | [ ] |
| A-LEG-11 | `/404` — renders unstyled, English, no chrome on `/bn` and `/zh` | W1.19 | [ ] |

### A.2 Orphaned media & redirects (3) — §3

| ID | Finding | Task | Status |
|---|---|---|---|
| A-MED-1 | 13 legacy images in neither AUDITED nor REJECTED: `/photo/4`, `/photo/26`–`36`, `/DSC02396`, `/translate.png` | W2.9 | [ ] |
| A-MED-2 | 24 of 28 registered `media` rows have `in_gallery=0`; gallery empty without manual SQL import | 0.8 | [ ] |
| A-MED-3 | `redirects` table has zero seeded rows; `/project/route`, `/project/impact`, `/project/timeline` 404 | 0.12 | [ ] |

### A.3 Hardcoded content hit list (15) — §5

| ID | Finding | Task | Status |
|---|---|---|---|
| A-HC-5.1 | `lib/i18n/ui.js` — 152 keys × 3 locales = 456 strings, none admin-editable; file's own comment is false | W1.6 | [ ] |
| A-HC-5.2 | `lib/i18n/map-ui.js` — 29 keys × 3 locales = 87 strings; entire map control panel + legend | W1.6, W1.21 | [ ] |
| A-HC-5.3 | `SiteHeaderV2.jsx` — NAV array, `DB` monogram, `DBEDC` name, tagline, untranslated aria-labels, unremovable Contact CTA | W1.10, W1.11 | [ ] |
| A-HC-5.4 | `SiteFooterV2.jsx` — GROUPS (4 cols/15 links), legal name literal, copyright, **no Privacy/Terms/Sitemap** | W1.10, 0.10 | [ ] |
| A-HC-5.5 | `app/[locale]/page.jsx` — hero force-hoisting makes editor order a lie; corridor section is unmovable JSX; CTA targets hardcoded; untranslated empty state | W1.5 | [ ] |
| A-HC-5.6 | Six travel pages — every H1, lede, caption, column header in code; `status` has no block region at all; `TravelSubnav` not menu-driven; `/travel` redirect target fixed | W1.8, W1.11 | [ ] |
| A-HC-5.7 | Gallery page — copy in code, no lightbox/pagination/albums, hard 200-photo ceiling | W1.9, W2.9 | [ ] |
| A-HC-5.8 | Contact page — address/email hardcoded English-only fallbacks, all 12 form labels in code, field set fixed | W1.20, W1.9 | [ ] |
| A-HC-5.9 | News — eyebrow/H1/lede/empty state in code, no category filter, no pagination, 24-item cap | W1.9 | [ ] |
| A-HC-5.10 | SEO — site title, description, favicon, JSON-LD logo path *and dimensions*, org name, `STATIC_LOCALISED_PATHS`, robots; **no per-page SEO on any code route** | W1.7 | [ ] |
| A-HC-5.11 | Media — no Add button, **no alt input anywhere**, no width/height probe, Replace wipes alt+focal, no delete, focal_x/y unused | 0.9, W1.18 | [ ] |
| A-HC-5.12 | `app/design-tokens.css` — 75 tokens, all code; no colour, type, breakpoint or status colour is admin-editable | W1.16 | [ ] |
| A-HC-5.13 | Corridor/map data — 100 KB `map-context.json`, `public/maps/*`, label geometry and zoom regex all code | W1.21 | [ ] |
| A-HC-5.14 | `app/not-found.jsx` reads the dead `content` table; legacy Tailwind; no chrome | W1.19 | [ ] |
| A-HC-5.15 | Roles in code, **no `/admin/users` screen**; adding an editor needs SSH or SQL | W1.17 | [ ] |

### A.4 Ranked gap list (22) — §8

| ID | Finding | Task | Status |
|---|---|---|---|
| A-P0-1 | `/travel/rules` has no `pages` row; linked from subnav + homepage CTA + safety hero; renders empty | 0.7 | [ ] |
| A-P0-2 | Gallery empty without manual `03-content-recovery.sql` import | 0.8 | [ ] |
| A-P0-3 | Alt text unwritable; `lib/media.js:99` inserts `{}`; Replace wipes it | 0.9 | [ ] |
| A-P0-4 | No privacy policy, with GA4 + consent banner live | 0.10 | [ ] |
| A-P0-5 | Half the admin edits a retired site; dashboard makes a false claim | 0.11 | [ ] |
| A-P1-6 | Block editor has no image picker — paths typed from memory | W1.1 | [ ] |
| A-P1-7 | List fields = raw JSON textarea; richtext = raw HTML textarea | W1.2, W1.3 | [ ] |
| A-P1-8 | Reordering is ↑/↓ buttons, one page reload per swap | W1.4 | [ ] |
| A-P1-9 | Homepage corridor section unmovable; hero force-hoisted | W1.5 | [ ] |
| A-P1-10 | 543 UI strings code-only; `/admin/translations` read-only and not in nav | W1.6 | [ ] |
| A-P1-11 | No per-page SEO for any code route | W1.7 | [ ] |
| A-P1-12 | 13 legacy images unclassified | W2.9 | [ ] |
| A-P1-13 | `/project/route`, `/project/impact`, `/project/timeline` 404 | 0.12 | [ ] |
| A-P2-14 | Header/footer branding literal; logo never rendered in live header | W1.10 | [ ] |
| A-P2-15 | Menus all-or-nothing; footer headings must pre-exist; numeric position | W1.11 | [ ] |
| A-P2-16 | `TravelSubnav` not menu-driven (`lib/menus/slugs.js` knows only main/footer) | W1.11 | [ ] |
| A-P2-17 | No user management screen | W1.17 | [ ] |
| A-P2-18 | `revisions` table never written — no undo, no history | W1.13 | [ ] |
| A-P2-19 | No colour/typography control | W1.16 | [ ] |
| A-P2-20 | Contact address/email hardcoded English-only fallbacks | W1.20 | [ ] |
| A-P2-21 | `isrFlushToDisk:false` + multi-process Passenger serves stale after save | W6.18 | [ ] |
| A-P2-22 | Doc drift in `lib/seo/routes.js`, `next.config.mjs:39`, legacy-content-audit, `db/sql/README.md` | 0.14 | [ ] |

---

## Agent B — Peer benchmark (74)

### B.1 Corporate & governance (14) — §4A

| ID | Missing | Task | Status |
|---|---|---|---|
| B-A1 | Company page — legal name, incorporation, registered office, RJSC no., SPV role | W3.1 | [ ] |
| B-A2 | Shareholding structure — SRBG 70 / Shamim + UDC 30, sponsor profiles | W3.2 | [ ] |
| B-A3 | Board of Directors & senior management — names, photos, bios | W3.3 | [ ] |
| B-A4 | Organogram — ConcessionCo / O&M / EPC / lender / RHD | W3.4 | [ ] |
| B-A5 | Concession agreement summary — DBFOM, 6 Dec 2018, 25 yr, RHD, handback, toll-revision mechanism | W3.5 | [ ] |
| B-A6 | Project financing — USD 358.83m, BIFFL ৳1,075cr, ADB USD 50m | W3.6 | [ ] |
| B-A7 | Annual report + audited financial statements | W3.7 | [ ] |
| B-A8 | Traffic & revenue statistics — AADT, monthly by class, YoY | W3.8 | [ ] |
| B-A9 | Policy library — privacy, cookie, anti-bribery, HSE, whistleblower, code of conduct, data protection | 0.10, W3.9 | [ ] |
| B-A10 | ISO certifications — 9001/14001/45001/**39001** | W3.10 | [ ] |
| B-A11 | CSR / sustainability / ESG | W3.11 | [ ] |
| B-A12 | Careers / jobs | W3.12 | [ ] |
| B-A13 | Procurement/tenders + supplier registration + vendor code | W3.13 | [ ] |
| B-A14 | Awards & recognitions | W3.14 | [ ] |

### B.2 Transparency & statutory disclosure (10) — §4B

| ID | Missing | Task | Status |
|---|---|---|---|
| B-B1 | RTI / তথ্য অধিকার page — Information Officer, Appeal Authority, forms, proactive-disclosure index, timelines | W3.15 | [ ] |
| B-B2 | Citizen Charter / সেবা প্রদান প্রতিশ্রুতি | W3.16 | [ ] |
| B-B3 | GRS — online form, tracking number, SLA, named ONIC + Appeal officer, published stats | W3.17 | [ ] |
| B-B4 | Toll-violation / overcharge dispute & appeal | W3.18 | [ ] |
| B-B5 | ESIA / EIA + ESMP | W3.19 | [ ] |
| B-B6 | Land acquisition & resettlement (RAP), entitlement matrix, claimant grievance path | W3.20 | [ ] |
| B-B7 | Public consultation & notices | W3.21 | [ ] |
| B-B8 | Statistics dashboard — traffic, accidents, response times, revenue, uptime | W3.8 | [ ] |
| B-B9 | National Integrity Strategy (শুদ্ধাচার) corner | W3.22 | [ ] |
| B-B10 | Accessibility statement | 0.10, W5.17 | [ ] |

### B.3 Road-user services (15) — §4C

| ID | Missing | Task | Status |
|---|---|---|---|
| B-C1 | **O–D toll calculator** — highest value-to-effort item on the list | W4.1 | [ ] |
| B-C2 | Vehicle classification guide with diagrams and edge cases | W4.2 | [ ] |
| B-C3 | Payment methods page — cash/card/bKash/Nagad/Rocket/ETC/pass/fleet | W4.3 | [ ] |
| B-C4 | ETC/RFID account signup & self-service | W4.4 | [ ] |
| B-C5 | Emergency & assistance directory — helpline, patrol, ambulance, fire, tow, police | 0.13 | [ ] |
| B-C6 | Breakdown / incident assistance request | W4.6 | [ ] |
| B-C7 | Live CCTV / camera snapshots | W4.7 | [ ] |
| B-C8 | Planned roadworks & closures calendar | W4.8 | [ ] |
| B-C9 | Rest-area directory with amenity filters + map pins | W4.9 | [ ] |
| B-C10 | Truck & freight — axle load, weighbridges, permits, prohibited vehicles, freight tolling | W4.10 | [ ] |
| B-C11 | Weather / flood advisory integration | W4.11 | [ ] |
| B-C12 | Lost & found | W4.12 | [ ] |
| B-C13 | Mobile app / WhatsApp / SMS alerts / chatbot | W4.13 | [ ] |
| B-C14 | Loyalty / commuter scheme | W4.14 | [ ] |
| B-C15 | Business / fleet customer portal | W4.15 | [ ] |

### B.4 Content, media & downloads (11) — §4D

| ID | Missing | Task | Status |
|---|---|---|---|
| B-D1 | Downloads centre — brochure EN/BN, printable map, toll-rate card, forms, policies | W5.1 | [ ] |
| B-D2 | Media kit & press centre — contact, boilerplate, fact sheet, hi-res, logo usage | W5.2 | [ ] |
| B-D3 | Video gallery + drone footage | W5.3 | [ ] |
| B-D4 | Before/after + construction milestones + % complete | W5.4 | [ ] |
| B-D5 | FAQ | W5.5 | [ ] |
| B-D6 | Structures register — bridges, flyovers, underpasses, culverts, U-loops with chainage | W5.6 | [ ] |
| B-D7 | Design standards & technical specifications | W5.7 | [ ] |
| B-D8 | Road-safety campaign / education programme | W5.8 | [ ] |
| B-D9 | Press releases as a distinct dated archive | W5.9 | [ ] |
| B-D10 | Virtual tour / 360° drive-through | W5.10 | [ ] |
| B-D11 | Economic-impact evidence — real figures, not claims | W5.11 | [ ] |

### B.5 Contact, plumbing & UX (8) — §4E

| ID | Missing | Task | Status |
|---|---|---|---|
| B-E1 | Departmental contact directory with names/phones/emails | W5.12 | [ ] |
| B-E2 | Office locations map — HQ, plazas, control centre, patrol bases | W5.13 | [ ] |
| B-E3 | Site search | W5.14 | [ ] |
| B-E4 | HTML sitemap page | W5.15 | [ ] |
| B-E5 | Social channels + on-site feed + push advisory channel | W5.16 | [ ] |
| B-E6 | WCAG 2.1 AA conformance work | W5.17 | [ ] |
| B-E7 | Bangla parity audit — corporate/disclosure layer must be Bangla-first | W3.25 | [ ] |
| B-E8 | Print/share on toll tables and advisories | W5.18 | [ ] |

### B.6 Bangladesh statutory obligations (8) — §5

| ID | Obligation | Task | Status |
|---|---|---|---|
| B-ST-1 | RTI Act 2009 scope likely covers DBEDC (foreign/state funding + public function under govt contract) | W3.15 + legal gate | [ ] |
| B-ST-2 | Proactive disclosure duty §§5–6 | W3.15 | [ ] |
| B-ST-3 | Citizen Charter + GRS as RHD's concessionaire | W3.16, W3.17 | [ ] |
| B-ST-4 | Toll rates are gazette-set — cite SRO number/date, link PDF, state revision mechanism | W3.23 | [ ] |
| B-ST-5 | PPP Act 2015 / PPPA monitors compliance; align with and link the PPPA Dataroom | W3.24 | [ ] |
| B-ST-6 | Bangla authoritative for statutory/legal notices | W3.25 | [ ] |
| B-ST-7 | WCAG 2.1 via ICTD Inclusive Accessibility Guideline 2022 | W5.17, 0.10 | [ ] |
| B-ST-8 | ADB/DFI safeguard documentation (IEE/EIA, RAP, grievance mechanism) should be published | W3.19, W3.20 | [ ] |

### B.7 Method caveats to honour (3)

| ID | Caveat | Task | Status |
|---|---|---|---|
| B-MC-1 | Agent could not fetch dhakabypass.com (403) — every Y/N/P in the feature matrix must be re-verified against the live site before external use | W3.0 (pre-flight) | [ ] |
| B-MC-2 | 9 peer sites blocked automated fetch; their rows are narrower and search-derived | — (accepted) | [~] Accepted: benchmark breadth is sufficient for gap-finding |
| B-MC-3 | §5 statutory claims need counsel before any compliance assertion is published | Legal gate on W3.15–W3.25 | [ ] |

---

## Agent C — Technical debt (71)

### C.1 Debt register (24) — §2

| ID | Finding | Sev | Task | Status |
|---|---|---|---|---|
| C-D1 | **Redirects, `03-content-recovery.sql`, `apply-content-recovery.mjs` all uncommitted** — repo cannot ship its own behaviour | Critical | 0.1 | [ ] |
| C-D2 | `app/(site)/**` — 5,225 lines unreachable | High | W6.1 | [ ] |
| C-D3 | Second content model: `content` table + legacy admin, still in nav | High | 0.11, W6.2 | [ ] |
| C-D4 | Third content model: `content/*.json`, `.extract/`, `old_dhakabypass/` tracked (13 MB) | Medium | W6.16, W6.14, W6.15 | [ ] |
| C-D5 | `next@15.2.3` + `@auth/core` + `mysql2` + `nanoid` — 7 vulns, 3 critical | Critical | 0.2 | [ ] |
| C-D6 | No CI on push or PR — `workflow_dispatch` only | High | 0.5 | [ ] |
| C-D7 | **Zero error boundaries** in `app/` | High | 0.3 | [ ] |
| C-D8 | Three `console.error` calls total; no logger, no reporting | High | W6.8 | [ ] |
| C-D9 | No migration tool; `ALTER`s hand-pasted into phpMyAdmin | High | W6.6 | [ ] |
| C-D10 | Runbook step 7 expects 200 on legacy URLs; they 308 | High | 0.14 | [ ] |
| C-D11 | `corridor-geography.geojson` 13.7 MB tracked and publicly downloadable | High | 0.15 | [ ] |
| C-D12 | `sharp` used by the map pipeline but absent from `package.json` | Medium | W6.12 | [ ] |
| C-D13 | No ESLint/Prettier/tsconfig/jsconfig/lint script — 22,281 lines unanalysed | Medium | W6.7 | [ ] |
| C-D14 | Deploy branch tracks 2,471 files incl. 1,973 `node_modules/` | Medium | W6.11 | [ ] |
| C-D15 | `upload/route.js:29` missing `manage_media` check | Medium | 0.4 | [ ] |
| C-D16 | No rate limiting on any public write path | Medium | 0.6 | [ ] |
| C-D17 | Legacy contact action returns `{ok:true}` on DB failure | Medium | 0.6 | [ ] |
| C-D18 | 404 reads dead `content` table; degrades to blank on outage | Medium | W1.19, W6.2 | [ ] |
| C-D19 | `lib/content/pages.js` fetches all locales, discards ⅔ in JS | Medium | W6.17 | [ ] |
| C-D20 | `npm test` mixes unit + DB; 9 files fail on a clean checkout | Medium | 0.16 | [ ] |
| C-D21 | 7 uncalled scripts, 731 lines, two of which rewrite the app tree | Low | W6.10 | [ ] |
| C-D22 | `admin_users`, `audit_log`, `revisions` — zero references, defended by tests + CI | Low | W6.10, W1.13 | [ ] |
| C-D23 | `verify-release-sql.mjs` hardcodes `tables.length!==28`; no drop before verify | Low | W6.13 | [ ] |
| C-D24 | `admin-dash.png`, `var/shots.mjs` tracked; `.extract/` not ignored | Low | W6.14 | [ ] |

### C.2 Security findings (8) — §3

| ID | Finding | Exploitable? | Task | Status |
|---|---|---|---|---|
| C-S1 | `next@15.2.3` RCE in React flight protocol + Server Actions source exposure + rewrite smuggling + middleware SSRF; flight endpoint reachable unauthenticated at `/en/contact` | Treat as yes | 0.2 | [ ] |
| C-S2 | `@auth/core` OAuth state/PKCE not provider-bound; `getToken()` 500 on malformed Bearer | Yes if Google OAuth on; mitigated by allowlist | 0.2 | [ ] |
| C-S3 | Translator can upload files and publish gallery rows via `upload/route.js` | Yes, authenticated | 0.4 | [ ] |
| C-S4 | No rate limiting; `message` is unbounded `longtext` — megabytes per request | Yes, trivially | 0.6 | [ ] |
| C-S5 | Report-only CSP justified by a fiction; `unsafe-inline` justified by a self-imposed rule | Removes a defence | W6.4 | [ ] |
| C-S6 | Upload/file-serving path — **clean**, no action | n/a | — | [~] No action: verified correct |
| C-S7 | Authorization coverage — **complete**; `middleware.js:7-9` names the wrong guard file | n/a | 0.14 (comment fix) | [ ] |
| C-S8 | Secrets — **clean**, no action | n/a | — | [~] No action: verified correct |

### C.3 Deletion list (15) — §4

| ID | Target | Blocked by | Task | Status |
|---|---|---|---|---|
| C-DEL-1 | `app/(site)/` — 5,225 lines | C-D1 must be committed | W6.1 | [ ] |
| C-DEL-2 | 7 legacy components — 737 lines | with DEL-1 | W6.1 | [ ] |
| C-DEL-3 | 4 legacy admin routes — 154 lines | nav entry removal | W6.1 | [ ] |
| C-DEL-4 | 3 legacy admin components — 347 lines (**keep** `FieldInput`, `NewsForm`) | DEL-3 | W6.1 | [ ] |
| C-DEL-5 | `lib/content.js`, `lib/admin-sections.js` — 112 lines | not-found port, dashboard counters, `saveSectionAction` | W6.2 | [ ] |
| C-DEL-6 | `lib/gallery.js` — 22 lines | DEL-3 | W6.1 | [ ] |
| C-DEL-7 | `lib/news.js` — 46 lines | 4 live admin call sites must move to `newsroom/repo.js` | W6.3 | [ ] |
| C-DEL-8 | 7 uncalled scripts — 731 lines | `build-corridor-context.mjs` is the sole map-asset producer | W6.10, W6.12 | [ ] |
| C-DEL-9 | `content/` 12 JSON files, 269 KB | CI `db:seed` reads `content/seed.json` | W6.16 | [ ] |
| C-DEL-10 | `.extract/` 14 files, 1.7 MB | nothing | W6.14 | [ ] |
| C-DEL-11 | `old_dhakabypass/` 111 files, 11 MB | **named as the site rollback target in the runbook** | W6.15 | [ ] |
| C-DEL-12 | `admin-dash.png`, `var/shots.mjs` | nothing | W6.14 | [ ] |
| C-DEL-13 | Tables `admin_users`, `audit_log`, `revisions` | schema test + CI count + `migrate-users.mjs` | W6.10 | [ ] |
| C-DEL-14 | Tables `content`, `gallery_images` | DEL-3/5/6 + upload route's gallery branch | W6.10 | [ ] |
| C-DEL-15 | `corridor-geography.geojson` 13.7 MB | download affordance at `view.js:110` | 0.15 | [ ] |

### C.4 Test-coverage gaps (6) — §5

| ID | Gap | Task | Status |
|---|---|---|---|
| C-T1 | No e2e touches `/admin` — 942 lines + 21 server actions, zero integration coverage | W6.9 | [ ] |
| C-T2 | `auth.js` signIn/jwt/session callbacks and bcrypt path untested | W6.19 | [ ] |
| C-T3 | Neither upload endpoint has a test — this is how C-S3 survived | 0.4, W6.19 | [ ] |
| C-T4 | Contact submission, honeypot, and `unavailable` degradation untested | W6.19 | [ ] |
| C-T5 | Toll/corridor pricing: 14 tests total for a page publishing what a truck costs | W6.19 | [ ] |
| C-T6 | No test that a `bn` page with a missing translation renders the English block | W6.19 | [ ] |

### C.5 Deploy & migration risks (7) — §6

| ID | Risk | Task | Status |
|---|---|---|---|
| C-R1 | `npm run db:sql` skipped → committed SQL drifts from the migration chain; nothing in CI checks | W6.6 | [ ] |
| C-R2 | **phpMyAdmin import — the single most dangerous step**; no migration runner, no applied-version table | W6.6 | [ ] |
| C-R3 | Schema upgrades applied by hand-copying `ALTER`s out of `.mjs` files | W6.6 | [ ] |
| C-R4 | `03-content-recovery.sql` untracked — absent on a fresh install from `main` | 0.1 | [ ] |
| C-R5 | Linux-only build ⇒ CI is the only production path, and CI is manual-dispatch-only | 0.5 | [ ] |
| C-R6 | `preflight.mjs` not enforced before restart | W6.6 | [ ] |
| C-R7 | CI bakes `unstable_cache` entries warmed against the CI seed DB into `.next/cache` (documented prior incident) | W6.18 | [ ] |

### C.6 Remediation items mapped (20) — §7

| ID | Item | Task | Status |
|---|---|---|---|
| C-P0.1 | Commit the working tree | 0.1 | [ ] |
| C-P0.2 | Upgrade next + next-auth | 0.2 | [ ] |
| C-P0.3 | Error boundaries | 0.3 | [ ] |
| C-P0.4 | Upload role check | 0.4 | [ ] |
| C-P0.5 | CI on push/PR | 0.5 | [ ] |
| C-P0.6 | Fix runbook step 7 | 0.14 | [ ] |
| C-P1.1 | Delete legacy tree | W6.1 | [ ] |
| C-P1.2 | Port not-found + dashboard off `lib/content.js` | W6.2 | [ ] |
| C-P1.3 | Port news admin off `lib/news.js` | W6.3 | [ ] |
| C-P1.4 | CSP enforcing on `/:path*` | W6.4 | [ ] |
| C-P1.5 | Simplify `DocumentLang` via route-group root layout | W6.5 | [ ] |
| C-P1.6 | Split test scripts | 0.16 | [ ] |
| C-P1.7 | Rate limiting + fix `{ok:true}` | 0.6 | [ ] |
| C-P1.8 | Move the 13.7 MB geojson off the app server | 0.15 | [ ] |
| C-P2.1 | Real migration tool + `schema_migrations` + preflight version gate | W6.6 | [ ] |
| C-P2.2 | ESLint + Prettier + CI lint gate | W6.7 | [ ] |
| C-P2.3 | Structured logger wired into boundaries and `friendly()` | W6.8 | [ ] |
| C-P2.4 | Admin e2e coverage | W6.9 | [ ] |
| C-P2.5 | Drop dead tables and scripts | W6.10 | [ ] |
| C-P2.6 | Reduce the deploy branch | W6.11 | [ ] |

---

## Cross-agent collisions — findings all three or two agents reached independently

These carry extra weight; they are not one auditor's opinion.

| Theme | Agent A | Agent B | Agent C | Task |
|---|---|---|---|---|
| **The legacy tree is dead and the repo won't admit it** | A-P0-5 (admin edits it) | — | C-D2, C-D3, C-S5 (CSP justified by it) | 0.1, 0.11, W6.1 |
| **Privacy policy missing while GA4 + consent banner run** | A-P0-4 | B-A9, B-B10, B-P0-6 | — | 0.10 |
| **`/economic-impact` — written, seeded, editable, unreachable** | A-LEG-07 | B-D11 (needs figures) | C-D2 | W2.7, W5.11 |
| **Alt text / accessibility** | A-P0-3, A-HC-5.11 | B-B10, B-E6, B-ST-7 | — | 0.9, W5.17 |
| **Cannot author the new pages the benchmark demands** | A-P1-6/7/8, 11 of 20 routes editable | B needs ~40 new pages | — | **W1 before W3** |
| **Doc/comment drift asserting false things** | A-P2-22 | — | C-D10, C-S5, C-S7 | 0.14 |
| **Toll data published without provenance or tooling** | A-LEG-04 (formulas dropped) | B-C1, B-ST-4 | C-T5 (thin tests) | W3.23, W4.1 |

---

## Operator-raised items (added 2026-09-06, outside the three agent audits)

| ID | Item | Task | Status |
|---|---|---|---|
| OP-1 | Header plate is neutral near-black `#0B1620` with a generic amber accent `#FFB000`; neither appears in the DBEDC logo (`#1172BA` / `#EF8221`) | 0.17 | [ ] |
| OP-2 | Header renders a `DB` **text monogram**, not the logo — `SiteHeaderV2.jsx:63` | 0.17, W1.10 | [ ] |
| OP-3 | No vector mark existed for DBEDC; only a 215×204 raster | Done — `public/brand/dbedc-mark.svg` (redraw, pending brand-file check) | [>] |
| OP-4 | No vector marks for RHD, SRBG/SDIG, UDC | Request official SVG/EPS from each org; do **not** redraw | [ ] |
| OP-5 | No site search, no breadcrumbs — becomes mandatory once W3/W5 add ~40 pages | W5.14, W5.15 | [ ] |
| OP-6 | Gallery has no lightbox, no pagination, hard 200-image ceiling | W2.9, W1.9 | [ ] |
| OP-7 | Contact CTA sits outside the menu system (`SiteHeaderV2.jsx:78`) — cannot be relabelled or removed | W1.11 | [ ] |
| OP-8 | No persistent emergency affordance on a toll expressway site | 0.13 | [ ] |

## UI & design review (added 2026-09-06) — public + admin

| ID | Finding | Task | Status |
|---|---|---|---|
| UI-1 | **Credit where due:** the public design system is disciplined — 1,050 lines, 75 tokens, measured contrast ratios recorded in comments, `--db-tap:44px` targets, `--db-measure:68ch`, fluid `clamp()` scale, full dark palette, `tabular-nums` on figures. Above average. Do not rebuild it. | — | [~] No action |
| UI-2 | **Typography is subject-grounded, not default.** Barlow Semi Condensed (display) derives from highway-signage vernacular — genuinely apt for an expressway operator. Archivo body, Hind Siliguri Bengali. Keep. | — | [~] No action |
| UI-3 | **`/zh` has no font.** `public/fonts/` ships latin + bengali only; `--db-font-zh` (`design-tokens.css:74`) is 100% system fallback (PingFang SC / Hiragino / YaHei / Noto SC). On Android or Linux without a CJK font → **tofu**. No zh preload in `FontPreload.jsx`. Worse, `.db-root:lang(zh)` (`:154`) only fires if `lang="zh"` is set — which the JS `DocumentLang` hack does, so with JS off the rule may never apply. Chinese is a second-class citizen in the type system while the site claims trilingual support. | W1.28, W6.5 | [ ] |
| UI-4 | **Brand voice evaporates on `/zh`.** Barlow and Archivo have no CJK coverage, so Chinese headings silently fall back to a system sans. The signage character that defines the brand exists only in English and Bengali. | W1.28 | [ ] |
| UI-5 | **`.db-h1{text-transform:uppercase}`** (`:437`) is linguistically incoherent for two of three locales — Bengali and Chinese have no case. A latin-centric decision baked into the type system. | W1.28 | [ ] |
| UI-6 | `--db-eyebrow` + uppercase H1 is the classic template-chrome pairing. Reads as generic, and compounds UI-5. | W1.15 | [ ] |
| UI-7 | **No Bangladeshi or Chinese visual identity anywhere** — the look is neutral international transport-operator. Correct for the *driver-facing* layer (signage clarity beats ornament), but the corporate/governance layer has no visual system for expressing the RHD + SDIG/SRBG + UDC + DBEDC structure. Decide consciously rather than by default. | W3.4, W1.22 | [ ] |
| UI-8 | **Partner marks must sit on light surfaces only.** Verified by render: SDIG/SRBG carries a hard white panel that floats as a card on dark, and DBEDC blue on `#06263D` is 3.06:1 and nearly vanishes. | W1.26, W1.27 | [ ] |
| UI-9 | **Ten block types W3–W5 require do not exist.** Registry has 9: hero, media-prose, figure-grid, card-grid, cta-band, partner-row, toll-preview, rich-text, stat-row. Missing: person card, document list, FAQ, data table, timeline, tabs, contact directory, map-pin list, stat dashboard, logo row. | W1.22 | [ ] |
| UI-10 | **Admin and public are two unrelated design languages.** `grep -rl "db-" app/admin components/admin` finds no styling use of the design system. Admin is raw Tailwind defaults (`bg-blue-900`, `container mx-auto`, `border rounded px-3 py-2`). Bespoke front-of-house, bootstrap-grade back-of-house. | W1.29 (new) | [ ] |
| UI-11 | **Admin doesn't match the brand it manages** — `bg-blue-900` is Tailwind's default blue, not DBEDC `#1172BA`. And admin has no dark mode while the public site ships a full dark palette. | W1.29 | [ ] |
| UI-12 | **Admin nav naming is confusing and the code admits it.** "Content" vs "Pages" vs "Legacy" — `(dash)/layout.jsx:8-12` carries a comment explaining the workaround. Names things by how the system is built, not by what the operator understands. | 0.11, W1.29 | [ ] |

## Client requirement, restated 2026-09-06: block editor only, full CMS

| ID | Requirement | Task | Status |
|---|---|---|---|
| REQ-1 | Every public route is a `pages` row, not a React page file | W1.8a | [ ] |
| REQ-2 | Per-route page files deleted; `[...slug]/page.jsx` is the only public renderer. **If a page file still exists, that page is still hardcoded.** | W1.8b | [ ] |
| REQ-3 | Twelve functional widgets become placeable, configurable, previewable blocks | W1.30 | [ ] |
| REQ-4 | Route behaviour (landing targets, item caps) moves to page settings | W1.31 | [ ] |
| REQ-5 | Preview renders the real block document at real breakpoints, all three locales, including drafts | W1.25 | [>] agent running |
| REQ-6 | Three declared exceptions only: `/news/[slug]` template, `app/layout.jsx` root shell, the admin panel. A fourth is escalated and written down, never absorbed silently. | — | [~] Accepted, documented |

**Superseded:** the original W1.8 ("block regions on travel pages") and W1.9 ("page copy into the CMS") were too weak — they left page skeletons hardcoded. Folded into W1.8a/b + W1.30.

**Contrast measurements recorded for OP-1** (so nobody re-litigates this): `#EF8221` on `#1172BA` = 2.64:1 (fails 4.5:1 text and 3:1 UI) · `#EDF2F5` on `#1172BA` = 4.50:1 (no headroom) · white on `#1172BA` = 5.07:1 · `#FFB000` on `#0B1620` = 9.97:1 (today) · **`#EDF2F5` on `#06263D` = 13.76:1** · **`#EF8221` on `#06263D` = 5.83:1** (chosen).

---

## Phase gates

No phase closes until every row assigned to it is `[x]` or `[~]` with a reason.

- [ ] **Phase 0 gate** — 0.1–0.16 complete. Re-read all three findings files. Confirm no Critical or High severity row remains open.
- [ ] **W1 gate** — the CMS can author a new multi-block, trilingual page with images, lists, rich text and per-page SEO, with no developer involvement. Demonstrated by building one W3 page end-to-end from the admin UI only.
- [ ] **W2 gate** — every `[ ]` row in A.1 and A.2 closed; a diff of `old_dhakabypass/*/index.txt` against the live pages shows no unexplained content loss.
- [ ] **W3 gate** — legal sign-off recorded for every statutory page; B-MC-1 re-verification done against the live site.
- [ ] **W4 gate** — toll calculator output reconciled against the gazette rate table by a second person.
- [ ] **W5 gate** — WCAG 2.1 AA audit run on the map, toll tables and traffic status; accessibility statement updated to match reality.
- [ ] **W6 gate** — `npm test` green, CI green on push, `npm audit --omit=dev` clean, no `[ ]` rows left in C.1–C.6.
