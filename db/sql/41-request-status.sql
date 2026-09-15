-- 41: "Check a request" on the grievance and toll-dispute pages (W8C.7).
-- A reader who was given a tracking number can see where the case stands.
-- Inserted once, before the closing call-to-action band. Safe to import twice.

SET NAMES utf8mb4;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'grievances');
SET @has = (SELECT COUNT(*) FROM `blocks` WHERE `page_id` = @p AND `type` = 'request-status');
SET @ok = (@p IS NOT NULL AND @has = 0);
SET @last = (SELECT `id` FROM `blocks` WHERE `page_id` = @p ORDER BY `sort_order` DESC, `id` DESC LIMIT 1);
SET @lastsort = (SELECT `sort_order` FROM `blocks` WHERE `id` = @last);
SET @endcta = (SELECT `type` = 'cta-band' FROM `blocks` WHERE `id` = @last);
UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `id` = @last AND @ok AND @endcta = 1;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'request-status', IF(@endcta = 1, @lastsort, COALESCE(@lastsort, 0) + 1), 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/toll-dispute');
SET @has = (SELECT COUNT(*) FROM `blocks` WHERE `page_id` = @p AND `type` = 'request-status');
SET @ok = (@p IS NOT NULL AND @has = 0);
SET @last = (SELECT `id` FROM `blocks` WHERE `page_id` = @p ORDER BY `sort_order` DESC, `id` DESC LIMIT 1);
SET @lastsort = (SELECT `sort_order` FROM `blocks` WHERE `id` = @last);
SET @endcta = (SELECT `type` = 'cta-band' FROM `blocks` WHERE `id` = @last);
UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `id` = @last AND @ok AND @endcta = 1;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'request-status', IF(@endcta = 1, @lastsort, COALESCE(@lastsort, 0) + 1), 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('41-request-status');
