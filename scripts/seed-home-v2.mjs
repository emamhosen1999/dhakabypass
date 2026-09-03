/**
 * The home page content.
 *
 * Every line here is newly written for a road that is OPEN and tolling. The
 * old site's prose described a project awaiting completion in July 2025; none
 * of it survives. Where a number came from the old site it is unverified, and
 * the block copy says so in the reader's own words rather than hiding it in a
 * footnote.
 *
 * Re-running replaces the home page's blocks wholesale. It does not touch any
 * other page.
 */
import { loadEnv } from './load-env.mjs';

loadEnv();
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

const BLOCKS = [
  {
    type: 'hero',
    data: {
      image: '/bg-hero.webp',
      eyebrow: 'Dhaka Bypass Expressway',
      headline: 'Eighteen kilometres open, and tolling',
      standfirst:
        'The first section of the bypass carries traffic between Vogra and Mirer Bazar today. '
        + 'The rest of the 48-kilometre corridor is still under construction.',
      primaryLabel: 'Toll rates',
      primaryHref: 'travel/toll',
      secondaryLabel: 'What is open',
      secondaryHref: 'travel/status',
    },
  },
  {
    type: 'toll-preview',
    data: {
      heading: 'What it costs',
      intro: 'Rates in force on the open section. Motorcycles and three-wheelers may not use the expressway.',
      classes: ['car', 'microbus', 'large_bus', 'heavy_truck'],
      linkLabel: 'All nine vehicle classes',
      linkHref: 'travel/toll',
    },
  },
  {
    type: 'media-prose',
    data: {
      image: '/bypass-ex.webp',
      side: 'right',
      heading: 'A road around the city, not through it',
      body:
        '<p>The Dhaka Bypass runs 48 kilometres down the eastern edge of the capital, from Gazipur in '
        + 'the north to Narayanganj in the south. It exists so that freight moving between the northern '
        + 'industrial belt and the southern ports does not have to cross Dhaka to get there.</p>'
        + '<p>It is access-controlled: traffic joins and leaves only at built interchanges, and every '
        + 'crossing is grade-separated. That is what separates it from the national highways it connects '
        + 'to, and it is why a journey that takes two hours through the city is meant to take a fraction '
        + 'of that once the full corridor opens.</p>',
      caption: 'The completed carriageway on the open section.',
      linkLabel: 'Where to join and leave',
      linkHref: 'travel/route',
    },
  },
  {
    type: 'card-grid',
    data: {
      heading: 'What it connects',
      intro: 'Four national highways meet the corridor along its length.',
      items: [
        { meta: 'North', title: 'N1', body: 'The Dhaka–Chattogram highway, toward the southern ports.' },
        { meta: 'North', title: 'N2', body: 'The Dhaka–Sylhet highway, toward the north-east.' },
        { meta: 'Centre', title: 'N3', body: 'The Dhaka–Mymensingh highway, toward the north.' },
        { meta: 'South', title: 'N4', body: 'The Tangail and Jamuna bridge corridor, toward the north-west.' },
      ],
    },
  },
  {
    // Only figures we can derive or have confirmed. The concession term, the
    // investment total and the structure counts all came from the old site and
    // are unverified — they do NOT belong in a stat row, which reads as a row
    // of established facts. They stay in prose, marked, until DBEDC confirms.
    type: 'stat-row',
    data: {
      stats: [
        { label: 'Corridor length', value: '48', unit: 'km' },
        { label: 'Open to traffic', value: '18', unit: 'km' },
        { label: 'Vehicle classes tolled', value: '9', unit: '' },
        { label: 'National highways joined', value: '4', unit: '' },
      ],
    },
  },
  {
    type: 'media-prose',
    data: {
      // eco-eff.webp was the obvious pick and is disqualified: it is a Google Maps
      // screenshot with a visible 2015 copyright line. A finished-road frame is
      // the right subject here anyway: this section is about the road in use.
      image: '/photo/16.webp',
      side: 'left',
      heading: 'What the open section changes now',
      body:
        '<p>Traffic that used to queue through Gazipur can now run the tolled section instead. For a '
        + 'freight operator that is measured in fuel burned while stationary and in drivers’ hours, '
        + 'not in kilometres saved.</p>'
        + '<p>The corridor is built and operated under a public–private partnership covering design, '
        + 'construction, finance, operation and maintenance. Tolls are what pays for it.</p>'
        + '<p class="db-provisional-inline">Figures published for this project during construction — '
        + 'total investment, jobs created, bridges and underpasses built, the length of the concession — '
        + 'have not been reconfirmed since the road opened. They are not republished here until DBEDC '
        + 'has verified them.</p>',
      caption: 'The finished wearing course on the open section.',
      linkLabel: 'The corridor today',
      linkHref: 'travel/status',
    },
  },
  {
    // The four aerials are the strongest images DBEDC holds and none of them
    // appear anywhere else on the page. Road subjects only: the CSR library is
    // cleared for use but belongs on an About page, not on a road operator's
    // front door.
    //
    // No link. There is no localised gallery route yet, and pointing a Bangla
    // reader at the legacy English /gallery is worse than offering nothing.
    type: 'figure-grid',
    data: {
      heading: 'The corridor',
      intro: 'The alignment during construction and since opening.',
      items: [
        { image: '/photo/22.webp', caption: 'The viaduct crossing the river.' },
        { image: '/photo/20.webp', caption: 'Traffic on the open section.' },
        { image: '/photo/21.webp', caption: 'Bridge construction over open water.' },
        { image: '/photo/18.webp', caption: 'Surfacing at dusk.' },
        { image: '/photo/17.webp', caption: 'Compacting the wearing course.' },
        { image: '/photo/23.webp', caption: 'Looking south along the deck.' },
      ],
      linkLabel: '',
      linkHref: '',
    },
  },
  {
    type: 'partner-row',
    data: {
      heading: 'Who builds and runs it',
      intro: 'The Dhaka Bypass Expressway Development Company holds the concession.',
      items: [
        { name: 'SRBG', role: 'Sichuan Road & Bridge Group, lead partner', share: '60%' },
        { name: 'SEL', role: 'Shamim Enterprise Ltd', share: '' },
        { name: 'UDC', role: 'UDC Construction Ltd', share: '' },
      ],
    },
  },
  {
    type: 'cta-band',
    data: {
      // NOT a "report a problem" call to action, which is what a road operator's
      // front page should close on. There is no localised contact route yet and
      // DBEDC has not supplied an emergency hotline, so that CTA would either
      // send a Bangla reader to the legacy English page or publish a number we
      // do not have. Closing on what the site can actually deliver today is the
      // honest version; the operator swaps this block in the admin the moment
      // the hotline and a localised contact page exist.
      heading: 'Before you drive it',
      body:
        'Motorcycles and three-wheelers are prohibited. Know the limits and the '
        + 'closures before you set off.',
      primaryLabel: 'Rules of the road',
      primaryHref: 'travel/rules',
      secondaryLabel: 'What is open today',
      secondaryHref: 'travel/status',
    },
  },
];

const [pageRows] = await db.execute('SELECT id FROM pages WHERE slug = ?', ['home']);
let pageId;
if (pageRows.length) {
  pageId = pageRows[0].id;
  await db.execute('UPDATE pages SET status = ? WHERE id = ?', ['published', pageId]);
  const [old] = await db.execute('SELECT id FROM blocks WHERE page_id = ?', [pageId]);
  for (const b of old) await db.execute('DELETE FROM block_translations WHERE block_id = ?', [b.id]);
  await db.execute('DELETE FROM blocks WHERE page_id = ?', [pageId]);
} else {
  const [ins] = await db.execute("INSERT INTO pages (slug, status) VALUES ('home', 'published')");
  pageId = ins.insertId;
}

// page_translations is keyed on (page_id, locale) and has no surrogate id, so
// the upsert is the whole read-modify-write. The plan's SELECT id / UPDATE ...
// WHERE id = ? pair cannot work against this schema.
await db.execute(
  `INSERT INTO page_translations (page_id, locale, title, status)
   VALUES (?, 'en', ?, 'published')
   ON DUPLICATE KEY UPDATE title = VALUES(title), status = VALUES(status)`,
  [pageId, 'Dhaka Bypass Expressway'],
);

let sort = 0;
for (const block of BLOCKS) {
  const [ins] = await db.execute(
    'INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)',
    [pageId, block.type, sort],
  );
  await db.execute(
    "INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, 'en', ?, 'published')",
    [ins.insertId, JSON.stringify(block.data)],
  );
  sort += 1;
}

console.log(`seeded ${BLOCKS.length} home blocks (en)`);
await db.end();
