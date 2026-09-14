# DBEDC concession-website domain audit — 14 September 2026

**Subject:** https://dhakabypass.com (en / bn / zh), the public website of Dhaka Bypass Expressway Development Company Ltd (DBEDC).
**Lens:** how well the site works as the official front door of a tolled PPP expressway concessionaire, judged on business, regulatory, operational, stakeholder, SEO and digital-presence grounds. Visual design, WCAG detail and admin UX are out of scope and are covered in `docs/audit/2026-09-14-ui-audit.md` (in progress), `docs/audit/2026-09-14-admin-cms-journey-audit.md` and `docs/audit/2026-09-06/`.
**Method:** audit only. No source file was changed, nothing was committed or deployed, and no form on the live site was submitted. Evidence comes from four places:

- all 189 sitemap URLs (63 pages × 3 locales), fetched and parsed on 14 Sep 2026;
- passive header, TLS and DNS reads;
- browser Performance API measurements (Playwright);
- repository source and public external sources, all accessed 14 Sep 2026.

**Evidence tags:**

| Tag | Meaning |
|---|---|
| `[verified-live]` | Seen on the live site today. |
| `[verified-source]` | Read in a primary public document. |
| `[code]` | Repository `file:line`. |
| `[external]` | Press or secondary source. |
| **unverified** | Could not be confirmed. |

**Severity:**

| Severity | Meaning |
|---|---|
| critical | Legal or regulatory exposure, safety risk, or misleading official information. |
| high | A material stakeholder or lender expectation is not met. |
| medium | A real gap, but not a material one. |
| low | Minor or cosmetic. |

**Category:**

| Category | Meaning |
|---|---|
| **W** | Fixable in the website or CMS. |
| **C** | Content DBEDC must supply. |
| **D** | Business or policy decision DBEDC must make. |

> **Handling note.** The repository `github.com/emamhosen1999/dhakabypass` is publicly readable (HTTP 200 to an unauthenticated request, page marked "Public", 14 Sep 2026). This document records security-relevant weaknesses, so decide where it is kept before committing it (see CON-SEC-01).

---

## 1. Executive summary

**Overall concession-website maturity: 32 / 100** (weighted 31.5; weights in §3).

**Weighting rationale:**

| Share | Domains | Why |
|---|---|---|
| 60% | Statutory disclosure, toll transparency, safety, customer service, operations, ESG, governance | These carry legal, safety and lender exposure. |
| 20% | ITS, procurement, privacy, cybersecurity, accessibility, communications, brand | Material, but a lower direct risk. |
| 16% | SEO and digital presence (11 sub-domains A–K) | Findability of official information. |
| 4% | Service KPIs and peer benchmark | Maturity indicators. |

**Verdict for the board.** DBEDC has built the skeleton of a good concessionaire website, and faster than most peers. It has 63 trilingual pages covering:

- disclosure, right to information, a citizen charter and grievance redress;
- a tracked request system;
- a toll calculator and a corridor map;
- a sound HTTP security baseline.

The skeleton, however, is filled with content that DBEDC has not verified. Much of it contradicts public records or promises services that do not exist.

The most serious failures are as follows:

1. **No emergency number appears anywhere on the site, not even 999.** Seven pages still tell stranded drivers to call "the number at the foot of every page".
2. **Headline figures are wrong or contradictory.**
   - "51.4% open" sits beside "18 km / 48 km".
   - Shareholding is given as 60/30/10; public records say 70/30.
   - Project cost is given as US$412M; BIFFL says US$358.83M.
   - The provisional fare matrix quotes ৳100 on a journey that is charged ৳150 today, and ৳200 for the full corridor against a publicly reported expectation of ৳700–800.
3. **Policy commitments are published without legal clearance.** RTI, citizen charter, integrity and refunds were drafted from public sources and published on DBEDC's instruction of 12 September 2026. They name no responsible officers, cite no gazette and are backed by no documents.
4. **Lender-grade safeguard material is missing.** The resettlement plan, IEE/ECC and GRC are not disclosed, although ADB has published safeguard monitoring reports recording 3,867 entitled persons.
5. **The site cannot be found or shared well.** Nine key pages lack descriptions, there are no Open Graph cards and no local listings, and DBEDC publishes no phone, address or email of its own.

The engineering is largely done. What is now needed is **a verified data pack from DBEDC, legal sign-off on every commitment page, and a two-week corrections sprint** (W8C.1–W8C.7) before any further promotion of the site.

**Findings by severity:** 4 critical · 38 high · 62 medium · 21 low. Total: **125**.

---

## 2. Verified context

| Fact | What the site says | What public sources say | Status |
|---|---|---|---|
| Project | Dhaka Bypass Expressway, Joydebpur (Gazipur) – Madanpur (Narayanganj), linking N1/N2/N3/N4 | "Joydevpur–Debogram–Bhulta–Madanpur Road (N-105)… 48-kilometer… four-lane tollway and a two-lane service road" — [ADB news, 6 Dec 2018](https://www.adb.org/news/government-bangladesh-signs-ppp-contract-dhaka-bypass). Chinese government sources give 48.11 km — [Sichuan SASAC, 24 Apr 2025](https://gzw.sc.gov.cn/scsgzw/CU230206/2025/4/24/6bf9f03a4c34440aa8df8e6845cdbedd.shtml), [yidaiyilu.gov.cn](https://www.yidaiyilu.gov.cn/p/245298.html). | Verified [external] |
| Grantor / contracting authority | Roads and Highways Department (RHD), Road Transport and Highways Division | PPP contract "signed on December 6, 2018 between the Roads and Highways Department (RHD)… and the Consortium" — [BIFFL project page](https://www.biffl.org.bd/projects/dbed) | Verified [verified-source] |
| PPP framework / PPPA | PPPA project profile linked on 5 pages | The link `https://www.pppo.gov.bd/projects-dhaka-bypass.php` returns **HTTP 404**, and the host serves a self-signed certificate. `https://pppa.gov.bd` 301-redirects to `investbangladesh.gov.bd`. | Link broken [verified-live]; PPPA's current profile URL **unverified** |
| Concession model and term | DBFOMT, 25 years "including construction and operation" | "design, build, finance, operate, and maintain… over a 25-year concession period… viability gap funding of 3.1 billion taka and a minimum revenue guarantee" — [UNB, Dec 2018](https://www.unb.com.bd/category/Bangladesh/bangladesh-signs-ppp-contract-for-dhaka-bypass/9772). Chinese sources say an operating period of 22 years (运营期为22年) — [yidaiyilu.gov.cn](https://www.yidaiyilu.gov.cn/p/245298.html). Wikipedia says 23 years of tolling — [Wikipedia](https://en.wikipedia.org/wiki/Dhaka_Bypass_Expressway). | Term verified; **operating-period split and minimum revenue guarantee unverified** and absent from the site |
| Sponsors / shareholding | SRBG 60%, SEL 30%, UDC 10% (`/en/about/governance`) | "SRBG has 70 per cent share", SEL and UDC "30 per cent" — [UNB](https://www.unb.com.bd/category/Bangladesh/bangladesh-signs-ppp-contract-for-dhaka-bypass/9772). "(SRBG) holds a 70% stake, while the two local firms hold 30%" (citing BIFFL) — [Dhaka Tribune, Jun 2025](https://www.dhakatribune.com/bangladesh/383170/dhaka-bypass-expressway-opens-toll-free-for-eid). SRBG sits within Shudao Investment Group (蜀道集团) — [Sichuan SASAC, 7 Apr 2025](https://gzw.sc.gov.cn/scsgzw/CU23020302/2025/4/7/c4195f77e5a14770adb9b21a42a5dab2.shtml). | **Contradiction** (CON-GOV-01) |
| Project cost | US$412M (home, about, project, sustainability) | "Total project cost of the project is USD 358.83 million" — [BIFFL](https://www.biffl.org.bd/projects/dbed). "estimated cost of Tk3,400 crore" — Dhaka Tribune. "original budget of Tk3,500 crore has risen due to higher material costs" (COO) — [TBS, Aug 2025](https://www.tbsnews.net/bangladesh/transport/how-dhaka-bypass-expressway-will-benefit-people-1221081). "总投资约28.44亿元人民币" — yidaiyilu. | **Contradiction** (CON-GOV-02) |
| Lenders | China Development Bank ৳1,614 cr; BIFFL ৳1,075 cr (first ৳42.5 cr Apr 2022); VGF ৳224 → ৳674 cr | BIFFL "BDT1,075 crore"; ADB credit line "USD 50 million" to BIFFL — [BIFFL](https://www.biffl.org.bd/projects/dbed). CDB and BIFFL syndicate — yidaiyilu. ADB was transaction adviser — [ADB AP3F](https://ap3f.adb.org/our-activities/ap3f003-pp001-project-preparation-assistance-dhaka-road-bypass-project-legal). VGF "৳674.34 crore" after revision — [Wikipedia](https://en.wikipedia.org/wiki/Dhaka_Bypass_Expressway). | Verified; the CDB amount is from press only |
| Lender safeguards | Not stated | Subproject under ADB loan 51311-001 (Strengthening BIFFL). Subprojects "will adhere to the Safeguards Policy Statement (SPS) of 2009"; environment category B for the subproject — [ADB RRP](https://www.adb.org/sites/default/files/project-documents/51311/51311-001-rrp-en.pdf), [ADB ESMS](https://www.adb.org/sites/default/files/project-documents/51311/51311-001-esms-en_0.pdf). An RHD/ADB **Semi-annual Social Safeguard Monitoring Report (Jul–Dec 2022)** is public — [ADB SMR](https://www.adb.org/sites/default/files/project-documents/51311/51311-001-smr-en_1.pdf). A copy of an "IEE EMP Dhaka Bypass Road Project Final 10-03-2019" circulates on [Scribd](https://www.scribd.com/document/633458171/IEE-EMP-Dhaka-Bypass-Road-Project-Final-10-03-2019-pdf) (not an official host). CDB safeguard disclosure: none found. Equator Principles: no EPFI lender identified. IFC: not a lender. | ADB SPS applicability verified [verified-source]; CDB and EP **unverified** |
| Resettlement scale | Not published | SMR p.5: "Total 3,867 Entitled Persons… 1,957 Households (TH=616 and NTH=1,341), 31 CPR, 696 Tenants, and 1,183 Employees"; RP budget "Taka 559,71,43,705.29"; RP approved by MoRTB "4 February 2021"; PAVC and GRC approved "28 October 2021"; districts "Gazipur and Narayanganj"; interim grievance handling by implementing NGO CCDB; Independent Engineer Intercontinental Consultants and Technocrats JV. | Verified [verified-source] |
| Open section | Vogra – Purbachal K3+218–K21+218, "Opened 24 August 2025" | "An 18-kilometre stretch… inaugurated on Sunday by Road Transport and Bridges Adviser Muhammad Fouzul Kabir Khan" (24 Aug 2025) — [TBS](https://www.tbsnews.net/bangladesh/18km-dhaka-bypass-expressway-opens-traffic-1219116). Toll-free Eid openings in Mar–Apr 2025 and until 15 Jun 2025 — Dhaka Tribune. | Verified [external] |
| Toll rates in force | ৳150 car … ৳740 trailer, 9 classes, "In force since 24 August 2025" | "Tk740 for large trailers, Tk610 for heavy trucks, Tk400 for medium trucks, Tk310 for big buses, Tk260 for small trucks, Tk210 for minibuses, Tk190 for microbuses, Tk180 for pickups and jeeps, and Tk150 for private cars" — [TBS](https://www.tbsnews.net/bangladesh/transport/how-dhaka-bypass-expressway-will-benefit-people-1221081). RHD's toll-rate page shows no N105 entry — [RHD](https://rhd.portal.gov.bd/pages/static-pages/6922e022933eb65569e25a0a). | Rates match press [external]; **S.R.O./gazette unverified** |
| Full-corridor tolls (expected) | Provisional matrix and calculator: car ৳200 for 42.7 km | "Toll charges are expected to be around Tk1,400–1,500 for trucks and Tk700–800 for private cars for the stretch from Gazipur Bhogla to Naryanganj, Madanpur" — [Dhaka Tribune](https://www.dhakatribune.com/bangladesh/383170/dhaka-bypass-expressway-opens-toll-free-for-eid) | **Contradiction** (CON-TOLL-01) |
| Completion | Purbachal–Bhulta "Planned · Expected to open 16 September 2026" | "The full 48km expressway is scheduled for completion by June 2026" — TBS, Aug 2025 | **Unverified** (CON-OPS-02) |
| Key people | Chairman Liu Xiaobo; CEO Xiao Zhiming; COO Md. Shafiqul Islam Akand; RHD PD Syed Aslam Ali | COO "Shafiqul Islam Akhand" (TBS, Aug 2025); PD "Syed Aslam Ali, project director" (Dhaka Tribune, Jun 2025) | COO and PD corroborated; **Chairman and CEO unverified** |
| Company registration | Not published | No RJSC registration number, registered office or TIN/BIN found | **Unverified** |
| Legal framework (data and cyber) | Privacy notice cites "laws of Bangladesh governing personal data… in force from time to time" | Cyber Security Ordinance 2025 promulgated 21 May 2025, repealing CSA 2023; Personal Data Protection Ordinance 2025 and National Data Governance Ordinance 2025 gazetted 6 Nov 2025, some provisions effective 18 months after publication — [Prothom Alo](https://en.prothomalo.com/bangladesh/government/teeopu4dfv), [Daily Star](https://www.thedailystar.net/tech-startup/news/bangladeshs-personal-data-protection-ordinance-2025-key-takeaways-4015401) | Verified [external]; commencement dates per section need counsel |

**RTI Act 2009 applicability.**

- *Why it probably applies.* Section 2(b) defines "authority" to include "any organizations or institution that undertakes public functions in accordance with any contract made on behalf of the Government or made with any public organization or institution" — [CHRI summary of the Act](https://www.humanrightsinitiative.org/programs/ai/rti/international/laws_papers/bangladesh/bangladesh_rti_act_2009_summary.pdf). A DBFOMT concessionaire contracted by RHD very probably falls within this. **Counsel must confirm**, as the master plan's legal gate requires (`docs/superpowers/plans/2026-09-06-dhakabypass-master-remediation.md:25`).
- *What it would then require:*
  - s.10: a Responsible Officer must be nominated.
  - s.6: annual publication of the Responsible Officer's "name, designation, address, and where applicable fax number and e-mail address".
  - s.9: information within "20 working days"; "30 working days" where "more than one information providing unit or authority is involved"; 24 hours for "life or death, arrest and release from jail".
  - s.24: appeal within 30 days, decided within 15 days.

**GRS and citizen charter conventions.**

- *GRS.* The Cabinet Division GRS Guidelines 2015 (revised 2018) set 30 working days to dispose of a complaint, handled by designated GRS focal officers and appeal officers — [SSPS programme, GRS](https://socialprotection.gov.bd/grievance-redress-system-grs/), [grs.gov.bd](https://www.grs.gov.bd/).
- *Citizen charter.* The Cabinet Division uniform format was approved in 2015 (ministries) and 2017 (field offices). It covers each service, its procedure, cost and payment method, time limit, and responsible officer with contact details — [Cabinet Division assessment](https://cabinet.portal.gov.bd/sites/default/files/files/cabinet.portal.gov.bd/research_corner/3169cc54_832a_4f45_ae29_3f9c6e76778f/Status%20of%20the%20Implementation%20of%20Citizen%E2%80%99s%20Charter%20at%20Public%20Offices%20in%20Bangladesh%20An%20Assessment.pdf).
- *Status.* The exact column list is taken from that assessment and should be confirmed against the current Cabinet Division instruction.

---

## 3. Scorecard

Weights sum to 100. The weighted score is Σ(weight × score) / 10.

| # | Domain | Weight | Score /10 | Best peer practice | One-line gap |
|---|---|---|---|---|---|
| 1 | Statutory & regulatory disclosure | 9 | 3 | RHD portal: named RTI officer and appeal authority, citizen charter table, GRS officers, integrity corner ([rhd.portal.gov.bd](https://rhd.portal.gov.bd/)) | Pages exist but have no named officers, S.R.O.s, documents, registration details or evidence of legal sign-off |
| 2 | Toll transparency & fairness | 8 | 5 | NHAI TIS per-plaza fee tables with notifications ([tis.nhai.gov.in](https://tis.nhai.gov.in/)); PLUS fare calculator ([plus.com.my](https://www.plus.com.my/plan-your-journey/)) | Rates correct but uncited; the provisional matrix contradicts both the rates in force and press |
| 3 | Road-user safety & emergency | 9 | 1 | PLUSLine 1-800-88-0000 ([PLUS FAQ](https://www.plus.com.my/faqs/)); NHAI 1033 ([IHMCL](https://ihmcl.co.in/24x7-national-highways-helpline-1033/)) | **No emergency number rendered anywhere** |
| 4 | Customer service operations | 7 | 4 | NHAI 1033 logged complaints with callback; FDEE phone, email and WhatsApp ([fdee.bd](http://fdee.bd/)) | Good tracked forms, but no phone, email, acknowledgement, status lookup or published SLA |
| 5 | Operations & live information | 6 | 3 | SMC Tollways timestamped live map; NEXCO opening schedules | Wrong % open; opening date unverified; "Not measured" for every section; no timestamps |
| 6 | ITS & ETC readiness | 3 | 3 | IHMCL NETC/FASTag with daily collection data | Tag applications taken for a scheme that does not yet exist here |
| 7 | ESG & lender safeguards | 7 | 2 | BBA resettlement lists; ADB subproject disclosure; Transurban sustainability reporting | No RP, entitlement matrix, IEE/ECC, GRC or monitoring reports; unsourced impact metrics |
| 8 | Corporate governance & IR | 6 | 3 | Transurban board, reports and governance; Sichuan Chengyu 信息公开 and 廉洁举报 ([cygs.com](https://www.cygs.com/)) | Shareholding and cost contradict records; no board list, reports or whistle-blowing policy |
| 9 | Procurement & suppliers | 3 | 3 | IHMCL new and archived tenders; Chengyu 招投标公告 | No notices, awards, archive or framework statement |
| 10 | Legal, privacy & data protection | 6 | 3 | Transurban privacy centre | Notice omits phone and WhatsApp data, vehicle registrations and CCTV; outdated law; no reachable controller |
| 11 | Cybersecurity & trust posture | 5 | 5 | Security.txt and vulnerability disclosure (common in EU/AU operators) | Strong headers and TLS 1.3; public repo exposes hosting detail; no security.txt; DMARC p=none |
| 12 | Accessibility & inclusion | 3 | 5 | VINCI "partially compliant" statement; 407 ETR accessibility page | Statement out of date; no PWD Act 2013 framing; no plaza-level accessibility information |
| 13 | Communications & crisis readiness | 4 | 2 | NLEX press-release engine; Mundys media kit | Zero press releases; newest news item April 2025; no incident statement channel |
| 14 | Brand, reputation & credibility | 4 | 2 | Transurban consistent figures across reports | Contradictory counts and lengths; site says unverified figures are withheld, yet other pages publish them |
| A | Technical SEO | 2 | 7 | — | Sound sitemap, hreflang and canonicals; root and www duplicates; stale legacy snippet in search |
| B | International SEO | 2 | 6 | — | Reciprocal hreflang and correct `lang`; English brand in bn/zh titles; news untranslated; x-default en |
| C | On-page & content SEO | 2 | 4 | NHAI TIS plaza-specific titles | Generic titles; 9 key pages without description; 3 without H1; mojibake in a title |
| D | Structured data | 1.5 | 2 | — | Organization (logo only) plus NewsArticle; no FAQPage, WebSite, BreadcrumbList, Place, contactPoint or sameAs |
| E | Local SEO & maps | 1.5 | 1 | — | No NAP; sample office pin; OSM plazas unnamed; GBP unverified |
| F | Social & sharing | 1.5 | 1 | FDEE WhatsApp channel | OG/Twitter tags on 6 news pages per locale only, with no image; no linked profiles |
| G | Performance (Core Web Vitals) | 1.5 | 6 | — | Lab LCP ≈ 0.9–1.3 s unthrottled but 5.8–8.2 s on emulated slow 4G + 4× CPU; CLS ≤ 0.105; no field data |
| H | Answer-engine & AI visibility | 1 | 2 | — | Contradictory facts; Wikidata item nearly empty; AI crawlers blocked; no llms.txt |
| I | Off-site authority & reputation | 1 | 3 | — | Cited by government and press; brand search surfaces legacy copy, the public repo and a possible clone |
| J | Analytics & Search Console | 1 | 1 | — | No GA tag, no Search Console evidence, unconsented Cloudflare beacon, no KPI events |
| K | Accessibility-SEO overlap & content governance | 1 | 4 | — | Alt text mostly correct; no video transcripts, last-updated dates or review cadence |
| 16 | Measurement & continuous improvement | 2 | 2 | RHD GRS monitoring reports; IHMCL daily collection | No service KPIs published; no feedback loop |
| 17 | Peer benchmark (composite) | 2 | 3 | See §5 | Behind regional peers on most baselines; ahead on calculator, map and statutory page scaffolding |
| | **Total** | **100** | **31.5 → 32** | | |

---

## 4. Findings by domain

Each finding gives its evidence, the gap and why it matters, a severity (**Sev**), a category (**Cat**: W website, C content, D decision), a recommendation, and **Plan**: the master-plan task ID, or "not planned". "Done — gap persists" means the plan marks the task complete but the live site still shows the gap.

### 4.1 Statutory and regulatory disclosure

Positive: `/en/disclosures`, `/right-to-information`, `/citizen-charter`, `/tariff`, `/land-acquisition`, `/environment`, `/consultations`, `/policies`, `/reports` and `/grievances` all exist in three languages [verified-live].

---

**CON-REG-01** · critical · D · Plan: Global Constraints (legal gate) breached; W3.15–W3.22 marked done

- **Evidence:** [code] `db/sql/30-pending-drafts.sql:3-4`: "DBEDC's decision, 12 September 2026: draft every outstanding item from public sources and publish it". [code] `db/sql/29-legacy-as-current.sql:3-4`: "imagine all information as current". [verified-live] commitments now live:
  - `/en/about/integrity`: "an integrity focal point… annual integrity action plan", reports "handled by someone independent";
  - `/en/grievances`: "review… answered within 15 working days";
  - `/en/travel/toll-dispute`: "the difference is refunded";
  - `/en/about`: "No rate is charged that does not appear on this site".
- **Gap:** statutory and service commitments appear as DBEDC policy with no legal sign-off and no evidence that the officers, plans or processes exist. This is contrary to the plan's "Legal review gate" and "Operator-verified facts only" constraints (plan lines 25–26).
- **Why it matters:** a published undertaking can be relied on by road users, the Information Commission and RHD. Failing to honour it is a regulatory and reputational exposure.
- **Recommendation:** return every commitment page to draft, or add a CMS-managed "Under review" callout, until counsel and DBEDC management approve each sentence. Record approver and date per page (W8C.2).

---

**CON-REG-02** · high · C+D · Plan: W3.15 (done — gap persists)

- **Evidence:** [verified-live] `/en/disclosures/right-to-information`: "Write to DBEDC's designated information officer through the contact form"; no name, designation, address, phone or email. The appeal authority is not named. RTI Act s.10 and s.6 (§2).
- **Gap:** no identifiable Responsible Officer or appeal authority. Requests go into a generic form with no RTI category.
- **Why it matters:** if s.2(b) applies, non-appointment is an offence route before the Information Commission (s.25). It is also the first thing a journalist tests.
- **Recommendation:**
  - Counsel to confirm applicability.
  - Appoint and notify the Responsible Officer and appeal authority.
  - Add a `contact-directory` block with both, and a `request-form` kind "Information request" with the 20/30-day clock.
  - Link the Information Commission application form.

---

**CON-REG-03** · medium · W · Plan: not planned

- **Evidence:** [verified-live] same page: "30 working days when the information concerns a third party". [code] `db/sql/34-remaining-pages.sql:152`. RTI s.9(2) reads "more than one information providing unit or authority"; s.9(8) sets a separate third-party notice.
- **Gap:** misstates the statutory time limit, and omits the 10-working-day refusal notice (s.9(3)).
- **Why it matters:** incorrect legal information on an official page.
- **Recommendation:** correct the text in all three locales after counsel review.

---

**CON-REG-04** · high · W+C · Plan: W3.16 (done — gap persists)

- **Evidence:** [verified-live] `/en/disclosures/citizen-charter` lists six services with prose only: no time limit, fee, responsible officer or contact. It promises "an answer within the published response time", which is published nowhere. [code] `lib/requests/policy.js:23-33` holds deadlines (grievance 30, dispute 15, breakdown 1, lost property 7 days) that are never shown.
- **Gap:** the charter does not follow the Cabinet Division uniform format (§2).
- **Why it matters:** a charter without time limits and officers cannot be enforced, and RHD's own charter sets the benchmark.
- **Recommendation:** render the charter as a `data-table` block with columns Service · Procedure · Documents · Fee and payment · Time limit · Responsible officer (designation, phone, email). Bind time limits to the same settings `request-form` uses (W8C.2).

---

**CON-REG-05** · high · C+D · Plan: W3.17 (done — gap persists)

- **Evidence:** [verified-live] `/en/grievances`: "Every reply names the officer… DBEDC's appeal officer". No GRS focal officer or appeal officer is named, and no contact is given. grs.gov.bd is linked.
- **Gap:** no named GRO or appeal officer, no first-level SLA on the page, and no published resolution statistics.
- **Why it matters:** GRS convention (30 working days, named officers). Lenders expect a functioning GRM for operations.
- **Recommendation:** publish the officers as a CMS-managed directory, state the 30-day and appeal timelines from settings, and publish quarterly counts (see CON-KPI-01).

---

**CON-REG-06** · high · C · Plan: W3.23 (fields built; content awaited)

- **Evidence:** [verified-live] `/en/disclosures/tariff` lists **no** notification; `/en/travel/toll` shows "In force since 24 August 2025" with no S.R.O. [code] `db/sql/31-cms-consistency.sql:8,35-36` adds `sro_number`, `sro_date`, `sro_link`, all empty. RHD's toll page has no N105 entry (§2).
- **Gap:** the legal basis of the toll is unevidenced.
- **Why it matters:** the plan's own rule is "never publish a rate without it". In any dispute or challenge the notification is the authority.
- **Recommendation:** DBEDC or RHD to supply the gazette or approval letter and PDF. Populate the fields and render the citation on every toll block and on `/disclosures/tariff` as a `document-list`.

---

**CON-REG-07** · high · C+D · Plan: W3.5 partial

- **Evidence:** [verified-live] `/en/about/concession` gives six key terms only. There is no summary of the VGF, the minimum revenue guarantee (reported by [UNB](https://www.unb.com.bd/category/Bangladesh/bangladesh-signs-ppp-contract-for-dhaka-bypass/9772)), the toll-revision formula and indexation, performance and O&M standards, penalties, termination and step-in, the handback condition, or the construction/operation split (22 vs 23 vs 25 years, §2).
- **Gap:** the site does not meet the World Bank *Framework for Disclosure in PPP Projects* ([ppp.worldbank.org](https://ppp.worldbank.org/library/framework-disclosure-ppp-projects)) expectation of a contract summary and government-support disclosure.
- **Why it matters:** fiscal commitments such as the MRG are what the public and lenders scrutinise.
- **Recommendation:** DBEDC and RHD agree a publishable concession summary (redacting only commercially sensitive terms). Publish it as a page plus PDF in `document-list`.

---

**CON-REG-08** · medium · C · Plan: not planned

- **Evidence:** [verified-live] no page shows the RJSC registration number, registered office address, TIN/BIN or trade licence. `/en/privacy` says the controller is "at the office address on the contact page", and `/en/contact` shows "Not yet published".
- **Gap:** the legal identity of the operator is not established on its own site.
- **Why it matters:** needed for contracts, suppliers, privacy and anti-impersonation.
- **Recommendation:** add company identity fields to Settings › Organisation and render them in the footer and on `/about`.

---

**CON-REG-09** · high · C+D · Plan: W3.7 (listed when approved)

- **Evidence:** [verified-live] `/en/disclosures/reports`: annual report and accounts "published here after they are approved at the company's annual general meeting". None listed; no date committed.
- **Gap:** no annual report or audited financial statements for any year since 2018.
- **Why it matters:** lender and PPPA transparency expectation; RTI s.6 annual report.
- **Recommendation:** decide the disclosure policy (full or summary accounts), publish the most recent audited statements, and add a financial calendar.

---

**CON-REG-10** · medium · W · Plan: W3.24 (done — gap persists)

- **Evidence:** [verified-live] 5 links to `https://www.pppo.gov.bd/projects-dhaka-bypass.php` return 404 and the host serves a self-signed certificate. [external] `pppa.gov.bd` redirects to `investbangladesh.gov.bd`.
- **Gap:** the key government citation is broken.
- **Why it matters:** it undermines the "Source: PPPA" claims on `/about` and `/about/governance`.
- **Recommendation:** replace with a live official URL, or cite the BIFFL and ADB records above. Add a link-check to CI.

---

**CON-REG-11** · medium · W+C · Plan: not planned

- **Evidence:** [verified-live] `/en/disclosures/right-to-information` "Information already published" is a list of eight links, with no indexed catalogue and no annual RTI report.
- **Gap:** no proactive-disclosure index in the s.6 sense (organisation, laws and rules, decision processes, RTI facilities).
- **Why it matters:** RTI s.6 compliance, if applicable.
- **Recommendation:** add a `document-list` "Proactive disclosure index" with a category filter and an annual report entry.

### 4.2 Toll transparency and fairness

Positive, both [verified-live]:

- The rates in force on `/en/travel/toll` (৳150–৳740, 9 classes) match press reports of the 24 Aug 2025 opening [external TBS].
- The calculator works without JavaScript, and its result carries a "Provisional" label (`/en?from=9&to=17&class=car`).

---

**CON-TOLL-01** · critical · W+C · Plan: INT.1–INT.2 (done — provisional data)

- **Evidence:** [verified-live] fare matrix (`/en/travel/toll`) and calculator:
  - Vogra RHS → Mirer Bazar (A), car: **৳100** (8.1 km), while the rates-in-force table says **৳150** for "Vogra – Purbachal", which is the charge actually levied (TBS).
  - Vogra → Madanpur, car: ৳200 (42.7 km). Vogra → Bhulta: ৳200 (31.1 km).
  - Dhaka Tribune reports an expected full-corridor car toll of **Tk700–800**.
  - Trailer class returns "No toll rates have been published yet" (`/en?from=9&to=17&class=trailer`).
  - [code] `db/sql/12-toll-od-matrix.sql:3-6` "270 PROVISIONAL fares".
- **Gap:** the site shows two different official-looking prices for the same open journey. It prices journeys to plazas that are "Under construction" with no warning, and some classes have no fare.
- **Why it matters:** a provisional label does not cure a figure that contradicts the rate in force; this is misleading price information. It also sets a public expectation roughly a quarter of the likely future toll, which is a reputational risk at the next opening.
- **Recommendation:**
  - Immediately restrict the matrix and calculator to plaza pairs on open sections, fed from `toll_rates` in force (W8C.1).
  - Hide unopened pairs behind a CMS setting until DBEDC confirms the approved O–D schedule.
  - Add a "Not open to traffic" state per plaza.

---

**CON-TOLL-02** · high · C · Plan: W3.23

- **Evidence:** [verified-live] `/en/travel/toll`, `/en/travel/payment`, home "What it costs": no S.R.O. number, date or PDF. `/en/disclosures/tariff` describes a formula ("per-kilometre rate plus a fixed component, adjusted by 15%, rounded to the nearest ten taka") with no source. [code] `db/sql/30-pending-drafts.sql:65`.
- **Gap:** the rate schedule is uncited, and the formula is a drafted claim.
- **Why it matters:** toll legitimacy, dispute defence and the plan constraint.
- **Recommendation:** supply the instrument, cite it, and remove the formula text unless it is quoted from the instrument.

---

**CON-TOLL-03** · medium · C · Plan: W4.3 (done — gap persists)

- **Evidence:** [verified-live] `/en/travel/payment`: "The payment methods each plaza accepts are listed with the rates above"; they are not. `/en/travel/rules`: "Have the fare ready in cash". [code] `db/sql/01-schema.sql:381` `payment_methods json` is unused.
- **Gap:** no statement of accepted payment methods (cash, card, MFS).
- **Why it matters:** queue time, informal-payment risk and MFS expectations in Bangladesh.
- **Recommendation:** populate `payment_methods` per rate, or state "cash only", and render it.

---

**CON-TOLL-04** · medium · C · Plan: not planned

- **Evidence:** [verified-live] the rates section label is "Vogra – Purbachal". The open segment is K3+218–K21+218, but Purbachal Toll Plaza (K24+522) is "Under construction" (`/en/travel/status`). Press: "Bhogra to Purbachal… 21km" (Eid) vs "18km" (Aug 2025).
- **Gap:** it is unclear which plaza collects the published toll and over what extent.
- **Why it matters:** fairness (a partial journey pays the full rate?) and dispute clarity.
- **Recommendation:** DBEDC confirms plaza, direction and extent; the rate record carries plaza IDs rather than free text.

---

**CON-TOLL-05** · medium · W+C · Plan: W4.2 (done — gap persists)

- **Evidence:** [verified-live] `/en/travel/vehicle-classes` puts "jeeps and sport-utility vehicles" under "Cars and SUVs", while the rates table bills "Pickup, Jeep, Wrecker, Crane (3 tons)" at ৳180 vs car ৳150. Class descriptions do not map 1:1 to the nine billing classes.
- **Gap:** contradictory classification.
- **Why it matters:** misclassification is the commonest toll dispute; the site would support the complainant against DBEDC.
- **Recommendation:** drive the class guide from the same `vehicle_class` records as the table (one card per billing class, with image).

---

**CON-TOLL-06** · medium · C · Plan: not planned

- **Evidence:** [verified-live] `/en/travel/vehicle-classes`: "ambulances and fire service vehicles… pass without charge, as do other vehicles exempted by government notification".
- **Gap:** exemptions are not enumerated or cited (Toll Policy exemption list).
- **Why it matters:** equal treatment; VIP-exemption controversies are common.
- **Recommendation:** publish the exemption list with its legal source.

---

**CON-TOLL-07** · medium · W · Plan: not planned

- **Evidence:** [verified-live] `/en/disclosures/tariff` promises revisions are "published here and at the plazas before it takes effect". There is no notice list, no lead-time commitment and no history of past rates.
- **Gap:** no change-notice practice.
- **Why it matters:** predictability for fleets; peer practice (NHAI annual revision notices).
- **Recommendation:** add a `document-list` "Toll notices" with effective dates, and retain superseded schedules.

---

**CON-TOLL-08** · low · W · Plan: not planned

- **Evidence:** [verified-live] `/en/travel/toll-dispute` asks for "the plaza, the date and time on your receipt, your vehicle number", but the form has no vehicle, plaza or date fields. [code] `lib/blocks/types/request-form.js` `askVehicle` default "no".
- **Gap:** unstructured dispute intake.
- **Why it matters:** slower resolution; SLA metrics impossible.
- **Recommendation:** enable vehicle and location fields; add plaza select and date-time fields to the block type.

### 4.3 Road-user safety and emergency information

**CON-SAFE-01** · critical · W+C · Plan: 0.13 (done — gap persists)

- **Evidence:**
  - [verified-live] zero `tel:` links across all 189 pages; no "999" in any footer. `/en` has no `db-footer-emergency` element.
  - Seven pages point to the missing number:
    - `/en/safety`: "both numbers are at the foot of every page";
    - `/en/travel/rules`: "Call the DBEDC emergency line shown at the foot of every page";
    - `/en/travel/breakdown`: "Call the emergency number above";
    - `/en/faq`: "The emergency number at the foot of every page";
    - the same text in bn and zh.
  - [code] `components/blocks/EmergencyStripBlock.jsx:16` and `components/chrome/SiteFooterV2.jsx:101` render nothing when both settings are empty.
  - `db/sql/15-emergency-contact.sql:27` seeds `01610285004` ("supplied by DBEDC on 2026-09-11"); `db/sql/31-cms-consistency.sql:66` seeds `999`. Neither is live, so production settings are empty or those migrations are not applied (**cause unverified**). `/en/contact`: "dedicated emergency hotline… awaiting confirmation".
- **Gap:** a stranded driver on an access-controlled expressway, where pedestrians cannot leave, is sent to a number that does not exist.
- **Why it matters:** direct safety risk and the single most consequential defect on the site.
- **Recommendation:** within 24 hours:
  1. Set `contact.national_emergency_phone` = 999 in production.
  2. DBEDC confirms whether 01610285004 is a 24/7 staffed control-room line (not a personal handset, per decision 0.13) and sets it.
  3. Add a health check that fails deploy if both are empty.
  4. Until a DBEDC number exists, reword the seven pages to "call 999" (W8C.1).

---

**CON-SAFE-02** · high · C+D · Plan: 0.13

- **Evidence:** [verified-live]
  - `/en/safety`: "Help is available on the open section at any time… Ambulance, towing and recovery are arranged through the DBEDC emergency line."
  - `/en/travel/rules`: "Patrol vehicles cover the open section around the clock", "use the nearest emergency call point".
  - `/en/disclosures/citizen-charter`: "Patrol response on the open section at any hour".
  - [code] `db/sql/29-legacy-as-current.sql:193-197` (legacy "emergency call points every 2 km" converted to current); `db/sql/31-cms-consistency.sql:222-223`.
- **Gap:** operational capabilities are asserted without DBEDC confirmation.
- **Why it matters:** if patrols or call points do not exist, users are misled in an emergency, and the concession's service-level exposure grows.
- **Recommendation:** DBEDC confirms patrol hours, fleet, call-point locations and response targets. Publish only what is confirmed; list call points in `map-pin-list`.

---

**CON-SAFE-03** · medium · C · Plan: 0.7

- **Evidence:** [verified-live] `/en/travel/rules` speed table gives service-road limits (cars 50, trucks 40, motorcycles 60) and marks "Three-wheelers, rickshaws, non-motorised vehicles" as "Not permitted" on service roads. The same page says service roads "carry this traffic" and are "the correct route". BRTA guideline expressway values (cars/buses 80, trucks 50, motorcycles 60) — [Daily Star](https://www.thedailystar.net/news/bangladesh/transport/news/speed-limit-set-all-types-vehicles-3604456). No service-road category is found in public summaries (**unverified**).
- **Gap:** self-contradictory access rule, and service-road limits of unconfirmed origin.
- **Why it matters:** enforcement disputes, and the safety of vulnerable road users on service roads.
- **Recommendation:** DBEDC, RHD and highway police confirm the posted limits and who may use service roads, and cite the notice.

---

**CON-SAFE-04** · high · C · Plan: not planned

- **Evidence:** [verified-live] no page covers what to do after a collision: secure the scene, call 999 and highway police, first aid, reporting duties under the Road Transport Act 2018, insurance, the incident record request, damage to expressway property.
- **Gap:** only breakdown guidance exists.
- **Why it matters:** crashes are the core safety event; peers publish incident guidance.
- **Recommendation:** add a "After a crash" section on `/safety` (rich-text) and a `request-form` "Incident record request".

---

**CON-SAFE-05** · medium · C · Plan: W4.10 partial

- **Evidence:** [verified-live] `/en/travel/freight` gives no axle-load figures, weighbridge locations, dangerous-goods rules, tanker restrictions or oversize permit contact.
- **Gap:** a freight corridor without hazardous-goods or load specifics.
- **Why it matters:** pavement and bridge protection, and HGV safety.
- **Recommendation:** publish RHD axle-load limits with source, weighbridge pins and dangerous-goods rules.

---

**CON-SAFE-06** · medium · W+C · Plan: W4.8, W4.11

- **Evidence:** [verified-live] `/en/travel/advisories`: "There are no closures… at present", with no "last checked" timestamp and no weather feed (a bmd.gov.bd link only). The FAQ claims "the most serious one appears at the top of every page".
- **Gap:** an empty list is indistinguishable from an unmaintained one; no flood or fog alert integration.
- **Why it matters:** monsoon flooding and winter fog are the corridor's defining operational risks (the site says so itself).
- **Recommendation:** show "Checked: <time> by control room" from the advisory admin, and a BMD warning link per district.

---

**CON-SAFE-07** · high · W+D · Plan: W4.13 (built; provider not configured)

- **Evidence:** [verified-live] `/en/travel/alerts` accepts SMS and WhatsApp numbers: "Alerts are free to receive". [code] `lib/alerts/providers.js:20-25`: with no provider env, "a broadcast is recorded as 'no provider' and nothing is sent". Production env is **unverified**; the admin audit says it "sends once a provider is configured".
- **Gap:** people subscribe to safety alerts that may never be delivered.
- **Why it matters:** false assurance on safety communications, and personal data collected without purpose fulfilment.
- **Recommendation:** hide the sign-up block until a gateway is contracted and tested, or add a CMS callout "launching soon — you will be told when alerts start".

---

**CON-SAFE-08** · low · C · Plan: W5.8 partial

- **Evidence:** [verified-live] `/en/safety/education`: text only. There is no guidance on crossing at pedestrian overpasses for communities (BIFFL scope lists "8 pedestrian overpasses"), and no audio or pictogram material.
- **Gap:** community safety content is thin for low-literacy audiences.
- **Why it matters:** pedestrian fatalities on new expressways in South Asia.
- **Recommendation:** add pedestrian overpass locations and a Bangla pictogram and video module.

### 4.4 Customer service operations

**CON-CS-01** · high · C · Plan: W2.10 (awaits DBEDC)

- **Evidence:** [verified-live] `/en/contact`: "Not yet published — The office address, public telephone, email and dedicated emergency hotline are awaiting confirmation". The footer shows no contact details. [external] DNS shows DBEDC's domain runs Microsoft 365 mail (MX `dhakabypass-com.mail.protection.outlook.com`), so mailboxes exist.
- **Gap:** no phone, email or address for the operator.
- **Why it matters:** needed for RTI, GRS, privacy rights, media and suppliers. Peer FDEE publishes a phone, email and WhatsApp.
- **Recommendation:** publish a general landline, a role mailbox (for example info@, rti@, grievance@, media@) and the registered office via Settings.

---

**CON-CS-02** · high · W · Plan: W7.12 partial

- **Evidence:** [code] `lib/requests/actions.js:72-83`: the request is stored and the tracking number shown on screen only; no email or SMS acknowledgement. No public status lookup route exists (`app/[locale]` has no tracking route).
- **Gap:** a tracking number with nowhere to track it; lost if the tab closes.
- **Why it matters:** the GRS convention of acknowledgement and status; peer NHAI 1033 gives status callbacks.
- **Recommendation:** send an acknowledgement (email now, SMS when the gateway exists); add a `request-status` block (tracking number plus phone or email last-4) showing status and due date.

---

**CON-CS-03** · medium · W · Plan: not planned

- **Evidence:** [code] `lib/requests/policy.js:23-33` deadlines are not displayed on `/grievances`, `/travel/toll-dispute`, `/travel/lost-found` or `/disclosures/citizen-charter` [verified-live].
- **Gap:** SLAs are hidden.
- **Why it matters:** accountability, and the charter requirement.
- **Recommendation:** show "We will reply by <date>" before submission, from the block's `slaDays`.

---

**CON-CS-04** · medium · D · Plan: not planned

- **Evidence:** [verified-live] every service channel is a web form. There is no hotline, IVR, SMS short code, WhatsApp channel or published plaza help desk.
- **Gap:** exclusion of low-literacy, low-bandwidth and elderly users, the majority of truck and bus drivers.
- **Why it matters:** equity, and GRS accessibility.
- **Recommendation:** decide the channels (at minimum a phone line and plaza complaint desk); publish them in `contact-directory`.

---

**CON-CS-05** · medium · C · Plan: W3.25 (parity asserted — news excluded)

- **Evidence:** [verified-live] `/bn/news` and `/zh/news` and all six articles show English titles and summaries.
- **Gap:** Bangla readers get English news.
- **Why it matters:** Bangla-first public-service expectation (plan Global Constraints: "Bangla is authoritative").
- **Recommendation:** translate or remove; include news in the parity rehearsal.

---

**CON-CS-06** · medium · C · Plan: W5.13

- **Evidence:** [verified-live] `/en/contact` map pin: "DBEDC operations office, Vogra Toll Plaza… Sunday–Thursday, 9:00–17:00. Sample location — to be confirmed."
- **Gap:** sample hours and location published as an office.
- **Why it matters:** people may travel to a place that is not an office.
- **Recommendation:** remove the pin until confirmed.

---

**CON-CS-07** · medium · W · Plan: not planned (possible overlap with UI audit)

- **Evidence:** [verified-live] mojibake ("â€”", "â€œWatch liveâ€", "360Â° tour") on 19 page variants: `en_about_recognition`, `en_contact`, `en_project_structures`, `en_safety`, `en_travel_alerts`, `en_travel_cameras`, `en_travel_map`, and bn and zh equivalents. It also appears in the `<title>` "360Â° tour".
- **Gap:** double-encoded UTF-8 in stored content and ui strings.
- **Why it matters:** credibility of an official site, and search snippets.
- **Recommendation:** a one-off data repair SQL plus an encoding check in the parity rehearsal.

---

**CON-CS-08** · low · C · Plan: W4.12

- **Evidence:** [verified-live] `/en/travel/lost-found` gives a form only: no collection point, hours, holding period or ID requirement.
- **Gap:** incomplete process.
- **Why it matters:** a service standard.
- **Recommendation:** publish the collection office and a 30/60-day holding period once decided.

### 4.5 Operations and live information

**CON-OPS-01** · critical · W · Plan: not planned

- **Evidence:** [verified-live] `/en`, `/en/travel/status`, `/en/disclosures/reports`: "51.4% Open to traffic · 18.0 km / 48 km" (18/48 = 37.5%). [code] `lib/corridor/geometry.js:43-48` computes the percentage over the extent of `segments` rows, which end at K35+000 (the planned segment "Purbachal – Bhulta K21+218 – K35+000"), so 18/35 = 51.4%. `components/corridor/ProgressBar.jsx:18-39` then prints the 48 km published length as denominator. `/en/project`: "Measured on the road network 35km" appears to derive from the same truncated extent.
- **Gap:** the headline progress figure is arithmetically wrong on three official pages in three languages.
- **Why it matters:** misleading official information on project status, quotable by press and RHD.
- **Recommendation:** add the Bhulta–Madanpur segment (K35–K47.611) as "Under construction"; compute the % against published length; label the 35 km figure correctly or remove it (W8C.1).

---

**CON-OPS-02** · high · C · Plan: not planned

- **Evidence:** [verified-live] "Purbachal – Bhulta K21+218 – K35+000 · Planned · Expected to open 16 September 2026" on `/en`, `/en/travel/status`, `/en/travel/route` (bn and zh equivalents). `/en/project` timeline: "December 2025 (target) Second section opening". [external] TBS, Aug 2025: completion "by June 2026".
- **Gap:** an opening two days after this audit, unverified and contradicted on the same site.
- **Why it matters:** a wrong opening date misroutes freight and invites public criticism.
- **Recommendation:** DBEDC confirms or removes it today; the timeline carries "last confirmed <date>".

---

**CON-OPS-03** · high · C · Plan: not planned

- **Evidence:** [verified-live] conflicting chronology:
  - `/en/travel/status`: "from Vogra (Gazipur) to Kanchan, opened on a trial basis in late March 2025";
  - `/en/project`: "The section from K4 to K22 was put into trial operation… 27 March to 5 April 2025";
  - home: "between Vogra and Purbachal"; segment "Opened 24 August 2025";
  - news (Apr 2025): "to open partly on 1 May", "to be operational by July".
- **Gap:** four versions of the opening story.
- **Why it matters:** credibility; press compare these.
- **Recommendation:** one authoritative dated chronology in `timeline` (records, not prose), referenced everywhere.

---

**CON-OPS-04** · medium · W+D · Plan: INT.9 (done — gap persists)

- **Evidence:** [verified-live] every section, including the open ones, shows "Not measured" (`/en/disclosures/reports`, `/en/travel/map`). The plan says the Google Routes refresh is live. `/en/privacy`: "Live traffic — road-condition data… fetched by our server from TomTom". [code] `lib/corridor/google-routes.js`.
- **Gap:** the live traffic product is not producing, and its provenance is misstated.
- **Why it matters:** the operations page shows nothing operational; the privacy notice is inaccurate.
- **Recommendation:** verify the cron and key in production; show source and "measured at"; correct the privacy text.

---

**CON-OPS-05** · medium · C · Plan: not planned

- **Evidence:** [verified-live] `/en/travel/route` lists "Mirer Bazar Interchange K13+000 · Connects N2 . Dhaka - Sylhet". N2 meets the corridor near Kanchan/Bhulta, and the map legend lists R301 Tongi–Kaliganj–Ghorashal as the crossing road (**unverified**, but inconsistent with the site's own home text "N2… mid-corridor").
- **Gap:** likely incorrect connection data.
- **Why it matters:** wayfinding.
- **Recommendation:** DBEDC verifies the `interchanges.connects` records.

---

**CON-OPS-06** · medium · C · Plan: W4.9 (awaits DBEDC)

- **Evidence:** [verified-live] `/en/travel/facilities`: "No service areas have been published yet". `/en/travel/cameras`: four "Sample" images (honestly labelled).
- **Gap:** no fuel, toilet, prayer, first-aid or rest-area information.
- **Why it matters:** driver fatigue and HGV welfare.
- **Recommendation:** publish what exists on the service roads (fuel stations, mosques, hospitals) with source and date.

---

**CON-OPS-07** · low · W · Plan: not planned

- **Evidence:** [verified-live] no operational page shows "last updated"; the grep for "last updated" across all pages returned nothing.
- **Gap:** no freshness evidence.
- **Why it matters:** trust in live information.
- **Recommendation:** render `updated_at` of the underlying records on status, toll, advisories and cameras.

### 4.6 Intelligent transport and ETC readiness

**CON-ITS-01** · high · D · Plan: W4.4 (done — scope questionable)

- **Evidence:** [verified-live] `/en/travel/etc`: "Tags follow the national electronic toll collection scheme, so the tag fitted for this expressway is intended to work on other Bangladesh expressways", with an application form. [external] The government is only planning an integrated ETC network replacing separate systems — [BSS](https://www.bssnews.net/others/399817). Padma Bridge ETC uses Trust Bank TAP "D-Toll" registration — [TBS](https://www.tbsnews.net/bangladesh/electronic-toll-collection-begins-padma-bridge-today-1236491).
- **Gap:** the site promises interoperability that does not exist, and collects vehicle and contact data for a service DBEDC cannot provide.
- **Why it matters:** misleading claim; purpose limitation under PDPO 2025.
- **Recommendation:** replace with an information page ("ETC is planned; no tags issued yet"); remove the form until a scheme and issuer are contracted.

---

**CON-ITS-02** · medium · D · Plan: W4.14, W4.15

- **Evidence:** [verified-live] `/en/travel/fleet` describes "monthly statement… account manager… tags for each vehicle"; `/en/travel/frequent-traveller` describes "commuter passes".
- **Gap:** products described as features without existing.
- **Why it matters:** expectation risk with fleet customers, the core revenue base.
- **Recommendation:** label as "register interest"; decide the product roadmap.

---

**CON-ITS-03** · medium · W · Plan: not planned

- **Evidence:** [verified-live] `/en/downloads` offers only an alignment GeoJSON and OSM roads. There is no machine-readable feed of toll rates, section status, advisories or cameras.
- **Gap:** no open data or API.
- **Why it matters:** navigation apps (Google, Barikoi, Pathao) could carry DBEDC closures and tolls; this is common peer practice.
- **Recommendation:** publish read-only JSON endpoints (rates, status, advisories) with licence and cache headers.

---

**CON-ITS-04** · low · C · Plan: not planned

- **Evidence:** [verified-live] no description of the control room, CCTV coverage, VMS, weigh-in-motion or ATMS.
- **Gap:** ITS capability undisclosed.
- **Why it matters:** investor and lender view of O&M maturity.
- **Recommendation:** a short "How the road is managed" page.

---

**CON-ITS-05** · low · W · Plan: 0.15 (decision contradicted)

- **Evidence:** [verified-live] `/maps/corridor-geography.geojson` Content-Length 13,747,405 bytes, still offered on `/en/downloads`. The plan records it was simplified to 197 KB.
- **Gap:** a 13.7 MB download on mobile data.
- **Why it matters:** cost to users, and a plan/record mismatch.
- **Recommendation:** serve the simplified file or remove it.

### 4.7 Environmental, social and governance (ESG) and lender safeguards

**CON-ESG-01** · high · C+W · Plan: W3.20 (done — gap persists)

- **Evidence:** [verified-live] `/en/disclosures/land-acquisition`: a narrative only, with no RP, entitlement matrix, affected-household numbers, compensation progress or GRC contacts. [verified-source] ADB SMR (Jul–Dec 2022): 3,867 entitled persons, 1,957 households of which 1,341 non-titled, RP budget Tk 559.71 crore, RP approved 4 Feb 2021, GRC approved 28 Oct 2021, entitlement matrix at Annex 01.
- **Gap:** material resettlement information that is already public at ADB is absent from the concessionaire's site.
- **Why it matters:** ADB SPS 2009 expects safeguard documents to be available to affected people in an accessible place, form and language — [ADB SPS](https://www.adb.org/documents/safeguard-policy-statement). Land-related grievances are the largest community risk.
- **Recommendation:**
  - Now: link the ADB SMR and RP in a `document-list`.
  - Next: publish a Bangla summary of the entitlement matrix and GRC process.
  - Then: DBEDC or RHD supply the latest monitoring reports.

---

**CON-ESG-02** · high · C · Plan: not planned

- **Evidence:** [verified-live] `/en/disclosures/land-acquisition`: "Deputy Commissioners of Gazipur, Narayanganj and Narsingdi". [verified-source] the ADB SMR executive summary names "Gazipur and Narayanganj". [code] `db/sql/30-pending-drafts.sql:75`.
- **Gap:** a district not in the safeguard record is named as an acquiring authority.
- **Why it matters:** misdirects claimants to the wrong DC office.
- **Recommendation:** correct after DBEDC or RHD confirmation.

---

**CON-ESG-03** · high · C · Plan: W3.19 (done — gap persists)

- **Evidence:** [verified-live] `/en/disclosures/environment`: clearance, assessment and monitoring "listed on this page as they are released"; none listed. `/en/sustainability`: "can be requested through the contact form". [external] an IEE/EMP dated 10-03-2019 circulates publicly (Scribd); ADB category B.
- **Gap:** no ECC, IEE, EMP or monitoring reports.
- **Why it matters:** ECR 2023 compliance evidence; the lender disclosure norm.
- **Recommendation:** publish the IEE/EMP, the current ECC with renewal date, and semi-annual environmental monitoring reports.

---

**CON-ESG-04** · high · C · Plan: W3.17, W3.20

- **Evidence:** [verified-live] `/en/grievances` and `/en/disclosures/land-acquisition` route land issues to the DC or the DBEDC form. [verified-source] SMR: project GRC approved by MoRTB, interim grievance handling by NGO CCDB.
- **Gap:** the project-level GRM required by the approved RP is not described.
- **Why it matters:** affected persons miss the free, local GRC route; lender non-compliance.
- **Recommendation:** publish GRC composition, meeting venue and contacts, in Bangla first.

---

**CON-ESG-05** · high · W+D · Plan: W2.7, W5.11 (reversed by 29-legacy-as-current)

- **Evidence:** [verified-live] `/en/sustainability` states "Industrial land value +85%", "New business establishments +120", "Purbachal Economic Zone, 46% land value increase", "Travel time reduction 75%", "Exports… 0.8% of GDP", with no source. [code] `db/sql/29-legacy-as-current.sql:117` removed the "projection" framing. Home page: "Figures published… during construction… are not republished here until DBEDC has verified them."
- **Gap:** unsourced socio-economic claims presented as facts, and contradicted by the site's own disclaimer.
- **Why it matters:** greenwashing and impact-washing risk under lender and press scrutiny.
- **Recommendation:** remove, or cite each figure with study, author and date and label it a projection.

---

**CON-ESG-06** · medium · C · Plan: W3.11 partial

- **Evidence:** [verified-live] no OHS statistics (LTIFR, fatalities), labour standards, contractor code, child and forced labour policy, or gender/SEAH policy. [verified-source] the SMR includes "Compliance of social issues (Labor Standards; Health and Safety)".
- **Gap:** workforce ESG is not disclosed.
- **Why it matters:** ADB SPS and core labour standards; construction-phase fatality risk.
- **Recommendation:** publish the OHS policy, annual statistics and worker grievance channel.

---

**CON-ESG-07** · medium · C · Plan: not planned

- **Evidence:** [verified-live] `/en/disclosures/environment` has one sentence on drainage; no design flood level, climate-risk assessment or monsoon operations plan.
- **Gap:** climate resilience is undisclosed.
- **Why it matters:** a low-lying alignment across the Balu/Shitalakshya and Turag catchments.
- **Recommendation:** publish the design flood standard and emergency flood operations summary.

---

**CON-ESG-08** · medium · C · Plan: W3.21

- **Evidence:** [verified-live] `/en/disclosures/consultations`: "There is no open consultation". [verified-source] the SMR records FGDs on 13 Aug 2022 and 12 Nov 2022 with minutes.
- **Gap:** historical consultation records are not published.
- **Why it matters:** meaningful consultation evidence (ADB SPS).
- **Recommendation:** publish past consultation summaries with dates, places and participant counts.

---

**CON-ESG-09** · medium · C+D · Plan: not planned

- **Evidence:** [verified-live] no statement of the lender safeguard framework (ADB SPS 2009 via BIFFL's ESMS; CDB requirements; ECR 2023).
- **Gap:** stakeholders cannot see which standards apply.
- **Why it matters:** lender reporting alignment; whether IFC PS or Equator Principles apply is **unverified**.
- **Recommendation:** add a "Safeguard standards that apply" block after confirming with BIFFL and CDB.

### 4.8 Corporate governance and investor/lender relations

**CON-GOV-01** · high · C · Plan: W3.2 (done — figure differs from plan's "SRBG 70 / Shamim+UDC 30")

- **Evidence:** [verified-live] `/en/about/governance`: SRBG "60% equity stake", SEL "Local partner, 30%", UDC "Local partner, 10%"; `/en/about`: "SRBG equity stake 60%". [code] `db/sql/29-legacy-as-current.sql:75`. [external] UNB 2018 and Dhaka Tribune 2025 (citing BIFFL): 70/30.
- **Gap:** shareholding contradicts public record.
- **Why it matters:** ownership is a core governance disclosure; errors mislead lenders and regulators.
- **Recommendation:** DBEDC supplies its share register extract (RJSC Form XII or equivalent) and corrects all locales.

---

**CON-GOV-02** · high · C · Plan: W3.6

- **Evidence:** [verified-live] "Total project investment US$412M" on `/en/about`, `/en/project`, `/en/sustainability`; "SRBG… about US$240 million in equity"; VGF "initially ৳224 crore and later revised to ৳674 crore". [external] BIFFL USD 358.83M; UNB 2018 "VGF of 3.1 billion taka"; COO in TBS "Tk3,500 crore has risen".
- **Gap:** cost and financing figures are inconsistent with public sources and unsourced.
- **Why it matters:** financial misstatement risk.
- **Recommendation:** publish one financing table (original and revised cost, equity, CDB, BIFFL, VGF, MRG) with sources and date.

---

**CON-GOV-03** · medium · C · Plan: W3.3 (named directors await DBEDC)

- **Evidence:** [verified-live] `/en/about/governance` "Leadership": four names with titles only; no board list, independent directors, bios, appointment dates or committees. Chairman and CEO **unverified**.
- **Gap:** incomplete and partly unverified leadership disclosure.
- **Why it matters:** accountability; stale names are a reputational risk.
- **Recommendation:** `person-card` records for all directors and executives, with "as at" date and approval.

---

**CON-GOV-04** · high · W+D · Plan: W3.22 partial

- **Evidence:** [verified-live] `/en/about/integrity` routes corruption reports through the grievance form, which requires "Your name *". No whistle-blowing policy, anonymity option, non-retaliation commitment or external channel beyond ACC 106. Public Interest Information Disclosure (Provide Protection) Act 2011 (**provisions to be confirmed by counsel**).
- **Gap:** no protected whistle-blowing channel.
- **Why it matters:** anti-corruption lender covenants (ADB Anticorruption Policy), toll-cash leakage risk.
- **Recommendation:** adopt a policy; add an anonymous `request-form` kind routed to an independent recipient.

---

**CON-GOV-05** · medium · C · Plan: W3.9 partial

- **Evidence:** [verified-live] `/en/disclosures/policies` links to web pages only; there is no code of conduct, anti-bribery, conflict-of-interest, HSE or procurement policy document, despite `/about/integrity` claiming "a code of conduct for every employee".
- **Gap:** policies are asserted but not published.
- **Why it matters:** substantiation.
- **Recommendation:** publish approved policy PDFs with version and date.

---

**CON-GOV-06** · medium · D · Plan: not planned

- **Evidence:** [verified-live] `/en/about/governance`: SRBG is "Lead private investor… main EPC contractor".
- **Gap:** related-party relationship (majority shareholder as EPC contractor) with no disclosure of how conflicts are managed.
- **Why it matters:** lender and PPPA governance expectation; cost-overrun narrative.
- **Recommendation:** a statement on related-party contracts, the independent engineer and board approval.

---

**CON-GOV-07** · low · C · Plan: not planned

- **Evidence:** [verified-live] no financial calendar, AGM date or investor/lender relations contact.
- **Gap:** no IR basics.
- **Why it matters:** lender communications.
- **Recommendation:** add when reports are published.

### 4.9 Procurement and supplier engagement

**CON-PROC-01** · medium · W+C · Plan: W3.13 (done — empty)

- **Evidence:** [verified-live] `/en/procurement`: "No tender notices are currently listed". There is no award publication, archive or bid-document download, and registration is by contact form, which has no attachment field.
- **Gap:** procurement transparency is promised but not operated.
- **Why it matters:** integrity claims on `/about/integrity` depend on it.
- **Recommendation:** a `document-list` of notices (reference, scope, deadline, status) and awards (contractor, value, date); supplier registration with upload.

---

**CON-PROC-02** · medium · D · Plan: not planned

- **Evidence:** [verified-live] no statement of the governing procurement rules. As a private company DBEDC is likely outside PPA 2006/PPR 2008 and e-GP (**unverified**), but lender procurement conditions may apply.
- **Gap:** framework ambiguity.
- **Why it matters:** supplier trust; lender compliance.
- **Recommendation:** counsel confirms; publish a "Rules we buy under" statement; mirror notices to national press or e-GP if required.

---

**CON-PROC-03** · low · C · Plan: not planned

- **Evidence:** [verified-live] supplier complaints go to the generic grievance form; there is no debrief or standstill period.
- **Gap:** no bid-protest process.
- **Why it matters:** fairness.
- **Recommendation:** publish a debrief and complaint window.

### 4.10 Legal, privacy and data protection

**CON-PRIV-01** · high · W · Plan: 0.10 (done — out of date)

- **Evidence:** [verified-live] `/en/privacy` opens "Three things, and nothing else" (contact messages, newsletter, analytics). It omits:
  - SMS/WhatsApp phone numbers (`/travel/alerts`);
  - vehicle registration numbers (ETC, fleet, frequent-traveller forms);
  - camera imagery (`/travel/cameras`, and the "camera record" used in disputes);
  - Meta (WhatsApp Cloud API) and an SMS gateway as processors.
  
  It says "No other organisation processes personal data on DBEDC's behalf" while listing Namecheap, Cloudflare and Google. [code] `db/sql/14-legal-pages.sql:71`; `lib/alerts/providers.js:13-17`.
- **Gap:** the notice does not match actual processing.
- **Why it matters:** the PDPO 2025 consent and transparency duties once in force; trust.
- **Recommendation:** rewrite from a processing inventory (W8C.4); counsel review.

---

**CON-PRIV-02** · high · C · Plan: W2.10

- **Evidence:** [verified-live] `/en/privacy`: "Write to the data protection contact there [contact page]". The contact page has no address, email or named contact.
- **Gap:** data-subject rights cannot be exercised except through the anonymous web form.
- **Why it matters:** rights promised "within 30 days" are unreachable.
- **Recommendation:** publish a privacy mailbox and postal address.

---

**CON-PRIV-03** · medium · D · Plan: not planned

- **Evidence:** [verified-live] the notice relies on "the Right to Information Act 2009… and the personal-data provisions in force from time to time". There is no reference to the Personal Data Protection Ordinance 2025 or Cyber Security Ordinance 2025 (§2), no lawful basis per purpose, no cross-border transfer statement (Cloudflare, Google, Meta) and no DPO.
- **Gap:** legal framing is outdated.
- **Why it matters:** compliance readiness before PDPO obligations commence.
- **Recommendation:** counsel maps PDPO 2025 duties and commencement; update the notice and records of processing.

---

**CON-PRIV-04** · medium · W · Plan: not planned

- **Evidence:** [verified-live] every page loads `static.cloudflareinsights.com/beacon.min.js` (in HTML and in the Performance API resource list) without consent. No consent banner was detected on `/en`, and no GA tag is present. `/en/privacy` says analytics only after "Accept on the banner".
- **Gap:** an undisclosed analytics beacon, and a banner described but not shown.
- **Why it matters:** notice accuracy; consent expectations.
- **Recommendation:** disclose Cloudflare Web Analytics (cookieless) or disable it; align the notice with the actual banner state.

---

**CON-PRIV-05** · medium · W+D · Plan: W4.7

- **Evidence:** [verified-live] `/en/travel/cameras`: "images are not recorded or kept for this website". `/en/travel/toll-dispute`: charges checked against the "camera record". There is no CCTV policy (purpose, retention, number-plate capture, access requests, signage).
- **Gap:** the CCTV privacy position is incomplete and contradictory.
- **Why it matters:** plaza ANPR/CCTV is personal data; public display of live feeds.
- **Recommendation:** decide the CCTV policy; publish it; blur or angle public feeds.

---

**CON-PRIV-06** · low · W · Plan: not planned

- **Evidence:** [verified-live] `/en/terms`: "the date of the current version is shown at the top of this page". No date appears on terms or privacy.
- **Gap:** no versioning.
- **Why it matters:** enforceability of terms.
- **Recommendation:** add "Effective / last revised" from `pages.updated_at`, or a field.

### 4.11 Cybersecurity and trust posture (passive checks only)

Positive, all [verified-live]:

- TLS 1.3 (`TLS_AES_256_GCM_SHA384`), Google Trust Services certificate valid to 5 Dec 2026.
- HTTP→HTTPS 301.
- HSTS `max-age=63072000; includeSubDomains; preload`.
- `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, `X-Content-Type-Options: nosniff`.
- CSP with `object-src 'none'`, `frame-ancestors 'self'`, `form-action 'self'`.
- Honeypot and rate limits on forms ([code] `lib/rate-limit.js`, plan 0.6).

---

**CON-SEC-01** · high · D · Plan: not planned

- **Evidence:** [external] `https://github.com/emamhosen1999/dhakabypass` is publicly readable and appears in web search for "dhakabypass.com". Tracked files include `docs/deployment/2026-09-04-deploy-runbook.md` (hosting account and server paths), `docs/source-data/*` (client-supplied data and client decisions) and `docs/audit/*` (enumerated vulnerabilities). [code] `git ls-files` shows 913 files. No hard-coded secrets were found by a pattern scan (limited check).
- **Gap:** internal operating, hosting and client-decision material is public.
- **Why it matters:** it helps attackers target a shared cPanel host, and exposes client-confidential decisions and data.
- **Recommendation:** DBEDC and the vendor decide repository visibility (make private or move docs); rotate any credential ever committed; do not commit this audit to a public repo.

---

**CON-SEC-02** · medium · W · Plan: not planned

- **Evidence:** [verified-live] `/.well-known/security.txt` and `/security.txt` return 404.
- **Gap:** no vulnerability disclosure contact.
- **Why it matters:** critical-infrastructure operator norm (RFC 9116).
- **Recommendation:** publish security.txt with a role mailbox and policy page.

---

**CON-SEC-03** · medium · W · Plan: not planned

- **Evidence:** [external] DNS `_dmarc.dhakabypass.com`: `v=DMARC1; p=none`; SPF `~all` (Microsoft 365).
- **Gap:** the domain can be spoofed in email.
- **Why it matters:** fake job offers and fake toll-payment scams (the site warns about job scams on `/about/careers`).
- **Recommendation:** move DMARC to quarantine, then reject, after monitoring; add DKIM verification.

---

**CON-SEC-04** · medium · D · Plan: not planned

- **Evidence:** [verified-live] `/admin/login` returns 200 publicly behind Cloudflare. No IP allow-list or MFA is evident (**unverified**; not tested). The host is shared with another application (project memory).
- **Gap:** internet-exposed admin for an operator site.
- **Why it matters:** a defacement or false advisory would be a safety and reputational incident.
- **Recommendation:** Cloudflare Access or an IP allow-list for `/admin`; MFA; consider a dedicated hosting account.

---

**CON-SEC-05** · low · W · Plan: W6.4 (done — partial)

- **Evidence:** [verified-live] CSP `script-src 'self' 'unsafe-inline'`.
- **Gap:** inline scripts are permitted.
- **Why it matters:** reduced XSS protection.
- **Recommendation:** nonce-based CSP.

---

**CON-SEC-06** · low · W · Plan: not planned

- **Evidence:** [verified-live] response header `x-powered-by: Next.js`.
- **Gap:** framework fingerprinting.
- **Why it matters:** minor information disclosure.
- **Recommendation:** `poweredByHeader: false`.

---

**CON-SEC-07** · low · W · Plan: not planned

- **Evidence:** [code] `app/api/handover/route.js:1-22`: an unauthenticated GET route whose compiled module is patched to `process.exit(0)` during deploys. It was not requested in this audit.
- **Gap:** a request during the deploy window can restart the app.
- **Why it matters:** a small availability risk.
- **Recommendation:** require a one-time token header during handover.

### 4.12 Accessibility and inclusion as a public-service obligation

**CON-A11Y-01** · medium · W · Plan: W5.17 (statement not refreshed)

- **Evidence:** [verified-live] `/en/accessibility` "Known problems": "Chinese pages have no supplied font". Plan W1.28 shipped Noto Sans SC; 27 CJK font files load on `/zh/travel/map` (Performance API).
- **Gap:** the accessibility statement is inaccurate.
- **Why it matters:** statement credibility.
- **Recommendation:** review the statement quarterly, with a date.

---

**CON-A11Y-02** · medium · C+D · Plan: not planned

- **Evidence:** [verified-live] no mention of the Rights and Protection of Persons with Disabilities Act 2013 (ss.32–34 on access to public transport and infrastructure — [PMC analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC9650720/)). No information on accessible toll lanes, assistance for disabled drivers, or accessible pedestrian overpasses.
- **Gap:** physical-service accessibility is not addressed.
- **Why it matters:** public infrastructure obligation (**applicability to a concessionaire to be confirmed**).
- **Recommendation:** publish accessible facilities and an assistance contact.

---

**CON-A11Y-03** · medium · C · Plan: not planned

- **Evidence:** [verified-live] no easy-read or plain-Bangla summary of road-user rights (toll, complaint, emergency); no audio. `x-default` hreflang is `en`; root `/` serves English.
- **Gap:** Bangla-first and low-literacy inclusion is not realised.
- **Why it matters:** most users are Bangla-speaking drivers.
- **Recommendation:** one-page Bangla "আপনার অধিকার" summary, with pictograms and audio.

### 4.13 Communications, media and crisis readiness

**CON-COMMS-01** · high · C+D · Plan: W5.9 (done — empty)

- **Evidence:** [verified-live] `/en/press-releases` and `/en/media`: "There are no press releases yet". The newest `/en/news` item is dated 15 April 2025; nothing on the 24 Aug 2025 inauguration; "Dhaka Bypass Expressway to be Operational by July" (30 Mar 2025) still reads as current.
- **Gap:** no official voice; 17 months of silence.
- **Why it matters:** third-party press (including the adviser's cost criticism in TBS) defines the narrative.
- **Recommendation:** monthly operational bulletin; bilingual press releases for every opening, toll change and major incident.

---

**CON-COMMS-02** · high · D · Plan: not planned

- **Evidence:** [verified-live] no incident statement channel, spokesperson, press phone or social handle.
- **Gap:** no crisis communications protocol visible.
- **Why it matters:** first-statement time after a fatal crash, flood closure or toll protest.
- **Recommendation:** decide the protocol; add a site-wide CMS "Official statement" banner block tied to advisories; publish verified social accounts.

---

**CON-COMMS-03** · medium · W+C · Plan: W5.16 (done — not rendered)

- **Evidence:** [verified-live] no social profile links on any page. [code] the CMS consistency audit (`docs/audit/2026-09-12-cms-consistency-audit.md`, §3) records four social settings saved but never rendered.
- **Gap:** no verified official social presence.
- **Why it matters:** Facebook is the dominant news channel in Bangladesh; rumour control depends on known handles.
- **Recommendation:** render social links; verify pages; add `sameAs` (CON-SEO-D-01).

---

**CON-COMMS-04** · medium · C · Plan: not planned

- **Evidence:** [verified-live] each of the six news items is a one-sentence summary of a third-party article.
- **Gap:** news is aggregation, not DBEDC statements.
- **Why it matters:** E-E-A-T and authority.
- **Recommendation:** separate "In the press" from "DBEDC news".

---

**CON-COMMS-05** · low · C · Plan: W5.2 partial

- **Evidence:** [verified-live] `/en/media`: no fact sheet PDF, spokesperson, hi-res photo pack or b-roll.
- **Gap:** thin media kit.
- **Why it matters:** press accuracy (see the CON-GOV figures).
- **Recommendation:** a fact sheet generated from the same verified records.

### 4.14 Brand, reputation and stakeholder credibility

**CON-BRAND-01** · high · C · Plan: W2.2 (legacy retained)

- **Evidence:** [verified-live] `/en/project` states in one page:
  - "100+ Including 5 river bridges, 3 minor bridges, 4 flyovers, 45 underpasses and 87 culverts";
  - "Bridges · flyovers · underpasses 12 · 7 · 27";
  - "62 of 73 planned box culverts".
  
  [external] BIFFL: "6 new bridges… 8 new mainline overpasses, 46 existing box culverts… 49 new culverts… 8 pedestrian overpasses". TBS: "two railway overpasses and eight bridges".
- **Gap:** three incompatible structure counts on one page, none matching lender records.
- **Why it matters:** technical credibility with engineers, lenders and press.
- **Recommendation:** one structures register (records) as the single source; remove the prose counts.

---

**CON-BRAND-02** · high · D · Plan: decision of 12 Sep 2026

- **Evidence:** [verified-live] home: "Figures published for this project during construction — total investment, jobs created, bridges and underpasses built, the length of the concession — have not been reconfirmed… They are not republished here until DBEDC has verified them." The same figures appear on `/about`, `/project`, `/sustainability` and `/media` (US$412M, 1,000+ jobs, 12·7·27, 25 years). [code] `db/sql/29-legacy-as-current.sql:3-4`.
- **Gap:** the site contradicts its own integrity statement.
- **Why it matters:** visibly inconsistent governance of facts.
- **Recommendation:** either verify and cite the figures and remove the disclaimer, or remove the figures.

---

**CON-BRAND-03** · medium · C · Plan: not planned

- **Evidence:** [verified-live] lengths 48 km, 35 km "measured", 47.611 km (map K47+611). [code] `db/sql/29-legacy-as-current.sql:48` "48.07 km"; Chinese sources 48.11 km. "Organisations in partnership 7" (`/about/governance`).
- **Gap:** inconsistent key figures.
- **Why it matters:** answer engines and press pick different numbers.
- **Recommendation:** one "key facts" settings record used by all blocks.

---

**CON-BRAND-04** · medium · D · Plan: W3.14

- **Evidence:** [verified-live] `/en/about/recognition`: "Bangladesh's first road PPP", "First fully access-controlled expressway section". [external] Chinese government sources call it "孟加拉国第一条全封闭高速公路"; the Dhaka–Mawa–Bhanga Expressway (opened 2020) is also described as access-controlled ([Wikipedia](https://en.wikipedia.org/wiki/Dhaka%E2%80%93Bhanga_Expressway)).
- **Gap:** "first" claims need a precise basis.
- **Why it matters:** challenge risk.
- **Recommendation:** qualify the claims ("first road PPP under the PPP Act 2015", if confirmed by PPPA).

---

**CON-BRAND-05** · low · D · Plan: not planned

- **Evidence:** [external] a web search result lists `demodasher.com/routes-facilities/` titled "Dhaka Bypass Expressway - Bangladesh's First Fully Access-Controlled Highway". It did not respond to a fetch on 14 Sep 2026 (**unverified**).
- **Gap:** possible clone or staging copy indexed.
- **Why it matters:** impersonation and outdated information.
- **Recommendation:** monitor; request de-indexing or takedown if live.

### 4.15 SEO and digital presence

**Method.**

- *Tools.* Python HTML parse of all 189 sitemap URLs (title, meta description, canonical, `html lang`, hreflang, robots meta, H1/H2, `img` alt, JSON-LD `@type`, OG/Twitter tags), `curl` for status codes and redirects, `nslookup` for DNS, and the public Nominatim, Overpass and Wikidata APIs.
- *Performance.* Measured with the Playwright browser Performance API. The PageSpeed Insights API returned HTTP 429 (quota), so no CrUX field data was available.
- *Search visibility.* Checked via WebSearch (US-based index, indicative only).

#### A. Technical SEO — score 7

Positive, all [verified-live]:

- `sitemap.xml` lists 189 URLs (63 × 3), each with `lastmod` and four `xhtml:link` alternates (756).
- Canonicals are self-referencing on all 189 pages.
- Content is server-rendered (text present in raw HTML).
- Single-hop redirects (`/en/` → `/en`, `/en/travel` → `/en/travel/status`, legacy `/routes-facilities` → `/en/travel/map`).
- 404 status on unknown paths.
- Gallery page 2 is `noindex` with a canonical to page 1.
- `robots.txt` disallows `/admin` and `/api/` and references the sitemap.

---

**CON-SEO-A-01** · medium · W · Plan: not planned

- **Evidence:** [verified-live] `https://www.dhakabypass.com/en` returns 200 (no redirect to apex). `https://dhakabypass.com/` returns 200 with a full English page (canonical `/en`) instead of redirecting. [external] web search for "dhakabypass.com" shows `https://www.dhakabypass.com/` with the legacy title "Bangladesh's First Fully Access-Controlled Highway" and the stale snippet "Upon completion in July 2025".
- **Gap:** duplicate hosts and root; search engines still show pre-migration copy.
- **Why it matters:** outdated official claims appear in search results.
- **Recommendation:** 308 `www` → apex at Cloudflare; 308 `/` → `/bn` or `/en` (see B); request recrawl in Search Console.

---

**CON-SEO-A-02** · low · W · Plan: 0.12

- **Evidence:** [verified-live] `/EN/travel/toll` and `/travel/toll` (no locale) return 404.
- **Gap:** no case or locale-less normalisation.
- **Why it matters:** press and print links break.
- **Recommendation:** redirect locale-less paths to the default locale; lowercase normalisation.

---

**CON-SEO-A-03** · low · W · Plan: W1.19

- **Evidence:** [verified-live] `/en/sitemap` (HTML sitemap) lists "Page not found" as a page.
- **Gap:** the 404 document is exposed as content.
- **Why it matters:** crawl noise.
- **Recommendation:** exclude reserved slugs from `sitemap-list`.

---

**CON-SEO-A-04** · low · W · Plan: not planned

- **Evidence:** [verified-live] `sitemap.xml` gives every URL `changefreq daily` and `lastmod` from the page row; operational records (tolls, advisories) do not update `lastmod`.
- **Gap:** freshness signals do not reflect data changes.
- **Why it matters:** recrawl of changed tolls and advisories.
- **Recommendation:** derive `lastmod` from the newest bound record.

#### B. International SEO — score 6

Positive, all [verified-live]:

- `html lang` = `en` / `bn` / `zh-Hans` on every page.
- hreflang en/bn/zh plus x-default present on all 189 pages, and fully reciprocal (0 missing, 0 non-reciprocal).
- Titles are localised.
- The site loads no Google-hosted runtime resources (only self and Cloudflare), which suits mainland-China reachability, apart from YouTube embeds on `/zh/gallery/videos`.

---

**CON-SEO-B-01** · medium · W+C · Plan: not planned

- **Evidence:** [verified-live] `/bn` title: "Dhaka Bypass Expressway — টোল, রুট ও যান চলাচলের তথ্য"; `/zh` title: "Dhaka Bypass Expressway — 通行费、路线与通行信息". The bn meta description uses Latin "Vogra", "Purbachal". [external] Chinese official sources use 达卡绕城高速 (yidaiyilu, Sichuan SASAC).
- **Gap:** the local-script brand name is absent from bn/zh titles.
- **Why it matters:** queries like "ঢাকা বাইপাস টোল" and "达卡绕城高速" will not match the title.
- **Recommendation:** localised brand setting per locale (ঢাকা বাইপাস এক্সপ্রেসওয়ে / 达卡绕城高速公路), used in titles and JSON-LD `alternateName`.

---

**CON-SEO-B-02** · medium · D · Plan: not planned

- **Evidence:** [verified-live] `x-default` → `/en`; root `/` serves English.
- **Gap:** English-first defaults for a Bangla-majority audience.
- **Why it matters:** the plan says "Bangla is authoritative".
- **Recommendation:** decide the default locale; consider `Accept-Language` negotiation at `/` with x-default a language chooser or `/bn`.

---

**CON-SEO-B-03** · medium · C · Plan: W3.25

- **Evidence:** [verified-live] `/bn/news/*` and `/zh/news/*`: English article text under bn/zh hreflang (CON-CS-05).
- **Gap:** language mismatch in declared-language URLs.
- **Why it matters:** thin, duplicate content across locales.
- **Recommendation:** translate, or emit `noindex` plus hreflang only for existing translations.

---

**CON-SEO-B-04** · low · D · Plan: not planned

- **Evidence:** [verified-live] slugs are English in all locales (`/bn/travel/toll`); there is no Baidu webmaster verification or ICP (not required outside China). Baidu indexation **unverified**.
- **Gap:** no documented translated-slug or Baidu policy.
- **Why it matters:** the Chinese stakeholder audience (SRBG and Shudao, Chinese staff) searches on Baidu.
- **Recommendation:** record a decision: keep English slugs (acceptable); submit the zh sitemap to Baidu Ziyuan if Chinese reach matters.

#### C. On-page and content SEO — score 4

**CON-SEO-C-01** · high · W+C · Plan: W1.7 (route_meta built; not filled)

- **Evidence:** [verified-live] 9 pages in each locale have **no meta description**: `travel/toll`, `travel/status`, `travel/route`, `travel/map`, `travel/rules`, `travel/facilities`, `contact`, `news`, `gallery` (27 URLs). These are the highest-intent road-user pages.
- **Gap:** search snippets are machine-chosen on the pages people search for.
- **Why it matters:** "Dhaka Bypass toll rate" style queries; click-through.
- **Recommendation:** write localised descriptions stating the key fact (for example "Car ৳150 on the open Vogra–Purbachal section, in force since 24 Aug 2025").

---

**CON-SEO-C-02** · high · W · Plan: not planned

- **Evidence:** [verified-live] inner-page titles are generic and unbranded: "Toll rates", "What's open", "Governance", "Careers", "Media", "Search" (21 English titles under 12 characters). The zh titles of `/zh/disclosures` and `/zh/disclosures/right-to-information` are both "信息公开" (duplicate).
- **Gap:** titles carry neither the corridor name nor the operator.
- **Why it matters:** SERP competition with Dhaka Elevated Expressway pages; web search for "Dhaka Bypass toll rate" returned no dhakabypass.com result in the top 8 ([external] WebSearch, 14 Sep 2026).
- **Recommendation:** title template "<Page> — Dhaka Bypass Expressway (DBEDC)" per locale from settings; fix the zh duplicate.

---

**CON-SEO-C-03** · medium · W · Plan: not planned

- **Evidence:** [verified-live] `/privacy`, `/terms`, `/accessibility` have **0 H1** in all locales (headings start at H2).
- **Gap:** missing primary heading.
- **Why it matters:** relevance and accessibility.
- **Recommendation:** add a `page-header` block.

---

**CON-SEO-C-04** · medium · C · Plan: not planned

- **Evidence:** [verified-live] thin or placeholder pages indexed: `/facilities` ("No service areas have been published yet"), `/press-releases` ("no press releases yet"), `/consultations`, `/procurement` (no notices), `/about/recognition` (no awards), `/search`.
- **Gap:** thin content in the index.
- **Why it matters:** site-quality signals; users land on empty pages.
- **Recommendation:** `noindex` pages whose list blocks are empty (CMS rule), or merge them.

---

**CON-SEO-C-05** · high · C · Plan: see CON-CS-01, CON-GOV-01

- **Evidence:** [verified-live] E-E-A-T gaps for an official operator: no address, phone or registration (CON-REG-08); contradictory facts (CON-BRAND-01..03); news credited to other publishers; no author or "reviewed by" on disclosure pages.
- **Gap:** weak authority and trust signals.
- **Why it matters:** Google treats safety and financial information as YMYL.
- **Recommendation:** publish identity, contact and review metadata (owner, reviewed date) on every disclosure page.

#### D. Structured data — score 2

**CON-SEO-D-01** · medium · W · Plan: W1.24 partial

- **Evidence:** [verified-live] JSON-LD on 57 of 63 pages per locale is `Organization` with `name`, `alternateName`, `url` and `logo` only; 6 news pages add `NewsArticle` and `WebPage`. There is no `address`, `contactPoint` (telephone, contactType "emergency" / "customer service"), `sameAs` or `foundingDate`.
- **Gap:** minimal entity data.
- **Why it matters:** knowledge panel and answer-engine grounding.
- **Recommendation:** enrich Organization from settings (legalName, address, contactPoint[], sameAs[], parentOrganization or member for sponsors).

---

**CON-SEO-D-02** · medium · W · Plan: not planned

- **Evidence:** [verified-live] no `WebSite`+`SearchAction` although `/search` exists; no `BreadcrumbList`; no `FAQPage` on `/faq` (12 Q&As in all locales).
- **Gap:** eligible markup is missing.
- **Why it matters:** sitelinks search box, breadcrumbs, FAQ answers for assistants.
- **Recommendation:** emit these from the renderer (FaqBlock → FAQPage).

---

**CON-SEO-D-03** · low · W · Plan: not planned

- **Evidence:** [verified-live] no `Place`/`LocalBusiness`/`GovernmentService` for toll plazas or the office; closures are not marked as `Event` or `SpecialAnnouncement`.
- **Gap:** no entity markup for physical assets or road events.
- **Why it matters:** maps and search features for plazas and closures.
- **Recommendation:** `Place` with geo for each plaza from `interchanges`; `Event` or `SpecialAnnouncement` for major closures.

#### E. Local SEO and maps — score 1

**CON-SEO-E-01** · high · C+D · Plan: not planned

- **Evidence:**
  - [verified-live] no NAP (name, address, phone) anywhere on the site (CON-CS-01); the office pin is a "Sample location".
  - [external] OpenStreetMap Overpass query over the corridor bounding box (23.65–24.02 N, 90.35–90.60 E) found 19 `barrier=toll_booth` features: 17 unnamed, two named "Tole Plaza" (sic), none with `operator` or `name` DBEDC. Nominatim search "Dhaka Bypass toll plaza" returned 0 results.
  - Google Business Profile listings for plazas and office: **unverified** (not checkable without Maps API or a manual check).
- **Gap:** plazas and office are invisible or mislabelled in maps.
- **Why it matters:** drivers find plazas, service desks and the office through Google Maps, Barikoi and OSM-based apps.
- **Recommendation:**
  - DBEDC claims or creates GBP listings for the office and each open plaza, with consistent NAP.
  - Contribute OSM tags (`name`, `operator=DBEDC`, `ref=N105`).
  - Publish the same NAP on the site.

---

**CON-SEO-E-02** · medium · C · Plan: not planned

- **Evidence:** [external] Wikidata `Q114081230` "Dhaka Bypass Expressway" carries only P31 (instance of) and P17 (country); no official website (P856), operator (P137), owner (P127), length (P2043) or opening date (P1619).
- **Gap:** knowledge-graph entity is empty.
- **Why it matters:** knowledge panels and AI answers draw from Wikidata.
- **Recommendation:** add verified statements with references to the site and BIFFL/ADB (editors following Wikidata COI rules).

#### F. Social and sharing — score 1

**CON-SEO-F-01** · high · W · Plan: W1.24 (OG default image built; not rendered)

- **Evidence:** [verified-live] `og:` and `twitter:` tags appear only on the 6 news articles per locale (`og:title`, `og:description`, `og:type`, `twitter:card summary`), with **no og:image** and no `og:locale`/`og:locale:alternate`. The other 57 pages per locale, including `/en`, `/en/travel/toll` and `/bn`, have none.
- **Gap:** shared links on Facebook, WhatsApp and Messenger render without title, image or description.
- **Why it matters:** Facebook and WhatsApp are Bangladesh's dominant sharing channels; toll-rate and closure posts spread there.
- **Recommendation:** emit OG and Twitter tags on every page from route_meta and settings (title, description, 1200×630 image per locale, `og:locale` bn_BD / en_GB / zh_CN).

---

**CON-SEO-F-02** · medium · C · Plan: W5.16

- **Evidence:** [verified-live] no linked social profiles; no `sameAs`. Official DBEDC social accounts **unverified**.
- **Gap:** no two-way verification between site and social profiles.
- **Why it matters:** rumour control and impersonation (fake pages).
- **Recommendation:** publish the official handles and link them both ways.

#### G. Performance as a ranking factor — score 6

Lab measurements with the Playwright Performance API on 14 Sep 2026 [verified-live]. These are lab data, not CrUX field data.

| URL | Unthrottled (412 px viewport): TTFB / LCP | Emulated slow 4G (1.6 Mbps, 150 ms) + 4× CPU: TTFB / FCP / LCP / CLS | Notes |
|---|---|---|---|
| `/en` | 23 ms / 1,104 ms | 489 ms / 6,172 ms / 6,172 ms / 0 | 11 scripts, 5 fonts, ≈1.0 MB decoded |
| `/bn/travel/toll` | 15 ms / 924 ms | 292 ms / 8,152 ms / 8,152 ms / 0.014 | 6 font files |
| `/zh/travel/map` | 15 ms / 1,312 ms | 2,826 ms / 5,812 ms / 6,212 ms / 0.105 | 27 CJK font slices, 1,428 DOM nodes, ≈2.6 MB decoded |

---

**CON-SEO-G-01** · medium · W · Plan: not planned

- **Evidence:** [verified-live] the table above: LCP 6.2–8.2 s under low-end mobile emulation (the Google "poor" threshold is > 4 s). FCP equals LCP, which suggests render-blocking font or CSS. `/zh/travel/map` uncached TTFB 2.8 s and CLS 0.105 (borderline "needs improvement" > 0.1).
- **Gap:** slow first paint on the network and device conditions typical of highway users.
- **Why it matters:** mobile-first ranking; drivers checking closures on 3G/4G.
- **Recommendation:**
  - Audit font loading (`font-display`, subset preloads).
  - Inline critical CSS.
  - Cache the map route at the edge.
  - Reserve space for map labels.
  - Obtain CrUX via PSI once the quota allows, or via Search Console.

---

**CON-SEO-G-02** · low · W · Plan: not planned

- **Evidence:** [verified-live] PageSpeed Insights API call returned HTTP 429 ("Quota exceeded… Queries per day"), so no field data was obtained.
- **Gap:** no field CWV monitoring.
- **Why it matters:** real-user regressions go unseen.
- **Recommendation:** Search Console CWV report, plus Cloudflare RUM (disclosed).

#### H. Answer-engine and AI visibility — score 2

**CON-SEO-H-01** · high · D · Plan: not planned

- **Evidence:** [verified-live] `robots.txt` (Cloudflare managed) disallows `ClaudeBot`, `GPTBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `meta-externalagent`, `Amazonbot` and `Bytespider`, with `Content-Signal: search=yes,ai-train=no,use=reference`. `/llms.txt` returns 404.
- **Gap:** AI assistants cannot read the official source.
- **Why it matters:** answers about tolls, emergency numbers and opening dates are then drawn from press, Wikipedia or legacy copies instead of DBEDC's current data. A safety-information operator usually wants to be the grounding source.
- **Recommendation:**
  - Decide the policy explicitly. An option is to allow retrieval (`ai-input` / `use=reference`) for `/travel/*` and `/disclosures/*` while keeping `ai-train=no`.
  - Publish `llms.txt` listing key-fact pages.

---

**CON-SEO-H-02** · high · C · Plan: see CON-OPS-01, CON-GOV-01/02, CON-SAFE-01

- **Evidence:** [verified-live] key facts are stated inconsistently or not at all:
  - % open: 51.4% vs 18/48;
  - lengths: 48 / 35 / 47.6 km;
  - shareholding: 60 vs 70;
  - cost: US$412M vs US$358.83M;
  - emergency number: absent;
  - opening dates: four versions.
  
  [external] Wikipedia gives "23 years" of tolling and "৳3,500 crore".
- **Gap:** no single machine-readable statement of key facts.
- **Why it matters:** answer engines surface whichever figure they find first.
- **Recommendation:** a CMS "Key facts" record rendered as a visible table on `/about` and `/media`, plus JSON-LD, used by every block.

#### I. Off-site authority and reputation — score 3

Positive, all [external]: the corridor is cited by ADB, BIFFL, Sichuan provincial government and yidaiyilu.gov.cn, and national press (TBS, Dhaka Tribune, UNB, Prothom Alo). A full backlink profile was not measurable without a commercial tool (**unverified**).

---

**CON-SEO-I-01** · medium · W+C · Plan: not planned

- **Evidence:** [external] authoritative pages about the project (BIFFL project page, ADB news, TBS articles, Wikipedia) do not visibly link to dhakabypass.com; the Wikidata item has no official website.
- **Gap:** weak government, lender and press link equity to the official site.
- **Why it matters:** brand SERP ownership.
- **Recommendation:** ask RHD, BIFFL, PPPA and SRBG to link the official site; add the site to Wikipedia and Wikidata via proper process.

---

**CON-SEO-I-02** · medium · D · Plan: see CON-SEC-01, CON-BRAND-05

- **Evidence:** [external] WebSearch for `"dhakabypass.com"` returns the public GitHub repository `emamhosen1999/dhakabypass` as the first result. Search also surfaces `demodasher.com/routes-facilities/` with legacy DBEDC branding (**unverified**, unreachable on fetch).
- **Gap:** non-official properties rank for brand queries.
- **Why it matters:** impersonation, stale information, security exposure.
- **Recommendation:** make the repo private or de-index it; monitor brand queries monthly.

#### J. Analytics, Search Console and measurement — score 1

**CON-SEO-J-01** · high · W+D · Plan: 0.10 (consent built)

- **Evidence:** [verified-live] no Google Analytics or GTM tag in page HTML or the network resource list, and no consent banner detected on `/en`. `google-site-verification` meta: absent on all 189 pages. [external] DNS TXT for `dhakabypass.com` shows SPF only, no Google verification record (HTML-file or other methods **unverified**).
- **Gap:** no evidence of analytics or Search Console.
- **Why it matters:** DBEDC cannot see which pages drivers use, what they search for, or indexation errors (for example the stale www snippet).
- **Recommendation:** verify a Search Console Domain property (DNS) and Bing Webmaster; configure GA4 (or cookieless) behind the documented consent; submit sitemaps.

---

**CON-SEO-J-02** · medium · W · Plan: not planned

- **Evidence:** [code] no analytics events for calculator use, request submission (by kind), alert sign-up, emergency `tel:` taps or downloads.
- **Gap:** no KPI or conversion tracking.
- **Why it matters:** service improvement and board reporting (see CON-KPI-01).
- **Recommendation:** define an event plan with privacy-safe aggregate counts.

#### K. Accessibility-SEO overlap and content governance — score 4

Positive [verified-live]: of 105 `<img>` per locale, 64 have empty `alt`. On inspection these are the decorative brand mark next to the text wordmark (one per page) and the decorative home hero, which is correct. The gallery photos carry descriptive alt text ("A plaque being presented at a school handover").

---

**CON-SEO-K-01** · medium · C · Plan: W5.3

- **Evidence:** [verified-live] `/en/gallery/videos`: four YouTube reports (Somoy TV, Ekhon TV, a road user), with no transcript or captions note and no Bangla summary text.
- **Gap:** video content is not indexable or accessible.
- **Why it matters:** accessibility and search.
- **Recommendation:** add a text summary or transcript field to `video-embed`.

---

**CON-SEO-K-02** · medium · W+D · Plan: not planned

- **Evidence:** [verified-live] no page shows owner, "last reviewed" or next review. The newest news item is from April 2025. Commitments were drafted 12 Sep 2026 with no reviewer.
- **Gap:** no content governance model.
- **Why it matters:** stale and unverified content persists (CON-OPS-03, CON-BRAND-02).
- **Recommendation:**
  - Add `owner_department`, `reviewed_at` and `review_interval` to pages.
  - Show "Reviewed <date>" on disclosure, toll and safety pages.
  - Add an admin overdue-review list.

### 4.16 Measurement and continuous improvement

**CON-KPI-01** · medium · W+C · Plan: not planned

- **Evidence:** [verified-live] no public service KPIs: grievances received and resolved, % within SLA, toll disputes and refunds, RTI requests, incident response times, alert subscribers, traffic volumes. `/disclosures/reports` promises monthly plaza counts "once reviewed"; none shown.
- **Gap:** no performance transparency.
- **Why it matters:** GRS monitoring convention; lender O&M reporting; peer IHMCL daily ETC collection data.
- **Recommendation:** a `stat-dashboard` fed from `service_requests` and `traffic_monthly`, published quarterly after DBEDC approval.

---

**CON-KPI-02** · low · W · Plan: not planned

- **Evidence:** [verified-live] no "Was this page helpful?" or feedback prompt on toll, status or safety pages.
- **Gap:** no user feedback loop.
- **Why it matters:** continuous improvement.
- **Recommendation:** a lightweight, anonymous page-feedback block storing aggregate counts.

### 4.17 Peer-benchmark findings

**CON-PEER-01** · medium · D · Plan: W3.0

- **Evidence:** [external] FDEE ([fdee.bd](http://fdee.bd/)) publishes phone +880 9658946661, info@ email and WhatsApp live chat. Sichuan Chengyu Expressway ([cygs.com](https://www.cygs.com/)) publishes 信息公开 (information disclosure), 招投标公告 (tenders), 廉洁举报 (integrity reporting) and A/H-share periodic reports. IHMCL ([ihmcl.co.in](https://ihmcl.co.in/24x7-national-highways-helpline-1033/)) publishes the 1033 helpline, archived tenders, annual reports and ETC transaction reports.
- **Gap:** DBEDC lacks the contact baseline of its closest Dhaka peer, and the disclosure baseline of its own sponsor group's listed sister company.
- **Why it matters:** stakeholders compare.
- **Recommendation:** use Sichuan Chengyu's disclosure architecture (same Shudao group) as the governance template.

---

**Plan coverage summary.** Of the 125 findings, 63 cite a master-plan task (most marked done while the live gap persists, or only partly met) and 62 are not planned. None of the W8C tasks below duplicates a W7 (admin) task or the UI-audit W8 series.

---

## 5. Peer benchmark matrix

**Legend:**

| Mark | Meaning |
|---|---|
| ● | Strong / exemplary |
| ◐ | Partial |
| ○ | Absent |
| ? | Not verified |

**Sources:**

- The previous benchmark is `docs/audit/2026-09-06/findings-agent-b-peer-benchmark.md` (18 operators).
- Rechecked 14 Sep 2026: [fdee.bd](http://fdee.bd/), [cygs.com](https://www.cygs.com/), [ihmcl.co.in](https://ihmcl.co.in/24x7-national-highways-helpline-1033/), [transurban.com](https://www.transurban.com/), [plus.com.my](https://www.plus.com.my/), [rhd.portal.gov.bd](https://rhd.portal.gov.bd/), [bba.gov.bd](https://bba.gov.bd/).
- VINCI Autoroutes and Mundys rows rely on the 06 Sep benchmark.
- Padma/Jamuna rows use BBA's toll information hub and its ETC news (TBS).

| Domain | DBEDC | Dhaka Elevated Expwy (FDEE / BBA) | Padma & Bangabandhu bridges (BBA) | NHAI / IHMCL FASTag (India) | PLUS (Malaysia) | Transurban / Linkt (Australia) | VINCI Autoroutes / Mundys (Europe) | Sichuan Chengyu Expwy (China) |
|---|---|---|---|---|---|---|---|---|
| 1 Statutory disclosure | ◐ | ◐ BBA RTI and charter | ● BBA RTI, charter, GRS | ● RTI, annual reports | ◐ | ● governance and reports | ● governance, ethics | ● 信息公开, periodic reports |
| 2 Toll transparency | ◐ | ● gazetted rates via BBA | ● rate schedules, daily collection | ● TIS per-plaza fees | ● calculator | ● calculator, pass products | ● rates, ULYS | ◐ |
| 3 Safety & emergency | ○ | ◐ phone | ◐ | ● 1033 | ● PLUSLine 1-800 | ● | ● 107 / traffic info | ? |
| 4 Customer service | ◐ | ● phone, email, WhatsApp | ◐ complaint filing | ● logged complaints | ● app, chatbot | ● accounts, disputes | ● | ◐ |
| 5 Live operations | ◐ | ○ | ◐ traffic data | ● app | ● live cameras | ● live traffic | ● forecasts, roadworks | ? |
| 6 ETC / ITS | ◐ (claims only) | ● ETC | ● ETC (D-Toll) | ● FASTag, NETC | ● RFID / TnG | ● tags | ● ULYS | ● ETC |
| 7 ESG & safeguards | ○ | ◐ EIA via BIFFL | ● resettlement lists | ◐ | ● sustainability | ● reporting suite | ● | ◐ ESG report ? |
| 8 Governance & IR | ◐ | ○ | ● | ● | ● awards, governance | ● board, investor centre | ● whistle-blowing | ● board, H-share IR, 廉洁举报 |
| 9 Procurement | ○ | ○ | ● tenders | ● new and archived tenders | ● vendor registration | ● suppliers page | ● supplier portal | ● 招投标公告 |
| 10 Privacy & legal | ◐ | ? | ◐ | ◐ | ● | ● | ● | ◐ |
| 11 Security posture | ◐ | ? | ? | ? | ? | ● | ● | ? |
| 12 Accessibility | ◐ | ○ | ○ | ◐ Hindi / English | ◐ | ● | ● statement | ○ |
| 13 Comms & crisis | ○ | ◐ news and notice board | ● notices | ● press releases | ● media centre | ● newsroom | ● media kit | ● news centre |
| 14 Brand consistency | ○ | ◐ | ◐ | ◐ | ● | ● | ● | ● |
| A–C Technical / intl / on-page SEO | ◐ | ○ | ◐ | ◐ | ● | ● | ● | ◐ |
| D Structured data | ○ | ○ | ○ | ? | ? | ◐ ? | ◐ ? | ○ |
| E Local / maps | ○ | ? | ● plazas on maps ? | ● TIS plaza geo | ● R&R locations | ● | ● rest areas | ? |
| F Social | ○ | ● WhatsApp | ● Facebook | ● X / YouTube | ● app and social | ● social | ● | ◐ WeChat ? |
| G Performance | ◐ | ? | ? | ? | ? | ? | ? | ? |
| H Answer-engine readiness | ○ | ○ | ◐ | ◐ | ◐ | ◐ | ◐ | ○ |
| I Off-site authority | ◐ | ◐ | ● | ● | ● | ● | ● | ● |
| J Analytics / GSC | ○ | ? | ? | ? | ? | ? | ? | ? |
| K Content governance | ○ | ◐ | ◐ | ◐ | ● | ● | ● | ● |
| 16 KPIs published | ○ | ○ | ● daily collection | ● daily FASTag collection | ◐ | ● traffic and revenue | ● monthly traffic | ● traffic statistics |

**What the best peer does that DBEDC does not, per domain:**

| Domain | Best peer practice DBEDC lacks |
|---|---|
| Statutory disclosure | RHD and BBA name the RTI officer and appeal authority with phone and email, and publish a tabular citizen charter. |
| Toll transparency | NHAI TIS shows the gazette notification per plaza fee. |
| Safety & emergency | PLUS and NHAI put one memorable 24/7 number on every page and in the app. |
| Customer service | FDEE gives phone, email and WhatsApp; NHAI logs every complaint centrally with callback. |
| Live operations | VINCI publishes traffic forecasts and roadworks calendars. |
| ETC / ITS | IHMCL publishes ETC transaction reports and an interoperable tag. |
| ESG | BBA publishes affected-persons lists; Transurban a sustainability reporting suite. |
| Governance & IR | Transurban and Sichuan Chengyu publish board, periodic reports, and integrity-reporting channels. |
| Procurement | IHMCL keeps an archived tenders register. |
| Communications | NLEX and Mundys run a dated press-release archive and media kit. |
| SEO & presence | PLUS and Transurban use localised, branded titles, social cards, and map-listed facilities. |
| KPIs | Mundys publishes monthly traffic; BBA daily toll collection. |

---

## 6. Data and documents DBEDC must supply

Priority P0 means within 48 hours (safety or misleading information), P1 within 2 weeks, P2 within 6 weeks, P3 within the quarter.

| # | Item | Why required | Owner department | Format | Priority |
|---|---|---|---|---|---|
| S1 | Confirmed 24/7 emergency / control-room number (role line, not a personal handset) and confirmation that 999 may be shown | CON-SAFE-01; seven pages direct drivers to it | Traffic management & patrol (control room) | Setting value plus written confirmation | P0 |
| S2 | Confirmation or correction of "Purbachal–Bhulta expected to open 16 September 2026", plus the authoritative opening chronology (trial and formal openings, sections, chainages) | CON-OPS-02, CON-OPS-03 | Construction & quality / CEO office | Dated table | P0 |
| S3 | Approved toll instrument for the open section (S.R.O. / notification or RHD approval letter: number, date, PDF), the plaza and extent it applies to, and the exemption list | CON-REG-06, CON-TOLL-02/04/06 | Toll operations / legal | PDF plus data sheet | P0 |
| S4 | Approved O–D fare schedule for future sections, or written instruction to withdraw the provisional matrix | CON-TOLL-01 | Toll operations / finance | Spreadsheet (plaza pair × class) | P0 |
| S5 | Share register extract (shareholders and %), confirmation of sponsor names | CON-GOV-01 | Company secretary / legal | RJSC certified extract | P1 |
| S6 | Financing table: original and revised project cost, equity, CDB and BIFFL loans, VGF, minimum revenue guarantee terms (publishable form) | CON-GOV-02, CON-REG-07 | Finance & accounts | Table with sources | P1 |
| S7 | Company identity: RJSC registration number, registered office, TIN/BIN, general landline, role mailboxes (info, RTI, grievance, privacy, media, procurement, security) | CON-REG-08, CON-CS-01, CON-PRIV-02, CON-SEC-02 | Administration / HR & legal | Settings values | P1 |
| S8 | RTI Responsible Officer and appeal authority (name, designation, address, phone, email), plus counsel opinion on RTI Act applicability | CON-REG-02/03/11 | Administration / legal | Office order plus opinion memo | P1 |
| S9 | GRS focal officer and appeal officer; confirmed response times per request type; plaza complaint-desk arrangements | CON-REG-04/05, CON-CS-03/04 | Customer service & grievances | Office order; citizen-charter table | P1 |
| S10 | Legal sign-off (page by page) for integrity, citizen charter, grievances, toll dispute (refund), RTI, privacy, terms | CON-REG-01, CON-PRIV-01/03 | Legal / CEO | Signed approval log | P1 |
| S11 | Confirmation of patrol coverage, emergency call-point locations, recovery arrangements, speed limits and service-road access rules (with BRTA / highway police concurrence) | CON-SAFE-02/03 | Traffic management & patrol | Written confirmation; call-point coordinates | P1 |
| S12 | Board of directors and senior management list with appointment dates; approval to publish names | CON-GOV-03 | Company secretary | Person records | P1 |
| S13 | Resettlement Plan, entitlement matrix, latest social and environmental monitoring reports, GRC composition and contacts; correction of districts (Narsingdi?) | CON-ESG-01/02/04/08 | Environment, health & safety / RHD PIU | PDFs plus Bangla summary | P1 |
| S14 | IEE/EIA and EMP, current Environmental Clearance Certificate with validity, climate or flood design standard | CON-ESG-03/07 | Environment, health & safety | PDFs | P2 |
| S15 | Structures register (bridges, overpasses, underpasses, culverts, pedestrian overpasses, with chainage) and a single set of key facts (length, cost, jobs) with sources | CON-BRAND-01/03, CON-SEO-H-02 | Construction & quality | Spreadsheet | P2 |
| S16 | Accepted payment methods per plaza; ETC roadmap (issuer, scheme, date) or instruction to withdraw tag, fleet and loyalty application forms | CON-TOLL-03, CON-ITS-01/02 | Toll operations | Decision memo | P1 |
| S17 | SMS/WhatsApp gateway contract status, or instruction to hide alert sign-up | CON-SAFE-07 | IT / customer service | Decision memo | P1 |
| S18 | Latest audited financial statements and annual report; disclosure policy decision; AGM calendar | CON-REG-09, CON-GOV-07 | Finance & accounts | PDFs | P2 |
| S19 | Policies: code of conduct, anti-bribery, whistle-blowing (with anonymous channel), conflict of interest and related-party contracts, OHS, CCTV and data retention | CON-GOV-04/05/06, CON-ESG-06, CON-PRIV-05 | Legal / HR / EHS | Approved PDFs | P2 |
| S20 | Procurement rules statement, open tenders, and contract awards since COD | CON-PROC-01/02 | Procurement | Notices plus award list | P2 |
| S21 | Official social media handles; spokesperson and press contact; crisis communications protocol | CON-COMMS-02/03, CON-SEO-F-02 | CEO office / communications | Handle list; protocol document | P1 |
| S22 | Office address and plaza locations for Google Business Profile claims; GBP owner account | CON-SEO-E-01, CON-CS-06 | Administration | Addresses plus verification access | P2 |
| S23 | Service-area and facility information (fuel, toilets, prayer, first aid) and lost-property collection point and holding period | CON-OPS-06, CON-CS-08 | Traffic management / customer service | Location list | P2 |
| S24 | Quarterly service KPIs (grievances, disputes, refunds, RTI, incidents, response times) and monthly plaza traffic counts | CON-KPI-01, CON-REG-05 | Customer service / toll operations | Monthly data sheet | P3 |
| S25 | Decision on repository visibility and hosting isolation; DMARC ownership | CON-SEC-01/03/04 | IT / vendor | Decision memo | P0 |
| S26 | Decision on AI-crawler policy, default site language, and whether to publish historical construction-era figures | CON-SEO-H-01, CON-SEO-B-02, CON-BRAND-02 | CEO office / communications | Decision memo | P2 |

---

## 7. Prioritised implementation plan — W8C

Ordered by legal and safety risk first. All content changes go through CMS records, blocks, settings or numbered idempotent SQL; nothing is hard-coded. The W8C series is distinct from the UI-audit W8 series and from W7.

### W8C.1 — Safety and misleading-information hotfix (P0, 48 hours)

- **Discharges:** CON-SAFE-01, CON-TOLL-01, CON-OPS-01, CON-OPS-02, CON-SAFE-07, CON-ITS-01 (form), CON-CS-06.
- **Work:**
  1. Set `contact.national_emergency_phone` (999) and the DBEDC control-room number (S1) in production.
  2. Add a boot or deploy check that refuses release when both emergency settings are empty.
  3. Until S1 arrives, change the seven "foot of every page" sentences in en/bn/zh to reference 999.
  4. Restrict `toll-matrix` and `toll-calculator` to pairs whose plazas are on open segments, via a new block field or setting "open plazas only", defaulting on. Render "Not open to traffic" for others.
  5. Add the K35–K47.611 segment record and compute % open against the published length.
  6. Remove or confirm the 16 Sep 2026 date (S2).
  7. Hide `alert-signup` and the ETC, fleet and loyalty application forms (block status) until S16 and S17.
  8. Unpublish the sample office pin.
- **Acceptance criteria:**
  - On production, `tel:999` renders on every one of the 189 URLs (crawl assertion), and the DBEDC number too once supplied.
  - No calculator result for a plaza with status ≠ open.
  - `% open` equals open length ÷ published length to one decimal on `/en`, `/bn`, `/zh`.
  - No live text references an emergency number that is not rendered.
  - The alert, ETC, fleet and frequent-traveller forms return no `<form>` on the live page.

### W8C.2 — Legal gate and statutory pages rebuilt on verified records (P1)

- **Discharges:** CON-REG-01..05, CON-REG-11, CON-TOLL-06, CON-GOV-04, CON-SAFE-02/03.
- **Work:**
  - Add `pages.legal_status` (draft / under review / approved) with approver and date; render a CMS callout "This page is under legal review" while not approved.
  - Move every page drafted by `30-pending-drafts.sql` into "under review".
  - Build the citizen charter as a `data-table` with the Cabinet Division columns.
  - Add `contact-directory` entries for the RTI officer, appeal authority, GRS focal officer and appeal officer from settings (S8, S9).
  - Show `request-form` SLA days from settings.
  - Correct the RTI s.9 text; add a proactive-disclosure `document-list`.
- **Acceptance criteria:**
  - Every statutory page shows an approver and date, or the review callout.
  - The RTI and GRS pages show named officers with phone and email in three languages.
  - Charter time limits equal the `request-form` deadlines (unit test binds both to one setting).
  - Counsel's approval log is stored.

### W8C.3 — Toll provenance and fairness (P1)

- **Discharges:** CON-REG-06, CON-TOLL-02..08.
- **Work:**
  - Populate `sro_number`, `sro_date` and `sro_link` (S3) and render them on `toll-table`, `toll-preview` and `/disclosures/tariff` (`document-list` of notices with effective dates and superseded schedules).
  - Bind the rate "section" to plaza IDs.
  - Render `payment_methods`.
  - Generate the vehicle-class guide from `vehicle_class` records.
  - Add vehicle, plaza and date fields to the toll-dispute form.
- **Acceptance criteria:**
  - No toll figure renders without a citation, or an explicit "citation pending" state (test).
  - Class guide and rate table list identical class names.
  - The dispute form captures plaza, date-time and vehicle number.

### W8C.4 — Privacy, consent and security posture (P1)

- **Discharges:** CON-PRIV-01..06, CON-SEC-01..07, CON-SEO-J-01.
- **Work:**
  - Build a processing inventory (contact, requests, alerts, ETC/fleet, newsletter, CCTV, logs, Cloudflare, Google Routes, Meta/SMS) and rewrite the privacy notice as CMS blocks with an effective date, PDPO 2025 framing (counsel) and a privacy mailbox.
  - Disclose or disable the Cloudflare beacon.
  - Publish a CCTV policy.
  - Add `/.well-known/security.txt` (served from settings).
  - Set `poweredByHeader: false`.
  - Move DMARC to quarantine.
  - Protect `/admin` with Cloudflare Access or an IP allow-list plus MFA.
  - Tokenise the handover route.
  - Decide repository visibility (S25).
- **Acceptance criteria:**
  - Every personal-data field collected by a live form appears in the notice (test maps form field names to inventory).
  - `security.txt` returns 200 with `Contact` and `Expires`.
  - `/admin/login` is not reachable from an unlisted IP.
  - DMARC `p=quarantine`.
  - The repository is private, or `docs/deployment`, `docs/source-data` and `docs/audit` are removed from the public history.

### W8C.5 — Facts register and credibility corrections (P1)

- **Discharges:** CON-GOV-01/02/03, CON-BRAND-01..04, CON-ESG-05, CON-OPS-03/05, CON-REG-07/08/10, CON-SEO-H-02, CON-CS-07.
- **Work:**
  - Create a "Key facts" settings group (length, open length, cost, financing, shareholding, concession term and split, structure counts, opening chronology), each value with a source URL and "as at" date.
  - Replace retyped figures in blocks with bound values.
  - Publish the concession summary page (S6).
  - Remove unsourced impact metrics or cite them as projections.
  - Fix the PPPA link; add an outbound-link check to CI.
  - Repair mojibake with an idempotent SQL; add an encoding assertion to the parity rehearsal.
- **Acceptance criteria:**
  - A grep of live HTML across 189 URLs finds one value per key fact.
  - Every numeric claim on `/about`, `/project`, `/sustainability` and `/media` has a visible source.
  - Zero "â€" or "Â" sequences on live pages.
  - The link checker reports 0 external 4xx.

### W8C.6 — Lender safeguards and ESG disclosure (P1–P2)

- **Discharges:** CON-ESG-01..09, CON-REG-09, CON-GOV-05/06.
- **Work:**
  - `document-list` libraries on `/disclosures/land-acquisition` (RP, entitlement matrix, SMRs) and `/disclosures/environment` (IEE/EMP, ECC, monitoring), with Bangla summaries.
  - GRC contacts; consultation history.
  - "Safeguard standards that apply" block.
  - Policy PDFs; related-party statement; annual report and accounts.
  - Correct the district list.
- **Acceptance criteria:**
  - The ADB SMR and RP are linked or hosted within 1 click of `/disclosures`.
  - Bangla summaries exist for the RP entitlements and the GRC.
  - The district list matches the RP.
  - At least one audited financial statement is published, or a dated disclosure-policy statement.

### W8C.7 — Customer service loop (P1–P2)

- **Discharges:** CON-CS-01..05, CON-CS-08, CON-SAFE-04/05/06, CON-OPS-04/06/07, CON-KPI-01/02.
- **Work:**
  - Publish contact NAP and role mailboxes (S7).
  - Send email acknowledgements with tracking number and due date (SMS when S17 is ready).
  - Add a `request-status` block (tracking number plus contact suffix).
  - "After a crash" and freight dangerous-goods content.
  - Advisories "last checked" stamp.
  - Verify the traffic refresh in production and show source and measured-at.
  - `updated_at` on operational blocks.
  - Quarterly KPI `stat-dashboard`; page-feedback block.
  - Translate news.
- **Acceptance criteria:**
  - A test request produces an acknowledgement email within 1 minute (staging).
  - Status lookup shows status and due date.
  - At least one open section shows a measured condition with a timestamp less than 30 minutes old.
  - The KPI dashboard renders from `service_requests`.
  - bn/zh news has no English body text.

### W8C.8 — SEO foundations: titles, descriptions, social cards, structured data (P2)

- **Discharges:** CON-SEO-A-01..04, B-01..03, C-01..04, D-01..03, F-01, G-01.
- **Work:**
  - `www` → apex and `/` → default-locale redirects (Cloudflare rules or middleware).
  - Locale-less and uppercase normalisation.
  - Branded localised title template from settings (ঢাকা বাইপাস এক্সপ্রেসওয়ে / 达卡绕城高速公路).
  - Fill `route_meta` descriptions for the 9 pages × 3 locales.
  - H1 on privacy, terms and accessibility.
  - `noindex` for pages whose list blocks are empty.
  - OG and Twitter tags on every page with per-locale 1200×630 images and `og:locale` alternates.
  - Enriched `Organization` (address, contactPoint emergency and customer service, sameAs), `WebSite`+`SearchAction`, `BreadcrumbList`, `FAQPage`, `Place` per open plaza.
  - Exclude reserved slugs from the HTML sitemap.
  - Font-loading and critical-CSS work.
- **Acceptance criteria:**
  - All 189 URLs have unique titles containing the localised brand, and descriptions of 70–160 characters.
  - All 189 have `og:title`, `og:description`, `og:image`.
  - Google Rich Results Test passes for Organization, FAQPage and BreadcrumbList on sample pages.
  - `www` and `/` return 308.
  - Emulated slow-4G LCP on `/en` is under 4 s in the same Playwright harness.

### W8C.9 — Digital presence and measurement (P2–P3)

- **Discharges:** CON-SEO-E-01/02, F-02, H-01, I-01/02, J-01/02, K-01/02, CON-COMMS-01..05, CON-BRAND-05, CON-PEER-01.
- **Work:**
  - Verify the Search Console Domain property and Bing; submit sitemaps; request recrawl of stale www URLs.
  - GA4 or a privacy-preserving alternative behind consent, with an event plan (calculator, requests by kind, `tel:` taps, downloads).
  - Claim GBP for the office and open plazas with site NAP.
  - OSM tagging for plazas; Wikidata statements with references.
  - Render verified social handles with `sameAs`.
  - AI-crawler policy decision and `llms.txt`.
  - Monthly brand-SERP and impersonation check.
  - Press-release programme and crisis "official statement" banner block.
  - Video transcripts.
  - `owner_department`, `reviewed_at` and `review_interval` fields with an overdue-review admin list.
- **Acceptance criteria:**
  - Search Console shows the property verified with 0 sitemap errors.
  - GBP listings live with identical NAP to the site.
  - Wikidata item has P856, P137 and P2043 with references.
  - The first DBEDC press release is published in 3 languages.
  - Every disclosure, toll and safety page shows "Reviewed <date>".
  - An `llms.txt` decision is recorded in the plan's decisions table.

---

*Prepared 14 September 2026. External sources were accessed 14 Sep 2026. The press search engine used is US-based, so SERP observations are indicative. Legal provisions quoted from secondary summaries must be confirmed against the official Bangladesh Code (bdlaws.minlaw.gov.bd) by counsel before anything is published as a compliance statement.*
