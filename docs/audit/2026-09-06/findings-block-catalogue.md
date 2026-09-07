# Block Catalogue Audit — the definitive block-type list

> **Verbatim agent output. Do not edit findings.** Corrections go in a `> **CORRECTION:**` blockquote beneath the affected item, dated and signed.
> Captured: 2026-09-06 · Scope: derive the complete block-type catalogue from actual content requirements (W2–W5 + legacy diff + peer benchmark), so that no content need ever arrives without a block to hold it.
>
> **Orchestrator re-verification, 2026-09-06 — the three central claims are CONFIRMED:**
> - `lib/blocks/index.js` imports 9 types and its `ALL` array contains only those 9. **None of the ten new block types is registered.** `BlockRenderer`'s `getBlock()` returns `null` for them and the block silently vanishes.
> - `lib/blocks/list.js:22` — `ITEM_FIELD_TYPES = ['text','textarea','image','number']`. `lib/blocks/types/person-card.js:24` and `faq.js:14` both declare `type:'richtext'` inside `itemFields`; `registry.js:30` throws on it. Wiring either in today crashes the app at boot.
> - `tests/unit/blocks-w1-22-render.test.jsx` imports the components directly and never touches the registry — **the suite was green while the feature was entirely absent from the site.**

## Architecture decision, locked with the client 2026-09-06

**Records vs blocks — do not re-litigate this.**

- **Records** — landmarks, toll plazas, bridges, interchanges, waypoints, corridor sections, segments, toll rates, advisories, news articles, media, menus, contact messages. Edited once in their own admin screen. Typed once, shown everywhere.
- **Blocks** — placed on a page in Block Studio, configured for presentation: which layers, which sections, how many items, zoom, caption, height.

The rule an operator learns: **change the fact in its record screen, change how it looks in the page.**

Rationale: Kanchan interchange appears on the corridor map, the route page, the toll page and traffic status. If each block owned its own copy, an operator would type it four times and the copies would drift within a month. Blocks never own shared data.

**Four gaps that must close for this rule to hold without exception:**
1. `corridor_waypoints` — table exists (`db/sql/01-schema.sql:157`), **no admin screen**
2. `corridor_geometry` / `corridor_geometry_source` — tables at `:118` and `:131`, **no admin screen**
3. Toll plazas and bridges are name-matched, not typed records — `lib/corridor/map-labels.js:17` string-replaces `" Toll Plaza"` and `" Bridge"` out of feature names
4. The map's UI text is hardcoded — `lib/i18n/map-ui.js`, 29 keys × 3 locales (legend, layer names, "Section details")

Not admin-editable by design: `lib/corridor/data/map-context.json` — 103 surrounding OpenStreetMap roads, a regenerated build artifact, not DBEDC data.

---

## 1. Verdict

- **The planned "31-type" catalogue (9 shipped + 10 from W1.22 + 12 functional from W1.30) is the right order of magnitude but is not sufficient as specified.** It is missing at minimum 3 authored block types (**callout/notice**, **pull-quote**, **video/embed**) and 2 field-type primitives the registry does not support (**select/enum**, and a genuine **table** shape). Real target: **~36 block types + 2 new field primitives.**
- **The single biggest finding is not a missing block — it's that the ten "must-ship" types W1.22 claims to deliver do not exist in any usable form.** All ten components are on disk and unit-tested in isolation, but **none is imported by `lib/blocks/index.js`**, so `registerAllBlocks()` never registers them and `BlockRenderer`'s `getBlock(block.type)` silently returns `null` for every one — the block vanishes from the page with no error. Today's live, registered catalogue is still exactly the original **9** types.
- **Two of those ten cannot even be wired in as currently written.** `person-card.js` and `faq.js` declare a `richtext` sub-field inside a list's `itemFields` (`bio`, `answer`). `validateListShape` explicitly rejects any sub-type outside `['text','textarea','image','number']` — `richtext` is deliberately excluded (`lib/blocks/list.js:19-22`: *"Deliberately not richtext... a second sanitising path"*). Importing either today throws at module load and takes down every request, because `BlockRenderer.jsx:4` runs `registerAllBlocks()` on import. This is a blocking bug, not a wiring oversight.
- **A silent security gap follows from that same design hole.** Four of the ten blocks (`person-card.bio`, `faq.answer`, `timeline.description`, `tabs.body`) render row-level HTML via `dangerouslySetInnerHTML` with **zero sanitisation** — `lib/blocks/form.js` only calls `sanitizeHtml()` on top-level `richtext` fields, never on values nested inside a list row. Every top-level rich-text field on this site is sanitised; every list-row rich field is not.
- **The largest content-shape gap the plan doesn't name:** there is no way to embed video, a 360° tour or CCTV content anywhere. `lib/html/sanitize.js:44-46` unconditionally strips `<iframe>`, `<script>`, `<object>` and `<embed>` from every rich-text field, and no embed block exists or is planned. W5.3 (video/drone gallery) and W5.10 (360° tour) are unbuildable as things stand.

---

## 2. Current inventory

### Registered in `lib/blocks/index.js` — the only ones actually live

All nine are committed. Five have uncommitted working-tree field-schema upgrades adding `itemFields`/`itemType` to previously schemaless `list` fields — a sound improvement, not yet committed.

| Type | Committed? | Fields |
|---|---|---|
| `hero` | Yes | `image`, `eyebrow`, `headline`*, `standfirst`, `primaryLabel`/`primaryHref`/`secondaryLabel`/`secondaryHref` |
| `media-prose` | Yes | `image`, `side` (text, free-text — the "Left vs left" bug), `heading`*, `body`(richtext), `caption`, `linkLabel`, `linkHref` |
| `figure-grid` | Yes, **itemFields uncommitted** | `heading`, `intro`, `items[]`{image, caption}, `linkLabel`, `linkHref` |
| `card-grid` | Yes, **itemFields uncommitted** | `heading`, `intro`, `items[]`{title, meta, body(textarea)} |
| `cta-band` | Yes | `heading`*, `body`, `primaryLabel`/`primaryHref`, `secondaryLabel`/`secondaryHref` |
| `partner-row` | Yes, **itemFields uncommitted** | `heading`, `intro`, `items[]`{name, role, share} |
| `toll-preview` | Yes, **itemType uncommitted** | `heading`, `intro`, `classes[]`, `linkLabel`, `linkHref` — **hybrid**, amounts read live from `toll_rates` |
| `rich-text` | Yes | `heading`, `body`*(richtext) |
| `stat-row` | Yes, **itemFields uncommitted** | `stats[]`*{value, unit, label} — decorative, undated |

### On disk, uncommitted, unverified, NOT registered — inert in production

| Type | Schema file | Verdict |
|---|---|---|
| `person-card` | Yes | **Schema invalid** — `people[].bio` is `richtext` inside `itemFields`. Crashes app at boot if wired. |
| `faq` | Yes | **Same bug** — `items[].answer` is `richtext` inside `itemFields`. |
| `document-list` | Yes | Schema **valid** (all sub-fields `text`). Purely unwired — safe to register. |
| `data-table` | **None** | No schema at all. Reads `data.columns`/`data.rows`/`data.rowHeaderColumn` via `normaliseTable()` — a shape `list`/`itemFields` **cannot express**. Needs a new field type. |
| `timeline` | **None** | Reads `item.description` as raw HTML, no sanitisation path. |
| `tabs` | **None** | Genuinely well built — real ARIA tabs, keyboard support, SSR-safe hidden panels. Same richtext-in-list gap on `item.body`. |
| `contact-directory` | **None** | All sub-fields plain text — schema trivial and valid today. |
| `map-pin-list` | **None** | All sub-fields plain text/number — valid. Lacks amenities/tags and hours, both needed by W4.9. |
| `stat-dashboard` | **None** | All plain text — valid. Deliberately distinct from `stat-row`: requires `asOf`/`source` provenance. |
| `logo-row` | **None** | All plain text/image-path — valid. |

All ten are exercised by `tests/unit/blocks-w1-22-render.test.jsx`, which imports the **components directly**, bypassing the registry — so the suite is green while the feature is absent. **That is a real trap for anyone reading `npm test` output as evidence the work landed.**

**Supporting helpers on disk, uncommitted, all sound:** `lib/blocks/list.js`, `lib/blocks/items.js`, `lib/blocks/table.js`, `lib/blocks/coords.js`, `lib/blocks/href.js`.

**W1.30's twelve functional blocks: zero code exists.** `corridor-map`, `toll-table`, `traffic-status`, `progress-bar`, `interchange-table`, `corridor-strip`, `news-list`, `gallery-grid`, `contact-form`, `newsletter-form`, `emergency-strip`, `section-subnav` are still fixed-layout React.

---

## 3. Content inventory → block mapping (the coverage proof)

**A** = authored · **L** = live-data · **H** = hybrid (authored config over live data)

### W2 — Legacy content recovery

| Content item | Block | A/L/H |
|---|---|---|
| Home: 4 overview stats (48km/75%/1st/25yr) | `stat-row` | A |
| Home: 4 impact metrics (1,000+ jobs, 75%, US$412M, 4 highways) | `stat-row` | A |
| Home: "12 bridges, 7 flyovers, 27 underpasses" | `stat-row` or `rich-text` | A |
| Home: hero image, H1, standfirst, tour CTA | `hero`, `cta-band` | A |
| Home: footer address/email/phone | *not a block* — `site_settings` | — |
| Home: newsletter signup | `newsletter-form` | L |
| Project: 6-category progress breakdown, dated 31 Dec 2024 | `stat-dashboard` | A |
| Project: 5 Key Achievements | `card-grid` | A |
| Project: 5-entry timeline (2018→2025) | `timeline` | A |
| Project: 8 specification tiles | `stat-row` or `card-grid` | A |
| Project: Semi-Rigid Pavement section (`/semi.webp`, `/cp.webp`) | `media-prose` ×2 | A |
| Project: Vision & Mission | `rich-text` ×2 | A |
| Project overview: 8 Objectives | `card-grid` | A |
| Project overview: 9-item technical spec grid | `stat-row`/`card-grid` | A |
| Project overview: Project Documents list | `document-list` | A |
| Routes: full-distance toll column + calculation formulas | `data-table` (superseded operationally by live `toll-table`) | A/H |
| Routes: 5 Key Locations, narrative + feature bullets | `map-pin-list` (**needs description/features extension**) | A |
| Routes: Expressway Facilities (rest areas / toll stations / emergency) | `card-grid` | A |
| Routes: "Partial Opening Success" panel | `stat-dashboard` or new `callout` | A |
| Stakeholders: 6 outbound partner links | `partner-row` (**extend with `href`**) | A |
| Stakeholders: 3 header stats | `stat-row` | A |
| Stakeholders: VGF revision, CDB loan, BIFFL loan, first instalment | `stat-dashboard` | A |
| Stakeholders: Governance Structure (3 rosters) | `person-card` ×3 or `tabs` | A |
| Chinese contribution: 6 contribution cards | `card-grid` | A |
| Chinese contribution: investment counters | `stat-row` | A |
| Chinese contribution: pavement case study + pull-quote | `media-prose` + **`pull-quote`** (new) | A |
| Chinese contribution: Belt & Road section | `rich-text`/`media-prose` | A |
| Chinese contribution: Knowledge Transfer (50+ engineers) | `stat-row` + `rich-text` | A |
| Chinese contribution: 3 CSR cards | `card-grid` | A |
| Economic impact: counters, trade, growth, employment, regional | `stat-dashboard` (W5.11 requires real dated figures) | A |
| Gallery: 32 missing photos, 13 unclassified | `figure-grid` (teaser) + `gallery-grid` (the page) | A/L |
| Contact: address/email/phone | `site_settings` | — |

### W3 — Corporate & statutory (~25 pages)

| Content item | Block | A/L/H |
|---|---|---|
| Company page: legal name, RJSC no., SPV role | `rich-text` | A |
| Shareholding (SRBG 70 / SEL+UDC 30) | `partner-row` (exact fit — name/role/share) | A |
| Board & senior management with photos/bios | `person-card` | A |
| Organogram | `card-grid` | A |
| Concession summary (DBFOM, term, authority, handback, revision) | `tabs` + `stat-row` | A |
| Financing (USD 358.83m, BIFFL ৳1,075cr, ADB USD 50m) | `stat-dashboard` | A |
| Annual report + audited accounts | `document-list` | A |
| Traffic & revenue statistics | `stat-dashboard` | A |
| Policy library | `document-list` | A |
| ISO certifications incl. 39001 | `logo-row` + `document-list` | A |
| CSR / sustainability / ESG | `rich-text` + `card-grid` | A |
| Careers | `document-list` or `card-grid` | A |
| Procurement + supplier registration | `document-list` | A |
| Awards | `card-grid` (**extend with image**) | A |
| RTI: Information Officer, Appeal Authority, forms, index | `contact-directory` + `document-list` | A |
| Citizen Charter | `data-table` or `contact-directory` | A |
| GRS: tracking, SLA, officers, resolution stats | `contact-directory` + `stat-dashboard` | A |
| Toll dispute & appeal | `faq` + **`request-form`** | A/L |
| ESIA / ESMP | `document-list` + `rich-text` | A |
| Land acquisition: entitlement matrix + grievance path | `data-table` + `contact-directory` | A |
| Public consultation notices | `document-list` or `timeline` | A |
| National Integrity Strategy corner | `rich-text` + `document-list` | A |
| **Gazette citation on toll pages** | fields on the `toll-table` block, **not** a separate block | H |
| PPPA Dataroom link | `cta-band` or `document-list` | A |

### W4 — Road-user services

| Content item | Block | A/L/H |
|---|---|---|
| O–D toll calculator | **`toll-calculator`** | L |
| Vehicle classification guide | `card-grid` (**extend with image**) | A |
| Payment methods | `card-grid` | A |
| ETC/RFID self-service | `cta-band`/`document-list` linking out — **not a new block** until build-vs-integrate is decided | A |
| Emergency & assistance directory | `emergency-strip` (persistent) + `contact-directory` (full page) | L / A |
| Breakdown assistance request | **`request-form`** | L |
| Live CCTV | **`video-embed`** | H |
| Roadworks & closures calendar | live `advisories` feed or `timeline` | L/A |
| Rest-area directory with amenity filters | `map-pin-list` (**needs amenities + hours**) | A |
| Freight: axle loads, weighbridges, permits | `data-table` + `map-pin-list` + `document-list` | A |
| Weather/flood advisories | live `advisories` + `rich-text` | L/A |
| Lost & found | **`request-form`** + `contact-directory` | L/A |
| SMS/WhatsApp signup | **`request-form`** or `cta-band` | A/L |
| Loyalty scheme | `card-grid` + `document-list` + `faq` | A |
| Fleet portal | `cta-band` linking out — **not a content block** | A |

### W5 — Media, downloads & engagement

| Content item | Block | A/L/H |
|---|---|---|
| Downloads centre | `document-list` | A |
| Media kit | `contact-directory` + `document-list` + `figure-grid` | A |
| Video and drone gallery | **`video-embed`** | H |
| Before/after + milestones with % complete | `timeline` (**+ `progress` field**) | A |
| FAQ | `faq` | A |
| Structures register (chainage) | `data-table` | A |
| Design standards & technical specs | `stat-row` + `rich-text` | A |
| Road-safety education programme | `rich-text` + `card-grid` | A |
| Press releases as dated archive | `news-list` filtered by category — **not a new type** | L |
| Virtual 360° tour | **`video-embed`** | H |
| Economic impact real figures | `stat-dashboard` | A |
| Departmental contact directory | `contact-directory` | A |
| Office locations map | `map-pin-list` | A |
| Site search | **not a block** — a route/feature | — |
| HTML sitemap | **`sitemap-list`** | L |
| Social channels + push feed | footer/`site_settings` chrome, not a page block | A |
| Accessibility statement | `rich-text` | A |
| Print/share on toll tables | a rendering option, not a block | — |

### General sanity-check

| Need | Covered by | Status |
|---|---|---|
| Page intro/lede | `hero.standfirst` or top `rich-text` | Covered |
| Section headings | every block carries `heading` | Covered |
| **Callouts / notices** (`db-pending` ×129, `legacyData`) | **Nothing structural** — today a hand-typed `<p class="db-pending">` inside richtext HTML | **Gap — `callout` needed** |
| Pull quotes | Nothing | **Gap — `pull-quote` needed** |
| Downloads | `document-list` | Covered |
| Embedded video | Nothing; `sanitizeHtml` strips `<iframe>` | **Gap — `video-embed` needed** |
| Anchors / jump links | `section-subnav` | Planned, not built |
| Related links | extend `card-grid` with `href` — don't build a new type | Minor |
| Breadcrumbs | `pages.parent_id` exists — chrome-generated, not authored | Confirm wiring |
| Trilingual provenance | `block_translations` per-locale rows | Covered |

---

## 4. THE DEFINITIVE CATALOGUE

### Authored — 21

| Type | Operator label | Status |
|---|---|---|
| `hero` | Page banner | Exists |
| `rich-text` | Text block | Exists |
| `media-prose` | Image and text | Exists — `side` needs `select` |
| `card-grid` | Card grid | Exists — extend with `image` |
| `figure-grid` | Photo grid | Exists |
| `stat-row` | Statistics row (decorative) | Exists |
| `partner-row` | Partners | Exists — extend with `href` |
| `cta-band` | Call to action | Exists |
| `logo-row` | Partner / certification marks | Built, unregistered — wiring only |
| `person-card` | People | Built, **schema bug** |
| `document-list` | Documents | Built, unregistered — wiring only |
| `faq` | Questions and answers | Built, **schema bug** |
| `timeline` | Chronology | Built, schema bug + needs `progress` |
| `tabs` | Tabbed panels | Built, schema bug |
| `contact-directory` | Departmental contacts | Built, unregistered — wiring only |
| `map-pin-list` | Locations | Built — needs amenities + hours |
| `stat-dashboard` | Published statistics | Built, unregistered — wiring only |
| `data-table` | Data table | Built, **no schema — needs `table` field type** |
| `callout` | Notice / callout | **New** |
| `pull-quote` | Pull quote | **New** |
| `video-embed` | Video / embed | **New** |
| `request-form` | Service request form | **New** — one generic type serving 4 needs |

### Live-data — 13

`toll-preview` · `toll-table` (+ authored gazette provenance = hybrid) · `traffic-status` · `progress-bar` · `interchange-table` · `corridor-strip` · `corridor-map` · `news-list` · `gallery-grid` · `emergency-strip` · `section-subnav` · `sitemap-list` · `toll-calculator`

### Functional — 2

`contact-form` (→ `contact_messages`) · `newsletter-form` (→ `newsletter_subscribers`)

**Total: 36**, against the plan's 31. The delta: 3 new authored types, splitting `toll-preview`/`toll-table`, `request-form` as one generic type instead of four bespoke, and `toll-calculator`/`sitemap-list` made explicit.

---

## 5. Gaps — loud

1. **Zero of the ten W1.22 types are live.** Import all ten into `lib/blocks/index.js`'s `ALL` — but not before item 2.
2. **`person-card` and `faq` crash the app at boot if wired as written.**
3. **Required new primitive: `select`.** For `media-prose.side` (live bug), `callout.tone`, `video-embed.provider`, future per-block styling. Without it every enum field is one typo from silently doing nothing.
4. **Required new primitive: `table`.** Blocks the structures register, Citizen Charter table, and land-acquisition entitlement matrix.
5. **Required fix: sanitise rich content nested in list rows.** `person.bio`, `faq.answer`, `timeline.description`, `tabs.body` render `dangerouslySetInnerHTML` with no sanitisation path.
6. **No block can embed video, CCTV or a 360° tour.** Hard requirement for W5.3, W5.10, W4.7.
7. **No callout/notice block**, despite `db-pending` appearing 129 times as a hand-typed class — exactly the developer-dependent convention this remediation exists to eliminate.
8. **No pull-quote block.**
9. **`map-pin-list` has no amenity/tag or hours field** — can list a place but not filter it (W4.9).
10. **`card-grid`/`figure-grid` have no combined image+body shape** — vehicle classification guide, awards, ISO certs all want both.
11. **`toll-table`'s gazette fields (SRO number, date, link, revision mechanism) are undesigned.** They must live on the live block, or rate and citation drift apart.
12. **ETC/RFID, fleet portal, loyalty are integrations, not content shapes.** Model as links until build-vs-integrate is decided; do not add speculative block types.
13. **Site search, sitemap infra, social chrome** are not content-authoring problems.

---

## 6. Merges and rejections

**Merged:** all undated figure sets → `stat-row` · all "titled things in a row" (contribution cards, achievements, CSR, objectives, awards) → `card-grid` · press releases → `news-list` filtered, **not** a parallel content type (that drift already happened once with `news_updates` vs `content`) · social links reuse `logo-row`'s data model.

**Rejected:** a bespoke **organogram/org-chart** block (design investment disproportionate to rarely-changing content; `card-grid` serves it) · a **before/after slider** (two `timeline` entries or captioned `figure-grid` items cover W5.4 without a new interactive component and its accessibility burden) · separate **ETC/loyalty/fleet** types (product decisions, not content shapes) · **block nesting (W1.14) is not required to ship W1.22** — `tabs` keeps panel content in `itemFields` rather than nesting child blocks, sidestepping the missing `blocks.parent_id`. Nesting stays separate, larger work; don't let it block W1.22.

---

## 7. Build order

1. **Fix the registry gap — it unblocks everything.** Fix `richtext`-in-`itemFields` validation + per-row sanitisation, write `data-table`'s schema (needs `table` type), add `select`, wire all ten into `lib/blocks/index.js`. Almost entirely already built — this is finishing, not starting.
2. **`document-list`, `contact-directory`, `map-pin-list`, `stat-dashboard`, `logo-row`** — schemas already valid or trivial. Unblocks downloads, RTI/GRS contacts, locations, statistics and partner marks across W2–W5 simultaneously.
3. **`person-card`, `faq`, `timeline`, `tabs`** — once the richtext-in-list fix lands. Unblocks board/management, FAQ, chronology, concession tabs.
4. **`callout`, `pull-quote`** — small; removes the fragile 129-use HTML convention and a real correctness risk.
5. **`video-embed`** — unblocks W5.3/W5.10 entirely; zero path exists today.
6. **`toll-table`, `traffic-status`, `interchange-table`, `progress-bar`, `corridor-strip`** — what lets the homepage corridor section and all six travel pages become real block documents per W1.8.
7. **`toll-calculator`** — the plan's own P0-1, highest value-to-effort item; needs the live blocks first.
8. **`request-form`** — build once, reuse for breakdown assistance, lost & found, SMS signup, toll dispute.
9. **`news-list`, `gallery-grid`, `contact-form`, `newsletter-form`, `emergency-strip`, `section-subnav`, `sitemap-list`** — as W1.8's route-by-route conversion proceeds. These are what let the per-route `page.jsx` files actually be deleted.
