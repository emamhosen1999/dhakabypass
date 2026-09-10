# Interactivity Audit — what exists, what's missing, what it should look like

> Verbatim agent output. Corrections go in a `> **CORRECTION:**` blockquote beneath the affected item, dated and signed.
> Captured: 2026-09-10 · Scope: answer the client's question — "how can we apply interactivity, is our site already interactive, on which pages/UI/sections" — grounded in `findings-agent-b-peer-benchmark.md` §3/§4C and `findings-block-catalogue.md`.
> **Read-only audit.** No file under `app/`, `lib/`, `components/`, `tests/`, `db/` was modified to produce this. Code was read directly from the working tree on 2026-09-10, which is **ahead of** the 2026-09-06 block-catalogue snapshot in several places noted below — a second concurrent workstream has been landing W1.22/W1.30 work. Where this document disagrees with `findings-block-catalogue.md` on a registration or schema question, this document reflects what is on disk today and says so explicitly.

---

## 1. Verdict — 5 bullets

- **The site is already meaningfully interactive, and the client should be told that plainly.** The corridor map (`CorridorExplorer.jsx`) is a real pan/zoom/select interactive map with a working no-JS fallback, the block editor has genuine drag-and-drop with full keyboard parity, and `TabsBlock`/`FaqBlock` are textbook accessible patterns. This is above the median for a project of this size and should not be rebuilt.
- **Every genuinely interactive component here follows the same discipline: progressive enhancement first, ARIA pattern second, no dependency third.** That discipline is worth naming as a constraint on everything proposed below, not just a description of what exists.
- **Every one of Agent B's 18 peer operators' road-user self-service tools is absent** — no toll calculator, no journey planner, no live per-section traffic (TomTom is wired but unfed), no amenity-filterable rest-area directory, no vehicle-classification guide, no complaint tracking number. This is the real gap, and it is a data/authoring gap, not a "the site doesn't know how to be interactive" gap.
- **The toll data model cannot yet answer the client's own headline request.** `toll_rates` has one flat `amount_bdt` per vehicle class plus a free-text `section` label — there is no entry-interchange x exit-interchange fare matrix. `interchanges.chainage_m` exists and is enough for a distance/time estimator, but an accurate O-D fare calculator needs either a real segment-rate table or a published per-km formula, and neither exists on disk today. This changes W4.1's effort from "UI over existing data" to "UI over data that must be modelled first" — flagged loudly because the master plan calls this the single highest value-to-effort item in the whole audit and that claim needs one caveat.
- **Nothing proposed here should add a client-side map/charting/carousel library.** The existing interactive surfaces (map, tabs, faq) all deliberately avoid dependencies for bundle-cost reasons on a memory-limited shared host; every recommendation below is scoped to stay inside that discipline.

---

## 2. Part 1 — What is already interactive (accurate inventory)

### 2.1 The corridor map — `components/corridor/CorridorExplorer.jsx` + `CorridorMap.jsx`

**What it does:** A real interactive SVG map of the 48 km corridor. Pointer-based pan (drag), wheel zoom anchored under the cursor, pinch-to-zoom (two-pointer tracking with a synthetic anchor), a reset-to-home button, per-section hover/select with the list and the map cross-highlighting each other, a road layer with hoverable/selectable connecting and crossing roads that opens an info card, and a layer-toggle panel (landmarks / connections / traffic, each an independent checkbox).

**Keyboard-accessible:** Yes, and unusually well thought through. The map itself is pointer/touch-only (panning and pinch have no keyboard equivalent — inherent to a drawing surface), but the component ships a parallel accessible control surface: every corridor section is a real `<button>` in the `db-map-sections` list, in tab order, carrying the same name the map tooltip carries, with `aria-pressed` state. The comment in the source states the intent directly: "The accessible equivalent of the map, and the control surface for it." The road list is a native `<details>`/`<summary>` disclosure with real buttons inside, also fully keyboard-operable.

**Works without JavaScript:** Yes, explicitly designed to. The server renders the same SVG and the same section list; section paths are real `<a href="#sec-N">` anchors into the list, and list rows carry `:target` styling — a reader can click a stretch of road and land on what it is, with zero script. Zoom/pan/hover controls only render once `enhanced` (a client-only `useEffect` flag) is true, specifically so a no-JS reader is never shown a button that silently does nothing.

**No map library.** A deliberate choice recorded in the file's own header comment: Leaflet (42KB gzip) or MapLibre (200KB+) "both of them to move a rectangle" against a stated throttled-3G budget. Pan/zoom is ~80 lines of pointer-event math over a `viewBox`.

**Where it appears:** `/travel/map` (and wherever `corridor-map`/`corridor-strip`/`corridor-summary` blocks are placed — the corridor section on the homepage per W1.5).

**Gaps found while reading it:** the drag/pinch/wheel interactions have no keyboard equivalent for panning/zooming the drawing itself (only for the accessible list, which is the correct trade-off, but worth stating plainly rather than leaving implicit) and the traffic layer, once toggled on, currently has nothing to show — see section 3.3.

### 2.2 TabsBlock.jsx and FaqBlock.jsx

**TabsBlock** implements the WAI-ARIA tabs pattern correctly: single tab stop via roving tabindex, Left/Right/Home/End move focus and activate (automatic activation, which the component's comment justifies because panel content is already in the DOM and costs nothing to show), `aria-selected`/`aria-controls`/`aria-labelledby` wired correctly, and — the important part — every panel stays in the document, marked `hidden` rather than unmounted, so the full content is crawlable, Ctrl+F-able, and printable even though only one panel is visually open. Server-rendered with the first panel open, so it degrades to "one visible panel plus everything else present in the source" with JS off, not to nothing.

**FaqBlock** deliberately uses no script at all: native `<details>/<summary>`. The component's own comment states the reasoning — an accordion that mounts its answer only on click hides that answer from crawlers, Ctrl+F and print, which is disqualifying for a block meant to hold statutory and toll-dispute answers people arrive at from search. This is the right call and should not be "upgraded" to a scripted accordion later.

**Where they appear:** registered block types (`lib/blocks/index.js`), placeable on any block-document page. Not yet placed on any live page because there is no FAQ page or governance-tabs page yet (W3/W5 work).

**Correction to the block-catalogue's registration claim:** `findings-block-catalogue.md` (2026-09-06) states "None of the ten new block types is registered" and that person-card/faq "crash the app at boot if wired." Reading `lib/blocks/index.js` today shows all ten W1.22 types (person-card, document-list, faq, data-table, timeline, tabs, contact-directory, map-pin-list, stat-dashboard, logo-row) are imported and registered, plus toll-table, traffic-status and interchange-table from W1.30's build order item 6 — 22 types live against the plan's original 9. The registry's own header comment now references `tests/unit/blocks-registry-coverage.test.js` as a guard against exactly this regression recurring. TabsBlock/FaqBlock also both carry inline comments confirming `lib/blocks/form.js` now sanitises richtext sub-fields nested in list rows (the person.bio/faq.answer HTML-injection gap the catalogue flagged as a blocking bug) — so that fix has landed too. This is good news to relay to the client as-is; it does not change any recommendation below, since the missing pieces are still missing regardless of registration status.

### 2.3 components/chrome/ — theme, locale, consent, travel subnav

- **ThemeToggle.jsx** — a real three-way (light/dark/system) toggle, `role="group"`, `aria-pressed` per button, persisted to localStorage, sets `data-theme` on the root. Keyboard-accessible (native buttons). Works without JS in the sense that the site has a full dark palette driven by `prefers-color-scheme` as the no-JS/no-stored-choice default (per `app/design-tokens.css`); the toggle itself needs JS to override that, which is unavoidable for a stateful preference.
- **LocaleSwitch.jsx** — three real `<Link>` elements with `hrefLang` and `aria-current`, not a client-side re-render. Works with JS off — it's server-rendered navigation.
- **ConsentBanner.jsx** — a real accept/reject dialog, `role="dialog"`, `aria-live="polite"`, equal-weight Accept/Reject buttons (the component's own comment calls out unequal-weight consent banners as the anti-pattern to avoid), renders nothing until the stored choice is read so it never flashes for a returning visitor, degrades gracefully if localStorage throws (private browsing). Keyboard-accessible.
- **TravelSubnav.jsx** — server-rendered links with `aria-current="page"` computed from `usePathname`; works without JS.

All four are small, correct, and already meet the accessibility bar the plan sets elsewhere (W1's `--db-tap`, contrast-measured tokens). No rework needed.

### 2.4 components/admin/ — the block editor

- **BlockSortableList.jsx** — real drag-and-drop reordering via `@dnd-kit`, replacing what the master plan describes as "eight page reloads to move a block from position 9 to 1." Critically, keyboard reordering runs the identical code path as pointer reordering (dnd-kit's KeyboardSensor): Tab to the handle, Space/Enter to pick up, arrow keys to move, Space/Enter to drop, Escape to cancel — plus live aria-live announcements at every step (picked up / now over position N / dropped / cancelled). This is exactly the "same code path, not a keyboard-only fallback that quietly drifts" pattern the map's accessible section list also uses.
- **ImageField.jsx** (W1.1) — thumbnail plus "choose from media library" (a real picker grid over the media table) plus upload plus a raw-path fallback for pasting a known path, submitted via a hidden input so a no-JS-yet page load never blanks an existing image on save.
- **RichTextField.jsx** (W1.3) — a genuine, dependency-free rich-text toolbar (H2/H3/bold/italic/lists/link) built on `document.execCommand`, with an HTML-source escape hatch, sanitised centrally in `lib/blocks/form.js` rather than in the editor (avoiding two independent definitions of "what HTML is allowed").
- **PreviewPane.jsx** (W1.25) — live iframe preview of the actual public render (`/{locale}/preview/{pageId}`) at three real device widths (390/768/1280, not a squeezed narrow frame), switchable by locale, with a manual refresh. This is a serious editing surface, not a token gesture.

**Verdict:** the admin block editor genuinely delivers on "operator authors without a developer" for the fields it covers. This is the CMS engine work (W1) doing its job. The unfinished part is coverage — not every route is a block document yet (W1.8 still pending) — not the editor's own interaction quality.

### 2.5 Contact and newsletter forms

- **ContactForm.jsx** (`app/[locale]/contact/ContactForm.jsx`) — `useActionState`-driven, so it degrades to a plain POST-and-reload with JS off rather than breaking; outcomes (invalid/unavailable/ratelimited/too_long/ok) are each stated in an `aria-live="polite"` region with a distinct, specific message, not a generic failure banner. Honeypot field correctly hidden from sight, screen readers and tab order (`aria-hidden`, `tabIndex={-1}`). `maxLength` mirrors the server-side cap so a paste is stopped client-side as a courtesy while the server still enforces it. This is a well-built form.
- **NewsletterForm.jsx** (`components/NewsletterForm.jsx`) — a materially weaker, older pattern by comparison: manual `onSubmit`/`fetch`/`useState` rather than `useActionState`, no `aria-live` region (status text is just conditionally rendered, not announced), imports a server action via a relative `../app/admin/actions` path that reads as legacy wiring. Per the master plan's W2.8, this component is "currently imported only by a dead route" — worth flagging as technical debt on the interactivity surface itself, not just the routing debt the plan already tracks: when the newsletter form is restored to a live page, it should be rebuilt on the same useActionState plus aria-live pattern as ContactForm, not just relinked. This is a small addition to W2.8's acceptance criteria, not a new task.

### 2.6 The gallery

**What it does today:** a plain CSS grid of `<img>` links, each linking to its own full-size file so the browser's native image viewer does the zoom/pan/download job. GalleryPage's own comment explains the choice deliberately: a custom lightbox needs focus trapping, an escape route, scroll locking and a history entry to be done correctly, and getting any one wrong is worse than not having one. `loading="eager"`/`fetchPriority="high"` correctly reserved for the first four images (LCP), lazy below that. Real per-locale alt text is rendered as a caption when present. No JS required at all — every "interactive" affordance here is a native link and a native image viewer.

**What's missing:** no filtering, no album/category grouping, no pagination — `listGalleryCached(locale, 60)` hard-caps at 60 images with no "load more." The master plan's OP-6 and W2.9 already track a hard 200-photo ceiling elsewhere in the codebase; this file's cap is 60, tighter than that number, and confirmed by reading `lib/gallery/repo.js:87`.

**Assessment:** the lightbox rejection is a defensible, well-reasoned decision that should not be reversed lightly — see section 4 below for what a native-first alternative to a JS lightbox looks like. The pagination gap is real and independent of that decision.

### 2.7 What "already interactive" adds up to

The pattern across every component above is consistent enough to name as house style: build the accessible, no-JS-capable version first; layer scripted enhancement on top; never let the enhancement be the only path to the content. The map's section list, the FAQ's `<details>`, the tabs' hidden-not-unmounted panels, the gallery's native-link-not-lightbox, the image field's hidden-input fallback, and the contact form's progressive useActionState all independently reach for the same principle. Anything proposed in Part 2 that breaks this pattern should be rejected on sight, not just discouraged.
---

## 3. Part 2 — What's missing, ranked, with page/section/block for each

Grounded in `findings-agent-b-peer-benchmark.md` section 3 (feature matrix) and section 4C (road-user services), and checked against `findings-block-catalogue.md`'s block inventory plus the block schemas actually on disk today. A = authored, L = live-data, H = hybrid.

### 3.1 Toll calculator — highest priority, but effort is corrected upward

**Page:** its own page, `/travel/toll-calculator` (or a dedicated section on `/travel/toll`), plus a compact entry on the homepage. The peer evidence for the homepage placement is specific and should be named to the client exactly as given: PLUS Malaysia puts its calculator directly on the homepage, and 407 ETR's "Calculate Your Trip" and Linkt's toll calculator are both one click from the top nav, not buried in a sub-page. Recommendation: a `toll-calculator` block placed once on `/travel/toll` as the primary surface (it needs room — origin/destination/class selects, distance, fare, estimated time, gazette citation), and a slimmer teaser variant of the same block (or `toll-preview` extended) on the homepage linking through.

**Block type:** new `toll-calculator` (already named in the block catalogue's live-data list, not yet built — confirmed, no file named anything like "calculator" exists anywhere in `lib/` or `components/`).

**A/L/H:** L for the fare, distance and time computation itself (reads `interchanges.chainage_m`, `toll_rates`); A for the block's heading/intro copy and which interchange pairs are offered as options (if the operator wants to hide unopened sections, say).

**Data reality check — this is the one place this audit corrects the plan's own claim.** The master plan calls W4.1 "the highest value-to-effort item in the entire audit" on the premise that "the toll, interchange and segment data already exist; the calculator is mostly a UI over them." Reading the actual schema:
- `interchanges.chainage_m` — present, sufficient for a distance figure between any two interchanges (simple subtraction) and, with a stated design speed, an estimated time.
- `toll_rates` — one row per (vehicle_class, effective_from) with a single `amount_bdt` and a free-text `section` field. There is no interchange-pair fare table. A real O-D calculator (enter at Kanchan, exit at Vogra, Class 3, produce a taka amount) needs either (a) a `toll_rate_segments` table keyed by an interchange pair or corridor-km range per class, mirroring how `segments` already models `from_m`/`to_m`, or (b) a published per-km formula the legacy site carried (W2.4 notes "calculation formulas" were dropped from `/routes-facilities` and never restored) applied to the chainage distance.
- Recommendation: treat "model the O-D fare table" as its own sub-task ahead of the calculator UI, not folded silently into it — the master plan should still call this the best value-to-effort item on the list (it is, even with this correction), but the effort estimate needs the data-modelling step named explicitly so nobody discovers it mid-build.

**Effort:** M for the UI once the fare data model exists; add S-M for modelling the fare table/formula first. Net: M, not S, and dependent on the operator confirming whether a real per-pair tariff exists in the gazette or whether the whole corridor is genuinely a single flat rate by class today (in which case the "calculator" degrades to a distance/time estimator plus a static rate lookup, which is far cheaper — this needs one factual question answered before scoping, not an assumption).

**Bundle cost:** low. A calculator is a couple of selects, a submit, and a server action or a small client computation over data already fetched for the page — no new client library.

### 3.2 Journey planner / distance calculator

**Page:** `/travel/route` (the existing route page), as a section, or folded into the toll calculator above as one combined "plan your trip" surface rather than two near-duplicate tools — recommend combining them, since both need the same origin/destination interchange picker and the marginal cost of adding distance and time to the toll calculator's output is near zero once chainage-based distance is computed anyway.

**Block type:** the same `toll-calculator` block, with distance/time always shown alongside fare (not a separate `journey-planner` block — avoids the "titled things in a row" duplication the block catalogue's merge rule already applies elsewhere).

**A/L/H:** L. **Data:** exists today (`interchanges.chainage_m`).

**Effort:** folded into 3.1; adds negligible cost once that block exists.

### 3.3 Live traffic map with per-section conditions

**Page:** `/travel/map` (the corridor map) and `/travel/status`.

**Block type:** existing `traffic-status` and `corridor-map`/`corridor-strip` blocks — the UI already exists (sections 2.1, 2.7 confirm TrafficStatusBlock.jsx is a complete, well-built, honestly-labelled live-data component). The gap is entirely upstream of the UI.

**A/L/H:** L, already implemented as such.

**What's actually missing — restated precisely, because the UI work is done:** `lib/corridor/tomtom.js` is a complete, defensively-written TomTom Flow API client (validates roadClosure/speed bounds/confidence/FRC class, matches the returned line to the corridor within 100m, throws rather than guesses on any anomaly). `lib/corridor/traffic-admin.js` confirms `traffic_source` only ever becomes 'tomtom' after a successful refresh — it cannot be switched on blind. But CONDITIONS includes 'unknown' as the default condition_key for every section, and nothing in the codebase schedules the refresh. All seven corridor sections read 'unknown' today because TOMTOM_API_KEY is (per the master plan's own decisions table) not yet confirmed set on the server and no cron/scheduled task calls `traffic-refresh.js`.

**Recommendation:** this is not a Part-2 "add interactivity" item at all — it's an operations task (set the env var, schedule the refresh, most simply via a cPanel cron hitting a protected route that calls `refreshTraffic()`). Flagging it here because the client's question ("is our site already interactive?") is best answered honestly: the live traffic feature is built and waiting on one API key and one cron job, not on more UI work.

**Effort:** S (ops config), zero new interactivity work.

### 3.4 Rest-area / facilities directory with amenity filters

**Page:** `/travel/facilities`.

**Block type:** `map-pin-list` — already has `amenities` (nested list) and `hours` fields on disk today (`lib/blocks/types/map-pin-list.js`), contradicting the block catalogue's 2026-09-06 claim that this extension is still needed. What's missing is the filtering UI over those fields — the current MapPinListBlock.jsx renders the list; it does not yet expose a client-side amenity checkbox filter or an "open now" indicator computed from `hours`.

**A/L/H:** A (the pin data itself is authored per-item, as it should be — the block catalogue's records-vs-blocks rule doesn't apply here since rest areas aren't yet a shared record type; keep it as list-of-items unless the same rest area needs to appear on two different pages, which nothing today requires).

**Data needed:** none new — fields exist. **Effort:** S — a client-side filter over already-rendered data (checkbox group plus show/hide, or a tiny amount of client JS toggling visibility; no fetch, no library).

**Bundle cost:** negligible — a filter over a list already on the page needs no new dependency, at most a thin client wrapper component.

### 3.5 Vehicle classification guide

**Page:** `/travel/toll`, as a section directly beside the toll table (classification disputes are the top complaint category per the benchmark, and the natural place to resolve "which class am I" is right where the price is quoted).

**Block type:** `card-grid`, extended with an image field per item (the block catalogue already flags this exact gap: "card-grid/figure-grid have no combined image+body shape — vehicle classification guide, awards, ISO certs all want both"). Confirmed on disk: `lib/blocks/types/card-grid.js`'s itemFields should be checked at implementation time for an image sub-field; if absent, this is a one-field schema addition, not a new block type.

**A/L/H:** A. **Data needed:** vehicle-class photos/diagrams and edge-case copy (CNG, easy-bike, covered van, trailer) — operator-supplied, does not exist today.

**Effort:** S (schema extension plus authoring), assuming photos are supplied.

### 3.6 Gallery — lightbox, filtering, pagination

**Page:** the gallery route, `app/[locale]/gallery/page.jsx`.

Three sub-items, and they should not be treated as one bundle:

- **Pagination** — raise or remove the current 60-image cap (`lib/gallery/repo.js:87`) with a "load more" or numbered pages. Effort: S. No new dependency — a page query param and a repeat of the existing server-rendered list is enough; this can stay entirely server-rendered with Link pagination, needing zero client JS, consistent with the page's current no-JS-required design.
- **Filtering/albums** — a category or tag filter. Effort: S-M depending on whether media rows already carry a taggable field (needs a quick schema check at implementation time).
- **Lightbox — recommend against building a scripted modal, and say why to the client explicitly.** GalleryPage's own header comment already made this call correctly: a custom lightbox needs focus-trap, escape handling, scroll lock and a history entry to be accessible, and getting any one wrong regresses a page that works perfectly today. The existing "each image links to itself, browser's native viewer does the work" pattern already delivers pinch-zoom, back-button and download for free, with zero JS and zero accessibility risk. If the client specifically wants an in-page lightbox (e.g. for a next/previous browsing experience peers offer), the native-first alternative is the HTML dialog element with its backdrop, which handles focus trapping and Escape natively in every browser this project already supports without a library — but this should be scoped as a deliberate UX decision with the client, not defaulted into.

**Block type:** the existing `gallery-grid` (W1.30 live-data block, not yet built as a placeable block — currently a fixed page). Pagination/filtering become fields on it once it exists as a block per W1.30.

**Bundle cost:** near-zero for pagination; a dialog-based lightbox if built adds a small amount of client JS but no new dependency.

### 3.7 FAQ search/filtering, downloads-centre filtering, news category filter and pagination

**Pages:** a new `/faq` page (W5.5), a new downloads-centre page (W5.1), `/news` (existing, currently hard-capped at 24 per `app/[locale]/news/page.jsx:33` — confirmed on disk today, unchanged from the audit).

**Block types:**
- `faq` block already exists and is registered (section 2.2) — a search box over it is a thin client-side filter on already-rendered details items (hide/show, never remove from DOM, preserving the crawlability the block was built to protect). Effort: S.
- `document-list` (registered, sections 2.2/2.7) — filtering by document category is the same pattern: client-side show/hide over server-rendered rows. Effort: S.
- `news-list` (W1.30, not yet built as a block) — category filter and pagination become fields on the block once it exists; this should ship as part of W1.30 rather than bolted on after, since the 24-item cap is explicitly named in W1.30's own text as something that "becomes a field."

**A/L/H:** all L (filtering behaviour over live-data blocks). **Bundle cost:** each filter is a small client wrapper toggling visibility over server-rendered content — no fetch, no library, single-digit KB each.

### 3.8 Statistics dashboard (monthly traffic from DBEDC's own toll-plaza counts)

**Page:** `/company/statistics` or similar new W3.8 page.

**Block type:** `stat-dashboard` — already built and registered (section 2.2). `traffic_monthly` table already exists, keyed (month, plaza) with a vehicles count (confirmed in `db/sql/01-schema.sql`), edited at `/admin/corridor/monthly` per the master plan's decisions table. This is authoring plus placement work, not new interactivity.

**A/L/H:** L for the numbers, A for heading/intro/asOf/source provenance fields the block deliberately carries (per the block catalogue: "requires asOf/source provenance," distinct from the decorative stat-row).

**Effort:** S (the block exists; this is content operations). No client JS at all — a table/stat grid is static markup.

### 3.9 Grievance/complaint form with a tracking number; breakdown assistance request

**Pages:** a GRS page under W3.17 for the formal grievance-redress form (statutory), and a breakdown-assistance entry point under W4.6, both distinct from the general contact form.

**Block type:** the catalogue's proposed `request-form` — one generic type reused for all four "operator needs a tracked service request" needs (grievance, toll dispute, breakdown, lost and found). Confirmed: no such component exists on disk today.

**A/L/H:** L — writes a new tracked-request record (needs its own table, e.g. `service_requests`, generating a tracking number on submit; nothing like this exists in the schema today, checked against `db/sql/01-schema.sql`).

**What it should reuse from what already works:** the same useActionState plus aria-live outcome pattern ContactForm.jsx already implements correctly (section 2.5) — invalid/rate-limited/ok states each stated distinctly, honeypot hidden the same way, MAX_MESSAGE_CHARS-style server-enforced caps. Building request-form as a second, weaker pattern (the way NewsletterForm.jsx currently is relative to ContactForm.jsx) would be a regression to flag in review.

**Effort:** M — new table, tracking-number generation, the form UI, and (for the GRS specifically) the SLA/officer-name fields the statutory page needs beside it. This is real interactivity work, not authoring.

**Bundle cost:** low — one more useActionState form, same shape as the existing contact form.

### 3.10 Emergency contact surfacing on every page

**Page:** every page, via a persistent block/strip, not a dedicated page.

**Block type:** `emergency-strip` (W1.30, live-data, reads from site_settings). Confirmed not built today — no component or route mentions "emergency" anywhere in lib/components/app except settings-schema scaffolding (`lib/i18n/groups.js`, `lib/i18n/ui.js`, `lib/institutional/pages.js`, `lib/seo/organization.js`, `lib/settings.js`, `/admin/settings` actions/page) — i.e. the place to store emergency numbers may exist in the settings framework, but no numbers are seeded and no strip renders them.

**A/L/H:** L (numbers come from site_settings, per Task 0.13's design — role numbers only, never a staff mobile, per the operator's explicit 2026-09-06 decision already recorded in the master plan).

**Effort:** S once Task 0.13 (already in Phase 0) lands the settings fields — this is placement, not new mechanism. No client JS needed — tel: links are plain anchors.

**Note:** this is already tracked as Task 0.13 in Phase 0 and B-C5/OP-8 in the traceability checklist; it is listed here for completeness of the interactivity picture (a persistent strip is a UI/interactivity decision — where it sits, whether it's dismissible, whether it collapses on scroll — even though the underlying task is already scoped elsewhere). No duplicate task is being added for it; see section 5.

### 3.11 Items considered and rejected

- A JS-driven photo lightbox as a default build — rejected as the default; see section 3.6. The existing native-link pattern is correct engineering and should be named to the client as a deliberate strength, not a hole.
- A carousel/slider anywhere (hero, testimonials, before/after) — not requested by any peer feature in the benchmark's sections 3/4C beyond a "before/after slider," which the block catalogue already explicitly rejected ("two timeline entries or captioned figure-grid items cover W5.4 without a new interactive component and its accessibility burden"). This audit concurs: a slider's auto-advance and swipe gestures are a recurring WCAG 2.2.2 (pause/stop/hide) failure point, and static before/after imagery already answers the "did the road get built" question the benchmark cares about.
- A live chat widget / chatbot (PLUS's PUTRI) — B-C13 already scopes this correctly as an SMS/WhatsApp advisory channel first, "before any app." A chatbot is a much larger surface (hosting, training data, moderation) than the benchmark's own ranking justifies for this corridor; not adding it to the interactivity list independently of B-C13's existing scope.
- Client-side search-as-you-type across the whole site (site search, B-E3/W5.14) — belongs to W5 as already scoped; not re-litigated here as an "interactivity" feature distinct from what W5.14 already covers, beyond noting it should reuse the same show/hide-over-server-rendered-content pattern as section 3.7 wherever it can (a full search index is a heavier, separate build already correctly sized as its own task).
- Map-based live CCTV player (video-embed/W4.7) — real gap per the benchmark, but it is a media gap (no block can embed video/iframe content at all — `lib/html/sanitize.js` strips iframe unconditionally), not an interaction gap; it is already precisely scoped in the block catalogue's video-embed gap and W4.7/W5.3/W5.10. Not duplicating a task for it here — flagged only so the client understands it sits in the "we have no video block yet" bucket, not the "add more interactivity" bucket, and should be sequenced with W5.3/W5.10 rather than as a standalone interactivity task.
---

## 4. Part 3 — Constraints every proposal above must respect

- **Accessibility is a legal expectation, not a preference.** Bangladesh's Digital Service and Web Designing Guideline for Inclusive Accessibility 2022 (ICTD) is WCAG 2.1-aligned (per the peer benchmark section 5, B-ST-7). Every item in section 3 above must ship with: full keyboard operability (the map's parallel button-list pattern and the tab list's roving-tabindex pattern are the two reference implementations already in this codebase — reuse them, don't reinvent), visible focus rings (the design tokens already define these; don't override them per-component), `--db-tap: 44px` minimum tap targets (already a token — confirmed at `app/design-tokens.css:70` and applied at 5+ call sites including footer links and buttons), and `prefers-reduced-motion` respected (already handled at three points in `app/design-tokens.css` — any new animated affordance, e.g. a collapsing emergency strip or an amenity-filter transition, must add itself to that existing pattern rather than starting a fourth).
- **Progressive enhancement — a toll rate must not depend on a bundle loading.** This is not a general nicety here; it's the specific bar ContactForm, the corridor map, TabsBlock and FaqBlock already clear. Every new block in section 3 must render its core informational content (the fare, the FAQ answer, the rest-area address, the emergency number) as plain server-rendered HTML first, with any filter/calculator/toggle as an enhancement layered on top — exactly the house pattern documented in section 2.7. A toll-calculator's fare table (all classes, current section) should render even if the interactive origin/destination picker's JS fails to load; the calculator becomes the enhancement over a table that's already correct.
- **Trilingual, Bangla authoritative for statutory content.** Every new string in every block proposed above needs en/bn/zh (per the master plan's existing global constraint) — this applies to filter labels, calculator button text and empty-state messages exactly as much as to headings. The grievance/toll-dispute request-form content is statutory-adjacent and must treat Bangla as authoritative per B-ST-6.
- **Everything ships as a block type an operator places and configures — no new hardcoded page.** Every recommendation above is already framed that way (section 3 states the block type for each). The one item that is explicitly not a content block is the emergency strip's exact persistence/collapse behaviour and the traffic-refresh cron — both are configuration/ops decisions, not authored content, and should stay in code accordingly (consistent with the plan's own "what genuinely cannot be a pure block document" carve-outs).
- **Records vs blocks.** None of the proposals in section 3 invent a new record type casually. The toll calculator reads interchanges and toll_rates (extended, see 3.1) rather than storing its own copy of fares. The rest-area filter reads map-pin-list item fields already in place. The one place this needs a genuinely new record table is request-form's tracked submissions (3.9) — a service_requests table, because a tracking number and an SLA clock are facts about an event, not presentation.
- **Bundle cost.** `output: 'standalone'` on a memory-limited shared cPanel host means every client dependency is a real cost. Inventory of what each proposal adds:
  - Toll calculator (3.1/3.2): zero new dependencies — selects, a fetch or server action, and arithmetic over data already on the page. Sub-5KB of new client JS.
  - Amenity filter (3.4), FAQ search (3.7), downloads filter (3.7), gallery pagination (3.6): zero new dependencies — each is a thin client wrapper toggling visibility over server-rendered markup, no fetch, no library. Single-digit KB each, and several can share one small utility module.
  - request-form (3.9): zero new dependencies — same useActionState pattern as the existing, already-shipped ContactForm.
  - Gallery lightbox, if built (3.6): native dialog element, zero new dependencies, but real new client JS (focus management, keyboard handling) — the one item in this whole list with meaningful bundle and correctness risk, which is exactly why section 3.6 recommends not building it by default.
  - Live traffic (3.3): zero new client-side cost — it's a server-side cron/API-key configuration issue, not a frontend change.
  - Total assessment: everything recommended in section 3, with the single flagged exception of an optional lightbox, adds negligible client JavaScript. The corridor map's own no-map-library precedent (section 2.1) is the model to hold every one of these to.

---

## 5. What was rejected, and why (for the record)

- A scripted photo lightbox as the default gallery build (sections 3.6, 3.11) — the existing native-link pattern is correct and already ships; a lightbox is optional, client-requested UX, not a gap.
- A carousel/slider anywhere on the site (section 3.11) — the block catalogue already rejected a before/after slider on the same grounds; extending that rejection to hero/testimonial carousels generally, consistent with the corridor map's and FAQ's demonstrated preference for content that stays in the DOM over content that only exists after an interaction.
- A chatbot / live-chat widget (section 3.11) — correctly out of scope at this stage per B-C13's own sequencing ("SMS/WhatsApp before any app"); not re-added as a separate interactivity task.
- A separate journey-planner block distinct from the toll calculator (section 3.2) — merged into toll-calculator to avoid the exact "titled things in a row" duplication the block catalogue's own merge rules already warn against.
- Treating the emergency strip's rendering as a new interactivity task — it is already Task 0.13 / B-C5 / OP-8; discussed for completeness in section 3.10 but not duplicated.
- Treating live-CCTV (video-embed) as an "add interactivity" task — it's a missing media primitive (no block can embed video/iframe at all), already correctly scoped under W4.7/W5.3/W5.10 and the block catalogue's video-embed gap; not re-scoped here as a separate interactivity initiative.
