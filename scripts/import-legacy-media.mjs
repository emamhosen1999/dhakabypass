/**
 * Registers the images inherited from the old site as media rows.
 *
 * The files are NOT copied. They already live in public/ and are already
 * served statically by Next, so the row's `path` is the URL that works today.
 * When the Boss replaces one through the admin, the new upload lands in
 * MEDIA_ROOT and the row's path is rewritten to /uploads/... — see
 * docs/admin/replacing-images.md.
 *
 * Every row is written with origin='legacy', which is what marks it as a
 * placeholder in the admin media screen. Re-running updates dimensions and
 * origin but never clobbers an alt or credit the operator has edited.
 */
import { loadEnv } from './load-env.mjs';

loadEnv();
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { imageSize } from '../lib/media/probe.js';
import { replacedLegacyPaths } from '../lib/media/replace.js';

/**
 * AUDITED allowlist. Every entry here was opened and looked at.
 *
 * This is an allowlist, not a convenience map, because auditing the inherited
 * library found that a large share of it is NOT DBEDC photography at all:
 *   cbri.webp   — a Belt and Road Initiative route map, a third-party infographic
 *   hma.webp    — a generic 3D "surface / base / subbase course" stock diagram
 *   road.webp   — an aerial of a motorway through temperate farmland; not this road
 *   eco-eff.webp— a Google Maps screenshot carrying a visible "Map data (c)2015 Google"
 * Republishing any of those on a PPP company's corporate site is a copyright
 * problem, and two of them would also misrepresent another country's road as
 * this one. They are excluded here and must not be reinstated without a licence.
 *
 * Images showing identifiable people are INCLUDED: the Boss confirmed on
 * 2026-09-03 that DBEDC holds releases, and each carries that confirmation in
 * its credit line. They are registered for use on an About or Community page,
 * not on the home page. friends.webp is rejected below on separate grounds --
 * it is generic flag artwork of unknown provenance, not a photograph of anyone.
 *
 * `status` is written to media.credit so the admin screen can show an operator
 * why an image is or is not available.
 */
const AUDITED = {
  // --- Road and construction -------------------------------------------
  '/bg-hero.webp': { alt: 'The expressway seen from the air, curving between wetland and villages with traffic on the open carriageway', credit: 'DBEDC' },
  '/bypass-ex.webp': { alt: 'A gantry over the carriageway reading “Welcome to Dhaka Bypass Expressway”, with the toll plaza and trucks beyond', credit: 'DBEDC' },
  '/photo/20.webp': { alt: 'Aerial view along the finished expressway, traffic running on both carriageways', credit: 'DBEDC' },
  '/photo/21.webp': { alt: 'Aerial view of a bridge under construction crossing open water', credit: 'DBEDC' },
  '/photo/22.webp': { alt: 'Aerial view of the completed viaduct crossing a river, with traffic running', credit: 'DBEDC' },
  '/photo/23.webp': { alt: 'Aerial view along the viaduct deck toward the horizon', credit: 'DBEDC' },
  '/photo/18.webp': { alt: 'A paver laying asphalt at dusk, lit by the low sun', credit: 'DBEDC' },
  '/photo/17.webp': { alt: 'A roller compacting fresh asphalt between concrete retaining walls', credit: 'DBEDC' },
  '/photo/16.webp': { alt: 'Newly finished asphalt with people walking on the new surface', credit: 'DBEDC' },
  '/photo/14.webp': { alt: 'A roller working new pavement beside a concrete retaining wall', credit: 'DBEDC' },
  '/photo/19.webp': { alt: 'Freshly laid asphalt running through a cutting', credit: 'DBEDC' },
  '/photo/10.webp': { alt: 'A roller compacting the subgrade ahead of surfacing', credit: 'DBEDC' },
  '/photo/13.webp': { alt: 'A worker spreading fill at the edge of the live carriageway', credit: 'DBEDC' },
  '/photo/11.webp': { alt: 'Steel reinforcement laid in a drainage channel, with workers in protective equipment', credit: 'DBEDC' },
  '/photo/12.webp': { alt: 'Waterproofing being applied to a bridge deck', credit: 'DBEDC' },
  '/photo/7.webp': { alt: 'Formwork and reinforcement around a pier under construction', credit: 'DBEDC' },
  '/photo/8.webp': { alt: 'Concrete blocks laid as slope protection on an embankment', credit: 'DBEDC' },
  '/photo/9.webp': { alt: 'A survey team working at the roadside during construction', credit: 'DBEDC' },
  '/photo/15.webp': { alt: 'Materials testing on the compacted subbase', credit: 'DBEDC' },
  '/photo/25.webp': { alt: 'A site meeting beside a completed structure', credit: 'DBEDC' },
  '/cp.webp': { alt: 'Workers fixing reinforcement along a bridge parapet on the alignment', credit: 'DBEDC' },
  '/semi.webp': { alt: 'Concrete being poured onto a reinforced bridge deck, with completed viaduct spans behind', credit: 'DBEDC' },
  // --- Identity ---------------------------------------------------------
  '/logo.webp': { alt: 'Dhaka Bypass Expressway Development Company logo', credit: 'DBEDC — raster only, vector original still needed' },
  '/route.webp': { alt: 'Diagram of the corridor from Vogra in the north to Madanpur in the south', credit: 'DBEDC — own artwork, confirm before reuse' },
  // --- People. Consent confirmed by the Boss on 2026-09-03. -------------
  // Cleared for an About or Community page. NOT seeded on the home page:
  // this is a road operator's front door, not a corporate album.
  '/photo/1.webp': { alt: 'A handover ceremony at the Public Private Partnership Authority', credit: 'DBEDC — consent confirmed 2026-09-03' },
  '/photo/24.webp': { alt: 'Project staff and local residents handling materials during a community visit', credit: 'DBEDC — consent confirmed 2026-09-03' },
  '/DSC02357.webp': { alt: 'Bangladeshi and Chinese project staff at a ceremony beneath both national flags', credit: 'DBEDC — consent confirmed 2026-09-03' },
  '/IMG_6282.webp': { alt: 'A plaque being presented at a school handover', credit: 'DBEDC — consent confirmed 2026-09-03' },
};

/**
 * Opened, looked at, and REJECTED. Recorded so the next person does not have to
 * repeat the audit, and so the admin can explain the gap to the Boss.
 */
const REJECTED = {
  '/cbri.webp': 'Third-party Belt and Road Initiative map. Not DBEDC content.',
  '/hma.webp': 'Generic stock pavement-layer diagram. Not DBEDC content.',
  '/road.webp': 'Stock aerial of a motorway in temperate farmland. Not this road.',
  '/eco-eff.webp': 'Google Maps screenshot, "Map data (c)2015 Google" visible. Licensing and eleven years stale.',
  '/friends.webp': 'Generic China-Bangladesh flag graphic. Stock artwork of unknown provenance.',
  '/map.webp': 'Google satellite screenshot with annotations. Same licensing problem as eco-eff.',
  '/photo/2.webp': 'Newspaper infographic headlined "DHAKA BYPASS PROJECT IN A JAM". Third-party AND hostile press.',
  '/photo/3.webp': 'Internal right-of-way acquisition annotations. Working document, not public content.',
  '/photo/5.webp': 'Internal alignment and utility overlay. Working document, not public content.',
  '/photo/6.webp': 'Engineering drawing. Working document, not public content.',
};

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

const root = path.join(process.cwd(), 'public');

/**
 * Drive the loop from AUDITED, not from a directory listing.
 *
 * Reading the directory and filtering would register anything a future commit
 * drops into public/ without anybody looking at it — which is exactly how the
 * old site ended up publishing a Belt and Road infographic. An image reaches
 * the database only because a person opened it and wrote a line for it here.
 */
// Paths the operator has ALREADY replaced through the admin.
//
// A replacement rewrites the row's `path` from /photo/16.webp to /uploads/...,
// so no row holds the legacy path any more. The upsert below is keyed on the
// UNIQUE `path`, so it found no duplicate and cheerfully INSERTed the
// placeholder back — with its original English-only alt — on every run. After
// 28 replacements, one run refilled the entire list the operator had just
// cleared. Pages never broke, because blocks point at /uploads/..., so nobody
// would notice until the client asked why the list was full again.
//
// media.original_path (scripts/db-setup-v6.mjs) is the row's memory of what it
// was first registered as. Consulting it is what makes re-running safe.
const alreadyReplaced = await replacedLegacyPaths(
  async (sql, params) => {
    const [rows] = await db.execute(sql, params);
    return rows;
  },
  Object.keys(AUDITED),
);

let ok = 0;
let missing = 0;
let unreadable = 0;
let replaced = 0;

for (const [rel, entry] of Object.entries(AUDITED)) {
  if (alreadyReplaced.has(rel)) {
    console.log(`  = already replaced by the operator, left alone: ${rel}`);
    replaced += 1;
    continue;
  }
  if (REJECTED[rel]) {
    // Belt and braces: a path must never appear in both maps. If one does,
    // stop rather than guess which list the author meant.
    throw new Error(`${rel} is in AUDITED and REJECTED. Resolve the audit before importing.`);
  }
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.warn(`  ! missing on disk, skipped: ${rel}`);
    missing += 1;
    continue;
  }
  const buf = fs.readFileSync(abs);
  const size = imageSize(buf);
  if (!size) {
    console.warn(`  ! unreadable, skipped: ${rel}`);
    unreadable += 1;
    continue;
  }
  await db.execute(
    `INSERT INTO media (path, width, height, bytes, mime, alt, origin, credit)
     VALUES (?, ?, ?, ?, ?, ?, 'legacy', ?)
     ON DUPLICATE KEY UPDATE
       width = VALUES(width), height = VALUES(height),
       bytes = VALUES(bytes), mime = VALUES(mime),
       origin = 'legacy', credit = VALUES(credit)`,
    [rel, size.width, size.height, buf.length, size.mime,
      JSON.stringify({ en: entry.alt }), entry.credit],
  );
  ok += 1;
}

// alt is deliberately NOT in the ON DUPLICATE KEY UPDATE list: re-running must
// never overwrite alt text an operator has edited or translated in the admin.

console.log(`registered ${ok} audited images (${missing} missing, ${unreadable} unreadable, ${replaced} already replaced)`);
console.log(`${Object.keys(REJECTED).length} files excluded by the audit and NOT registered:`);
for (const [rel, why] of Object.entries(REJECTED)) console.log(`  - ${rel}  ${why}`);
console.log('Every registered image is a PLACEHOLDER — see docs/admin/replacing-images.md');
await db.end();
