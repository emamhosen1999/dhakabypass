-- 23-not-found.sql — the 404 page as a block document (W1.19).
--
-- app/not-found.jsx read the dead `content` table and rendered "Page Not
-- Found" in English under every locale, in the legacy site's Tailwind
-- styling. app/[locale]/not-found.jsx now renders the `pages` row with slug
-- `not-found` — inside the locale chrome, with the 404 status a not-found
-- boundary carries — so an operator edits the 404 like any other page.
--
-- The slug is reserved: /[locale]/not-found itself 404s (which renders this
-- document, with the right status), and the sitemap never lists it. While
-- this row is absent or unpublished the ui_strings fallback renders instead.
--
-- Idempotent: INSERT IGNORE. ID map: page 340, blocks 365-366.

/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT IGNORE INTO `pages` (`id`, `slug`, `parent_id`, `template`, `nav_order`, `status`, `published_at`, `created_at`, `updated_at`) VALUES
  (340,'not-found',NULL,'default',999,'published',NOW(),NOW(),NOW());
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;

/*!40000 ALTER TABLE `page_translations` DISABLE KEYS */;
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `status`) VALUES
  (340,'en','Page not found','published'),(340,'bn','পাতাটি পাওয়া যায়নি','published'),(340,'zh','页面未找到','published');
/*!40000 ALTER TABLE `page_translations` ENABLE KEYS */;

/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`) VALUES
  (365,340,'page-header',0,NULL,'published'),
  (366,340,'cta-band',1,NULL,'published');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;

/*!40000 ALTER TABLE `block_translations` DISABLE KEYS */;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
  (365,'en','{"eyebrow":"404","heading":"Page not found","lede":"The page you asked for does not exist or has moved. The address may have changed when the site was rebuilt."}','published'),
  (365,'bn','{"eyebrow":"404","heading":"পাতাটি পাওয়া যায়নি","lede":"আপনি যে পাতাটি চেয়েছেন তা নেই, অথবা সরানো হয়েছে। সাইট নতুন করে তৈরির সময় ঠিকানাটি বদলে থাকতে পারে।"}','published'),
  (365,'zh','{"eyebrow":"404","heading":"页面未找到","lede":"您访问的页面不存在或已移动。网站改版时地址可能已更改。"}','published'),
  (366,'en','{"heading":"Where to next","body":"Toll rates, what is open today, and how to reach DBEDC.","primaryLabel":"Back to the home page","primaryHref":"/","secondaryLabel":"Toll rates","secondaryHref":"travel/toll"}','published'),
  (366,'bn','{"heading":"এরপর কোথায়","body":"টোল হার, আজ কী খোলা আছে, এবং DBEDC-এর সঙ্গে যোগাযোগের উপায়।","primaryLabel":"হোম পেজে ফিরে যান","primaryHref":"/","secondaryLabel":"টোল হার","secondaryHref":"travel/toll"}','published'),
  (366,'zh','{"heading":"接下来","body":"通行费、今日通车路段，以及联系 DBEDC 的方式。","primaryLabel":"返回首页","primaryHref":"/","secondaryLabel":"通行费","secondaryHref":"travel/toll"}','published');
/*!40000 ALTER TABLE `block_translations` ENABLE KEYS */;
