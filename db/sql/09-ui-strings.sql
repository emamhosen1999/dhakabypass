-- 09-ui-strings.sql
-- W1.6 — the editable UI strings behind /admin/translations.
--
-- Creates `ui_strings`, the table that lets an operator change any of the 182
-- fixed strings on the public site — the navigation labels, every contact-form
-- label and error message, the newsroom and gallery headings, every travel-page
-- H1 and lede, the provenance notices, and the whole corridor-map legend — in
-- English, Bangla and Chinese, without a developer and without a rebuild.
--
-- ---------------------------------------------------------------------------
-- THE TABLE SHIPS EMPTY, AND MUST.
-- ---------------------------------------------------------------------------
-- This file seeds no rows. That is deliberate and it is the whole design:
--
--   * The wording that ships with the site lives in lib/i18n/ui.js and
--     lib/i18n/map-ui.js, in all three languages. Those tables are the
--     FALLBACK, and they are complete. `t()` and `mapUi()` read them whenever
--     this table has no answer — which is also what happens when this file has
--     never been imported, when the database refuses a connection, and when a
--     stored value is blank. The site is fully translated in every one of those
--     states. Nothing here is required for the site to work.
--
--   * A ROW MEANS "AN OPERATOR CHANGED THIS." /admin/translations renders the
--     code catalogue and overlays these rows on top, so it can tell an operator
--     which strings they have edited and which are still the built-in wording,
--     and "use the built-in wording again" can mean something: it deletes the
--     row. Pre-seeding the table with the code values would mark all 182
--     strings as edited on a database nobody has touched, and there would be
--     nothing left to revert TO.
--
--   * A seeded row would outrank a later correction. The import is by hand,
--     months after the release (see README.md), and a row wins over the code
--     value. Seeding today's English would silently pin the site to it — a
--     future release that fixes a typo in a label would appear to do nothing.
--
-- So: no INSERT belongs in this file, now or later.
--
-- ---------------------------------------------------------------------------
-- Idempotent: safe to import repeatedly. Re-running is a no-op, and it never
-- touches a row — CREATE TABLE IF NOT EXISTS, no DROP, no TRUNCATE, no INSERT.
--
-- Run after 01/02/03 on existing installs, and after 01/02 on fresh ones.
-- Order does not otherwise matter: there are no foreign keys, because the CODE
-- — not the database — defines which keys exist, and a key deleted from the
-- code must never be able to fail an import here.
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `ui_strings` (
  `id` int NOT NULL AUTO_INCREMENT,
  -- Namespaced, so `title` in the map cannot collide with a page's `title`:
  -- 'ui.navTravel' is lib/i18n/ui.js, 'map.layers' is lib/i18n/map-ui.js.
  -- 128 is generous — the longest key in either table is under 30 characters.
  `string_key` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  -- TEXT, not VARCHAR: consentBody and legacyDataNotice are whole paragraphs,
  -- and a truncated legal notice is worse than a wide column.
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- Load bearing, not housekeeping. lib/i18n/strings-repo.js saves with
  -- ON DUPLICATE KEY UPDATE; without this key every save would append a second
  -- row for the same string and the reader would serve whichever the engine
  -- happened to return first.
  UNIQUE KEY `ui_strings_key_locale` (`string_key`, `locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
