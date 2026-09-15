-- 44: legal review on pages (concession audit W8C.2). Statutory and commitment
-- pages were drafted from public sources; until counsel approves a page it
-- carries a visible "under legal review" notice. The approver and date are
-- recorded when it is approved. Safe to import twice.

SET NAMES utf8mb4;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pages' AND COLUMN_NAME = 'legal_status');
SET @s = IF(@c = 0, 'ALTER TABLE `pages` ADD COLUMN `legal_status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `review_interval_days`, ADD COLUMN `legal_approved_by` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '''' AFTER `legal_status`, ADD COLUMN `legal_approved_at` date DEFAULT NULL AFTER `legal_approved_by`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- The pages the audit named: commitments to the public, drafted without
-- sign-off. Only pages with no legal status yet are marked.
UPDATE `pages` SET `legal_status` = 'review', `review_interval_days` = COALESCE(`review_interval_days`, 365), `owner_department` = IF(`owner_department` = '', 'Legal and Company Secretariat', `owner_department`)
 WHERE `legal_status` = ''
   AND `slug` IN ('privacy', 'terms', 'accessibility', 'grievances', 'travel/toll-dispute', 'about/integrity',
                  'disclosures/citizen-charter', 'disclosures/right-to-information', 'disclosures/policies',
                  'disclosures/tariff', 'disclosures/land-acquisition', 'disclosures/environment', 'about/concession', 'procurement');

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('44-legal-review');
