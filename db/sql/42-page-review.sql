-- 42: content governance on pages (W8C.9): who owns a page, when it was last
-- reviewed, and how often it should be. Read by the page settings panel and
-- the dashboard's "reviews due" list. Safe to import twice.

SET NAMES utf8mb4;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'owner_department');
SET @s = IF(@c = 0, 'ALTER TABLE `pages` ADD COLUMN `owner_department` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `updated_by`, ADD COLUMN `reviewed_at` date DEFAULT NULL AFTER `owner_department`, ADD COLUMN `review_interval_days` smallint DEFAULT NULL AFTER `reviewed_at`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('42-page-review');
