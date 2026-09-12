-- 16-travel-pages.sql — the six travel pages as block documents.
--
-- WHY THIS FILE EXISTS
--
-- The client's governing rule: every public page is built by an operator from
-- blocks, and no user-visible content is hardcoded. The six travel pages were
-- the largest exception. Each was a React file in app/[locale]/travel/ that
-- carried its own H1 and lede from the string catalogue, loaded corridor data
-- itself and composed fixed components in a fixed order. An operator could not
-- add a paragraph, move a section or remove one.
--
-- With this file imported, each of those pages is a `pages` row whose blocks
-- reproduce exactly what the page file rendered - the same headings, the same
-- ledes, the same live widgets in the same order - and the page files are
-- deleted. The renderer is app/[locale]/[...slug]/page.jsx, the same one every
-- other block document uses.
--
-- The headings and ledes below are the strings the page files read from
-- lib/i18n/ui.js, copied verbatim, so a visitor sees no change. They are now
-- BLOCK content - editable per page in the block editor - rather than
-- catalogue strings shared across the site. The catalogue keys are left in
-- place; other things still read some of them.
--
-- The travel sub-navigation was injected by app/[locale]/travel/layout.jsx,
-- which the catch-all renderer does not inherit. It is now the `section-subnav`
-- block, placed first on each page, and the layout file is deleted too.
--
-- /travel/rules (page 300, from 13-travel-rules.sql) gets its subnav and
-- title blocks here as well; its content blocks are unchanged.
--
-- Idempotent: INSERT IGNORE throughout, explicit ids above every seeded range.
--
-- ID map:  pages 320-324   blocks 320-349   (300 is travel/rules)

/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT IGNORE INTO `pages` (`id`, `slug`, `parent_id`, `template`, `nav_order`, `status`, `published_at`, `created_at`, `updated_at`) VALUES
  (320,'travel/status',NULL,'default',1,'published',NOW(),NOW(),NOW()),
  (321,'travel/toll',NULL,'default',2,'published',NOW(),NOW(),NOW()),
  (322,'travel/route',NULL,'default',3,'published',NOW(),NOW(),NOW()),
  (323,'travel/map',NULL,'default',4,'published',NOW(),NOW(),NOW()),
  (324,'travel/facilities',NULL,'default',5,'published',NOW(),NOW(),NOW());
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;

-- Titles for the <title> tag and the sitemap. The H1 on the page is the
-- page-header block below; these are the metadata the catch-all reads.
/*!40000 ALTER TABLE `page_translations` DISABLE KEYS */;
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `status`) VALUES
  (320,'en','What''s open','published'),(320,'bn','কী খোলা আছে','published'),(320,'zh','通车路段','published'),
  (321,'en','Toll rates','published'),(321,'bn','টোল হার','published'),(321,'zh','通行费','published'),
  (322,'en','Route & interchanges','published'),(322,'bn','রুট ও ইন্টারচেঞ্জ','published'),(322,'zh','路线与互通','published'),
  (323,'en','Corridor map','published'),(323,'bn','করিডোর মানচিত্র','published'),(323,'zh','走廊地图','published'),
  (324,'en','Facilities','published'),(324,'bn','সুবিধাসমূহ','published'),(324,'zh','配套设施','published'),
  (300,'en','Rules of the road','published'),(300,'bn','সড়ক বিধি','published'),(300,'zh','通行规则','published');
/*!40000 ALTER TABLE `page_translations` ENABLE KEYS */;

/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`) VALUES
  -- travel/status: subnav, title, progress, strip, interchange table
  (320,320,'section-subnav',0,NULL,'published'),
  (321,320,'page-header',1,NULL,'published'),
  (322,320,'progress-bar',2,NULL,'published'),
  (323,320,'corridor-strip',3,NULL,'published'),
  (324,320,'interchange-table',4,NULL,'published'),
  -- travel/toll: subnav, title, toll table, prohibited vehicles
  (325,321,'section-subnav',0,NULL,'published'),
  (326,321,'page-header',1,NULL,'published'),
  (327,321,'toll-table',2,NULL,'published'),
  (328,321,'prohibited-vehicles',3,NULL,'published'),
  -- travel/route: subnav, title, strip, interchange table (entry/exit columns)
  (329,322,'section-subnav',0,NULL,'published'),
  (330,322,'page-header',1,NULL,'published'),
  (331,322,'corridor-strip',2,NULL,'published'),
  (332,322,'interchange-table',3,NULL,'published'),
  -- travel/map: subnav, title, the map
  (333,323,'section-subnav',0,NULL,'published'),
  (334,323,'page-header',1,NULL,'published'),
  (335,323,'corridor-map',2,NULL,'published'),
  -- travel/facilities: subnav, title, rest areas
  (336,324,'section-subnav',0,NULL,'published'),
  (337,324,'page-header',1,NULL,'published'),
  (338,324,'facility-list',2,NULL,'published'),
  -- travel/rules: subnav and title added ABOVE its existing blocks (which start
  -- at sort_order 0), so they take negative positions.
  (339,300,'section-subnav',-2,NULL,'published'),
  (340,300,'page-header',-1,NULL,'published');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;

/*!40000 ALTER TABLE `block_translations` DISABLE KEYS */;
-- section-subnav has no fields; an empty object per locale marks it published.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
  (320,'en','{}','published'),(320,'bn','{}','published'),(320,'zh','{}','published'),
  (325,'en','{}','published'),(325,'bn','{}','published'),(325,'zh','{}','published'),
  (329,'en','{}','published'),(329,'bn','{}','published'),(329,'zh','{}','published'),
  (333,'en','{}','published'),(333,'bn','{}','published'),(333,'zh','{}','published'),
  (336,'en','{}','published'),(336,'bn','{}','published'),(336,'zh','{}','published'),
  (339,'en','{}','published'),(339,'bn','{}','published'),(339,'zh','{}','published');

-- Page titles and ledes, verbatim from the catalogue strings the page files used.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
  (321,'en','{"heading":"What''s open","lede":"Which sections of the expressway are carrying traffic today."}','published'),
  (321,'bn','{"heading":"কী খোলা আছে","lede":"এক্সপ্রেসওয়ের কোন অংশগুলি আজ যান চলাচলের জন্য খোলা।"}','published'),
  (321,'zh','{"heading":"通车路段","lede":"快速路目前已通车的路段。"}','published'),
  (326,'en','{"heading":"Toll rates","lede":"Toll rates for the section currently open to traffic. Rates for the full 48 km corridor have not yet been published."}','published'),
  (326,'bn','{"heading":"টোল হার","lede":"বর্তমানে যান চলাচলের জন্য খোলা অংশের টোল হার এটি। সম্পূর্ণ ৪৮ কিলোমিটার করিডোরের টোল হার এখনও প্রকাশ করা হয়নি।"}','published'),
  (326,'zh','{"heading":"通行费","lede":"目前已通车路段的通行费标准。全长48公里快速路的通行费尚未公布。"}','published'),
  (330,'en','{"heading":"Route & interchanges","lede":"Where to join and leave the expressway."}','published'),
  (330,'bn','{"heading":"রুট ও ইন্টারচেঞ্জ","lede":"এক্সপ্রেসওয়েতে ওঠা ও নামার স্থান।"}','published'),
  (330,'zh','{"heading":"路线与互通","lede":"上下快速路的位置。"}','published'),
  (334,'en','{"eyebrow":"Route & interchanges","heading":"Corridor map","lede":"The alignment from Naojor to Madanpur, drawn from surveyed coordinates, with the condition of each section."}','published'),
  (334,'bn','{"eyebrow":"রুট ও ইন্টারচেঞ্জ","heading":"করিডোর মানচিত্র","lede":"নাওজোড় থেকে মদনপুর পর্যন্ত অ্যালাইনমেন্ট, জরিপকৃত স্থানাঙ্ক থেকে আঁকা, প্রতিটি অংশের অবস্থাসহ।"}','published'),
  (334,'zh','{"eyebrow":"路线与互通","heading":"走廊地图","lede":"自 Naojor 至 Madanpur 的线位，依据实测坐标绘制，并标注各路段的通行状况。"}','published'),
  (337,'en','{"heading":"Facilities","lede":"Service areas and roadside assistance along the corridor."}','published'),
  (337,'bn','{"heading":"সুবিধাসমূহ","lede":"করিডোর বরাবর সার্ভিস এরিয়া ও সড়ক সহায়তা।"}','published'),
  (337,'zh','{"heading":"配套设施","lede":"沿线服务区与道路救援。"}','published'),
  (340,'en','{"heading":"Rules of the road","lede":"Speed limits, permitted vehicles and what to do if you break down."}','published'),
  (340,'bn','{"heading":"সড়ক বিধি","lede":"গতিসীমা, অনুমোদিত যানবাহন এবং যানবাহন বিকল হলে করণীয়।"}','published'),
  (340,'zh','{"heading":"通行规则","lede":"限速、准许通行车辆，以及车辆故障时的处理方式。"}','published');

-- Live blocks: configuration only. The captions were catalogue strings; they
-- are now the block's own caption field so an operator can change one page's
-- table without changing every table.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
  (322,'en','{}','published'),(322,'bn','{}','published'),(322,'zh','{}','published'),
  (323,'en','{}','published'),(323,'bn','{}','published'),(323,'zh','{}','published'),
  (324,'en','{"caption":"Interchanges and facilities along the corridor, north to south.","showFacilities":"yes"}','published'),
  (324,'bn','{"caption":"করিডোর বরাবর ইন্টারচেঞ্জ ও সুবিধাসমূহ, উত্তর থেকে দক্ষিণে।","showFacilities":"yes"}','published'),
  (324,'zh','{"caption":"沿线互通立交与配套设施，由北至南。","showFacilities":"yes"}','published'),
  (327,'en','{"caption":"Toll rates currently in force."}','published'),
  (327,'bn','{"caption":"বর্তমানে কার্যকর টোল হার।"}','published'),
  (327,'zh','{"caption":"现行通行费标准。"}','published'),
  (328,'en','{}','published'),(328,'bn','{}','published'),(328,'zh','{}','published'),
  (331,'en','{}','published'),(331,'bn','{}','published'),(331,'zh','{}','published'),
  (332,'en','{"caption":"Entry and exit points, north to south.","showFacilities":"no"}','published'),
  (332,'bn','{"caption":"প্রবেশ ও প্রস্থানের স্থান, উত্তর থেকে দক্ষিণে।","showFacilities":"no"}','published'),
  (332,'zh','{"caption":"出入口，由北至南。","showFacilities":"no"}','published'),
  (335,'en','{}','published'),(335,'bn','{}','published'),(335,'zh','{}','published'),
  (338,'en','{}','published'),(338,'bn','{}','published'),(338,'zh','{}','published');
/*!40000 ALTER TABLE `block_translations` ENABLE KEYS */;
