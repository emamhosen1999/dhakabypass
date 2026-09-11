-- 18-home-corridor.sql — the home page's corridor section as blocks.
--
-- The last of W1.8. app/[locale]/page.jsx was the final content page file on
-- disk. Between the hero and the rest of the document it rendered a hardcoded
-- section: the "The corridor today" heading, the illustrative-data notice, the
-- construction progress bar, the corridor strip, the first five interchanges,
-- and two buttons (all toll rates, route & interchanges). An operator could
-- not move it, retitle it, or take it off the page.
--
-- With this file imported that section is three blocks in the `home` document,
-- reproducing what the file rendered through the same cached readers:
--
--   progress-bar       heading "The corridor today" (verbatim from
--                      ui.homeCorridorHeading); carries the illustrative notice
--   corridor-strip     the strip
--   interchange-table  limit 5, facilities hidden, link "Route & interchanges"
--                      -> travel/route (verbatim from ui.seeRoute)
--
-- The "All toll rates — ৳80" button is NOT carried over. The toll-preview block
-- already sitting directly beneath this section shows the live car rate and
-- links to travel/toll; a second button to the same page one screen apart was
-- a duplicate the page file could not remove and an operator now can.
--
-- The page file is deleted. app/[locale]/[[...slug]]/page.jsx (an optional
-- catch-all, so an empty slug is the home row) renders the home page exactly
-- as it renders every other document.
--
-- PLACEMENT. The home document's blocks are numbered 0 (hero) to 8 (cta-band).
-- These three are inserted at sort_order 0 with ids above the hero's; the
-- renderer orders by (sort_order, id), so they land after the hero and before
-- toll-preview at 1 without renumbering anything. The editor renumbers the
-- whole page on the operator's next drag.
--
-- Idempotent: INSERT IGNORE throughout. ID map: blocks 356-358 on page 1.

/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`) VALUES
  (356,1,'progress-bar',0,NULL,'published'),
  (357,1,'corridor-strip',0,NULL,'published'),
  (358,1,'interchange-table',0,NULL,'published');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;

/*!40000 ALTER TABLE `block_translations` DISABLE KEYS */;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
  (356,'en','{"heading":"The corridor today"}','published'),
  (356,'bn','{"heading":"আজকের করিডোর"}','published'),
  (356,'zh','{"heading":"今日通行状况"}','published'),
  (357,'en','{}','published'),(357,'bn','{}','published'),(357,'zh','{}','published'),
  (358,'en','{"limit":5,"showFacilities":"no","linkLabel":"Route & interchanges","linkHref":"travel/route"}','published'),
  (358,'bn','{"limit":5,"showFacilities":"no","linkLabel":"রুট ও ইন্টারচেঞ্জ","linkHref":"travel/route"}','published'),
  (358,'zh','{"limit":5,"showFacilities":"no","linkLabel":"路线与互通","linkHref":"travel/route"}','published');
/*!40000 ALTER TABLE `block_translations` ENABLE KEYS */;
