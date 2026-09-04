# Legacy content audit — 2026-09-04

Every factual claim on the OLD dhakabypass site, classified. The old site is
still live. Its numbers are the only source for most of what the new site might
inherit, and until now only its *images* had been audited with any rigour.

This file exists so nobody republishes a figure without knowing where it came
from. The companion image audit is `2026-09-03-image-library-audit.md`; the
client's real data is `2026-09-02-client-supplied-corridor-data.md` and
`2026-09-03-client-decisions.md`.

## Method and scope

The old site is reconstructed in `app/(site)/**`. Every string on it is
content-driven: `content/seed.json` (home, header, footer), `content/pages.json`
and the identical per-page copies in `content/pages/*.json`, `content/news.json`,
`content/gallery.json`. I verified `content/pages.json` and `content/pages/*.json`
are byte-identical, so a claim in both is **one** occurrence, not two.

I also read the raw DOM captures in `.extract/` — `extract-*.html`,
`panels-routes.json`, `panels-stakeholders.json`. These are the live old site as
scraped. Diffing them against the content JSON found **three** strings on the
live site that the reconstruction dropped, all on `/stakeholders`: the tab labels
`Chinese Partners`, `Bangladeshi Partners`, `Government Partners` (the
reconstruction renames them `Investors`, `Government Parties`, `Bank
Syndication`). Everything else is captured faithfully. So the content JSON is a
complete inventory of the old site's text.

Nothing else is hardcoded in JSX. The only literal values in
`app/(site)/**/page.jsx` are the CSS widths of progress bars, and those are
audited below because they are read as facts.

**No network access was used.** Every "UNVERIFIED" below means *nothing in this
repository corroborates it*, not that it is false.

### Verdict counts

| Verdict | Count |
|---|---|
| CONFIRMED | 6 |
| STALE | 14 |
| UNVERIFIED | 61 |
| CONTRADICTED | 23 |
| UNSUPPORTABLE | 12 |

The ratio is the finding. Six claims out of ~116 are corroborated by anything
the client has supplied, and four of those six are the toll rates.

---

## 1. CONFIRMED — corroborated by client-supplied data

Six claims. Every one is corroborated by
`2026-09-02-client-supplied-corridor-data.md`; nothing on the old site is
corroborated by `2026-09-03-client-decisions.md` except C6, and that document is
a decisions log rather than a data source.

| # | Claim (verbatim) | Where | Corroboration |
|---|---|---|---|
| C1 | The nine partial-section toll rates: `৳740`, `৳610`, `৳400`, `৳310`, `৳260`, `৳210`, `৳190`, `৳180`, `৳150` | `/routes-facilities`, "Partial Section Toll" column — `page.routes-facilities` `t123`, `t129`, `t135`, `t141`, `t147`, `t153`, `t159`, `t165`, `t171` | Corridor data §1. All nine match the client's officially-introduced table exactly, in the same class order |
| C2 | "Large/Heavy Truck 2-3 axles, GVW (7+ tons)" · "Large Bus (31 seat capacity)" · "Microbus" · "Sedan Car" | `page.routes-facilities` `t124`, `t136`, `t154`, `t166` | Corridor data §1 class definitions. Class *descriptions* match for these four rows — three others differ, see X17 |
| C3 | "48 km" total length | Home `home.overview.stats[0].value`, `home.overview.paragraphs[0]`, `home.route.paragraphs[0]`; `/project/overview` `t18`; `/routes-facilities` `t35` | Corridor data §2: "Exact length **48 km**". Nominal/official figure. The workbook's road-network measurement is 47.611 km and both are defensible — see X1 |
| C4 | "from Joydebpur (Gazipur) to Madanpur (Narayanganj)" | Home `home.overview.paragraphs[0]`, `home.route.paragraphs[0]`; `/project/overview` `t4`; `/project` `t64` | Corridor data §2: "Runs **Joydebpur (Gazipur) → Madanpur (Narayanganj)**" |
| C5 | "18 km" open section length | `/routes-facilities` `t8`, `t30`, `t41`, `t49` | Corridor data §5: open section is 18.000 km exactly. **The length is right; both endpoints are wrong** — see X2, X3 |
| C6 | "Madanpur (Southern Terminus) … connects to National Highway N1 (toward Chattogram port)" | `/routes-facilities` `t92`, `t93` | Client decisions §4: "N1 is the Dhaka–Chattogram highway and meets this corridor at **Madanpur, its southern terminus**". The one national-highway junction the old site places correctly |

Note on C1: the nine partial rates being right is the single most reusable thing
on the old site. It does not extend to the "Full Distance Toll" column beside
them, which is X13 below.

---

## 2. CONTRADICTED — conflicts with client data, or with the old site itself

Twenty-three, split into claims that conflict with the client's data (X1–X9) and
claims that conflict with *another claim on the same site* (X10–X23). The second
group matters as much as the first: a reader who opens two pages sees two
different numbers.

### 2a. Conflicts with client-supplied data

**X1 — "48.07 km" and "48.07-kilometer"**
`/project` `t7`, `t63`. Contradicts corridor data §4, which gives a road-network
measurement of **47.611 km** against a nominal 48 km, and explains the 389 m gap
(the physical bypass pavement ends ~2.3 km NW of WP2). There is no measurement
anywhere that supports 48.07. The two-decimal precision implies a survey; none
exists in the repo. The same site says "48 km" on four other pages.

**X2 — "K3+900" as the start of the open section**
`/routes-facilities` `t12`, `t50`, `t66`. Contradicts corridor data §5, which
fixes the open section at **K3+218 → K21+218**, starting at Vogra Toll Plaza RHS
(K3+218, projection offset 10.3 m — "well-projected, trustworthy"). K3+900 is
682 m downstream of the real start. `/project` `t57` gives a *third* value, "K4".

**X3 — "K22+00" as the end of the open section, and "to Kanchan"**
`/routes-facilities` `t15`, `t50`, `t82`, `t49`. Two separate errors in one
sentence.

- Chainage: the client's resolved figure is **K21+218**, independently
  cross-checked by haversine to within 83 m. K22+00 is ~780 m beyond it. It is
  also malformed — chainage is written K21+218, not K22+00.
- Endpoint name: **Kanchan Bridge is at K27+403**, 6.2 km beyond the end of the
  open section. A driver on the open section cannot reach Kanchan. This is the
  origin of the "open section named the wrong endpoint" defect found on the new
  site.

**X4 — "Kanchan/Purbachal … K22+00 marker"**
`/routes-facilities` `t74`, `t82`. Treats Kanchan and Purbachal as one place at
one chainage. The client's data has them 2.9 km apart and *both* beyond the open
section: Purbachal Toll Plaza at **K24+522**, Kanchan Bridge at **K27+403**.
Corridor data §5 flags exactly this: "Purbachal Toll Plaza is at K24+522 — 3.3 km
BEYOND the end of the open section … a driver cannot reach the Purbachal plaza."

**X5 — "5 toll plazas strategically positioned" / "Five toll plazas"**
`/routes-facilities` `t47`, `t180`. Contradicts corridor data §4, which lists
**nine** toll plazas with names and chainages — six well-projected (TP-01 Vogra
RHS, TP-02 Vogra LHS, TP-03 Mirer Bazar (A) LHS, TP-04 Mirer Bazar RHS, TP-05
Mirer Bazar LHS, TP-06 Purbachal) and three extrapolated. `/project` `t72` says
**6**. Neither is 9.

**X6 — "Debogram/Bhulta … Mid-route interchange that intersects with the Dhaka-Sylhet Highway (N2)"**
`/routes-facilities` `t83`, `t84`. Corridor data §4: "Bhulta K34+600 | **no
waypoint there**; TP-07 est. K34+353" — and TP-07 is one of the three
*extrapolated* plazas the file says needs field GPS. The old site presents an
interchange with a named highway junction where the client's data has no
confirmed feature at all. Client decisions §4 separately rates N2 as "lower
confidence".

**X7 — "Joydebpur … links to National Highway N4 (Dhaka-Mymensingh/Tangail Highways) and N3 (Dhaka-Mymensingh)", and the route-map labels placing N4 at the northern terminus**
`/routes-facilities` `t57`, `t60`, and the inline SVG: `t20` ("N4") is rendered at
the Joydebpur node (x=150), `t19` ("N3") at the Vogra node (x=350). Client
decisions §4: "**N3** is Dhaka–Mymensingh and meets it at **Joydebpur, the
northern one**." The old site's map gives Joydebpur to N4 and hangs N3 off Vogra,
which is a toll plaza, not a highway junction. `t57` also labels N4 as
"Dhaka-Mymensingh/Tangail", conflating it with N3; `/project` `t7` calls N4
"Dhaka-Tangail/Northwest" — the site contradicts itself on what N4 even is.

**X8 — "Bhogra, Gazipur"**
`/routes-facilities` `t49`. The client's toll-plaza register spells it **Vogra**
(TP-01 Vogra Toll Plaza RHS, TP-02 Vogra Toll Plaza LHS), and client decisions §2
lists "Vogra" among the corridor-site names that stay in Latin as given. The same
page spells it "Vogra" at `t11` and `t65`. One of the two is wrong on the
operator's own site; the client's spelling is Vogra.

**X9 — "It starts near Kodda (Gazipur)"**
`/routes-facilities` `t43`. Corridor data §4: "Kodda K0+000 | **S is near Naojor
Flyover, not Kodda**." §2 adds that both names appear in sources and the operator
should confirm which to publish — but the client's own waypoint file places the
physical terminus at Naojor. The same page's own map labels the start "Joydebpur"
(`t9`), so the site names its northern terminus two different things in two
adjacent components.

### 2b. Conflicts internal to the old site

**X10 — Travel time: "30 minutes" vs "approximately 40 minutes"**
"cutting the journey time from Gazipur to Madanpur from 2 hours to just 30
minutes" — home `home.overview.paragraphs[2]` and
`home.economicImpact.paragraphs[1]`, and `/project/overview` `t6`.
"will reduce travel time between Joydebpur and Madanpur from over 2 hours to
approximately 40 minutes" — `/project` `t9`.
Same journey, same site, two answers 10 minutes apart. Neither is sourced (see
U1). This is the origin of the unsourced "two hours" figure found on the new
site — and `scripts/seed-home-v2.mjs:61` still carries it, softened to "a journey
that takes two hours through the city".

**X11 — "75% Reduction" is arithmetically incompatible with the site's own 40-minute figure**
"75% Reduction / In Travel Time" (home `home.overview.stats[1]`), "75% / Travel
Time Reduction" (home `home.economicImpact.metrics[1]`), "cutting journey time by
up to 75%" (`/routes-facilities` `t33`), "reduces freight transit times by up to
75%" (`/economic-impact` `t19`). 2 h → 30 min is exactly 75%. 2 h → 40 min is
**66.7%**. The `/project` page's own numbers refute the headline metric printed
four times elsewhere.

**X12 — Structure counts: two incompatible inventories**

| Structure | Home + `/project/overview` + `/routes-facilities` | `/project` `t76` |
|---|---|---|
| Bridges | **12** major bridges | **5 river + 3 minor = 8** |
| Flyovers | **7** | **4** |
| Underpasses | **27** | **45** |
| Culverts | not stated | **87** (and `t44`: "62 out of 73 planned box culverts") |
| Toll plazas | **5** | **6** |
| Interchanges | **5** major | not stated |

Sources: home `home.route.paragraphs[1]`; `/project/overview` `t22`, `t24`, `t26`,
`t30`; `/routes-facilities` `t45`, `t46`, `t47`; `/project` `t72`, `t76`, `t44`.
Note `t76` ("87 culverts") and `t44` ("73 planned box culverts") disagree with
each other on the same page. Every structure count on this site is contradicted
by another structure count on this site.

**X13 — The "Full Distance Toll" column cannot be produced by the formula printed beside it**
`/routes-facilities` `t115`–`t171`. The table's three numeric columns are "Full
Distance Toll", "Calculation Formula", "Partial Section Toll". Working the
formulas:

```
(4.31X18+50)X115%  = (77.58 + 50) x 1.15 =  146.7  ->  ৳150
(33.06X18+50)X115% =                        741.8  ->  ৳740
(26.45X18+50)X115% =                        605.0  ->  ৳610
(16.53X18+50)X115% =                        399.7  ->  ৳400
(12.4X18+50)X115%  =                        314.2  ->  ৳310
(9.92X18+50)X115%  =                        262.8  ->  ৳260
(7.44X18+50)X115%  =                        211.5  ->  ৳210
(6.61X18+50)X115%  =                        194.3  ->  ৳190
(5.79X18+50)X115%  =                        177.4  ->  ৳180
```

All nine formulas compute the **partial** rate, because they hardcode `X18` — the
18 km open section. The formula column therefore explains the column to its
right, not the column to its left, while sitting under a heading that implies the
opposite.

The "Full Distance Toll" figures are instead rate/km × 48, with the ৳50 fixed
charge and the 115% multiplier both silently dropped: 4.31 × 48 = 206.9 → ৳200;
33.06 × 48 = 1586.9 → ৳1600; 16.53 × 48 = 793.4 → ৳800. Applying the site's *own*
stated formula shape to 48 km would give (4.31 × 48 + 50) × 1.15 = **৳295**, not
৳200. The rounding is also inconsistent (26.45 × 48 = 1269.6 is shown as ৳1280).

A reader who checks the arithmetic finds the operator's published toll table does
not follow the operator's published toll formula.

**X14 — SRBG's "approximately $240 million in equity investment" is impossible against the site's own capital structure**
`/chinese-contribution` `t30`. The same site states the total investment is
**$412 million** (`t32`, `t13`, `t17`, `/project` `t81`, home
`home.economicImpact.metrics[2]`) and states two loans into the same company: CDB
**৳1,614 crore** (`/stakeholders` `t101`, `t111`; `/chinese-contribution` `t29`)
and BIFFL **৳1,075 crore** (`/stakeholders` `t120`, `t127`). That is ৳2,689 crore
of debt. Using the site's own conversion (৳1,614 crore ≈ $190 M, i.e. ~84.9
BDT/USD), the debt is ≈ **$316 M**, leaving ≈ **$96 M** of equity in a $412 M
package. SRBG's 60% of that would be ≈ **$58 M**. The published $240 M is roughly
four times what the site's other numbers allow.

**X15 — The taka and dollar investment ranges are not the same range**
Home `home.economicImpact.paragraphs[2]`: "a total investment of around
৳3,585-3,723 crore (approximately US$350-412 million)". Pairing the ends:
৳3,585 crore ↔ $350 M implies **102.4 BDT/USD**; ৳3,723 crore ↔ $412 M implies
**90.4 BDT/USD**. A single bracket cannot use two exchange rates. And the site
elsewhere implies a third (~84.9, from X14). Whatever these figures are, they are
not a conversion of one another.

**X16 — "$412M" is both the top of a range and a single settled figure**
The home paragraph says the total is "approximately US$350-412 million"; the
metric card two elements below says "**US$412M** / Total Investment"
(`home.economicImpact.metrics[2]`). `/project` `t81` says "**$412 Million** /
Total initial project investment". `/chinese-contribution` `t13`/`t17` print
"$412M" three more times. The upper bound of an uncertain range is promoted to a
fact everywhere except the one sentence that admits it is a range.

**X17 — Toll class descriptions disagree with the client's class definitions**
Three of the nine rows: "Large Truck with at least 3 axles (trailer) 15-25 tons"
(`t118`) vs the client's "Large Truck (Trailer, **6-axle**, 15–25 tons)"; "Medium
Truck with at least 2 axles (**5>7 tons**)" (`t130`) vs "Medium Truck (5–7 tons)"
— `5>7` is a mangled en-dash and reads as "greater than 7"; "Minibus, Coaster"
(`t148`) vs "Small Bus / Minibus (**under 31 seats**)", which drops the seat
threshold that distinguishes it from the ৳310 class. The rates are right; the
definitions a driver uses to pick their rate are not.

**X18 — The vehicle selector offers classes that do not exist in the rate table, including a prohibited one**
`/routes-facilities` `t104`–`t112`: Car, Minibus, Bus, Light Truck, Medium Truck,
Heavy Truck, Multi-Axle Truck, **Container**, **Motorcycle**. The rate table below
uses nine *different* class names. "Container" appears in no rate table on the
site and in no client document. **"Motorcycle" is a prohibited class** — corridor
data §1 is explicit: "Three-wheelers (CNG, auto-rickshaw) and motorcycles are
strictly prohibited on this expressway", and calls publishing a motorcycle rate
"wrong and actively harmful".

The DOM capture in `.extract/panels-routes.json` shows the selector is inert: the
`perVehicle` panel HTML is byte-identical for all nine vehicles. Selecting
"Motorcycle" changes nothing on screen, so a motorcyclist gets no rate and no
prohibition notice — just a motorcycle button on an expressway that bans
motorcycles.

**X19 — Semi-rigid pavement lifespan: "up to 30%" vs "30+ years vs 15-20 years"**
`/chinese-contribution` `t71`: "Extends road life by up to 30% compared to
conventional methods". `/project` `t104`: "30+ years of service life compared to
15-20 years for conventional pavements" — that is a **50–100%** extension. The
same technology, described by the same consortium, on two pages.

**X20 — "2 / New Technologies Introduced" vs the page's own list of three**
`/chinese-contribution` `t101`, `t102` count two. `t96` on the same page lists
"semi-rigid pavement construction, reinforced retaining walls, and modern traffic
management systems" — three. `t39` adds "advanced traffic management systems and
safety features" as a fourth strand.

**X21 — Jobs: "1,000+" and "2,000+" both presented as the current figure**
Home `home.economicImpact.metrics[0]`: "**1,000+** / Local Jobs Created", and the
paragraph above it (`paragraphs[2]`) says 1,000+ so far "expected to double to
approximately 2,000 at peak construction" — future tense. `/economic-impact`
`t37` says "During peak construction, the project **employs over 2,000** workers"
— present tense — and `t38` prints "**2,000+** / Direct Jobs Created".
`/chinese-contribution` `t23`–`t25` prints "**1000**+ Jobs Created".
`/stakeholders` `t29` says SRBG "Employs over 1,000 local workers". A reader
moving between two pages sees the headcount double with no explanation.

**X22 — Construction progress: 69.11% vs 68%**
`/project` `t12` and the bar at `app/(site)/project/page.jsx:92` render
**69.11%**; `/routes-facilities` `t52` and the bar at
`app/(site)/routes-facilities/page.jsx:306` render **68%**. Both are undated on
`/routes-facilities`; `/project` `t33` dates its figure to **December 31, 2024**.

**X23 — Design speed: "80 km/h" vs "80-100 km/h"**
`/project` `t67`: main carriageway "design speed 80 km/h". `/project/overview`
`t32`: "Design Speed / 80-100 km/h". Also `/project` `t66` calls the service roads
"2 Lanes" where `/routes-facilities` `t39` calls them "2×2 Lanes".

---

## 3. STALE — was true, is not now

The old site is written in the future tense for a road that opened in 2025 and is
tolling now. Today is **2026-09-04**. Every dated commitment below is in the past.

### 3a. Dates in the past, presented as the future — visible to any reader

**S1 — "Upon completion in July 2025, this state-of-the-art expressway *will* transform travel around Dhaka…"**
Home `home.overview.paragraphs[2]`; `/project/overview` `t6`. Fourteen months
past. Corridor data confirms 18 km is open and tolling, and the rest is not.

**S2 — "Target completion: July 2025"**
`/routes-facilities` `t53`, printed under a live progress bar.

**S3 — "The section from K22 to K35, including service roads, *is targeted to open by December 2025*."**
`/project` `t60`, filed under a timeline heading that reads "2025 / Second Section
Opening". Nine months past. Nothing in the repo says it opened; corridor data §5
puts everything from K21+218 to K47+611 in "construction".

**S4 — "Dhaka Bypass Expressway *to Open Partly on 1 May*"**
`/latest-updates` `t12` and `content/news.json` id 2, dated 8 April 2025 and still
the second item on the news page. A headline promising an opening sixteen months
ago.

**S5 — "The 48-kilometre Dhaka bypass expressway *is set to open partly on 1 May*…"**
`/latest-updates` `t13`; `news.json` id 2 `excerpt`.

**S6 — "Dhaka Bypass Expressway *to be Operational by July*"**
`/latest-updates` `t24`; `news.json` id 4. "*is scheduled to be* fully operational
by July, promising to revolutionize transportation" — no year given, so a reader
in 2026 reads it as *next* July.

**S7 — "Last updated: December 31, 2024"**
`/project` `t33`. The progress breakdown it stamps (69.11% overall, 93.9% General,
82.89% Earthwork, 53.95% Pavement, 100% Foundation, 90.9% Structure, 54.21%
Incidental) is twenty months old and presented as "Current Status" (`t10`).

**S8 — "© 2025 Dhaka Bypass Expressway Development Company."**
`site.footer.copyright` in `content/seed.json`. On every page.

**S9 — News ordering presents a superseded plan after the event that superseded it**
`news.json`/`/latest-updates` run newest-first: 15 Apr 2025 (Eid travel on the
opened section), **8 Apr 2025 ("to Open Partly on 1 May")**, 5 Apr 2025 ("18km …
Opened to Traffic"). The reader is told the road opened, then told it will open.

### 3b. Future tense about things that have already happened

**S10 — "*will* reduce travel time between Joydebpur and Madanpur"** — `/project`
`t9` ("When completed, the expressway *will*…"). 18 km is open.

**S11 — "*Upon completion*, the expressway *will* cut journey time from Gazipur to Madanpur from 2 hours to just 30 minutes"** — home
`home.economicImpact.paragraphs[1]`.

**S12 — "This improved connectivity *is projected to* increase exports by 0.8% of GDP"** — `/economic-impact` `t20`. Projected from an unstated baseline year.

**S13 — "This knowledge transfer *will have* lasting benefits" / "This innovation *will have* lasting impact"** — `/chinese-contribution` `t68`, `t78`.
Also `t8` "*is creating* practical benefits", `t7` "*is helping to* transform" —
the whole page is written mid-construction.

**S14 — "First Section Opening … *put into trial operation* during the Eid-ul-Fitr period from March 27 to April 5"**
`/project` `t56`, `t57`; echoed at `/routes-facilities` `t48`–`t50` ("*opened on a
trial basis* in late March 2025", "offered *toll-free travel* during the Eid
period"). The section is no longer on trial and is no longer toll-free: corridor
data §1 records nine **officially introduced** rates in force on it. Describing
the open section as a toll-free trial is now actively misleading about what a
driver will pay.

---

## 4. UNSUPPORTABLE — should not be published at any confidence

Twelve. These are not merely "unsourced"; they are claims no source could
properly settle, or that should not appear on an operator's site at all.

**N1 — "Bangladesh's first fully access-controlled expressway"**
`/project` `t2`; `/stakeholders` `t2`; home `home.hero.subheadline` ("the first
fully access-controlled expressway"), `home.overview.imageCaption` ("Bangladesh's
First / Fully Access-Controlled Expressway"), `home.meta.title`.

**N2 — "Bangladesh's first fully enclosed highway"**
Home `home.overview.paragraphs[0]`; `/project/overview` `t4`;
`/routes-facilities` `t43`; `/stakeholders` `t101` ("Bangladesh's first fully
enclosed expressway").

**N3 — "Bangladesh's first enclosed expressway"**
`site.footer.brand.description` in `content/seed.json`.

N1–N3 are three different superlatives for the same idea, and "access-controlled"
and "enclosed" are not the same property. Bangladesh has other tolled,
access-controlled expressway infrastructure, so the claim invites public
correction — and it is on the `<title>` tag, so it is what Google prints. There is
no definition of "fully enclosed" on the site against which the claim could even
be tested.

**N4 — "1st PPP / Road Project in Bangladesh" · "First Road PPP / in Bangladesh" · "As this is the first-ever road project in Bangladesh executed via PPP"**
Home `home.overview.stats[2]`; `/stakeholders` `t8`, `t9`, `t77`;
`/chinese-contribution` `t10` ("The first major road PPP project in Bangladesh
with Chinese investment"). Note `t10` quietly narrows the claim with two
qualifiers ("major", "with Chinese investment"), which suggests whoever wrote it
knew the unqualified version was shaky.

**N5 — "The Dhaka Bypass Expressway is a flagship project under China's Belt and Road Initiative in Bangladesh"**
`/chinese-contribution` `t52`, `t80`, `t81`, `t82`; `/stakeholders` `t30` ("Belt
and Road Initiative flagship project"). "Flagship" is a political designation, not
a fact about a road. Whether Bangladesh's government characterises this project as
BRI is a diplomatic question the operator's marketing site should not be answering
unilaterally. Note the image audit already rejected both illustrations for this
page — `/cbri.webp` (a third-party BRI route map) and `/friends.webp` (stock flag
artwork) — so the claim currently rests on two images that cannot be republished.

**N6 — "Featured as a practical cooperation project at the Third Belt and Road Forum"**
`/chinese-contribution` `t54`, restated at `t83`. A specific attributed honour at a
named diplomatic event. Either DBEDC has the citation or the claim goes.

**N7 — The anonymous testimonial**
`/chinese-contribution` `t78`–`t79`: "*The semi-rigid pavement technology
introduced by SRBG is perfectly suited to Bangladesh's climate, geological
conditions, and available materials. This innovation will have lasting impact on
our infrastructure development.*" — attributed to "**— Bangladeshi Highway
Engineering Expert**". An unnamed endorsement of the majority shareholder's
technology, presented in quotation marks as third-party validation. It cannot be
verified by anyone, including DBEDC. It reads as fabricated whether or not it is.

**N8 — Published personal email addresses of named executives**
`/stakeholders` `t139` `srbgheadoffice@sina.com`, `t144` `423841503@qq.com`,
`t149` `s_akand@yahoo.com`. A personal QQ number and a Yahoo address published as
the contact route for chairman-level officers. This is a phishing and
data-protection problem before it is an accuracy problem, and consumer webmail
addresses on a government-linked PPP site read as unserious.

**N9 — "+880 12345-6789"**
`site.footer.contact.phoneDisplay` and `phoneHref` in `content/seed.json`;
`/contact` `t16`. A placeholder is published as the operator's phone number on
every page of a live road-operator website. Client decisions §"Still outstanding"
confirms "a real phone number and address" has not been supplied — so this number
was never real. A driver who breaks down on the road cannot reach anyone.

**N10 — "Emergency call points every 2 km" · "Round-the-clock emergency response services" · "Ambulance services" · "Towing and recovery"**
`/routes-facilities` `t184`–`t188`. Safety-critical service promises on an
operational expressway. Client decisions lists "the emergency hotline" and "the
breakdown procedure" as *still outstanding from DBEDC* — the operator has not told
us these services exist. Publishing a specific 2 km spacing for emergency call
points to a driver who may need one is the worst place on the site to guess.

**N11 — "Take a Tour" → `/virtual-tour`**
`home.callout.primaryCta` in `content/seed.json`. There is no `/virtual-tour` route
in `app/(site)/` — the button 404s. Two other CTAs do the same:
`home.overview.inlineLink` → `/about-project` and `home.route.cta` →
`/expressway-route`. The site promises a virtual tour it does not have.

**N12 — The machine-translation link presented as the Chinese version**
`site.header.translateHref` in `content/seed.json` points at
`https://demodasher-com.translate.goog/?_x_tr_sl=en&_x_tr_tl=zh-CN…`. Two
problems: the site's Chinese-language offering on a China–Bangladesh PPP is an
unreviewed Google Translate proxy, and the URL leaks the build agency's demo
domain (`demodasher.com`) into DBEDC's header on every page.

---

## 5. UNVERIFIED — plausible, corroborated by nothing in this repo

Sixty-one. These are not accusations. Each needs one answer from DBEDC, and §7
turns them into questions. Grouped by what would settle them.

### 5a. Corridor and engineering

| # | Claim (verbatim) | Where |
|---|---|---|
| U1 | "from 2 hours to just 30 minutes" — the **2 hour** baseline itself | home `home.overview.paragraphs[2]`, `home.economicImpact.paragraphs[1]`; `/project/overview` `t6`; `/project` `t9` ("over 2 hours") |
| U2 | "four main carriageways" | home `home.overview.paragraphs[2]`; `/project/overview` `t6`. Technically wrong as written — a 4-lane dual road has **two** carriageways, not four |
| U3 | "fully grade-separated interchanges" | home `home.overview.paragraphs[2]`; `/project/overview` `t6` |
| U4 | "9.7m width (7.3m + 2.4m shoulder)" | `/project` `t67` |
| U5 | "5.8m width (7.3m every 5 km in the RAJUK Section)" | `/project` `t70` |
| U6 | "Major Structures / 100+" | `/project` `t75` |
| U7 | "62 out of 73 planned box culverts have been completed" | `/project` `t44` |
| U8 | "Over 31.76 km of embankment fill for the toll road and 40.44 km for service roads completed" | `/project` `t40` |
| U9 | "Approximately 22 km of asphalt layers (AC-20 & AC-13) … and 28 km for service roads" | `/project` `t42` |
| U10 | "Structural work is at 90.9% completion, including **Ulukhula, Nagda, Mir er Bazar, and Dhirasram** Overpasses" | `/project` `t38`. The client's register has "**Ulukhola** Bridge" (K16+795) and "**Nagda** Bridge" (K14+584) as *bridges*, "**Mirer** Bazar" as a toll plaza, and **no Dhirasram feature at all** — three of four names are spelled or classified differently and the fourth is unattested |
| U11 | The six progress percentages: 93.9 General, 82.89 Earthwork, 53.95 Pavement, 100 Foundation, 90.9 Structure, 54.21 Incidental | `/project` `t16`–`t32` |
| U12 | "All foundation work has been completed (100%)" | `/project` `t36` |
| U13 | "Two service areas (one in each direction)" with "Restrooms and washrooms", "Food outlets", "Prayer rooms" | `/routes-facilities` `t174`–`t178`. Client decisions lists "What each service area offers" as outstanding; corridor data §4 records "Bhaowal service area K16+200 \| **not in the real data**" |
| U14 | "Multiple toll lanes", "Electronic toll collection capability", "Clear rate display" | `/routes-facilities` `t181`–`t183` |
| U15 | "benefiting over **2 million** travelers" during the Eid opening | `/routes-facilities` `t50` |
| U16 | "aligns with the Asian Highway network" | home `home.economicImpact.paragraphs[3]` |
| U17 | "Joydebpur … Access to industrial zones" | `/routes-facilities` `t64` |
| U18 | "Debogram/Bhulta … Service area" | `/routes-facilities` `t89` |

### 5b. Money and contract

| # | Claim (verbatim) | Where |
|---|---|---|
| U19 | "৳3,585-3,723 crore" total investment | home `home.economicImpact.paragraphs[2]` |
| U20 | "US$350-412 million" | home `home.economicImpact.paragraphs[2]` |
| U21 | "$412 Million / Total initial project investment" | `/project` `t81`; home `home.economicImpact.metrics[2]`; `/chinese-contribution` `t13`, `t17`, `t32` |
| U22 | "25-year concession agreement" / "25 Years" / "25-Year Concession" | home `home.overview.paragraphs[1]`, `home.overview.stats[3]`; `/project` `t78`; `/project/overview` `t5`; `/stakeholders` `t12`, `t92` |
| U23 | "DBFOM" vs "DBFOMT" | home `home.overview.paragraphs[1]` and `/project/overview` `t5` say **DBFOM**; `/project` `t8`, `t79` say **DBFOMT** (with Transfer); `/stakeholders` `t13` says "Design, Build, Maintain, Finance" (no Operate, no Transfer). Three different contract structures for one contract |
| U24 | "China Development Bank provided a crucial **৳1,614 crore** loan (approximately **$190 million**)" | `/chinese-contribution` `t29`; `/stakeholders` `t101`, `t111` |
| U25 | "BIFFL … re-lend **৳1,075 crore** to DBEDC" | `/stakeholders` `t120`, `t127` |
| U26 | "BIFFL received a **$50 million** credit line" under a 2020 ADB agreement | `/stakeholders` `t126`. $50 M ≈ ৳425 crore at the site's own rate, yet BIFFL is said to re-lend ৳1,075 crore — 2.5× the facility. Possible if BIFFL added its own funds, but as written it reads as a contradiction |
| U27 | "In April 2022, BIFFL disbursed the first installment (**৳42.5 crore**)" | `/stakeholders` `t122`, `t127` |
| U28 | "viability gap funding (initially **৳224 crore** grant, later revised to **৳674 crore**)" | `/stakeholders` `t92`. The bullet at `t89` gives only "initially ৳224 crore" — ৳450 crore less than the prose beside it, with no indication which is current |
| U29 | "minimum revenue guarantees" | `/stakeholders` `t93` |
| U30 | "The financing agreement with CDB was signed in **April 2021**" / "Facilitated financial close in April 2021" | `/stakeholders` `t102`, `t113`; `/chinese-contribution` `t33` |
| U31 | "PPP contract was signed in **December 2018**" | `/project` `t48`; `/stakeholders` `t76`, `t91`; `news.json` id 5 dated 2018-12-06 |
| U32 | "The PPPA **approved the project in principle in 2012**" | `/stakeholders` `t71`, `t75` |
| U33 | "Initial construction works commenced in **November 2020**" | `/project` `t51` |
| U34 | "**May 15, 2022** was established as the official Appointed Date" | `/project` `t51`, `t54` |
| U35 | "upgrade the **48 km Joydebpur–Debogram–Bhulta–Madanpur road** into a four-lane expressway" | `/stakeholders` `t91`. The only place the contract's route description appears; "Debogram" appears in no client document |

### 5c. Chinese involvement — SRBG, CDB, equity

Flagged separately because the brief is right that these carry political and
commercial weight. **Nothing in `docs/source-data/` mentions equity, SRBG's stake,
or any investment figure.** I grepped all three client documents for "60",
"equity", "stake", "SRBG", "Sichuan", "412" and "crore": the only hits are an
unrelated "60 strings", the toll figure "260", the coordinate fragment
"…5080711423332", and the image audit's note about a *Sichuan Road & Bridge banner
in a CSR photograph*. There is no client source for any of this.

| # | Claim (verbatim) | Where |
|---|---|---|
| **U36** | **"a 60% stake in the project company" / "60% / Equity Stake" / "60 % / SRBG Equity Stake" / "SRBG holds a 60% majority stake" / "Lead private investor with 60% equity stake" / "With a 60% equity stake in DBEDC"** | `/chinese-contribution` `t7`, `t11`–`t12`, `t20`–`t22`, `t29`, `t30`; `/stakeholders` `t18`, `t24` |
| U37 | "Shamim Enterprise Ltd (SEL) … **30% equity stake**" | `/stakeholders` `t35`, `t41` |
| U38 | "UDC Construction Ltd … **10% equity stake**" | `/stakeholders` `t51`, `t57` |
| U39 | "Both local partners combined hold **40%** of DBEDC's equity" | `/stakeholders` `t58` |
| U40 | "Lead private investor with approximately **$240 million** in equity investment" | `/chinese-contribution` `t30` — see X14; refuted by the site's own arithmetic |
| U41 | "**UDC Construction Ltd (Unique Dream Consultants)**" | `/stakeholders` `t57`. An acronym expansion that appears nowhere else, including on the linked `udccl.com.bd` |
| U42 | "Member of **Shudao Investment Group Co., Ltd. (SDIG)**" | `/stakeholders` `t28` |
| U43 | "SRBG … Employs over 1,000 local workers" | `/stakeholders` `t29` |
| U44 | "the **first application of Chinese standards and techniques** on a Bangladeshi expressway" | `/stakeholders` `t26` |
| U45 | "one of the **first instances of Chinese bank infrastructure financing in a Bangladesh PPP**" | `/stakeholders` `t103` |
| U46 | "Implemented semi-rigid pavement technology **for the first time in Bangladesh**" | `/chinese-contribution` `t36`, `t8`, `t67`; `/stakeholders` `t25` |
| U47 | "Introduced innovative reinforced retaining wall systems" (first-in-Bangladesh, per `t8`) | `/chinese-contribution` `t37`, `t8` |
| U48 | "**50+** Engineers Trained" | `/chinese-contribution` `t98`–`t100`. Sits awkwardly beside `/economic-impact` `t46`'s "**500+** Workers Trained in New Technologies" — possibly different populations, but the site never says so |
| U49 | "Complete technical documentation and manuals have been provided in both English and Bengali" | `/chinese-contribution` `t104` |
| U50 | "Donated multimedia classrooms to primary schools" · "Provided support to local orphanages" · "Contributed COVID-19 prevention supplies" | `/chinese-contribution` `t59`–`t63`, `t107`–`t118` |
| U51 | "Improved educational resources for **hundreds of students**" | `/chinese-contribution` `t110` |
| U52 | Named officers: **Liu Xiaobo** (Chairman), **Xiao Zhiming** (CEO), **Md. Shafiqul Islam Akand** (COO), **Syed Aslam Ali** (Project Director, RHD), **Shamim Ahmed** (SEL representative) | `/stakeholders` `t135`, `t140`, `t145`, `t96`, `t157`, `t45`. Named individuals with titles and roles, unverified and probably years old. "Liu Xiaobo" in particular is a romanisation that collides with an internationally famous name and should be confirmed character-by-character before republication |
| U53 | "Md. Shafiqul Islam Akand … **The highest-ranking Bangladeshi official in DBEDC**" | `/stakeholders` `t147` |
| U54 | "The Board comprises representatives from all equity partners … with **proportional representation based on shareholding**" | `/stakeholders` `t153` |

The live old site groups these under a tab literally labelled "**Chinese
Partners**" (`.extract/panels-stakeholders.json`; the reconstruction renames it
"Investors"). Whatever is republished about SRBG's role will be read as DBEDC's
official position on the Chinese share of a government PPP.

**Where the 60% came from:** the old site, and only the old site. It appears eight
times across two pages, all sourced from the same DOM scrape in `.extract/`. Eight
appearances is one source. There is no document, no contract extract, no client
email behind it in this repository. Removing it from the new site was correct; it
must not go back without a written figure from DBEDC.

### 5d. Economic impact

Every number in this group is a modelling output with no model attached. The
`/economic-impact` page is the weakest on the site.

| # | Claim (verbatim) | Where |
|---|---|---|
| U55 | "increase exports by **0.8% of GDP**" | `/economic-impact` `t20` |
| U56 | "Reduced transport costs (estimated **15-20% reduction**)" | `/economic-impact` `t22` |
| U57 | "Freight Transport Efficiency **+65%**" · "Regional Business Growth **+42%**" · "Industrial Land Value Increase **+85%**" · "New Business Establishments **+120**" | `/economic-impact` `t26`–`t33`, with bar widths hardcoded at `app/(site)/economic-impact/page.jsx:171,184,197,210` |
| U58 | "an estimated **10,000 indirect jobs**" / "**10,000+** Indirect Jobs Supported" | `/economic-impact` `t41`–`t43` |
| U59 | "**500+** Workers Trained in New Technologies" | `/economic-impact` `t46`–`t47` |
| U60 | "Purbachal Economic Zone - **46%** land value increase" · "Gazipur Industrial Corridor - **38%** business growth" · "Narayanganj Logistics Hub - **52%** capacity expansion" | `/economic-impact` `t53`–`t55`. `t53`'s 46% and `t31`'s 85% are both land-value increases and disagree |
| U61 | "save **millions of dollars** in lost time and fuel" | home `home.economicImpact.paragraphs[0]` |

**The four headline counters on `/economic-impact` render as literal zeros.**
`t5`–`t17` store "0", and the DOM capture in
`.extract/extract-economic-impact.html` confirms the live site serves "**0** % GDP
Growth Impact", "**0** % Travel Time Reduction", "**0** + Jobs Created", "$ **0** M
Total Investment". A scroll-triggered counter that never fires leaves an
operator's economic-impact page claiming zero of everything. The reconstruction
inherits the zeros verbatim. It is a defect, not a claim — but it is the first
thing a reader sees on that page, and the numbers it was meant to animate to (75,
1000, 412) are U21/U57 above, none of them sourced.

### 5e. News items

`content/news.json` carries six items with real outlet names (New Age Bangladesh,
The Business Standard ×2, Dhaka Tribune, ADB, PPP Authority) and real URLs. **All
six have an empty `body`.** The `excerpt` fields are paraphrases written for this
site, not quotations from the articles, but they are printed directly under the
outlet's name with a "Read More" link, so a reader attributes the wording to the
outlet. I cannot check any excerpt against its source without network access, so
all six are UNVERIFIED as summaries of what those outlets actually published.

One dating defect: `news.json` id 6 carries `published_at: "2025-01-01"`, but
`/latest-updates` `t35` renders its date as "**Ongoing**". The stored date and the
displayed date disagree, and 1 January is the shape of a placeholder.

---

## 6. Do not republish

One line each on why. Ordered by how much damage the claim does if it carries
over.

1. **"+880 12345-6789"** — a placeholder phone number published as the road
   operator's only phone number, on a road that is open and carrying traffic.
2. **Motorcycle as a selectable vehicle class** — motorcycles are prohibited on
   this expressway; offering the button implies they are allowed.
3. **"Emergency call points every 2 km", ambulance, towing, 24/7 response** —
   safety-critical services the client has not confirmed exist; a driver may rely
   on them.
4. **"toll-free travel during the Eid period" and "trial operation"** — the
   section is tolling now at nine gazetted rates; this tells drivers they will pay
   nothing.
5. **The "Full Distance Toll" column (৳200–৳1,600)** — the client states these are
   an *estimate* for full commercial operation and says explicitly: "do not
   publish it as a rate table".
6. **"SRBG … 60% stake"** (all eight occurrences) — no source exists outside the
   old site; equity in a China–Bangladesh government PPP is not something to
   publish from a scrape.
7. **"approximately $240 million in equity investment"** — refuted by the site's
   own $412 M total and ৳2,689 crore of stated debt; off by roughly 4×.
8. **"open section … K3+900 to K22+00, from Bhogra to Kanchan"** — wrong at both
   ends and wrong in the destination; Kanchan is 6.2 km past where the road stops.
9. **"Target completion: July 2025" / "Upon completion in July 2025" / "targeted
   to open by December 2025"** — all three dates are in the past and the
   commitments were not met.
10. **"Last updated: December 31, 2024" progress figures** — twenty months old,
    presented as "Current Status", and contradicted by the 68% on another page.
11. **The anonymous testimonial** ("— Bangladeshi Highway Engineering Expert") —
    unattributable praise of the majority shareholder's own technology.
12. **`srbgheadoffice@sina.com`, `423841503@qq.com`, `s_akand@yahoo.com`** —
    personal consumer webmail addresses of named executives.
13. **"Bangladesh's first fully access-controlled / fully enclosed expressway"** —
    an unprovable superlative on the `<title>` tag, in three mutually inconsistent
    wordings.
14. **"Flagship project of the Belt and Road Initiative"** — a diplomatic
    designation the operator should not assert unilaterally, and both its
    illustrations are already rejected by the image audit.
15. **"Featured … at the Third Belt and Road Forum"** — a specific attributed
    honour with no citation.
16. **"$412M" as a settled single figure** — it is the top of the site's own stated
    range, promoted to fact in six places.
17. **"12 bridges, 7 flyovers, 27 underpasses"** *and* **"5 river bridges, 3 minor
    bridges, 4 flyovers, 45 underpasses"** — the site cannot be right twice;
    publish neither until DBEDC picks one.
18. **"75% reduction" and "2 hours to 30 minutes"** — unsourced, and refuted by the
    same site's "over 2 hours to approximately 40 minutes".
19. **Every `/economic-impact` percentage** (0.8% of GDP, +65%, +42%, +85%, +120,
    46/38/52%, 15–20%, 10,000 indirect jobs) — a modelling page with no model,
    headed by four counters that read zero.
20. **"Take a Tour" → `/virtual-tour`** — promises a virtual tour that does not
    exist; same for `/about-project` and `/expressway-route`.
21. **The `demodasher-com.translate.goog` header link** — leaks the build agency's
    demo domain and passes off machine translation as the Chinese site.
22. **"© 2025"** — trivially stale on every page.

---

## 7. Ask DBEDC

Ordered by how much each answer unblocks. Questions 1–6 each unblock a whole page
or a whole class of claims; the rest close single figures. All phrased for a
non-technical reader.

### The six that unblock the most

1. **What percentage of DBEDC does each of the three private partners own today —
   Sichuan Road & Bridge Group, Shamim Enterprise Ltd, and UDC Construction Ltd?**
   Please give the current figures in writing, and say whether they have changed
   since the contract was signed. *(Unblocks U36–U40 and the entire
   `/chinese-contribution` and `/stakeholders` framing. Highest priority: it is
   the one claim already pulled from the new site.)*

2. **Exactly where does the open section start and end?** Please give the chainage
   of both ends (for example "K3+218") and the name of the nearest landmark at
   each, as a driver would recognise it. *(Unblocks X2, X3, X4 and every route
   diagram on both sites. Our data says K3+218 at Vogra Toll Plaza to K21+218; the
   old site says K3+900 to K22+00 "from Bhogra to Kanchan", and we need to know
   which to print.)*

3. **How many road bridges, flyovers, underpasses, culverts and toll plazas are on
   the corridor as built?** One number for each, please, counting what physically
   exists today rather than what was planned. *(Unblocks X5 and X12 — six figures
   that currently have two different values each across the site.)*

4. **Which national highway does the expressway meet at each end and at each
   intermediate junction?** Please name the highway (N1, N2, N3, N4) and the place
   where each one meets the corridor. *(Unblocks X6, X7 and fills the
   `interchanges.connects_to` column, which is empty on every row — client
   decisions §4 identifies this as the real gap.)*

5. **Is there a published toll rate for travelling the full 48 km, and if so what
   is it?** If the only rates currently in force are the ones for the open
   section, please confirm that, so we can remove the full-distance column
   entirely. *(Unblocks X13 and "do not republish" item 5. The client has already
   told us the ৳200–1,600 range is an estimate, but we need it in DBEDC's own
   words before deleting a table from a live site.)*

6. **What emergency help is actually available to a driver on the open section
   today?** Specifically: is there a phone number to call, are there emergency
   call points beside the road and how far apart, and is there a towing or
   ambulance service? *(Unblocks N10 and, with question 7, lets the home page
   honestly close on "report a problem".)*

### Contact and identity

7. **What is DBEDC's real public phone number and postal address?** Please also
   say whether there is a separate number for road emergencies. *(N9. The site
   currently publishes "+880 12345-6789".)*

8. **Which company email addresses should be published for enquiries?** We would
   rather publish one or two `@dbedc.com` addresses than the personal Sina, QQ and
   Yahoo addresses currently on the Stakeholders page. *(N8.)*

9. **Please confirm the current names and job titles of DBEDC's chairman, chief
   executive and chief operating officer, and of the RHD project director — and
   confirm the spelling of each name in English.** *(U52. The site names Liu
   Xiaobo, Xiao Zhiming, Md. Shafiqul Islam Akand and Syed Aslam Ali; we do not
   know how old that list is.)*

### Timing and status

10. **When is the rest of the road expected to open?** If there is a current target
    date, please give it; if there is no confirmed date, please say so and we will
    remove the dates rather than publish an old one. *(S1, S2, S3. The site
    currently advertises July 2025 and December 2025.)*

11. **What is the current construction progress, as a single percentage, and as of
    what date?** *(S7, X22. The site shows 69.11% dated 31 December 2024 on one
    page and 68% undated on another.)*

12. **Please confirm the key contract dates:** when the PPP contract was signed,
    when the PPP Authority first approved the project, when construction started,
    the official "Appointed Date", and when financial close happened. *(U30–U34.)*

### Money

13. **What is the total cost of the project, in taka, and as of what date?** If a
    dollar figure is also published, please give the exchange rate and date used.
    *(U19–U21, X15, X16. The site's taka and dollar ranges do not convert into one
    another.)*

14. **How much of that total is equity and how much is borrowed?** Please confirm
    the loan amounts from China Development Bank and from BIFFL, and whether they
    have been fully drawn. *(U24–U27, X14.)*

15. **How much viability gap funding has the government actually committed —
    ৳224 crore, ৳674 crore, or another figure?** *(U28.)*

16. **How long is the concession, and does DBEDC transfer the road back to the
    government at the end of it?** Please confirm whether the contract is "DBFOM"
    or "DBFOMT". *(U22, U23 — the site uses three different contract
    descriptions.)*

### Travel time and benefits

17. **How long does the Gazipur-to-Madanpur journey take on the expressway today,
    and how long did it take before?** If DBEDC has measured this, please say who
    measured it and when. *(U1, X10, X11. Everything about "75%" and "2 hours"
    rests on this one answer, and it is the figure that already leaked onto the
    new site.)*

18. **Is there a traffic or economic study behind the figures on the Economic
    Impact page** — the 0.8% of GDP, the 15–20% transport cost reduction, the
    10,000 indirect jobs? If so, may we have it, and may we cite it by name?
    *(U55–U61. If the answer is no, the page should be rebuilt around what can be
    said rather than corrected.)*

19. **How many people work on the project now, and what was the peak?** *(X21 —
    the site says 1,000+ and 2,000+ in different places.)*

### Corridor detail

20. **What is the official length of the expressway to publish — 48 km, or a more
    precise figure?** Our survey-derived measurement is 47.611 km. *(X1, C3.)*

21. **Should the northern end be called Joydebpur, Kodda, or Naojor?** *(X9 — the
    site uses two of the three and our waypoint data suggests a third.)*

22. **Is the place at K3+218 spelled "Vogra" or "Bhogra"?** *(X8 — the site spells
    it both ways on the same page.)*

23. **Are there service areas on the open section, and what does each one offer?**
    *(U13 — the Facilities page cannot be built without this, and our corridor data
    contains no service area at all.)*

24. **What is the posted speed limit on the open section?** *(X23 — the site quotes
    an 80 km/h design speed and an "80–100 km/h" design speed, neither of which is
    a posted limit.)*

25. **Please confirm the names of the major structures**, particularly whether
    "Dhirasram" is a structure on this corridor, and the correct spelling of
    Ulukhola/Ulukhula and Nagda. *(U10.)*

### Claims we would rather drop than verify

26. **Is DBEDC comfortable describing the expressway as "Bangladesh's first fully
    access-controlled expressway" and as a "flagship Belt and Road Initiative
    project"?** Our recommendation is to drop both — the first invites public
    correction and the second is a political characterisation that is not DBEDC's
    to make. We will drop them unless DBEDC asks us to keep them. *(N1–N6.)*
