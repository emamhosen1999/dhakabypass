-- 36-service-pages.sql — pages for the services added on 14 September 2026, in English, Bangla and Chinese.
--
-- Traffic cameras (live camera-grid), road alerts (SMS/WhatsApp sign-up), electronic
-- toll tags, fleet accounts and frequent travellers (applications with tracking
-- numbers), videos (broadcast coverage embedded from YouTube), a 360° tour
-- (panorama, from wide photographs as samples), recognition (the project's
-- documented firsts), and an office pin on the contact page (sample location).
-- Same rules as 34: located by slug, blocks only into an empty page, additions
-- guarded on their own wording. Safe to import twice.

-- ---------------------------------------------------------------- travel/cameras
-- The connection charset: without it a client defaulting to latin1 stores
-- every non-ASCII character double-encoded (repaired 14 September 2026).
SET NAMES utf8mb4;

INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ('travel/cameras', 'default', 0, 'published', CURRENT_TIMESTAMP);
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/cameras');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'en', 'Traffic cameras', 'Live views of the Dhaka Bypass Expressway from the corridor''s traffic cameras.', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'bn', 'ট্রাফিক ক্যামেরা', 'করিডোরের ট্রাফিক ক্যামেরা থেকে ঢাকা বাইপাস এক্সপ্রেসওয়ের সরাসরি দৃশ্য।', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'zh', '交通摄像头', '来自走廊交通摄像头的达卡绕城高速公路实时画面。', 'published');
SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'section-subnav', 0, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 1, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"eyebrow":"Travel information","heading":"Traffic cameras","lede":"See the plazas and bridges before you set out. Stills refresh on their own; press “Watch live” for a moving picture."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"eyebrow":"ভ্রমণ তথ্য","heading":"ট্রাফিক ক্যামেরা","lede":"রওনা হওয়ার আগে প্লাজা ও সেতুর অবস্থা দেখুন। স্থির ছবি নিজে থেকেই হালনাগাদ হয়; চলমান দৃশ্যের জন্য “সরাসরি দেখুন” চাপুন।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"eyebrow":"出行信息","heading":"交通摄像头","lede":"出发前查看收费站和桥梁状况。静态画面自动刷新；点击“观看直播”查看实时视频。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'camera-grid', 2, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"","intro":"","emptyMessage":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"","intro":"","emptyMessage":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"","intro":"","emptyMessage":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'rich-text', 3, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"About the cameras","body":"<p>The cameras show traffic conditions, not people: views are wide, and images are not recorded or kept for this website. Live video uses mobile data — a still image uses far less. If a camera shows “Offline”, its feed is interrupted; conditions for every section are also on <a href=\\"travel/status\\">what''s open</a>.</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"ক্যামেরা সম্পর্কে","body":"<p>ক্যামেরাগুলো মানুষ নয়, যান চলাচলের অবস্থা দেখায়: দৃশ্য প্রশস্ত, এবং এই ওয়েবসাইটের জন্য ছবি রেকর্ড বা সংরক্ষণ করা হয় না। সরাসরি ভিডিওতে মোবাইল ডেটা খরচ হয় — স্থির ছবিতে অনেক কম। কোনো ক্যামেরা “বন্ধ” দেখালে তার ফিড বিঘ্নিত; প্রতিটি অংশের অবস্থা <a href=\\"travel/status\\">কী খোলা আছে</a> পাতাতেও দেখানো হয়।</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"关于摄像头","body":"<p>摄像头显示的是交通状况而非个人：画面为广角，本网站不录制或保存图像。实时视频会消耗移动数据——静态画面消耗少得多。如摄像头显示“离线”，表示其画面中断；各路段状况也可在<a href=\\"travel/status\\">通车路段</a>页面查看。</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- travel/alerts
INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ('travel/alerts', 'default', 0, 'published', CURRENT_TIMESTAMP);
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/alerts');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'en', 'Road alerts', 'Get closures and major roadworks on the Dhaka Bypass Expressway by SMS, WhatsApp or email.', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'bn', 'সড়ক সতর্কবার্তা', 'ঢাকা বাইপাস এক্সপ্রেসওয়ের সড়ক বন্ধ ও বড় সংস্কারকাজের খবর এসএমএস, হোয়াটসঅ্যাপ বা ইমেইলে পান।', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'zh', '道路提醒', '通过短信、WhatsApp或电子邮件接收达卡绕城高速公路封闭和重大施工信息。', 'published');
SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'section-subnav', 0, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 1, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"eyebrow":"Travel information","heading":"Road alerts","lede":"A short message when a lane or section closes, a toll plaza is affected, or major roadworks are planned — in the language you choose."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"eyebrow":"ভ্রমণ তথ্য","heading":"সড়ক সতর্কবার্তা","lede":"কোনো লেন বা অংশ বন্ধ হলে, টোল প্লাজা প্রভাবিত হলে বা বড় সংস্কারকাজ পরিকল্পিত হলে একটি সংক্ষিপ্ত বার্তা — আপনার পছন্দের ভাষায়।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"eyebrow":"出行信息","heading":"道路提醒","lede":"当车道或路段封闭、收费站受影响或计划重大施工时，以您选择的语言发送简短消息。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'alert-signup', 2, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"","intro":"Alerts are free to receive. Your number is used only for road alerts and is never shared."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"","intro":"সতর্কবার্তা পেতে কোনো খরচ নেই। আপনার নম্বর শুধু সড়ক সতর্কবার্তার জন্য ব্যবহৃত হয় এবং কখনো কারও সঙ্গে শেয়ার করা হয় না।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"","intro":"接收提醒免费。您的号码仅用于道路提醒，绝不会共享。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'newsletter-form', 3, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Or by email","intro":"","note":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"অথবা ইমেইলে","intro":"","note":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"或通过电子邮件","intro":"","note":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'advisory-list', 4, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Current and upcoming","intro":"","emptyMessage":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"চলমান ও আসন্ন","intro":"","emptyMessage":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"当前与近期","intro":"","emptyMessage":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- travel/etc
INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ('travel/etc', 'default', 0, 'published', CURRENT_TIMESTAMP);
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/etc');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'en', 'Electronic toll tags', 'Apply for an electronic toll tag to pass the Dhaka Bypass Expressway plazas without stopping.', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'bn', 'ইলেকট্রনিক টোল ট্যাগ', 'না থেমে ঢাকা বাইপাস এক্সপ্রেসওয়ের প্লাজা পার হতে ইলেকট্রনিক টোল ট্যাগের জন্য আবেদন করুন।', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'zh', '电子收费标签', '申请电子收费标签，不停车通过达卡绕城高速公路收费站。', 'published');
SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'section-subnav', 0, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 1, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"eyebrow":"Travel information","heading":"Electronic toll tags","lede":"A tag on your windscreen, linked to a prepaid account: the barrier opens as you reach it, and the toll is deducted automatically."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"eyebrow":"ভ্রমণ তথ্য","heading":"ইলেকট্রনিক টোল ট্যাগ","lede":"উইন্ডস্ক্রিনে একটি ট্যাগ, প্রিপেইড হিসাবের সঙ্গে যুক্ত: কাছে পৌঁছালেই ব্যারিয়ার খুলে যায় এবং টোল স্বয়ংক্রিয়ভাবে কেটে নেওয়া হয়।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"eyebrow":"出行信息","heading":"电子收费标签","lede":"挡风玻璃上贴一枚标签并关联预付账户：到达时栏杆自动抬起，通行费自动扣除。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'card-grid', 2, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"How it works","intro":"","items":[{"meta":"1","title":"Apply","body":"Apply below with your vehicle''s registration number. You will be told where and when to collect and fit the tag."},{"meta":"2","title":"Top up","body":"Add credit to the tag''s prepaid account; the balance is shown after every passage."},{"meta":"3","title":"Drive through","body":"Use the lanes marked for electronic toll collection and keep to their speed limit. The toll for your class is deducted."}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"কীভাবে কাজ করে","intro":"","items":[{"meta":"১","title":"আবেদন","body":"যানবাহনের নিবন্ধন নম্বর দিয়ে নিচে আবেদন করুন। কোথায় ও কখন ট্যাগ সংগ্রহ ও লাগাতে হবে তা জানানো হবে।"},{"meta":"২","title":"রিচার্জ","body":"ট্যাগের প্রিপেইড হিসাবে টাকা যোগ করুন; প্রতিবার পার হওয়ার পর ব্যালান্স দেখানো হয়।"},{"meta":"৩","title":"চলে যান","body":"ইলেকট্রনিক টোল আদায়ের জন্য চিহ্নিত লেন ব্যবহার করুন এবং তার গতিসীমা মানুন। আপনার শ্রেণির টোল কেটে নেওয়া হবে।"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"使用方式","intro":"","items":[{"meta":"1","title":"申请","body":"填写车牌号在下方申请。我们会通知您领取和安装标签的时间和地点。"},{"meta":"2","title":"充值","body":"为标签预付账户充值；每次通行后显示余额。"},{"meta":"3","title":"直接通行","body":"使用电子收费专用车道并遵守限速，系统按车型扣费。"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'rich-text', 3, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"One tag for every tolled road","body":"<p>Tags follow the national electronic toll collection scheme, so the tag fitted for this expressway is intended to work on other Bangladesh expressways and bridges that use the same scheme. Until electronic lanes open here, applications are registered in order and applicants are contacted first.</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"সব টোল সড়কে একটি ট্যাগ","body":"<p>ট্যাগগুলো জাতীয় ইলেকট্রনিক টোল আদায় ব্যবস্থা অনুসরণ করে, তাই এই এক্সপ্রেসওয়ের জন্য লাগানো ট্যাগ একই ব্যবস্থা ব্যবহারকারী বাংলাদেশের অন্যান্য এক্সপ্রেসওয়ে ও সেতুতেও কাজ করবে বলে নির্ধারিত। এখানে ইলেকট্রনিক লেন চালু না হওয়া পর্যন্ত আবেদনগুলো ক্রমানুসারে নিবন্ধিত হয় এবং আবেদনকারীদের সঙ্গে আগে যোগাযোগ করা হয়।</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"一张标签通行所有收费道路","body":"<p>标签遵循全国电子收费系统，因此为本快速路安装的标签也可用于孟加拉国采用同一系统的其他快速路和桥梁。本快速路电子车道开通前，申请按顺序登记，申请人将优先获得通知。</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'request-form', 4, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"kind":"etc_tag","slaDays":0,"heading":"Apply for a tag","intro":"Give the vehicle''s registration number and class, and how to reach you.","successNote":"Keep this number: you will be contacted when tags are issued."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"kind":"etc_tag","slaDays":0,"heading":"ট্যাগের জন্য আবেদন","intro":"যানবাহনের নিবন্ধন নম্বর ও শ্রেণি এবং আপনার সঙ্গে যোগাযোগের উপায় জানান।","successNote":"এই নম্বর রাখুন: ট্যাগ দেওয়ার সময় আপনার সঙ্গে যোগাযোগ করা হবে।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"kind":"etc_tag","slaDays":0,"heading":"申请标签","intro":"请提供车牌号、车型和联系方式。","successNote":"请保留此编号：发放标签时将与您联系。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- travel/fleet
INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ('travel/fleet', 'default', 0, 'published', CURRENT_TIMESTAMP);
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/fleet');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'en', 'Fleet accounts', 'One account for a company''s vehicles on the Dhaka Bypass Expressway: tags, monthly statements and trip records.', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'bn', 'ফ্লিট অ্যাকাউন্ট', 'ঢাকা বাইপাস এক্সপ্রেসওয়েতে প্রতিষ্ঠানের যানবাহনের জন্য একটি অ্যাকাউন্ট: ট্যাগ, মাসিক বিবরণী ও যাত্রার রেকর্ড।', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'zh', '车队账户', '企业车辆在达卡绕城高速公路的统一账户：标签、月结账单和行程记录。', 'published');
SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'section-subnav', 0, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 1, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"eyebrow":"Travel information","heading":"Fleet accounts","lede":"For transport operators, logistics companies and bus operators that use the expressway every day."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"eyebrow":"ভ্রমণ তথ্য","heading":"ফ্লিট অ্যাকাউন্ট","lede":"প্রতিদিন এক্সপ্রেসওয়ে ব্যবহারকারী পরিবহন, লজিস্টিকস ও বাস পরিচালনাকারী প্রতিষ্ঠানের জন্য।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"eyebrow":"出行信息","heading":"车队账户","lede":"面向每日使用快速路的运输企业、物流公司和客运企业。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'card-grid', 2, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"What a fleet account gives you","intro":"","items":[{"meta":"Tags","title":"Every vehicle tagged","body":"Electronic toll tags for each vehicle, all drawing on one company balance."},{"meta":"Billing","title":"Monthly statement","body":"One statement per month listing every passage by vehicle, plaza, date and class, for your accounts."},{"meta":"Control","title":"Vehicles added and removed","body":"Add a new vehicle or withdraw a sold one through your account manager."},{"meta":"Planning","title":"Journey costs in advance","body":"Use the fare calculator to price regular routes for your vehicle classes."}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"ফ্লিট অ্যাকাউন্টে যা পাবেন","intro":"","items":[{"meta":"ট্যাগ","title":"প্রতিটি যানবাহনে ট্যাগ","body":"প্রতিটি যানবাহনের জন্য ইলেকট্রনিক টোল ট্যাগ, সবগুলো প্রতিষ্ঠানের একটি ব্যালান্স থেকে।"},{"meta":"বিল","title":"মাসিক বিবরণী","body":"হিসাবের জন্য প্রতি মাসে একটি বিবরণী, যানবাহন, প্লাজা, তারিখ ও শ্রেণি অনুযায়ী প্রতিটি পারাপারসহ।"},{"meta":"নিয়ন্ত্রণ","title":"যানবাহন যোগ ও বাদ","body":"অ্যাকাউন্ট ম্যানেজারের মাধ্যমে নতুন যানবাহন যোগ করুন বা বিক্রি হওয়া যানবাহন বাদ দিন।"},{"meta":"পরিকল্পনা","title":"আগেই যাত্রার খরচ","body":"আপনার যানবাহন শ্রেণির নিয়মিত রুটের খরচ জানতে ভাড়া হিসাবকারী ব্যবহার করুন।"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"车队账户提供","intro":"","items":[{"meta":"标签","title":"每辆车配发标签","body":"为每辆车配发电子收费标签，统一从企业余额扣费。"},{"meta":"结算","title":"月结账单","body":"每月一份账单，按车辆、收费站、日期和车型列出每次通行，便于财务核算。"},{"meta":"管理","title":"车辆增减","body":"通过客户经理新增车辆或注销已出售车辆。"},{"meta":"规划","title":"提前核算行程成本","body":"使用费用计算器为各车型的常用线路估算费用。"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'toll-calculator', 3, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Price a regular route","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"নিয়মিত রুটের খরচ","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"常用线路计费","intro":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'request-form', 4, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"kind":"fleet_account","slaDays":0,"heading":"Apply for a fleet account","intro":"Give the company name, a contact person, the number of vehicles by class, and the routes you use.","successNote":"An account manager will contact you with the agreement and the next steps."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"kind":"fleet_account","slaDays":0,"heading":"ফ্লিট অ্যাকাউন্টের জন্য আবেদন","intro":"প্রতিষ্ঠানের নাম, একজন যোগাযোগকারী, শ্রেণি অনুযায়ী যানবাহনের সংখ্যা এবং ব্যবহৃত রুট জানান।","successNote":"একজন অ্যাকাউন্ট ম্যানেজার চুক্তি ও পরবর্তী ধাপ নিয়ে আপনার সঙ্গে যোগাযোগ করবেন।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"kind":"fleet_account","slaDays":0,"heading":"申请车队账户","intro":"请提供公司名称、联系人、各车型车辆数量及常用线路。","successNote":"客户经理将与您联系，说明协议及后续步骤。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- travel/frequent-traveller
INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ('travel/frequent-traveller', 'default', 0, 'published', CURRENT_TIMESTAMP);
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'travel/frequent-traveller');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'en', 'Frequent travellers', 'Register as a frequent traveller on the Dhaka Bypass Expressway.', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'bn', 'নিয়মিত যাত্রী', 'ঢাকা বাইপাস এক্সপ্রেসওয়েতে নিয়মিত যাত্রী হিসেবে নিবন্ধন করুন।', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'zh', '常用出行者', '注册成为达卡绕城高速公路常用出行者。', 'published');
SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'section-subnav', 0, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"menu":"travel"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 1, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"eyebrow":"Travel information","heading":"Frequent travellers","lede":"For people who use the expressway to commute or trade every day. Registered travellers are the first to hear about commuter passes and offers."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"eyebrow":"ভ্রমণ তথ্য","heading":"নিয়মিত যাত্রী","lede":"যাঁরা প্রতিদিন যাতায়াত বা ব্যবসার জন্য এক্সপ্রেসওয়ে ব্যবহার করেন তাঁদের জন্য। নিবন্ধিত যাত্রীরা যাত্রী পাস ও সুবিধার খবর সবার আগে পান।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"eyebrow":"出行信息","heading":"常用出行者","lede":"面向每天通勤或经商使用快速路的人士。注册用户将最先获知通勤卡和优惠信息。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'card-grid', 2, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"What registration brings","intro":"","items":[{"meta":"First","title":"Commuter passes","body":"When monthly or multi-trip passes are introduced for a route, registered travellers are offered them first."},{"meta":"Updates","title":"Notices for your route","body":"Closures and roadworks on the sections you use, by SMS or email."},{"meta":"Feedback","title":"A say in services","body":"Registered travellers are asked first when new services, lanes and facilities are planned."}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"নিবন্ধনে যা পাবেন","intro":"","items":[{"meta":"প্রথম","title":"যাত্রী পাস","body":"কোনো রুটে মাসিক বা একাধিক যাত্রার পাস চালু হলে নিবন্ধিত যাত্রীদের প্রথমে দেওয়া হয়।"},{"meta":"খবর","title":"আপনার রুটের বিজ্ঞপ্তি","body":"আপনি যে অংশ ব্যবহার করেন সেখানে সড়ক বন্ধ ও সংস্কারকাজের খবর, এসএমএস বা ইমেইলে।"},{"meta":"মতামত","title":"সেবায় মতামত","body":"নতুন সেবা, লেন ও সুবিধা পরিকল্পনার সময় নিবন্ধিত যাত্রীদের মতামত প্রথমে নেওয়া হয়।"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"注册后可享","intro":"","items":[{"meta":"优先","title":"通勤卡","body":"某线路推出月卡或多次卡时，优先向注册用户提供。"},{"meta":"动态","title":"线路通知","body":"通过短信或电子邮件接收您常用路段的封闭和施工信息。"},{"meta":"意见","title":"参与服务规划","body":"规划新服务、车道和设施时优先征求注册用户意见。"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'request-form', 3, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"kind":"loyalty","slaDays":0,"heading":"Register","intro":"Give your vehicle number, the journey you make most often and how often you make it.","successNote":"You will be contacted when a pass or offer is available for your route."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"kind":"loyalty","slaDays":0,"heading":"নিবন্ধন","intro":"আপনার যানবাহনের নম্বর, সবচেয়ে বেশি যে যাত্রা করেন এবং কত ঘন ঘন করেন তা জানান।","successNote":"আপনার রুটে পাস বা সুবিধা চালু হলে আপনার সঙ্গে যোগাযোগ করা হবে।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"kind":"loyalty","slaDays":0,"heading":"注册","intro":"请提供车牌号、最常走的行程及频率。","successNote":"您的线路推出通勤卡或优惠时，我们将与您联系。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- gallery/videos
INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ('gallery/videos', 'default', 0, 'published', CURRENT_TIMESTAMP);
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'gallery/videos');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'en', 'Videos', 'Video of the Dhaka Bypass Expressway: the opening, the Eid trial and driving the open section.', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'bn', 'ভিডিও', 'ঢাকা বাইপাস এক্সপ্রেসওয়ের ভিডিও: উদ্বোধন, ঈদের পরীক্ষামূলক চলাচল এবং খোলা অংশে গাড়ি চালানো।', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'zh', '视频', '达卡绕城高速公路视频：通车仪式、开斋节试运行及已通车路段驾驶实录。', 'published');
SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 0, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"eyebrow":"Gallery","heading":"Videos","lede":"News coverage and footage of the expressway. A video loads only when you press play."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"eyebrow":"গ্যালারি","heading":"ভিডিও","lede":"এক্সপ্রেসওয়ের সংবাদ ও ভিডিওচিত্র। প্লে চাপলেই কেবল ভিডিও লোড হয়।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"eyebrow":"图片库","heading":"视频","lede":"快速路相关新闻报道和影像。点击播放后才会加载视频。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', 1, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Opening of the expressway","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=r6BVgEcNXY4","poster":"","caption":"Somoy TV report on the opening, August 2025.","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"এক্সপ্রেসওয়ের উদ্বোধন","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=r6BVgEcNXY4","poster":"","caption":"উদ্বোধন নিয়ে সময় টিভির প্রতিবেদন, আগস্ট ২০২৫।","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"快速路通车","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=r6BVgEcNXY4","poster":"","caption":"Somoy TV关于通车的报道，2025年8月。","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', 2, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Part of the expressway opens","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=2-JoK8RfAWc","poster":"","caption":"Ekhon TV report, August 2025.","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"এক্সপ্রেসওয়ের একাংশ চালু","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=2-JoK8RfAWc","poster":"","caption":"এখন টিভির প্রতিবেদন, আগস্ট ২০২৫।","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"快速路部分路段通车","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=2-JoK8RfAWc","poster":"","caption":"Ekhon TV报道，2025年8月。","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', 3, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"The Eid journey","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=TXBvzXKEWFs","poster":"","caption":"Somoy TV on the section''s use during Eid travel.","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"ঈদযাত্রা","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=TXBvzXKEWFs","poster":"","caption":"ঈদযাত্রায় অংশটির ব্যবহার নিয়ে সময় টিভি।","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"开斋节出行","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=TXBvzXKEWFs","poster":"","caption":"Somoy TV关于开斋节期间路段使用情况的报道。","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'video-embed', 4, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Driving the open section","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=4RyBKQB99ww","poster":"","caption":"A driver''s-eye view along the open section, recorded by a road user.","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"খোলা অংশে গাড়ি চালানো","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=4RyBKQB99ww","poster":"","caption":"খোলা অংশ বরাবর চালকের চোখে দৃশ্য, একজন সড়ক ব্যবহারকারীর ধারণকৃত।","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"驾驶已通车路段","intro":"","provider":"youtube","reference":"https://www.youtube.com/watch?v=4RyBKQB99ww","poster":"","caption":"道路使用者拍摄的已通车路段驾驶视角。","transcriptHref":""}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- project/virtual-tour
INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ('project/virtual-tour', 'default', 0, 'published', CURRENT_TIMESTAMP);
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'project/virtual-tour');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'en', '360° tour', 'Look around the Dhaka Bypass Expressway in panoramic views.', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'bn', '৩৬০° ভ্রমণ', 'প্যানোরামিক দৃশ্যে ঢাকা বাইপাস এক্সপ্রেসওয়ে ঘুরে দেখুন।', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'zh', '360°全景', '通过全景画面环视达卡绕城高速公路。', 'published');
SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 0, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"eyebrow":"The project","heading":"360° tour","lede":"Drag or swipe to look along the expressway."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"eyebrow":"প্রকল্প","heading":"৩৬০° ভ্রমণ","lede":"এক্সপ্রেসওয়ে বরাবর দেখতে টানুন বা সোয়াইপ করুন।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"eyebrow":"项目概况","heading":"360°全景","lede":"拖动或滑动沿快速路浏览。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'panorama', 1, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"The toll carriageway","intro":"","image":"/photo/21.webp","caption":"Sample view from a wide photograph; a full 360° capture will replace it.","autoRotate":"yes"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"টোল ক্যারেজওয়ে","intro":"","image":"/photo/21.webp","caption":"প্রশস্ত আলোকচিত্র থেকে নমুনা দৃশ্য; পূর্ণ ৩৬০° ধারণ দিয়ে এটি প্রতিস্থাপিত হবে।","autoRotate":"yes"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"收费车道","intro":"","image":"/photo/21.webp","caption":"由宽幅照片生成的示例画面，将由完整360°拍摄替换。","autoRotate":"yes"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'panorama', 2, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Along the corridor","intro":"","image":"/photo/24.webp","caption":"Sample view from a wide photograph; a full 360° capture will replace it.","autoRotate":"no"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"করিডোর বরাবর","intro":"","image":"/photo/24.webp","caption":"প্রশস্ত আলোকচিত্র থেকে নমুনা দৃশ্য; পূর্ণ ৩৬০° ধারণ দিয়ে এটি প্রতিস্থাপিত হবে।","autoRotate":"no"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"走廊沿线","intro":"","image":"/photo/24.webp","caption":"由宽幅照片生成的示例画面，将由完整360°拍摄替换。","autoRotate":"no"}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- about/recognition
INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ('about/recognition', 'default', 0, 'published', CURRENT_TIMESTAMP);
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'about/recognition');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'en', 'Recognition', 'Firsts and recognition for the Dhaka Bypass Expressway.', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'bn', 'স্বীকৃতি', 'ঢাকা বাইপাস এক্সপ্রেসওয়ের প্রথম অর্জন ও স্বীকৃতি।', 'published');
INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, 'zh', '荣誉与认可', '达卡绕城高速公路的首创成果与认可。', 'published');
SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'page-header', 0, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"eyebrow":"About DBEDC","heading":"Recognition","lede":"What the project has been recognised for, and the firsts it brought to Bangladesh."}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"eyebrow":"DBEDC পরিচিতি","heading":"স্বীকৃতি","lede":"প্রকল্পটি যেসব কারণে স্বীকৃতি পেয়েছে এবং বাংলাদেশে যেসব প্রথম এনেছে।"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"eyebrow":"关于DBEDC","heading":"荣誉与认可","lede":"项目获得的认可及其为孟加拉国带来的首创。"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'card-grid', 1, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Recognition and firsts","intro":"","items":[{"meta":"2018","title":"Bangladesh''s first road PPP","body":"The first road project in Bangladesh delivered as a public–private partnership, signed with the Roads and Highways Department in December 2018."},{"meta":"2023","title":"Belt and Road Forum","body":"Presented as a practical cooperation project at the Third Belt and Road Forum for International Cooperation."},{"meta":"Engineering","title":"First semi-rigid pavement","body":"The first use in Bangladesh of semi-rigid pavement and reinforced retaining walls on a highway."},{"meta":"Operations","title":"First fully access-controlled expressway section","body":"An access-controlled toll carriageway with separate service roads, opened to traffic in 2025."}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"স্বীকৃতি ও প্রথম অর্জন","intro":"","items":[{"meta":"২০১৮","title":"বাংলাদেশের প্রথম সড়ক পিপিপি","body":"বাংলাদেশে সরকারি-বেসরকারি অংশীদারিত্বে বাস্তবায়িত প্রথম সড়ক প্রকল্প, ডিসেম্বর ২০১৮-এ সড়ক ও জনপথ অধিদপ্তরের সঙ্গে স্বাক্ষরিত।"},{"meta":"২০২৩","title":"বেল্ট অ্যান্ড রোড ফোরাম","body":"তৃতীয় বেল্ট অ্যান্ড রোড আন্তর্জাতিক সহযোগিতা ফোরামে বাস্তব সহযোগিতা প্রকল্প হিসেবে উপস্থাপিত।"},{"meta":"প্রকৌশল","title":"প্রথম সেমি-রিজিড পেভমেন্ট","body":"বাংলাদেশে মহাসড়কে প্রথমবার সেমি-রিজিড পেভমেন্ট ও রিইনফোর্সড রিটেইনিং ওয়ালের ব্যবহার।"},{"meta":"পরিচালনা","title":"প্রথম পূর্ণ নিয়ন্ত্রিত-প্রবেশ এক্সপ্রেসওয়ে অংশ","body":"পৃথক সার্ভিস রোডসহ নিয়ন্ত্রিত-প্রবেশ টোল সড়ক, ২০২৫ সালে যান চলাচলের জন্য খোলা।"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"认可与首创","intro":"","items":[{"meta":"2018","title":"孟加拉国首个公路PPP项目","body":"孟加拉国首个以政府与社会资本合作模式实施的公路项目，于2018年12月与孟加拉国公路局签约。"},{"meta":"2023","title":"“一带一路”国际合作高峰论坛","body":"作为务实合作项目亮相第三届“一带一路”国际合作高峰论坛。"},{"meta":"工程","title":"首次采用半刚性路面","body":"在孟加拉国公路上首次采用半刚性路面和加筋挡土墙。"},{"meta":"运营","title":"首个全封闭式快速路段","body":"配备独立辅路的封闭式收费车道，于2025年通车。"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'rich-text', 2, 'published' FROM DUAL WHERE @fresh = 1;
SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Awards","body":"<p>Awards received by DBEDC and the project are listed here with the awarding body and date.</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"পুরস্কার","body":"<p>DBEDC ও প্রকল্পের প্রাপ্ত পুরস্কারগুলো প্রদানকারী প্রতিষ্ঠান ও তারিখসহ এখানে তালিকাভুক্ত করা হয়।</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"奖项","body":"<p>DBEDC及本项目获得的奖项将在此列出，并注明颁奖机构和日期。</p>"}', 'published' FROM DUAL WHERE @b IS NOT NULL;

-- ---------------------------------------------------------------- addition to contact
SET @p = (SELECT `id` FROM `pages` WHERE `slug` = 'contact');
SET @has = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en' WHERE b.`page_id` = @p AND CAST(t.`data` AS CHAR) LIKE '%Sample location%');
SET @ok = (@p IS NOT NULL AND @has = 0);
SET @last = (SELECT `id` FROM `blocks` WHERE `page_id` = @p ORDER BY `sort_order` DESC, `id` DESC LIMIT 1);
SET @lastsort = (SELECT `sort_order` FROM `blocks` WHERE `id` = @last);
SET @endcta = (SELECT `type` = 'cta-band' FROM `blocks` WHERE `id` = @last);
UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `id` = @last AND @ok AND @endcta = 1;
INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, 'map-pin-list', IF(@endcta = 1, @lastsort, COALESCE(@lastsort, 0) + 1), 'published' FROM DUAL WHERE @ok;
SET @b = IF(@ok, LAST_INSERT_ID(), NULL);
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'en', '{"heading":"Where to find us","intro":"","showFilter":"no","items":[{"name":"DBEDC operations office","type":"Office","address":"Vogra Toll Plaza, Dhaka Bypass Expressway, Gazipur","lat":23.9753672,"lng":90.38928,"hours":"Sunday–Thursday, 9:00–17:00","amenities":[],"notes":"Sample location — to be confirmed.","mapHref":"https://www.openstreetmap.org/?mlat=23.9753672&mlon=90.38928#map=16/23.9753672/90.38928"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'bn', '{"heading":"আমাদের কোথায় পাবেন","intro":"","showFilter":"no","items":[{"name":"DBEDC পরিচালনা কার্যালয়","type":"কার্যালয়","address":"ভোগড়া টোল প্লাজা, ঢাকা বাইপাস এক্সপ্রেসওয়ে, গাজীপুর","lat":23.9753672,"lng":90.38928,"hours":"রবিবার–বৃহস্পতিবার, ৯:০০–১৭:০০","amenities":[],"notes":"নমুনা অবস্থান — নিশ্চিত করা হবে।","mapHref":"https://www.openstreetmap.org/?mlat=23.9753672&mlon=90.38928#map=16/23.9753672/90.38928"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;
INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, 'zh', '{"heading":"我们的位置","intro":"","showFilter":"no","items":[{"name":"DBEDC运营办公室","type":"办公室","address":"达卡绕城高速公路Vogra收费站，加济普尔","lat":23.9753672,"lng":90.38928,"hours":"周日至周四 9:00–17:00","amenities":[],"notes":"示例位置——待确认。","mapHref":"https://www.openstreetmap.org/?mlat=23.9753672&mlon=90.38928#map=16/23.9753672/90.38928"}]}', 'published' FROM DUAL WHERE @b IS NOT NULL;

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('36-service-pages');
