-- 25-partner-logos.sql — the four brand marks in the media library, and on
-- the home page's partner row (W1.27).
--
-- DBEDC supplied one combined PNG of the RHD, SDIG/SRBG, UDC and DBEDC marks
-- (decision: "use this png crop for each needed"). They are cropped to clean
-- transparent WebPs under public/brand/ — static assets shipped with the
-- deploy, like /photo/*.webp. Registering them here gives each a media row
-- with a description in three languages, so the block editor's image picker
-- offers them and the alt text is edited once at /admin/media. in_gallery
-- stays 0: a logo is not a photograph of the corridor.
--
-- The home page's partner row is then pointed at them, by page slug and by
-- the partner's NAME within the list, and only where no logo is set yet, so
-- an operator's own choice is never overwritten. RHD is added as a fourth
-- partner — the contracting authority — when no item of that name exists.
-- SEL has no mark and keeps its typographic credit.
--
-- Idempotent throughout. ID map: media 300-303.

/*!40000 ALTER TABLE `media` DISABLE KEYS */;
INSERT IGNORE INTO `media` (`id`, `path`, `width`, `height`, `bytes`, `mime`, `focal_x`, `focal_y`, `alt`, `origin`, `credit`, `in_gallery`) VALUES
  (300,'/brand/rhd.webp',522,542,293992,'image/webp',0.500,0.500,'{"en":"Roads and Highways Department emblem","bn":"সড়ক ও জনপথ অধিদপ্তরের প্রতীক","zh":"道路与公路局徽标"}','legacy','RHD',0),
  (301,'/brand/sdig-srbg.webp',493,438,160214,'image/webp',0.500,0.500,'{"en":"Sichuan Development / Sichuan Road & Bridge Group logo","bn":"সিচুয়ান রোড অ্যান্ড ব্রিজ গ্রুপের লোগো","zh":"蜀道集团 / 四川路桥标志"}','legacy','SRBG',0),
  (302,'/brand/udc.webp',419,452,115322,'image/webp',0.500,0.500,'{"en":"UDC Construction logo","bn":"UDC Construction-এর লোগো","zh":"UDC Construction 标志"}','legacy','UDC',0),
  (303,'/brand/dbedc.webp',405,414,106616,'image/webp',0.500,0.500,'{"en":"DBEDC logo","bn":"DBEDC-এর লোগো","zh":"DBEDC 标志"}','legacy','DBEDC',0);
/*!40000 ALTER TABLE `media` ENABLE KEYS */;

SET @home = (SELECT `id` FROM `pages` WHERE `slug` = 'home' LIMIT 1);
SET @row = (SELECT b.`id` FROM `blocks` b WHERE b.`page_id` = @home AND b.`type` = 'partner-row' ORDER BY b.`sort_order`, b.`id` LIMIT 1);

-- Logos onto the existing SRBG and UDC items, per locale, by name.
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[0].logo', '/brand/sdig-srbg.webp')
 WHERE `block_id` = @row AND JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.items[0].name')) = 'SRBG'
   AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.items[0].logo')), '') = '';
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.items[2].logo', '/brand/udc.webp')
 WHERE `block_id` = @row AND JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.items[2].name')) = 'UDC'
   AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.items[2].logo')), '') = '';

-- RHD as the contracting authority, once per locale, when absent.
UPDATE `block_translations` SET `data` = JSON_ARRAY_APPEND(`data`, '$.items', JSON_OBJECT('name','RHD','logo','/brand/rhd.webp','role','Roads and Highways Department, contracting authority','share','','href','about/governance'))
 WHERE `block_id` = @row AND `locale` = 'en' AND JSON_SEARCH(`data`, 'one', 'RHD', NULL, '$.items[*].name') IS NULL;
UPDATE `block_translations` SET `data` = JSON_ARRAY_APPEND(`data`, '$.items', JSON_OBJECT('name','RHD','logo','/brand/rhd.webp','role','সড়ক ও জনপথ অধিদপ্তর, চুক্তিকারী কর্তৃপক্ষ','share','','href','about/governance'))
 WHERE `block_id` = @row AND `locale` = 'bn' AND JSON_SEARCH(`data`, 'one', 'RHD', NULL, '$.items[*].name') IS NULL;
UPDATE `block_translations` SET `data` = JSON_ARRAY_APPEND(`data`, '$.items', JSON_OBJECT('name','RHD','logo','/brand/rhd.webp','role','道路与公路局，发包机关','share','','href','about/governance'))
 WHERE `block_id` = @row AND `locale` = 'zh' AND JSON_SEARCH(`data`, 'one', 'RHD', NULL, '$.items[*].name') IS NULL;
