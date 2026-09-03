# Client decisions — 2026-09-03

Recorded at the point they were made, with what each one costs if it turns out
wrong. Where a decision leaves a known gap open, the gap is named here rather
than left to be rediscovered.

---

## 1. Photograph consent — CLEARED

**Decision:** DBEDC holds releases for the people shown in the CSR photography.

The `/photo/` library contains school donation ceremonies, volunteer events and
site visits with identifiable adults and **children at close range**. Those
images were on the old site, which is not by itself evidence of consent, so the
question was put explicitly and answered explicitly.

Recorded per image in `media.credit` as `DBEDC — consent confirmed 2026-09-03`.

**If wrong:** photographs of identifiable minors published without release, on a
government-linked corporate site. This is the highest-consequence item on the
page. The confirmation is the basis for publication and is attributed here.

**Note:** these images are cleared but are **not** on the home page. A road
operator's front door answers "is it open, what does it cost". The CSR library
belongs on an About or Community page in a later phase.

## 2. Place names — native script for cities, Latin for corridor sites

**Decision:** well-known cities and districts take their standard native form on
the Bangla and Chinese pages (ঢাকা, চট্টগ্রাম, 达卡, 吉大港). Corridor-specific
facility names — Vogra, Mirer Bazar, Purbachal, Naojor, Madanpur, Joydebpur —
stay in Latin.

The reasoning is that the two cases are not alike. "ঢাকা" is the ordinary
Bengali form of a city name, not a transliteration anyone could dispute.
"ভোগড়া" is **our** rendering of a facility name on DBEDC's own road, and
getting a toll operator's own place names subtly wrong is exactly the kind of
error that gets noticed and quoted.

**Still outstanding:** official Bangla spellings for every corridor location,
from DBEDC. Until they arrive, `interchanges.names.bn` in
`scripts/seed-corridor.mjs` holds our transliterations — treat them as
provisional, not as a source of truth.

**If wrong:** cosmetic, and a single edit per name.

## 3. Translation review — SHIP NOW, REVIEW LATER

**Decision:** publish the Bangla and Chinese as written and review afterwards.

**This is the open risk on the page and it is deliberate.** All Bangla and
Chinese content was written by Claude. **Neither has been checked by a native
speaker.** The Chinese in particular follows the register already established in
`lib/i18n/ui.js` (快速路, 互通立交, 通行费) and reads correctly to its author,
but "reads correctly to its author" is the strongest claim available and is not
the same as reviewed.

**If wrong:** a public infrastructure site carrying awkward or incorrect Bangla
is the kind of thing screenshotted and shared. The reputational cost lands on
DBEDC, not on the agency.

**Recommended when capacity allows:** export every translated string with the
English beside it and have a Bangla-speaking staff member and an SRBG colleague
work through the list in one sitting. Roughly 60 strings. This costs nothing but
someone's afternoon and closes the risk properly.

## 4. National highway junctions — PUBLISH AS CORRECTED

**Decision:** publish the corrected geography now; correct further if DBEDC
finds an error.

The first draft of the card grid had **N1 at the north end and N4 at the
south — exactly inverted**, in all three languages. N1 is the Dhaka–Chattogram
highway and meets this corridor at **Madanpur, its southern terminus**. N3 is
Dhaka–Mymensingh and meets it at **Joydebpur, the northern one**. Three of the
four labels were wrong.

The corrected version is defensible from public geography. Confidence is high
for N1 and N3, lower for N2 (Dhaka–Sylhet, via the Bhulta area) and N4
(Tangail/Jamuna, north-west).

**Nothing in the database can settle this:** `interchanges.connects_to` is an
empty string on every row. That is the real gap. When DBEDC confirms the four
junctions, fill `connects_to` at the same time so the data settles it next time
instead of prose.

**If wrong:** a visible factual error about national highway geography on the
front page of a road operator's site, in a country where readers know these
roads. Correctable in the admin in minutes.

## 5. Accessibility and SEO gaps — FIX NOW

**Decision:** close both in this phase rather than deferring to the planned
WCAG/SEO pass.

- **Image alt text** was English on `/bn` and `/zh`, so a Bangla screen-reader
  user heard English descriptions of Bangladeshi road photography.
- **Page titles and meta descriptions** existed only in English, so the browser
  tab and the Google result for `/bn` and `/zh` both read "Dhaka Bypass
  Expressway".

Both are cheap now and awkward to retrofit once more pages exist — every page
built before the fix would repeat the same gap.

---

## Still outstanding from DBEDC

Unchanged by today's decisions, and still blocking:

- Original high-resolution photography. The whole usable library tops out at
  1024 px wide and the hero aerial is 686 px. **This is the single
  highest-value thing DBEDC can supply.**
- The logo as vector (AI/EPS/SVG). Only a 215×204 raster exists.
- The emergency hotline, and a real phone number and address. Until these
  exist the home page cannot honestly close on "report a problem".
- Official Bangla spellings for corridor locations (see 2 above).
- The four national highway junctions (see 4 above).
- Posted speed limits and the breakdown procedure.
- What each service area offers — without it the Facilities page stays empty.
- Who inside DBEDC signs off a change of section status, and how quickly.
- Corridor geometry as KML, and the three alignment PDFs.

## Not a decision, but do not lose it

**Seeding does not invalidate the page cache.** `getPageBlocksCached` wraps
`unstable_cache`, whose entries live in `.next/cache/fetch-cache` and survive a
server restart. Running a seed script and then looking at the dev server shows
**stale content**. Stop the server, delete that directory, restart. Only the
admin's own `revalidatePage()` clears it in production, and a standalone script
cannot call it. This has already cost one implementer a wasted verification
round.
