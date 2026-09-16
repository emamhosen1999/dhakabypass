# Navigation and responsive chrome audit — dhakabypass.com

**Date:** 2026-09-16
**Scope:** the global header, primary navigation, footer and wayfinding of the public site, in `en`, `bn` and `zh`.
**Method:** live production (`https://dhakabypass.com`, current as of today) measured in a Chromium browser at 19 viewport widths, 3 landscape sizes, and 200% / 400% zoom; cross-read against the source at `C:\laragon\www\dhakabypass`.
**Constraint observed:** no file in the repository was modified except this report.

---

## 1. Executive summary

The chrome on this site is unusually well built for its class. It is a **flat, seven-item primary navigation with no dropdowns, no disclosure menu and no JavaScript dependency for any destination**. That single decision eliminates most of the failure modes this kind of audit normally finds: there is no hamburger that fails to close on navigation, no scroll-lock bug, no focus trap, no menu that occludes content, no hover-only submenu, and no link that disappears at a particular width. Every one of the 8 primary destinations and 35 footer destinations is present in the DOM and tappable at every width from 320px to 2560px. Measured tap targets under `@media (pointer:coarse)` are 44×44 or larger without exception. Chrome text contrast passes WCAG AA in **both** light and dark themes at every element measured, with a floor of 4.70:1. Cumulative layout shift attributable to the chrome is 0.0075. Every navigation label, every footer column, the header button and the footer policy bar are editable per language at `/admin/menus`, backed by an override-never-replace rule that means a database outage cannot empty the navigation. Those are real achievements and this report does not ask for them to be changed.

The problems are of three kinds.

**First, a height budget that the layout pays for its own robustness.** Because nothing is hidden behind a control, everything is on screen all the time. On a real touch phone at 360px the header is **340 CSS pixels tall — 46% of a 740px viewport** before a single word of content. The footer is **2,109px tall at 320px**, more than twice the 900px the brief asks about. On a landscape phone (667×375) the header is 43% of the screen. Nothing overlaps, nothing clips, nothing scrolls sideways — the layout is mechanically correct at every width tested — but on a phone the reader is paying for a navigation bar the size of a half-page advertisement on every page load.

**Second, the emergency number is not where the brief requires it.** `999` and the DBEDC control-room line are real `tel:` links with 44px targets and 13.77:1 contrast, but they sit in the footer. On the home page at 360×740 the `999` link is at y=10,001 of a 10,191px document — **13.5 screens of scrolling**. The brief's requirement is one tap on every page. It is currently thirteen-and-a-half screens plus a tap.

**Third, the information architecture stops at the top level.** Six sections are exposed in the header, but only one of them (`/travel`) has a section sub-navigation. `/en/disclosures` — the page a lender, a regulator or a journalist lands on from a search result — contains exactly two links in `<main>`, neither of them to any of its own eight children. `/en/media` contains zero. Twelve published pages, including `/travel/breakdown`, `/travel/toll-dispute`, `/travel/lost-found`, `/disclosures/reports`, `/disclosures/environment` and `/press-releases`, are reachable from no navigation at all — only from `/sitemap` and `/search`. And the block that renders a section sub-nav is restricted in code to a single menu, so an editor cannot fix this without a developer.

**Overall score: 73 / 100.**

| Domain | Score | One-line verdict |
|---|---|---|
| NAV-IA | 62 | Good top-level choices; the second level barely exists and 12 pages are orphaned. |
| NAV-LABEL | 78 | Plain language, consistent across three languages, never truncates; one label lies about its destination. |
| NAV-HEADER | 58 | Everything editable and legible, but no emergency number, no search field, and a 340px height on a phone. |
| NAV-PRIMARY | 88 | Flat, keyboard-clean, correct `aria-current`, visible focus, no trap. Close to exemplary. |
| NAV-MOBILE | 64 | No disclosure menu means no disclosure-menu bugs; the cost is half the viewport. |
| NAV-RESPONSIVE | 82 | Mechanically flawless at all 19 widths + zoom; proportionally wrong in two bands. |
| NAV-FOOTER | 66 | Well-chosen link map, correct contrast and targets; 2,109px tall on a phone. |
| NAV-WAY | 55 | No breadcrumbs despite emitting BreadcrumbList JSON-LD; one section sub-nav out of six; a 404 in the site map. |
| NAV-I18N | 80 | Genuinely trilingual and typographically careful; the remembered-language cookie is defeated by an HTTP cache. |
| NAV-A11Y | 86 | Landmarks, skip link, labels, contrast in both themes — all correct. Small gaps only. |
| NAV-PERF | 84 | CLS 0.0075, no sticky repaint, server-rendered chrome, four small client components. |
| NAV-CMS | 79 | Five editable menus with per-locale labels and history; three lists still hardcoded. |

**Findings: 1 × P0, 10 × P1, 15 × P2 (26 total).**

---

## 2. The explicit question: is the header / nav / footer 100/100 responsive at every device size?

**No — but the failure is not the one the question usually uncovers.**

On the mechanical tests, the answer *is* 100/100. Across nineteen widths from 320 to 2560, in portrait and in three landscape sizes, in all three languages, and at 200% and 400% browser zoom:

- **horizontal page scroll: 0px at every width.** `document.scrollWidth - document.clientWidth` measured 0 in every single case.
- **chrome elements extending past the viewport: 0 at every width.** Every descendant of `.db-header` and `.db-footer` was measured with `getBoundingClientRect()`; none had `right > clientWidth` or `left < 0` (excluding `.db-skip`, which is correctly parked off-screen at `left:-9999px` until focused).
- **clipped or truncated labels: 0 at every width, in all three languages.** Every header and footer link, button and heading was tested for `scrollWidth > clientWidth`. No element is ever narrower than its content. `white-space:nowrap; flex:none` on `.db-nav-link` (design-tokens.css:344) guarantees a label keeps its own line and the row wraps *between* links, never inside one.
- **side gutters preserved at every width.** `.db-header-inner` uses `padding: 14px clamp(12px,3vw,20px)`; the brand's left edge measured 12px at 320, 13px at 430, 20px from 768 up.
- **WCAG 1.4.10 reflow passes.** At 1280 with 200% zoom and with 400% zoom, `scrollWidth === clientWidth` and no chrome element exceeded the layout width. At a 320 CSS-pixel width (the real-browser equivalent of 1280 at 400% zoom, where the `min-width:768px` media query correctly drops to the compact row) the same holds.

So no width *fails* in the sense of breaking. What fails is **proportion**, in two bands:

- **320–430px (phones).** The header is 244–280px measured with a mouse pointer, and **340px on a real touch device** once `@media (pointer:coarse){min-height:44px}` (design-tokens.css:202-206) applies — verified by injecting that exact declaration and re-measuring. That is 46% of a 740px viewport and 53% of a 640px one. Within that stack, the light/dark/system theme toggle occupies an entire full-width row *above* the navigation, because `.db-header-utils{width:100%}` below 480px (design-tokens.css:358-360) places it before `.db-nav-mobile` in source order.
- **768–1010px (tablets, landscape phones, small laptop windows).** The desktop nav fits on one line here, but `.db-header-utils` wraps to a third row, giving a **166px header** against 116px at 1024 and above. On a 844×390 landscape phone that is 43% of the screen. Evidence: `.playwright-mcp/nav-844-landscape.png`.

The footer compounds it: **2,109px at 320px**, 2,056px at 360–430, 1,231px at 480, 1,107px at 768, settling to 758px at 1024 and above. The brief asks whether a 900px footer is appropriate on a small screen; the real number on a small screen is 2.3× that.

**Verdict: the chrome is 100/100 on correctness and roughly 70/100 on appropriateness. No width needs a bug fix; two bands need a height budget.**

### 2.1 Per-width results

Measured on `https://dhakabypass.com/en`. `client` is `document.documentElement.clientWidth` — the test browser reserves a 15px classic scrollbar, so every row was in fact tested ~15px *narrower* than the nominal viewport, which makes these results conservative. "Chrome overflow" counts elements in `.db-header`/`.db-footer` whose box extends past the viewport. "Clipped" counts elements whose text overflows its own box.

| Viewport | client | H-scroll | Header h | Footer h | Nav mode | Nav rows | Footer cols | Chrome overflow | Clipped | Gutter | Result |
|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| 320 | 305 | 0 | 280 (340 touch) | 2109 | compact | 3 | 1 | 0 | 0 | 12px | PASS (height P1) |
| 360 | 345 | 0 | 280 (340 touch) | 2056 | compact | 3 | 1 | 0 | 0 | 12px | PASS (height P1) |
| 375 | 360 | 0 | 280 | 2056 | compact | 3 | 1 | 0 | 0 | 12px | PASS (height P1) |
| 390 | 375 | 0 | 244 | 2056 | compact | 3 | 1 | 0 | 0 | 12px | PASS (height P1) |
| 412 | 397 | 0 | 244 | 2056 | compact | 3 | 1 | 0 | 0 | 12px | PASS (height P1) |
| 430 | 415 | 0 | 244 | 2056 | compact | 3 | 1 | 0 | 0 | 13px | PASS (height P1) |
| 480 | 465 | 0 | 207 | 1231 | compact | 2 | 2 | 0 | 0 | 14px | PASS |
| 540 | 525 | 0 | 207 | 1181 | compact | 2 | 2 | 0 | 0 | 16px | PASS |
| 600 | 585 | 0 | 161 | 1153 | compact | 2 | 2 | 0 | 0 | 18px | PASS |
| 768 | 753 | 0 | 166 | 1107 | desktop | 1 | 3 | 0 | 0 | 20px | PASS (height P1) |
| 820 | 805 | 0 | 166 | 1107 | desktop | 1 | 3 | 0 | 0 | 20px | PASS (height P1) |
| 912 | 897 | 0 | 166 | 786 | desktop | 1 | 4 | 0 | 0 | 20px | PASS (height P1) |
| 1024 | 1009 | 0 | 116 | 758 | desktop | 1 | 4 | 0 | 0 | 20px | PASS |
| 1180 | 1165 | 0 | 116 | 758 | desktop | 1 | 4 | 0 | 0 | 20px | PASS |
| 1280 | 1265 | 0 | 116 | 758 | desktop | 1 | 4 | 0 | 0 | 63px* | PASS |
| 1440 | 1425 | 0 | 116 | 758 | desktop | 1 | 4 | 0 | 0 | 143px* | PASS |
| 1600 | 1585 | 0 | 116 | 758 | desktop | 1 | 4 | 0 | 0 | 223px* | PASS |
| 1920 | 1905 | 0 | 116 | 758 | desktop | 1 | 4 | 0 | 0 | 363px* | PASS |
| 2560 | 2545 | 0 | 116 | 758 | desktop | 1 | 4 | 0 | 0 | 703px* | PASS |

\* above `--db-shell: 1180px` the content is centred and the "gutter" is the centring margin. Confirmed correct: at 2560 the emergency strip's inner box measured left 683 / right 1863, i.e. 1180px centred.

**Landscape**

| Viewport | client | H-scroll | Header h | % of screen height | Overflow | Clipped | Result |
|---:|---:|---:|---:|---:|---:|---:|---|
| 667 × 375 | 652 | 0 | 161 | 43% | 0 | 0 | PASS (proportion P2) |
| 844 × 390 | 829 | 0 | 166 | 43% | 0 | 0 | PASS (proportion P2) |
| 932 × 430 | 917 | 0 | 166 | 39% | 0 | 0 | PASS (proportion P2) |

**Zoom (WCAG 1.4.10 reflow)**

| Condition | H-scroll | Chrome elements past layout width | Result |
|---|---:|---:|---|
| 1280 @ 200% | 0 | 0 | PASS |
| 1280 @ 400% | 0 | 0 | PASS |
| 320 CSS px @ 400% (equiv.) | 0 | 0 | PASS |

**Other languages** — re-measured at 345px client width: `bn` header 207px, footer 2,088px, 2 nav rows, 0 overflow, 0 clipped. `zh` (`/zh/travel/toll`) header 280px, 0 overflow, 0 clipped. Neither Bangla nor Chinese label wraps inside itself or truncates at any width.

**One caveat on the mechanism.** The reason horizontal scroll is 0 everywhere is partly `.db-root{overflow-x:hidden}` (design-tokens.css:163-169). I verified independently, by measuring every chrome descendant's bounding box, that **nothing is actually being clipped** at any width — the rule is a belt over a correct layout, not a cover for a broken one. It is worth recording two consequences anyway: it silently hides any future overflow instead of revealing it, and `overflow-x:hidden` implies `overflow-y:auto` on `.db-root`, which will break `position:sticky` for any descendant — relevant to work package W8N.2 below.

---

## 3. Findings by severity

### P0

---

**NAV-HEADER-01 — the emergency number is 13.5 screens away, not one tap** — **P0**

*Evidence:* `https://dhakabypass.com/en` at 360×740. `document.querySelectorAll('a[href^="tel:"]')` returns exactly two links, both in the footer: `tel:+880255550199` at document y=9,951 and `tel:999` at y=10,001, in a document 10,191px tall. That is 13.5 viewport heights of scrolling from the top of the page. The header (`components/chrome/SiteHeaderV2.jsx:71-116`) contains no `tel:` link and no path to one; the nearest thing is the `Contact` CTA button, which is a page, not a number. The comment at `components/chrome/SiteFooterV2.jsx:49-57` explicitly reasons that the footer is "where a person on the hard shoulder with a phone will look: the bottom of whatever page they landed on" — but on this site the bottom of a landing page is ten thousand pixels down.

*Why it matters:* This is the operator's own stated requirement, and it is the one interaction on the site where the reader is in a vehicle, at night, possibly injured. Every other design decision in this chrome is made to keep things reachable without script; this one is not reachable without thirteen swipes.

*Recommendation:* Put the national emergency number in the header plate, as a `tel:` link, on every page. Source it from the same `/admin/settings` value the footer already reads (`getContactDetailsCached`), so there is one number to change. Render nothing when the setting is empty, exactly as `SiteFooterV2.jsx:101-105` already does. Files: `components/chrome/SiteHeaderV2.jsx`, `app/design-tokens.css` (a `.db-header-emergency` rule beside `.db-footer-emergency` at line 392).

---

### P1

---

**NAV-IA-01 — `/travel`, the first item in the primary navigation, is not a page** — **P1**

*Evidence:* `GET https://dhakabypass.com/en/travel` resolves to `https://dhakabypass.com/en/travel/status` (200 after redirect). `/travel` appears in neither `sitemap.xml` (63 `en` URLs, checked) nor the HTML site map at `/en/sitemap` (58 links, checked). Every other primary destination is a real page: `/en/safety`, `/en/project`, `/en/about`, `/en/sustainability`, `/en/news`, `/en/search`, `/en/contact` all return 200 at their own address.

*Why it matters:* "Travel Info" is the item a driver reaches for first, and it is the only one that does not have a landing page of its own — the reader is dropped into one leaf ("What's open") and the address in their bar changes to something they did not click. A bookmark or a shared link records `/travel/status`, not the section.

*Recommendation:* Either give `/travel` a real hub page in the CMS (a short index with the toll calculator, what's open, and the eight travel links), or accept the redirect and change the header label and destination to `/travel/status` so label, URL and `<h1>` agree. The first is better. Files: content (`/admin/pages-v2`), and `lib/menus/builtin.js:15` if the fallback href changes.

---

**NAV-IA-02 — five of six sections have no sub-navigation, and their hub pages do not link to their own children** — **P1**

*Evidence:* links inside `<main>` on each hub, fetched from production:

| Hub | Links in `<main>` | Links to its own children |
|---|---|---|
| `/en/travel/toll` | 8 (the travel sub-nav) | yes — all 8 |
| `/en/disclosures` | 2 (`/en/grievances`, `/en/contact`) | **none** of its 8 children |
| `/en/project` | 2 (`/en/travel/status`, `/en/travel/route`) | **none** of its 3 children |
| `/en/safety` | 2 (`/en/travel/rules`, `/en/travel/status`) | **not** `/safety/education` |
| `/en/about` | 4 | 1 of 6 (`/about/governance`) |
| `/en/media` | **0** | — dead end |

Only `/travel` has a section sub-nav, rendered by the `section-subnav` block reading the `travel` menu (`components/chrome/TravelSubnav.jsx`, `components/blocks/SectionSubnavBlock.jsx`).

*Why it matters:* A lender arriving at `/disclosures` from a search result, or a journalist at `/media`, sees a page with nothing to click. They must scroll 2,109px of footer on a phone to find the sibling page they came for. `/media` is a complete dead end.

*Recommendation:* Give each section a sub-nav from an editable menu (see NAV-CMS-01, which currently blocks this), and add it to the `about`, `project`, `disclosures`, `safety` and `sustainability` hubs. Files: `lib/menus/slugs.js:19`, then content.

---

**NAV-IA-03 — twelve published pages are reachable from no navigation** — **P1**

*Evidence:* comparing the 63 published `en` routes in `sitemap.xml` against every destination in the header (8), the footer (35 + 4 policy links) and the links found in `<main>` on twenty hub pages, these are reachable only from `/sitemap` and `/search`:

`/en/about/organisation`, `/en/disclosures/consultations`, `/en/disclosures/environment`, `/en/disclosures/policies`, `/en/disclosures/reports`, `/en/press-releases`, `/en/project/standards`, `/en/project/structures`, `/en/safety/education`, `/en/travel/lost-found`, `/en/travel/payment`, `/en/travel/toll-dispute`

(`/en/travel/breakdown`, `/en/travel/facilities`, `/en/travel/map` and `/en/travel/rules` are off this list only because the travel sub-nav or a hub reaches three of them.)

*Why it matters:* The list is not marginal. `/travel/toll-dispute`, `/travel/lost-found` and `/travel/payment` are what a driver needs after something has gone wrong. `/disclosures/reports`, `/disclosures/environment` and `/disclosures/policies` are what a lender and a regulator come to a PPP concessionaire's site for. `/press-releases` is what a journalist needs. None is one click from anywhere.

*Recommendation:* Closed by NAV-IA-02's section sub-navs plus a review of the footer's Disclosure column, which lists 7 of 8 disclosure pages but omits `reports`, `environment`, `policies` and `consultations`. Files: `lib/menus/builtin.js:58-69` (fallback) and `/admin/menus` (live).

---

**NAV-IA-04 — `/en/media` is a dead end with zero links** — **P1**

*Evidence:* `GET /en/media`, parsed: `document.querySelector('#main').querySelectorAll('a[href]')` filtered to internal links returns an empty array. The page is linked from the footer's Company column and links to nothing, including not to `/en/press-releases`, which exists and is published.

*Why it matters:* The media page is the one page on the site whose entire audience is journalists on a deadline, and it offers them no route to the press releases that are sitting at `/press-releases`.

*Recommendation:* Add the press-release list, contact route and downloads to the `/media` page body. Content change at `/admin/pages-v2`; no code.

---

**NAV-MOBILE-01 — the header consumes 46% of a phone viewport** — **P1**

*Evidence:* `https://dhakabypass.com/en` at 360×740, `.db-header` measured 280px with a fine pointer. Injecting the exact declaration from `@media (pointer:coarse)` (design-tokens.css:202-206), `.db-root a,.db-root button{min-height:44px}`, raises it to **340px** — the real height on a touch device. That is 46% of 740px and 53% of a 320×640 screen. The stack is: brand 42px, language row, theme row (`English / বাংলা / 中文` then `LIGHT / DARK / SYSTEM`), then three rows of navigation links. Screenshot: `.playwright-mcp/nav-360-header.png` (captured at 360×740, fine pointer, 280px version).

*Why it matters:* Every page on this site opens with a half-screen of navigation before the reader sees the toll rate they came for. The site is not sticky, so this cost is paid once per page rather than continuously — but it is paid on every page.

*Recommendation:* Reduce the phone stack to two rows: brand + language on one line, navigation wrapping below. Move the theme toggle out of the header on narrow screens (the footer, or `prefers-color-scheme` alone). Keep every nav link visible — that property is worth protecting. Files: `components/chrome/SiteHeaderV2.jsx:98-112`, `app/design-tokens.css:356-360`.

---

**NAV-FOOTER-01 — the footer is 2,109px tall on a 320px phone** — **P1**

*Evidence:* measured `.db-footer` height: 2,109px at 320, 2,056px at 360–430, 1,231px at 480, 1,153px at 600, 1,107px at 768, 786px at 912, 758px at 1024+. The footer carries 35 grouped links plus 4 policy links, each at `min-height:44px` (design-tokens.css:381), in a single column below 480px because `grid-template-columns:repeat(auto-fit,minmax(180px,1fr))` (design-tokens.css:372-375) can only fit one 180px track.

*Why it matters:* On a phone the footer is longer than most of the pages it sits under. The emergency strip — the most important thing in it — is the *last* block before the legal bar, which means the reader who scrolls to the bottom looking for a phone number passes 35 links first.

*Recommendation:* Below 600px, collapse the four footer groups into `<details>` disclosures with the headings as summaries (or show 4 links per group with a "more" link), and move the emergency strip to the *top* of the footer. The link map does not need to shrink; it needs to be scannable. Files: `components/chrome/SiteFooterV2.jsx:83-105`, `app/design-tokens.css:367-405`.

---

**NAV-RESPONSIVE-01 — a three-row 166px header across the whole 768–1010px band** — **P1**

*Evidence:* header height measured 166px at client widths 753, 805, 897 and 917, against 116px at 1009 and above. The navigation itself fits on one line throughout that band; the extra 50px is `.db-header-utils` wrapping to a third row, because both `.db-nav` and `.db-header-utils` carry `margin-left:auto` (design-tokens.css:334, 356) and there is not enough room for brand + nav + utils on one line. Screenshot: `.playwright-mcp/nav-844-landscape.png` (844×390) shows the three rows clearly.

*Why it matters:* This band is iPads in portrait, landscape phones, foldables and half-screen laptop windows — a large share of a Bangladeshi audience. 43% of a landscape phone screen is header.

*Recommendation:* Below ~1024px, drop the theme toggle from the header row (it is the least-used control there) or reduce the language switch to two-letter codes, so brand + nav + utils fit on two rows rather than three. File: `app/design-tokens.css:334-360`.

---

**NAV-HEADER-02 — there is no search field in the header, only a link** — **P1**

*Evidence:* the header markup contains `<a class="db-nav-link" href="/en/search">Search</a>` and no `<input>`. `MAIN_NAV` in `lib/menus/builtin.js:22` defines search as `{ key: 'navSearch', href: '/search' }` — a destination, not an affordance. Search also appears a second time in the footer's policy bar (`LEGAL_NAV`, `lib/menus/builtin.js:99`).

*Why it matters:* Twelve pages on this site are reachable *only* by searching (NAV-IA-03). Search is therefore load-bearing, and it costs a page load before the reader can type a word. A `.db-nav-search` class already exists at design-tokens.css:349 with `display:inline-flex; gap:6px` and nothing using it — the intent was there.

*Recommendation:* Put a real `<form action="/{locale}/search"><input name="q">` in the header on ≥768px, keeping the link as the compact-row fallback. Files: `components/chrome/SiteHeaderV2.jsx`, `app/design-tokens.css:349`.

---

**NAV-WAY-01 — no breadcrumbs anywhere, although BreadcrumbList JSON-LD is emitted on every page** — **P1**

*Evidence:* on `https://dhakabypass.com/zh/travel/toll`, `document.querySelectorAll('script[type="application/ld+json"]')` includes `{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"首页"...`. The rendered page contains no `nav[aria-label*="breadcrumb"]`, no `.db-breadcrumb`, and no ordered-list trail — checked on `/en`, `/en/travel/status`, `/en/travel/toll`, `/zh/travel/toll` and the 404.

*Why it matters:* The site tells Google there is a trail and tells the reader there is not. On a site three levels deep whose section hubs mostly do not link downward (NAV-IA-02), the breadcrumb is the only upward affordance a reader arriving from a search result has — and the header is 10,000px away by the time they have read the page.

*Recommendation:* Render a visible breadcrumb from the same `page-tree` data that already builds the JSON-LD, above the `<h1>`, on every page below the top level. Files: `lib/content/page-tree.js` (data already exists), a new `components/chrome/Breadcrumbs.jsx`, mounted in `app/[locale]/layout.jsx:111`.

---

**NAV-WAY-02 — the HTML site map links to `/en/not-found`, which returns 404** — **P1**

*Evidence:* `/en/sitemap` lists 58 internal links, one of which is `/en/not-found`. `GET https://dhakabypass.com/en/not-found` returns **404** (confirmed; it also raised a console error during testing). `/en/not-found` is the CMS row that *renders* the 404 page (`app/[locale]/not-found.jsx:22`, `NOT_FOUND_SLUG`) — an internal utility document, not a destination. It is correctly excluded from `sitemap.xml` but not from the HTML site map. The same HTML site map omits `/travel` (see NAV-IA-01).

*Why it matters:* The site map is the fallback route to the twelve orphaned pages; a broken link in it undermines the one page whose entire job is that nothing is unreachable.

*Recommendation:* Exclude `NOT_FOUND_SLUG` from the site-map page's query, the way `listPublishedPagesForSitemap` already does for `sitemap.xml`. File: `lib/content/site-index.js`.

---

**NAV-I18N-01 — the remembered-language cookie is written, honoured by the server, and then defeated by the HTTP cache** — **P1**

*Evidence:* `components/chrome/LocaleSwitch.jsx:19` sets `db_locale=<locale>; path=/; max-age=31536000` on click, commented "Remember the choice for the next visit to the bare domain". `next.config.mjs:185` implements exactly that: `{ source: '/', has: [{ type: 'cookie', key: 'db_locale', value: '(?<pick>en|bn|zh)' }], destination: '/:pick', permanent: false }` — a 307.

With `db_locale=bn` set, measured on production:

| Request | Lands on |
|---|---|
| `fetch('/')` (default cache) | `https://dhakabypass.com/en` ❌ |
| `page.goto('https://dhakabypass.com/')` | `https://dhakabypass.com/en` ❌ |
| `fetch('/', {cache:'no-store'})` | `https://dhakabypass.com/bn` ✅ |
| `fetch('/', {cache:'reload'})` | `https://dhakabypass.com/bn` ✅ |
| `fetch('/?cb=<timestamp>')` | `https://dhakabypass.com/bn` ✅ |

The server logic is correct. The 307 from `/` is being cached and replayed without regard to the cookie, i.e. it is served without `Vary: Cookie` (or without `Cache-Control: no-store`).

*Why it matters:* A Bangla reader chooses বাংলা, comes back the next day, types `dhakabypass.com`, and gets English — from their own browser cache, so no server fix on its own will reach them. On a trilingual public-service site this is the most visible i18n defect there is.

*Recommendation:* Send `Cache-Control: no-store` (or at minimum `Vary: Cookie, Accept-Language`) on the bare-domain redirect. File: `next.config.mjs` — add a `headers()` entry scoped to `source: '/'`, beside the CSP rule at line 170.

---

### P2

---

**NAV-LABEL-01 — "Travel Info" lands on a page titled "What's open"** — **P2**

*Evidence:* header label `Travel Info` (`lib/i18n/ui.js:37`) → `/en/travel` → `/en/travel/status`, whose `<title>` and `<h1>` are both `What's open`. Every other primary item agrees with its destination's `<h1>`: Safety→Safety, Project→Project, About→About, Sustainability→Sustainability, News→News, Search→Search, Contact→Contact.

*Why it matters:* The reader clicked one thing and arrived somewhere with a different name, which reads as a mis-click.

*Recommendation:* Resolved by NAV-IA-01 either way.

---

**NAV-HEADER-03 — the theme toggle gets a full-width row above the navigation on phones** — **P2**

*Evidence:* `@media (max-width:479px){.db-header-utils{margin-left:0;width:100%;justify-content:flex-start;}}` (design-tokens.css:358-360), and `.db-header-utils` precedes `.db-nav-mobile` in `SiteHeaderV2.jsx:98-112`. Measured at 360px: utils occupy a 68px two-row block (language row + theme row) above the 114px navigation block. Screenshot `.playwright-mcp/nav-360-header.png`.

*Why it matters:* On the smallest screens, the light/dark/system picker is given more vertical priority than the navigation and all of the content.

*Recommendation:* Below 480px, move `.db-header-utils` after `.db-nav-mobile` in source order, or move the theme control to the footer. File: `components/chrome/SiteHeaderV2.jsx:98-112`.

---

**NAV-MOBILE-02 — no safe-area insets; a landscape notch will occlude the left gutter** — **P2**

*Evidence:* `grep -rn "safe-area\|env(safe" app/ components/` returns **no matches**. Horizontal padding on `.db-header-inner` (line 306), `.db-footer-nav` (372), `.db-footer-inner` (384), `.db-footer-emergency-inner` (393) and `.db-subnav` (707) is `clamp(12px,3vw,20px)` with no `env(safe-area-inset-left/right)` term.

*Why it matters:* On a notched iPhone held in landscape, Safari inflates the left or right gutter to about 44px; without the `env()` term the layout's own 20px gutter is all it gets, so the brand or the leftmost nav link sits partly under the notch.

*Recommendation:* `padding-inline: max(clamp(12px,3vw,20px), env(safe-area-inset-left), env(safe-area-inset-right))` on the five shell rules above, and `padding-bottom: env(safe-area-inset-bottom)` on `.db-footer-inner`. File: `app/design-tokens.css`.

---

**NAV-RESPONSIVE-02 — 43% of a landscape phone is header** — **P2**

*Evidence:* 667×375 → header 161px (43% of 375). 844×390 → 166px (43%). 932×430 → 166px (39%).

*Why it matters:* Landscape is how people hold a phone to read a table — and this site's key content is a toll table.

*Recommendation:* Closed by NAV-RESPONSIVE-01 and NAV-MOBILE-01.

---

**NAV-WAY-03 — no "back to top" and no sticky header on a 10,191px page** — **P2**

*Evidence:* `.db-header` computes `position: static`; there is no `position:sticky` rule for it anywhere in `app/design-tokens.css` (the only sticky in the file is line 195, the scroll-region hint). The only in-page anchor on the whole document is the skip link: `document.querySelectorAll('a[href^="#"]')` returns exactly one element, `#main Skip to content`. The `/en` home page is 10,191px tall at 360×740.

*Why it matters:* Having read to the bottom of a 13-screen page, the reader's only route to the navigation is 13 screens of upward scrolling — or the footer link map, which is itself 2,000px.

*Recommendation:* Either make the header sticky with a condensed height on scroll, or add a "back to top" control. **Note:** `.db-root{overflow-x:hidden}` (design-tokens.css:167) will prevent `position:sticky` from working for descendants; that rule has to be reworked first (see the caveat in §2.1). Files: `app/design-tokens.css:163-169, 305`.

---

**NAV-WAY-04 — the 404 page's `<title>` is the generic site title, and it offers no search** — **P2**

*Evidence:* `https://dhakabypass.com/en/this-page-does-not-exist` returns HTTP 404 with full chrome and a CMS-authored body (`<h1>Page not found`, "The page you asked for does not exist or has moved. The address may have changed when the site was rebuilt.") and two links: `Back to the home page → /en`, `Toll rates → /en/travel/toll`. But `document.title` is `Dhaka Bypass Expressway` — the site default — and `#main` contains no `input[type=search]`.

*Why it matters:* The tab, the browser history entry and any SERP snippet all say this is the home page. And since twelve pages are reachable only by search (NAV-IA-03), the 404 is exactly where a search box earns its keep.

*Recommendation:* Give the `not-found` page its own `route_meta` title, and add a search field and a link to `/sitemap` to its body. Files: `/admin/seo` (title), `/admin/pages-v2` (body).

*Correct as built:* the 404 returns a true 404 status, is localised, renders inside the full chrome, and is editable as a block document. That is better than most.

---

**NAV-WAY-05 — the advisory bar is text only, with no link to the advisory it announces** — **P2**

*Evidence:* `components/corridor/AdvisoryBar.jsx:33-42` renders `.db-advisory-tag` + `.db-advisory-msg` inside a `role="status"` div. There is no `<a>`. No advisory was active during this audit, so the bar did not render in production today; this is a source finding.

*Why it matters:* A closure notice at the top of every page that a reader cannot click through to detail, dismiss, or act on. It also adds to the header height budget (NAV-MOBILE-01) whenever it is active.

*Recommendation:* Wrap the message in a link to `/{locale}/travel/advisories`. File: `components/corridor/AdvisoryBar.jsx`.

---

**NAV-A11Y-01 — `#main` has no `tabindex="-1"`, so the skip link's focus move is browser-dependent** — **P2**

*Evidence:* `document.querySelector('#main').getAttribute('tabindex')` is `null`. The element is a `<main>` rendered at `app/[locale]/layout.jsx:111`.

*Why it matters:* Chrome and Firefox set the sequential-focus starting point on a non-focusable fragment target, so the skip link works; Safari and some older engines move the scroll but leave focus in the header, so the next Tab returns the reader to the navigation they just skipped.

*Recommendation:* `<main id="main" tabIndex={-1}>`. File: `app/[locale]/layout.jsx:111`.

---

**NAV-A11Y-02 — the skip link's focus ring is clipped at the left edge** — **P2**

*Evidence:* on focus, `.db-skip` becomes `position:static` (design-tokens.css:309) and measured at x=0, width 130, height 40. The site focus ring is `outline:3px solid` at `outline-offset:2px` plus `box-shadow:0 0 0 7px var(--db-ink)` (design-tokens.css:246-247), extending ~10px beyond the border box — into the region `.db-root{overflow-x:hidden}` clips.

*Why it matters:* The skip link is the first thing a keyboard user focuses on every page; its ring is the one that most needs to be unambiguous. (The ring itself is well designed and measured — the two-tone construction documented at design-tokens.css:238-247 is correct.)

*Recommendation:* Give `.db-skip:focus` `margin-left: 10px` or `outline-offset: -3px`. File: `app/design-tokens.css:309`.

---

**NAV-A11Y-03 — the header CTA never shows the current-section indicator** — **P2**

*Evidence:* `CurrentNav.jsx:16` correctly selects `.db-nav a, .db-nav-mobile a`, which includes the CTA, and sets `aria-current="page"` on it. But the visual rule is `.db-nav-link[aria-current="page"]{box-shadow:inset 0 -2px 0 var(--db-plate-accent)}` (design-tokens.css:348) and the CTA carries class `db-nav-cta`, not `db-nav-link`. Verified on `/en/travel/status`: `Travel Info` shows `aria-current="page"` and the underline; on `/en/contact` the Contact button would be announced as current but drawn identically to its resting state.

*Why it matters:* Minor, but it is the one link in the header where the sighted reader and the screen-reader user are told different things.

*Recommendation:* Extend the selector to `.db-nav-link[aria-current="page"],.db-nav-cta[aria-current="page"]`. File: `app/design-tokens.css:348`.

---

**NAV-PERF-01 — every document carries the primary navigation twice** — **P2**

*Evidence:* `SiteHeaderV2.jsx:89-112` renders `links.map(...)` into `.db-nav` and again into `.db-nav-mobile`; one is `display:none` at any given width. Measured on `/en`: 8 links in `.db-nav`, 8 in `.db-nav-mobile`, identical `href` lists. Total document 90,055 bytes.

*Why it matters:* Small — roughly 1 kB per page uncompressed, and near-zero after gzip since the strings repeat. It is listed because it is the cost of the dual-nav approach and should be weighed if W8N.1 restructures the header anyway. It is **not** an accessibility problem: `display:none` removes the hidden copy from the accessibility tree, and a screen reader encounters only one navigation.

*Recommendation:* If the header is restructured, render one `<nav>` and switch its layout with CSS rather than duplicating it. File: `components/chrome/SiteHeaderV2.jsx:89-112`.

---

**NAV-PERF-02 — a CSS chunk is preloaded and never used** — **P2**

*Evidence:* console warning on `https://dhakabypass.com/en/travel/status`: `The resource https://dhakabypass.com/_next/static/css/965702f48f730fe4.css was preloaded using link preload but not used within a few seconds from the window's load event.` Total CSS on the page: 42.6 kB.

*Why it matters:* Wasted bytes on a first paint that the header's font swap already costs a little shift for. Minor.

*Recommendation:* Investigate the route's CSS chunking in `next.config.mjs`; likely a route-group boundary producing an unused stylesheet link.

---

**NAV-CMS-01 — `SECTION_MENU_SLUGS = ['travel']` is hardcoded, so an editor cannot create a second section sub-nav** — **P2**

*Evidence:* `lib/menus/slugs.js:19`:

```js
export const SECTION_MENU_SLUGS = ['travel'];
```

consumed at `lib/blocks/types/section-subnav.js:25` to build the block's menu dropdown (`options: SECTION_MENU_SLUGS.map(...)`) and at `components/blocks/SectionSubnavBlock.jsx:19` to validate the choice. An administrator placing a "Section menu" block on `/about` is offered exactly one option — `travel` — and gets the travel links.

*Why it matters:* This is the code line that makes NAV-IA-02 unfixable from `/admin`. The project rule is that navigation an editor cannot change is a finding in itself; this is that finding with a line number.

*Recommendation:* Derive `SECTION_MENU_SLUGS` from the menus that actually exist in the database (everything except `main`, `cta`, `footer`, `legal`), keeping the existing exclusion of the chrome menus and the built-in fallback. File: `lib/menus/slugs.js:19`.

---

**NAV-CMS-02 — the menu list itself is hardcoded, and the header has no utility-link menu** — **P2**

*Evidence:* `lib/menus/slugs.js:12`:

```js
export const MENU_SLUGS = ['main', 'cta', 'footer', 'legal', 'travel'];
```

`/admin/menus` renders exactly these five, titled in a hardcoded `TITLES` map at `app/admin/(dash)/menus/page.jsx:12-18`. Separately, the header's utility area is fixed markup — `<LocaleSwitch>` and `<ThemeToggle>` at `components/chrome/SiteHeaderV2.jsx:98-101` — with no menu behind it, so an operator cannot add a utility link (a helpline page, a staff login, an accessibility statement) beside the language switch without a deploy.

*Why it matters:* The editable surface is good but finite; adding a sixth menu or a header utility link is a code change.

*Recommendation:* Add a `utility` menu slug rendered into `.db-header-utils` before the language switch, and let `/admin/menus` enumerate menus from the database rather than a constant. Files: `lib/menus/slugs.js:12`, `components/chrome/SiteHeaderV2.jsx:98-101`, `app/admin/(dash)/menus/page.jsx:12`.

---

**NAV-FOOTER-02 — on a phone the emergency strip comes after all 35 links** — **P2**

*Evidence:* DOM order in `SiteFooterV2.jsx:84-127`: `.db-footer-nav` (4 groups, 35 links) → `.db-footer-emergency` → `.db-footer-inner` (org name, 4 policy links, copyright). At 320px that puts the emergency strip roughly 1,800px into a 2,109px footer.

*Why it matters:* Same reader as NAV-HEADER-01, one scroll further on.

*Recommendation:* Move `.db-footer-emergency` above `.db-footer-nav`. File: `components/chrome/SiteFooterV2.jsx:101-105`.

---

**NAV-LABEL-02 — `Search` appears twice in the chrome, in the header and in the footer policy bar** — **P2**

*Evidence:* `MAIN_NAV` includes `{ key: 'navSearch', href: '/search' }` (`lib/menus/builtin.js:22`) and `LEGAL_NAV` includes the same (`lib/menus/builtin.js:99`). Rendered footer policy bar on `/en`: `Privacy · Terms of use · Accessibility · Search`.

*Why it matters:* Search is not a policy document; in the bottom bar it reads as one. Six other header destinations also repeat in the footer, which is normal for a footer link map and is *not* a finding — this one is, because of where it sits.

*Recommendation:* Remove `navSearch` from `LEGAL_NAV`; it belongs in the header (and as a field — NAV-HEADER-02). File: `lib/menus/builtin.js:99`.

---

## 4. What is already correct

Recorded so the report can be used to decide what is left, not just what is wrong.

- **No horizontal scroll, no overlap, no clipped label, no element narrower than its content, at any of 19 widths, 3 landscape sizes, 3 languages and 2 zoom levels.** Measured, not assumed. See §2.1.
- **Tap targets.** Under `@media (pointer:coarse)`, every chrome control measured ≥44px tall and ≥44px wide: nav links 60–129 × 44, language buttons 44–61 × 44, theme buttons 51–64 × 44, footer links 261 × 44, emergency numbers 159 × 44. Verified by applying the rule and re-measuring, since a desktop browser does not match the query.
- **Contrast, both themes.** Every chrome text element clears WCAG AA 4.5:1 in light *and* dark, effective opacity included:

  | Element | Light | Dark |
  |---|---:|---:|
  | Nav link (`opacity:.78`) | 8.85 | 7.38 |
  | Contact CTA | 5.83 | 4.70 |
  | Brand tagline (`opacity:.6`) | 5.80 | 5.02 |
  | Inactive language button | 5.80 | 5.02 |
  | Theme button | 13.77 | 11.10 |
  | Footer link | 6.81 | 9.09 |
  | Footer heading | 5.37 | 6.55 |
  | Footer policy link | 5.37 | 6.55 |
  | Emergency label | 5.83 | 4.70 |
  | Emergency number | 13.77 | 11.10 |

- **Keyboard.** Focus order is DOM order and logical: skip link → brand → 7 nav links → CTA → 3 language links → 3 theme buttons → sub-nav → content. Zero elements with a positive `tabindex` on the page. No dropdowns, dialogs or disclosures in the chrome, therefore no keyboard trap and no Esc semantics to get wrong. The two-tone focus ring (`outline:3px solid var(--db-accent-bright)` + `box-shadow:0 0 0 7px var(--db-ink)`, design-tokens.css:246) is visible on both the dark header plate and the light page ground — the reasoning at lines 238-245 is sound and the measured result matches it.
- **Landmarks and labels.** `<header>`, `<main id="main">`, `<footer>` plus four uniquely-named `<nav>`s: `Primary`, `Primary, compact`, `Language`, `Site sections` — each localised (`bn`: `প্রধান মেনু`, `প্রধান মেনু, সংক্ষিপ্ত`, `ভাষা`, `সাইটের বিভাগসমূহ`). The theme control is `role="group"` with `aria-label="Theme"` and `aria-pressed` on each button. There is not a single icon-only control in the chrome — every control has a text label, so there is nothing to mis-name.
- **`aria-current`.** Verified on `/en/travel/status`: the header's `Travel Info` carries `aria-current="page"` (matched by prefix, so a leaf page still marks its section) and the travel sub-nav marks `What's open`. `TravelSubnav` correctly uses `aria-current="page"` while `LocaleSwitch` uses `aria-current="true"` — the right distinction between "which page you are on" and "which option is selected".
- **Trilingual mechanics.** `<html lang>` is `en` / `bn` / `zh-Hans`, set server-side (`RootDocument.jsx:19`), and repeated on `.db-root`. Each language-switch link carries its own `hreflang` and `lang`. `hreflang` alternates are per-page and complete with `x-default`, confirmed on a deep page: `/zh/travel/toll` emits en/bn/zh/x-default all pointing at `/travel/toll`. Every internal `href` in the chrome is locale-prefixed server-side, so a Bangla reader who clicks anything stays in Bangla. The Bangla typesetting block (design-tokens.css:207-221 — tracking off, 1.32 heading line-height, 13.5px floor) and the `zh`-only Noto Sans SC stylesheet (`app/[locale]/layout.jsx:97`) are both correct and effective.
- **The language-switch font fix holds.** `.db-locale-btn` is set in the system stack (design-tokens.css:366) so the word `বাংলা` in the header does not pull the Bengali webfont onto English pages. Verified: on `/en` the loaded `HindSiliguri` face is triggered by the taka sign `৳` in the toll-preview *content* block, not by anything in the chrome. (That content issue — 71.2 kB of Bengali font on every English page carrying a `৳` — is real but out of this audit's scope and is not scored here.)
- **Chrome performance.** Total CLS 0.0075, its single source the header font swap (`NAV.db-nav`, `DIV.db-header-utils`); `FontPreload` at `layout.jsx:91` is doing its job. The logo carries measured `width`/`height` attributes (`43×34`, derived at `SiteHeaderV2.jsx:62` from the actual file) so it reserves its box. Zero CSS transitions on any header descendant. The header and footer are server components reading cached menus; the only client JavaScript the chrome adds is `CurrentNav` (24 lines), `LocaleSwitch`, `ThemeToggle` and `ScrollRegions`. Total page JS 134 kB.
- **`prefers-reduced-motion`.** Honoured globally at design-tokens.css:282-286, confirmed present in the live stylesheet.
- **Editability.** Five menus — `main`, `cta`, `footer`, `legal`, `travel` — are editable at `/admin/menus` with a label per language (English required, missing translations flagged inline), a sort order, a parent column for footer grouping, soft delete to trash and per-item revision history. Brand short name, full name, header logo and tagline, the emergency numbers, the social accounts and the robots rules are all `/admin/settings` values. The override-never-replace rule (`lib/menus/repo.js`, `SiteHeaderV2.jsx:34-43`) means a database outage degrades to the built-in navigation rather than to an empty bar — a genuinely good decision for a memory-limited shared host.
- **Print.** design-tokens.css:1999-2004 hides the nav, language switch, sub-nav, footer nav and skip link and flattens the plate backgrounds. Nobody asked, but it is right.

---

## 5. Work packages

Eight packages, ordered by the benefit each returns for the work it costs.

---

### W8N.1 — The emergency number in the header

**Closes:** NAV-HEADER-01 (P0), NAV-FOOTER-02 (P2)
**Files:** `components/chrome/SiteHeaderV2.jsx`, `components/chrome/SiteFooterV2.jsx`, `app/design-tokens.css`

Read `getContactDetailsCached(locale)` in the header and render the national emergency number as a `tel:` link on the plate, at every width, rendering nothing when the setting is empty. Move `.db-footer-emergency` above `.db-footer-nav`.

**Acceptance test:** on every locale, at 320 / 768 / 1280, a `tel:` link is present inside `.db-header` within the first viewport height without scrolling, with a computed height ≥44px under `pointer:coarse`.

---

### W8N.2 — The phone and tablet height budget

**Closes:** NAV-MOBILE-01 (P1), NAV-RESPONSIVE-01 (P1), NAV-RESPONSIVE-02 (P2), NAV-HEADER-03 (P2), NAV-PERF-01 (P2)
**Files:** `components/chrome/SiteHeaderV2.jsx`, `app/design-tokens.css:305-360`

Collapse the phone header to two rows (brand + language; navigation wrapping below) by moving `.db-header-utils` after `.db-nav-mobile` below 480px and taking the theme toggle out of the header on narrow screens. In the 768–1010px band, keep brand + nav + utils to two rows. Keep every navigation link visible without a control — that property is the reason this chrome has no mobile-menu bugs and must not be traded away for height. While the header is open, render one `<nav>` rather than two.

**Acceptance test:** `.db-header` computed height ≤200px at 320/360/390/430 with `@media (pointer:coarse)` active, and ≤130px at 768/820/912; horizontal page scroll still 0 and zero clipped labels at all 19 widths in all three languages.

---

### W8N.3 — Second-level navigation

**Closes:** NAV-IA-02 (P1), NAV-IA-03 (P1), NAV-IA-04 (P1), NAV-CMS-01 (P2)
**Files:** `lib/menus/slugs.js:19`, `lib/menus/builtin.js:58-69`, then content at `/admin/menus` and `/admin/pages-v2`

Derive `SECTION_MENU_SLUGS` from the menus present in the database instead of the literal `['travel']`, so the `section-subnav` block can render an `about`, `project`, `disclosures`, `safety` or `sustainability` menu. Create those menus and place the block on each hub. Add `disclosures/reports`, `disclosures/environment`, `disclosures/policies` and `disclosures/consultations` to the footer's Disclosure column, and give `/media` a body that links to `/press-releases`.

**Acceptance test:** every published `en` route except the home page is reachable in at most two clicks from `/en`, verified by crawling `<main>` + chrome links two levels deep; the orphan list is empty.

---

### W8N.4 — Breadcrumbs and the return path

**Closes:** NAV-WAY-01 (P1), NAV-WAY-03 (P2)
**Files:** new `components/chrome/Breadcrumbs.jsx`, `app/[locale]/layout.jsx:111`, `app/design-tokens.css:163-169`

Render a visible breadcrumb from the same `page-tree` data that already produces the BreadcrumbList JSON-LD, on every page below the top level, in all three languages. Add a return path from the bottom of a long page — either a sticky condensed header or a back-to-top control. Note that `position:sticky` cannot work for descendants of `.db-root` while it carries `overflow-x:hidden`; rework that rule (scope the clip to the elements that need it) before relying on sticky.

**Acceptance test:** on `/en/travel/toll`, `/bn/disclosures/tariff` and `/zh/about/governance`, a `nav[aria-label]` breadcrumb is present whose items match the emitted BreadcrumbList; from the document bottom at 360px, the primary navigation is reachable without scrolling up.

---

### W8N.5 — The footer on a phone

**Closes:** NAV-FOOTER-01 (P1)
**Files:** `components/chrome/SiteFooterV2.jsx:83-105`, `app/design-tokens.css:367-405`

Below 600px, present the four footer groups as `<details>` disclosures with the headings as summaries, or truncate each group to its first four links with a "more" link. The link map stays complete; it stops being 2,000px of unscannable list. Keep the 44px targets and the current contrast.

**Acceptance test:** `.db-footer` computed height ≤900px at 320 and 360 with all groups collapsed; every one of the 35 destinations still reachable from the footer at that width without script.

---

### W8N.6 — Search as an affordance

**Closes:** NAV-HEADER-02 (P1), NAV-WAY-04 (P2), NAV-LABEL-02 (P2)
**Files:** `components/chrome/SiteHeaderV2.jsx`, `app/design-tokens.css:349`, `lib/menus/builtin.js:99`, content at `/admin/seo` and `/admin/pages-v2`

Put a real search form in the header at ≥768px using the unused `.db-nav-search` rule, keeping the link as the compact-row fallback. Remove `navSearch` from `LEGAL_NAV`. Give the 404 page its own `<title>` and add a search field plus a `/sitemap` link to its body.

**Acceptance test:** an `input` whose form targets `/{locale}/search` is present and focusable in the header at 768+ in all three locales; `/en/no-such-page` returns 404 with a `<title>` containing the localised "Page not found" and a usable search field.

---

### W8N.7 — Language persistence and site-map integrity

**Closes:** NAV-I18N-01 (P1), NAV-WAY-02 (P1), NAV-IA-01 (P1), NAV-LABEL-01 (P2)
**Files:** `next.config.mjs` (`headers()`, beside line 170), `lib/content/site-index.js`, `lib/menus/builtin.js:15`, content

Send `Cache-Control: no-store` (or `Vary: Cookie, Accept-Language`) on the bare-domain redirect so `db_locale` survives a second visit. Exclude `NOT_FOUND_SLUG` from the HTML site map and include `/travel`. Give `/travel` a real hub page — or, if the redirect stands, point the menu item at `/travel/status` so the label, the URL and the `<h1>` agree.

**Acceptance test:** with `db_locale=bn` set, two consecutive plain navigations to `https://dhakabypass.com/` both land on `/bn`; every link on `/en/sitemap` returns 200; `/en/travel` appears in both `sitemap.xml` and `/en/sitemap`.

---

### W8N.8 — Accessibility and chrome polish

**Closes:** NAV-A11Y-01 (P2), NAV-A11Y-02 (P2), NAV-A11Y-03 (P2), NAV-MOBILE-02 (P2), NAV-WAY-05 (P2), NAV-PERF-02 (P2)
**Files:** `app/[locale]/layout.jsx:111`, `app/design-tokens.css:306, 309, 348, 372, 384, 393, 707`, `components/corridor/AdvisoryBar.jsx`, `next.config.mjs`

`tabIndex={-1}` on `<main id="main">`. Stop `.db-root`'s clip cutting the skip link's focus ring. Extend the `aria-current` underline to `.db-nav-cta`. Add `env(safe-area-inset-*)` to the five shell padding rules and the footer's bottom padding. Make the advisory bar's message a link to `/{locale}/travel/advisories`. Resolve the unused preloaded CSS chunk.

**Acceptance test:** axe-core reports no new violations on the chrome at 320 and 1280 in both themes; the skip link's full focus ring is visible at x=0; on a simulated notched landscape viewport the brand's left edge sits at or beyond `env(safe-area-inset-left)`.

---

*Screenshots referenced in this report are in `.playwright-mcp/` (git-ignored): `nav-360-header.png`, `nav-844-landscape.png`.*
