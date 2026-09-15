-- 40: "Last updated" on the statutory and policy pages (UI audit UI-TRUST-02,
-- concession audit CON-SEO-K-02). The date is derived from the page's own
-- block records by the renderer; this only switches it on, on the pages a
-- reader needs to know are current. Safe to import twice.

SET NAMES utf8mb4;

UPDATE `block_translations` bt
  JOIN `blocks` b ON b.`id` = bt.`block_id`
  JOIN `pages` p ON p.`id` = b.`page_id`
   SET bt.`data` = JSON_SET(bt.`data`, '$.showUpdated', 'yes')
 WHERE b.`type` = 'page-header'
   AND (p.`slug` LIKE 'disclosures/%' OR p.`slug` IN ('privacy', 'terms', 'accessibility', 'grievances', 'travel/toll', 'travel/rules', 'travel/toll-dispute', 'about/concession', 'about/governance', 'about/integrity', 'procurement'))
   AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.showUpdated')), '') <> 'yes';

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('40-last-updated');
