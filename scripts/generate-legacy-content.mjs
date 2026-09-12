// Generator for db/sql/24-legacy-content.sql (W2.2–W2.7).
//
// The previous website's structured facts — the project timeline, the
// December 2024 progress figures, the specification tiles, the partners and
// their financing, the Chinese contribution, the economic-impact figures, the
// key locations and facilities — as block documents on the pages that
// replaced those routes. Everything is English-only (the source was) and
// every group is introduced by a `callout` of tone `legacy`, the site's
// standard "recovered from the previous website, not confirmed as current"
// provenance, so nothing here reads as a claim DBEDC has verified.
//
// Source: old_dhakabypass/*/index.html, read by hand into this file. Run:
//   node scripts/generate-legacy-content.mjs > db/sql/24-legacy-content.sql

const FIRST_ID = 400;
let nextId = FIRST_ID;
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
const json = (o) => q(JSON.stringify(o));

const LEGACY_NOTE = 'Recovered from the previous website. These details may have changed and are not confirmed as current.';
const legacy = (extra) => ({ type: 'callout', data: { tone: 'legacy', heading: '', body: `<p>${LEGACY_NOTE}${extra ? ` ${extra}` : ''}</p>` } });
const rich = (heading, body) => ({ type: 'rich-text', data: { heading, body } });
const stats = (rows) => ({ type: 'stat-row', data: { stats: rows.map(([value, unit, label]) => ({ value, unit, label })) } });
const cards = (heading, intro, items) => ({ type: 'card-grid', data: { heading, intro, items: items.map(([title, meta, body]) => ({ title, meta, body })) } });
const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

/** page slug -> { after: sort_order to attach to (new blocks share it, with
 *  higher ids, so they render after that block and before the next), blocks } */
const PLAN = [
  // ---- /project (W2.2, W2.3) — after the last existing block (sort 4) -----
  ['project', 4, [
    legacy('The figures in this section were last updated on the previous website on 31 December 2024.'),
    { type: 'timeline', data: {
      heading: 'Project timeline as previously published', intro: '',
      items: [
        { date: 'December 2018', datetime: '2018-12-06', title: 'PPP contract signed', description: '<p>The PPP contract was signed between the Roads and Highways Department and DBEDC.</p>', image: '', progress: 0 },
        { date: 'November 2020', datetime: '2020-11-01', title: 'Construction begins', description: '<p>Initial construction works commenced, with final construction officially starting in May 2022 after the Appointed Date was established.</p>', image: '', progress: 0 },
        { date: '15 May 2022', datetime: '2022-05-15', title: 'Appointed Date', description: '<p>Established as the official Appointed Date, marking the formal commencement of the construction period.</p>', image: '', progress: 0 },
        { date: 'March 2025', datetime: '2025-03-27', title: 'First section opening', description: '<p>The section from K4 to K22 was put into trial operation during the Eid-ul-Fitr period from 27 March to 5 April 2025.</p>', image: '', progress: 0 },
        { date: 'December 2025 (target)', datetime: '2025-12-01', title: 'Second section opening', description: '<p>The section from K22 to K35, including service roads, was targeted to open by December 2025.</p>', image: '', progress: 0 },
      ],
    } },
    rich('Progress by category, 31 December 2024', '<p>Overall progress was reported as 69.11%. The breakdown below is as the previous website published it.</p>'),
    stats([['93.9', '%', 'General'], ['82.89', '%', 'Earthwork'], ['53.95', '%', 'Pavement'], ['100', '%', 'Foundation'], ['90.9', '%', 'Structure'], ['54.21', '%', 'Incidental']]),
    cards('Key achievements as previously published', 'Reported at 31 December 2024.', [
      ['Completed foundations', 'Foundation', 'All foundation work has been completed (100%).'],
      ['Major structures', 'Structure', 'Structural work at 90.9% completion, including the Ulukhula, Nagda, Mirer Bazar and Dhirasram overpasses.'],
      ['Road construction', 'Earthwork', 'Over 31.76 km of embankment fill for the toll road and 40.44 km for service roads completed.'],
      ['Pavement layers', 'Pavement', 'Approximately 22 km of asphalt layers (AC-20 and AC-13) completed for toll roads and 28 km for service roads.'],
      ['Box culverts', 'Structure', '62 of 73 planned box culverts completed.'],
    ]),
    cards('Specifications as previously published', '', [
      ['48.07 km', 'Length', 'Total expressway length from Joydebpur to Madanpur.'],
      ['4 lanes', 'Main carriageway', '9.7 m width (7.3 m plus a 2.4 m shoulder), design speed 80 km/h.'],
      ['2 lanes', 'Service roads', '5.8 m width (7.3 m every 5 km in the RAJUK section), design speed 50 km/h.'],
      ['6', 'Toll plazas', 'Placed along the expressway.'],
      ['100+', 'Major structures', 'Including 5 river bridges, 3 minor bridges, 4 flyovers, 45 underpasses and 87 culverts.'],
      ['25 years', 'Contract period', 'Design, Build, Finance, Operate, Maintain, Transfer (DBFOMT).'],
      ['US$412 million', 'Investment', 'Total initial project investment.'],
      ['12 · 7 · 27', 'Bridges · flyovers · underpasses', 'As listed on the previous project overview; the structures count above lists them differently. Neither is confirmed.'],
    ]),
    cards('Project objectives as previously published', '', [
      ['An efficient corridor around Dhaka', '1', 'Create an efficient transportation corridor around the capital.'],
      ['Less congestion in the capital', '2', 'Reduce traffic congestion in Dhaka.'],
      ['Four national highways connected', '3', 'Connect N1, N2, N3 and N4.'],
      ['Better logistics', '4', 'Enhance logistics and supply-chain efficiency.'],
      ['Development along the route', '5', 'Promote economic development in adjoining areas.'],
      ['Modern expressway standards', '6', 'Introduce modern expressway standards to Bangladesh.'],
      ['Lower travel time and cost', '7', 'Reduce travel time and transportation costs.'],
      ['Safer roads', '8', 'Improve road safety with controlled access.'],
    ]),
    { type: 'media-prose', data: {
      image: '/semi.webp', side: 'right', heading: 'Semi-rigid pavement',
      body: '<p>A hybrid pavement system combining flexibility and durability, introduced to Bangladesh on this project.</p><p><strong>Technical advantages</strong></p>'
        + ul(['High load-bearing capacity for heavy commercial vehicles', 'Enhanced durability compared to conventional asphalt pavements', 'Better resistance to rutting and deformation under tropical conditions', 'Reduced maintenance requirements over the project lifecycle'])
        + '<p><strong>Construction process</strong></p>'
        + ul(['Precision thickness control using advanced equipment', 'Specialised curing techniques to prevent premature cracking', 'Continuous quality monitoring during construction', 'Computerised mix design for optimal performance']),
      caption: '', linkLabel: '', linkHref: '',
    } },
    { type: 'media-prose', data: {
      image: '/cp.webp', side: 'left', heading: 'Technology benefits as previously published',
      body: ul(['<strong>Extended lifespan</strong> — 30+ years of service life compared to 15–20 years for conventional pavements', '<strong>Cost efficiency</strong> — higher initial investment but significantly lower lifecycle maintenance costs', '<strong>Weather resistance</strong> — superior performance during monsoon seasons and extreme temperature variations']),
      caption: '', linkLabel: '', linkHref: '',
    } },
    rich('Vision and mission as previously published', '<p><strong>Vision.</strong> To transform Bangladesh’s transportation infrastructure by creating a world-class expressway that serves as a model for future development projects, enhancing connectivity and supporting economic growth.</p><p><strong>Mission.</strong> To deliver a transformative expressway that sets new standards for safety, efficiency and sustainability in Bangladesh’s transportation network — implementing innovative engineering solutions, fostering knowledge transfer and capacity building, and creating opportunities for economic development along the corridor.</p>'),
  ]],

  // ---- /about/governance (W2.5) — after the card-grid at 2, before the
  // second callout at 3 (roster) and the cta-band at 4. -----------------------
  ['about/governance', 2, [
    legacy('The partner descriptions, links and financing figures below are as the previous website published them.'),
    stats([['1st', '', 'Road PPP in Bangladesh'], ['7', '', 'Organisations in partnership'], ['25', 'years', 'Concession — design, build, finance, operate, maintain, transfer']]),
    cards('Partners as previously published', '', [
      ['Sichuan Road & Bridge Group (SRBG)', 'Lead investor and contractor', 'Lead private investor with a 60% equity stake; main EPC contractor; introduced semi-rigid pavement and reinforced retaining walls. Member of Shudao Investment Group (SDIG). Employs over 1,000 local workers.'],
      ['Shamim Enterprise Ltd (SEL)', 'Local partner, 30%', 'Major local private partner providing local knowledge, construction expertise, regulatory compliance and local supply chains.'],
      ['UDC Construction Ltd', 'Local partner, 10%', 'Second Bangladeshi partner, providing additional local construction capacity and stakeholder coordination. The two local partners together hold 40%.'],
      ['Public-Private Partnership Authority (PPPA)', 'PPP facilitator', 'Approved the project in principle in 2012 and helped structure the PPP agreement through to contract signing in December 2018. Operates under the Prime Minister’s Office.'],
      ['Roads and Highways Department (RHD)', 'Contracting authority', 'Public-sector client and concession grantor; provides land acquisition and resettlement and contributes viability gap funding. Receives the asset back after the 25-year concession.'],
      ['China Development Bank (CDB)', 'Major foreign lender', 'Extended a ৳1,614 crore loan to DBEDC under a financing agreement signed in April 2021, completing the US$412 million financing package.'],
      ['Bangladesh Infrastructure Finance Fund Ltd (BIFFL)', 'Domestic lender', 'State-owned infrastructure financier; loan facility of ৳1,075 crore to DBEDC, with a first instalment of ৳42.5 crore disbursed in April 2022, under a 2020 ADB-backed credit line.'],
    ]),
    rich('Financing as previously published', '<p>Viability gap funding from the Government of Bangladesh was initially ৳224 crore and later revised to ৳674 crore. China Development Bank lent ৳1,614 crore (agreement signed April 2021); BIFFL lent ৳1,075 crore, with a first instalment of ৳42.5 crore disbursed in April 2022. The total package was described as US$412 million (about ৳3,585–3,723 crore).</p><p>Partner websites as listed: <a href="https://www.scrbg.com" rel="noopener">scrbg.com</a>, <a href="https://www.udccl.com.bd" rel="noopener">udccl.com.bd</a>, <a href="https://www.rhd.gov.bd" rel="noopener">rhd.gov.bd</a>, <a href="https://www.cdb.com.cn" rel="noopener">cdb.com.cn</a>, <a href="https://www.pppo.gov.bd" rel="noopener">pppo.gov.bd</a>, <a href="https://www.biffl.org.bd" rel="noopener">biffl.org.bd</a>.</p>'),
    cards('Governance structure as previously published', '', [
      ['Board of Directors', 'Strategy', 'Representatives of all equity partners (SRBG, SEL and UDC) in proportion to shareholding; provides strategic direction and approves major decisions.'],
      ['Executive management', 'Operations', 'Led by the CEO with the COO and general managers: day-to-day operations, project delivery, stakeholder management and performance reporting.'],
      ['Government oversight', 'Compliance', 'The RHD Project Director monitors progress, ensures compliance with the concession agreement and is the liaison between DBEDC and government agencies.'],
    ]),
  ]],

  // ---- /about (W2.6, the "Chinese contribution" route) — after the card-grid
  // at 3, before the cta-band at 4. ------------------------------------------
  ['about', 3, [
    legacy('The account of the Chinese partners’ contribution below is as the previous website published it.'),
    stats([['US$412', 'M', 'Total project investment'], ['60', '%', 'SRBG equity stake'], ['1,000', '+', 'Jobs created']]),
    cards('Chinese contribution as previously published', '', [
      ['Financial investment', 'Finance', 'SRBG holds a 60% majority stake, about US$240 million in equity; China Development Bank provided a ৳1,614 crore (about US$190 million) loan; financial close in April 2021.'],
      ['Technical expertise', 'Engineering', 'Semi-rigid pavement technology and reinforced retaining wall systems, both for the first time in Bangladesh, with international quality-control standards and traffic management systems.'],
      ['Construction management', 'Delivery', 'Modern project management systems, construction planning and scheduling, environmental management plans and quality-assurance protocols.'],
      ['Knowledge transfer', 'Capacity', 'Training programmes for Bangladeshi engineers in China and on site; modern highway construction methodologies; operations and maintenance knowledge.'],
      ['Belt and Road Initiative', 'Cooperation', 'Featured as a practical cooperation project at the Third Belt and Road Forum; supports regional connectivity across South Asia.'],
      ['Social responsibility', 'Community', 'Multimedia classrooms donated to primary schools; support for local orphanages; COVID-19 prevention supplies; welfare programmes for local workers.'],
    ]),
    stats([['50', '+', 'Engineers trained'], ['2', '', 'New technologies introduced'], ['3', '', 'Community programmes']]),
    rich('Semi-rigid pavement case study as previously published', '<p>The semi-rigid pavement method combines the flexibility of asphalt with the strength of concrete. SRBG implemented it and trained Bangladeshi engineers in China and on site. Benefits as listed: road life extended by up to 30% compared with conventional methods; effective use of Bangladesh’s abundant fine sand; lower lifecycle costs through less frequent repairs; reduced use of traditional brick materials. Technical documentation was provided in English and Bengali.</p>'),
  ]],

  // ---- /sustainability (W2.7, the "Economic impact" route) — after the
  // callout at 2, before the cta-band at 3. -----------------------------------
  ['sustainability', 2, [
    legacy('The economic-impact figures below are as the previous website published them; several were projections.'),
    stats([['75', '%', 'Travel time reduction'], ['1,000', '+', 'Jobs created'], ['US$412', 'M', 'Total investment'], ['4', '', 'National highways connected']]),
    rich('Trade and commerce as previously published', '<p>The expressway was described as a freight corridor linking Gazipur’s manufacturing hubs with the southern ports via Narayanganj, cutting freight transit times by up to 75%, with exports projected to rise by 0.8% of GDP and transport costs to fall by an estimated 15–20%.</p>'),
    stats([['+65', '%', 'Freight transport efficiency'], ['+42', '%', 'Regional business growth'], ['+85', '%', 'Industrial land value'], ['+120', '', 'New business establishments']]),
    stats([['2,000', '+', 'Direct jobs at peak construction'], ['10,000', '+', 'Indirect jobs supported'], ['500', '+', 'Workers trained in new technologies']]),
    rich('Regional development as previously published', '<p>Growth areas listed: Purbachal Economic Zone, 46% land value increase; Gazipur Industrial Corridor, 38% business growth; Narayanganj Logistics Hub, 52% capacity expansion. Long-term effects projected: decentralisation of economic activity from the Dhaka core, specialised industrial clusters along the route, higher property values and local tax revenues, and integration with other planned infrastructure.</p>'),
  ]],

  // ---- /travel/route (W2.4 key locations) — after the interchange table at 3.
  ['travel/route', 3, [
    legacy('The five location descriptions below are as the previous website published them; the interchange table above is the live record.'),
    cards('Key locations as previously described', '', [
      ['Joydebpur', 'Northern terminus', 'Starting point in Gazipur District linking to N4 (Dhaka–Mymensingh/Tangail) and N3 (Dhaka–Mymensingh); a major interchange with access to industrial zones.'],
      ['Vogra', 'Toll plaza', 'First section opened for Eid 2025; K3+900 marks the beginning of the partial toll collection point. Connection to local roads.'],
      ['Kanchan / Purbachal', 'Interchange', 'Access to the Purbachal New Town at the K22+00 marker.'],
      ['Debogram / Bhulta', 'Interchange with N2', 'Mid-route interchange with the Dhaka–Sylhet highway, connecting the expressway to the eastern regions; service area.'],
      ['Madanpur', 'Southern terminus', 'Endpoint in Narayanganj District connecting to N1 towards Chattogram port, with links to N2 by nearby connections.'],
    ]),
  ]],

  // ---- /travel/facilities (W2.4 facilities) — after the facility list at 2.
  ['travel/facilities', 2, [
    legacy('The facilities described below are as the previous website published them; the list above is the live record.'),
    cards('Facilities as previously described', '', [
      ['Rest areas', 'Service areas', 'Two service areas, one in each direction, with restrooms and washrooms, food outlets and prayer rooms.'],
      ['Toll stations', 'Toll plazas', 'Five toll plazas with multiple lanes, electronic toll collection capability and clear rate display.'],
      ['Emergency services', 'Round the clock', 'Emergency call points every 2 km, ambulance services, towing and recovery.'],
    ]),
  ]],

  // ---- /travel/status (W2.4 partial opening) — after the interchange table at 4.
  ['travel/status', 4, [
    legacy('An 18 km section from Vogra (Gazipur) to Kanchan (K3+900 to K22+00) was opened on a trial basis in late March 2025 for Eid-ul-Fitr travellers, toll-free during the Eid period, benefiting over 2 million travellers, with construction reported at 68% and completion targeted for July 2025.'),
  ]],

  // ---- /travel/toll (W2.4 full-distance tolls) — after prohibited-vehicles at 3.
  ['travel/toll', 3, [
    legacy('The full-corridor tolls below are as the previous website published them for the whole 48 km; the table above is the rate in force on the open section. The per-kilometre formula shown is the one DBEDC used; the origin-destination matrix on this site derives from the same formula.'),
    { type: 'data-table', data: {
      heading: 'Full-corridor tolls as previously published', intro: '',
      caption: 'Vehicle classes, full-distance toll and the published formula (per-km rate × distance + 50, plus 15%).',
      columns: [{ label: 'Vehicle class', numeric: 0 }, { label: 'Full distance (৳)', numeric: 1 }, { label: 'Formula', numeric: 0 }, { label: 'Open section (৳)', numeric: 1 }],
      rows: [
        ['Large truck, 3+ axles (trailer), 15–25 t', '1,600', '(33.06 × km + 50) × 115%', '740'],
        ['Large/heavy truck, 2–3 axles, 7+ t', '1,280', '(26.45 × km + 50) × 115%', '610'],
        ['Medium truck, 2+ axles, 5–7 t', '800', '(16.53 × km + 50) × 115%', '400'],
        ['Large bus, 31+ seats', '600', '(12.40 × km + 50) × 115%', '310'],
        ['Small truck, 3 t', '480', '(9.92 × km + 50) × 115%', '260'],
        ['Minibus, coaster', '360', '(7.44 × km + 50) × 115%', '210'],
        ['Microbus', '320', '(6.61 × km + 50) × 115%', '190'],
        ['Pick-up, jeep, wrecker, crane', '280', '(5.79 × km + 50) × 115%', '180'],
        ['Sedan car', '200', '(4.31 × km + 50) × 115%', '150'],
      ].map((cells) => ({ cells })),
      rowHeaderColumn: 0, note: 'Previous website, routes-facilities page. Not a published tariff notification.',
    } },
  ]],
];

const out = [];
out.push(`-- 24-legacy-content.sql — the previous website's structured facts, as blocks (W2.2–W2.7).
--
-- GENERATED by scripts/generate-legacy-content.mjs; regenerate, do not edit.
--
-- The old site's project timeline, the December 2024 progress figures, the
-- specification tiles, the partners and their financing, the Chinese
-- contribution, the economic-impact figures, the key locations, facilities
-- and full-corridor tolls, placed on the pages that replaced those routes.
-- English only, as the source was; bn and zh fall back to English with the
-- site's "shown in English" notice. Every group opens with a \`callout\` of
-- tone \`legacy\` — the standard "recovered from the previous website, not
-- confirmed as current" provenance — so nothing here reads as verified.
--
-- Pages are resolved by SLUG. New blocks take the sort_order of the block
-- they follow, with higher ids, so they render after it and before the next
-- (order is sort_order, id); the editor renumbers on the next drag.
-- Idempotent: INSERT IGNORE. ID map: blocks ${FIRST_ID}+.
`);

for (const [slug, after, blocks] of PLAN) {
  out.push(`\n-- /${slug}: ${blocks.length} blocks after sort_order ${after}`);
  out.push(`SET @p = (SELECT \`id\` FROM \`pages\` WHERE \`slug\` = ${q(slug)} LIMIT 1);`);
  for (const b of blocks) {
    const id = nextId++;
    out.push(`INSERT IGNORE INTO \`blocks\` (\`id\`, \`page_id\`, \`type\`, \`sort_order\`, \`settings\`, \`status\`)
  SELECT ${id}, @p, ${q(b.type)}, ${after}, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;`);
    out.push(`INSERT IGNORE INTO \`block_translations\` (\`block_id\`, \`locale\`, \`data\`, \`status\`)
  SELECT ${id}, 'en', ${json(b.data)}, 'published' FROM DUAL WHERE @p IS NOT NULL;`);
  }
}
process.stdout.write(`${out.join('\n')}\n`);
