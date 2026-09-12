-- 15-emergency-contact.sql — the emergency assistance number.
--
-- The field has existed at /admin/settings ("Emergency assistance number",
-- key contact.emergency_phone) since the settings screen was built, and it
-- has been EMPTY. On a 48 km access-controlled expressway, where a stranded
-- driver cannot walk off, no published number was the most serious
-- non-financial gap in the audit (B-C5, task 0.13).
--
-- The value below was supplied by DBEDC on 2026-09-11. It is the Monitoring
-- Centre line. What it means to publish a number on a public infrastructure
-- site — strangers calling it at any hour, for as long as the site exists —
-- was raised with DBEDC before this was written, and the decision to publish
-- is theirs.
--
-- It is a SETTING, not content: the operator changes it at /admin/settings
-- and every page that shows it updates. This file exists only so a fresh
-- install carries it from the first deploy, rather than depending on somebody
-- remembering to type it in.
--
-- Values in site_settings are JSON, so a string carries its quotes.
--
-- Idempotent: INSERT IGNORE. If the operator has already set a different
-- number through the admin, this file does not overwrite it — a hand-imported
-- SQL file must never silently revert an operator's decision.

INSERT IGNORE INTO `site_settings` (`setting_key`, `value`)
VALUES ('contact.emergency_phone', '"01610285004"');
