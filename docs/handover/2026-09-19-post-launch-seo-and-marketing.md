# Post-launch: being found, measured and talked about

*Prepared 19 September 2026. Written for two readers: the DBEDC operator who will run the accounts, and the next engineer who will change the code. Everything in section 2 was read out of the repository on the date above; nothing here is copied from the plan without being checked against a file. Where a fact is not established, the row says "unknown — needs DBEDC" and names the row of the supply register that covers it.*

The supply register is `docs/handover/2026-09-14-information-to-replace.md`. The media brief is `docs/handover/2026-09-14-media-brief.md`. The audit behind the findings is `docs/audit/2026-09-14-concession-domain-audit.md`. Nothing in this document asks DBEDC for anything the register already asks for.

---

## 1. How to read this document

Every action is classified once, in the register at section 4:

| Class | Meaning |
|---|---|
| **engineering** | We can implement it. The register gives the file and line. |
| **account access** | DBEDC must own it, authorise it, or decide it. No code change unblocks it. A policy decision counts as account access, because the decision is DBEDC's to make. |
| **content** | An editor must write it, in the admin. No deploy needed. |

Counts: **16 engineering, 15 account access, 13 content.**

Sections 5 to 13 are the operating instructions. Sections 14 to 16 are the checklists.

---

## 2. What is actually in the code

Verified 19 September 2026 by reading the files named.

| Claim | Verified | Where |
|---|---|---|
| `www` → apex is a permanent redirect | Yes | `next.config.mjs:189-194` |
| `/` sends the reader to their own language | Yes, but **307 not 308** — deliberate, the answer depends on the reader, and it carries `Cache-Control: no-store` | `app/route.js:19-32` |
| Legacy paths redirect rather than 404 | Yes, 14 paths plus trailing-slash twins, each naming its final destination | `next.config.mjs:195-228` |
| hreflang on every localised page, plus `x-default` | Yes. All three locales are always declared, because a missing translation falls back per block and still renders | `lib/seo/alternates.js:28-35` |
| Sitemap-level hreflang as well as page-level | Yes | `lib/seo/sitemap.js:118` |
| Descriptions on all pages | Yes for the seeded pages; `seo_description` is populated in `db/sql/02-seed.sql:588+` and the share card falls back to the page's first prose | `lib/seo/social.js:21-31` |
| **Branded titles per locale** | **No.** There is no title template. `<title>` for `/en/travel/toll` is "Toll rates"; for `/bn/travel/toll`, "টোল হার". Only the home page and a handful of others carry the corridor name | `app/[locale]/layout.jsx:23-26`; titles at `db/sql/16-travel-pages.sql:51-57` |
| OG and Twitter cards on every page | Yes | `lib/seo/social.js:55-72` |
| **Per-locale share images** | **No.** One fallback image for all three locales, `public/bg-hero.webp`, measured **686 × 386** — below the 1200 × 630 the audit asked for. No `og:image:width`/`height`, no `og:locale:alternate` | `lib/seo/social.js:15, 61-71` |
| Organization structured data | Yes, and honest: it emits no field DBEDC has not supplied. `sameAs`, `contactPoint` and `address` appear only when the settings hold them | `lib/seo/identity.js:135-150`, `lib/seo/organization.js:97-141` |
| WebSite + SearchAction | Yes, targeting `/{locale}/search?q=`, and `/search` is a real published page reading `q` | `lib/seo/organization.js:144-159`; `components/blocks/SiteSearchBlock.jsx:29` |
| BreadcrumbList | Yes, on every content page | `app/[locale]/[[...slug]]/page.jsx:175` |
| FAQPage | Yes, from the FAQ block | `components/blocks/FaqBlock.jsx:23-27` |
| NewsArticle | Yes, with no invented author and no defaulted `dateModified` | `lib/seo/organization.js:218-244` |
| **Place / LocalBusiness for plazas or the office** | **No.** The only `@type` values anywhere in the repo are Organization, WebSite, SearchAction, EntryPoint, BreadcrumbList, ListItem, FAQPage, Question, Answer, NewsArticle, WebPage, ImageObject, ContactPoint, PostalAddress | `lib/seo/organization.js` and `lib/seo/identity.js` are the only two files containing `'@type'` |
| **Event / SpecialAnnouncement for closures** | **No** | — |
| `google-site-verification` from an admin setting | Yes. The field accepts the code or the whole `<meta>` tag and strips it | `app/admin/(dash)/settings/page.jsx:287-293`; `app/admin/(dash)/settings/actions.js:186`; published at `lib/seo/settings.js:277` |
| **Any other search engine's verification** | **No.** `rootMetadata` sets `verification.google` only. There is no `msvalidate.01`, no Yandex, no Baidu | `lib/seo/settings.js:277` |
| robots.txt operator-editable, with a pre-launch block | Yes. Two postures, and the admin host is blocked wholesale without a database read | `app/robots.js:30-49`; `lib/seo/settings.js:226-238` |
| **robots.txt disallows `/api/`** | Yes — which also hides the four open-data feeds published under `/api/public/` | `lib/seo/settings.js:100`; feeds listed at `lib/open-data/format.js:15-20` |
| Sitemap generated from the database, degrading rather than 500ing | Yes. Drafts excluded twice, the 404 document excluded, noindex routes removed including templates, the home page and the travel pages guaranteed through an outage | `lib/seo/sitemap.js:77-171`; `app/sitemap.js:39-68` |
| Per-route `noindex` and `canonical` without a deploy | Yes, at `/admin/seo`. The table ships empty, so nothing is hidden today | `lib/seo/route-meta.js:207-234`; `db/sql/10-route-meta.sql` |
| Analytics env-driven, off by default | Yes. Four providers, and a named-but-misconfigured provider renders nothing rather than half a tag | `lib/analytics/config.js:42-115` |
| Consent before GA4 measures anything | Yes. Consent Mode v2 with everything denied is set inline before `gtag.js` loads; Reject is the same weight as Accept; the choice is in `localStorage`, not a cookie | `components/chrome/Analytics.jsx:40-65`; `components/chrome/ConsentBanner.jsx:6-66` |
| **Any analytics event beyond the page view** | **No.** The only `gtag(` calls in the repository are the consent defaults and the consent update | `components/chrome/Analytics.jsx:44-56`; `components/chrome/ConsentBanner.jsx:45` |
| The deploy check catches the silent SEO failures | Yes: unset `SITE_URL`, an unparseable one, a localhost one, `http`, a bare hostname, and an artifact serving an origin it was not built for | `lib/deploy/env-check.js:217-299` |
| Page-weight budget enforced in CI | Yes | `scripts/page-weight.budget.json`; `.github/workflows/ci.yml:129-130` |
| `security.txt` published | Yes | `app/.well-known/security.txt` |
| `llms.txt` | Not present | — |
| RSS or Atom feed for the newsroom | Not present | — |
| Owner department and review date | Stored, editable, and an overdue list exists in the admin — but **not published to the reader**. The public pages show "Last updated", derived from the block records | `db/sql/42-page-review.sql`; `lib/content/page-settings.js:231-235`; `components/blocks/PageHeaderBlock.jsx:20` |

### Two facts worth knowing before anything else

**`ANALYTICS_PROVIDER` is read at build time, not at boot.** The localised pages are prerendered, so whatever the variable says when `next build` runs is baked into the HTML. Changing the provider means a rebuild and a redeploy, not a restart. This is documented at `lib/analytics/config.js:33-39`. `SITE_URL` is the same, and the deploy check refuses to start an artifact against a different origin (`lib/deploy/env-check.js:285-299`).

**The live `robots.txt` may not be the one this app produces.** The audit recorded on 14 September that `robots.txt` on the live host was Cloudflare-managed and carried AI-crawler rules and a `Content-Signal` header that exist nowhere in this repository. If Cloudflare is still serving it, then the operator's choices at `/admin/settings` — including the pre-launch block and the `Sitemap:` line — are not reaching crawlers. This must be checked before launch day. It is item **E13**.

---

## 3. Corrections to the plan

`docs/superpowers/plans/2026-09-06-dhakabypass-master-remediation.md` records W8C.8 and W8C.9 as engineering-done. Four of its claims do not survive a reading of the code. They are not failures of the work that was done; they are items that were listed in the same row as work that was done.

| Plan wording | Reality |
|---|---|
| "localised branded titles" | Descriptions are localised and complete. Titles are localised and **unbranded**. No `title.template` exists. |
| "OG/Twitter cards with per-locale images" | Cards exist on every page. There is one image for all three locales, 686 × 386, and no per-locale default. |
| "enriched Organization, WebSite+SearchAction, BreadcrumbList, FAQPage, **Place**" | The first four are built. `Place` is not in the repository. |
| "`/`→locale 308s" | It is a 307, which is the correct status for a language-negotiated redirect, and the route handler explains why. The plan's number is wrong, the code is right. |

---

## 4. The action register

`E` engineering, `A` account access, `C` content. Priority: **P1** before or on launch day, **P2** in the first 90 days, **P3** thereafter.

### Engineering — 16 items

| # | Action | Where | P |
|---|---|---|---|
| E1 | Add a second verification setting and publish `msvalidate.01` for Bing. Reuse the existing pattern exactly: one key in `SEO_KEYS`, one field, one line in `rootMetadata` | `lib/seo/settings.js:43-62` (keys), `:277` (publish); `app/admin/(dash)/settings/page.jsx:287-293`; `app/admin/(dash)/settings/actions.js:186` | P1 |
| E2 | Brand every title. Add `title: { default, template: '%s — <short name>' }` in the **locale** layout's `generateMetadata`, not in `rootMetadata`, because the admin layout shares `rootMetadata` and must not inherit it. The short name is already resolved | `app/[locale]/layout.jsx:23-26`; short name at `lib/seo/settings.js:208` | P1 |
| E3 | Produce a 1200 × 630 default share image, declare `og:image:width`/`height`, and add `og:locale:alternate` for the other two locales | `lib/seo/social.js:15` (fallback), `:61-71` (the card) | P1 |
| E4 | Emit `Place` JSON-LD for each **open** toll plaza and, once the office address exists, for the head office. The coordinates are already records; nothing needs inventing | new function in `lib/seo/organization.js`; coordinates at `db/sql/01-schema.sql:192-193`; office address key at `lib/settings.js:147` | P2 |
| E5 | Emit `SpecialAnnouncement` for a live advisory and for a planned closure, referencing the Organization node by `@id` | `components/corridor/AdvisoryBar.jsx`; new function beside `lib/seo/organization.js:162` | P2 |
| E6 | A consented event helper plus the twelve events in section 9. One module, called from the components named there | `components/chrome/Analytics.jsx:16-65` is where the provider is known; the components are listed in section 9 | P1 |
| E7 | Let crawlers reach the open-data feeds. `BUILT_IN_DISALLOW` blocks all of `/api/`, so `/api/public/corridor-status`, the two CSVs and the `.ics` are unreachable to any crawler that obeys robots.txt. Narrow the rule, or move the feeds off `/api/` | `lib/seo/settings.js:100`; feeds at `lib/open-data/format.js:15-20` | P2 |
| E8 | Default `noindex` for a list page whose list is empty, and for `/search`. Today `route_meta` ships empty, so `/search`, `/press-releases`, `/consultations`, `/procurement`, `/about/recognition` and `/facilities` are all in the sitemap and all thin | rule belongs in `lib/seo/route-meta.js`; sitemap pushes every published row at `lib/seo/sitemap.js:133-137` | P2 |
| E9 | IndexNow submission on publish, plus the key file under `public/`. See section 8 for whether it is worth it | hook at `app/admin/(dash)/pages-v2/actions.js:65, 102, 158, 188`; new `lib/seo/indexnow.js` | P3 |
| E10 | `revalidatePath('/sitemap.xml')` on a page publish, unpublish or move. The settings action does this (`actions.js:198`); the page actions do not, so a new page waits for the ISR window | `app/admin/(dash)/pages-v2/actions.js:65, 102, 158, 188` | P2 |
| E11 | Publish the reviewed date and the owning department on disclosure, toll and safety pages. Both are already stored and editable; only the render is missing | `lib/content/page-settings.js:24`; render beside `components/blocks/PageHeaderBlock.jsx:20` | P2 |
| E12 | A "Was this page helpful?" block storing aggregate counts only (CON-KPI-02). No free text, no identifiers | new block beside `components/blocks/` | P3 |
| E13 | Establish whether Cloudflare is serving `robots.txt` in production. If it is, either move the AI-crawler rules into `app/robots.js` so one file is authoritative, or record that `/admin/settings` cannot change the live robots.txt | `app/robots.js:30-49` | P1 |
| E14 | Decide `zh` versus `zh-Hans` in hreflang. `hreflang` emits `zh`; `<html lang>` emits `zh-Hans`. Both are valid and the mismatch is harmless, but it will be questioned | `lib/i18n/locales.js:2, 9`; `lib/seo/alternates.js:30-34` | P3 |
| E15 | `Organization.url` and the `WebSite` `@id` point at `/`, which now 307s to a locale. Point them at the canonical English home, or accept and document | `lib/seo/organization.js:119, 130, 148` | P3 |
| E16 | An RSS or Atom feed for `/news`. A press-release programme without a feed cannot be picked up by an aggregator or a journalist's reader | new route beside `app/api/public/` | P3 |

### Account access — 15 items

| # | Action | Notes and register row | P |
|---|---|---|---|
| A1 | A DBEDC-owned Google account that will own Search Console, Business Profile and, if chosen, GA4. Not a staff personal account, not the developer's | register **G7**. Account name unknown — needs DBEDC | P1 |
| A2 | Search Console property created, verified, sitemap submitted. Section 5 is the step-by-step | register **G7** | P1 |
| A3 | DNS access for a TXT record, if a Domain property is chosen instead of a URL-prefix property. Section 5 explains the trade | unknown who holds DNS — needs DBEDC | P1 |
| A4 | Bing Webmaster Tools account, importing from Search Console. Section 6 | not in the register; add it beside G7 | P2 |
| A5 | The analytics account or self-hosted instance, and the three server variables. Section 9 | register **G7** for the account; the variables are the developer's to set | P1 |
| A6 | Google Business Profile owner account, and the head office listing verified. Needs the registered office address and telephone, which are still sample values | register **A3**, **A4**, **A5**, and **S22** of the audit's supply register | P2 |
| A7 | A decision on Business Profile listings for the open toll plazas, and verification for each one kept. Section 10 explains why a plaza is a harder case than an office | register **S22** | P2 |
| A8 | The official Facebook, YouTube, LinkedIn and X handles, confirmed as DBEDC-controlled, so they can be entered as `sameAs`. Section 13 | register **G7**; the four settings keys exist at `lib/settings.js:151-155` | P1 |
| A9 | Wikidata: either a declared conflict-of-interest account, or a commissioned independent editor. Section 11 | register not covered; audit CON-SEO-E-02 | P3 |
| A10 | A decision on contributing OpenStreetMap tags for the plazas. The audit found 19 toll-booth features on the corridor, 17 unnamed and none naming DBEDC | audit CON-SEO-E-01 | P3 |
| A11 | Cloudflare account access, to confirm what `robots.txt` actually serves and to read RUM if it is enabled | needed for **E13** | P1 |
| A12 | The AI-crawler and `llms.txt` policy decision. Section 12 gives the recommendation and the reasoning | audit **S26** | P2 |
| A13 | Repository visibility. The audit found the public GitHub repository ranking first for `"dhakabypass.com"` | register **G4** | P1 |
| A14 | Google Cloud billing and the Routes API key. Without it the live-traffic KPIs and the typical-speed block stay empty, so two of the measurement rows in section 16 cannot be reported | register **G2** | P1 |
| A15 | SMTP credentials. The grievance conversion in section 9 ends in an acknowledgement email that is built but not sent | register **G2a** | P1 |

### Content — 13 items

| # | Action | Where the editor works | P |
|---|---|---|---|
| C1 | Review the description on the nine highest-intent pages so each states the fact the searcher wanted, in that language, under about 155 characters | `/admin/pages-v2` → each page → SEO | P1 |
| C2 | After E2 lands, shorten any title that now reads awkwardly with the brand suffix, and check the two `/zh/disclosures` titles are no longer identical | `/admin/pages-v2` | P1 |
| C3 | Put the Bangla and transliterated terms from section 14 into the body copy and headings of the toll, status, locate and breakdown pages. A Bangla page that only ever says "toll" in English will not match "টোল হার" | `/admin/pages-v2` | P1 |
| C4 | A name-address-phone block on `/contact`, identical word for word to whatever the Business Profile says | register **A4**, **A5** | P2 |
| C5 | Bangla and Chinese names for the interchange records. They carry English only today, which means a Bangla reader sees "Vogra Toll Plaza (RHS)" on a Bangla page | register **I3**, `/admin/corridor/interchanges` | P2 |
| C6 | The reuse terms for the open-data feeds. Until this is written the feeds cannot be cited by anyone | register **I5** | P2 |
| C7 | The press-release programme: a launch release and a monthly cadence, in all three languages | register **F2**, `/admin/news` | P2 |
| C8 | Expand the FAQ to the questions in section 14. The FAQ block already emits FAQPage, so every question added is eligible markup | `/admin/pages-v2` → FAQ | P2 |
| C9 | Owning department and review date on each disclosure, toll and safety page, so E11 has something to publish | `/admin/pages-v2` → page settings | P2 |
| C10 | Text summaries for the four videos. None has a transcript or a Bangla summary | register **F4**, audit CON-SEO-K-01 | P3 |
| C11 | Photographs large enough to be a share card and good enough to be a Business Profile photo. The 32 images carried over from the old site are marked "Too small" | register **F3**, and the media brief | P2 |
| C12 | The concession scorecard rows and the service KPI figures, each with a target, an achieved figure, a unit, an as-at date and a source. The stat-dashboard block requires the as-at date, so a figure cannot be published without one | register **I6**, **E5**; block at `components/blocks/StatDashboardBlock.jsx:20-26` | P2 |
| C13 | Each social profile's bio and website field pointing back at `https://dhakabypass.com`, so the `sameAs` claim is two-way | the platforms themselves | P2 |

---

## 5. Google Search Console

### Choosing the property type

Two kinds exist. Pick **Domain property** if DNS is available, because it covers `http`, `https`, the apex, `www` and every subdomain in one place — which matters here, since `www` redirects to the apex and the admin runs on `admin.dhakabypass.com`. A URL-prefix property covers one exact origin only, and you would need two: one for the apex and one for `www`, so the redirect can be seen working.

A Domain property can only be verified by DNS. A URL-prefix property can be verified by the HTML tag, which is the method this site already supports from the admin.

Recommendation: create the Domain property by DNS, and also create a URL-prefix property for `https://dhakabypass.com` verified by the HTML tag. The Domain property is the one to work in. The URL-prefix property is insurance: if DNS access is ever lost, ownership survives in the admin setting.

### Verifying with the HTML tag, step by step

For the operator. No developer needed.

1. Sign in to `search.google.com/search-console` with the DBEDC account (A1).
2. **Add property** → **URL prefix** → type `https://dhakabypass.com` → **Continue**.
3. In the verification list, open **HTML tag**. Google shows a line like `<meta name="google-site-verification" content="..." />`.
4. Copy the whole line. You do not have to pull the code out of it — the field accepts either the code or the entire tag and keeps only the code.
5. In a second browser tab, sign in to the admin and go to **Settings** → the second form, **Search engines and site identity** → the **Crawling** section.
6. Paste into **Google Search Console verification**.
7. Press **Save SEO settings**.
8. Wait five minutes. The setting is cached and the pages are rebuilt on a tag invalidation; five minutes is the recovery floor.
9. Confirm it is live before you press Verify. Open `https://dhakabypass.com/en`, view the page source, and search for `google-site-verification`. If it is not there, the save did not reach the public pages — do not press Verify yet.
10. Back in Search Console, press **Verify**.

If verification fails, the two usual causes are: the five minutes had not passed, or **Search engine access** in the same admin section is set to **Blocked**. Blocked means `robots.txt` says `Disallow: /` for everything, and Google will not proceed. Set it to **Normal** first.

If Cloudflare is serving `robots.txt` (E13), a Blocked posture in the admin may have no effect at all, and a Normal posture may not either. Confirm what `https://dhakabypass.com/robots.txt` actually returns before concluding anything from the admin screen.

### Verifying with DNS

Search Console gives a TXT record. Whoever holds DNS for `dhakabypass.com` adds it at the zone apex. Propagation is usually minutes and occasionally hours. Nothing in the admin is involved, and nothing about this can be done by the developer without DNS access — hence A3.

### Submitting the sitemap

1. Search Console → **Sitemaps**.
2. Enter `sitemap.xml` and **Submit**.
3. Expect "Success" and a discovered-URL count. The sitemap carries three URLs for every published page, plus three for every published news article. The audit counted 63 pages per locale, which is 189 page URLs before news.

You do not need to submit it more than once. `robots.txt` also advertises it (`lib/seo/settings.js:236`), with one exception worth knowing: when the posture is Blocked, the `Sitemap:` line is deliberately omitted, because a sitemap line beside `Disallow: /` is a contradiction that crawlers resolve unpredictably.

### What to check in the first weeks

| When | Where | What you are looking for | What it means |
|---|---|---|---|
| Day 1 | URL Inspection on `/en`, `/bn`, `/zh` | "URL is on Google" or "URL is not on Google" | Not on Google on day 1 is normal. What matters is that **Crawl allowed: Yes** and **Indexing allowed: Yes**. |
| Day 1 | URL Inspection → the live test → the crawled page | The `google-site-verification` meta, the canonical, the three hreflang links | Confirms Google sees what view-source shows. |
| Day 2-3 | Sitemaps | Discovered URLs, and no read errors | A read error here is usually `SITE_URL` wrong on the server, which the deploy check should already have refused. |
| Week 1 | Pages (the indexing report) | The split between indexed and not indexed | See section 7 for how to read the reasons. |
| Week 1 | Settings → Crawl stats | Response codes | A wall of 308s is expected — the legacy paths and `www`. A wall of 5xx is not. |
| Week 2 | Performance | The first queries the site appears for | Almost always the brand name. If nothing appears, indexation has not started; do not conclude the content is wrong. |
| Week 2 | Experience → Core Web Vitals | Whether there is field data yet | There will not be, until enough real visits accumulate. The audit's lab figures showed LCP 6.2 to 8.2 seconds under emulated slow 4G, so expect this report to open on "Poor" for mobile once it does populate. |
| Week 3 | Enhancements → Breadcrumbs, FAQ | Valid items, and any errors | These come from `breadcrumbJsonLd` and `faqJsonLd`. An error here is a content error — a crumb with no title, a question with no answer — not a markup error. |
| Week 4 | Links | Whether any authoritative site links here | The audit found BIFFL, ADB and the national press write about the corridor without linking to it. That is item C7's real purpose. |
| Week 4 | Manual actions, Security issues | Empty | Anything here is urgent. |

---

## 6. Bing Webmaster Tools

Worth doing, and cheap. Bing is not large in Bangladesh, but it is the index behind DuckDuckGo, behind several in-car and Windows search surfaces, and behind some assistant answers. It also gives an index-coverage view that occasionally shows a problem Google's report does not.

The fast path is **import from Google Search Console**: `bing.com/webmasters` → Import → sign in to the Google account → choose the property. Ownership transfers, sitemaps transfer, and no verification tag is needed.

If import is refused or DBEDC would rather not connect the two accounts, Bing's own HTML-tag method uses `<meta name="msvalidate.01" content="...">`, and **this site cannot publish that tag today**. `rootMetadata` sets `verification.google` and nothing else (`lib/seo/settings.js:277`). That is item **E1**: one more key in `SEO_KEYS`, one more field on the settings screen, one more line in `rootMetadata`. Until E1 lands, Bing verification must go through import or through a DNS record.

Baidu is a separate question. The audit's CON-SEO-B-04 records it as a decision, not a gap: the Chinese-language audience here is SRBG and Shudao staff and Chinese stakeholders, who are a small and reachable group. Recommendation: do nothing about Baidu, and record the decision. If Chinese reach ever matters, the `/zh` sitemap can be submitted to Baidu Ziyuan without any code change.

---

## 7. Reading coverage errors on a trilingual site

The thing to understand first: **every page exists in all three locales, always.** The content fallback is per block and per translation row, so a page whose Bangla translation is missing still renders at `/bn/...` with English content rather than 404ing. `lib/seo/alternates.js:8-20` explains the reasoning. This is correct for hreflang — Google's requirement is that each alternate resolves to a real page, not that it be fully translated — and it shapes every report below.

| Report reason | Expected here? | What to do |
|---|---|---|
| **Page with redirect** | Yes, a lot. Every `www` URL, every legacy path (`next.config.mjs:195-228`), and `/` itself (a 307 to a locale) | Nothing. These are the redirects working. |
| **Alternate page with proper canonical tag** | Yes, for `www` URLs | Nothing. |
| **Duplicate, Google chose a different canonical than user** | Yes, expect it on `/bn` and `/zh` pages whose text is still English | This is a **content** problem, not a tag problem. The three URLs each declare their own canonical correctly. Google is telling you it cannot tell the pages apart because the words are the same. Translate the page, or mark the untranslated locale `noindex` at `/admin/seo`. Do not touch the canonical. |
| **Submitted URL marked noindex** | Should not happen | The sitemap removes any route marked `noindex`, including templates such as `/news/[slug]` (`lib/seo/sitemap.js:77-102`). The one deliberate exception is the home page, which stays in the sitemap even if marked `noindex` (`lib/seo/sitemap.js:96`). If this error names the home page, someone marked `/` noindex; if it names anything else, the sitemap cache is stale — which is what E10 fixes. |
| **Crawled — currently not indexed** | Yes, on the thin pages | `/search`, `/press-releases`, `/consultations`, `/procurement`, `/about/recognition`, `/facilities`. Either fill them (content) or `noindex` them (E8). A search-results page should never have been submitted at all. |
| **Discovered — currently not indexed** | Yes, early on | Crawl budget. It resolves itself as the site gains links. Do not resubmit repeatedly. |
| **Soft 404** | Possibly, on an empty list page | Same fix as thin content. |
| **Not found (404)** | Only if a page was unpublished after being indexed | Expected and harmless. If it is a URL that should exist, check `/admin/redirects`. |
| **Blocked by robots.txt** | Yes, for `/admin` and `/api/` | Expected for `/admin`. **Not** what anyone intended for `/api/public/*`, the four open-data feeds — that is E7. |

### hreflang, in the International Targeting view and in the Pages report

All three locales plus `x-default` are declared on every page, and `x-default` points at `/en` rather than at `/` on purpose — `/` is a language-negotiating redirect, and naming it as the locale-neutral version would be wrong. Because the set of three is emitted identically from a single function, **return tags are symmetric by construction**. If Search Console ever reports "no return tags", the cause is almost certainly not the markup: it is that `SITE_URL` differed between the machine that built the artifact and the host serving it, so one locale's tags name a different origin. `lib/deploy/env-check.js:285-299` exists to refuse that boot, so if you see it, check whether the preflight was skipped.

One cosmetic mismatch to know about before someone reports it as a bug: hreflang emits `zh`, while `<html lang>` emits `zh-Hans` (`lib/i18n/locales.js:2, 9`). Both are valid. Item E14 is to decide which one to standardise on.

---

## 8. IndexNow

**What it is:** a single HTTP request that tells a search engine a URL has changed, instead of waiting for a crawl. One submission is shared between Bing, Yandex, Seznam, Naver and a few others. **Google does not participate.**

**Is it worth wiring here?** Yes, but last. The reasoning both ways:

Against. Google is where essentially all of this site's search traffic will come from, and IndexNow does nothing for Google. The site's content changes slowly: a `pages` row edited now and then, a news item, an advisory. The pages where same-hour freshness genuinely matters — `/travel/status`, `/travel/advisories` — are reached from the home page and from the advisory bar, not from a Bing result. And it adds a network call inside a save action, which is a place where a slow third party becomes an editor's spinning button.

For. The hook already exists. Every save action that changes public content already calls `revalidatePage`, and the settings action already calls `revalidatePath('/sitemap.xml')`, so there is a single obvious place to add one more call. The key file is a static text file under `public/`. The whole thing is about forty lines. And it makes Bing's index of the toll and status pages current, which is the index behind DuckDuckGo and several assistant surfaces.

**Verdict:** implement it as **E9**, at P3, after E1 to E8. Two conditions, both of which matter more than the feature: the call must be fire-and-forget so an editor's save never waits on it, and it must be skipped entirely when `robots_mode` is `block_all`, or a pre-launch site will announce itself.

---

## 9. Consented analytics and the event plan

### Choosing the provider

`ANALYTICS_PROVIDER` accepts `none`, `plausible`, `umami` or `ga4`. `none` is the default and renders no script at all.

| | Plausible or Umami | GA4 |
|---|---|---|
| Cookies and device storage | None | Yes |
| Consent banner required | No | Yes, and the code enforces it |
| What the site does | Loads one small script with the site id | Sets Consent Mode v2 with every storage type **denied** before `gtag.js` loads, then shows the banner |
| Measured before a visitor agrees | Aggregate page views | Nothing |
| Cost | Hosting, or a subscription | Free |
| Data processor | Whoever DBEDC chooses, including DBEDC itself | Google |
| Page weight | One script | `gtag.js` plus the banner, against a CI budget that is already tight |

**Recommendation: Plausible or Umami.** Three reasons specific to this site. First, no banner. A banner on a road-safety site is a full-width panel between a driver on a hard shoulder and the emergency number, and `ConsentBanner` is correctly built so that Reject is as easy as Accept — which means a meaningful share of visitors will refuse and GA4 will measure nothing about them. Second, the page-weight budget is enforced in CI and the audit already measured LCP of 6.2 to 8.2 seconds on emulated slow 4G; `gtag.js` is the largest single script this site would load. Third, a concession company publishing a privacy notice built from a processing inventory has a much shorter conversation about a processor that stores nothing on a visitor's device.

**If DBEDC chooses GA4 anyway**, the code is ready and the consent obligations are already met in the implementation. What DBEDC still owes is on paper, not in code:

- The privacy notice must name Google as a processor, say what is collected, and say how consent is withdrawn. Withdrawal today means clearing site data — `ConsentBanner` stores the choice in `localStorage` under `db-analytics-consent` and offers no way back once answered. If GA4 is chosen, add a "change your choice" control; that is an engineering item to raise then, not now.
- Bangladesh has no GDPR-equivalent in force, so the obligation is not statutory. It is a lender and reputational obligation: the audit's CON-PRIV rows treat the privacy notice as a disclosure document, and a disclosure document that is contradicted by the page it sits on is worse than none.
- IP anonymisation is already set (`components/chrome/Analytics.jsx:55`).

Whichever is chosen: **the variables must be set before the build, not before the boot.** `lib/analytics/config.js:33-39`.

### The event plan

There are no events today. The only `gtag(` calls in the repository are the consent defaults and the consent update. Item **E6** is one small module — read the provider on the server, expose one `track(name, props)` on the client that no-ops when analytics is off or consent was refused — and then the calls below.

Every event below is a real interaction in this codebase, named with its component. **No event carries a phone number, an email address, a tracking number, a message, a coordinate or a free-text query.** A toll-road operator that ships a visitor's grievance text to an analytics processor has created a data-protection incident, not a measurement.

| Event | Fires when | Component | Properties (all low-cardinality) |
|---|---|---|---|
| `toll_quote` | The calculator answers a journey | `components/blocks/TollCalculatorResult.jsx:111` (the form's `change` listener) and the server path in `TollCalculatorBlock` | vehicle class; whether a fare was found or the pair is unpriced. **Not** the plaza pair, which is close to a route history |
| `toll_quote_unavailable` | The pair or class has no published rate | `components/blocks/TollCalculatorBlock.jsx` | vehicle class |
| `request_submitted` | A service request succeeds and shows its tracking number | `components/requests/RequestForm.jsx:24` | request kind (grievance, toll dispute, breakdown, lost and found). **Never** the tracking number |
| `request_status_checked` | The status lookup returns | `components/blocks/RequestStatusBlock.jsx` | found or not found |
| `alert_signup` | The alerts form succeeds | `components/alerts/AlertSignup.jsx:12` | channel (`sms` or `whatsapp`); subscribe or unsubscribe |
| `newsletter_signup` | The newsletter form succeeds | `components/newsletter/NewsletterSignup.jsx:16` | — |
| `contact_submitted` | The contact form succeeds | `components/contact/ContactForm.jsx:28` | — |
| `document_download` | A document link that is a file, not a page, is followed | `components/blocks/DocumentListBlock.jsx:59` | the document's stated format (`PDF`, `XLSX`); the page path |
| `camera_watch` | A viewer presses play on a live stream | `components/cameras/CameraTile.jsx:80` | camera name |
| `kmpost_located` | The finder returns a position | `components/blocks/KmFinderLocate.jsx:48` and the server path in `KmFinderBlock` | whether the position came from the browser or from typed coordinates. **Not** the coordinates |
| `emergency_tel_tap` | An emergency number link is followed | `components/contact/EmergencyNumbers.jsx:19` | which number (control room or national). This is the single most important number on the site and nothing counts it today |
| `page_shared` | The share button is used | `components/blocks/PrintShare.jsx:26` | whether the native share sheet or the clipboard fallback was used |

Site search is deliberately **not** an event. `/search` puts the query in the URL (`components/blocks/SiteSearchBlock.jsx:29`), so Search Console's own reports and the server access log already hold it, and sending a free-text query to an analytics processor is the kind of thing that turns out to contain somebody's vehicle registration.

Both cookieless providers support custom events with properties. GA4 does too. Nothing in this plan depends on the provider.

---

## 10. Google Business Profile

### The head office

This is a normal Business Profile and should be done first.

What is needed, and none of it exists yet:

| Field | Status |
|---|---|
| Business name | "Dhaka Bypass Expressway Development Company" — settled, `lib/seo/organization.js:79` |
| Category | A decision. "Toll road" and "Corporate office" both exist in Google's list; the office is the latter |
| Address | **unknown — needs DBEDC.** Register **A4**. The site currently shows "Level 8, Sample Tower, Gulshan Avenue, Dhaka 1212", labelled Sample |
| Telephone | **unknown — needs DBEDC.** Register **A3** |
| Opening hours | **unknown — needs DBEDC.** Register **A4** |
| Website | `https://dhakabypass.com` |
| Photographs | Register **F3** and the media brief. The carried-over images are marked "Too small" |

Verification is by postcard, phone or video call, and requires someone at the address. That is why A6 is account access and cannot be done by the developer.

**The name, address and telephone must be byte-identical between the Business Profile, the `/contact` page (item C4) and the `PostalAddress` in the Organization JSON-LD.** The JSON-LD reads the same settings as the page (`lib/seo/identity.js:146`, `lib/settings.js:147`), so filling the admin once feeds both. Mismatched NAP is the single most common reason a local listing underperforms.

### The toll plazas

Harder, and worth being honest about. A toll plaza is not a business location in Google's sense — nobody visits it as a destination, it has no opening hours, and it may not survive a category review. Two workable approaches:

1. **Do nothing in Business Profile, and fix the map data instead.** The audit's OpenStreetMap query over the corridor found 19 `barrier=toll_booth` features: 17 unnamed, two named "Tole Plaza", none carrying `operator`. Nominatim returns nothing for "Dhaka Bypass toll plaza". Correcting `name`, `operator=DBEDC` and `ref=N105` in OSM reaches every OSM-based app, including the ones Bangladeshi drivers actually use, and needs no verification from anybody (item A10).
2. **Claim a listing per open plaza**, each with a service-desk phone. This only makes sense where there really is a staffed desk a driver can walk up to. It should not be attempted for a plaza that is still under construction.

As the seeded corridor records stand, nine `toll_plaza` rows exist; five are `open` (Vogra RHS and LHS, Mirer Bazar A, RHS and LHS) and four are `construction` (Purbachal and the K34, K36 and K46 sites) — `db/sql/02-seed.sql:530-538`. The live database is authoritative; check `/admin/corridor/interchanges` before acting. Only the open ones should be listed anywhere.

Every plaza already has latitude and longitude in the records (`db/sql/01-schema.sql:192-193`). What they do **not** have is a Bangla or Chinese name — register **I3**. A Business Profile in Bangladesh with an English-only name is a listing a Bangla-speaking driver will not match.

**Recommendation:** A10 before A7. Fix OSM first, claim the office, and treat plaza listings as optional. The engineering half of this — `Place` JSON-LD with `geo` for each open plaza (item **E4**) — is worth doing regardless, because it is generated from records that already exist and it is what lets a search engine associate a plaza name with a point on the corridor without anyone claiming anything.

---

## 11. Wikidata and the knowledge panel

The audit found the Wikidata item for the corridor, `Q114081230`, carrying only "instance of" and "country". No official website (P856), no operator (P137), no owner (P127), no length (P2043), no opening date (P1619).

This matters more than it looks. Knowledge panels and assistant answers draw on Wikidata, and an item with no official website is an item that cannot point anyone at DBEDC's own figures. The audit's CON-SEO-H-02 catalogues what fills the vacuum instead: the corridor's length appears in public sources as 48, 35 and 47.6 km, its shareholding as 60/30/10 and 70/30, its cost as US$412 m and US$358.83 m, and its opening date in four versions. Whichever of those an answer engine finds first is the one the public gets.

**What to do, in order:**

1. Add **P856 official website** = `https://dhakabypass.com`. This is the single highest-value statement and it needs no figure DBEDC has not confirmed.
2. Add **P137 operator** = the DBEDC item, creating it if it does not exist, referenced to the site's own governance page.
3. Leave P2043 (length), P127 (owner), P1619 (opening date) and the financial figures alone until the register's **D1** and **D4** rows are settled. Adding a figure to Wikidata that DBEDC later corrects is worse than leaving the field empty, because the wrong figure will have been mirrored by then.

**Who may edit.** Wikidata and Wikipedia both have conflict-of-interest rules. Someone paid by or working for DBEDC must declare the connection on their user page and should not make contentious edits directly. Adding an official website to a company's own item is uncontentious and normally accepted with a declaration. Rewriting the Wikipedia article is not. Item **A9** is either a declared account or a commissioned independent editor; the honest version of this task is "supply sourced facts and let an independent editor use them", which also happens to be what item C7's press releases are for.

---

## 12. `llms.txt` and the AI-crawler policy

`/llms.txt` does not exist in this repository. The audit recorded that the live `robots.txt` — Cloudflare-managed, not this app's — disallows `ClaudeBot`, `GPTBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `meta-externalagent`, `Amazonbot` and `Bytespider`, and sends `Content-Signal: search=yes,ai-train=no,use=reference`.

**Recommendation: publish `llms.txt`, and change the crawler policy to allow retrieval of `/travel/*` and `/disclosures/*` while keeping training disallowed.**

The reasoning for:

- This site publishes prices and safety information. When an assistant is asked "what is the toll on the Dhaka Bypass" or "what number do I call if I break down", it answers from whatever it can read. Today it cannot read this site, so it answers from press coverage and Wikipedia — the same sources the audit shows carrying four different opening dates and two different shareholdings. A safety-information operator normally wants to be the grounding source for questions about its own road.
- `Content-Signal: use=reference` already says retrieval for reference is acceptable. The `robots.txt` blocks contradict it. One of the two should change, and the signal is the one that reflects what DBEDC would actually want.
- The cost is one static file and a policy line. There is no ongoing obligation.

The reasoning against, which should be recorded rather than dismissed:

- `llms.txt` is a convention, not a standard. No major engine has committed to reading it. It may be ignored entirely.
- A second hand-maintained index of the site is a second thing to go stale. The audit's whole CON-BRAND section is about figures that disagreed with each other because they were written down twice.

Both objections point at the same implementation rule: **generate `llms.txt` from the route list the sitemap already uses, not by hand.** `lib/seo/routes.js` and `lib/seo/pages.js` already know every public URL. A generated file cannot drift. If it turns out nobody reads it, a generated file has cost nothing.

What it should list: the home page, `/travel/toll`, `/travel/status`, `/travel/route`, `/travel/locate`, `/travel/breakdown`, `/about/concession`, `/disclosures`, `/disclosures/tariff`, `/disclosures/open-data` and the four feeds — each with one line of description. It should **not** list the whole site.

Note the dependency: the open-data feeds are the most useful thing an assistant could be pointed at, and `robots.txt` currently forbids all of `/api/` (item **E7**). Pointing `llms.txt` at a URL that `robots.txt` blocks is the kind of contradiction that makes both files ignored.

The decision itself is **A12**, and the audit's supply register already asks for it as **S26**.

---

## 13. Social profiles and `sameAs`

The machinery is finished and empty. Four settings keys exist — `social.facebook`, `social.youtube`, `social.linkedin`, `social.x` (`lib/settings.js:151-155`) — the admin has a field for each (`app/admin/(dash)/settings/page.jsx:130-142`), and anything entered is published as `sameAs` in the Organization JSON-LD. Two guards are worth knowing: only `https://` URLs are published (`lib/settings.js:214`), and the array is filtered again before it reaches the JSON-LD (`lib/seo/organization.js:133`). Nothing is ever guessed, because `sameAs` is an identity claim and a guessed one links DBEDC to an account it may not control.

So this is entirely **account access** (A8) and **content** (C13). The register covers it at **G7**.

What DBEDC needs to do:

1. Establish which accounts are genuinely DBEDC's. The audit could not verify any official handle. If a page exists that DBEDC does not control, that is an impersonation matter before it is a marketing one.
2. Claim the handles on the platforms that matter here. Facebook first, by a wide margin — the audit's reasoning for share cards is that Facebook and WhatsApp are the dominant sharing channels in Bangladesh, and a closure notice spreads there or nowhere. YouTube second, because the four broadcast clips currently embedded belong to other publishers. LinkedIn for the lender and stakeholder audience. X is optional.
3. Enter each URL at **Settings → Official accounts** and save. `sameAs` then appears on every page, in all three locales.
4. On each profile, set the website field to `https://dhakabypass.com` (item C13). `sameAs` is a claim the site makes about the profile; the profile's link back is what makes it two-way, and two-way is what the audit's CON-SEO-F-02 asks for.

Once a verified handle exists, `twitter:site` becomes worth adding to the share card (`lib/seo/social.js:71`). Until then, leaving it out is correct.

---

## 14. Keywords and content targeting

### What a driver actually searches for

Four intents, in order of volume and of consequence. A toll-road site that answers these four well needs very little else.

| Intent | The question behind it | The page that must win | Verdict today |
|---|---|---|---|
| **Price** | "what will this journey cost me" | `/travel/toll` and the calculator on it | The page exists and the calculator answers from the query string with no JavaScript, which is exactly right for a phone on mobile data. Its `<title>` is "Toll rates", with no corridor name and no operator name. That is item **E2**, and it is the highest-value engineering fix in this document. |
| **Place** | "where is the plaza / where am I" | `/travel/route`, `/travel/map`, `/travel/locate` | Records are complete with coordinates. No `Place` markup (E4), English-only plaza names (C5), and the plazas are unnamed in OSM (A10). |
| **Now** | "is it moving / is it open" | `/travel/status`, `/travel/advisories` | Built, self-refreshing every two minutes, and blocked on the Routes API key (**A14**). No `SpecialAnnouncement` markup (E5). |
| **Help** | "I have broken down / who do I call" | `/travel/breakdown`, `/contact`, and the footer on every page | `tel:999` is on every URL. The control-room number is still a sample value (register **A1**/**I1**), and no event counts a tap on it (E6). |

Everything else — governance, procurement, sustainability, the disclosure library — is read by lenders, journalists and RHD, not by drivers, and it is found by brand and document-name searches rather than by category searches. It does not need keyword work. It needs the reviewed-date and owner metadata of items E11 and C9, because that audience judges a document by whether anyone owns it.

### English

Realistic query forms, matched against the pages that exist:

- `dhaka bypass toll rate` · `dhaka bypass expressway toll` · `dhaka bypass toll chart` → `/travel/toll`
- `vogra toll plaza` · `mirer bazar toll plaza` · `purbachal toll plaza` → `/travel/route`, and a `Place` node per plaza
- `dhaka bypass expressway open` · `dhaka bypass how much open` → `/travel/status`
- `dhaka bypass traffic now` · `dhaka bypass jam` → `/travel/status`
- `dhaka bypass expressway map` · `joydebpur to madanpur expressway` → `/travel/map`
- `dhaka bypass breakdown number` · `dhaka bypass emergency number` → `/travel/breakdown`
- `dhaka bypass motorcycle allowed` → `/travel/rules` and the prohibited-vehicles block
- `dbedc` · `dhaka bypass expressway development company` → the home page and `/about`
- `dhaka bypass toll notification` · `dhaka bypass sro` → `/disclosures/tariff`

Note the competitor the audit identified: Dhaka Elevated Expressway pages rank for several of these. The differentiator is the corridor name plus the operator name in the title, which is E2.

### Bangla

Bangla is the language most of this audience searches in, and it is searched in two written forms. Both must appear in the copy.

**Bangla script.** Terms already used on the site, which the content should use consistently rather than inventing synonyms for:

- টোল হার — toll rate. Already the `/bn/travel/toll` title.
- টোল প্লাজা — toll plaza.
- ঢাকা বাইপাস — Dhaka Bypass. The site writes the corridor name in Latin script on Bangla pages; a Bangla searcher will type it in Bangla script. **Both forms need to appear in the body copy** (item C3).
- এক্সপ্রেসওয়ে — expressway. মহাসড়ক — highway.
- যানজট — traffic congestion.
- কী খোলা আছে — what is open. Already the `/bn/travel/status` title.
- সড়ক বিধি — rules of the road. Already the `/bn/travel/rules` title.
- Place names in Bangla script: ভোগরা, মীরের বাজার, পূর্বাচল, গাজীপুর, মদনপুর, জয়দেবপুর. These are register item **I3** in the interchange records and item C3 in the page copy.
- Natural phrasings worth having in an FAQ answer: "টোল কত টাকা", "টোল প্লাজা কোথায়", "এখন যানজট আছে কি".

**Transliterated Bangla in Latin script.** A very large share of Bangladeshi mobile search is typed this way, because switching keyboards on a phone is friction. These forms cannot be forced into headings without making the page read badly, which is precisely what an FAQ block is for — a question can be phrased the way a person types it:

- `dhaka bypass toll koto` · `toll koto taka`
- `bhogra toll plaza` (also spelled `vogra`, `bhogra`, `bogra` — the last is a different city, and that ambiguity is a real risk on this corridor)
- `mirer bazar toll plaza` · `purbachal toll plaza`
- `dhaka bypass kobe khulbe` — when will it open
- `dhaka bypass jam`

Each of these is a legitimate FAQ question in Bangla with a transliterated variant named in the answer. The FAQ block already emits `FAQPage` markup (`components/blocks/FaqBlock.jsx:23-27`), so every question added is eligible for an answer feature at no extra engineering cost. That is item **C8**, and it is the cheapest content win available.

### Chinese

The `/zh` audience is SRBG and Shudao staff, Chinese stakeholders and the lender side. Small, specific, and mostly arriving by brand or by link rather than by category search. The site already uses 通行费 (toll), 通车路段 (open sections), 路线与互通 (route and interchanges), 通行规则 (rules) and 信息公开 (information disclosure) — these are the right terms and should not be changed. Two concrete items: the `/zh/disclosures` and `/zh/disclosures/right-to-information` titles were identical at audit (both 信息公开) and should be distinguished (item C2), and the corridor name is left in Latin script throughout, which is a defensible choice for a proper noun and should simply be recorded as one.

### The rule that matters more than any keyword

The audit's CON-SEO-C-01 recommendation is the right shape for every one of these pages: the description should state the fact the searcher wanted, not describe the page. "Toll rates for the Dhaka Bypass Expressway" describes a page. A description naming the vehicle class, the amount, the section it applies to and the date it came into force answers a question — and every one of those facts is already a record in the database with a citation field beside it. That is item **C1**, and it has to wait on the register's **C1** row, the real S.R.O., because a description quoting a sample figure is worse than a vague one.

---

## 15. Launch-day checklist

Run in order. Items marked **[stop]** should block the launch.

**Before the switch**

1. **[stop]** `SITE_URL=https://dhakabypass.com` in the app environment, and the artifact was built with that same origin. The preflight refuses a mismatch (`lib/deploy/env-check.js:285-299`); do not skip the preflight to get past it.
2. **[stop]** `node preflight.mjs` on the server reports no problems. Warnings may be accepted knowingly.
3. **[stop]** Decide the analytics provider **now**, because it is baked at build time. If GA4 or a cookieless provider is wanted from day one, `ANALYTICS_PROVIDER`, `ANALYTICS_SITE_ID` and, for the self-hosted providers, `ANALYTICS_SCRIPT_URL` must be set **before** the build. Otherwise launch with `none` and accept that turning it on means another release.
4. **[stop]** Fetch `https://dhakabypass.com/robots.txt` and read it. Confirm it is the app's output — `Allow: /`, `Disallow: /admin`, `Disallow: /api/`, and a `Sitemap:` line — and not Cloudflare's managed file. If it is Cloudflare's, item E13 is now a launch blocker, because the admin's Blocked/Normal switch is not reaching anybody.
5. **[stop]** `/admin/settings` → **Search engine access** is **Normal**. Nothing in the seed sets Blocked, so the default is already Normal; confirm rather than assume.
6. Fetch `https://dhakabypass.com/sitemap.xml`. Confirm the origin in the URLs is the production one, that `/en`, `/bn` and `/zh` are present, and that no `localhost` appears anywhere.
7. Fetch `https://admin.dhakabypass.com/robots.txt`. It must be `Disallow: /` with no `Sitemap:` line.
8. View-source on `/en`, `/bn` and `/zh`. Confirm: a `<title>`, a `<meta name="description">`, three `hreflang` links plus `x-default`, a canonical, `og:image` resolving to an absolute URL, and the Organization and WebSite JSON-LD blocks.
9. `https://www.dhakabypass.com/en` returns a permanent redirect to the apex. `https://dhakabypass.com/` returns 307 to a locale with `Cache-Control: no-store`.
10. Spot-check four legacy paths from `next.config.mjs:195-228`, including one with a trailing slash. Each should be a single hop to its final destination, not a chain.
11. **[stop]** The emergency number on the footer of a random page is DBEDC's real control-room number, not the sample. Register **A1**. This is the one content item that is a safety matter rather than an SEO one.
12. Paste `https://dhakabypass.com/bn/travel/toll` into a WhatsApp chat with yourself. A card with a title, a description and an image should appear. If the image is missing or tiny, that is item E3 and it is worth fixing before anyone shares a closure notice.

**On the day**

13. Verify the Search Console property (section 5) and submit `sitemap.xml`.
14. Request indexing through URL Inspection for exactly six URLs: `/en`, `/bn`, `/zh`, `/en/travel/toll`, `/bn/travel/toll`, `/en/travel/status`. Do not submit more; the quota is small and the sitemap covers the rest.
15. Import the property into Bing Webmaster Tools (section 6).
16. Enter the confirmed social handles at **Settings → Official accounts** (A8), and check `sameAs` appears in the page source.
17. If analytics is on, open the site in a private window and confirm a page view arrives. For GA4, confirm that **nothing** arrives until Accept is pressed.
18. Record the launch date, the artifact's build origin, the analytics provider and the Search Console property type in the deployment notes. Every question in the first quarter will start with one of those four.

---

## 16. The first 90 days

### Days 1 to 7 — confirm the site is readable

| Do | Class | Ref |
|---|---|---|
| Watch Search Console daily for Manual actions, Security issues and sitemap read errors. Nothing else in the first week is a signal | account access | A2 |
| Ship E2 (title template) and E3 (share image). Both are small, both affect every one of the 189 URLs, and both are cheapest to do before anything is indexed under the old form | engineering | E2, E3 |
| Ship E1 if Bing verification could not be imported | engineering | E1 |
| Resolve E13 one way or the other | engineering, account access | E13, A11 |
| Fill the control-room number, the office address, the telephone and the hours | content, account access | A1, A3, A4 of the register |

### Weeks 2 to 4 — make the high-intent pages answer the question

| Do | Class | Ref |
|---|---|---|
| Rewrite the descriptions on the nine highest-intent pages so each states a fact, once the real S.R.O. is available | content | C1 |
| Add the Bangla-script and transliterated forms to the toll, status, locate and breakdown copy | content | C3 |
| Expand the FAQ to the questions in section 14. Highest return per hour of anything in this document | content | C8 |
| Ship E6, the event plan. Until it lands, nothing can be said about whether anyone uses the calculator | engineering | E6 |
| Ship E8 and E10, so the thin pages leave the index and a new page reaches the sitemap promptly | engineering | E8, E10 |
| Claim the social handles and set each profile's website field | account access, content | A8, C13 |
| Read the first Performance report. Expect brand queries only | account access | A2 |

### Weeks 5 to 8 — the physical world and the machine-readable world

| Do | Class | Ref |
|---|---|---|
| Business Profile for the head office, verified | account access | A6 |
| Fix the OSM tags for the open plazas | account access | A10 |
| Ship E4, `Place` for the open plazas and the office | engineering | E4 |
| Ship E7, so the open-data feeds are reachable, then E5 for advisories | engineering | E7, E5 |
| Bangla and Chinese names for the interchange records | content | C5 |
| Write the open-data reuse terms. Until then the feeds cannot be cited | content | C6 |
| Add P856 to the Wikidata item | account access | A9 |
| Settle the AI-crawler and `llms.txt` policy; if allowed, generate `llms.txt` from the route list | account access, engineering | A12 |
| First press release, in three languages, and the approach to BIFFL, RHD, PPPA and SRBG asking them to link the official site | content | C7 |

### Weeks 9 to 13 — governance and the second-order work

| Do | Class | Ref |
|---|---|---|
| Ship E11, and fill the owner and review date on every disclosure, toll and safety page | engineering, content | E11, C9 |
| Publish the first quarterly KPI figures, each with an as-at date and a source | content | C12 |
| Read the first Core Web Vitals field data. If mobile LCP is Poor, as the lab figures suggest, that is a separate piece of work: fonts, critical CSS, and the map route | account access | A2 |
| Video summaries and transcripts | content | C10 |
| Ship E9 (IndexNow), E12 (page feedback), E16 (news feed) | engineering | E9, E12, E16 |
| Decide E14 and E15 | engineering | E14, E15 |
| Review the whole register. Anything still open after 90 days is either blocked on DBEDC or was not worth doing | — | — |

---

## 17. Measurement cadence and KPIs

The KPIs are the ones W8C.7 already names, from the audit's CON-KPI-01 and CON-KPI-02. They are not invented here, and they are not analytics metrics — they are service metrics that happen to be measurable.

### The service KPIs

| KPI | Source of truth | Published where |
|---|---|---|
| Grievances received and resolved | `service_requests` | a stat-dashboard block, quarterly |
| Percentage resolved within the published deadline | `service_requests` against the citizen-charter deadlines | same |
| Toll disputes raised, and refunds made | `service_requests`, kind = toll dispute | same |
| RTI requests received and answered | `service_requests` | same |
| Incident response times | operations, not in the database | needs DBEDC |
| Alert subscribers | the subscribers table | internal, not published |
| Traffic volumes by plaza, by month | `traffic_monthly` | `/disclosures/reports`, and the CSV feed |
| Page helpfulness | item E12, once built | internal |

Two honest caveats. The stat-dashboard block is **authored**, not fed from the tables: an editor types each figure with its as-at date and its source (`components/blocks/StatDashboardBlock.jsx:20-26`). That is a deliberate choice — a figure a lender may quote should pass through a person — but it means the quarterly publication is a content task every quarter, not an automatic one. Automating it from `service_requests` is a reasonable future engineering item; it is not in the register because nobody has asked for it. And the traffic figures stay sample until register row **E5** is filled, which is why the monthly CSV currently carries `source=sample`.

### The search and site KPIs

| Cadence | Look at | Act when |
|---|---|---|
| **Weekly, 10 minutes** | Search Console: Manual actions, Security issues, sitemap status, and the indexed-page count | Any manual action, any security issue, any sitemap read error, or the indexed count falling |
| **Weekly** | Analytics: page views for `/travel/toll`, `/travel/status`, `/travel/locate`, `/travel/breakdown` | A sustained fall on `/travel/status` usually means the live feed broke, not that interest dropped. Check the Routes key |
| **Monthly, 1 hour** | Search Console Performance: clicks, impressions and average position, split by the `/en`, `/bn` and `/zh` path prefixes | The Bangla prefix underperforming the English one on a corridor in Bangladesh is the signal that item C3 has not been done |
| **Monthly** | Search Console Pages: the not-indexed reasons, read with section 7 | A new reason appearing that section 7 does not explain |
| **Monthly** | The conversion events from section 9: `toll_quote`, `request_submitted` by kind, `alert_signup`, `emergency_tel_tap`, `document_download` | `toll_quote_unavailable` rising means the matrix has gaps a driver is hitting. That is a toll-record task, not a web task |
| **Monthly** | A brand search for `"dhakabypass.com"` and for "Dhaka Bypass Expressway" | A non-official property ranking above the official site. The audit found the public GitHub repository doing exactly that — register **G4** |
| **Quarterly** | Core Web Vitals, and the CI page-weight budget history | Mobile LCP in the Poor band, or a budget raised in a diff without a reason beside it |
| **Quarterly** | The overdue-review list in the admin | Anything overdue on a disclosure, toll or safety page |
| **Quarterly** | Publish the service KPIs above | — |
| **Annually** | Re-run the concession-domain audit's SEO sections A to K against the live site | — |

### What not to measure

Rankings for individual keywords, measured by hand. They vary by device, by location and by personalisation, and Search Console's average position already answers the question with real data. Sessions and bounce rate as targets: a driver who arrives on `/travel/toll`, reads one number and leaves has been served perfectly, and any metric that calls that a failure will push the site in the wrong direction.
