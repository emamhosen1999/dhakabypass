/**
 * Seeds corridor data so the Travel Info pages have something to render
 * before DBEDC supplies the full official schedule.
 *
 * Geometry (waypoints, toll plazas, bridges, segments) is now the REAL
 * surveyed/road-network data supplied by the client, replacing the earlier
 * fictional seed (see
 * .superpowers/sdd/2026-09-01-dhakabypass-domain-data-travel-info/REAL-DATA-FROM-BOSS.md,
 * sections 4-5, sourced from CORRIDOR-WAYPOINTS.xlsx). Facilities and rules
 * content, and the toll-section labelling, are still reconstructed — that is
 * why corridor.illustrative stays true below.
 *
 *   node scripts/seed-corridor.mjs [--database=name]
 */
import mysql from 'mysql2/promise';
import { loadEnv } from './load-env.mjs';

loadEnv();
const arg = process.argv.find((a) => a.startsWith('--database='));
const DB_NAME = arg ? arg.split('=')[1] : process.env.DB_NAME || 'dhakabypass';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB_NAME,
});

// SETTLED by the client: the tolled stretch is named "Vogra – Purbachal" —
// the operator's own name for it, not a route description. An earlier
// version of this label was "Kodda – Purbachal", which was simply wrong
// (Kodda appears nowhere in the corridor data; K0+000 is Naojor). This one
// is the client's confirmed name, but it still needs a caveat: Purbachal
// Toll Plaza sits at K24+522, which is 3.3 km beyond the end of the
// currently open section (K21+218) — so the name describes the tolled
// corridor as a whole, not the extent a driver can currently traverse. The
// client was shown that exact discrepancy directly ("its vogra to
// purbachal") and confirmed the naming anyway, with the open extent
// separately re-confirmed as K3+218 (Vogra TP1) to K21+218 ("k3 vogra toll
// plaza 1 to the next 18km"). Do not "fix" this gap again without checking
// history first — it was raised and settled, not missed.
const OPEN_SECTION_LABEL = 'Vogra – Purbachal';

// Corridor length: the road-network model measures 47,611 m end to end
// (WP8/Madanpur). The gazette, ADB and press all use the official design
// figure of 48 km. The 389 m gap is because the physical pavement ends
// short of the nominal start (see corridor.published_length_km below) — it
// is not a measurement error. All chainages here are relative to the
// measured 47,611 m model, because that is what makes individual positions
// accurate; only the published headline figure stays 48.
const SEGMENTS = [
  { from_m: 0,     to_m: 3218,  status: 'construction', labels: { en: 'Naojor approach' } },
  // Open section: Vogra Toll Plaza (K3+218) -> K21+218, exactly 18.000 km.
  // The Boss confirmed this directly: "not till purbachal, it is 18 km from
  // the vogra K3+218 to 23.8707560703556, 90.5080711423332." An independent
  // haversine interpolation of that coordinate along the WP4->WP5 road
  // segment lands at K21+301 — 83 m from the Boss's K21+218, which is close
  // enough to call the figure self-consistent, so K21+218 is used here.
  //
  // Purbachal Toll Plaza (K24+522, see TOLL PLAZAS below) sits 3.3 km BEYOND
  // the end of this open section — the toll rows' section label
  // ("Vogra – Purbachal", OPEN_SECTION_LABEL above) names the tolled
  // corridor as a whole, not this open extent. See the comment on that
  // constant: the client confirmed the naming with that gap in view.
  { from_m: 3218,  to_m: 21218, status: 'open',         labels: { en: OPEN_SECTION_LABEL }, opened_on: '2025-08-24' },
  { from_m: 21218, to_m: 47611, status: 'construction', labels: { en: 'Purbachal – Madanpur' } },
];

// Waypoints (interchanges), toll plazas and bridges below come from the
// client-supplied CORRIDOR-WAYPOINTS.xlsx workbook, projected onto a
// TomTom-routed polyline (see REAL-DATA-FROM-BOSS.md section 4). Chainages
// are model-derived from that projection, not surveyed chainage markers —
// still far better grounded than the old patrol-screenshot placeholder data
// they replace.
//
// Per the workbook: DO NOT use the straight-line sheet's start coordinate
// (24.004888, 90.325339) for WP "S" — the file states it was extrapolated
// along the S->2 bearing purely to force the total to exactly 48.000 km. It
// is an arithmetic artefact, not a real place, so the true WP "S" (Naojor)
// coordinate below is used instead.
// PLACE NAMES: Latin only, deliberately.
//
// These rows carried Bengali transliterations until 2026-09-03. They were OURS,
// not DBEDC's -- nobody at the operator had ever seen them. Publishing an
// invented spelling of a toll operator's own facilities is the kind of error
// that gets noticed and quoted, and it is worse than showing the Latin name.
//
// Latin is also the right answer for wayfinding: a driver reads "Vogra Toll
// Plaza" on the gantry, and the page should say the same string.
//
// localeText() falls back to `en` when a locale key is absent, so /bn and /zh
// render these names in Latin with no further code. The moment DBEDC supplies
// official Bangla spellings, add `bn:` back here and they appear everywhere at
// once -- the strip, the table, and the home page -- because every surface
// reads this one place.
//
// Client decision of 2026-09-03: docs/source-data/2026-09-03-client-decisions.md
const INTERCHANGES = [
  // -- Waypoints: kind 'interchange' --------------------------------------
  { chainage_m: 0,     names: { en: 'Naojor (corridor start)' },        kind: 'interchange', status: 'construction', connects_to: '', lat: 23.986737, lng: 90.362246 },
  { chainage_m: 2314,  names: { en: 'Waypoint 2' },                kind: 'interchange', status: 'construction', connects_to: '', lat: 23.977568, lng: 90.380874 },
  { chainage_m: 7554,  names: { en: 'Waypoint 3' },                kind: 'interchange', status: 'open',         connects_to: '', lat: 23.949671, lng: 90.414551 },
  { chainage_m: 12090, names: { en: 'Waypoint 4' },                kind: 'interchange', status: 'open',         connects_to: '', lat: 23.930211, lng: 90.452655 },
  { chainage_m: 26799, names: { en: 'Waypoint 5' },                kind: 'interchange', status: 'construction', connects_to: '', lat: 23.834773, lng: 90.540481 },
  { chainage_m: 34973, names: { en: 'Waypoint 6' },                kind: 'interchange', status: 'construction', connects_to: '', lat: 23.785562, lng: 90.568720 },
  { chainage_m: 41371, names: { en: 'Waypoint 7' },                kind: 'interchange', status: 'construction', connects_to: '', lat: 23.731516, lng: 90.587646 },
  { chainage_m: 47611, names: { en: 'Madanpur (corridor end)' },        kind: 'interchange', status: 'construction', connects_to: '', lat: 23.690500, lng: 90.546722 },

  // -- Toll plazas: kind 'toll_plaza' -------------------------------------
  { chainage_m: 3218,  names: { en: 'Vogra Toll Plaza (RHS)' }, kind: 'toll_plaza', status: 'open',         connects_to: '', lat: 23.9753672, lng: 90.3892800 },
  { chainage_m: 3706,  names: { en: 'Vogra Toll Plaza (LHS)' }, kind: 'toll_plaza', status: 'open',         connects_to: '', lat: 23.9743656, lng: 90.3920315 },
  { chainage_m: 11365, names: { en: 'Mirer Bazar (A)' },                    kind: 'toll_plaza', status: 'open',         connects_to: '', lat: 23.9350313, lng: 90.4459478 },
  { chainage_m: 13184, names: { en: 'Mirer Bazar (RHS)' },            kind: 'toll_plaza', status: 'open',         connects_to: '', lat: 23.9235064, lng: 90.4598731 },
  { chainage_m: 13403, names: { en: 'Mirer Bazar (LHS)' },            kind: 'toll_plaza', status: 'open',         connects_to: '', lat: 23.9230806, lng: 90.4613011 },
  { chainage_m: 24522, names: { en: 'Purbachal Toll Plaza' },           kind: 'toll_plaza', status: 'construction', connects_to: '', lat: 23.8517101, lng: 90.5247815 },

  // TP-07/08/09 below (K34+353, K36+554, K45+965) are EXTRAPOLATED, not
  // well-projected like the six toll plazas above (those landed within
  // 0.5-17.3 m of the routed polyline). The workbook flags these three as
  // +/-200-300 m along the corridor, with a field GPS fix still outstanding,
  // and notes specifically that K36+554 "may be a bridge/lay-by rather than
  // a toll gantry" — i.e. it may not even be a toll plaza. The client
  // directed they be published as confident pending that fix, so they are
  // seeded as ordinary toll_plaza rows below — that is a presentation call,
  // not new certainty about the positions. Correcting any one of them once
  // field GPS lands is a one-row change here.
  { chainage_m: 34353, names: { en: 'Toll Plaza (K34)' },                 kind: 'toll_plaza', status: 'construction', connects_to: '', lat: 23.791205,  lng: 90.569644 },
  { chainage_m: 36554, names: { en: 'Toll Plaza (K36)' },                 kind: 'toll_plaza', status: 'construction', connects_to: '', lat: 23.772146,  lng: 90.571652 },
  { chainage_m: 45965, names: { en: 'Toll Plaza (K46)' },                 kind: 'toll_plaza', status: 'construction', connects_to: '', lat: 23.703585,  lng: 90.555454 },

  // -- Bridges: kind 'bridge' -----------------------------------------------
  { chainage_m: 14584, names: { en: 'Nagda Bridge' },       kind: 'bridge', status: 'open', connects_to: '', lat: 23.9172678, lng: 90.4687529 },
  { chainage_m: 16795, names: { en: 'Ulukhola Bridge' }, kind: 'bridge', status: 'open', connects_to: '', lat: 23.8996764, lng: 90.4811561 },
  { chainage_m: 27403, names: { en: 'Kanchan Bridge' },   kind: 'bridge', status: 'construction', connects_to: '', lat: 23.8362275, lng: 90.5457149 },
];

// Officially introduced rates for the opened 18 km section (Boss, citing The
// Business Standard and others) — NOT the full-corridor rates, and NOT a
// full commercial-operation schedule. Motorcycles and three-wheelers are
// strictly prohibited on this expressway, so there is no rate row for them
// — see corridor.prohibited_vehicles below. Do not add a zero-rate or "N/A"
// row for a banned class; the absence of a row IS the statement that the
// class has no rate. The rate amounts themselves are the client's real,
// confirmed figures. The `section` label (OPEN_SECTION_LABEL above) is the
// client's confirmed name for the tolled corridor — see the comment on
// that constant for the caveat that goes with it.
const TOLLS = [
  { vehicle_class: 'car',           class_labels: { en: 'Sedan / Private Car', bn: 'প্রাইভেট কার', zh: '小轿车' },                                          class_order: 1, amount_bdt: 150, effective_from: '2025-08-24' },
  { vehicle_class: 'pickup',        class_labels: { en: 'Pickup, Jeep, Wrecker, Crane (3 tons)', bn: 'পিকআপ, জিপ, রেকার, ক্রেন (৩ টন)', zh: '皮卡、吉普、清障车、起重车（3 吨）' },     class_order: 2, amount_bdt: 180, effective_from: '2025-08-24' },
  { vehicle_class: 'microbus',      class_labels: { en: 'Microbus', bn: 'মাইক্রোবাস', zh: '微型客车' },                                                    class_order: 3, amount_bdt: 190, effective_from: '2025-08-24' },
  { vehicle_class: 'minibus',       class_labels: { en: 'Small Bus / Minibus (under 31 seats)', bn: 'মিনিবাস (৩১ আসনের কম)', zh: '小型客车／中巴（31 座以下）' },        class_order: 4, amount_bdt: 210, effective_from: '2025-08-24' },
  { vehicle_class: 'small_truck',   class_labels: { en: 'Small Truck (3 tons)', bn: 'ছোট ট্রাক (৩ টন)', zh: '小型货车（3 吨）' },                                class_order: 5, amount_bdt: 260, effective_from: '2025-08-24' },
  { vehicle_class: 'large_bus',     class_labels: { en: 'Large Bus (31+ seats)', bn: 'বড় বাস (৩১+ আসন)', zh: '大型客车（31 座以上）' },                          class_order: 6, amount_bdt: 310, effective_from: '2025-08-24' },
  { vehicle_class: 'medium_truck',  class_labels: { en: 'Medium Truck (5–7 tons)', bn: 'মাঝারি ট্রাক (৫–৭ টন)', zh: '中型货车（5–7 吨）' },                        class_order: 7, amount_bdt: 400, effective_from: '2025-08-24' },
  { vehicle_class: 'heavy_truck',   class_labels: { en: 'Heavy Truck (2–3 axles, 7+ tons)', bn: 'ভারী ট্রাক (২–৩ এক্সেল, ৭+ টন)', zh: '重型货车（2–3 轴，7 吨以上）' },  class_order: 8, amount_bdt: 610, effective_from: '2025-08-24' },
  { vehicle_class: 'large_truck',   class_labels: { en: 'Large Truck (Trailer, 6-axle, 15–25 tons)', bn: 'ট্রেইলার / বড় ট্রাক (৬ এক্সেল, ১৫–২৫ টন)', zh: '大型拖挂车（6 轴，15–25 吨）' }, class_order: 9, amount_bdt: 740, effective_from: '2025-08-24' },
];

// Reused as the site_settings value for corridor.prohibited_vehicles.
const PROHIBITED_VEHICLES = {
  en: ['Motorcycles', 'Three-wheelers (CNG and auto-rickshaw)'],
  bn: ['মোটরসাইকেল', 'তিন চাকার যান (সিএনজি ও অটোরিকশা)'],
  zh: ['摩托车', '三轮车（CNG 和机动三轮车）'],
};

try {
  await db.query('DELETE FROM segments');
  await db.query('DELETE FROM interchanges');
  await db.query('DELETE FROM toll_rates');

  for (const s of SEGMENTS) {
    await db.execute(
      'INSERT INTO segments (from_m, to_m, status, opened_on, labels) VALUES (?, ?, ?, ?, ?)',
      [s.from_m, s.to_m, s.status, s.opened_on || null, JSON.stringify(s.labels)]
    );
  }
  for (const i of INTERCHANGES) {
    await db.execute(
      'INSERT INTO interchanges (chainage_m, names, kind, status, connects_to, facilities, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [i.chainage_m, JSON.stringify(i.names), i.kind, i.status, i.connects_to, JSON.stringify([]), i.lat, i.lng]
    );
  }
  for (const t of TOLLS) {
    await db.execute(
      'INSERT INTO toll_rates (vehicle_class, class_labels, class_order, section, amount_bdt, effective_from) VALUES (?, ?, ?, ?, ?, ?)',
      [t.vehicle_class, JSON.stringify(t.class_labels), t.class_order, OPEN_SECTION_LABEL, t.amount_bdt, t.effective_from]
    );
  }

  await db.execute(
    `INSERT INTO site_settings (setting_key, value) VALUES ('corridor.illustrative', 'true')
     ON DUPLICATE KEY UPDATE value = VALUES(value)`
  );
  await db.execute(
    `INSERT INTO site_settings (setting_key, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    ['corridor.prohibited_vehicles', JSON.stringify(PROHIBITED_VEHICLES)]
  );
  // corridor.published_length_km: the official design figure (48 km) used
  // by the gazette, ADB and the press. Kept SEPARATE from the measured
  // 47,611 m the segments/interchanges above are chainage-relative to,
  // because the pavement physically ends short of the nominal start — see
  // the SEGMENTS comment above.
  //
  // This setting IS live. lib/settings.js getPublishedLengthKm() reads it,
  // lib/corridor/cache.js wraps that as getPublishedLengthKmCached(), and
  // both the home page (app/[locale]/page.jsx) and /travel/status pass the
  // result into <ProgressBar publishedLengthKm={...}>, where it is the
  // DENOMINATOR of the "x km / 48 km" note. Only the denominator: the
  // percentage and the open-length numerator still come from the measured
  // segment extent, so individual positions stay accurate against the model
  // while the headline figure the client publishes is the one on screen.
  // Changing this value therefore changes what two live pages say — it is
  // not an inert record of the gazette figure.
  await db.execute(
    `INSERT INTO site_settings (setting_key, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    ['corridor.published_length_km', JSON.stringify(48)]
  );

  console.log(
    `Seeded ${SEGMENTS.length} segments, ${INTERCHANGES.length} interchanges and ` +
    `${TOLLS.length} toll rates on ${DB_NAME}, flagged ILLUSTRATIVE.`
  );
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
