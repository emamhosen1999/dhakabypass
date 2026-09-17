-- 54: a record of every traffic measurement, not just the latest.
--
-- The 30-minute refresh overwrote corridor_sections, so the site could say
-- how the road was running now and nothing about how it usually runs. This
-- table keeps each measurement; lib/corridor/traffic-refresh.js appends one
-- row per section per run and prunes rows older than 400 days, and the
-- travel-time-history block buckets them by hour of day. Safe to import twice.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `traffic_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `measured_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `condition_key` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unknown',
  `avg_speed_kmh` int DEFAULT NULL,
  `source` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `section_measured` (`section_id`, `measured_at`),
  KEY `idx_measured` (`measured_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('54-traffic-history');
