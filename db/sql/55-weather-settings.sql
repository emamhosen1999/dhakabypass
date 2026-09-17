-- 55: the thresholds behind the corridor-weather block's advisory.
--
-- Fog below 1,000 m visibility, 7.5 mm of rain in the hour, wind or gusts
-- at 50 km/h. Edited at /admin/corridor; only written where no value is
-- stored, so an operator's own figure survives a re-import.

SET NAMES utf8mb4;

INSERT INTO `site_settings` (`setting_key`, `value`)
  SELECT 'weather.fog_visibility_m', '1000' FROM DUAL
   WHERE NOT EXISTS (SELECT 1 FROM (SELECT `setting_key` FROM `site_settings` WHERE `setting_key` = 'weather.fog_visibility_m') AS x);
INSERT INTO `site_settings` (`setting_key`, `value`)
  SELECT 'weather.heavy_rain_mm', '7.5' FROM DUAL
   WHERE NOT EXISTS (SELECT 1 FROM (SELECT `setting_key` FROM `site_settings` WHERE `setting_key` = 'weather.heavy_rain_mm') AS x);
INSERT INTO `site_settings` (`setting_key`, `value`)
  SELECT 'weather.strong_wind_kmh', '50' FROM DUAL
   WHERE NOT EXISTS (SELECT 1 FROM (SELECT `setting_key` FROM `site_settings` WHERE `setting_key` = 'weather.strong_wind_kmh') AS x);

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('55-weather-settings');
