-- 59-insight-snapshots.sql — what Google told us, kept here (19 September 2026).
--
-- The admin's analytics screens read this table and never call Google while a
-- page renders. Three reasons, in order of how much they matter:
--
--   1. cache-handler.cjs keeps data-cache entries in PROCESS memory, bounded
--      to 2,000 entries, with isrFlushToDisk off (next.config.mjs). Passenger
--      restarts on every deploy and may run more than one process, so an
--      unstable_cache miss is not rare — it is what every release causes. A
--      screen built on the API directly would fan out a dozen calls on the
--      first admin visit after each deploy.
--   2. GA4 blocks every request to a property after ten server errors in an
--      hour. A render path that calls Google is a render path that can get
--      the property blocked.
--   3. The host is a shared, memory-limited cPanel account.
--
-- One row per panel, replaced in place: the payload carries its own series, so
-- there is no history to accumulate and the table stays at a handful of rows.
--
-- A FAILED REFRESH KEEPS THE LAST GOOD PAYLOAD and records why and when it
-- failed, because a stale figure that says how stale it is beats an empty
-- panel that looks like zero traffic.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `insight_snapshots` (
  `id` int NOT NULL AUTO_INCREMENT,
  -- 'daily-totals', 'top-pages', 'events', 'queries', 'search-pages', 'sitemaps'
  `panel` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  -- 'ga4' or 'search-console', so a screen can say which service is stale.
  `source` varchar(24) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ga4',
  `payload` json NOT NULL,
  `taken_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Set when the most recent attempt failed; `payload` and `taken_at` then
  -- still describe the last attempt that worked.
  `failed_at` timestamp NULL DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_panel` (`panel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The ledger row preflight reads to know this file has been applied.
INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('59-insight-snapshots');
