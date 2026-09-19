# Advertising and revenue options for dhakabypass.com

**Date:** 19 September 2026
**For:** DBEDC management, and the next engineer on this repository
**Question asked:** can DBEDC run advertising on dhakabypass.com and earn from it?
**Short answer:** technically yes; it is not advisable, the sum involved is very small, and there are larger revenue lines a concessionaire has that do not touch the disclosure site.

This document is written to be acted on by two different readers. Sections 1–4, 6 and 7 are for management. Sections 5 and 8 are for the engineer.

**What this document does not do.** It invents no revenue figure, no traffic figure and no contract clause. Where an answer depends on the concession agreement, the financing agreements or the company's constitutional documents, it says so and names the clause to look for. Every external claim carries a URL. Two peer sites (`nhai.gov.in`, `tis.nhai.gov.in`) refused connections from the machine used for this research; that is recorded rather than worked around.

---

## 1. What this site is

The site is the official public channel of a PPP concessionaire. It is not a publication. Its content is, in large part, material that DBEDC is expected to disclose, and material a driver may act on.

| What the site carries | Where | Why it matters here |
|---|---|---|
| Right to information, with a Responsible Officer and appeal path | `disclosures/right-to-information` | Statutory disclosure under RTI Act 2009, if the Act applies to a DBFOMT concessionaire — counsel must confirm (see the audit, §2, "RTI Act 2009 applicability") |
| Citizen charter | `disclosures/citizen-charter` | Follows the Cabinet Division uniform format: service, procedure, cost, time limit, responsible officer |
| Grievance redress, with GRS escalation | `grievances` | Cabinet Division GRS Guidelines 2015 (rev. 2018): 30 working days, named focal and appeal officers |
| Procurement | `procurement` | Supplier-facing; auditable |
| Land acquisition and resettlement | `disclosures/land-acquisition` | Lender safeguard material. ADB monitoring records 3,867 entitled persons |
| Environment, policies, reports, tariff | `disclosures/*` | Disclosure index |
| Emergency information | `travel/breakdown`, `travel/locate`, `safety`, and the header | A number a stranded driver dials. W8N.1 is the only P0 open on the site |
| Toll rates fixed by government notification | `travel/toll`, `disclosures/tariff` | The plan's own rule: "Every published rate cites its SRO/gazette number and date and links the PDF. Never publish a rate without it" (`docs/superpowers/plans/2026-09-06-dhakabypass-master-remediation.md:24`) |
| Live operational advisories | `travel/advisories`, `travel/weather`, `travel/status` | Fog, rain and wind advisories on the corridor's defining risk |

Three of the plan's global constraints bear directly on the question:

- `:24` — toll figures carry provenance, always.
- `:25` — the legal review gate: no page may assert statutory compliance or a service-level commitment until counsel confirms.
- `:26` — operator-verified facts only: "Never placeholder a number a driver might dial."

The concession-domain audit of 14 September 2026 scored the site **32/100** as a concessionaire front door, with 4 critical and 38 high findings, and its verdict was that the engineering is largely done and what is missing is verified content, legal sign-off and a corrections sprint (`docs/audit/2026-09-14-concession-domain-audit.md`, §1).

**What that implies for third-party advertising.** A page of this kind works because a reader can assume that everything on it is DBEDC's, verified, and placed deliberately. An advertisement is the opposite: it is content DBEDC has not seen, chosen by an auction, changing on every load. Putting one beside a gazetted toll rate, a named RTI officer or an emergency number does three things at once:

1. It weakens the page as evidence. These pages get quoted in appeals, screenshotted by journalists and attached to lender reports. A payday-loan banner in the screenshot travels with it.
2. It confuses authority. A reader cannot tell what DBEDC stands behind. Google's own rules acknowledge the risk from the other side: ads may not be placed under misleading headings, and may be labelled only "Advertisements" or "Sponsored Links" ([AdSense ad placement policies](https://support.google.com/adsense/answer/4533986?hl=en)).
3. It contradicts the site's own discipline. The site refuses to publish an unverified toll figure, and refuses to publish a commitment counsel has not cleared. It cannot then publish arbitrary unreviewed third-party content in the same column.

Two further facts of this site's own making are relevant. The audit lists several pages as thin or placeholder — `/facilities`, `/press-releases`, `/consultations`, `/procurement`, `/about/recognition`, `/search` (§4.15 C). And the site currently asks for consent only for analytics, and grants nothing else (section 5).

---

## 2. Governance and contract

### 2.1 Can a Bangladeshi PPP concessionaire run advertising on its official site?

There is no public rule that says "no". There is also nothing in the PPP framework that grants it. The answer lives in DBEDC's own documents, and they must be read before anything is built. The Bangladesh Public-Private Partnership Act 2015 (Act No. 18 of 2015), gazetted 16 September 2015 and amended in 2023, establishes the PPP Authority and makes the **project agreement** the instrument that defines what the private partner may do ([FAOLEX record](https://www.fao.org/faolex/results/details/en/c/LEX-FAOC179711/), [Act text](https://faolex.fao.org/docs/pdf/bgd179711E.pdf), [PPPA/PPPO note on enactment](https://www.pppo.gov.bd/events2015_enactment-of-the-bangladesh-public-private-partnership-ppp-act-2015.php)). Note that the PPPA project profile link used on five pages of this site returns 404 and `pppa.gov.bd` now redirects to `investbangladesh.gov.bd` (audit §2), so the current authoritative profile URL is itself unverified.

**Documents to obtain and the clauses to look for.** This list is the actual deliverable of this section.

| Document | Clause to find | Why |
|---|---|---|
| Concession / project agreement (RHD–DBEDC, signed 6 December 2018) | Scope of the project; permitted activities; "additional" or "ancillary" commercial activities and whether they need the Authority's prior consent | Determines whether website advertising is inside the concession at all |
| Same | The definition of **Revenue** / **Gross Revenue** used for revenue sharing, for the minimum revenue guarantee and for viability gap funding | If non-toll income falls inside the definition, DBEDC may have to share it, or may see an MRG top-up reduced by the same amount. Press records both a minimum revenue guarantee and VGF of ৳3.1bn ([UNB, Dec 2018](https://www.unb.com.bd/category/Bangladesh/bangladesh-signs-ppp-contract-for-dhaka-bypass/9772)) |
| Same | Use of the project name, marks and the corridor's identity; publicity and communications obligations; handback | The website may be a contractual communications deliverable rather than DBEDC's own media property |
| Same | Advertising and structures within the right of way | Governs the physical options in section 6, not the website |
| Financing agreements (CDB, BIFFL; ADB credit line to BIFFL) | Negative covenants on new business lines; permitted receipts into the project accounts; the cash waterfall; the definition of Project Revenues | Lenders normally control what may be received and where |
| Memorandum and Articles of Association (RJSC) | The objects clause | A company cannot invoice advertising income that is outside its objects |
| Tax file | VAT and AIT treatment of digital advertising income; inward remittance route for payments from a foreign platform | Foreign platform income is a reporting event, not a quiet side income |

### 2.2 What an auditor or a lender would ask

Expect these questions, in this order. If DBEDC cannot answer all of them, the answer to the ad question is "not yet".

1. Under which clause of the concession agreement is this income earned?
2. Is it inside the company's objects clause?
3. Is it within the definition of Revenue for revenue sharing, MRG and VGF? What is the net effect after sharing?
4. Which bank account receives it, and is that account inside the security package and the waterfall?
5. Who approved it — board, grantor (RHD), PPPA, lenders? Where is the written consent?
6. What is the content policy, who enforces it, and what is the take-down route when an inappropriate ad appears?
7. How is it disclosed in the annual accounts, and how material is it? (If the answer is "immaterial", ask why the company took the governance risk for an immaterial sum.)
8. What personal data is now processed, under what notice, and with what consent record?

### 2.3 Reputational exposure

With an ad network, DBEDC does not choose the advertisement. It chooses categories to exclude, and the network fills the rest. Google states plainly that restricted content simply "receives less advertising" rather than none ([AdSense programme policies](https://support.google.com/adsense/answer/48182?hl=en)). The exposures that matter here:

- **A competitor or a substitute route** advertising on the concessionaire's own toll page.
- **Lenders, loan apps and "quick money" offers**, which dominate low-CPM inventory in this region, appearing beside a grievance form or a toll dispute form.
- **Betting and gambling creatives**, which leak through category filters, appearing on a page a government office links to.
- **Scam and malware creatives** beside an emergency number, on the one page where a reader is frightened and in a hurry. This is the single worst outcome available and it is not hypothetical: ad-network creative leakage is routine.
- **Political or communal creatives** on a page in Bangla, during a sensitive period.

One such screenshot, circulated once, costs more than the annual revenue in section 4.

### 2.4 What comparable operators actually do

Checked directly on 19 September 2026, by fetching the pages and inspecting them for ad-network scripts and third-party banners.

| Operator | Site | Third-party display ads? | What is there instead |
|---|---|---|---|
| PLUS Malaysia (largest Malaysian tolled expressway operator) | [plus.com.my](https://www.plus.com.my/) | **None found** | Its own app, PLUSMiles, PLUSTrack, R&R information, media centre |
| Transurban / Linkt (Australia) | [linkt.com.au](https://www.linkt.com.au/) | **None found** | Its own app, its own account products, partner cross-promotions under its own brand |
| First Dhaka Elevated Expressway (the closest Bangladeshi peer) | [fdee.bd](http://fdee.bd/) | **None found** | Own notices, careers, traffic advisories, contact forms |
| Bangladesh Bridge Authority (Padma, Jamuna, Karnaphuli) | [bba.gov.bd](https://bba.gov.bd/) | **None found** | Projects, toll collection data, laws, citizen charter, RTI, grievance |
| NHAI / IHMCL (India) | `nhai.gov.in`, `tis.nhai.gov.in` | **Not verifiable from here** — both hosts refused the connection (ECONNREFUSED). No ad-network presence is recorded in the earlier peer benchmark either (`docs/audit/2026-09-06/findings-agent-b-peer-benchmark.md`, 18 operators) | — |

**Finding: none of the operators that could be checked runs display advertising on its official site.** The pattern across all of them is the same — the official site advertises the operator's own services, and commercial advertising happens on the physical asset and in the retail estate, not on the disclosure channel.

That is not an accident of taste. It reflects two things: an official site is a regulated communications channel, and the money is elsewhere. Indian practice is explicit about the physical side: the Ministry of Road Transport & Highways has "a policy of not allowing erection of advertisement hoardings on National Highways within the Right of Way as they might distract the attention of drivers", with only name-or-logo participation on road signs permitted ([MoRTH guidelines on display of advertisements, circular of 25 November 2010](https://morth.gov.in/sites/default/files/comprehensive_compendium_circular/144.20-25.11.2010-Guidelines%20display%20of%20advertisement%20dt.%20on%2025th%20nov.%202010..pdf)). NHAI enforces it — in June 2025 it objected to a municipal body allocating advertising space alongside national highways on safety grounds ([Business Standard, 10 June 2025](https://www.business-standard.com/india-news/nhai-raises-concerns-over-mcd-s-advertising-parking-on-national-highways-125061000780_1.html)). Bangladesh has a parallel rule: under the Highways Act 2021, no billboard, signboard or arch may be placed on a highway without RHD permission, with penalties up to two years' imprisonment or a fine of ৳5,000–৳5 lakh ([The Business Standard, on the passage of the Highways Bill 2021](https://www.tbsnews.net/bangladesh/transport/highways-bill-passed-parliament-335566)).

---

## 3. Google AdSense eligibility, realistically

### 3.1 What Google actually requires

From [AdSense eligibility requirements](https://support.google.com/adsense/answer/9724?hl=en):

- the applicant must own the site and have access to its HTML source;
- the applicant must be 18 or over (in practice, for a company, an authorised person with the company's bank and tax details);
- "Your content must be high-quality, original, and attract an audience";
- the site must comply with the programme policies before sign-up.

From the [AdSense programme policies](https://support.google.com/adsense/answer/48182?hl=en): publishers must follow the Google Publisher Policies; ads may not be placed on non-content-based pages or on pages made only to show ads; ads may not be placed so as to be mistaken for navigation or site content.

### 3.2 How that lands on a corporate disclosure site

Google publishes no carve-out for institutional or corporate sites, and no prohibition either. The realistic reading:

| Factor | Reading for dhakabypass.com |
|---|---|
| Original content | Passes. The content is original, trilingual and specific — a toll calculator, a corridor map, statutory pages |
| "Attracts an audience" | Unknown. Traffic is not yet measured (section 4). This is the main approval risk |
| Content-based pages | Mixed. The audit lists six thin or placeholder pages indexed today. Applying while `/press-releases` says "no press releases yet" invites a rejection |
| Required pages (about, contact, privacy) | Passes. All three exist |
| HTTPS | Passes |
| Policy compliance | Passes on content; the risk is in placement, not in the material |
| Duplicate content across `en`/`bn`/`zh` | Should be fine — hreflang and canonicals are correct (audit §4.15 A/B) — but three locales of the same page is a pattern reviewers look at |

**Approval risk, stated plainly:** approval is plausible but not assured, and a rejection is usually explained in a single generic sentence ("low value content" being the common one), which then costs weeks of appeal. More importantly, **approval risk is not the real risk.** The engineering concessions in section 5 — a materially weaker Content-Security-Policy and a second consent category — have to be made *before* Google will see ads on the page. If the application is then refused, DBEDC has paid the security and privacy cost and earned nothing.

A separate point for management: the AdSense account would be a DBEDC commercial relationship with Google LLC, carrying a payee name, a bank account, tax identification, and Google's own terms. That is a corporate decision with a signature on it, not a website setting.

---

## 4. Revenue, realistically

### 4.1 What is known about traffic today

- GA4 was created on 19 September 2026 and is **not live**. Nothing has been measured through it.
- **Cloudflare Web Analytics is running** and is the site's only third-party script — 10 KiB, 0 ms blocking (plan `:659`).
- Search Console has never been verified by tag; a second verification field (Bing) only landed on 19 September (plan W10.1).

So the honest position is: **no page-view figure exists yet.** No number in this section is a forecast.

### 4.2 The method

Use this, with DBEDC's own measured inputs, once there are 30 days of data.

```
monthly gross ad revenue  ≈  (monthly page views ÷ 1,000) × page RPM
```

where **page RPM** is gross revenue per 1,000 page views, net of nothing, and is the only figure worth tracking. Expanded, so each assumption is visible:

```
page RPM  =  ad units per page
           × fill rate           (share of requests that return a paid ad)
           × viewability         (share of returned ads actually seen)
           × consent rate        (share of readers who accept ad cookies)
           × CPM ÷ 1,000 × 1,000
```

Steps, in order:

1. Take 30 days of page views from Cloudflare Web Analytics, split by country. Bangladesh, Gulf-country diaspora and China traffic price very differently.
2. Exclude the admin tree; it is not measured and would not carry ads.
3. Get GA4 live and record consent acceptance rate. This is a real multiplier here, because the banner gives Reject the same weight as Accept by design (`components/chrome/ConsentBanner.jsx:20–24`), and without ad consent the ad request either must not be made at all or returns non-personalised, lower-priced inventory.
4. Run ads on a small, non-statutory subset for 60–90 days before believing any RPM.
5. Compare gross revenue against the cost lines in 4.4.

### 4.3 A realistic RPM range for Bangladesh

Google publishes no country-level RPM. Every figure in circulation comes from ad-network marketing blogs and is unverifiable. With that caveat stated, the published estimates are consistent about the direction: Bangladesh sits in the lowest tier, and Bangla-language inventory prices below English-language inventory from the same country. One vendor reports a tech site in English at a **CPM of US$0.68** and the same site in Bangla at **US$0.13** ([AP Digital, "Google AdSense CPM rates in Bangladesh"](https://apdigi.in/google-adsense-cpm-rates-in-bangladesh/)); another places Bangladesh in a "Tier 3, under US$3 CPM" band with India and Indonesia ([awisee CPM survey](https://awisee.com/blog/youtube-cpm-rates/)). **Treat both as indicative vendor content, not as data.** The only defensible number will be DBEDC's own, after 60–90 days.

**Illustrative arithmetic, with a hypothetical input to show the shape of the answer.** If the site were to record 10,000 page views a month, then at a page RPM of US$0.20–1.00 the gross would be **US$2–10 a month**. At 100,000 page views a month it would be US$20–100 a month. Both inputs are hypothetical; substitute the measured figure and the arithmetic is the whole method.

For context on why the low end is the likely one: this is an institutional site with a small, task-driven audience. A reader arrives to find a toll rate or a helpline, finds it, and leaves. That behaviour produces few page views and low engagement per visit — which is exactly the traffic pattern that prices worst.

Note also that AdSense does not pay a balance out until it passes Google's payment threshold, so a very small monthly accrual may sit unpaid for a long time; check the current threshold in the AdSense Help Centre before assuming any cash timing.

### 4.4 The costs on the other side of the ledger

None of these is hypothetical.

| Cost | Nature |
|---|---|
| Legal review of the concession, financing and constitutional documents | One-off, professional fees |
| Board and, probably, grantor and lender consents | One-off, and slow |
| Privacy notice, cookie schedule and consent-record changes | Engineering plus legal |
| A materially weaker Content-Security-Policy, permanently | Security posture, section 5 |
| Ongoing content policing of what appears on the site | Staff time, indefinitely |
| Tax and audit treatment of a foreign-platform income line | Annual |
| Performance regression on a site already scoring 44 on mobile | Reader harm and SEO |

**The plain conclusion.** On an institutional site with traffic in this range, advertising revenue is very likely to be a small number of US dollars per month — smaller than the cost of the professional advice needed to approve it, and very much smaller than any of the alternatives in section 6.

---

## 5. What it would break here — with file and line references

All references are to the state of the repository on 19 September 2026. **No code was changed to write this document.**

### 5.1 The Content-Security-Policy

`next.config.mjs:108–153` builds one CSP string; `next.config.mjs:175` applies it, enforcing, to `/:path*`. The relevant directives today:

| Line | Directive today |
|---|---|
| `:115` | `script-src 'self' 'unsafe-inline'` + (`'unsafe-eval'` in dev only) + `https://www.googletagmanager.com` + `https://static.cloudflareinsights.com` |
| `:118` | `style-src 'self' 'unsafe-inline'` |
| `:119` | `img-src 'self' data:` |
| `:120` | `font-src 'self'` |
| `:122–123` | `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://api.tomtom.com https://cloudflareinsights.com` |
| `:132` | `frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com` |
| `:124`, `:136`, `:145` | `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'` |

**What AdSense requires.** Google's own integration guidance is unusually blunt: it supports only a **strict, nonce-based** CSP and not an allowlist, "because the domains that the AdSense ad code uses change over time". Its recommended policy is:

```
object-src 'none';
script-src 'nonce-{random}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:;
base-uri 'none';
```

([Integrate the AdSense ad code with a Content Security Policy](https://support.google.com/adsense/answer/16283098?hl=en)). Google adds that the nonce must be applied to **every** script tag on the page, and that "more restrictive policies may break without notice."

So there are exactly two routes, and both are bad here.

**Route A — the nonce route (what Google supports).** Next generates a per-request nonce only from middleware. `middleware.js` is on this project's do-not-modify list, which is recorded in the CSP comment itself at `next.config.mjs:83–89` ("The correct answer is a per-request nonce, and Next generates one only from middleware… so that route is closed"), and it runs on the edge runtime where this app's data layer cannot load (`app/[...unmatched]/page.jsx:22`, `lib/redirects/repo.js:19`, `lib/i18n/request-locale.js:11`). Taking this route means reopening middleware, adding nonce plumbing to every script the app emits — including the pre-paint theme script and the consent-defaults script at `components/chrome/Analytics.jsx:68` — and accepting `'unsafe-eval'` in production anyway, because Google's own recommended policy includes it.

**Route B — the permissive route (what most publishers do).** Minimum viable change:

| Directive | From | To |
|---|---|---|
| `script-src` | `'self' 'unsafe-inline'` + 2 named hosts | add `'unsafe-eval'` in production, plus either `'strict-dynamic'` with a nonce or `https:` — in practice, script from any HTTPS origin |
| `frame-src` | `'self'` + 2 video hosts | add `https://googleads.g.doubleclick.net`, `https://tpc.googlesyndication.com` (ad creatives render in cross-origin iframes) |
| `img-src` | `'self' data:` | add `https:` — creative images come from advertiser CDNs that are not enumerable |
| `connect-src` | `'self'` + 4 named hosts | add `https://pagead2.googlesyndication.com` and, in practice, more |
| `font-src` | `'self'` | likely `https:`, since creatives load their own faces |

**What that costs, precisely.** Today, an injected `<script src="https://attacker.example/x.js">` — from a stored XSS in an admin-authored rich-text field, a compromised dependency, or a compromised host — does not execute, because only two script origins are allowed. That is the single control the comment at `next.config.mjs:83–89` relies on to justify keeping `'unsafe-inline'`: "`unsafe-inline` still blocks script from any other ORIGIN, which is what stops an injected `<script src="https://attacker/">`." Under route B that control is gone, and `'unsafe-eval'` additionally allows string-to-code execution. The residual protections would be `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'` and the iframe stripping in `lib/html/sanitize.js`. For a site that holds a grievance database, an admin panel and the toll record, that is a real reduction, not a paperwork one. The audit scored cybersecurity posture 5/10 with the headers counted as a strength (§3, row 11); this trades that strength away.

### 5.2 Google Consent Mode

`components/chrome/Analytics.jsx:47–69` sets Consent Mode v2 defaults **before** gtag.js loads. Line `:55` denies the three advertising signals explicitly:

```
'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied',
```

with `analytics_storage` also denied and `wait_for_update:500` (`:56`). `:59–60` re-grants **only** `analytics_storage` when a stored choice from a previous visit exists.

`components/chrome/ConsentBanner.jsx` is a two-button banner over a single stored key. It grants only `analytics_storage` (`:58–60`), and the footer's re-open control denies only `analytics_storage` (`:42–52`, specifically `:46`). The storage key is a single string, `db-analytics-consent`, shared with the footer control through `components/chrome/consent-key.js:6–7`.

**What ads would need.**

1. **A second consent category.** One key cannot hold two answers. `consent-key.js` gains a second key (e.g. `db-ads-consent`), or the single key becomes a small JSON record — and a migration path for readers who already answered.
2. **A three-choice banner** — reject all / analytics only / analytics and advertising — with Reject still the same size and weight as Accept, which is the banner's stated design principle (`ConsentBanner.jsx:20–24`). A two-button banner that bundles ads into "Accept" is not consent for the ad purpose.
3. **Granular updates**, so `ad_storage`, `ad_user_data` and `ad_personalization` move independently of `analytics_storage`, in both `decide()` and the re-open handler.
4. **The ad tag must not load at all without consent.** Consent Mode with `ad_storage` denied still permits non-personalised ad serving. If the intent is "no ad request until the reader agrees", the ad block must not render its script, which makes the slot a client component gated on stored consent — and that in turn is a layout-shift problem (5.5).
5. **Documents.** The privacy notice and cookie schedule are rebuilt on a processing inventory under W8C.4 (audit CON-PRIV-01..06). Advertising cookies are new processing by a new processor and must be in that inventory, named, with a purpose and a retention period. `lib/i18n/overrides.js` and `tests/unit/ui-strings-overrides.test.js` carry the consent strings, in three languages.

### 5.3 The CI page-weight budget — and why it would *not* catch this

`scripts/page-weight.mjs` runs in CI at `.github/workflows/ci.yml:130`, against the budgets in `scripts/page-weight.budget.json`:

| Budget | Value |
|---|---|
| `sharedJsGzipKb` | 145 |
| `cssGzipKb` | 60 |
| `unconditionalFontsKb` | 100 |
| `routeJsGzipKb` `/[locale]/layout` | 60 |
| `routeJsGzipKb` `/[locale]/[[...slug]]/page` | 120 |
| `routeJsGzipKb` `/[locale]/news/[slug]/page` | 60 |

**Correction to a common assumption.** This script measures the **gzipped bytes of files this build ships**, read from `.next/build-manifest.json` and `.next/app-build-manifest.json` (`scripts/page-weight.mjs:56–80`, check at `:141–164`). A remote ad tag is not in any manifest. So an AdSense tag would add perhaps one or two kilobytes of first-party wrapper to `/[locale]/[[...slug]]/page` — comfortably inside the 120 kB budget — and **the build would stay green while the page got materially slower**. There is no Lighthouse or third-party-weight gate in CI at all.

That is worse than the budget failing. The guardrail the team believes it has would not fire. If ads ship, a third-party budget check has to ship with them (section 8.7).

### 5.4 Measured performance, and what ad tags do to it

Lighthouse 12.8.2, mobile emulation, simulated throttling, 19 September 2026 (plan `:638–661`):

| Metric | Now |
|---|---|
| Performance | **44** |
| First Contentful Paint | 3.1 s |
| Largest Contentful Paint | **5.8 s** (TTFB 607 ms, load delay 1,518 ms, load time 2,807 ms, render delay 915 ms) |
| Total Blocking Time | **1,690 ms** |
| Cumulative Layout Shift | **0.002** |
| Speed Index | 4.6 s |
| Time to Interactive | 6.2 s |
| Total transferred | 844 KiB |
| Third party | Cloudflare Web Analytics beacon only — 10 KiB, **0 ms blocking** |

The site currently has **one** third-party script that blocks the main thread for zero milliseconds. An ad tag is the opposite kind of dependency: a loader script, an auction, and one cross-origin iframe per slot, each with its own script and its own images.

What to expect, stated as mechanism rather than as invented numbers:

- **TBT rises.** TBT is already 1,690 ms against a "good" threshold of 200 ms, and the plan's own W10.20 identifies the corridor map's hydration as the largest existing item. There is no main-thread headroom to spend.
- **LCP can regress directly.** LCP is the hero image (W10.19). An ad slot placed above it competes for bandwidth and for the browser's resource priority during exactly the window W10.19 exists to protect. If a slot ever *becomes* the largest element, LCP becomes a third party's latency.
- **CLS regresses unless every slot has a reserved box.** 0.002 is effectively perfect and the navigation audit already records CLS as a value that must not regress. An ad that arrives late into an unsized container is the textbook CLS failure.
- **The performance score falls further from 44.** The site is one of the audit's open problems, not a site with room to give away.

The discipline, if ads go ahead: run the same Lighthouse configuration before and after, on the same URL, and record both. Do not accept "it looks fine".

### 5.5 The block system

Every public route is a block document. `lib/blocks/registry.js` declares one module per block type, with `fields` driving both the admin form and the validator (`registry.js:1–10`; field types at `:10` are `text`, `richtext`, `image`, `number`, `list`, `select`). `lib/blocks/index.js` holds the `ALL` array at `:65`; a type absent from it renders **nothing, silently**, which is why `tests/unit/blocks-registry-coverage.test.js` exists. There are 51 types in `lib/blocks/types/`.

So an ad slot must be a block type — `lib/blocks/types/ad-slot.js` plus `components/blocks/AdSlotBlock.jsx`, registered in `index.js` — for the same reason as everything else: the plan's first global constraint is that nothing user-visible may be added in code (`plan:21`). An operator would then place it from `/admin`, on a page, in a position, like any other block.

That has one consequence management should understand: **once it is a block, any operator can put it on any page**, including a page that must never carry one. The allow-list therefore has to be enforced in code, not in a policy document (section 8.2).

---

## 6. The alternatives

This is the part worth DBEDC's time. A tolled expressway concession has real ancillary revenue lines, and the peers in section 2.4 use them. World Bank contract precedents recognise the category: in some concessions "full revenues go to the private sector — including toll revenues, commercial revenues, and revenues from services rendered to third parties" ([World Bank PPP Resource Center, road concessions](https://ppp.worldbank.org/sector/transportation/roads-tolls-bridges/road-concessions)). Whether that is true of *this* concession is a clause in DBEDC's agreement, not a general fact.

In every case below, "what it needs from DBEDC" begins with the same item: the concession clause that says whether DBEDC may do it and who shares the proceeds.

### 6.1 Roadside and plaza advertising rights

| | |
|---|---|
| **Who pays** | Outdoor-advertising agencies and brands, usually a single media contractor who sub-lets |
| **What it is worth** | Materially more than website ads, because it is priced on traffic volume, not page views. Real, tendered market: MSRDC leased the right to display advertisements at the Talegaon and Khalapur toll plazas on the Mumbai–Pune Expressway, on a 1,095-day contract with an EMD of ₹13,71,265 ([tender listing](https://www.tendersontime.com/india/details/leasing-right-display-advertisments-toll-plazas-talegaon-and-khalapur-along-mumbai-pune-expressway-51c206b/)) — evidence of the market, not a price for this corridor |
| **What it needs from DBEDC** | The concession clause on advertising and structures in the right of way; **RHD permission**, which the Highways Act 2021 requires for any billboard or signboard on a highway ([TBS](https://www.tbsnews.net/bangladesh/transport/highways-bill-passed-parliament-335566)); a road-safety assessment of every proposed location; an open tender; a content policy with exclusions; grantor and lender consent |
| **Risk** | **Safety and permissions, not reputation.** Mainline hoardings inside the right of way are the thing highway authorities refuse: MoRTH's policy is not to allow them at all, for driver distraction ([MoRTH circular, 25 Nov 2010](https://morth.gov.in/sites/default/files/comprehensive_compendium_circular/144.20-25.11.2010-Guidelines%20display%20of%20advertisement%20dt.%20on%2025th%20nov.%202010..pdf)), and NHAI actively objects to municipal ads beside highways ([Business Standard](https://www.business-standard.com/india-news/nhai-raises-concerns-over-mcd-s-advertising-parking-on-national-highways-125061000780_1.html)). The realistic surface is therefore **plaza buildings and canopies, toll-ticket and receipt space, service-area land and land outside the right of way** — not the carriageway |

### 6.2 Service areas, fuel, food and rest stops

| | |
|---|---|
| **Who pays** | A wayside-amenity developer or operator, fuel retailers, food brands, and the tenants beneath them |
| **What it is worth** | The largest non-toll line on comparable roads, and it is structured as a long lease plus revenue share rather than rent alone. NHAI's June 2024 guidelines lease authority land for up to 30 years, awarded to the bidder quoting the **highest annual revenue share**, with a threshold that annual rental plus estimated revenue share reach at least 5% of land cost ([NHAI wayside amenities guidelines, 11 June 2024](https://www.cfiindia.com/pdf/goverment-circular-and-notification/NHAI-Guidelines-Wayside-Amenities(11.06.2024).pdf), [NHAI WSA brochure](https://nhai.gov.in/nhai/sites/default/files/mix_file/NHAI_WSA_Brochure.pdf), [Business Today](https://www.businesstoday.in/latest/economy-politics/story/nhai-offers-30-year-land-lease-to-private-players-to-develop-wayside-amenities-on-highways-287627-2021-02-15)). Bangladeshi precedent exists: BBA tendered a long-term lease for the operation and maintenance of Padma Bridge **Service Area-2** at Janjira, Shariatpur ([tender listing](https://www.globaltenders.com/tender-detail/95550657-long-term-lease-for-operation-and-maintenance-of-service-area-2-facilities-developed-in-connection-with-padma-bridge-at-janjira-shariatpur-bangladesh)) |
| **What it needs from DBEDC** | **A fact-find first.** This repository shows the corridor's service areas are unconfirmed: a `card-grid` block on `travel/facilities` claims "Two service areas, one in each direction" while `interchanges` holds **zero** `service_area` rows (`docs/audit/2026-09-12-cms-consistency-audit.md`, item 5.10), the live page says "No service areas have been published yet" (audit §4.5), and the client-supplied corridor data marks "Bhaowal service area K16+200" as "not in the real data" (`docs/source-data/2026-09-02-client-supplied-corridor-data.md:143`). So: confirm what is built or planned, whether the land is inside the concession, then the lease/revenue-share structure, RHD consent, and a tender |
| **Risk** | Low reputationally; ordinary commercial and construction risk. Long lead time. Also fixes a live content gap on the site |

### 6.3 Fibre-optic and utility corridor leasing

| | |
|---|---|
| **Who pays** | Licensed transmission operators and utilities wanting a protected duct along a new corridor between Gazipur and Narayanganj |
| **What it is worth** | Potentially the best margin per unit of effort, because the asset is a duct that either exists or can be laid once. NHAI is building an OFC network of about 146,000 km along its highways, with six ducts per corridor and 96-core dark fibre offering 144 fibre pairs **for leasing**, explicitly to create a new revenue stream, starting with the Delhi–Mumbai Expressway and the Hyderabad–Bangalore corridor ([tele.net.in](https://tele.net.in/digital-highways-nhai-leads-the-way/), [Digital Watch](https://dig.watch/updates/nhai-embarks-on-an-ambitious-optical-fibre-network-initiative-across-indias-highways)) |
| **What it needs from DBEDC** | A duct inventory along the corridor (what exists, what is spare, what can be added during remaining construction — cheapest while the road is still being built); the concession clause on third-party use of project assets and land; RHD consent; **lender consent**, because this encumbers a secured asset; and a regulatory check — in Bangladesh nationwide transmission is a licensed activity held by NTTN licensees (Summit Communications, Fiber@Home, PGCB, Bangladesh Railway) under BTRC licence ([TBS on NTTN networks](https://www.tbsnews.net/bangladesh/telecom/bar-equipment-import-telcos-gets-way-fibre-optic-network-expansion-306757)), so DBEDC's role is landlord of duct and right of way, not seller of bandwidth |
| **Risk** | Moderate and manageable: contractual and regulatory, not reputational. Also directly useful to the concession itself — the corridor needs fibre for ITS, ETC and CCTV anyway (audit §4.6) |

### 6.4 Sponsorship of specific site features, with a named sponsor

| | |
|---|---|
| **Who pays** | One or two institutions per feature: an insurer, a bank, a tyre or lubricant brand, a logistics company, a telecom operator |
| **What it is worth** | Less per impression than an ad network, and far more per unit of risk. It is sold on association with a named public asset, not on CPM. Any price is negotiated, so no figure is offered here |
| **What it needs from DBEDC** | A short sponsorship policy: which features may be sponsored (the live traffic map and the weather advisory are the sensible candidates), which pages may never be (section 8.2), a categorical exclusion list, a maximum of one sponsor per page, no sponsor logo above the fold on any travel page, a written right to remove a sponsor immediately, and the grantor's view on a private brand appearing beside a public road's name. Plus a rate card and an invoice route |
| **Risk** | Low, and controllable, because DBEDC chooses the sponsor and sees the creative. **Engineering cost is near zero**: a sponsor is a static image and a link served from this origin, so `img-src 'self'` holds, no third-party script runs, the CSP is untouched, no new consent category is needed, page weight is one optimised image, and CLS stays 0.002 because the box is authored with fixed dimensions. This is the only advertising-like option that fits a disclosure site |

### 6.5 Licensed or paid access to the open-data feeds

| | |
|---|---|
| **Who pays** | Navigation and mapping providers, logistics and fleet platforms, insurers, ride-hailing operators, researchers |
| **What it is worth** | Modest in cash. Its real value is standing: being the authoritative source of corridor status for the apps drivers actually use |
| **Where it stands today** | W9.4 already publishes `/api/public/corridor-status` (JSON), `traffic-monthly.csv`, `traffic-history.csv` and `advisories.ics`, with CORS, a 60-second public cache and 60 requests a minute per address, listed by the `open-data` block on `disclosures/open-data`. **The reuse terms are an unwritten field that currently says "not yet published"** (plan `:592`). Crawlers can now reach them (W10.7, done 19 Sep) |
| **What it needs from DBEDC** | Write the reuse terms **first** — that is an open item regardless of revenue. Then decide the tiering: keep the public feeds free and openly licensed (recommended; they are safety and ITS information, and the audit treats open data as a credibility asset), and licence a commercial tier — higher rate limits, an availability commitment, bulk history, a support contact — under a paid agreement. Also decide who owns the traffic data under the concession: DBEDC or RHD. And confirm the feeds carry no personal data |
| **Risk** | Low, provided the free public tier is never degraded to make the paid tier attractive. Doing that would be a reputational own goal larger than the revenue |

### 6.6 Advertising in a future mobile app, rather than on the disclosure site

| | |
|---|---|
| **Who pays** | Ad networks, or direct sponsors |
| **What it is worth** | Unknowable, and premature. There is no app. The plan deliberately puts SMS and WhatsApp advisories **before** any app (W4.13) |
| **What it needs from DBEDC** | An app first, with its own privacy notice, its own consent flow, its own store listings and its own support load. Then the same governance questions as section 2, because the concessionaire's name is on it either way |
| **Risk** | The governance risk does not disappear by moving the ads to a different surface; only the CSP and page-weight problems do. Park this until an app exists for its own reasons |

---

## 7. Recommendation

**One line:** do not put third-party ad networks on dhakabypass.com; pursue plaza and service-area commercial rights and fibre-corridor leasing, and if a site-based revenue line is wanted, sell a single named, labelled sponsor for the live traffic map and the weather advisory.

| Option | Revenue potential | Governance risk | Effort | Verdict |
|---|---|---|---|---|
| AdSense or any ad network on the disclosure site | Very low — likely single-digit US dollars a month until traffic is measured and shown otherwise | **High.** Unreviewed third-party content beside statutory disclosures, an emergency number and gazetted toll rates; weakened CSP; new consent category; new processing | Medium engineering, high legal | **Do not do this** |
| Ads on statutory, emergency, grievance, toll or advisory pages specifically | Negligible | **Unacceptable** | — | **Do not do this, under any circumstances** |
| Named, labelled sponsor for the live traffic map and the weather advisory | Low to moderate, negotiated | Low, and controllable — DBEDC picks the sponsor and sees the creative | **Low.** No third-party script, no CSP change, no consent change, one image | **Do this**, after a written sponsorship policy and grantor sign-off |
| Plaza and service-area advertising rights (physical) | Moderate to high | Low reputationally; safety and permission risk is the real constraint | Medium — tender, RHD permission, safety assessment | **Do this**, subject to the concession clause and RHD permission |
| Service areas, fuel, food, rest stops | **Highest** of the options here, on peer evidence | Low | High, long lead time | **Do this** — and start with the fact-find, because the corridor's service areas are unconfirmed in our own records |
| Fibre and utility corridor leasing | Moderate to high, best margin per unit of effort | Low-to-moderate: needs lender consent and a BTRC/NTTN structure | Medium | **Do this** — and do the duct question *now*, while construction is still open |
| Commercial tier over the open-data feeds | Low cash, high standing | Low, if the free tier is untouched | Low — the feeds exist | **Needs a decision from DBEDC**: the reuse terms are unwritten today and must be written regardless |
| Ads in a future mobile app | Unknown | Same as the site, moved | High — there is no app | **Needs a decision from DBEDC**, but not now |
| Sponsorship or advertising anywhere on the site *before* the W8C.1 corrections land | — | — | — | **Do not do this.** The audit's critical findings are still open. Monetising a site that has no emergency number on every page and contradictory toll figures is the wrong order of work |

**Three reasons, for the board minute.**

1. **The site's job is disclosure, and ad networks put unreviewed third-party content beside statutory pages and emergency numbers.** No peer operator that could be checked — PLUS, Linkt/Transurban, FDEE, BBA — does this.
2. **The money is not there.** Traffic is not yet measured, Bangladesh is the lowest-priced ad market tier, and an institutional site's task-driven readers generate few page views. The professional fees needed to approve the decision would exceed the annual revenue.
3. **The engineering price is paid up front and is permanent.** Google's own guidance rules out an allowlist CSP, so `script-src` goes from two named hosts to effectively any HTTPS origin plus `'unsafe-eval'` — on a site with an admin panel and a grievance database — and the CI page-weight budget would not even notice the regression.

**Sequencing.** W8C.1 and W8N.1 first (emergency number, misleading toll figures). Then the concession-clause read. Then the physical and fibre lines, which are where the value is.

---

## 8. If ads go ahead anyway — implementation

This section exists so that a decision to proceed is implemented safely rather than improvised. Everything in section 5 still applies.

### 8.1 Preconditions, before any code

1. Written legal opinion on the concession, financing and constitutional documents (section 2.1).
2. Board approval, plus any grantor, PPPA and lender consents the opinion identifies.
3. A written advertising content policy with a categorical exclusion list and a named owner who can pull a creative within one working day.
4. The privacy notice, cookie schedule and processing inventory updated and cleared (W8C.4).
5. W8C.1 closed. No monetisation of a site whose critical safety findings are open.
6. A measured baseline: Lighthouse mobile, same configuration as the 19 September run, recorded.

### 8.2 Which pages may carry an ad, and which must never

**Never**, enforced in code, not policy:

| Never | Slugs |
|---|---|
| Emergency and safety | `safety`, `safety/education`, `travel/breakdown`, `travel/locate` |
| Grievance and disputes | `grievances`, `travel/toll-dispute` |
| Statutory disclosure | `disclosures` and every child: `right-to-information`, `citizen-charter`, `policies`, `reports`, `environment`, `land-acquisition`, `consultations`, `tariff`, `open-data` |
| Toll | `travel/toll`, `travel/vehicle-classes`, `travel/payment`, and any page carrying `toll-table`, `toll-matrix`, `toll-calculator`, `toll-preview` |
| Advisories and live operations | `travel/advisories`, `travel/weather`, `travel/status`, `travel/cameras`, `travel/map` |
| Legal and governance | `privacy`, `terms`, `accessibility`, `about/governance`, `about/concession`, `about/integrity`, `procurement`, `contact` |
| Chrome | Header, footer, and any page rendering `emergency-strip` |
| Admin | The entire `/admin` tree, which `Analytics.jsx:13–15` already excludes from measurement |

**Possible**, if the decision is taken: `news` and news articles, `press-releases`, `gallery`, `gallery/videos`, `project/virtual-tour`, `downloads`, `faq`, `about/careers`, `about/recognition`. Note that several of these are the thin pages the audit flags, which is also where AdSense's "non-content-based pages" rule bites.

Enforcement, so an operator cannot place a slot by mistake:

- a `NO_ADS_SLUGS` set plus a prefix rule (`disclosures/*`, `travel/*` except the listed exceptions), read by the renderer;
- a second check on block type: any page containing `emergency-strip`, a toll block, `advisory-list`, `corridor-weather`, `traffic-status`, `request-form` or `request-status` refuses an ad slot regardless of slug;
- the admin refuses to add the block on such a page, with a reason shown, rather than silently dropping it;
- a unit test that asserts each slug in the never-list renders no ad slot, and a test that a seeded ad slot on a forbidden page renders nothing.

### 8.3 The ad-slot block

`lib/blocks/types/ad-slot.js`, registered in the `ALL` array of `lib/blocks/index.js:65` (a type absent from it renders nothing, silently), with `components/blocks/AdSlotBlock.jsx`.

| Field | Type | Purpose |
|---|---|---|
| `label` | `text` | Visible label, defaulting to the translated "Advertisement". Required |
| `slot` | `text` | The ad unit id. No secrets; the publisher id belongs in server environment configuration, as `lib/analytics/config.js` already does for the measurement id |
| `format` | `select` | A closed set of fixed sizes — e.g. `leaderboard-728x90`, `rectangle-300x250`, `mobile-320x100`. **No responsive or auto format**, because auto sizing is what destroys CLS |
| `placement` | `select` | `below-content` only, at first. Never above the `h1`, never between a form's fields, never inside a table |

Rules the component must obey:

- it renders nothing when advertising consent is absent, and nothing on a forbidden page;
- it reserves its exact box before the tag loads, from `format`, with `min-height` and `aspect-ratio` set in CSS, not JavaScript;
- it renders nothing at all — not an empty labelled box — when the slot is unfilled, so a reader never sees "Advertisement" over blank space;
- it is `loading="lazy"`/deferred, below the fold, and never in the critical path of the LCP image (W10.19);
- the configuration comes from the server, consistent with `Analytics.jsx:8–11` keeping the measurement id out of the client bundle.

### 8.4 CSP changes

As set out in 5.1. Route B is the realistic one. Do it in this order:

1. Add the directives to a **`Content-Security-Policy-Report-Only`** header first, alongside the enforcing one, exactly as Google advises, and watch the reports.
2. Keep the enforcing policy at `next.config.mjs:175` as narrow as the tag will tolerate. Prefer named hosts and widen only where a real violation report proves it necessary. Expect `script-src`, `frame-src`, `img-src`, `connect-src` and probably `font-src` to be affected.
3. Record, in the comment block at `next.config.mjs:61–90`, exactly which control was traded away and why — the existing comment's reasoning about blocking foreign script origins becomes false the moment this lands, and a stale security comment is worse than none.
4. Keep `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'` and the `<iframe>` stripping in `lib/html/sanitize.js`. Do not touch `frame-ancestors`.
5. Do not add ad hosts to the video block's `VIDEO_FRAME_HOSTS` list in `lib/blocks/video.js`; a test asserts that list matches `frame-src`, and it will need updating deliberately rather than accidentally.

### 8.5 Consent changes

As set out in 5.2: a second stored category, a three-choice banner with equal weight on refusal, granular Consent Mode updates in both `decide()` and the re-open handler, no ad request at all before consent, and a migration for readers holding the old single key. Add unit tests that assert the three advertising signals stay `denied` until the ad choice is granted, and that the footer's re-open control returns them to `denied`.

### 8.6 Labelling, accessibility and layout

- **Label.** Every slot carries a visible label. Google permits only "Advertisements" or "Sponsored Links" and forbids misleading headings ([ad placement policies](https://support.google.com/adsense/answer/4533986?hl=en)). Use "Advertisement", translated into all three languages through the normal i18n path, never hardcoded.
- **Never confusable with DBEDC content.** A visible boundary, a different background from the content surface, and never styled like a `callout`, a `card-grid` card or an advisory. An advisory-coloured ad on a corridor page would be a safety problem, not a design one.
- **Accessibility.** The slot is a labelled region (`role="complementary"` with an accessible name from the label, or a `<section>` with a heading), outside `<main>`'s reading order where layout allows; it must not appear between a form's label and its control; it must not steal focus; no auto-playing audio or video; it must respect `prefers-reduced-motion`; and the AA contrast floor of 4.70:1 recorded by the navigation audit applies to the label and the boundary. Keyboard order must stay clean with no trap — the existing audit records that as passing and it must keep passing.
- **Layout shift.** CLS is 0.002 and must not regress. Fixed-size formats only; the box reserved in CSS before the tag loads; nothing that resizes after fill; no slot above the LCP element; and no sticky or interstitial formats, which are both a CLS and an accessibility problem.

### 8.7 Verification, and the gate that has to exist

| Check | Where |
|---|---|
| Third-party weight and request count budget | New, because `scripts/page-weight.mjs` cannot see a remote tag (5.3). Assert a maximum number of third-party requests and bytes on the public shell, measured from a real page load |
| Lighthouse mobile before/after, same configuration | Recorded in the plan's W10 table, with LCP, TBT and CLS |
| CLS assertion | Playwright, on a page carrying a slot, asserting CLS stays at or below 0.002 |
| Forbidden-page tests | Unit: every slug in 8.2 renders no slot; a seeded slot on a forbidden page renders nothing |
| Consent tests | Unit: the three advertising signals stay denied until granted; re-open returns them to denied |
| CSP test | Assert the enforcing policy still contains `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'` |
| Registry coverage | Existing `tests/unit/blocks-registry-coverage.test.js` — the new type must be in `ALL` |

And one operational rule: a named person reviews what is actually appearing on the site weekly, on a phone, in all three languages. If nobody owns that, the site should not carry ads.

---

## Sources

Repository, read 19 September 2026:

- `docs/superpowers/plans/2026-09-06-dhakabypass-master-remediation.md` — global constraints `:21`, `:24`, `:25`, `:26`; W3 `:383`; W8C `:514`; W9.4 `:592`; W10 `:596`; Lighthouse reading `:638–661`
- `docs/audit/2026-09-14-concession-domain-audit.md` — §1, §2, §3, §4.1, §4.3, §4.5, §4.15, §4.17, §5
- `docs/audit/2026-09-12-cms-consistency-audit.md` item 5.10; `docs/source-data/2026-09-02-client-supplied-corridor-data.md:143`
- `next.config.mjs:61–90`, `:108–153`, `:175`; `components/chrome/Analytics.jsx`; `components/chrome/ConsentBanner.jsx`; `components/chrome/consent-key.js`; `scripts/page-weight.mjs`; `scripts/page-weight.budget.json`; `.github/workflows/ci.yml:130`; `lib/blocks/registry.js`; `lib/blocks/index.js`; `lib/blocks/types/`

External, accessed 19 September 2026:

- [AdSense eligibility requirements](https://support.google.com/adsense/answer/9724?hl=en)
- [AdSense programme policies](https://support.google.com/adsense/answer/48182?hl=en)
- [AdSense ad placement policies](https://support.google.com/adsense/answer/4533986?hl=en)
- [Integrate the AdSense ad code with a Content Security Policy](https://support.google.com/adsense/answer/16283098?hl=en)
- [PLUS Malaysia](https://www.plus.com.my/) · [Linkt (Transurban)](https://www.linkt.com.au/) · [FDEE](http://fdee.bd/) · [Bangladesh Bridge Authority](https://bba.gov.bd/)
- [MoRTH guidelines on display of advertisements, 25 November 2010](https://morth.gov.in/sites/default/files/comprehensive_compendium_circular/144.20-25.11.2010-Guidelines%20display%20of%20advertisement%20dt.%20on%2025th%20nov.%202010..pdf)
- [Business Standard, NHAI on advertising alongside national highways, 10 June 2025](https://www.business-standard.com/india-news/nhai-raises-concerns-over-mcd-s-advertising-parking-on-national-highways-125061000780_1.html)
- [The Business Standard, Highways Bill 2021 passed](https://www.tbsnews.net/bangladesh/transport/highways-bill-passed-parliament-335566)
- [Bangladesh PPP Act 2015 — FAOLEX record](https://www.fao.org/faolex/results/details/en/c/LEX-FAOC179711/) · [Act text](https://faolex.fao.org/docs/pdf/bgd179711E.pdf) · [PPPO note](https://www.pppo.gov.bd/events2015_enactment-of-the-bangladesh-public-private-partnership-ppp-act-2015.php)
- [World Bank PPP Resource Center — road concessions](https://ppp.worldbank.org/sector/transportation/roads-tolls-bridges/road-concessions)
- [UNB, Bangladesh signs PPP contract for Dhaka Bypass, Dec 2018](https://www.unb.com.bd/category/Bangladesh/bangladesh-signs-ppp-contract-for-dhaka-bypass/9772)
- [NHAI wayside amenities guidelines, 11 June 2024](https://www.cfiindia.com/pdf/goverment-circular-and-notification/NHAI-Guidelines-Wayside-Amenities(11.06.2024).pdf) · [NHAI WSA brochure](https://nhai.gov.in/nhai/sites/default/files/mix_file/NHAI_WSA_Brochure.pdf) · [Business Today, 30-year land lease](https://www.businesstoday.in/latest/economy-politics/story/nhai-offers-30-year-land-lease-to-private-players-to-develop-wayside-amenities-on-highways-287627-2021-02-15)
- [Padma Bridge Service Area-2 long-term lease tender listing](https://www.globaltenders.com/tender-detail/95550657-long-term-lease-for-operation-and-maintenance-of-service-area-2-facilities-developed-in-connection-with-padma-bridge-at-janjira-shariatpur-bangladesh)
- [MSRDC toll-plaza advertisement rights tender listing, Mumbai–Pune Expressway](https://www.tendersontime.com/india/details/leasing-right-display-advertisments-toll-plazas-talegaon-and-khalapur-along-mumbai-pune-expressway-51c206b/)
- [tele.net.in, Digital Highways: NHAI leads the way](https://tele.net.in/digital-highways-nhai-leads-the-way/) · [Digital Watch, NHAI optical fibre initiative](https://dig.watch/updates/nhai-embarks-on-an-ambitious-optical-fibre-network-initiative-across-indias-highways)
- [The Business Standard, on NTTN fibre networks in Bangladesh](https://www.tbsnews.net/bangladesh/telecom/bar-equipment-import-telcos-gets-way-fibre-optic-network-expansion-306757)
- Indicative, vendor-published and **unverified** CPM estimates, cited only to show the direction: [AP Digital on AdSense CPM in Bangladesh](https://apdigi.in/google-adsense-cpm-rates-in-bangladesh/), [awisee CPM survey](https://awisee.com/blog/youtube-cpm-rates/)

**Not verifiable from this machine:** `nhai.gov.in` and `tis.nhai.gov.in` refused connections (ECONNREFUSED), so NHAI's own site was not inspected for advertising directly. The earlier 18-operator peer benchmark records no ad-network presence on any peer.

---

## Appendix: measured traffic and projected revenue (19 September 2026)

The projection above used a method with no traffic figure in it, because none
existed. One does now. This is counted from the origin access log
(`~/logs/dhakabypass.com.aeos365.com-ssl_log-Sep-2026.gz`), which sees every
page request: Cloudflare caches static files but the HTML is dynamic
(`cf-cache-status: DYNAMIC`), so no page view is hidden from it.

### What was counted, and what was removed

| Step | Requests |
|---|---|
| All page requests, 31 Aug – 19 Sep 2026 | 33,057 |
| Less self-identifying bots (bingbot, scanners, Palo Alto, curl, monitors) | −6,136 |
| Less the development IP range 103.159.254–255.x | −13,052 (mostly 14–16 Sep, the build days) |
| Less headless browsers (our own Lighthouse runs and similar) | −1,456 |
| **External page views remaining** | **15,724** from **2,340 unique IP addresses** |

Twenty days, so roughly **790 page views a day, about 23,600 a month** across
the whole site. Treat it as a ceiling: unidentified crawlers with ordinary
browser user-agents are still in it, and a 2,340-address spread over twenty
days is consistent with a site that is discovered rather than one with a
returning audience.

### What lands on a page that carries advertising

| Page | Views (20 days) | Units placed |
|---|---|---|
| `/` (home) | 3,405 | 1 |
| `/project` | 446 | 2 |
| `/travel/status` | 390 | 1 |
| `/sustainability` | 358 | 1 |
| `/about` | 346 | 1 |
| `/travel/rules` | 141 | 2 |
| `/media`, `/gallery/videos` | under 110 each | 1 each |

About **5,300 views in twenty days — near 7,900 a month — reach a page with an
advertisement on it**, roughly a third of the site's traffic. The home page is
two thirds of that on its own. The pages with the most traffic after it are
`/safety`, `/travel/toll`, `/contact` and `/disclosures`, and every one of
those is deliberately excluded.

### The projection

Revenue = (ad-page views ÷ 1,000) × page RPM. Bangladesh is the lowest-priced
advertising market on every published table; no verified RPM figure for it
exists in a source worth citing, so the range below is bracketed rather than
asserted.

| Page RPM | Monthly | Annual |
|---|---|---|
| US$0.20 (pessimistic, Bangla-majority traffic) | **US$1.60** | US$19 |
| US$0.50 | **US$3.95** | US$47 |
| US$1.00 (optimistic for this market) | **US$7.90** | US$95 |
| US$2.00 (unlikely) | US$15.80 | US$190 |

**The number that decides it: AdSense pays out at US$100.** At the middle of
that range the first payment arrives after roughly **two years**. At the
optimistic end, thirteen months.

### What would actually change the figure

1. **Traffic, by an order of magnitude.** Revenue is linear in page views. The
   work that moves it is the Search Console and content programme already
   specified in `2026-09-19-post-launch-seo-and-marketing.md`, not more ad
   units. Ten times the traffic is ten times the revenue; twice the ad units
   is not twice the revenue.
2. **News articles.** `/news` is the ninth most-visited path and articles are
   the natural place for advertising, but they are rendered from `news_updates`
   by a template, not from blocks, so no unit can be placed there today. If
   advertising is going ahead, that template is the single highest-value
   change — it is where a press-release programme would compound.
3. **Where the readers are.** RPM follows the advertiser market, not the
   publisher. Traffic from Bangladesh earns a fraction of the same traffic from
   the Gulf, Singapore or the UK, and this corridor's audience is
   overwhelmingly domestic.

### The honest summary

The system is built, placed and tested; it turns on with a publisher ID. What
it will earn, on today's traffic, is **a few dollars a month**, and the first
payout is one to two years away. Nothing in the engineering changes that —
only traffic does. The service-area and fibre-corridor lines in section 6
remain larger by orders of magnitude.
