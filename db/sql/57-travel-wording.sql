-- 57: the travel section is "যাতায়াত তথ্য" everywhere, not "ভ্রমণ তথ্য".
--
-- The 17 September audit moved the Bangla nav label from ভ্রমণ (a trip,
-- tourism) to যাতায়াত (getting about, commuting), which is what this section
-- is. The page headers, the travel hub's title, the home page's band label
-- and the section index still carried the old word, so a reader saw two
-- names for one section. The 360° page is a "view", not a journey, for the
-- same reason. Safe to import twice: every statement matches the old text
-- and rewrites nothing once it is gone.

SET NAMES utf8mb4;

UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = REPLACE(CAST(bt.`data` AS CHAR), 'ভ্রমণ তথ্য', 'যাতায়াত তথ্য')
 WHERE bt.`locale` = 'bn'
   AND LOCATE('ভ্রমণ তথ্য', CAST(bt.`data` AS CHAR)) > 0;

UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = REPLACE(CAST(bt.`data` AS CHAR), 'ভ্রমণ অংশে', 'যাতায়াত অংশে')
 WHERE bt.`locale` = 'bn'
   AND LOCATE('ভ্রমণ অংশে', CAST(bt.`data` AS CHAR)) > 0;

-- The card names the page it points at; the page is titled "কী খোলা আছে".
UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = REPLACE(CAST(bt.`data` AS CHAR), 'ভ্রমণ অবস্থা পেজে', '‘কী খোলা আছে’ পেজে')
 WHERE bt.`locale` = 'bn'
   AND LOCATE('ভ্রমণ অবস্থা পেজে', CAST(bt.`data` AS CHAR)) > 0;

UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = REPLACE(CAST(bt.`data` AS CHAR), '৩৬০° ভ্রমণ', '৩৬০° ভিউ')
 WHERE bt.`locale` = 'bn'
   AND LOCATE('৩৬০° ভ্রমণ', CAST(bt.`data` AS CHAR)) > 0;

UPDATE `page_translations` SET `title` = REPLACE(`title`, 'ভ্রমণ তথ্য', 'যাতায়াত তথ্য')
 WHERE `locale` = 'bn' AND LOCATE('ভ্রমণ তথ্য', `title`) > 0;
UPDATE `page_translations` SET `seo_title` = REPLACE(`seo_title`, 'ভ্রমণ তথ্য', 'যাতায়াত তথ্য')
 WHERE `locale` = 'bn' AND LOCATE('ভ্রমণ তথ্য', `seo_title`) > 0;
UPDATE `page_translations` SET `seo_description` = REPLACE(`seo_description`, 'ভ্রমণ তথ্য', 'যাতায়াত তথ্য')
 WHERE `locale` = 'bn' AND LOCATE('ভ্রমণ তথ্য', `seo_description`) > 0;
UPDATE `page_translations` SET `title` = REPLACE(`title`, '৩৬০° ভ্রমণ', '৩৬০° ভিউ')
 WHERE `locale` = 'bn' AND LOCATE('৩৬০° ভ্রমণ', `title`) > 0;
UPDATE `page_translations` SET `seo_title` = REPLACE(`seo_title`, '৩৬০° ভ্রমণ', '৩৬০° ভিউ')
 WHERE `locale` = 'bn' AND LOCATE('৩৬০° ভ্রমণ', `seo_title`) > 0;

UPDATE `menu_items` SET `labels` = REPLACE(CAST(`labels` AS CHAR), 'ভ্রমণ তথ্য', 'যাতায়াত তথ্য')
 WHERE LOCATE('ভ্রমণ তথ্য', CAST(`labels` AS CHAR)) > 0;
UPDATE `menu_items` SET `labels` = REPLACE(CAST(`labels` AS CHAR), '৩৬০° ভ্রমণ', '৩৬০° ভিউ')
 WHERE LOCATE('৩৬০° ভ্রমণ', CAST(`labels` AS CHAR)) > 0;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('57-travel-wording');
