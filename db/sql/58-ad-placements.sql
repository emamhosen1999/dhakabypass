-- 58-ad-placements.sql — where advertising sits (19 September 2026).
--
-- Advertising was authorised by DBEDC. These are the placements, as blocks an
-- operator can move or delete at /admin like any other.
--
-- EVERY UNIT SHIPS WITH AN EMPTY AD UNIT ID, so nothing renders until the
-- AdSense account is approved and the operator pastes each ID into the block.
-- That is deliberate: a slot with a made-up ID is a policy violation, and a
-- labelled empty box is worse than no box.
--
-- WHERE THEY ARE NOT. lib/ads/config.js refuses to render on the emergency,
-- grievance, contact, disclosure and toll pages whatever is placed there, and
-- no unit is placed on them here either. safety/ is left out as well: road
-- safety education with an advertisement beside it reads badly, and that call
-- belongs to DBEDC rather than to this file.
--
-- POSITIONS. Blocks are read ORDER BY sort_order, id, so a unit inserted with
-- an existing sort_order lands after every block already carrying it. Each
-- position below is chosen for viewability without touching the top of a page,
-- where the hero is the largest paint and the main thread is already busy.
--
-- Idempotent: a page that already carries a unit is skipped entirely.

SET NAMES utf8mb4;


-- ---------------------------------------------------------------- home
SET @p = (SELECT id FROM `pages` WHERE `slug` = 'home' LIMIT 1);
SET @none = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p AND `type` = 'ad-slot');
-- below the calculator — the busiest page, but well under the hero, which is the LCP element
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 5, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- project
SET @p = (SELECT id FROM `pages` WHERE `slug` = 'project' LIMIT 1);
SET @none = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p AND `type` = 'ad-slot');
-- after the opening prose, where a reader who scrolled is committed
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 3, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
-- before the video section, at the end of the long middle
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 5, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"leaderboard","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"leaderboard","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"leaderboard","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- travel/rules
SET @p = (SELECT id FROM `pages` WHERE `slug` = 'travel/rules' LIMIT 1);
SET @none = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p AND `type` = 'ad-slot');
-- early: a driver reading the rules is high-intent traffic
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 1, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
-- after the last rule, before the call to action
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 4, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"leaderboard","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"leaderboard","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"leaderboard","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- about
SET @p = (SELECT id FROM `pages` WHERE `slug` = 'about' LIMIT 1);
SET @none = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p AND `type` = 'ad-slot');
-- mid-content, after the first prose
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 3, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- sustainability
SET @p = (SELECT id FROM `pages` WHERE `slug` = 'sustainability' LIMIT 1);
SET @none = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p AND `type` = 'ad-slot');
-- after the body, before the call to action
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 2, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- media
SET @p = (SELECT id FROM `pages` WHERE `slug` = 'media' LIMIT 1);
SET @none = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p AND `type` = 'ad-slot');
-- above the news list, which is what the page is read for
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 5, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- gallery/videos
SET @p = (SELECT id FROM `pages` WHERE `slug` = 'gallery/videos' LIMIT 1);
SET @none = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p AND `type` = 'ad-slot');
-- halfway down the gallery, where dwell time is longest
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 4, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- travel/status
SET @p = (SELECT id FROM `pages` WHERE `slug` = 'travel/status' LIMIT 1);
SET @none = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p AND `type` = 'ad-slot');
-- below the live figures — the page with the most repeat visits
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'ad-slot', 4, 'published' FROM DUAL WHERE @p IS NOT NULL AND @none = 1;
SET @b = IF(@none = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"format":"rectangle","slot":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- The ledger row preflight reads to know this file has been applied.
INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('58-ad-placements');
