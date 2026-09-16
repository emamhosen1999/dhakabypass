-- 47: four Uplift Bangladesh corridor videos, embedded from YouTube (not copied).
-- On the Videos page (all four) and on The project (the three progress reports in
-- date order). Guarded on the YouTube reference, so re-importing adds nothing.

SET NAMES utf8mb4;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'gallery/videos');
SET @dup = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` bt ON bt.`block_id` = b.`id` WHERE b.`page_id` = @p AND b.`type` = 'video-embed' AND CAST(bt.`data` AS CHAR) LIKE '%m62e7_OVE5s%');
SET @ok = (@p IS NOT NULL AND @dup = 0);
SET @next = (SELECT IFNULL(MAX(`sort_order`), -1) + 1 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', @next, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading": "Corridor progress report, May 2023", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=m62e7_OVE5s", "poster": "/photo/21.webp", "caption": "Uplift Bangladesh, 6 May 2023. Embedded from YouTube; the footage belongs to the channel.", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading": "করিডোরের অগ্রগতি প্রতিবেদন, মে ২০২৩", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=m62e7_OVE5s", "poster": "/photo/21.webp", "caption": "Uplift Bangladesh, ৬ মে ২০২৩। ইউটিউব থেকে এম্বেড করা; ভিডিওটির স্বত্ব চ্যানেলের।", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading": "走廊进展报道，2023年5月", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=m62e7_OVE5s", "poster": "/photo/21.webp", "caption": "Uplift Bangladesh，2023年5月6日。自YouTube嵌入；影片版权归该频道所有。", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'gallery/videos');
SET @dup = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` bt ON bt.`block_id` = b.`id` WHERE b.`page_id` = @p AND b.`type` = 'video-embed' AND CAST(bt.`data` AS CHAR) LIKE '%xCBw4qRFDow%');
SET @ok = (@p IS NOT NULL AND @dup = 0);
SET @next = (SELECT IFNULL(MAX(`sort_order`), -1) + 1 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', @next, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading": "The corridor takes shape, February 2025", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=xCBw4qRFDow", "poster": "/photo/22.webp", "caption": "Uplift Bangladesh, 26 February 2025. Embedded from YouTube; the footage belongs to the channel.", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading": "করিডোর দৃশ্যমান হচ্ছে, ফেব্রুয়ারি ২০২৫", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=xCBw4qRFDow", "poster": "/photo/22.webp", "caption": "Uplift Bangladesh, ২৬ ফেব্রুয়ারি ২০২৫। ইউটিউব থেকে এম্বেড করা; ভিডিওটির স্বত্ব চ্যানেলের।", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading": "走廊初见规模，2025年2月", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=xCBw4qRFDow", "poster": "/photo/22.webp", "caption": "Uplift Bangladesh，2025年2月26日。自YouTube嵌入；影片版权归该频道所有。", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'gallery/videos');
SET @dup = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` bt ON bt.`block_id` = b.`id` WHERE b.`page_id` = @p AND b.`type` = 'video-embed' AND CAST(bt.`data` AS CHAR) LIKE '%BuBzLJ9fSs4%');
SET @ok = (@p IS NOT NULL AND @dup = 0);
SET @next = (SELECT IFNULL(MAX(`sort_order`), -1) + 1 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', @next, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading": "Corridor progress report, March 2025", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=BuBzLJ9fSs4", "poster": "/photo/23.webp", "caption": "Uplift Bangladesh, 26 March 2025. Embedded from YouTube; the footage belongs to the channel.", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading": "করিডোরের অগ্রগতি প্রতিবেদন, মার্চ ২০২৫", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=BuBzLJ9fSs4", "poster": "/photo/23.webp", "caption": "Uplift Bangladesh, ২৬ মার্চ ২০২৫। ইউটিউব থেকে এম্বেড করা; ভিডিওটির স্বত্ব চ্যানেলের।", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading": "走廊进展报道，2025年3月", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=BuBzLJ9fSs4", "poster": "/photo/23.webp", "caption": "Uplift Bangladesh，2025年3月26日。自YouTube嵌入；影片版权归该频道所有。", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'gallery/videos');
SET @dup = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` bt ON bt.`block_id` = b.`id` WHERE b.`page_id` = @p AND b.`type` = 'video-embed' AND CAST(bt.`data` AS CHAR) LIKE '%DcHjiPUujzw%');
SET @ok = (@p IS NOT NULL AND @dup = 0);
SET @next = (SELECT IFNULL(MAX(`sort_order`), -1) + 1 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', @next, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading": "Corridor progress report, May 2025", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=DcHjiPUujzw", "poster": "/photo/20.webp", "caption": "Uplift Bangladesh, 22 May 2025. Embedded from YouTube; the footage belongs to the channel.", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading": "করিডোরের অগ্রগতি প্রতিবেদন, মে ২০২৫", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=DcHjiPUujzw", "poster": "/photo/20.webp", "caption": "Uplift Bangladesh, ২২ মে ২০২৫। ইউটিউব থেকে এম্বেড করা; ভিডিওটির স্বত্ব চ্যানেলের।", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading": "走廊进展报道，2025年5月", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=DcHjiPUujzw", "poster": "/photo/20.webp", "caption": "Uplift Bangladesh，2025年5月22日。自YouTube嵌入；影片版权归该频道所有。", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'project');
SET @dup = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` bt ON bt.`block_id` = b.`id` WHERE b.`page_id` = @p AND b.`type` = 'video-embed' AND CAST(bt.`data` AS CHAR) LIKE '%m62e7_OVE5s%');
SET @ok = (@p IS NOT NULL AND @dup = 0);
SET @next = (SELECT IFNULL(MAX(`sort_order`), -1) + 1 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', @next, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading": "Corridor progress report, May 2023", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=m62e7_OVE5s", "poster": "/photo/21.webp", "caption": "Uplift Bangladesh, 6 May 2023. Embedded from YouTube; the footage belongs to the channel.", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading": "করিডোরের অগ্রগতি প্রতিবেদন, মে ২০২৩", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=m62e7_OVE5s", "poster": "/photo/21.webp", "caption": "Uplift Bangladesh, ৬ মে ২০২৩। ইউটিউব থেকে এম্বেড করা; ভিডিওটির স্বত্ব চ্যানেলের।", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading": "走廊进展报道，2023年5月", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=m62e7_OVE5s", "poster": "/photo/21.webp", "caption": "Uplift Bangladesh，2023年5月6日。自YouTube嵌入；影片版权归该频道所有。", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'project');
SET @dup = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` bt ON bt.`block_id` = b.`id` WHERE b.`page_id` = @p AND b.`type` = 'video-embed' AND CAST(bt.`data` AS CHAR) LIKE '%BuBzLJ9fSs4%');
SET @ok = (@p IS NOT NULL AND @dup = 0);
SET @next = (SELECT IFNULL(MAX(`sort_order`), -1) + 1 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', @next, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading": "Corridor progress report, March 2025", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=BuBzLJ9fSs4", "poster": "/photo/23.webp", "caption": "Uplift Bangladesh, 26 March 2025. Embedded from YouTube; the footage belongs to the channel.", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading": "করিডোরের অগ্রগতি প্রতিবেদন, মার্চ ২০২৫", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=BuBzLJ9fSs4", "poster": "/photo/23.webp", "caption": "Uplift Bangladesh, ২৬ মার্চ ২০২৫। ইউটিউব থেকে এম্বেড করা; ভিডিওটির স্বত্ব চ্যানেলের।", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading": "走廊进展报道，2025年3月", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=BuBzLJ9fSs4", "poster": "/photo/23.webp", "caption": "Uplift Bangladesh，2025年3月26日。自YouTube嵌入；影片版权归该频道所有。", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'project');
SET @dup = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` bt ON bt.`block_id` = b.`id` WHERE b.`page_id` = @p AND b.`type` = 'video-embed' AND CAST(bt.`data` AS CHAR) LIKE '%DcHjiPUujzw%');
SET @ok = (@p IS NOT NULL AND @dup = 0);
SET @next = (SELECT IFNULL(MAX(`sort_order`), -1) + 1 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', @next, 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading": "Corridor progress report, May 2025", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=DcHjiPUujzw", "poster": "/photo/20.webp", "caption": "Uplift Bangladesh, 22 May 2025. Embedded from YouTube; the footage belongs to the channel.", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading": "করিডোরের অগ্রগতি প্রতিবেদন, মে ২০২৫", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=DcHjiPUujzw", "poster": "/photo/20.webp", "caption": "Uplift Bangladesh, ২২ মে ২০২৫। ইউটিউব থেকে এম্বেড করা; ভিডিওটির স্বত্ব চ্যানেলের।", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading": "走廊进展报道，2025年5月", "intro": "", "provider": "youtube", "reference": "https://www.youtube.com/watch?v=DcHjiPUujzw", "poster": "/photo/20.webp", "caption": "Uplift Bangladesh，2025年5月22日。自YouTube嵌入；影片版权归该频道所有。", "transcriptHref": ""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('47-progress-videos');
