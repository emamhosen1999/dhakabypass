-- 17-news-gallery-contact.sql — /news, /gallery and /contact as block documents.
--
-- The second half of W1.8. After the six travel pages (16-travel-pages.sql),
-- these were the remaining code routes carrying user-visible content:
--
--   app/[locale]/news/page.jsx      -> page-header + news-list
--   app/[locale]/gallery/page.jsx   -> page-header + gallery-grid
--   app/[locale]/contact/page.jsx   -> page-header + contact-form
--
-- Each block reproduces what the page file rendered, reading the same cached
-- readers. The headings and ledes are the catalogue strings the pages used,
-- copied verbatim, so a visitor sees no change. The page files are deleted.
--
-- The contact page's hardcoded fallback address and email are NOT carried
-- over. They were English-only literals shown to every locale when
-- site_settings was empty, inherited from the old site and confirmed by
-- nobody. The block renders a "not yet published" callout instead; the
-- address is typed once at /admin/settings if DBEDC wants it shown.
--
-- /news/[slug] remains a code route. It is a template - one file, as many
-- URLs as there are articles - and is one of the three declared exceptions
-- to the block-document rule (plan: "W1.8 (rewritten)").
--
-- Idempotent: INSERT IGNORE throughout. ID map: pages 330-332, blocks 350-355.

/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT IGNORE INTO `pages` (`id`, `slug`, `parent_id`, `template`, `nav_order`, `status`, `published_at`, `created_at`, `updated_at`) VALUES
  (330,'news',NULL,'default',0,'published',NOW(),NOW(),NOW()),
  (331,'gallery',NULL,'default',0,'published',NOW(),NOW(),NOW()),
  (332,'contact',NULL,'default',0,'published',NOW(),NOW(),NOW());
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;

/*!40000 ALTER TABLE `page_translations` DISABLE KEYS */;
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `status`) VALUES
  (330,'en','Newsroom','published'),(330,'bn','সংবাদকক্ষ','published'),(330,'zh','新闻中心','published'),
  (331,'en','Photography','published'),(331,'bn','আলোকচিত্র','published'),(331,'zh','影像','published'),
  (332,'en','Contact DBEDC','published'),(332,'bn','DBEDC-এর সঙ্গে যোগাযোগ','published'),(332,'zh','联系 DBEDC','published');
/*!40000 ALTER TABLE `page_translations` ENABLE KEYS */;

/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`) VALUES
  (350,330,'page-header',0,NULL,'published'),
  (351,330,'news-list',1,NULL,'published'),
  (352,331,'page-header',0,NULL,'published'),
  (353,331,'gallery-grid',1,NULL,'published'),
  (354,332,'page-header',0,NULL,'published'),
  (355,332,'contact-form',1,NULL,'published');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;

/*!40000 ALTER TABLE `block_translations` DISABLE KEYS */;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
  (350,'en','{"eyebrow":"News","heading":"Newsroom","lede":"Announcements and operational notices from DBEDC."}','published'),
  (350,'bn','{"eyebrow":"সংবাদ","heading":"সংবাদকক্ষ","lede":"DBEDC-এর ঘোষণা ও পরিচালনা সংক্রান্ত বিজ্ঞপ্তি।"}','published'),
  (350,'zh','{"eyebrow":"新闻","heading":"新闻中心","lede":"DBEDC 的公告与运营通知。"}','published'),
  (351,'en','{"limit":24}','published'),(351,'bn','{"limit":24}','published'),(351,'zh','{"limit":24}','published'),
  (352,'en','{"eyebrow":"Gallery","heading":"Photography","lede":"The corridor, its construction and the communities along it."}','published'),
  (352,'bn','{"eyebrow":"গ্যালারি","heading":"আলোকচিত্র","lede":"করিডোর, তার নির্মাণকাজ এবং পাশের জনপদ।"}','published'),
  (352,'zh','{"eyebrow":"图片库","heading":"影像","lede":"走廊沿线的工程建设与周边社区。"}','published'),
  (353,'en','{"limit":60}','published'),(353,'bn','{"limit":60}','published'),(353,'zh','{"limit":60}','published'),
  (354,'en','{"eyebrow":"Contact","heading":"Contact DBEDC","lede":"Ask a question, report a problem on the expressway, or request a document."}','published'),
  (354,'bn','{"eyebrow":"যোগাযোগ","heading":"DBEDC-এর সঙ্গে যোগাযোগ","lede":"প্রশ্ন করুন, এক্সপ্রেসওয়ের কোনও সমস্যা জানান, কিংবা কোনও নথি চেয়ে নিন।"}','published'),
  (354,'zh','{"eyebrow":"联系我们","heading":"联系 DBEDC","lede":"咨询问题、反映快速路上的情况，或索取文件。"}','published'),
  (355,'en','{}','published'),(355,'bn','{}','published'),(355,'zh','{}','published');
/*!40000 ALTER TABLE `block_translations` ENABLE KEYS */;
