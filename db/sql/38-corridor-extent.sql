-- 38: the recorded segments reach the corridor end, and 999 is published (W8C.1, W8.5)
--
-- The concession audit (2026-09-14, CON-OPS-01/02, CON-SAFE-01) found:
--   * the last recorded segment stopped at K35+000, so "% open" was computed
--     over 35 km instead of the published 48 km (51.4% shown for 18 km open);
--   * that segment carried an opening date of 16 September 2026 that nothing
--     published by DBEDC or the press supports;
--   * no emergency number was set, so no page showed one, while seven pages
--     told drivers to call "the number at the foot of every page".
--
-- Located by chainage and by key, never by id. Safe to import twice.

SET NAMES utf8mb4;

-- The K21+218 segment runs to the corridor end (K47+611), under construction,
-- with no opening date until DBEDC confirms one.
UPDATE `segments`
   SET `to_m` = 47611, `status` = 'construction', `opened_on` = NULL,
       `labels` = JSON_SET(COALESCE(`labels`, JSON_OBJECT()), '$.en', 'Purbachal – Madanpur')
 WHERE `from_m` = 21218 AND `to_m` = 35000;

-- 999 is the national emergency number and needs no confirmation from DBEDC.
INSERT INTO `site_settings` (`setting_key`, `value`) VALUES ('contact.national_emergency_phone', '"999"')
  ON DUPLICATE KEY UPDATE `value` = IF(TRIM(BOTH '"' FROM `value`) = '', '"999"', `value`);

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('38-corridor-extent');
