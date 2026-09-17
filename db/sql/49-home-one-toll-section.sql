-- 49: the two toll blocks on the home page read as one section.
--
-- "What will my journey cost?" (the calculator) followed by "What it costs"
-- (the featured fares) was the same thing said twice under two headings. The
-- fares come first — the prices at a glance — and the calculator sits beneath
-- them without a heading of its own, introduced by one line. Safe to import
-- twice.

SET NAMES utf8mb4;

SET @home = (SELECT `id` FROM `pages` WHERE `slug` = 'home');
UPDATE `blocks` SET `sort_order` = 3 WHERE `page_id` = @home AND `type` = 'toll-preview';
UPDATE `blocks` SET `sort_order` = 4 WHERE `page_id` = @home AND `type` = 'toll-calculator';

UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = JSON_SET(bt.`data`, '$.heading', '', '$.intro', 'Or pick your entry, exit and vehicle class for the exact fare.')
 WHERE b.`page_id` = @home AND b.`type` = 'toll-calculator' AND bt.`locale` = 'en';
UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = JSON_SET(bt.`data`, '$.heading', '', '$.intro', 'অথবা সঠিক ভাড়া জানতে প্রবেশ, প্রস্থান ও যানবাহনের শ্রেণি বেছে নিন।')
 WHERE b.`page_id` = @home AND b.`type` = 'toll-calculator' AND bt.`locale` = 'bn';
UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = JSON_SET(bt.`data`, '$.heading', '', '$.intro', '或选择入口、出口和车型，查看准确费用。')
 WHERE b.`page_id` = @home AND b.`type` = 'toll-calculator' AND bt.`locale` = 'zh';

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('49-home-one-toll-section');
