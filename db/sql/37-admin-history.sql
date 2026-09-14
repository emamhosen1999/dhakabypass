-- 37: admin history, trash and draft copies (W7.2, W7.4, W7.5, W7.12)
--
-- record_history  the state of a record just before an operator changed or
--                 deleted it, for every content type (block text keeps its own
--                 `revisions` rows as before). entity_id is text because some
--                 records are keyed by name (settings, road names).
-- trash           a deleted record with every row that went with it, restorable
--                 with its original ids.
-- audit_log       existed since 01 and was never written; it now is. Widened so
--                 the target can name the record.
-- block_translations.draft_data / news_translations.draft
--                 the working copy, separate from what the public reads.
-- service_request_events  a request's status and note timeline.
-- toll_od_rates   fares no longer vanish with an interchange: RESTRICT.
-- updated_at      on the tables that lacked it, so a form can tell whether the
--                 record changed since it was opened.

-- The connection charset: without it a client defaulting to latin1 stores
-- every non-ASCII character double-encoded (repaired 14 September 2026).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `record_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'update',
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `snapshot` json NOT NULL,
  `actor` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity_type`,`entity_id`,`created_at`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `trash` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `summary` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `payload` json NOT NULL,
  `actor` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `deleted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_deleted` (`deleted_at`),
  KEY `idx_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `service_request_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `actor` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `from_status` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_request` (`request_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- audit_log.target 191 -> 255 and a readable label.
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_log' AND COLUMN_NAME = 'label');
SET @s = IF(@c = 0, 'ALTER TABLE `audit_log` ADD COLUMN `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `target`, ADD KEY `idx_actor` (`actor`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Draft copies.
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'block_translations' AND COLUMN_NAME = 'draft_data');
SET @s = IF(@c = 0, 'ALTER TABLE `block_translations` ADD COLUMN `draft_data` json DEFAULT NULL AFTER `status`, ADD COLUMN `draft_updated_at` timestamp NULL DEFAULT NULL AFTER `draft_data`, ADD COLUMN `draft_updated_by` int DEFAULT NULL AFTER `draft_updated_at`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news_translations' AND COLUMN_NAME = 'draft');
SET @s = IF(@c = 0, 'ALTER TABLE `news_translations` ADD COLUMN `draft` json DEFAULT NULL AFTER `status`, ADD COLUMN `draft_updated_at` timestamp NULL DEFAULT NULL AFTER `draft`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Existing drafts of blocks that were never published keep working: a row that
-- is 'draft' has no live copy, so its data is its draft. (A 'draft' row used to
-- be what "Save draft" on a live block left behind; nothing is live there now
-- either, so treating it as an unpublished block is exactly what it was.)

-- Pages: who last changed them.
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'updated_by');
SET @s = IF(@c = 0, 'ALTER TABLE `pages` ADD COLUMN `updated_by` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `updated_at`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Alert broadcasts: who sent them.
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alert_broadcasts' AND COLUMN_NAME = 'sent_by');
SET @s = IF(@c = 0, 'ALTER TABLE `alert_broadcasts` ADD COLUMN `sent_by` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `error`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- updated_at where a record form needs to know it changed.
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'advisories' AND COLUMN_NAME = 'updated_at');
SET @s = IF(@c = 0, 'ALTER TABLE `advisories` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'corridor_waypoints' AND COLUMN_NAME = 'updated_at');
SET @s = IF(@c = 0, 'ALTER TABLE `corridor_waypoints` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'traffic_monthly' AND COLUMN_NAME = 'updated_at');
SET @s = IF(@c = 0, 'ALTER TABLE `traffic_monthly` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'updated_at');
SET @s = IF(@c = 0, 'ALTER TABLE `menu_items` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'redirects' AND COLUMN_NAME = 'updated_at');
SET @s = IF(@c = 0, 'ALTER TABLE `redirects` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media' AND COLUMN_NAME = 'updated_at');
SET @s = IF(@c = 0, 'ALTER TABLE `media` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news_updates' AND COLUMN_NAME = 'updated_at');
SET @s = IF(@c = 0, 'ALTER TABLE `news_updates` ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Fares refuse to vanish with their interchange.
SET @c = (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_toll_od_origin' AND DELETE_RULE = 'CASCADE');
SET @s = IF(@c = 1, 'ALTER TABLE `toll_od_rates` DROP FOREIGN KEY `fk_toll_od_origin`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = IF(@c = 1, 'ALTER TABLE `toll_od_rates` ADD CONSTRAINT `fk_toll_od_origin` FOREIGN KEY (`origin_interchange_id`) REFERENCES `interchanges` (`id`) ON DELETE RESTRICT', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_toll_od_destination' AND DELETE_RULE = 'CASCADE');
SET @s = IF(@c = 1, 'ALTER TABLE `toll_od_rates` DROP FOREIGN KEY `fk_toll_od_destination`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @s = IF(@c = 1, 'ALTER TABLE `toll_od_rates` ADD CONSTRAINT `fk_toll_od_destination` FOREIGN KEY (`destination_interchange_id`) REFERENCES `interchanges` (`id`) ON DELETE RESTRICT', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('37-admin-history');
