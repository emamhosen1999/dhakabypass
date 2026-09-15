-- 43: a page title on the privacy, terms and accessibility pages (UI audit
-- UI-A11Y-06/07, concession audit CON-SEO-C-03). They opened straight into a
-- rich-text section, so the page had no <h1>. A page-header block goes first,
-- its title taken from the page's own title in each language, with "last
-- updated" on. Inserted only when the page has no page-header or hero. Plain
-- statements (no stored procedure), so every importer runs it. Safe to import
-- twice.

SET NAMES utf8mb4;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'privacy');
SET @ok = (@p IS NOT NULL AND (SELECT COUNT(*) FROM `blocks` WHERE `page_id` = @p AND `type` IN ('page-header', 'hero')) = 0);
UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `page_id` = @p AND @ok;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 0, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT @b, pt.`locale`, JSON_OBJECT('eyebrow', '', 'heading', pt.`title`, 'lede', '', 'showUpdated', 'yes'), 'published'
    FROM `page_translations` pt WHERE @b IS NOT NULL AND pt.`page_id` = @p AND pt.`title` <> '';

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'terms');
SET @ok = (@p IS NOT NULL AND (SELECT COUNT(*) FROM `blocks` WHERE `page_id` = @p AND `type` IN ('page-header', 'hero')) = 0);
UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `page_id` = @p AND @ok;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 0, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT @b, pt.`locale`, JSON_OBJECT('eyebrow', '', 'heading', pt.`title`, 'lede', '', 'showUpdated', 'yes'), 'published'
    FROM `page_translations` pt WHERE @b IS NOT NULL AND pt.`page_id` = @p AND pt.`title` <> '';

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'accessibility');
SET @ok = (@p IS NOT NULL AND (SELECT COUNT(*) FROM `blocks` WHERE `page_id` = @p AND `type` IN ('page-header', 'hero')) = 0);
UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `page_id` = @p AND @ok;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 0, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`)
  SELECT @b, pt.`locale`, JSON_OBJECT('eyebrow', '', 'heading', pt.`title`, 'lede', '', 'showUpdated', 'yes'), 'published'
    FROM `page_translations` pt WHERE @b IS NOT NULL AND pt.`page_id` = @p AND pt.`title` <> '';

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('43-legal-page-headers');
