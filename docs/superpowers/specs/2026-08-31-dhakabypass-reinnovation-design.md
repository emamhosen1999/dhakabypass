# Dhaka Bypass Expressway — Reinnovation — Design

> **Note on the deploy contract, added 2026-09-04.** Where this document says the
> build artifacts are committed and the server does `git pull` only, the shape was
> right but the detail was not: `.next/` was gitignored and `output: 'standalone'`
> leaves `public/` and `.next/static` outside the standalone directory, so there
> was never a complete artifact to commit. That is now fixed, and the deploy is
> described in full — including what supersedes the sentences below — in
> **`docs/deployment/2026-09-04-deploy-runbook.md`**, which is the single source of
> truth. Read it before acting on any deployment statement in this file.

**Date:** 2026-08-31
**Status:** Approved (design), pending spec review
**Supersedes:** `2026-07-13-dhakabypass-dynamic-rebuild-design.md` (the dynamic rebuild whose
goal was visual fidelity to the old site — that goal is now explicitly abandoned)
**Visual proposal:** https://claude.ai/code/artifact/e30ca2af-dc32-4c5c-bc47-62020d0bd842

---

## 1. Why this exists

The July 2026 rebuild did what it was asked to do: reproduce the old site faithfully and make
it dynamic. It succeeded. The problem is what it was asked to reproduce.

Two things have changed, and they invalidate the old site's entire premise:

1. **The road opened.** An 18 km section began carrying traffic on 24 August 2025. Toll
   collection is active. Works reached 73.5% by end of April 2026; full completion is
   targeted for December 2026.
2. **The site still speaks in the future tense.** It is a construction brochure — financing,
   equity stakes, partnership — for a road people are already driving on. It publishes no
   toll rate, no interchange list, no open-section status.

The reinnovation shifts the site from **a project being built** to **a road being driven**.
The institutional narrative is not weakened by this; a concession company that publishes live
toll rates, an accurate interchange schedule and honest construction status *is* the
credibility argument. Competence gets demonstrated instead of asserted.

### Defects being fixed

| # | Defect | Evidence |
|---|--------|----------|
| 1 | 2023 Tailwind template aesthetic; all 8 pages run one rhythm | `blue-900`/`orange-500`, `rounded-lg shadow-md`, `hover:scale-105`, `data-aos="fade-up"` on everything |
| 2 | CMS is find-and-replace, not content management | `content/pages/routes-facilities.json` = 188 keys named `t1`…`t188`; stakeholders = 162 |
| 3 | Factually stale about its own subject | Footer `© 2025`; no toll/interchange/status data anywhere |
| 4 | Newsroom is not a newsroom | `content/news.json` — 6 records, `body:""` on all 6 |
| 5 | Dev leftovers live in production | `site.header.translateHref` → `demodasher-com.translate.goog`; `footer.contact.phoneDisplay` → `+880 12345-6789` |
| 6 | Nav invisible 1024–1279px | Desktop nav gated behind `xl:` in `components/SiteHeader.jsx` |
| 7 | No Bangla | English only; sole i18n is machine translation to Chinese |
| 8 | No real map | `map.webp` / `route.webp` are flat images |
| 9 | Slowest possible render path | `export const dynamic = 'force-dynamic'` + `SELECT section_key, data FROM content` per request |
| 10 | Missing baseline | No sitemap, robots, OG images, structured data, analytics, a11y pass, tests, or image optimisation |

### What is kept

Next.js 15 App Router, Tailwind, `mysql2`, Auth.js with an email allowlist, the cPanel
Passenger deploy (build locally → commit artifacts → `git pull` on server), the 36
photographs, and the general shape of the existing tables. The foundation stays; the site on
top of it does not.

---

## 2. Decisions (all closed)

| Decision | Value |
|---|---|
| Primary audience | **Road users first**; institutional story follows |
| Scope | **Full reinnovation** — new IA, design, content model, on the existing stack |
| Languages | **English, Bangla, Chinese** — human-written, per-block status, English fallback, no machine translation |
| CMS depth | **Block builder** — add/remove/reorder/duplicate blocks, create pages, edit menus, preview, roll back |
| Art direction | **Corridor / wayfinding** — asphalt navy ground, signage amber accent, functional status colour |
| Themes | **Light / Dark / System**, switchable in the header, defaulting to System, choice persisted |
| Brand | **Logo fixed.** Palette, typography, iconography, motion all open |
| Hosting | **Stay on cPanel Passenger**, same deploy model, but statically cached with targeted revalidation |
| Map | **Schematic corridor strip everywhere + one real interactive map** on the route page |
| China page | **Survives in full** at `/about/china-partnership`, gains a native Chinese edition, leaves primary nav |
| Nav label | **"Travel Info"** — toll-operator convention; translates cleanly to ভ্রমণ তথ্য / 出行信息 |
| Rollout | **Password-protected, no-index staging**, then one cutover with a complete 301 map |
| Timeline | **As soon as possible** — phases sequenced so the road-user site is live before institutional pages are rewritten |
| Sign-off | **Boss alone.** No client approval gate inside the build loop |
| Analytics | **Umami, self-hosted** on the same box. Cookieless, no consent banner |
| Typefaces | **Open-source, self-hosted** — Barlow Semi Condensed, Archivo, Noto Sans Bengali, Noto Sans SC |
| Extra modules | **Complaints, tenders, careers** all as real CMS modules |
| Admin | **`admin.dhakabypass.com`** with roles. No coupling to `erp.dhakabypass.com` |
| Copy | **Claude drafts the full English site** in the operator voice; Boss reviews and corrects facts |

---

## 3. Information architecture

Primary navigation: five items plus a Contact CTA, with one level of hierarchy. Every route
is under a locale segment: `/[locale]/…` where locale ∈ `en | bn | zh`. `/` redirects to the
negotiated or default locale (`en`).

| Nav | Routes | Content |
|---|---|---|
| **Travel Info** *(new)* | `/travel/status`<br>`/travel/toll`<br>`/travel/route`<br>`/travel/facilities`<br>`/travel/rules` | What is open right now; toll rates by vehicle class and payment method; interchanges and entry/exit on an interactive map; service areas and emergency coverage; speed limits, prohibited vehicles, breakdown procedure |
| **Project** | `/project`<br>`/project/progress`<br>`/project/engineering` | Specifications and timeline; section-by-section progress; the technology story (semi-rigid pavement, reinforced retaining walls, 6 bridges, 8 overpasses, 49 culverts) relocated here from the China page, where it read as diplomacy rather than capability |
| **Impact** | `/impact/economic`<br>`/impact/community`<br>`/impact/environment` | Trade corridor and travel-time savings; employment and resettlement; environmental and road-safety performance |
| **About** | `/about`<br>`/about/partners`<br>`/about/china-partnership`<br>`/about/governance` | DBEDC and the concession structure; the consortium presented as a consortium (SRBG, SEL, UDC) alongside the public side (RHD, PPPA, BIFFL, CDB); the China partnership; leadership and compliance |
| **News** | `/news`<br>`/news/[slug]`<br>`/news/media` | Real articles with bodies and categories; the 36-photo library and a press kit as Media |
| **Contact** *(CTA)* | `/contact`<br>`/contact/complaints`<br>`/careers`<br>`/careers/[slug]`<br>`/tenders` | Offices and emergency hotline; complaints with a reference number and an operations-updatable status; job postings with applications to the admin inbox; dated tender notices with attachments and closing dates |

Utility: locale switcher (EN · বাংলা · 中文), theme switcher (Light/Dark/System), site search,
persistent emergency number in the footer.

**Retired:** the Google-Translate-to-Chinese link, `+880 12345-6789`, `© 2025`, the `t1…t188`
content model, the flat seven-item nav, `force-dynamic`.

### Homepage sequence

1. Advisory strip — severity-coded, CMS-controlled, dismissible
2. Hero — corridor schematic, headline, two actions: *Toll rates* / *Plan your trip*
3. Interactive corridor strip — click an interchange for entry/exit, connecting highway, facilities
4. Toll preview — four most-searched vehicle classes → full table
5. Live progress — completion bar, per-section status, next milestone
6. Outcome figures — minutes saved, highways linked, vehicles per day
7. Three real news cards
8. The project in brief → Project / About
9. Partners strip
10. Footer — contact, emergency, newsletter, legal, sitemap, locale, theme

---

## 4. Design system — "Corridor / Wayfinding"

The vocabulary comes from highway signage and transit maps, because that is the visual
language a driver already trusts.

### Colour

Functional before decorative. Three of these five encode operational state and are never used
as decoration.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--plate-bg` | `#0B1620` | `#162835` | Signage plate ground |
| `--accent` | `#8A5A00` | `#FFB000` | Signage amber — the single accent |
| `--open` | `#0F6B42` | `#3ECC85` | **Functional:** segment carrying traffic |
| `--build` | `#9E3E05` | `#FF8A45` | **Functional:** under construction (always hatched as well as coloured) |
| `--alert` | `#93231A` | `#FF6A55` | **Functional:** closure, fog, incident — reserved |
| `--ground` | `#E7EBEE` | `#0A141D` | Cool concrete; neutrals biased navy, not flat grey |

Signage plates deliberately hold their asphalt-and-amber values in **both** themes — a road
sign does not change with the viewer's operating system. Everything else is fully themed.

### Typography

| Role | Face | Notes |
|---|---|---|
| Display / signage plates | Barlow Semi Condensed 600/700 | Uppercase, tracked, tabular numerals |
| Body | Archivo (variable 400–700) | Reading measure ~65ch |
| Bangla | Noto Sans Bengali | Matched weight/width to the display face |
| Chinese | Noto Sans SC | Same |

All self-hosted, all open-source, subsetted, `font-display: swap`. Latin, Bengali and
Simplified Chinese share one vertical rhythm and one type scale — **switching locale must not
reflow the layout**. Tabular numerals everywhere digits align: chainage, tolls, distances,
percentages.

### Motifs and motion

The chainage ruler in page headers. Lane markings as section dividers. Signage plates for key
data. Chainage labels in the engineers' own format (`K21+900`). Status dots that breathe only
while something is live.

Motion is limited to three moments: the route line drawing once, the status dot pulsing, and
figures counting up on first view. All suppressed under `prefers-reduced-motion`. The current
blanket `data-aos="fade-up"` is removed entirely.

### Accessibility

WCAG 2.2 AA enforced during the build, not audited after.

- Status is never colour-alone: open segments are solid, construction is hatched, both carry
  text labels.
- Every interchange on the map is a keyboard-reachable control, with a table equivalent
  rendered below it.
- Correct `lang` attributes per locale so screen readers pronounce Bangla and Chinese.
- Visible focus states throughout; `prefers-reduced-motion` respected.

---

## 5. Content model

Every page is an ordered list of typed blocks. Every block carries a version per locale with
its own publication state.

### Structural tables

| Table | Holds |
|---|---|
| `pages` | `id`, `slug`, `parent_id`, `template`, `nav_order`, `status`, `published_at` |
| `page_translations` | `page_id`, `locale`, `title`, `seo_title`, `seo_description`, `og_image`, `status` |
| `blocks` | `id`, `page_id`, `type`, `sort_order`, `settings` JSON, `status` |
| `block_translations` | `block_id`, `locale`, `data` JSON, `status` ∈ `missing \| draft \| published`, `updated_by`, `updated_at` |
| `menus`, `menu_items` | Nested, locale-aware labels |
| `media` | `path`, `width`, `height`, `focal_point`, per-locale `alt`, generated variants |
| `revisions` | Full snapshots for rollback |
| `audit_log` | Who changed what, when |
| `redirects` | `source`, `destination`, `status_code` |
| `users`, `roles` | Administrator / Editor / Translator |
| `settings` | Site-wide, locale-aware |

### Domain tables

These are what make the road-user pages real. They hold data, not prose.

| Table | Columns | Powers |
|---|---|---|
| `segments` | `from_ch`, `to_ch`, `status`, `opened_on`, `label` | Corridor strip, progress tracker |
| `interchanges` | `name` (per locale), `chainage`, `lat`, `lng`, `type`, `status`, `connects_to`, `facilities` JSON | Map, route page, trip planner |
| `toll_rates` | `vehicle_class`, `section`, `amount`, `effective_from`, `payment_methods` | Toll table, homepage preview |
| `advisories` | `severity`, `message` (per locale), `starts_at`, `ends_at`, `active` | Site-wide status strip |
| `news`, `news_translations`, `news_categories` | Article bodies, per-locale, categorised | Newsroom |
| `complaints` | `ref`, `name`, `contact`, `body`, `status`, `assigned_to` | Complaints module |
| `tenders` | `title`, `notice_no`, `published_at`, `closes_at`, attachments | Tenders module |
| `jobs`, `job_applications` | Postings and applications | Careers module |

Kept from today: `contact_messages`, `newsletter_subscribers`, `gallery_images` (migrated
into `media`), `admin_users` (migrated into `users`).

### Block library — v1

**Domain blocks** (read from domain tables): `Hero`, `CorridorMap`, `TollTable`,
`InterchangeList`, `ProgressTracker`, `AdvisoryCallout`.

**Content blocks:** `StatRow`, `SplitMedia`, `RichText`, `Timeline`, `FAQ`, `GalleryGrid`,
`NewsFeed`, `PartnerLogos`, `CTABand`, `Quote`, `DownloadList`, `VideoEmbed`, `Tabs`.

Each block type is one module exposing: a Zod-style schema, a server render component, and an
admin edit form derived from the schema. Adding a block type means adding one directory — no
edits to the renderer, the admin, or the database.

### Translation workflow

Side-by-side editor per block with a status per locale. A dashboard states plainly
*"Bangla: 14 blocks missing"*. Nothing is machine-translated. Any block whose translation is
`missing` renders its English content on `/bn` and `/zh`, so a half-translated page is never a
broken page.

### Admin capabilities

Page tree with drag-reorder · block add/remove/reorder/duplicate · side-by-side live preview
before publish · menu builder · media library with per-locale alt text · revision history with
rollback · roles (Administrator / Editor / Translator) · audit log · form inboxes (contact,
complaints, applications, newsletter) · redirect manager · per-page SEO with OG image ·
domain-data editors for segments, interchanges, toll rates and advisories.

---

## 6. Technical corrections

| Today | New |
|---|---|
| `force-dynamic` + whole-table read per request | Static generation with `revalidateTag` fired by the admin on save; per-section queries only |
| Raw `<img>`, unoptimised files | `next/image`, variants generated at upload time |
| Uploads inside the repository | Persistent directory outside the repo, surviving every deploy |
| No sitemap / robots / OG / structured data | All present, per-locale, with `Organization`, `NewsArticle` and `Road` JSON-LD |
| No analytics, no tests | Self-hosted Umami + Playwright smoke tests per route per locale |
| Nav invisible 1024–1279px | Works at every width, with a grouped menu |
| Flat admin allowlist | Roles, sessions, audit trail |
| One language | Three locales under `/[locale]/`, with English fallback |

Hosting is unchanged: cPanel Passenger, Node 22, MariaDB, build locally → commit artifacts →
`git pull` on server. **No migration is required by anything in this spec.**

---

## 7. Delivery phases

Sequenced for "as soon as possible": the road-user section lands at P3 and can go live before
the institutional pages are rewritten.

| Phase | Deliverable |
|---|---|
| **P0** | Foundations — schema, locale routing, block renderer, admin shell, auth with roles, media pipeline |
| **P1** | Design system — tokens, type scale, theme switcher, corridor components, signage plates |
| **P2** | Domain data — segments, interchanges, toll rates, advisories; their admin editors; the corridor strip and interactive map components |
| **P3** | Travel Info section — status, toll, route, facilities, rules. **First useful launch candidate.** |
| **P4** | Institutional pages — project, progress, engineering, impact, about, partners, china-partnership, governance |
| **P5** | Newsroom and media — articles with bodies, categories, photo library, press kit |
| **P6** | Modules — complaints, tenders, careers; all form inboxes |
| **P7** | CMS completion — block builder UI, live preview, revisions and rollback, menu builder, redirects, SEO panel |
| **P8** | Localisation — Bangla authored, then Chinese, with fallback throughout |
| **P9** | Quality — WCAG 2.2 AA pass, performance budget, structured data, Umami, smoke tests |
| **P10** | Staging and cutover — password-protected no-index staging subdomain, then one cutover with a complete 301 map and fresh sitemaps |

**Scope note:** this spec covers the whole reinnovation and is too large for a single
implementation plan. Plans are written per phase group. The first plan covers **P0–P3** — the
foundations through the first useful launch candidate. Later phases get their own plans once
P0–P3 lands.

---

## 8. Data required from DBEDC / RHD

The build is not blocked on any of this — pages, map and admin are built against clearly
marked placeholder data. But the site is not *useful* until these arrive.

1. Official toll table — every vehicle class, every section, effective date, payment methods
2. Interchange schedule — name (EN + BN), chainage, coordinates, type, connecting highway, status
3. Segment status — which chainage ranges carry traffic, which are under construction, opening dates
4. Facilities inventory — service areas, fuel, rest stops, weigh stations, patrol/ambulance/recovery
5. Rules — speed limits by class, prohibited vehicles, lane discipline, breakdown procedure
6. Emergency hotline and real corporate contacts (the published number is a placeholder)
7. A named source who updates the completion percentage and milestone dates
8. Corridor geometry — GeoJSON or KML from the design consultant
9. Higher-resolution photography, drone footage, video, and the DBEDC mark in vector
10. A reconciled investment figure — the site says $412M; ADB records $358.83M
11. Bengali terminology — organisation and partner names, standard engineering vocabulary
12. Any existing brand guideline

Until items 1–5 arrive, the corridor strip renders illustrative data reconstructed from public
reporting, **labelled as illustrative in the UI**. `K3+900` and the 18 km Kodda→Purbachal
figure are sourced; intermediate chainages are interpolated.

---

## 9. Testing and verification

- **Unit:** block schema validation; the English-fallback resolver; toll and chainage
  formatting across all three locales.
- **Integration:** admin save → correct `revalidateTag` fired → public page reflects the change;
  role enforcement (Editor cannot manage users; Translator cannot restructure pages).
- **End-to-end (Playwright):** every route in every locale returns 200 with zero console errors;
  theme switch persists across navigation; corridor map is fully keyboard-operable; each form
  round-trips to its inbox.
- **Accessibility:** automated axe pass per route, plus manual keyboard and screen-reader
  checks on the corridor map and the toll table.
- **Performance:** budget enforced in CI — no route ships above the agreed LCP/CLS thresholds
  on a throttled 3G profile, since the road-user audience is mobile-heavy.
- **Pre-cutover:** every old URL resolves through the redirect map; sitemaps validate;
  structured data validates.

---

## 10. Out of scope

- Any change to `erp.dhakabypass.com`, and any shared sign-in with it.
- Real-time traffic, CCTV feeds, or an ETC/account-management portal. The `advisories` table
  gives a manual path to publishing incidents; automated feeds are a later project.
- A native mobile app.
- Migration off the cPanel host.
- Redesign of the DBEDC logo.
