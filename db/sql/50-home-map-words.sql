-- 50: the words beside the home page's map band. The compact corridor-map
-- now lays its heading, intro, live line and link in a column beside the map
-- (48 placed the block with both blank). Only rows still blank are filled, so
-- an operator's own wording is never overwritten. Safe to import twice.

SET NAMES utf8mb4;

SET @home = (SELECT `id` FROM `pages` WHERE `slug` = 'home');
SET @b = (SELECT `id` FROM `blocks` WHERE `page_id` = @home AND `type` = 'corridor-map' LIMIT 1);

UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.heading', 'How the road is running', '$.intro', 'Each section is coloured by its measured traffic, refreshed every 30 minutes. Toll plazas, bridges and the connecting roads are marked; open the full map to zoom in and select a section.')
 WHERE `block_id` = @b AND `locale` = 'en' AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.heading')), '') = '';
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.heading', 'সড়কে এখন কেমন চলছে', '$.intro', 'প্রতিটি অংশের রং তার পরিমাপকৃত যানচলাচল অনুযায়ী, প্রতি ৩০ মিনিটে হালনাগাদ হয়। টোল প্লাজা, সেতু ও সংযোগ সড়ক চিহ্নিত আছে; জুম করতে ও কোনো অংশ বেছে নিতে পূর্ণ মানচিত্র খুলুন।')
 WHERE `block_id` = @b AND `locale` = 'bn' AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.heading')), '') = '';
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.heading', '道路当前运行情况', '$.intro', '各路段按实测路况着色，每 30 分钟更新一次。图中标出收费站、桥梁和连接道路；打开完整地图可缩放并选择路段。')
 WHERE `block_id` = @b AND `locale` = 'zh' AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.heading')), '') = '';

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('50-home-map-words');
