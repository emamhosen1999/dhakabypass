-- 20-grievance-form.sql — a grievance form on /grievances.
--
-- /grievances (page 13) explained what to include in a grievance and then
-- sent the reader to the general contact form, because there was nothing
-- else to send them to. With the request-form block (19-service-requests.sql,
-- INT.8) there is: this places one, configured as a grievance, with the
-- location field asked and the standard 30-day response deadline. The
-- sender gets a GR- tracking number; the request lands at /admin/requests.
--
-- Placement: sort_order 3 with an id above the rich-text at 3, so it renders
-- after the "what to include" copy and before the cta-band at 4. The
-- cta-band's seeded sentence is rewritten at the bottom of this file, and
-- only if it is still the seeded sentence.
--
-- Idempotent: INSERT IGNORE, and UPDATEs guarded on the exact seeded text.
-- ID map: block 359 on the `grievances` page.

-- Resolved by SLUG: the grievances page is id 11 in 02-seed.sql and 13 on a
-- re-seeded development database. Ids of seeded rows are never assumed.
SET @grievances = (SELECT `id` FROM `pages` WHERE `slug` = 'grievances' LIMIT 1);

/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`)
  SELECT 359, @grievances, 'request-form', 3, NULL, 'published' FROM DUAL WHERE @grievances IS NOT NULL;
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;

/*!40000 ALTER TABLE `block_translations` DISABLE KEYS */;
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
  (359,'en','{"kind":"grievance","heading":"Lodge a grievance","intro":"Use this form for a complaint about the expressway, its tolling, or its construction. You will receive a tracking number to quote in any follow-up.","askPhone":"yes","askEmail":"yes","askVehicle":"no","askLocation":"yes","slaDays":0,"successNote":""}','published'),
  (359,'bn','{"kind":"grievance","heading":"অভিযোগ দাখিল করুন","intro":"এক্সপ্রেসওয়ে, এর টোল বা নির্মাণকাজ সম্পর্কে অভিযোগ জানাতে এই ফর্ম ব্যবহার করুন। পরবর্তী যোগাযোগে উল্লেখ করার জন্য আপনি একটি ট্র্যাকিং নম্বর পাবেন।","askPhone":"yes","askEmail":"yes","askVehicle":"no","askLocation":"yes","slaDays":0,"successNote":""}','published'),
  (359,'zh','{"kind":"grievance","heading":"提交申诉","intro":"如对快速路、其收费或施工有投诉，请使用此表单。您将获得一个查询编号，后续联系时请注明。","askPhone":"yes","askEmail":"yes","askVehicle":"no","askLocation":"yes","slaDays":0,"successNote":""}','published');
/*!40000 ALTER TABLE `block_translations` ENABLE KEYS */;

-- The cta-band beneath the form said "Until the dedicated
-- grievance channels are published, use the general contact route" — true
-- when it was seeded, false once the form above it exists. Rewritten ONLY
-- if it still carries the seeded sentence: an operator's own edit is left
-- alone, and re-running the file changes nothing. The block is found by page
-- slug and type, not id.
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', 'For anything that is not a grievance, or if you would rather write to us, the general contact form is here.')
 WHERE `block_id` = (SELECT b.`id` FROM `blocks` b WHERE b.`page_id` = @grievances AND b.`type` = 'cta-band' ORDER BY b.`sort_order` DESC, b.`id` LIMIT 1) AND `locale` = 'en'
   AND JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.body')) = 'Until the dedicated grievance channels are published, use the general contact route.';
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', 'অভিযোগ ছাড়া অন্য কোনও বিষয়ে, কিংবা আমাদের কাছে লিখতে চাইলে, সাধারণ যোগাযোগ ফর্মটি এখানে।')
 WHERE `block_id` = (SELECT b.`id` FROM `blocks` b WHERE b.`page_id` = @grievances AND b.`type` = 'cta-band' ORDER BY b.`sort_order` DESC, b.`id` LIMIT 1) AND `locale` = 'bn'
   AND JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.body')) = 'অভিযোগের নির্দিষ্ট মাধ্যম প্রকাশিত না হওয়া পর্যন্ত সাধারণ যোগাযোগের মাধ্যমটি ব্যবহার করুন।';
UPDATE `block_translations` SET `data` = JSON_SET(`data`, '$.body', '如非申诉事项，或您希望以其他方式联系我们，可使用一般联系表单。')
 WHERE `block_id` = (SELECT b.`id` FROM `blocks` b WHERE b.`page_id` = @grievances AND b.`type` = 'cta-band' ORDER BY b.`sort_order` DESC, b.`id` LIMIT 1) AND `locale` = 'zh'
   AND JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.body')) = '在专门投诉渠道公布之前，请使用一般联系方式。';
