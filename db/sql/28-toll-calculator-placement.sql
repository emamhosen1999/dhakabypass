-- 28-toll-calculator-placement.sql — the toll calculator and the fare matrix
-- on the pages where a visitor looks for them.
--
-- INT.2 built the `toll-calculator` block (entry plaza × exit plaza × vehicle
-- class -> fare, distance, time, from toll_od_rates) and INT.1 the
-- `toll-matrix` block, but neither was ever PLACED on a page, so the
-- operator's first question after launch was "where is the calculator?".
--
--   /travel/toll  calculator after the toll table, then the matrix, before
--                 the prohibited-vehicles list
--   home          the calculator as a slim teaser after the toll preview
--                 (the PLUS Malaysia precedent the plan cites)
--
-- The fares it reads are the PROVISIONAL matrix (12-toll-od-matrix.sql); the
-- block shows the provisional notice itself, from the generated column.
-- Pages resolved by slug; new blocks share the sort_order of the block they
-- follow with higher ids. Idempotent. ID map: blocks 440-442.

SET @toll = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/toll' LIMIT 1);
SET @home = (SELECT `id` FROM `pages` WHERE `slug` = 'home' LIMIT 1);

INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 440, @toll, 'toll-calculator', 2, NULL, 'published' FROM DUAL WHERE @toll IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 441, @toll, 'toll-matrix', 2, NULL, 'published' FROM DUAL WHERE @toll IS NOT NULL;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 442, @home, 'toll-calculator', 1, NULL, 'published' FROM DUAL WHERE @home IS NOT NULL;

INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
  (440,'en','{"heading":"Toll calculator","intro":"Choose where you join and leave the expressway and your vehicle class. The fare, the distance and an estimated time are worked out from the published rates."}','published'),
  (440,'bn','{"heading":"টোল ক্যালকুলেটর","intro":"এক্সপ্রেসওয়েতে কোথায় উঠবেন ও নামবেন এবং আপনার যানবাহনের শ্রেণি বেছে নিন। প্রকাশিত হার থেকে ভাড়া, দূরত্ব ও আনুমানিক সময় হিসাব করা হবে।"}','published'),
  (440,'zh','{"heading":"通行费计算器","intro":"选择上下快速路的位置和车型，即可根据公布的费率计算通行费、距离和预计用时。"}','published'),
  (441,'en','{"heading":"Fare matrix","intro":"Every entry and exit pair for one vehicle class. Change the class to see its matrix.","caption":"Toll between each pair of plazas, in taka."}','published'),
  (441,'bn','{"heading":"ভাড়ার সারণি","intro":"একটি যানবাহন শ্রেণির জন্য প্রতিটি প্রবেশ ও প্রস্থান জোড়া। শ্রেণি বদলালে তার সারণি দেখা যাবে।","caption":"প্রতিটি প্লাজা জোড়ার মধ্যে টোল, টাকায়।"}','published'),
  (441,'zh','{"heading":"费率矩阵","intro":"一种车型的所有出入口组合。更改车型可查看对应矩阵。","caption":"各收费站之间的通行费（塔卡）。"}','published'),
  (442,'en','{"heading":"What will my journey cost?","intro":"Pick your entry, exit and vehicle class."}','published'),
  (442,'bn','{"heading":"আমার যাত্রায় কত খরচ হবে?","intro":"প্রবেশ, প্রস্থান ও যানবাহনের শ্রেণি বেছে নিন।"}','published'),
  (442,'zh','{"heading":"我的行程需要多少通行费？","intro":"选择入口、出口和车型。"}','published');

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('28-toll-calculator-placement');
