-- 51: the corridor strip returns to the home page, under the progress figure
-- (48 had removed it). The figure says how much is open; the strip shows
-- which stretch, with every plaza and bridge on it; the map band beneath then
-- shows how the road is running. Safe to import twice.

SET NAMES utf8mb4;

SET @home = (SELECT `id` FROM `pages` WHERE `slug` = 'home');
SET @ok = (@home IS NOT NULL AND (SELECT COUNT(*) FROM `blocks` WHERE `page_id` = @home AND `type` = 'corridor-strip') = 0);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @home, 'corridor-strip', 2, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT @b, l.`locale`, '{}', 'published'
    FROM (SELECT 'en' AS `locale` UNION ALL SELECT 'bn' UNION ALL SELECT 'zh') l
   WHERE @b IS NOT NULL;

UPDATE `blocks` SET `sort_order` = 0 WHERE `page_id` = @home AND `type` = 'hero';
UPDATE `blocks` SET `sort_order` = 1 WHERE `page_id` = @home AND `type` = 'progress-bar';
UPDATE `blocks` SET `sort_order` = 2 WHERE `page_id` = @home AND `type` = 'corridor-strip';
UPDATE `blocks` SET `sort_order` = 3 WHERE `page_id` = @home AND `type` = 'corridor-map';
UPDATE `blocks` SET `sort_order` = 4 WHERE `page_id` = @home AND `type` = 'toll-preview';
UPDATE `blocks` SET `sort_order` = 5 WHERE `page_id` = @home AND `type` = 'toll-calculator';

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('51-home-strip-back');
