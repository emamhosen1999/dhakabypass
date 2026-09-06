# Agent A — Legacy Parity & Admin Editability Audit

> **Verbatim agent output. Do not edit findings.** Corrections go in a `> **CORRECTION:**` blockquote beneath the affected item, dated and signed.
> Captured: 2026-09-06 · Scope: `old_dhakabypass/` vs live Next.js app; admin panel content coverage; hardcoded copy; publish pipeline.
> Independently re-verified by the orchestrator: no alt-text input exists in admin; zero drag-and-drop code in the repo; `BlockFields.jsx` has no image branch; `next.config.mjs` 308s all legacy URLs; `02-seed.sql` seeds 11 pages, none `travel/*`.

## 1. Verdict

- **The entire legacy site is dead code.** `next.config.mjs:150-160` 308-redirects all 9 legacy URLs to `/en/*`, so `app/(site)/**` — 11 fully-built pages plus the `content` table that feeds them — is unreachable. Roughly half the admin panel (`/admin/pages`, `/admin/section/[key]`, `/admin/gallery`, the whole dashboard) edits that dead tree, and the dashboard tells the admin "Every heading, paragraph, statistic, news article, and image on the site is editable here" (`app/admin/(dash)/page.jsx:46`) — which is false for the live site.
- **The gallery lost 32 of 36 photos.** `db/sql/02-seed.sql:545-572` registers 28 of 51 legacy images in `media`, all with `in_gallery=0`; `db/sql/03-content-recovery.sql:38` turns on exactly four. `/en/gallery` reads `media WHERE in_gallery=1` (`lib/gallery/repo.js:95`). The 36-row `gallery_images` table still exists and is still what `/admin/gallery` edits — and nothing public reads it.
- **The block editor is NOT drag-and-drop.** It is up/down arrow buttons, each a full-page form POST (`app/admin/(dash)/pages-v2/[id]/page.jsx:72-84`). Zero DnD libraries in `package.json`; a repo-wide grep for `dnd-kit|react-beautiful-dnd|draggable|onDrop|sortable` returns nothing. No preview, no nesting, image fields are a bare text box, list fields are a raw JSON textarea (`components/admin/BlockFields.jsx:8-16`).
- **"Partially" is the honest answer to "can an admin change everything".** 11 of ~20 public routes are block-editable. The homepage's corridor section, the six travel pages, news index, gallery, contact, header, footer, 404, all SEO metadata, all 181 UI strings × 3 locales, and every colour/spacing token are code-only.
- **Publishing does work without a rebuild** — `output: 'standalone'` Node server on Passenger + `revalidateTag` (`lib/revalidate.js`). That is the one thing that is genuinely fine. But `experimental.isrFlushToDisk: false` (`next.config.mjs:33`) makes the ISR cache in-memory per process, so a save only invalidates the worker that handled it.

---

## 2. Legacy parity diff table

| Old page | New route | Status | Dropped |
|---|---|---|---|
| `/` | `/` → rewrite `/en` (`next.config.mjs:145`) | **Renamed/rewritten** | Whole page rewritten. Lost: H1 "Connecting Bangladesh's Infrastructure"; the 4 overview stats (48 km / **75% Reduction** / **1st PPP** / **25 Years**); the 4 impact metrics (**1,000+ jobs**, 75%, **US$412M**, 4 Highways); "**12 bridges, 7 flyovers, 27 underpasses**"; images `/eco-eff.webp` and `/map.webp` (both rejected as Google screenshots, `docs/source-data/2026-09-03-image-library-audit.md` §E); the callout "Experience the Future of Transportation in Bangladesh" + `/virtual-tour` "Take a Tour" CTA; footer **address, email, phone**; the **newsletter signup form**; footer **Privacy Policy / Terms of Service / Sitemap** links |
| `/project` | `/en/project` (`next.config.mjs:152`) | **Partial** | Lost: the **6-category progress breakdown** (General 93.9 / Earthwork 82.89 / Pavement 53.95 / Foundation 100 / Structure 90.9 / Incidental 54.21, "Last updated December 31, 2024"); the **5 Key Achievements** (31.76 km embankment, 40.44 km service roads, 22 km AC-20/AC-13, 62 of 73 box culverts); the **5-entry Project Timeline** (2018 PPP signed / 2020 construction / 2022 Appointed Date May 15 / 2025 first section / 2025 second section); the **8 Project Specifications tiles** (48.07 km, 4 lanes 9.7 m @80 km/h, service roads 5.8 m @50 km/h, 6 toll plazas, 100+ structures incl. 5 river bridges / 3 minor bridges / 4 flyovers / 45 underpasses / 87 culverts, 25 yr DBFOMT, $412 M, DBEDC); the **entire Semi-Rigid Pavement section** with `/semi.webp` and `/cp.webp` (technical advantages, construction process, 30+ yr lifespan, cost efficiency, weather resistance); the **Vision & Mission** section |
| `/project/overview` | `/en/project` (`next.config.mjs:153`) | **MISSING as a page** | Merged into `/project`. Lost: the **8 Project Objectives** list; the **9-item Technical Specifications** grid (12 bridges, 7 flyovers, 27 underpasses, 5 interchanges, 80-100 km/h); the **Project Sections** sub-nav (`/project/route`, `/project/technology`, `/project/impact`, `/project/timeline`); the **Project Documents** list (Brochure, Technical Specifications, EIA, Timeline — all `href="#"`, broken on the old site too); the "Need More Information?" CTA |
| `/routes-facilities` | `/en/travel/map` (`next.config.mjs:157`) | **Partial** | Toll rates survive (9 partial-section rates, `db/sql/02-seed.sql:644-652`, exact match: 150/180/190/210/260/310/400/610/740). Lost: the **full-distance toll column** (৳200–৳1600) and the **calculation-formula column** (`(4.31X18+50)X115%` etc.); the **5 Key Locations narratives** (Joydebpur / Vogra / Kanchan-Purbachal / Debogram-Bhulta / Madanpur, each with 3 feature bullets); the **Expressway Facilities section** (Rest Areas — restrooms, food outlets, prayer rooms; Toll Stations — multiple lanes, ETC, rate display; Emergency Services — call points every 2 km, ambulance, towing); the **"Partial Opening Success"** panel ("over 2 million travellers", "68%", "Target completion: July 2025"); the interactive **vehicle-type toll selector** (9 buttons); the compass rose / legend SVG route diagram |
| `/stakeholders` | `/en/about/governance` (`next.config.mjs:155`) | **Partial** | People restored as archived roster (Liu Xiaobo, Xiao Zhiming, Md. Shafiqul Islam Akand, Syed Aslam Ali — `lib/institutional/pages.js`). Lost: **all six outbound partner links** (`scrbg.com`, `udccl.com.bd`, `pppo.gov.bd` partially kept, `rhd.gov.bd`, `cdb.com.cn`, `biffl.org.bd` partially kept) — grep for `scrbg.com\|udccl.com.bd\|rhd.gov.bd\|cdb.com.cn` across `lib/institutional/pages.js` + both SQL seeds returns **zero**; the **4-tab UI** (Chinese Partners / Bangladeshi Partners / Government Partners / Project Team — already renamed in the reconstruction per `docs/source-data/2026-09-04-legacy-content-audit.md`); the **3 header stats** (First Road PPP / 7 Key Organizations / 25-Year Concession); the **৳224 crore → ৳674 crore VGF revision**; the **৳1,614 crore CDB loan** and **৳1,075 crore BIFFL loan** with the **৳42.5 crore April 2022 first instalment**; per-officer email addresses (deliberate — `docs/source-data/2026-09-06-content-recovery.md`); the **Project Governance Structure** 3-panel section |
| `/chinese-contribution` | `/en/about` (`next.config.mjs:156`) | **Mostly MISSING** | Lost essentially the whole page: the **6 Key Chinese Contributions cards** (Financial Investment / Technical Expertise / Construction Management / Knowledge Transfer / Belt and Road / Social Responsibility, 4 bullets each); the **Investment Impact counters** ($412M / 60% / 1000+); the **Semi-Rigid Pavement case study** with the 4 Benefits and the pull-quote; the **Belt and Road Initiative section**; the **Knowledge Transfer section** (**50+ Engineers Trained**, **2 New Technologies**, technical documentation in English and Bengali); the **3 Social Responsibility cards** (Educational Support / Pandemic Support / Community Outreach). Images `/road.webp`, `/hma.webp`, `/cbri.webp`, `/friends.webp`, `/DSC02396.webp` all gone |
| `/economic-impact` | `/en/project` (`next.config.mjs:154`) | **MISSING** | Nothing carried over. The content still exists as `content` row `page.economic-impact` (`db/sql/02-seed.sql:276`) rendered by `app/(site)/economic-impact/page.jsx` — a route that now 308s away, so it is **written, seeded, editable in admin, and invisible**. Lost: 4 animated counters (GDP Growth, Travel Time, Jobs, Investment); Enhanced Trade & Commerce (0.8% of GDP exports, 15-20% transport cost reduction); the 4 Economic Growth Metrics (+65% freight efficiency, +42% regional business, +85% industrial land value, +120 new businesses); Employment (2,000+ direct, **10,000+ indirect**, 500+ trained); Regional Development (Purbachal +46%, Gazipur +38%, Narayanganj +52%); Long-Term Economic Benefits |
| `/latest-updates` | `/en/news` (`next.config.mjs:158`) | **Ported (links only)** | All 6 news links survive as `news_updates` rows (`db/sql/02-seed.sql`). Lost: the embedded **36-photo gallery grid** on this page; the **newsletter subscribe form** (`components/NewsletterForm.jsx` is imported only by `app/(site)/latest-updates/page.jsx:3` — dead) |
| `/gallery` | `/en/gallery` (`next.config.mjs:159`) | **Partial (severe)** | **32 of 36 photos dropped.** `/en/gallery` shows only `/cp.webp`, `/semi.webp`, `/DSC02357.webp`, `/IMG_6282.webp`. Also lost: the "Load More Images" pagination |
| `/contact` | `/en/contact` (`next.config.mjs:160`) | **Ported** | Form fields all present. Address and email restored but **hardcoded as a fallback literal** (`app/[locale]/contact/page.jsx:88,90`) rather than seeded into `site_settings`; the phone number `+880 12345-6789` deliberately dropped as a placeholder |
| `/404` | `app/not-found.jsx` | **Ported** | Reads `page.notFound` from the legacy `content` table; renders **without localised chrome** and in English on every `/en\|/bn\|/zh` 404 (`app/[locale]/layout.jsx:44`) |

---

## 3. Orphaned legacy media + missing redirects

### Legacy images with no row in `media` (23 of 51)

Deliberate, documented rejections (`docs/source-data/2026-09-03-image-library-audit.md` §D/§E, `scripts/import-legacy-media.mjs:85-95`):
`/cbri.webp`, `/hma.webp`, `/road.webp`, `/eco-eff.webp`, `/map.webp`, `/friends.webp`, `/photo/2.webp`, `/photo/3.webp`, `/photo/5.webp`, `/photo/6.webp`

**Silently missing — in neither `AUDITED` nor `REJECTED`, so no record of a decision (13 files):**
`/photo/4.webp` (audited §A as usable, "crop before use"), `/photo/26.webp` … `/photo/36.webp` (11 files, audited §C as cleared), `/DSC02396.webp` (audited §C as cleared), `/translate.png`. These are in `public/` and shipped in the artifact, referenced by nothing.

### Registered but not in the gallery (24 of 28 `media` rows)

Every `media` row ships `in_gallery=0` (`db/sql/02-seed.sql:545-572`); only `/cp.webp`, `/semi.webp`, `/DSC02357.webp`, `/IMG_6282.webp` are flipped on (`db/sql/03-content-recovery.sql:38`). If `03-content-recovery.sql` is not imported on the production database — it is a separate manual phpMyAdmin step per `db/sql/README.md` — **`/en/gallery` renders completely empty.**

### Old URLs with no redirect

`redirects` table has **zero seeded rows** (grep for ``INTO `redirects` `` in `db/sql/*.sql` returns nothing), so the only redirects are the hardcoded ones in `next.config.mjs`.

| Old URL | Source | Result |
|---|---|---|
| `/project/route` | linked from `/project/overview/index.html` | **404** |
| `/project/impact` | linked from `/project/overview/index.html` | **404** |
| `/project/timeline` | linked from `/project/overview/index.html` | **404** |

`/about-project`, `/expressway-route`, `/virtual-tour`, `/project/technology` are covered (`next.config.mjs:162-197`), including trailing-slash variants. Redirects issue **308**, not 301 (`tests/e2e/legacy.spec.js:19`) — acceptable to Google, but not what the old inbound-link profile expects.

---

## 4. Admin panel capability map

| Screen | Edits | Storage | Reaches live site? | Drag & drop? |
|---|---|---|---|---|
| `/admin` (`(dash)/page.jsx`) | Dashboard/counters; links into legacy editors | `content`, `gallery_images`, `news_updates` | Counters describe the **retired** tree | n/a |
| `/admin/pages-v2` (list) | Create/delete pages, set slug | `pages` | Yes | No |
| `/admin/pages-v2/[id]` | **The block editor.** Add/duplicate/delete/move blocks; edit per-locale block data; draft/publish | `blocks`, `block_translations` | Yes | **No — ↑/↓ buttons, `pages-v2/[id]/page.jsx:72-84`** |
| `/admin/news` + `[id]` + `[id]/translations` | News items, slug, category, source, date, URL, excerpt, image, body; bn/zh translations | `news_updates`, `news_translations` | Yes | No |
| `/admin/media` | **Replace only** an existing image; toggle `in_gallery` | `media` + files under upload root | Yes | No |
| `/admin/corridor/*` (6 screens) | Segments, interchanges, toll rates, advisories, traffic sections, monthly traffic, illustrative flag | `segments`, `interchanges`, `toll_rates`, `advisories`, `corridor_sections`, `traffic_monthly`, `site_settings` | Yes | No |
| `/admin/messages` | Read/mark/delete contact messages | `contact_messages` | n/a | No |
| `/admin/menus` | Header + footer links: label, href, numeric position, footer parent column | `menus`, `menu_items` | Yes (override-only) | **No — numeric "Position" field** |
| `/admin/redirects` | Redirect rules | `redirects` | Yes | No |
| `/admin/settings` | **Only** phone, email, emergency phone, address ×3 locales, hours ×3 locales, 4 social URLs | `site_settings` | Yes | No |
| `/admin/translations` | **Read-only status table.** Not in the nav (`(dash)/layout.jsx:14-25`) | — | n/a | n/a |
| `/admin/pages` + `/admin/section/[key]` | 18 legacy sections/pages, auto-extracted fields | `content` | **NO — routes are 308'd away** | No |
| `/admin/gallery` | Upload, caption, reorder, delete gallery photos; links to `/gallery` | `gallery_images` | **NO — no public page reads this table** | **No — numeric "order" field, `GalleryManager.jsx:81-84`** |

---

## 5. HARDCODED CONTENT HIT LIST

### 5.1 Global UI strings — `lib/i18n/ui.js` (309 lines)

**152 keys × 3 locales = 456 strings, none editable from admin.** File comment at `lib/i18n/ui.js:4` claims "Chrome strings only — Page content lives in the CMS, never here." That is not true; the file contains full page headings, ledes, empty states, and the entire contact-page copy.

| Line | String | Admin cannot change… |
|---|---|---|
| `lib/i18n/ui.js:20-27` | All 14 nav labels (`navTravel` "Travel Info", `navProject`, `navSafety`, `navGovernance`, `navGrievances`, …) | …a nav label without also replacing the *entire* menu via `/admin/menus` (adding one item takes over the whole menu — `menus/page.jsx:36-39`) |
| `:31-39` | `contactHeading` "Contact DBEDC", `contactIntro`, `contactWriteHeading`, `contactWriteBody`, `contactDetailsHeading`, `contactOtherHeading`, `contactOtherBody` | …a single word of the contact page's prose |
| `:41-46` | Every contact **form field label and error message** (`formName`, `formEmail`, `formSubject`, `formMessage`, `formSend`, `formErrorRequired`, `formErrorUnavailable`, `formPrivacy`, `formHoneypot`) | …a form label or an error message |
| `:47-52` | `newsHeading` "Newsroom", `newsIntro`, `newsEmpty`, `newsInEnglish`, `newsSource`, `newsBack` | …the newsroom heading or its empty state |
| `:53-57` | `galleryHeading` "Photography", `galleryIntro`, `galleryEmpty`, `galleryResolutionNote` | …the gallery page's H1 or intro |
| `:58-60` | `mapHeading`, `mapIntro`, `mapAltText` | …the corridor map's heading, lede, or its accessibility description |
| `:29-30` | `pendingTag` "Not yet published", `legacyDataTag`, `legacyDataNotice` | …the wording of the provenance notice that appears **129 times** across the recovered content |
| `:114-208` / `:209-303` | The complete Bangla and Chinese sets | …any translation of any of the above; `/admin/translations` is read-only (`translations/page.jsx`) |

Plus travel-page titles/ledes (`travelStatus`, `travelStatusIntro`, `travelToll`, `travelTollIntro`, `travelRoute`, `travelRouteIntro`, `travelFacilities`, `travelFacilitiesIntro`, `travelRules`, `travelRulesIntro`, `prohibitedVehicles`, `prohibitedNote`, `noTollRates`, `noFacilities`, `rulesEmpty`, `tollCaption`, `colVehicle`, `colSection`, `colToll`, `interchangeCaption`, `routeCaption`, `openToTraffic`, `provisional`, `provisionalBody`, `consentHeading`, `consentBody`, `consentAccept`, `consentReject`, `skipToContent`, `allRights`, `language`, `theme`) — **every heading on every travel page.**

### 5.2 Map UI — `lib/i18n/map-ui.js` (11 lines, 29 keys × 3 locales = 87 strings)

`lib/i18n/map-ui.js:2-4` — `'Corridor map'`, `'Layers'`, `'Landmarks'`, `'Crossing & connecting roads'`, `'Traffic conditions'`, `'Road layout'`, `'Toll carriageways'`, `'Service roads'`, `'Widths shown diagrammatically'`, `'Up to 2 km along each approach'`, `'Section details'`, `'Geographic map · OpenStreetMap'`; `:7-9` — `'National highway'`, `'Regional highway'`, `'District road'`, `'Local road'`, `'Road information'`, `'Use signed entries and exits for toll access.'`, `'No mapped highway code'`. **The entire interactive map's control panel, legend, and 41 label sites are code.**

### 5.3 Site header — `components/chrome/SiteHeaderV2.jsx`

| Line | Item | Consequence |
|---|---|---|
| `:27-34` | `NAV` array — 6 links (`/travel`, `/safety`, `/project`, `/sustainability`, `/about`, `/news`) | Overridable via `/admin/menus`, but **all-or-nothing**: adding one item replaces all six. There is no "edit the built-in list". |
| `:63` | `<span className="db-brand-mark">DB</span>` | The brand monogram is a literal. Admin cannot use a logo image in the header at all — `/logo.webp` is never rendered by the live header. |
| `:65` | `<b className="db-brand-name">DBEDC</b>` | Company short name |
| `:66` | `<small className="db-brand-tag">Dhaka Bypass Expressway</small>` | Company tagline |
| `:87` | `aria-label="Primary"` / `:93` `"Primary, compact"` | Untranslated English in the accessibility tree on `/bn` and `/zh` |
| `:78` | Contact CTA is appended outside the menu system | Admin cannot remove or relabel the "Contact" button; a custom menu does not replace it |

### 5.4 Site footer — `components/chrome/SiteFooterV2.jsx`

| Line | Item | Consequence |
|---|---|---|
| `:19-56` | `GROUPS` — 4 columns, 15 links | Overridable via `/admin/menus`, all-or-nothing (footer needs headings created as parentless items first) |
| `:111` | `<p className="db-footer-brand">Dhaka Bypass Expressway Development Company</p>` | Legal name literal — not from `site_settings`, not translated |
| `:112` | `© {year} DBEDC.` | Copyright line and short name |
| — | **No Privacy Policy, Terms, or Sitemap link anywhere** (grep for `privacy\|terms of service` in `components/chrome/` and `lib/institutional/pages.js` = 0 hits) | The old footer had all three. The site now runs GA4 with a consent banner (`components/chrome/ConsentBanner.jsx`) and **no privacy policy page exists**. This is a compliance gap, not a content gap. |

### 5.5 Homepage — `app/[locale]/page.jsx`

| Line | Item | Consequence |
|---|---|---|
| `:113-114` | `heroBlocks = blocks.filter(b => b.type === 'hero')` / `restBlocks = ...` | **The editor's block order is a lie on the homepage.** Any hero block is hoisted to the top regardless of its `position`; an admin who moves the hero down sees no change. |
| `:119-135` | The entire corridor summary section is JSX between the two `BlockRenderer` calls | Admin **cannot move, remove, restyle, or reorder** the progress bar, corridor strip, interchange table, or the two buttons. It is always second. |
| `:121` | `<h2>{t(locale, 'homeCorridorHeading')}</h2>` | Heading from code |
| `:126-132` | The two CTAs — link targets `/${locale}/travel/toll` and `/travel/route` are hardcoded paths | Admin cannot repoint the homepage's most prominent buttons |
| `:128` | `{t(locale,'seeAllTolls')}{topRate ? ` — ${formatTaka(topRate.amount_bdt)}` : ''}` | The em-dash-price format is code |
| `:91` | `"No home page has been created yet."` — **untranslated English literal**, shown on `/bn` and `/zh` | A database hiccup shows English to a Bangla reader |

### 5.6 Travel section — six fixed-layout React pages, one block region

| File:line | Item | Consequence |
|---|---|---|
| `app/[locale]/travel/status/page.jsx:56-73` | H1, lede, progress bar, corridor strip, interchange table — **no block region at all** | Admin can change the *data* (via `/admin/corridor`) but not one word of prose, not the section order, cannot add a paragraph |
| `app/[locale]/travel/toll/page.jsx:46-92` | H1, lede, table caption, three column headers, prohibited-vehicle heading and note | Admin cannot add an explanatory paragraph to the toll page, cannot change the table caption |
| `app/[locale]/travel/route/page.jsx:127-141` | H1, lede, strip, table | Same |
| `app/[locale]/travel/facilities/page.jsx:189-216` | H1, lede, list | Same |
| `app/[locale]/travel/map/page.jsx` (313 lines) | Entire map UI, 41 `t()` call sites | Same |
| `app/[locale]/travel/rules/page.jsx:72-73` | H1 and lede hardcoded **even though the body is a block region** (`:81`) | Admin owns the middle of the page and nothing else |
| `app/[locale]/travel/rules/page.jsx:11` | `const SLUG = 'travel/rules'` | **No `pages` row with slug `travel/rules` is seeded** (`db/sql/02-seed.sql:624-634` seeds 11 rows, none `travel/*`). The page ships showing `rulesEmpty` — and it is linked from `TravelSubnav.jsx:13`, the homepage CTA (`02-seed.sql:78`), and the safety hero (`02-seed.sql:126`). A shipped, prominently-linked, empty page. |
| `components/chrome/TravelSubnav.jsx:7-14` | `SECTION` array — 6 sub-nav links | Not overridable by `/admin/menus` at all; the menus system only knows `main` and `footer` (`lib/menus/slugs.js`) |
| `app/[locale]/travel/page.jsx:6` | ``redirect(`/${locale}/travel/status`)`` | Admin cannot change what `/travel` lands on |

### 5.7 Gallery — `app/[locale]/gallery/page.jsx`

| Line | Item | Consequence |
|---|---|---|
| `:53-55` | Eyebrow, H1, lede all from `t()` | Cannot change the gallery's own copy |
| `:60-90` | Fixed grid, no lightbox, no pagination, no albums | Cannot group, tag, or paginate photos |
| `lib/gallery/repo.js:95` | `LIMIT ${take}`, default 60, clamped to 200 | Cannot show more than 200 photos, ever |
| `:70` | `alt={img.alt}` from `media.alt` — **and there is no alt-text editor in the admin** | See 5.11 |

### 5.8 Contact — `app/[locale]/contact/page.jsx`

| Line | Item | Consequence |
|---|---|---|
| `:88` | `<dd>Road 6, House 15, Block K, Baridhara, Dhaka-1212, Bangladesh</dd>` | The address appears in **English only in all three locales**, and to remove it the admin must fill in `site_settings` — clearing settings brings the hardcoded 2025 address back |
| `:90` | `<a href="mailto:info@dbedc.com">info@dbedc.com</a>` | Same |
| `:44-57` + `ContactForm.jsx` | All 12 form labels/messages from `t()` | Cannot add a field, remove a field, or change a label. The form's field set is fixed at name/email/subject/message. |
| `:23-31` | Metadata title = `t(locale,'navContact')`, description = `t(locale,'contactIntro')` | Cannot set the contact page's SEO title/description |

### 5.9 News — `app/[locale]/news/page.jsx`, `news/[slug]/page.jsx`

`:41-43` eyebrow/H1/lede from code. `:48` empty state from code. `:67` the "shown in English" fallback notice from code. No category filter, no pagination, `listNewsCached(locale, 24)` at `:33` caps the index at 24 items with no admin control.

### 5.10 SEO / metadata — entirely code

| File:line | Item | Consequence |
|---|---|---|
| `app/layout.jsx:4` | `title: "Dhaka Bypass Expressway - Bangladesh's First Fully Access-Controlled Highway"` | Root `<title>` fallback. Admin cannot change the site title. |
| `app/layout.jsx:6` | The site meta description | Admin cannot change it |
| `app/layout.jsx:7` | `icons: { icon: '/favicon.ico' }` | Admin cannot replace the favicon |
| `lib/seo/organization.js:71` | `LOGO = { path: '/logo.webp', width: 215, height: 204 }` | The JSON-LD logo path **and its dimensions** are literals. Replacing the logo through `/admin/media` changes the file but leaves 215×204 asserted in structured data. |
| `lib/seo/organization.js:73-74` | `ORG_NAME`, `ORG_SHORT_NAME` | Company name in structured data |
| `lib/seo/routes.js:57+` | `STATIC_LOCALISED_PATHS` | Adding a code route without editing this list silently unindexes it |
| `app/sitemap.js:13` | `revalidate = 3600` | Fixed |
| `app/robots.js` | Not admin-editable | Admin cannot block a page from crawling |
| Every travel/news/gallery/contact route | `generateMetadata` returns `t()` strings | **No per-page SEO title or description is editable for any code route.** Only the 11 `pages-v2` rows have `seo_title`/`seo_description` (`app/[locale]/[...slug]/page.jsx:24-27`) |

### 5.11 Media

| File:line | Item | Consequence |
|---|---|---|
| `app/admin/(dash)/media/page.jsx:93-105` | The only per-row form is **Replace** | **There is no "Add image" on the Media screen.** New images can only enter via `FieldInput`'s inline upload (`components/admin/FieldInput.jsx:41-58`) — which is used by the *legacy* `PageFieldsForm`/`SectionForm`/`NewsForm`, not by the pages-v2 block editor |
| grep across `app/admin` + `components/admin` for `name="alt"`, `setAlt`, `updateAlt`, `focal` | **Zero hits** | **An admin cannot write alt text, ever.** `docs/admin/replacing-images.md` says "Send us one sentence describing what is in the frame" — i.e. email a developer to run SQL. |
| `lib/media.js:99-101` | `INSERT INTO media (path, bytes, mime, alt)` — **no width/height probe, `alt` = `{}`** | Every newly uploaded image lands with unknown dimensions (Media screen shows "Size unknown", gallery `<img>` has no `width`/`height` → layout shift) and **permanently empty alt text** |
| `app/admin/(dash)/media/actions.js:39` | Replace **resets** alt and focal point | Replacing an image silently removes its screen-reader description, with no way to restore it |
| `media` schema has `focal_x`, `focal_y` (`db/sql/01-schema.sql:202`) | No UI reads or writes them | No cropping, no focal point, no art direction |
| No delete action | `media/actions.js` exports only `replaceMediaAction`, `setGalleryVisibilityAction` | Admin cannot remove an image |
| `docs/admin/replacing-images.md:31-40` | Replace flow is genuinely in-admin | This part is fine |

### 5.12 Design system — `app/design-tokens.css` (1050 lines, 75 custom properties)

| Line | Item | Consequence |
|---|---|---|
| `:17-33` | `--db-ground`, `--db-surface`, `--db-ink`, `--db-accent:#8A5A00`, `--db-accent-bright:#FFB000` | **No colour on the site is admin-editable.** Rebranding requires a developer + redeploy. |
| `:33-39` | `--db-open:#0F6B42`, `--db-build:#8F3804`, `--db-alert:#93231A` | The status colours a driver reads on the corridor strip |
| `:64-70` | `--db-bp-sm/md/lg/xl`, `--db-measure:68ch`, `--db-shell:1180px`, `--db-tap:44px` | Layout width and breakpoints |
| `:72-74` | `--db-font-display`, `--db-font-body`, `--db-font-zh` | Typography; fonts are self-hosted `.woff2` in `public/fonts/` — changing one is a file drop plus `components/chrome/FontPreload.jsx` |
| `:79-119` | Dark-mode palette, twice | Same |
| `:714-716` | `--db-traffic-moderate/slow` | Same |
| Legacy tree | Every `app/(site)/**` page uses raw Tailwind literals (`text-blue-900`, `bg-orange-500`, `py-20`) | Irrelevant now — the tree is dead |

### 5.13 Corridor / map data

`lib/corridor/data/map-context.json` — a 100 KB checked-in file with the OSM extent, attribution, and every highlighted road's name, ref, and coordinate array. Regenerated by `scripts/build-corridor-context.mjs`, not editable from admin. `public/maps/corridor-geography.{svg,avif,geojson}` likewise. `lib/corridor/map-labels.js:11-38` hardcodes label-placement geometry, card widths, and the regex `\(K\d|unnamed|unconfirmed` that decides which features are shown at which zoom.

### 5.14 404 — `app/not-found.jsx`

`:8` reads `getContent('page.notFound')` from the **legacy `content` table**, editable at `/admin/section/page.notFound`. `:11-23` is legacy Tailwind styling. On a `/bn` or `/zh` 404 the reader gets an unstyled English page with no header or footer (`app/[locale]/layout.jsx:44` returns bare children for a non-locale segment).

### 5.15 Roles / auth

`lib/auth/roles.js` and `lib/auth/assert-can.js` define permissions in code; there is **no `/admin/users` screen** (`(dash)/layout.jsx:14-25` has no Users entry). Adding an editor requires `npm run db:seed -- --admin` on the server or manual SQL. `db/sql/README.md` confirms `users`/`admin_users` are never seeded.

---

## 6. Block editor reality check

**What it does today** (`app/admin/(dash)/pages-v2/[id]/page.jsx`):

- 9 block types (`lib/blocks/index.js:12`): `hero`, `media-prose`, `figure-grid`, `card-grid`, `cta-band`, `partner-row`, `toll-preview`, `rich-text`, `stat-row`.
- Add (`:41-53`, a `<select>` + Add button, appends to the end), Duplicate (`:85-90`), Delete (`:91-96`), Move up/down (`:72-84`).
- Per-locale editing with an `<details>` panel showing the English source as raw `JSON.stringify` (`:100-104`).
- Draft / Publish per block per locale (`:114-119`).

**What it does not do:**

| Missing | Evidence |
|---|---|
| **Drag and drop** | No DnD dependency in `package.json`; repo-wide grep for `dnd-kit\|react-beautiful-dnd\|draggable\|onDragStart\|onDrop\|dragEnd\|sortable` across `app`, `components`, `lib`, `package.json` returns **nothing**. Reordering is `↑`/`↓` buttons, each a separate `<form action={moveBlockAction}>` — one full server round-trip and page re-render per single position swap. Moving a block from position 9 to position 1 is **eight page reloads**. |
| **Live preview** | No preview pane, no "view page" link on the editor, no draft preview URL |
| **Nesting / columns / grids** | `blocks` has `page_id` + `position`, no `parent_id` (`db/sql/01-schema.sql:81`). Blocks are a flat list. No columns, no tabs, no accordions, no containers. |
| **Image picking** | `components/admin/BlockFields.jsx` has no `image` branch — a field of `type: 'image'` (e.g. `hero.image`, `media-prose.image`) falls through to line 24's plain `<input type="text">`. **The admin must type `/photo/20.webp` from memory.** No thumbnail, no picker, no upload button. The upload-capable `FieldInput.jsx` is wired only into the retired legacy editors. |
| **Structured list editing** | `BlockFields.jsx:8-16` renders `list` fields as a `<textarea>` containing raw JSON. `card-grid.items`, `figure-grid.items`, `stat-row.stats`, `partner-row.items`, `toll-preview.classes` — **the admin hand-writes JSON.** One misplaced comma and the save fails. |
| **Rich text** | `BlockFields.jsx:17-24` renders `richtext` as a plain `<textarea>`. The seeded content is raw HTML (`<p class="db-pending">…`). **The admin writes HTML by hand.** No WYSIWYG, no toolbar. |
| **Per-block styling** | No block exposes colour, spacing, alignment, or background. `media-prose` has one `side` field (`lib/blocks/types/media-prose.js:11`) typed as free text — typing `Left` instead of `left` silently does nothing. |
| **New block types** | `registerBlock` requires a `Component` (`lib/blocks/registry.js:24`). A new block type is a new `.jsx` file + a new `lib/blocks/types/*.js` + a rebuild. |
| **Undo / revisions** | A `revisions` table exists (`db/sql/01-schema.sql:335`) and is never written to by any admin action |
| **Page templates / duplication** | Can duplicate a block, cannot duplicate a page |
| **Reordering the code sections around blocks** | The homepage corridor block, all travel pages, header, footer are outside the system entirely |

**Coverage: 11 of ~20 public routes are block-editable** — `home`, `about`, `about/governance`, `project`, `safety`, `sustainability`, `procurement`, `disclosures`, `disclosures/land-acquisition`, `disclosures/tariff`, `grievances` (`db/sql/02-seed.sql:624-634`), plus `travel/rules` if someone creates it. Everything else is fixed-layout React.

**`pages` vs `pages-v2` vs `section/[key]`:**
- `pages-v2` → the `pages`/`blocks`/`block_translations` tables → the live `/[locale]/*` tree. **The only one that matters.**
- `pages` (`/admin/pages`) → `content` table rows `page.*` → `app/(site)/*` → **308-redirected away. Dead.**
- `section/[key]` → `content` table rows `site.header`, `site.footer`, `home.*`, `page.gallery`, `page.notFound` (`lib/admin-sections.js:13-24`) → `app/(site)/layout.jsx` and `app/(site)/page.jsx` → **dead**, except `page.notFound` which `app/not-found.jsx:8` still reads.

---

## 7. Publish pipeline

**Verdict: yes, an admin edit goes live without a developer or a rebuild — with two caveats.**

Evidence:
- `next.config.mjs:8` — `output: 'standalone'`. Not a static export. Runs as a Node server under Passenger (`docs/deployment/2026-09-04-deploy-runbook.md:149`, startup file `server.js`).
- `lib/revalidate.js` — eight tag families (`pages:list`, `page:<slug>`, `corridor`, `news`, `media`, `settings`, `redirects`, `menus`). Every admin server action calls the matching `revalidate*()`.
- `lib/content/cache.js:47-58` — `unstable_cache` with those tags plus a 300 s recovery floor.
- Build log (`build-production-local.log:26-71`) — localised routes are `●` (SSG, revalidate `1m`), admin routes are `ƒ` (dynamic). Tag invalidation drops the SSG entry; the next request regenerates from the database.

Caveats:
1. **`experimental.isrFlushToDisk: false`** (`next.config.mjs:33`). The regenerated page is held in memory, not written to `.next/server/app/*.html`. Deliberate — the deploy branch tracks those files and a flush would dirty the working tree and break `git pull`. But it means the ISR cache is **per Node process**. If Passenger runs more than one instance, an admin save revalidates only the worker that handled the POST; the others serve stale until their own 300 s floor expires. Nothing in the runbook pins the instance count to 1.
2. **The shipped artifact carries CI's prerendered HTML.** `.github/workflows/production-release.yml:38-46` seeds a throwaway MariaDB, then `npm run build`. So `/en`, `/en/travel/*`, `/en/gallery` etc. are prerendered against the **CI seed database**, not production's, and are committed to the deploy branch. After a deploy those pages serve seed content until the first revalidation. `lib/content/cache.js:29-37` documents exactly this hazard for the corridor readers.
3. **Migrations are manual.** `db/sql/README.md` — "no npm and no practical way to run a Node script against the database there", so schema changes and `03-content-recovery.sql` are hand-imported through phpMyAdmin. If nobody runs `03-content-recovery.sql` on production, the gallery is empty and 13 pending callouts remain that the docs claim are resolved.

---

## 8. Ranked gap list

### P0

1. **`/travel/rules` has no `pages` row.** `db/sql/02-seed.sql:624-634` seeds 11 pages, none `travel/*`. The page is linked from `TravelSubnav.jsx:13`, the homepage CTA and the safety hero, and renders an empty state. **Work:** seed a `travel/rules` page with rules blocks in en/bn/zh, or remove the links.
2. **The gallery is empty without a manual SQL import.** Every `media` row is `in_gallery=0` (`02-seed.sql:545-572`); only `03-content-recovery.sql:38` flips four on, and it is a separate phpMyAdmin step. **Work:** fold the four `in_gallery` flags into `02-seed.sql`, and decide on the other 24 registered images.
3. **Alt text cannot be written from the admin.** No `alt` input exists anywhere; `lib/media.js:99` inserts `{}` for every upload; `media/actions.js:39` wipes alt on replace. Uploaded images are permanently undescribed. **Work:** add per-locale alt fields to the Media screen row, plus a probe call in `saveUpload` for width/height.
4. **No privacy policy, with GA4 + a consent banner live.** The old footer had one; the new site has none anywhere. **Work:** create a `privacy` page and add it to the footer.
5. **Half the admin edits a retired site.** `/admin/pages`, `/admin/section/[key]`, `/admin/gallery`, and the dashboard counters all target routes that 308 away. The dashboard states "Every heading, paragraph, statistic, news article, and image on the site is editable here" (`(dash)/page.jsx:46`). **Work:** delete or clearly quarantine those screens; migrate `page.notFound` off the legacy `content` table.

### P1

6. **The block editor has no image picker.** `BlockFields.jsx` has no `image` branch; `hero.image` and `media-prose.image` are typed paths. **Work:** reuse `FieldInput.jsx`'s picker + upload in `BlockFields`.
7. **List and rich-text fields are raw JSON / raw HTML textareas** (`BlockFields.jsx:8-24`). A non-technical admin cannot edit a card grid or a stat row. **Work:** repeater UI for `list`, a minimal WYSIWYG for `richtext`.
8. **Reordering is 1 click = 1 page reload.** **Work:** add `@dnd-kit/sortable` and a single `reorderBlocksAction` taking the whole ordering.
9. **The homepage corridor section is unmovable code** (`app/[locale]/page.jsx:119-135`), and hero blocks are force-hoisted (`:113`), so the editor's order is not what renders. **Work:** make it a `corridor-summary` block type registered in `lib/blocks/`.
10. **456 + 87 UI strings are code-only.** `/admin/translations` is read-only and not even in the nav. **Work:** move `lib/i18n/ui.js` and `map-ui.js` into a `ui_strings` table with a code fallback, and make `/admin/translations` an editor.
11. **No per-page SEO for any code route.** Only the 11 `pages-v2` rows have `seo_title`/`seo_description`. **Work:** a `route_meta` table keyed by path, read by each `generateMetadata`.
12. **13 legacy images silently unaccounted for** — `/photo/4.webp`, `/photo/26`–`36`, `/DSC02396.webp`, `/translate.png` are in neither `AUDITED` nor `REJECTED` in `scripts/import-legacy-media.mjs`. **Work:** classify them; 12 were cleared in the image audit and should probably be in the gallery.
13. **`/project/route`, `/project/impact`, `/project/timeline` 404.** Linked from the old `/project/overview`. **Work:** add three redirects to `next.config.mjs` or the `redirects` table.

### P2

14. **Header/footer branding is literal** — `SiteHeaderV2.jsx:63,65,66`, `SiteFooterV2.jsx:111,112`. No logo image in the live header at all. **Work:** move to `site_settings`; render `/logo.webp`.
15. **Menus are all-or-nothing** and the footer needs headings created before children can be attached (`menus/page.jsx:36-39`, `:110-120`). Position is a numeric field. **Work:** seed the built-in menus into `menu_items` so editing is incremental, and add drag reorder.
16. **`TravelSubnav` is not menu-driven** — `lib/menus/slugs.js` knows only `main` and `footer`.
17. **No user management screen.** Adding an editor requires SSH or SQL.
18. **`revisions` table is never written** — no undo, no version history, despite the schema existing.
19. **No colour/typography control.** 75 tokens in `app/design-tokens.css`, all code. **Work:** expose a small brand-token subset in `/admin/settings`.
20. **The contact address/email are hardcoded fallbacks** at `app/[locale]/contact/page.jsx:88,90` and are English-only in all three locales. **Work:** seed them into `site_settings` and delete the literals.
21. **`isrFlushToDisk: false` + multi-process Passenger** can serve stale content after a save. **Work:** pin the instance count to 1 in the runbook, or use a shared cache handler.
22. **Documentation drift.** `lib/seo/routes.js:6-43` says the legacy routes "are live today" and "keep working" and recommends redirecting them "once a replacement exists" — `next.config.mjs` already did it. `next.config.mjs:39` says "The legacy site at `app/(site)/` is LIVE", justifying a report-only CSP for a tree nothing can reach. `docs/source-data/2026-09-04-legacy-content-audit.md:4` says the old site "is still live". `db/sql/README.md:5` says "These two files" then lists three. **Work:** update all four.
