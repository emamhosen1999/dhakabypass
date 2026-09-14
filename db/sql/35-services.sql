-- 35-services.sql — the records behind CCTV, road alerts and the new road-user applications.
--
--   cameras             corridor CCTV: still and HLS stream addresses, encrypted
--                       credentials, health; edited at /admin/corridor/cameras.
--   alert_subscribers   mobile numbers subscribed to SMS or WhatsApp road alerts.
--   alert_broadcasts    every alert sent from /admin/alerts, with its outcome.
--   service_requests    three more kinds: fleet_account, etc_tag, loyalty.
--
-- Four SAMPLE cameras are seeded at real plaza and bridge chainages with a
-- stored photograph as the still (is_sample = 1): the public tiles say
-- "Sample" until each is given its camera's real snapshot and stream address.
-- Safe to import twice.

CREATE TABLE IF NOT EXISTS `cameras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `names` json NOT NULL,
  `chainage_m` int DEFAULT NULL,
  `direction` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `snapshot_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `stream_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `delivery` enum('proxy','direct') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'proxy',
  `username` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `password_sealed` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `refresh_seconds` int NOT NULL DEFAULT '30',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_sample` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `last_ok_at` timestamp NULL DEFAULT NULL,
  `last_error` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_active_sort` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `alert_subscribers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('sms','whatsapp') COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `status` enum('active','unsubscribed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone_channel` (`phone`, `channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `alert_broadcasts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `messages` json NOT NULL,
  `channel` enum('sms','whatsapp','both') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('queued','sent','failed','no_provider') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `recipients` int NOT NULL DEFAULT '0',
  `sent` int NOT NULL DEFAULT '0',
  `error` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `service_requests` MODIFY `kind`
  enum('grievance','toll_dispute','breakdown','lost_found','general','fleet_account','etc_tag','loyalty')
  COLLATE utf8mb4_unicode_ci NOT NULL;

INSERT INTO `cameras` (`names`, `chainage_m`, `direction`, `lat`, `lng`, `snapshot_url`, `refresh_seconds`, `is_active`, `is_sample`, `sort_order`)
SELECT * FROM (
  SELECT '{"en":"Vogra Toll Plaza","bn":"ভোগড়া টোল প্লাজা","zh":"Vogra收费站"}' AS n, 3218 AS c, 'Plaza lanes' AS d, 23.9753672 AS la, 90.3892800 AS lo, '/photo/21.webp' AS s, 30 AS r, 1 AS a, 1 AS smp, 0 AS o
  UNION ALL SELECT '{"en":"Mirer Bazar Toll Plaza","bn":"মিরের বাজার টোল প্লাজা","zh":"Mirer Bazar收费站"}', 13184, 'Plaza lanes', 23.9235064, 90.4580000, '/photo/24.webp', 30, 1, 1, 1
  UNION ALL SELECT '{"en":"Purbachal Toll Plaza","bn":"পূর্বাচল টোল প্লাজা","zh":"Purbachal收费站"}', 24522, 'Plaza lanes', 23.8440000, 90.5300000, '/photo/25.webp', 30, 1, 1, 2
  UNION ALL SELECT '{"en":"Kanchan Bridge","bn":"কাঞ্চন সেতু","zh":"Kanchan大桥"}', 27403, 'Both directions', 23.8362275, 90.5400000, '/photo/1.webp', 30, 1, 1, 3
) seed
WHERE NOT EXISTS (SELECT 1 FROM `cameras`);

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('35-services');
