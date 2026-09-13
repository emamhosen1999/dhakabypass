-- 31-cms-consistency.sql — the CMS consistency audit (docs/audit/2026-09-12-cms-consistency-audit.md).
--
-- The rule: a fact is a record edited once; a block configures presentation.
-- This file gives the records the columns and rows the code now reads, and
-- takes out of the content every copy of a fact that a record already holds.
--
--   Schema
--     * toll_rates.sro_number / sro_date / sro_link — the gazette citation on
--       the rates it fixes (5.1), no longer typed on the toll-table block.
--     * interchanges.connects_to_labels — "connects to" per language (4.13).
--     * corridor_roads — the names and references of the roads the map
--       shows, per language (2.5/2.6), seeded from the RHD register the code
--       used to carry.
--   Settings
--     * contact.national_emergency_phone (999), corridor.road_code (N105),
--       neutral seo.site_title / seo.site_description where empty (2.1, 2.3).
--   Content
--     * Deleted: the retyped toll schedule on /travel/toll (5.6), the retyped
--       key locations on /travel/route (5.7), the facility cards on
--       /travel/facilities that contradict the interchange records (5.10).
--     * Statistics on home, about and project read their lengths and counts
--       from the records (5.9).
--     * Lengths, chainages and counts removed from prose that sits beside a
--       live block (5.8, 5.11-5.14).
--     * Built-in menu links seeded with a leading slash become the authored
--       form, so each reader gets their own language.
--
-- Everything is located by slug, type and phrase, never by id, and guarded on
-- the old wording still being present: a block an operator has since edited
-- is left alone. Safe to import twice.

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'toll_rates' AND COLUMN_NAME = 'sro_number');
SET @s = IF(@c = 0, 'ALTER TABLE `toll_rates` ADD COLUMN `sro_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `payment_methods`, ADD COLUMN `sro_date` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `sro_number`, ADD COLUMN `sro_link` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `sro_date`', 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'interchanges' AND COLUMN_NAME = 'connects_to_labels');
SET @s = IF(@c = 0, 'ALTER TABLE `interchanges` ADD COLUMN `connects_to_labels` json DEFAULT NULL AFTER `connects_to`', 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
UPDATE `interchanges` SET `connects_to_labels` = JSON_OBJECT('en', `connects_to`)
  WHERE `connects_to_labels` IS NULL AND `connects_to` <> '';

CREATE TABLE IF NOT EXISTS `corridor_roads` (
  `road_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `names` json NOT NULL,
  `source_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`road_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Road identifiers checked against RHD's road register and division list.
INSERT IGNORE INTO `corridor_roads` (`road_key`, `names`, `source_url`) VALUES
  ('N1', '{"en":"Dhaka–Chattogram Highway","bn":"ঢাকা–চট্টগ্রাম মহাসড়ক","zh":"达卡—吉大港公路"}', 'https://rhd.gov.bd/RoadDatabase/roadlrp.asp?RoadID=1585&RoadNo=N1'),
  ('N2', '{"en":"Dhaka–Sylhet Highway","bn":"ঢাকা–সিলেট মহাসড়ক","zh":"达卡—锡尔赫特公路"}', 'https://www.rhd.gov.bd/RoadDatabase/roaddetail.asp?RoadID=1479'),
  ('N3', '{"en":"Dhaka–Mymensingh Highway","bn":"ঢাকা–ময়মনসিংহ মহাসড়ক","zh":"达卡—迈门辛公路"}', 'https://www.rhd.gov.bd/OnlineRoadNetwork/roaddetail.asp?RoadID=1999&RoadNo=N3'),
  ('N4', '{"en":"Joydebpur–Tangail–Jamalpur Road","bn":"জয়দেবপুর–টাঙ্গাইল–জামালপুর সড়ক","zh":"焦伊代布尔—坦盖尔—贾马尔布尔公路"}', 'https://www.rhd.gov.bd/OnlineRoadNetwork/searchresult_2.asp?RoadNo=N'),
  ('N130', '{"en":"Beldi–Agla–Bartul Road"}', 'https://file-dhaka.portal.gov.bd/uploads/0ae15d50-88a2-48f6-99c6-74fd4cd9ed23/62a/cc7/5ae/62acc75aee04f589627353.pdf'),
  ('R301', '{"en":"Tongi–Kaliganj–Ghorashal–Panchdona Road","bn":"টঙ্গী–কালীগঞ্জ–ঘোড়াশাল–পাঁচদোনা সড়ক"}', 'https://www.rhd.gov.bd/RHDNews/Docs/Needs_Report_2021-2022_Final.pdf'),
  ('Z2043', '{"en":"Danga–Kanchan Bridge Link Road"}', 'https://file-dhaka.portal.gov.bd/uploads/0ae15d50-88a2-48f6-99c6-74fd4cd9ed23/62a/cc7/5ae/62acc75aee04f589627353.pdf');

-- ---------------------------------------------------------------------------
-- Settings (JSON values: a string carries its quotes)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO `site_settings` (`setting_key`, `value`) VALUES ('contact.national_emergency_phone', '"999"');
INSERT IGNORE INTO `site_settings` (`setting_key`, `value`) VALUES ('corridor.road_code', '"N105"');
INSERT IGNORE INTO `site_settings` (`setting_key`, `value`) VALUES ('seo.site_title', '{}'), ('seo.site_description', '{}');
UPDATE `site_settings` SET `value` = '{"en":"Dhaka Bypass Expressway","bn":"ঢাকা বাইপাস এক্সপ্রেসওয়ে","zh":"达卡绕城高速公路"}'
  WHERE `setting_key` = 'seo.site_title' AND JSON_LENGTH(`value`) = 0;
UPDATE `site_settings` SET `value` = '{"en":"Official website of the Dhaka Bypass Expressway: toll rates, open sections, traffic and travel information.","bn":"ঢাকা বাইপাস এক্সপ্রেসওয়ের অফিসিয়াল ওয়েবসাইট: টোল হার, খোলা অংশ, যান চলাচল ও ভ্রমণ তথ্য।","zh":"达卡绕城高速公路官方网站：通行费、通车路段、交通及出行信息。"}'
  WHERE `setting_key` = 'seo.site_description' AND JSON_LENGTH(`value`) = 0;

-- ---------------------------------------------------------------------------
-- Content: blocks that retype a record (deleted)
-- ---------------------------------------------------------------------------
-- 5.6 /travel/toll — "Full-corridor tolls", a hand-typed copy of toll_rates
-- and toll_od_rates beside the live schedule, matrix and calculator.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'travel/toll' AND b.`type` = 'data-table' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.heading')) = 'Full-corridor tolls' LIMIT 1);
DELETE FROM `block_translations` WHERE `block_id` = @b AND @b IS NOT NULL;
DELETE FROM `blocks` WHERE `id` = @b AND @b IS NOT NULL;

-- 5.7 /travel/route — "Key locations", chainages that contradict the
-- interchange records rendered by the table on the same page.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'travel/route' AND b.`type` = 'card-grid' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.heading')) = 'Key locations'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.items[1].body')) LIKE '%K3+900%' LIMIT 1);
DELETE FROM `block_translations` WHERE `block_id` = @b AND @b IS NOT NULL;
DELETE FROM `blocks` WHERE `id` = @b AND @b IS NOT NULL;

-- 5.10 /travel/facilities — "Two service areas … Five toll plazas", beside
-- the facility list that reads the interchange records.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'travel/facilities' AND b.`type` = 'card-grid' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.items[0].body')) LIKE 'Two service areas%' LIMIT 1);
DELETE FROM `block_translations` WHERE `block_id` = @b AND @b IS NOT NULL;
DELETE FROM `blocks` WHERE `id` = @b AND @b IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Content: statistics read from the records (5.9)
-- ---------------------------------------------------------------------------
-- home: corridor length, open length, tolled classes; "national highways
-- joined" stays a typed figure (no record holds it).
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'home' AND b.`type` = 'stat-row' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.stats[0].label')) = 'Corridor length'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.stats[2].label')) = 'Vehicle classes tolled' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_REMOVE(JSON_SET(`data`,
    '$.stats[0].source', 'corridor-published-length', '$.stats[1].source', 'corridor-open-length', '$.stats[2].source', 'toll-class-count'),
    '$.stats[2].value', '$.stats[1].value', '$.stats[0].value')
  WHERE `block_id` = @b AND @b IS NOT NULL AND JSON_EXTRACT(`data`, '$.stats[0].value') IS NOT NULL;

-- about: corridor length, open length.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'about' AND b.`type` = 'stat-row' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.stats[0].label')) = 'Corridor length'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.stats[1].label')) = 'Open to traffic' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_REMOVE(JSON_SET(`data`,
    '$.stats[0].source', 'corridor-published-length', '$.stats[1].source', 'corridor-open-length'),
    '$.stats[1].value', '$.stats[0].value')
  WHERE `block_id` = @b AND @b IS NOT NULL AND JSON_EXTRACT(`data`, '$.stats[0].value') IS NOT NULL;

-- project: published length, measured length, open length.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'project' AND b.`type` = 'stat-row' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.stats[0].label')) = 'Nominal length' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_REMOVE(JSON_SET(`data`,
    '$.stats[0].source', 'corridor-published-length', '$.stats[1].source', 'corridor-measured-length', '$.stats[2].source', 'corridor-open-length'),
    '$.stats[2].value', '$.stats[1].value', '$.stats[0].value')
  WHERE `block_id` = @b AND @b IS NOT NULL AND JSON_EXTRACT(`data`, '$.stats[0].value') IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Content: prose that restated a record (reworded)
-- ---------------------------------------------------------------------------
-- 5.11 /travel/toll page header: no length, and no longer the false claim
-- that full-corridor fares are unpublished (the matrix is on the same page).
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'travel/toll' AND b.`type` = 'page-header' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.lede')) LIKE '%have not yet been published%' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.lede', 'Toll rates for the section open to traffic, and the fare between any two toll plazas on the corridor.') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.lede', 'যান চলাচলের জন্য খোলা অংশের টোল হার, এবং করিডোরের যেকোনো দুটি টোল প্লাজার মধ্যকার ভাড়া।') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.lede', '已通车路段的通行费标准，以及走廊上任意两个收费站之间的通行费。') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

-- 5.12 home toll preview: the prohibited classes are a setting with a block
-- of their own; the class count is a record.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'home' AND b.`type` = 'toll-preview' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.intro')) LIKE '%may not use the expressway%' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.intro', 'Rates in force on the open section.', '$.linkLabel', 'All vehicle classes') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.intro', 'খোলা অংশে বর্তমানে কার্যকর টোল হার।', '$.linkLabel', 'সব যানবাহন শ্রেণি') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.intro', '已通车路段现行的通行费标准。', '$.linkLabel', '全部车型') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

-- 5.8 /travel/status: the history stays, the length and chainages go (the
-- open segment record is drawn by the progress bar and strip on the page).
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'travel/status' AND b.`type` = 'rich-text' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%K3+900 to K22+00%' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', '<p>The first section, from Vogra (Gazipur) to Kanchan, opened on a trial basis in late March 2025 for Eid-ul-Fitr travellers. It was toll-free during the Eid period and carried more than 2 million travellers. Its current extent and status are shown on this page.</p>') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;

-- 5.14 /project: the open length is a record.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'project' AND b.`type` = 'card-grid' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.items[0].title')) = '18 km carrying traffic' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[0].title', 'Open and carrying traffic') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[0].title', 'যান চলাচলের জন্য খোলা') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[0].title', '已通车路段') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

-- 5.14 /safety: no unverified call-point spacing, and the numbers are the
-- settings shown at the foot of every page rather than a copy in prose.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'safety' AND b.`type` = 'rich-text' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%Emergency call points are placed every 2 km%' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', '<p>Help is available on the open section at any time. In an emergency, call the DBEDC emergency line or the national emergency service — both numbers are at the foot of every page — and follow the instructions of the roadside staff. Ambulance, towing and recovery are arranged through the DBEDC emergency line.</p>') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', '<p>খোলা অংশে যেকোনো সময় সহায়তা পাওয়া যায়। জরুরি অবস্থায় DBEDC জরুরি নম্বরে অথবা জাতীয় জরুরি সেবায় কল করুন — দুটি নম্বরই প্রতিটি পাতার নিচে দেওয়া আছে — এবং সড়ক কর্মীদের নির্দেশনা মেনে চলুন। অ্যাম্বুলেন্স, টোয়িং ও উদ্ধার সেবা DBEDC জরুরি নম্বরের মাধ্যমে ব্যবস্থা করা হয়।</p>') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', '<p>已通车路段随时提供救助。遇到紧急情况，请拨打 DBEDC 紧急电话或国家紧急服务电话（两个号码均列于每页底部），并听从路侧工作人员的指示。救护车、拖车与救援服务通过 DBEDC 紧急电话安排。</p>') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

-- The corridor length and open length in prose beside the statistics that
-- now read them from the records: home, about, project, safety.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'home' AND b.`type` = 'media-prose' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%runs 48 kilometres down%' LIMIT 1);
UPDATE `block_translations` SET `data` = REPLACE(`data`, 'runs 48 kilometres down', 'runs down') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = REPLACE(`data`, 'পর্যন্ত ৪৮ কিলোমিটার বিস্তৃত', 'পর্যন্ত বিস্তৃত') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = REPLACE(`data`, '沿首都东缘延伸48公里，', '沿首都东缘延伸，') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'about' AND b.`type` = 'hero' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.standfirst')) LIKE '%the 48 kilometre expressway%' LIMIT 1);
UPDATE `block_translations` SET `data` = REPLACE(`data`, 'the 48 kilometre expressway', 'the expressway') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = REPLACE(`data`, 'পর্যন্ত ৪৮ কিলোমিটার এক্সপ্রেসওয়ে', 'পর্যন্ত এক্সপ্রেসওয়ে') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = REPLACE(`data`, '的 Madanpur 全长 48 公里快速路', '的 Madanpur 快速路') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'about' AND b.`type` = 'rich-text' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%the 48 kilometre route%' LIMIT 1);
UPDATE `block_translations` SET `data` = REPLACE(`data`, 'the 48 kilometre route', 'the route') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = REPLACE(`data`, '৪৮ কিলোমিটারের এই পথ', 'এই পথ') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = REPLACE(`data`, '这条全长 48 公里的通道', '这条通道') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'about' AND b.`type` = 'card-grid' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.items[1].body')) LIKE '18 kilometres are open to traffic today.%' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[1].body', 'The length open to traffic and the status of every section are published, and updated as work progresses.') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[1].body', 'যান চলাচলের জন্য খোলা দৈর্ঘ্য ও প্রতিটি অংশের অবস্থা প্রকাশ করা হয়, এবং কাজ এগোনোর সঙ্গে সঙ্গে হালনাগাদ করা হয়।') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[1].body', '通车里程及各路段状态均对外公布，并随工程进展更新。') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'project' AND b.`type` = 'hero' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.headline')) = '48 kilometres around the east of Dhaka' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.headline', 'A road around the east of Dhaka') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.headline', 'ঢাকার পূর্ব দিক ঘিরে একটি সড়ক') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.headline', '绕行达卡东侧的快速路') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'project' AND b.`type` = 'rich-text' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%described officially as 48 kilometres%' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', '<p>The corridor has two lengths, both shown on this page. The published length is the nominal project length used in agreements and approvals; the measured length is what a vehicle actually travels along the road network.</p><p>We publish both rather than choosing one, because a reader who compares this site against a document and finds a difference deserves to know it is a difference of definition and not an error.</p>') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', '<p>করিডোরের দুটি দৈর্ঘ্য রয়েছে, দুটিই এই পাতায় দেখানো আছে। প্রকাশিত দৈর্ঘ্য হলো চুক্তি ও অনুমোদনে ব্যবহৃত নামমাত্র প্রকল্প-দৈর্ঘ্য; পরিমাপকৃত দৈর্ঘ্য হলো সড়ক নেটওয়ার্ক বরাবর একটি যানবাহন প্রকৃতপক্ষে যতটা পথ চলে।</p><p>আমরা একটি বেছে না নিয়ে দুটোই প্রকাশ করি, কারণ কোনও পাঠক যদি এই সাইটের সঙ্গে কোনও নথি মিলিয়ে পার্থক্য দেখেন, তাঁর জানা উচিত যে এটি সংজ্ঞার পার্থক্য, ভুল নয়।</p>') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', '<p>该走廊有两个长度，均列于本页。公布长度是协议与审批中采用的名义项目长度；实测长度是车辆沿路网实际行驶的距离。</p><p>我们并列公布两者，而不是择一发布。如果读者将本网站与其他文件核对后发现差异，理应知道这是定义口径的不同，而非错误。</p>') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

-- /project specifications: the length and the toll plaza count are records
-- (and the typed figures, 48.07 km and 6, contradicted them).
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'project' AND b.`type` = 'card-grid' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.heading')) = 'Specifications'
    AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.items[0].meta')) = 'Length' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.items[3].meta')) = 'Toll plazas' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_REMOVE(`data`, '$.items[3]', '$.items[0]') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;

SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'safety' AND b.`type` = 'card-grid' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.items[0].body')) LIKE '18 kilometres are open.%' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[0].body', 'Confirm your entry and exit points before you set out — the open length does not yet run the whole corridor. The sections open today are on the travel status page.') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[0].body', 'রওনা হওয়ার আগে আপনার প্রবেশ ও প্রস্থানের স্থান নিশ্চিত করুন — খোলা অংশটি এখনও পুরো করিডোরজুড়ে বিস্তৃত নয়। আজ কোন অংশ খোলা, তা ভ্রমণ অবস্থা পাতায় দেখানো আছে।') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[0].body', '出发前请确认上下路口——通车路段尚未贯通全线。今日通车路段见出行状态页面。') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

-- /travel/rules breakdowns: no unverified call-point spacing.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'travel/rules' AND b.`type` = 'rich-text' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.body')) LIKE '%emergency call point (every 2 km)%' LIMIT 1);
UPDATE `block_translations` SET `data` = REPLACE(`data`, 'emergency call point (every 2 km)', 'emergency call point') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = REPLACE(`data`, 'জরুরি কল পয়েন্ট (প্রতি ২ কিমি)', 'জরুরি কল পয়েন্ট') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = REPLACE(`data`, '紧急呼叫点（每 2 公里一处）', '紧急呼叫点') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

-- The home hero: the open length is on the progress bar directly below it.
SET @b = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id` JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en'
  WHERE p.`slug` = 'home' AND b.`type` = 'hero' AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.headline')) = 'Eighteen kilometres open, and tolling' LIMIT 1);
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.headline', 'The first section is open, and tolling', '$.standfirst', 'The first section of the bypass carries traffic between Vogra and Purbachal today. The rest of the corridor is still under construction.') WHERE `block_id` = @b AND `locale` = 'en' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.headline', 'প্রথম অংশ খোলা, টোল আদায় চালু', '$.standfirst', 'বাইপাসের প্রথম অংশ আজ Vogra ও Purbachal-এর মধ্যে যান চলাচল বহন করছে। করিডোরের বাকি অংশ এখনও নির্মাণাধীন।') WHERE `block_id` = @b AND `locale` = 'bn' AND @b IS NOT NULL;
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.headline', '首段已通车并开始收费', '$.standfirst', '快速路首段目前在 Vogra 至 Purbachal 之间承担通行。走廊其余路段仍在建设中。') WHERE `block_id` = @b AND `locale` = 'zh' AND @b IS NOT NULL;

-- 5.13 search descriptions: no lengths.
UPDATE `page_translations` pt JOIN `pages` p ON p.`id` = pt.`page_id` SET pt.`seo_description` = CASE pt.`locale`
    WHEN 'en' THEN 'The Dhaka Bypass Expressway: toll rates, the route, and which sections are open to traffic today.'
    WHEN 'bn' THEN 'Dhaka Bypass Expressway: টোল হার, রুট এবং আজ কোন অংশ যান চলাচলের জন্য খোলা।'
    WHEN 'zh' THEN 'Dhaka Bypass Expressway：通行费标准、路线走向以及今日已通车的路段。' END
  WHERE p.`slug` = 'home' AND pt.`locale` IN ('en', 'bn', 'zh') AND pt.`seo_description` REGEXP '18|১৮';
UPDATE `page_translations` pt JOIN `pages` p ON p.`id` = pt.`page_id` SET pt.`seo_description` = CASE pt.`locale`
    WHEN 'en' THEN 'Dhaka Bypass Expressway Development Company builds, operates and maintains the Dhaka Bypass Expressway between Joydebpur and Madanpur under a public–private partnership.'
    WHEN 'bn' THEN 'Dhaka Bypass Expressway Development Company সরকারি-বেসরকারি অংশীদারিত্বের আওতায় Joydebpur থেকে Madanpur পর্যন্ত Dhaka Bypass Expressway নির্মাণ, পরিচালনা ও রক্ষণাবেক্ষণ করে।'
    WHEN 'zh' THEN 'Dhaka Bypass Expressway Development Company 依据政府与社会资本合作（PPP）模式，负责 Joydebpur 至 Madanpur 的 Dhaka Bypass Expressway 的建设、运营与养护。' END
  WHERE p.`slug` = 'about' AND pt.`locale` IN ('en', 'bn', 'zh') AND pt.`seo_description` REGEXP '48|৪৮';
UPDATE `page_translations` pt JOIN `pages` p ON p.`id` = pt.`page_id` SET pt.`seo_description` = CASE pt.`locale`
    WHEN 'en' THEN 'The expressway from Joydebpur to Madanpur: its sections, what is open to traffic and tolling, and what is under construction.'
    WHEN 'bn' THEN 'Joydebpur থেকে Madanpur পর্যন্ত এক্সপ্রেসওয়ে: এর অংশসমূহ, কোন অংশ যান চলাচল ও টোল আদায়ের জন্য খোলা এবং কোন অংশ নির্মাণাধীন।'
    WHEN 'zh' THEN '自 Joydebpur 至 Madanpur 的快速路：各路段情况、已通车收费路段及在建路段。' END
  WHERE p.`slug` = 'project' AND pt.`locale` IN ('en', 'bn', 'zh') AND pt.`seo_description` REGEXP '48|৪৮';

-- ---------------------------------------------------------------------------
-- Menus: built-in links seeded with a leading slash were used literally and
-- sent every reader to the English page. The authored form is localised.
-- ---------------------------------------------------------------------------
UPDATE `menu_items` SET `href` = SUBSTRING(`href`, 2)
  WHERE `href` IN ('/travel', '/safety', '/project', '/sustainability', '/about', '/news', '/travel/status', '/travel/toll',
    '/travel/route', '/travel/map', '/travel/facilities', '/travel/rules', '/about/governance', '/gallery', '/disclosures',
    '/disclosures/tariff', '/disclosures/land-acquisition', '/procurement', '/contact', '/grievances', '/privacy', '/terms', '/accessibility');

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('31-cms-consistency');
