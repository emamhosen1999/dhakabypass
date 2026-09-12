-- 21-travel-redirect.sql — /travel as an operator-owned redirect (W1.31).
--
-- app/[locale]/travel/page.jsx was a bare redirect() to /travel/status: one
-- line of route behaviour that only a deploy could change. It is deleted.
-- The same behaviour is now three rows in `redirects`, the table
-- /admin/redirects already edits, resolved by the catch-all on the 404 path
-- exactly like a legacy URL: an operator can point /travel at the map, the
-- toll page or nothing, without asking for a release.
--
-- 308 rather than 301: the target is a permanent choice, and 308 forbids the
-- method change a few clients still make on 301.
--
-- Idempotent: INSERT IGNORE against the UNIQUE `source`.

INSERT IGNORE INTO `redirects` (`source`, `destination`, `status_code`) VALUES
  ('/en/travel', '/en/travel/status', 308),
  ('/bn/travel', '/bn/travel/status', 308),
  ('/zh/travel', '/zh/travel/status', 308);
