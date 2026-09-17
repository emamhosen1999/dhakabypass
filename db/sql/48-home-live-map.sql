-- 48: the corridor map on the home page, as a compact live band.
--
-- The home page said "here is the road" three times — a progress bar, the
-- corridor strip and the nineteen-row interchange table — and never showed
-- the road. The map, framed as a band with no controls and a link to the full
-- explorer, replaces the strip and the table (both stay on What's open and
-- Route, where they are read). The four blocks that all sat at sort_order 0
-- get a real order. Safe to import twice.

SET NAMES utf8mb4;

SET @home = (SELECT `id` FROM `pages` WHERE `slug` = 'home');

-- The strip and the interchange table leave the home page (unpublished, not
-- deleted: the operator can bring either back from the page editor).
UPDATE `blocks` SET `status` = 'draft' WHERE `page_id` = @home AND `type` IN ('corridor-strip', 'interchange-table');
-- Publication is per translation (lib/content/pages.js): a block with no
-- published translation does not render, and its text is kept as the draft.
UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`status` = 'draft'
 WHERE b.`page_id` = @home AND b.`type` IN ('corridor-strip', 'interchange-table');

-- The compact map, once.
SET @ok = (@home IS NOT NULL AND (SELECT COUNT(*) FROM `blocks` WHERE `page_id` = @home AND `type` = 'corridor-map') = 0);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @home, 'corridor-map', 2, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT @b, l.`locale`, JSON_OBJECT('heading', '', 'intro', '', 'showLegend', 'no', 'layout', 'compact', 'linkHref', 'travel/map', 'linkLabel', ''), 'published'
    FROM (SELECT 'en' AS `locale` UNION ALL SELECT 'bn' UNION ALL SELECT 'zh') l
   WHERE @b IS NOT NULL;

-- A real order: hero, progress, map, then the tasks and the story.
UPDATE `blocks` SET `sort_order` = 0 WHERE `page_id` = @home AND `type` = 'hero';
UPDATE `blocks` SET `sort_order` = 1 WHERE `page_id` = @home AND `type` = 'progress-bar';
UPDATE `blocks` SET `sort_order` = 2 WHERE `page_id` = @home AND `type` = 'corridor-map';
UPDATE `blocks` SET `sort_order` = 3 WHERE `page_id` = @home AND `type` = 'toll-calculator';
UPDATE `blocks` SET `sort_order` = 4 WHERE `page_id` = @home AND `type` = 'toll-preview';
UPDATE `blocks` SET `sort_order` = `sort_order` + 10 WHERE `page_id` = @home AND `type` NOT IN ('hero', 'progress-bar', 'corridor-map', 'toll-calculator', 'toll-preview', 'corridor-strip', 'interchange-table') AND `sort_order` < 10;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('48-home-live-map');
