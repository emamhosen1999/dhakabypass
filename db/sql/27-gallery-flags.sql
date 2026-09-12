-- 27-gallery-flags.sql — the legacy corridor photographs into the gallery
-- on a database seeded before 02-seed.sql carried the flags.
--
-- 02-seed.sql now flags the 24 legacy photographs for the gallery, but
-- INSERT IGNORE never touches a row that already exists, so a database
-- seeded from an earlier 02 (production, seeded 5 September 2026) keeps
-- every one at in_gallery = 0 and shows an empty gallery. This is the rule
-- scripts/db-setup-v8.mjs applied to the development database, as SQL:
-- the legacy pictures under /photo/, plus the four 03-content-recovery
-- names. An operator's later choice to take one OUT of the gallery is not
-- protected by this file — it runs once per database, on import.
--
-- Idempotent in effect: the UPDATE sets a value it may already have set.

UPDATE `media` SET `in_gallery` = 1
 WHERE `origin` = 'legacy'
   AND (`path` LIKE '/photo/%' OR `path` IN ('/cp.webp', '/semi.webp', '/DSC02357.webp', '/IMG_6282.webp'));

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('27-gallery-flags');
