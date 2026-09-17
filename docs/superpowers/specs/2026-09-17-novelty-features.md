# Novelty features for dhakabypass.com — what a concession company can publish that no other Bangladeshi expressway does

17 September 2026 · branch `chore/2026-09-06-cutover-and-audit` · builds on migration 53.

The owner's ask: "add exceptional things in our site as an concession company and expressway to bring novelty". The test applied to every candidate below: would a driver, a trucker, a fleet manager, a journalist or a regulator notice it and use it; is it genuinely new for a Bangladeshi expressway site; and can it be built honestly with the data the corridor already holds, rendering a dated "not yet published" state where DBEDC has supplied nothing.

## Candidates

| # | Candidate | Who cares and why | Data source | Honesty risk | Verdict |
|---|---|---|---|---|---|
| 1 | Kilometre-post finder ("where am I") | A stranded driver is asked for the km marker by the control room and 999; a passenger on a bus wants to know which exit is next | `corridor_geometry` (166 points, K0–K47+612), `interchanges` (plazas, bridges), `segments` (open or not), settings `contact.emergency_phone` | Low: geometry is surveyed; the emergency number is blank today and renders as not yet published | **Build** |
| 2 | Corridor weather and fog advisory | Gazipur–Narayanganj winter fog and monsoon rain are the two weather hazards on this alignment; no BD road site tells a driver before they set out | Open-Meteo (keyless), sampled at the corridor's north, middle and south waypoints; thresholds in settings | Medium: a model forecast is not a road sensor. Attributed, timestamped, thresholds editable, degrades to "unavailable" | **Build** |
| 3 | Travel-time history (typical speed by hour) | A trucker choosing between 22:00 and 06:00; a journalist asking whether the road is congested; the regulator's KPI | New `traffic_history` written by the existing 30-minute refresh; aggregated by section, day type and hour | Low: measured or nothing. Renders "not enough data yet" until each cell has a minimum sample count | **Build** |
| 4 | Open data: JSON status, CSV downloads, ICS closures calendar | Fleet dispatchers, app makers, researchers, RHD/PPPA. A concessionaire publishing machine-readable data is unheard of in Bangladesh | The cached corridor readers already used by the map; `traffic_monthly`; `traffic_history`; `advisories` | Low: the same figures as the pages, with source and sample flags carried into the payload; the reuse terms are a field left blank until DBEDC decides | **Build** |
| 5 | Concession scorecard (term progress, KPIs target vs actual) | Lenders, PPPA, journalists: the concession term as a live countdown and obligations with dated figures | Block fields entered by the editor; the term dates from the concession agreement | Medium: every row is editor-entered with source and as-at date, and an empty block renders the pending state rather than a number | **Build** |
| 6 | Axle-load / overload checker | Truck drivers and fleet managers facing the RHD weighbridges | CMS rule rows with a citation | High: the limits (single 10 t, tandem 18 t, tridem 24 t in the RHD Axle Load Control policy) need the instrument's title and date cited. Without DBEDC's copy the block would be an empty form | Defer: needs the cited rule rows from DBEDC first; the freight page already states the obligation in prose |
| 7 | Trip planner card with shareable link and QR | Drivers sharing a fare with a colleague | `toll_od_rates`, sections | None | Reject: the toll calculator already answers from the query string (shareable URL), prints on one A4 and shows measured journey time when sections carry speeds. A QR of the same URL adds nothing a phone cannot do |
| 8 | Incident calendar (ICS) from advisories | Fleet planners subscribing in Outlook or Google Calendar | `advisories` | Low | Folded into 4 as `/api/public/advisories.ics` |
| 9 | Plaza wait / lane status board | Drivers choosing a lane | None exists | High: would be invented | Reject until plaza systems supply a feed; a schema with no source is not a feature |
| 10 | Print-ready toll rate card | Truck drivers | `toll_rates` | None | Reject: W8.15 already prints the toll page on one A4 with the gazette citation |
| 11 | Low-bandwidth "lite" status page | 2G users | Same readers | Low | Reject: every page is server-rendered and light; the JSON endpoint in 4 is the machine path and the status page already collapses to one sentence when nothing is measured |
| 12 | Embed-this-status snippet page | Newsrooms, portals | Same as 4 | Low | Reject for now: a route template outside the block document rule ("what genuinely cannot be a pure block document"); the JSON endpoint gives the same data to anyone embedding |
| 13 | Nearest-exit push in the km finder from browser geolocation | Stranded driver with a phone but no view of a marker | Browser Geolocation API, geometry | Low: the answer says how far the reader is from the alignment and refuses beyond a threshold | Folded into 1 as the client enhancement |
| 14 | Typical journey time in the toll calculator from history | Drivers planning a trip | 3's aggregates | Low | Later: once `traffic_history` has weeks of data; the calculator's `journeyMinutes` only ever quotes a measured time, and a "typical" figure needs a documented method first |

## Chosen: 1, 2, 3, 4, 5

Ranking by (usefulness to a driver or trucker) × (novel for a BD expressway) × (honest with today's data): the finder and the weather block answer a question a driver has in the car; the history and open data are what an operator publishes and a regulator reads; the scorecard is the disclosure a concession company owes, built empty and waiting for DBEDC's figures.

### 1. `km-finder` — Where am I on the expressway

- Block type `km-finder`, renderer `KmFinderBlock.jsx`, logic in `lib/corridor/locate.js` (pure, tested).
- A GET form: the reader types the marker seen on the road (K12, K12+300, 12, 12.3) and the server answers from the query string with no JavaScript. The client enhancement adds a "Use my location" button (Geolocation API, projected onto the alignment with `nearestOnLine`); the answer is written into the same form and submitted, so there is one renderer.
- Answer: the chainage in K-notation, whether that stretch is open to traffic (from `segments`), the nearest toll plaza and the nearest interchange or plaza towards each end of the corridor with distances, the bridges nearby, and the emergency strip (same component the breakdown page uses, so a blank DBEDC number renders the pending state and 999 stays).
- Refusals: a marker beyond the corridor's measured length says so; a location more than 2 km from the alignment says the reader does not appear to be on the expressway.
- Placement: new page `travel/locate` (travel and safety menus), and the block placed on `travel/breakdown` under the emergency strip.

### 2. `corridor-weather` — Weather along the corridor

- `lib/weather/open-meteo.js` fetches Open-Meteo for three points along the alignment (first, middle and last `corridor_waypoints`, so nothing is hardcoded), cached with `unstable_cache` tag `weather`, 10 minutes. Any failure renders the unavailable state.
- Thresholds are settings, seeded by migration and edited at /admin/corridor: `weather.fog_visibility_m` (1000), `weather.heavy_rain_mm` (7.5 mm in the hour), `weather.strong_wind_kmh` (50). The advisory level is derived in `lib/weather/advisory.js` (pure, tested).
- Block: one row per point with visibility, rain, wind, temperature and a condition tag; a fog, rain or wind advisory when a threshold is crossed; source and time under it. Attribution to Open-Meteo is always printed.
- Placement: new page `travel/weather` (travel and safety menus) with authored fog-driving guidance, and the block on `travel/advisories`.

### 3. `travel-time-history` — Typical speed by hour

- Migration 54 creates `traffic_history` (section_id, measured_at, condition_key, avg_speed_kmh, source). `refreshTraffic()` appends one row per section per run; rows older than 400 days are pruned by the same job.
- `lib/corridor/history.js` reads the last N days and buckets by section × day type (working day, Friday–Saturday) × hour in Dhaka time; `bucketHistory` is pure and tested. A cell renders only with at least `minSamples` measurements (a block field, default 3).
- Block: a table per section, 24 cells across, condition colour from the shared ramp with the median speed printed in the cell (never colour alone), and "not enough data yet" until the first week of measurements exists.
- Placement: `travel/status` after the corridor strip, and `disclosures/reports`.

### 4. Open data

- `/api/public/corridor-status` (JSON): sections with condition, speed and measured time, active advisories, plazas and their status, the data source flag, the generation time; `Cache-Control: public, max-age=60`; rate-limited per IP.
- `/api/public/traffic-monthly.csv` and `/api/public/traffic-history.csv`: the same rows the pages read, with a `source` column carrying the sample or operator flag.
- `/api/public/advisories.ics`: closures and roadworks as calendar events (VEVENT per advisory, in the reader's language via `?lang=`).
- Block `open-data` listing the endpoints with an authored description per row and a reuse-terms field that renders the pending state while blank. Placement: new page `disclosures/open-data` in the disclosures menu.

### 5. `concession-scorecard`

- Block fields: heading, intro, term label, term start and end dates, a list of indicator rows (indicator, target, actual, unit, as-at date, source, source link), empty message.
- Live computation: days elapsed and remaining and the percentage of the term, from the two dates, in the reader's locale. No figure is typed twice.
- Rows with no `actual` render "not yet published" in that cell; an empty list renders the block's empty state. Seeded empty; the figures are registered in the handover document.
- Placement: `about/concession` after the key-facts grid.

## Rules honoured

- Every visitor-facing word is a block field, a setting, a record or a `lib/i18n/ui.js` fallback (editable at /admin/translations), in en, bn and zh. Bangla follows the everyday register from the 17 September audit (ম্যাপ, আপডেট, লাইভ, এক্সিট, টোল, রিপোর্ট, গাড়ির ধরন, ব্রেকডাউন).
- Place names in Bangla and Chinese reuse the forms in `corridor_waypoints.names` and `seo.site_title`; interchange names have only English today and stay in Latin script in bn and zh, which the interchange table already does.
- Nothing invents a number: the weather is attributed and timestamped, the history is measured or absent, the scorecard is empty until DBEDC types a figure with its source, and the finder's emergency number comes from the same blank setting the footer reads.
- Migrations 54–58 are plain, idempotent SQL registered in `lib/db/migrations.js` and rehearsed by `tests/db/fresh-import.test.js`.

## Decisions taken while building

- Weather sample points come from the first, middle and last waypoint rather than from the interchanges, because the waypoint table is the alignment's own record and always has coordinates.
- Rain threshold is per hour (Open-Meteo's `precipitation` is the last hour's total), not per day: a driver cares about what is falling now.
- The history buckets working days against Friday–Saturday, Bangladesh's weekend, not Saturday–Sunday.
- The ICS feed carries one event per advisory with a start; an advisory with no dates is a standing notice and is left to the JSON feed.
- No reuse licence is asserted in code or seed; the open-data block's terms field is blank and renders the pending state until DBEDC chooses one.
