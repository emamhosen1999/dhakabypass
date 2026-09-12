-- 29-legacy-as-current.sql — the recovered facts read as current information.
--
-- DBEDC's decision, 12 September 2026: "imagine all information as current;
-- admins will update later." Until now every fact recovered from the previous
-- website carried a "Previous website information" notice and headings said
-- "as previously published". This file removes that framing everywhere:
--
--   1. The 24-legacy-content blocks are replaced by the same facts written in
--      the present tense, with no notice block (generated body below).
--   2. The six older notice blocks from 03-content-recovery / 22 are either
--      deleted (where the new blocks already say it better) or turned into
--      plain rich-text with the disclaimer paragraph removed, in all three
--      languages. Located by page, kind and a phrase of their own text, never
--      by id, because ids differ between the seed and a re-seeded database.
--
-- "Not yet published" notices (tone `pending`) are NOT touched: those mark
-- information DBEDC has still to supply, which is a different thing from a
-- fact that merely came from the old site.
--
-- Idempotent: the delete-then-insert is by fixed ids; the conversions are
-- guarded on the notice text still being present.
-- Replace the blocks 24-legacy-content.sql placed (ids 400-432 in its first
-- form, 400-425 now): same facts, current tense, no provenance notices.
DELETE FROM `block_translations` WHERE `block_id` BETWEEN 400 AND 432;
DELETE FROM `blocks` WHERE `id` BETWEEN 400 AND 432;

-- /project: 9 blocks after sort_order 4
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'project' LIMIT 1);
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 400, @p, 'timeline', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 400, 'en', '{"heading":"Project timeline","intro":"","items":[{"date":"December 2018","datetime":"2018-12-06","title":"PPP contract signed","description":"<p>The PPP contract was signed between the Roads and Highways Department and DBEDC.</p>","image":"","progress":0},{"date":"November 2020","datetime":"2020-11-01","title":"Construction begins","description":"<p>Initial construction works commenced, with final construction officially starting in May 2022 after the Appointed Date was established.</p>","image":"","progress":0},{"date":"15 May 2022","datetime":"2022-05-15","title":"Appointed Date","description":"<p>Established as the official Appointed Date, marking the formal commencement of the construction period.</p>","image":"","progress":0},{"date":"March 2025","datetime":"2025-03-27","title":"First section opening","description":"<p>The section from K4 to K22 was put into trial operation during the Eid-ul-Fitr period from 27 March to 5 April 2025.</p>","image":"","progress":0},{"date":"December 2025 (target)","datetime":"2025-12-01","title":"Second section opening","description":"<p>The section from K22 to K35, including service roads, was targeted to open by December 2025.</p>","image":"","progress":0}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 401, @p, 'rich-text', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 401, 'en', '{"heading":"Progress by category","body":"<p>Overall progress: 69.11% (31 December 2024).</p>"}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 402, @p, 'stat-row', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 402, 'en', '{"stats":[{"value":"93.9","unit":"%","label":"General"},{"value":"82.89","unit":"%","label":"Earthwork"},{"value":"53.95","unit":"%","label":"Pavement"},{"value":"100","unit":"%","label":"Foundation"},{"value":"90.9","unit":"%","label":"Structure"},{"value":"54.21","unit":"%","label":"Incidental"}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 403, @p, 'card-grid', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 403, 'en', '{"heading":"Key achievements","intro":"At 31 December 2024.","items":[{"title":"Completed foundations","meta":"Foundation","body":"All foundation work has been completed (100%)."},{"title":"Major structures","meta":"Structure","body":"Structural work at 90.9% completion, including the Ulukhula, Nagda, Mirer Bazar and Dhirasram overpasses."},{"title":"Road construction","meta":"Earthwork","body":"Over 31.76 km of embankment fill for the toll road and 40.44 km for service roads completed."},{"title":"Pavement layers","meta":"Pavement","body":"Approximately 22 km of asphalt layers (AC-20 and AC-13) completed for toll roads and 28 km for service roads."},{"title":"Box culverts","meta":"Structure","body":"62 of 73 planned box culverts completed."}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 404, @p, 'card-grid', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 404, 'en', '{"heading":"Specifications","intro":"","items":[{"title":"48.07 km","meta":"Length","body":"Total expressway length from Joydebpur to Madanpur."},{"title":"4 lanes","meta":"Main carriageway","body":"9.7 m width (7.3 m plus a 2.4 m shoulder), design speed 80 km/h."},{"title":"2 lanes","meta":"Service roads","body":"5.8 m width (7.3 m every 5 km in the RAJUK section), design speed 50 km/h."},{"title":"6","meta":"Toll plazas","body":"Placed along the expressway."},{"title":"100+","meta":"Major structures","body":"Including 5 river bridges, 3 minor bridges, 4 flyovers, 45 underpasses and 87 culverts."},{"title":"25 years","meta":"Contract period","body":"Design, Build, Finance, Operate, Maintain, Transfer (DBFOMT)."},{"title":"US$412 million","meta":"Investment","body":"Total initial project investment."},{"title":"12 · 7 · 27","meta":"Bridges · flyovers · underpasses","body":"Major bridges, flyovers and underpasses along the route."}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 405, @p, 'card-grid', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 405, 'en', '{"heading":"Project objectives","intro":"","items":[{"title":"An efficient corridor around Dhaka","meta":"1","body":"Create an efficient transportation corridor around the capital."},{"title":"Less congestion in the capital","meta":"2","body":"Reduce traffic congestion in Dhaka."},{"title":"Four national highways connected","meta":"3","body":"Connect N1, N2, N3 and N4."},{"title":"Better logistics","meta":"4","body":"Enhance logistics and supply-chain efficiency."},{"title":"Development along the route","meta":"5","body":"Promote economic development in adjoining areas."},{"title":"Modern expressway standards","meta":"6","body":"Introduce modern expressway standards to Bangladesh."},{"title":"Lower travel time and cost","meta":"7","body":"Reduce travel time and transportation costs."},{"title":"Safer roads","meta":"8","body":"Improve road safety with controlled access."}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 406, @p, 'media-prose', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 406, 'en', '{"image":"/semi.webp","side":"right","heading":"Semi-rigid pavement","body":"<p>A hybrid pavement system combining flexibility and durability, introduced to Bangladesh on this project.</p><p><strong>Technical advantages</strong></p><ul><li>High load-bearing capacity for heavy commercial vehicles</li><li>Enhanced durability compared to conventional asphalt pavements</li><li>Better resistance to rutting and deformation under tropical conditions</li><li>Reduced maintenance requirements over the project lifecycle</li></ul><p><strong>Construction process</strong></p><ul><li>Precision thickness control using advanced equipment</li><li>Specialised curing techniques to prevent premature cracking</li><li>Continuous quality monitoring during construction</li><li>Computerised mix design for optimal performance</li></ul>","caption":"","linkLabel":"","linkHref":""}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 407, @p, 'media-prose', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 407, 'en', '{"image":"/cp.webp","side":"left","heading":"Technology benefits","body":"<ul><li><strong>Extended lifespan</strong> — 30+ years of service life compared to 15–20 years for conventional pavements</li><li><strong>Cost efficiency</strong> — higher initial investment but significantly lower lifecycle maintenance costs</li><li><strong>Weather resistance</strong> — superior performance during monsoon seasons and extreme temperature variations</li></ul>","caption":"","linkLabel":"","linkHref":""}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 408, @p, 'rich-text', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 408, 'en', '{"heading":"Vision and mission","body":"<p><strong>Vision.</strong> To transform Bangladesh’s transportation infrastructure by creating a world-class expressway that serves as a model for future development projects, enhancing connectivity and supporting economic growth.</p><p><strong>Mission.</strong> To deliver a transformative expressway that sets new standards for safety, efficiency and sustainability in Bangladesh’s transportation network — implementing innovative engineering solutions, fostering knowledge transfer and capacity building, and creating opportunities for economic development along the corridor.</p>"}', 'published' FROM DUAL WHERE @p IS NOT NULL;

-- /about/governance: 4 blocks after sort_order 2
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'about/governance' LIMIT 1);
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 409, @p, 'stat-row', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 409, 'en', '{"stats":[{"value":"1st","unit":"","label":"Road PPP in Bangladesh"},{"value":"7","unit":"","label":"Organisations in partnership"},{"value":"25","unit":"years","label":"Concession — design, build, finance, operate, maintain, transfer"}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 410, @p, 'card-grid', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 410, 'en', '{"heading":"Partners","intro":"","items":[{"title":"Sichuan Road & Bridge Group (SRBG)","meta":"Lead investor and contractor","body":"Lead private investor with a 60% equity stake; main EPC contractor; introduced semi-rigid pavement and reinforced retaining walls. Member of Shudao Investment Group (SDIG). Employs over 1,000 local workers."},{"title":"Shamim Enterprise Ltd (SEL)","meta":"Local partner, 30%","body":"Major local private partner providing local knowledge, construction expertise, regulatory compliance and local supply chains."},{"title":"UDC Construction Ltd","meta":"Local partner, 10%","body":"Second Bangladeshi partner, providing additional local construction capacity and stakeholder coordination. The two local partners together hold 40%."},{"title":"Public-Private Partnership Authority (PPPA)","meta":"PPP facilitator","body":"Approved the project in principle in 2012 and helped structure the PPP agreement through to contract signing in December 2018. Operates under the Prime Minister’s Office."},{"title":"Roads and Highways Department (RHD)","meta":"Contracting authority","body":"Public-sector client and concession grantor; provides land acquisition and resettlement and contributes viability gap funding. Receives the asset back after the 25-year concession."},{"title":"China Development Bank (CDB)","meta":"Major foreign lender","body":"Extended a ৳1,614 crore loan to DBEDC under a financing agreement signed in April 2021, completing the US$412 million financing package."},{"title":"Bangladesh Infrastructure Finance Fund Ltd (BIFFL)","meta":"Domestic lender","body":"State-owned infrastructure financier; loan facility of ৳1,075 crore to DBEDC, with a first instalment of ৳42.5 crore disbursed in April 2022, under a 2020 ADB-backed credit line."}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 411, @p, 'rich-text', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 411, 'en', '{"heading":"Financing","body":"<p>Viability gap funding from the Government of Bangladesh was initially ৳224 crore and later revised to ৳674 crore. China Development Bank lent ৳1,614 crore (agreement signed April 2021); BIFFL lent ৳1,075 crore, with a first instalment of ৳42.5 crore disbursed in April 2022. The total package is US$412 million (about ৳3,585–3,723 crore).</p><p>Partner websites: <a href=\\"https://www.scrbg.com\\" rel=\\"noopener\\">scrbg.com</a>, <a href=\\"https://www.udccl.com.bd\\" rel=\\"noopener\\">udccl.com.bd</a>, <a href=\\"https://www.rhd.gov.bd\\" rel=\\"noopener\\">rhd.gov.bd</a>, <a href=\\"https://www.cdb.com.cn\\" rel=\\"noopener\\">cdb.com.cn</a>, <a href=\\"https://www.pppo.gov.bd\\" rel=\\"noopener\\">pppo.gov.bd</a>, <a href=\\"https://www.biffl.org.bd\\" rel=\\"noopener\\">biffl.org.bd</a>.</p>"}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 412, @p, 'card-grid', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 412, 'en', '{"heading":"Governance structure","intro":"","items":[{"title":"Board of Directors","meta":"Strategy","body":"Representatives of all equity partners (SRBG, SEL and UDC) in proportion to shareholding; provides strategic direction and approves major decisions."},{"title":"Executive management","meta":"Operations","body":"Led by the CEO with the COO and general managers: day-to-day operations, project delivery, stakeholder management and performance reporting."},{"title":"Government oversight","meta":"Compliance","body":"The RHD Project Director monitors progress, ensures compliance with the concession agreement and is the liaison between DBEDC and government agencies."}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;

-- /about: 4 blocks after sort_order 3
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'about' LIMIT 1);
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 413, @p, 'stat-row', 3, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 413, 'en', '{"stats":[{"value":"US$412","unit":"M","label":"Total project investment"},{"value":"60","unit":"%","label":"SRBG equity stake"},{"value":"1,000","unit":"+","label":"Jobs created"}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 414, @p, 'card-grid', 3, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 414, 'en', '{"heading":"Chinese contribution","intro":"","items":[{"title":"Financial investment","meta":"Finance","body":"SRBG holds a 60% majority stake, about US$240 million in equity; China Development Bank provided a ৳1,614 crore (about US$190 million) loan; financial close in April 2021."},{"title":"Technical expertise","meta":"Engineering","body":"Semi-rigid pavement technology and reinforced retaining wall systems, both for the first time in Bangladesh, with international quality-control standards and traffic management systems."},{"title":"Construction management","meta":"Delivery","body":"Modern project management systems, construction planning and scheduling, environmental management plans and quality-assurance protocols."},{"title":"Knowledge transfer","meta":"Capacity","body":"Training programmes for Bangladeshi engineers in China and on site; modern highway construction methodologies; operations and maintenance knowledge."},{"title":"Belt and Road Initiative","meta":"Cooperation","body":"Featured as a practical cooperation project at the Third Belt and Road Forum; supports regional connectivity across South Asia."},{"title":"Social responsibility","meta":"Community","body":"Multimedia classrooms donated to primary schools; support for local orphanages; COVID-19 prevention supplies; welfare programmes for local workers."}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 415, @p, 'stat-row', 3, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 415, 'en', '{"stats":[{"value":"50","unit":"+","label":"Engineers trained"},{"value":"2","unit":"","label":"New technologies introduced"},{"value":"3","unit":"","label":"Community programmes"}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 416, @p, 'rich-text', 3, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 416, 'en', '{"heading":"Semi-rigid pavement case study","body":"<p>The semi-rigid pavement method combines the flexibility of asphalt with the strength of concrete. SRBG implemented it and trained Bangladeshi engineers in China and on site. Benefits: road life extended by up to 30% compared with conventional methods; effective use of Bangladesh’s abundant fine sand; lower lifecycle costs through less frequent repairs; reduced use of traditional brick materials. Technical documentation was provided in English and Bengali.</p>"}', 'published' FROM DUAL WHERE @p IS NOT NULL;

-- /sustainability: 5 blocks after sort_order 2
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'sustainability' LIMIT 1);
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 417, @p, 'stat-row', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 417, 'en', '{"stats":[{"value":"75","unit":"%","label":"Travel time reduction"},{"value":"1,000","unit":"+","label":"Jobs created"},{"value":"US$412","unit":"M","label":"Total investment"},{"value":"4","unit":"","label":"National highways connected"}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 418, @p, 'rich-text', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 418, 'en', '{"heading":"Trade and commerce","body":"<p>The expressway is a freight corridor linking Gazipur’s manufacturing hubs with the southern ports via Narayanganj, cutting freight transit times by up to 75%. Exports are projected to rise by 0.8% of GDP and transport costs to fall by an estimated 15–20%.</p>"}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 419, @p, 'stat-row', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 419, 'en', '{"stats":[{"value":"+65","unit":"%","label":"Freight transport efficiency"},{"value":"+42","unit":"%","label":"Regional business growth"},{"value":"+85","unit":"%","label":"Industrial land value"},{"value":"+120","unit":"","label":"New business establishments"}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 420, @p, 'stat-row', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 420, 'en', '{"stats":[{"value":"2,000","unit":"+","label":"Direct jobs at peak construction"},{"value":"10,000","unit":"+","label":"Indirect jobs supported"},{"value":"500","unit":"+","label":"Workers trained in new technologies"}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 421, @p, 'rich-text', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 421, 'en', '{"heading":"Regional development","body":"<p>Growth areas: Purbachal Economic Zone, 46% land value increase; Gazipur Industrial Corridor, 38% business growth; Narayanganj Logistics Hub, 52% capacity expansion. Long-term effects projected: decentralisation of economic activity from the Dhaka core, specialised industrial clusters along the route, higher property values and local tax revenues, and integration with other planned infrastructure.</p>"}', 'published' FROM DUAL WHERE @p IS NOT NULL;

-- /travel/route: 1 blocks after sort_order 3
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/route' LIMIT 1);
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 422, @p, 'card-grid', 3, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 422, 'en', '{"heading":"Key locations","intro":"","items":[{"title":"Joydebpur","meta":"Northern terminus","body":"Starting point in Gazipur District linking to N4 (Dhaka–Mymensingh/Tangail) and N3 (Dhaka–Mymensingh); a major interchange with access to industrial zones."},{"title":"Vogra","meta":"Toll plaza","body":"First section opened for Eid 2025; K3+900 marks the beginning of the partial toll collection point. Connection to local roads."},{"title":"Kanchan / Purbachal","meta":"Interchange","body":"Access to the Purbachal New Town at the K22+00 marker."},{"title":"Debogram / Bhulta","meta":"Interchange with N2","body":"Mid-route interchange with the Dhaka–Sylhet highway, connecting the expressway to the eastern regions; service area."},{"title":"Madanpur","meta":"Southern terminus","body":"Endpoint in Narayanganj District connecting to N1 towards Chattogram port, with links to N2 by nearby connections."}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;

-- /travel/facilities: 1 blocks after sort_order 2
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/facilities' LIMIT 1);
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 423, @p, 'card-grid', 2, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 423, 'en', '{"heading":"Facilities","intro":"","items":[{"title":"Rest areas","meta":"Service areas","body":"Two service areas, one in each direction, with restrooms and washrooms, food outlets and prayer rooms."},{"title":"Toll stations","meta":"Toll plazas","body":"Five toll plazas with multiple lanes, electronic toll collection capability and clear rate display."},{"title":"Emergency services","meta":"Round the clock","body":"Emergency call points every 2 km, ambulance services, towing and recovery."}]}', 'published' FROM DUAL WHERE @p IS NOT NULL;

-- /travel/status: 1 blocks after sort_order 4
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/status' LIMIT 1);
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 424, @p, 'rich-text', 4, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 424, 'en', '{"heading":"The first section","body":"<p>An 18 km section from Vogra (Gazipur) to Kanchan (K3+900 to K22+00) opened on a trial basis in late March 2025 for Eid-ul-Fitr travellers, toll-free during the Eid period, and carried over 2 million travellers.</p>"}', 'published' FROM DUAL WHERE @p IS NOT NULL;

-- /travel/toll: 1 blocks after sort_order 3
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/toll' LIMIT 1);
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 425, @p, 'data-table', 3, NULL, 'published' FROM DUAL WHERE @p IS NOT NULL;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT 425, 'en', '{"heading":"Full-corridor tolls","intro":"Tolls for the whole 48 km corridor by vehicle class, with the formula they follow: per-kilometre rate × distance plus ৳50, plus 15%.","caption":"Vehicle classes, full-distance toll, formula and the open-section toll.","columns":[{"label":"Vehicle class","numeric":0},{"label":"Full distance (৳)","numeric":1},{"label":"Formula","numeric":0},{"label":"Open section (৳)","numeric":1}],"rows":[{"cells":["Large truck, 3+ axles (trailer), 15–25 t","1,600","(33.06 × km + 50) × 115%","740"]},{"cells":["Large/heavy truck, 2–3 axles, 7+ t","1,280","(26.45 × km + 50) × 115%","610"]},{"cells":["Medium truck, 2+ axles, 5–7 t","800","(16.53 × km + 50) × 115%","400"]},{"cells":["Large bus, 31+ seats","600","(12.40 × km + 50) × 115%","310"]},{"cells":["Small truck, 3 t","480","(9.92 × km + 50) × 115%","260"]},{"cells":["Minibus, coaster","360","(7.44 × km + 50) × 115%","210"]},{"cells":["Microbus","320","(6.61 × km + 50) × 115%","190"]},{"cells":["Pick-up, jeep, wrecker, crane","280","(5.79 × km + 50) × 115%","180"]},{"cells":["Sedan car","200","(4.31 × km + 50) × 115%","150"]}],"rowHeaderColumn":0,"note":""}', 'published' FROM DUAL WHERE @p IS NOT NULL;

-- ---------------------------------------------------------------------------
-- The older notice blocks (tone `legacy`), by page and by a phrase of their own
-- text. @b is NULL when the block is gone or already converted.
-- ---------------------------------------------------------------------------

-- /about/governance: the concession/ownership notice. The Partners and
-- Financing blocks placed by 24 carry the same facts; this one goes.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'about/governance' AND b.`type` = 'callout' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.tone')) = 'legacy'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%25-year concession covering design%' LIMIT 1);
DELETE FROM `block_translations` WHERE `block_id` = @b AND @b IS NOT NULL;
DELETE FROM `blocks` WHERE `id` = @b AND @b IS NOT NULL;

-- /about/governance: the leadership roster -> plain rich-text "Leadership".
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'about/governance' AND b.`type` = 'callout' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.tone')) = 'legacy'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%Liu Xiaobo%' LIMIT 1);
UPDATE `block_translations` SET `data` = '{"heading":"Leadership","body":"<ul><li>Liu Xiaobo — Chairman</li><li>Xiao Zhiming — Chief Executive Officer</li><li>Md. Shafiqul Islam Akand — Chief Operating Officer</li><li>Syed Aslam Ali — Project Director, Roads and Highways Department</li></ul>"}' WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = '{"heading":"নেতৃত্ব","body":"<ul><li>Liu Xiaobo — চেয়ারম্যান</li><li>Xiao Zhiming — প্রধান নির্বাহী কর্মকর্তা</li><li>Md. Shafiqul Islam Akand — প্রধান পরিচালন কর্মকর্তা</li><li>Syed Aslam Ali — প্রকল্প পরিচালক, সড়ক ও জনপথ অধিদপ্তর</li></ul>"}' WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = '{"heading":"领导层","body":"<ul><li>Liu Xiaobo — 董事长</li><li>Xiao Zhiming — 首席执行官</li><li>Md. Shafiqul Islam Akand — 首席运营官</li><li>Syed Aslam Ali — 道路与公路局项目主任</li></ul>"}' WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;
UPDATE `blocks` SET `type` = 'rich-text' WHERE `id` = @b AND @b IS NOT NULL;

-- /grievances: "the previous website used info@dbedc.com" — the page now has
-- the grievance form and its contact call-to-action; this one goes.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'grievances' AND b.`type` = 'callout' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.tone')) = 'legacy'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%info@dbedc.com%' LIMIT 1);
DELETE FROM `block_translations` WHERE `block_id` = @b AND @b IS NOT NULL;
DELETE FROM `blocks` WHERE `id` = @b AND @b IS NOT NULL;

-- /project: the construction snapshot notice — the timeline, progress
-- figures and specifications placed by 24 carry it; this one goes.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'project' AND b.`type` = 'callout' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.tone')) = 'legacy'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%Construction snapshot dated 31 December 2024%' LIMIT 1);
DELETE FROM `block_translations` WHERE `block_id` = @b AND @b IS NOT NULL;
DELETE FROM `blocks` WHERE `id` = @b AND @b IS NOT NULL;

-- /safety: emergency assistance, stated as what the expressway provides.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'safety' AND b.`type` = 'callout' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.tone')) = 'legacy'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%emergency call points%' LIMIT 1);
UPDATE `block_translations` SET `data` = '{"heading":"Emergency assistance on the expressway","body":"<p>Emergency call points are placed every 2 km along the corridor. Ambulance, towing and recovery services are available round the clock. In an emergency, call the DBEDC emergency line shown at the foot of every page, or the national emergency service on 999, and follow the instructions of the roadside staff.</p>"}' WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = '{"heading":"এক্সপ্রেসওয়েতে জরুরি সহায়তা","body":"<p>করিডোর বরাবর প্রতি ২ কিলোমিটারে জরুরি কল পয়েন্ট রয়েছে। অ্যাম্বুলেন্স, টোয়িং ও উদ্ধার সেবা ২৪ ঘণ্টা পাওয়া যায়। জরুরি অবস্থায় প্রতিটি পাতার নিচে দেওয়া DBEDC জরুরি নম্বরে অথবা জাতীয় জরুরি সেবা ৯৯৯-এ কল করুন এবং সড়ক কর্মীদের নির্দেশনা মেনে চলুন।</p>"}' WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = '{"heading":"快速路上的紧急救助","body":"<p>沿线每 2 公里设有紧急呼叫点。救护车、拖车与救援服务全天候提供。遇到紧急情况，请拨打每页底部所示的 DBEDC 紧急电话或国家紧急服务 999，并听从路侧工作人员的指示。</p>"}' WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;
UPDATE `blocks` SET `type` = 'rich-text' WHERE `id` = @b AND @b IS NOT NULL;

-- /sustainability: community programmes, stated as current.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'sustainability' AND b.`type` = 'callout' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.tone')) = 'legacy'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%school support, community visits%' LIMIT 1);
UPDATE `block_translations` SET `data` = '{"heading":"Community and environment","body":"<p>DBEDC supports schools along the corridor, visits local communities, supplied relief materials during the pandemic, trains its workforce and runs construction quality-control programmes. The gallery holds photographs of construction work, a school plaque presentation and joint project ceremonies.</p><p>The environmental assessment, the environmental management plan and monitoring reports can be requested through the contact form.</p>"}' WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = '{"heading":"সমাজ ও পরিবেশ","body":"<p>DBEDC করিডোর বরাবর বিদ্যালয়গুলিকে সহায়তা করে, স্থানীয় জনপদ পরিদর্শন করে, মহামারির সময় ত্রাণসামগ্রী দিয়েছে, কর্মীদের প্রশিক্ষণ দেয় এবং নির্মাণের মান নিয়ন্ত্রণ কর্মসূচি পরিচালনা করে। গ্যালারিতে নির্মাণকাজ, বিদ্যালয়ে স্মারক প্রদান ও যৌথ প্রকল্প অনুষ্ঠানের ছবি রয়েছে।</p><p>পরিবেশ মূল্যায়ন, পরিবেশ ব্যবস্থাপনা পরিকল্পনা ও পর্যবেক্ষণ প্রতিবেদন যোগাযোগ ফরমের মাধ্যমে চাওয়া যায়।</p>"}' WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = '{"heading":"社区与环境","body":"<p>DBEDC 支持沿线学校、走访当地社区、在疫情期间提供物资援助、培训员工并开展施工质量管理。图库收录了施工、学校牌匾交接及联合项目活动的照片。</p><p>环境评估、环境管理计划与监测报告可通过联系表单申请。</p>"}' WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;
UPDATE `blocks` SET `type` = 'rich-text' WHERE `id` = @b AND @b IS NOT NULL;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('29-legacy-as-current');
