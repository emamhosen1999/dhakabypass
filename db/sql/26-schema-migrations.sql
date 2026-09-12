-- 26-schema-migrations.sql — the ledger of applied SQL files (W6.6).
--
-- Until now nothing recorded which of these numbered files a database had
-- been given. A release whose code expected 19-service-requests.sql on a
-- database that never received it answered every grievance form with a
-- 500, silently, until somebody noticed. From this file on:
--
--   * `schema_migrations` lists every file applied, by name.
--   * Every later file ends with an INSERT IGNORE of its own name.
--   * lib/db/migrations.js carries the list of files the CODE expects, and
--     lib/deploy/boot-check.js (via instrumentation.js) and
--     scripts/preflight.mjs REFUSE TO BOOT a production server whose ledger
--     is missing any of them, naming the files to import. A refused boot
--     with the answer on the screen, instead of a silent 500.
--
-- Importing THIS file records 01 through 26 as applied. That is a statement
-- about the past: the deploy runbook has always required the files to be
-- imported in order, and a database that is receiving 26 has had the rest.
-- If that is not true of some database, the gate will not know — but every
-- file after this one records itself, so the gap can never reopen.
--
-- Idempotent: CREATE IF NOT EXISTS, INSERT IGNORE.

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES
  ('01-schema'), ('02-seed'), ('03-content-recovery'), ('07-block-order'), ('09-ui-strings'),
  ('10-route-meta'), ('11-block-fields'), ('12-toll-od-matrix'), ('13-travel-rules'),
  ('14-legal-pages'), ('15-emergency-contact'), ('16-travel-pages'), ('17-news-gallery-contact'),
  ('18-home-corridor'), ('19-service-requests'), ('20-grievance-form'), ('21-travel-redirect'),
  ('22-callout-migration'), ('23-not-found'), ('24-legacy-content'), ('25-partner-logos'),
  ('26-schema-migrations');
