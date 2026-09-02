# Real corridor data supplied by the Boss — 2026-09-01

This supersedes the illustrative seed in `scripts/seed-corridor.mjs` for the
items it covers. Anything NOT covered here stays illustrative and the
`corridor.illustrative` flag stays on until every figure is confirmed.

---

## 1. Toll rates — OFFICIALLY INTRODUCED for the opened 18 km section

Source: Boss, citing The Business Standard and others. These are the **partial**
rates in force on the opened section, not the full-corridor rates.

| Vehicle class | BDT |
|---|---|
| Large Truck (Trailer, 6-axle, 15–25 tons) | 740 |
| Heavy Truck (2–3 axles, 7+ tons) | 610 |
| Medium Truck (5–7 tons) | 400 |
| Large Bus (31+ seats) | 310 |
| Small Truck (3 tons) | 260 |
| Small Bus / Minibus (under 31 seats) | 210 |
| Microbus | 190 |
| Pickup, Jeep, Wrecker, Crane (3 tons) | 180 |
| Sedan / Private Car | 150 |

**Full commercial operation** is estimated at BDT 200–1,600 depending on class.
That is an ESTIMATE, not a gazetted schedule — do not publish it as a rate table.

### ⚠️ PROHIBITED VEHICLES — corrects a live defect in the seed

**Three-wheelers (CNG, auto-rickshaw) and motorcycles are strictly prohibited
on this expressway.**

The current illustrative seed contains a **motorcycle rate of BDT 40**. That is
wrong and actively harmful: publishing a toll for a banned class implies
motorcycles may use the road. It must be removed, and the prohibition must be
stated on the toll page and the rules page.

## 2. Corridor identity

- Exact length **48 km** (30 miles).
- Runs **Joydebpur (Gazipur) → Madanpur (Narayanganj)**.
- Note: the seed currently names the northern terminus "Kodda". Kodda is in
  Gazipur near Joydebpur; both names appear in sources. Worth confirming which
  the operator wants published.

## 3. Corridor coordinates — partial

From the Boss's patrol-corridor screenshot ("Route Waypoint Patrol Corridor —
K0-48", 7 waypoints, corridor tolerance 300 m). Five of the seven were legible:

| Waypoint | Lat | Lng |
|---|---|---|
| 3 | 23.949671 | 90.414551 |
| 4 | 23.930211 | 90.452655 |
| 5 | 23.834773 | 90.540481 |
| 6 | 23.785562 | 90.568720 |
| E (end) | 23.690198 | 90.547047 |

**Still needed:** waypoints 1 and 2 (and the start marker S) were scrolled out
of the screenshot. The sequence runs north (Gazipur) to south (Madanpur), which
matches the seeded chainage order.

These are patrol-corridor waypoints, not surveyed interchange positions — good
enough to place markers on a real map, not authoritative for chainage. The
geographic map remains gated on proper geometry from the design consultant.

---

## What this changes

1. **Replace the seeded toll table** with the nine real classes above. Remove
   the motorcycle row entirely.
2. **Add prohibited vehicles** to the data model and surface them on the toll
   and rules pages.
3. **Populate `interchanges.lat`/`lng`** for the waypoints we have.
4. `corridor.illustrative` **stays true** — the interchange schedule, section
   statuses and facilities are still reconstructed, and the toll rates are the
   partial-section rates whose mapping to specific interchanges is unconfirmed.

---

# 4. Corridor geometry workbook — 2026-09-02

Source file copied to this workspace as `CORRIDOR-WAYPOINTS.xlsx`.
Boss also has alignment PDFs in Downloads (K4/K22 entrance-exit, K11-K14 toll
plaza, K28+100-K48+079 profile) not yet read.

**Provenance caveat:** the coordinates are Boss/survey supplied; the CHAINAGES
are computed by projecting those coordinates onto a TomTom-routed polyline.
They are model-derived, not surveyed chainage.

## Waypoints — EIGHT, not seven (road-network model)

| WP | Lat | Lng | Chainage |
|----|-----|-----|----------|
| S  | 23.986737 | 90.362246 | K0+000 (physical terminus, near Naojor Flyover) |
| 2  | 23.977568 | 90.380874 | K2+314 |
| 3  | 23.949671 | 90.414551 | K7+554 |
| 4  | 23.930211 | 90.452655 | K12+090 |
| 5  | 23.834773 | 90.540481 | K26+799 |
| 6  | 23.785562 | 90.568720 | K34+973 |
| 7  | 23.731516 | 90.587646 | K41+371 |
| 8  | 23.690500 | 90.546722 | K47+611 (end, Madanpur) |

DO NOT use the straight-line sheet's S (24.004888, 90.325339) — the file states
it was extrapolated along the S->2 bearing purely to force the total to 48.000 km.
It is a synthetic number, not a place.

## LENGTH DISCREPANCY

Road-network measured: **47.611 km**. Nominal/official: **48 km**.
The file: the physical bypass pavement ends ~2.3 km NW of WP2, capping routed
length 389 m short. Both figures are defensible for different purposes.

## Toll plazas — NINE, with real names

WELL-PROJECTED (offset 0.5-17.3 m, trustworthy):
  TP-01 Vogra Toll Plaza RHS      K3+218   offset  10.3 m
  TP-02 Vogra Toll Plaza LHS      K3+706   offset  -0.5 m
  TP-03 Mirer Bazar (A) LHS       K11+365  offset  -5.4 m
  TP-04 Mirer Bazar RHS           K13+184  offset  17.3 m
  TP-05 Mirer Bazar LHS           K13+403  offset  -8.5 m
  TP-06 Purbachal Toll Plaza LHS  K24+522  offset   4.6 m

EXTRAPOLATED +/-200-300 m, file says field GPS needed:
  TP-07 unnamed  K34+353 (est)
  TP-08 unnamed  K36+554 (est)  -- file: "may be a bridge/lay-by rather than a toll gantry"
  TP-09 unnamed  K45+965 (est)  -- candidate Madanpur-side plaza

## Bridges

  LM-01 Nagda Bridge     K14+584  offset   4.9 m
  LM-02 Ulukhola Bridge  K16+795  offset   6.7 m
  LM-03 Kanchan Bridge   K27+403  offset -15.1 m

## HOW WRONG OUR SEED IS

| Seeded | Reality |
|--------|---------|
| Bhogra INTERCHANGE K9+400 | Vogra TOLL PLAZA K3+218/K3+706 |
| Purbachal K21+900 | Purbachal Toll Plaza K24+522 |
| Bhaowal service area K16+200 | not in the real data |
| Kodda K0+000 | S is near Naojor Flyover, not Kodda |
| Bhulta K34+600 | no waypoint there; TP-07 est. K34+353 |
| Madanpur K48+000 | K47+611 |
| 7 interchanges | 8 waypoints + 9 plazas + 3 bridges |

Essentially every seeded chainage and most names are wrong. This needs a
dedicated data-replacement task BEFORE Task 14 writes e2e assertions.

## 5. Open-section end — RESOLVED by Boss 2026-09-02

Boss: "not till purbachal, it is 18 km from the vogra K3+218 to
23.8707560703556, 90.5080711423332"

So the open section is **K3+218 -> K21+218 (18.000 km exactly)**, NOT
Vogra -> Purbachal Toll Plaza as I had assumed.

INDEPENDENT CHECK (controller, haversine):
  - That coordinate interpolated along the WP4->WP5 road segment lands at K21+301
  - Boss's 18 km from Vogra gives K21+218
  - Agreement within 83 m. Straight-line Vogra->point is 16.766 km, correctly
    shorter than the 18 km road distance (ratio 1.074, plausible for a curved road).
  The figure is self-consistent. Use K21+218.

SEGMENTS (corrected):
  0      -> 3218    construction
  3218   -> 21218   open        (18.000 km)
  21218  -> 47611   construction

### OPEN QUESTION raised with Boss
Purbachal Toll Plaza is at K24+522 — 3.3 km BEYOND the end of the open section.
The toll rows carry section = "Kodda – Purbachal", a label the controller invented
before this data arrived. If the road only opens to K21+218 a driver cannot reach
the Purbachal plaza, so that label may misstate what the rates cover.
