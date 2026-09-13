-- 32-drop-legacy-tables.sql — remove the old static site's tables (W6.10).
--
-- `content` (the legacy page JSON), `gallery_images` (the legacy gallery list)
-- and `admin_users` (the legacy sign-in table) have had no reader since the
-- legacy tree was deleted (W6.1): the site renders pages from `pages`/`blocks`,
-- the gallery from `media.in_gallery`, and signs people in from `users`.
-- Leaving them in place invites someone to edit a table that changes nothing.
--
-- Before dropping `admin_users`, any account in it that `users` does not yet
-- know is copied across as an admin, so no one who could sign in yesterday is
-- locked out today (the same rule as scripts/migrate-users.mjs).
--
-- 01-schema.sql and 02-seed.sql still create and fill these on a first
-- install; this file removes them again right after. Safe to import twice.

SET @c = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_users');
SET @s = IF(@c = 1,
  'INSERT IGNORE INTO `users` (`email`, `name`, `password_hash`, `role`) SELECT LOWER(`email`), `name`, `password_hash`, ''admin'' FROM `admin_users`',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

DROP TABLE IF EXISTS `content`;
DROP TABLE IF EXISTS `gallery_images`;
DROP TABLE IF EXISTS `admin_users`;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('32-drop-legacy-tables');
