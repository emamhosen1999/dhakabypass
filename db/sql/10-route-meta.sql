-- 10-route-meta.sql
-- W1.7 — per-route SEO, the layer that `pages` cannot express.
--
-- Creates `route_meta`, the table behind /admin/seo. It exists for exactly two
-- things, and it is worth writing down which, because the obvious wrong design
-- is a second `seo_title` column for every URL on the site.
--
-- ---------------------------------------------------------------------------
-- THE BOUNDARY
-- ---------------------------------------------------------------------------
-- An ordinary public page is a row in `pages`, rendered by
-- app/[locale]/[...slug]/page.jsx, and its title and description already live
-- on `page_translations`.`seo_title` / `seo_description`. That is the ONE
-- source of truth for the text of a page that has a document.
--
--   TEXT  (seo_title, seo_description, og_image) — a FILL, never an override.
--         The document wins whenever it has said something. These columns earn
--         their place on TEMPLATE routes, which have no `pages` row at all:
--         `/news/[slug]` is one route on disk and as many URLs as there are
--         articles, and until now its metadata came from a hardcoded string in
--         lib/i18n/ui.js that only a developer could change.
--
--   DIRECTIVES (robots, canonical) — an OVERRIDE, on every route including the
--         document-backed ones. `page_translations` has no column that can
--         express either, so there is nothing to defer to. An operator who
--         cannot mark a URL noindex has to ask a developer for a deploy, and
--         that is the gap this half closes.
--
-- lib/seo/route-meta.js enforces exactly that split, and
-- tests/unit/seo-route-meta.test.js fails if a change blurs it.
--
-- ---------------------------------------------------------------------------
-- THE TABLE SHIPS EMPTY, AND MUST.
-- ---------------------------------------------------------------------------
-- Same rule, and the same reasoning, as 09-ui-strings.sql: this file seeds no
-- rows.
--
--   * A ROW MEANS "AN OPERATOR SET THIS." The site's own titles come from the
--     `pages` rows, from lib/i18n/ui.js and from lib/seo/settings.js's code
--     defaults, in all three languages. Every one of those still answers when
--     this table is empty, when this file has never been imported, and when
--     MySQL refuses the connection. Nothing here is required for the site to
--     work; /admin/seo simply shows no rows.
--
--   * Pre-seeding today's code values would mark routes as edited on a database
--     nobody has touched, leave nothing to revert TO, and outrank a later
--     correction — a release that fixed a typo in a title would appear to do
--     nothing, because the seeded row would still win.
--
-- So: no INSERT belongs in this file, now or later.
--
-- ---------------------------------------------------------------------------
-- Idempotent: safe to import repeatedly. Re-running is a no-op, and it never
-- touches a row — CREATE TABLE IF NOT EXISTS, no DROP, no TRUNCATE, no INSERT.
--
-- Run after 01/02/03 on existing installs, and after 01/02 on fresh ones.
-- Order does not otherwise matter: there is no foreign key to `pages`, and
-- that is deliberate. Most rows here address routes that are CODE, not content
-- — `/news/[slug]` and `/travel/toll` have no `pages` row to point at — and a
-- constraint that only half the rows could satisfy is not a constraint.
-- ---------------------------------------------------------------------------

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `route_meta` (
  `id` int NOT NULL AUTO_INCREMENT,
  -- The LOCALE-LESS path, leading slash, no trailing slash: '/', '/travel/toll',
  -- '/news/[slug]'. Never '/en/news' — the locale is the column beside this one,
  -- and a row keyed with a prefix would be silently never read, which is the
  -- worst failure an editor can have because the screen still says it saved.
  -- normaliseRoute() in lib/seo/route-meta.js refuses one before it is stored.
  -- 191 so the unique key below fits in InnoDB's 3072-byte utf8mb4 index limit.
  `route` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  -- Empty string, not NULL, for "not set". The reader treats blank as absent
  -- either way, and one representation of empty means a save never has to
  -- decide between DELETE and UPDATE-to-NULL.
  `seo_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  -- TEXT: a meta description runs past 255 bytes in Bangla well before it runs
  -- past Google's ~160 CHARACTER display limit, and a truncated description is
  -- a broken sentence in a search result.
  `seo_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `og_image` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  -- Free text at the database level, an ALLOWLIST in the reader: only
  -- 'noindex', 'nofollow' and 'noindex,nofollow' are ever emitted into a meta
  -- tag (ROBOTS_DIRECTIVES). A hand-edited row saying anything else is ignored
  -- rather than published verbatim. 'index,follow' is deliberately not offered:
  -- it is the default, so emitting it as a tag says nothing and invites an
  -- operator to believe they have made a page rank.
  --
  -- Read from the ENGLISH row for every locale. A robots directive is a fact
  -- about the URL, not a translation, and an operator who marks a route
  -- noindex in the only language they read must not leave the other two
  -- indexed.
  `robots` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  -- A canonical override, absolute or root-relative. Read from the English row
  -- for the same reason as `robots`. It replaces the page's self-canonical and
  -- deliberately does NOT touch the hreflang `languages` map, which is a
  -- different statement — about which URLs exist, not about which is primary.
  `canonical` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- Load bearing, not housekeeping. lib/seo/route-meta.js saves with
  -- ON DUPLICATE KEY UPDATE; without this key every save would append a second
  -- row for the same route and locale and the reader would serve whichever the
  -- engine happened to return first.
  UNIQUE KEY `route_meta_route_locale` (`route`, `locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
