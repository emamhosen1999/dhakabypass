-- 46: hub pages as a section index (navigation follow-up to 45).
--
-- The six hub pages carried their section as a row of uppercase labels and
-- nothing else — a page that cost a click and gave nothing back. The same
-- block now renders as cards, one per page, with the page's own description
-- from its settings; and the travel hub gets the toll calculator, the top task
-- on the site, copied from the toll page's own block so no figure or label is
-- typed here. Safe to import twice.

SET NAMES utf8mb4;

-- Hubs: the section-subnav at the top of a top-level page renders as cards.
UPDATE `block_translations` bt
  JOIN `blocks` b ON b.`id` = bt.`block_id` AND b.`type` = 'section-subnav'
  JOIN `pages` p ON p.`id` = b.`page_id` AND p.`slug` NOT LIKE '%/%'
   SET bt.`data` = JSON_SET(bt.`data`, '$.layout', 'cards')
 WHERE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.layout')), '') <> 'cards';

-- Travel hub: the toll calculator, between the header and the index.
SET @travel = (SELECT `id` FROM `pages` WHERE `slug` = 'travel');
SET @src = (SELECT b.`id` FROM `blocks` b JOIN `pages` p ON p.`id` = b.`page_id`
             WHERE p.`slug` = 'travel/toll' AND b.`type` = 'toll-calculator' ORDER BY b.`sort_order` LIMIT 1);
SET @ok = (@travel IS NOT NULL AND @src IS NOT NULL
           AND (SELECT COUNT(*) FROM `blocks` WHERE `page_id` = @travel AND `type` = 'toll-calculator') = 0);
UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `page_id` = @travel AND @ok AND `type` = 'section-subnav';
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`)
  SELECT @travel, 'toll-calculator', 1, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT @b, st.`locale`, st.`data`, 'published'
    FROM `block_translations` st WHERE @b IS NOT NULL AND st.`block_id` = @src;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('46-section-index');
