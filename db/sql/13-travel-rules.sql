-- 13-travel-rules.sql — the /travel/rules page.
--
-- WHY THIS FILE EXISTS
--
-- `app/[locale]/travel/rules/page.jsx` looks for a `pages` row with the slug
-- `travel/rules`. `02-seed.sql` seeds eleven pages and none of them is that
-- one, so the page has been shipping its empty state — while being linked from
-- `components/chrome/TravelSubnav.jsx`, the homepage CTA and the safety hero.
-- Three links to a blank page.
--
-- WHAT IS PUBLISHED HERE, AND WHAT DELIBERATELY IS NOT
--
-- Only two things about how to use this expressway are actually sourced:
--
--   * Which vehicles may not use it. Already published and live — the
--     `prohibited_vehicles` setting and `/travel/toll` both state that
--     motorcycles and three-wheelers, CNG auto-rickshaws included, are
--     prohibited, and that the parallel road network is the correct route for
--     them. This page repeats that position rather than inventing a new one.
--
--   * That entry and exit are only at signed interchanges. The corridor is
--     access-controlled and the map already says so.
--
-- Everything else a rules page would normally carry — posted speed limits,
-- what to do on a breakdown, lane discipline, overtaking — is NOT invented.
-- Each is a visible `db-pending` callout naming exactly what DBEDC has to
-- supply, which is the convention `lib/institutional/pages.js` uses in 129
-- other places. A gap that announces itself is safe; a plausible-looking speed
-- limit on a public expressway site is not.
--
-- ON "80 km/h". The legacy site printed "design speed 80 km/h" and it is
-- tempting to publish that as the limit. It is not one. A design speed is the
-- engineering basis for the geometry — the speed the curves and sight lines
-- were built to accommodate — and it is routinely higher than the speed a
-- driver is permitted to travel. Publishing it as a limit would tell drivers
-- they may lawfully do 80 where the gazette may say 60. The callout says so
-- explicitly so nobody "fixes" the gap by copying the number across.
--
-- Idempotent: INSERT IGNORE throughout, explicit ids above the seeded range
-- (max page 13, max block 171 at the time of writing), safe to re-import.

/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT IGNORE INTO `pages` (`id`, `slug`, `parent_id`, `template`, `nav_order`, `status`, `published_at`, `created_at`, `updated_at`)
VALUES (300,'travel/rules',NULL,'default',0,'published',NOW(),NOW(),NOW());
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;

/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`) VALUES
  (300,300,'rich-text',0,NULL,'published'),
  (301,300,'rich-text',1,NULL,'published'),
  (302,300,'rich-text',2,NULL,'published'),
  (303,300,'rich-text',3,NULL,'published'),
  (304,300,'rich-text',4,NULL,'published'),
  (305,300,'cta-band',5,NULL,'published');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;

/*!40000 ALTER TABLE `block_translations` DISABLE KEYS */;

-- 300 — how the corridor works. Sourced: access-controlled, signed entries.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(300,'en','{"heading":"Using the expressway","body":"<p>The Dhaka Bypass is an access-controlled expressway. You may join it and leave it only at a signed interchange — there is no access from the land alongside it, and no turning back once you are on a carriageway.</p><p>Service roads run beside the tolled carriageways for local traffic and for the vehicles that may not use the expressway itself.</p>"}','published'),
(300,'bn','{"heading":"এক্সপ্রেসওয়ে ব্যবহারের নিয়ম","body":"<p>ঢাকা বাইপাস একটি নিয়ন্ত্রিত-প্রবেশ এক্সপ্রেসওয়ে। কেবল চিহ্নিত ইন্টারচেঞ্জ দিয়েই এতে ওঠা ও নামা যায় — পাশের জমি থেকে কোনও প্রবেশপথ নেই, এবং ক্যারেজওয়েতে উঠে পড়লে ফিরে আসার সুযোগ নেই।</p><p>টোল ক্যারেজওয়ের পাশে স্থানীয় যানবাহনের জন্য এবং যেসব যান এক্সপ্রেসওয়ে ব্যবহার করতে পারবে না তাদের জন্য সার্ভিস রোড রয়েছে।</p>"}','published'),
(300,'zh','{"heading":"高速公路使用规则","body":"<p>达卡绕城高速是一条全封闭高速公路。只能通过设有标识的互通立交进出——沿线土地不设出入口，一旦驶入行车道便无法折返。</p><p>收费行车道两侧设有辅路，供本地交通以及不得使用本高速公路的车辆通行。</p>"}','published');

-- 301 — where prohibited vehicles should go.
--
-- This block deliberately does NOT list the prohibited vehicles. The page
-- already renders that list from `prohibited_vehicles` via
-- `getProhibitedVehicles()`, and `/travel/toll` renders the same record. A
-- second, hand-written list here would be a fourth copy of a fact that lives
-- in one place — and the copy that drifts is always the one somebody wrote out
-- longhand. This block adds only what the record does not carry: where those
-- vehicles are supposed to go instead.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(301,'en','{"heading":"If your vehicle may not use the expressway","body":"<p>The service roads running beside the tolled carriageways carry this traffic and connect to the same places. They are the correct route, not a diversion — the corridor was built with them for exactly this purpose.</p><p>The prohibited vehicles are listed below, and the same list appears with the toll rates.</p>"}','published'),
(301,'bn','{"heading":"আপনার যান যদি এক্সপ্রেসওয়ে ব্যবহার করতে না পারে","body":"<p>টোল ক্যারেজওয়ের পাশ দিয়ে চলা সার্ভিস রোডগুলি এই যান চলাচল বহন করে এবং একই গন্তব্যে পৌঁছায়। এগুলি বিকল্প বা ঘুরপথ নয়, এগুলিই সঠিক পথ — করিডোরটি ঠিক এই উদ্দেশ্যেই সার্ভিস রোডসহ নির্মিত।</p><p>নিষিদ্ধ যানবাহনের তালিকা নিচে দেওয়া হল; একই তালিকা টোল হারের সঙ্গেও রয়েছে।</p>"}','published'),
(301,'zh','{"heading":"若您的车辆不得使用本高速公路","body":"<p>收费行车道两侧的辅路承载此类交通，并通往相同目的地。它们不是绕行路线，而是正确路线——本走廊正是为此而配建辅路。</p><p>禁止通行车辆清单见下方，通行费页面也列有同一清单。</p>"}','published');

-- 302 — speed limits. NOT published; see the header note on design speed.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(302,'en','{"heading":"Speed limits","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">Not yet published</span>The posted speed limits for the toll carriageways and for the service roads have not been supplied by DBEDC for publication. The corridor was designed to an 80 km/h standard, but a design speed is the engineering basis for the geometry and is not a limit a driver may rely on — the posted limit governs and may be lower. Follow the signs on the road.</p>"}','published'),
(302,'bn','{"heading":"গতিসীমা","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">এখনও প্রকাশিত হয়নি</span>টোল ক্যারেজওয়ে ও সার্ভিস রোডের নির্ধারিত গতিসীমা DBEDC এখনও প্রকাশের জন্য সরবরাহ করেনি। করিডোরটি ৮০ কিমি/ঘণ্টা মানে নকশা করা হয়েছে, তবে ডিজাইন স্পিড হল জ্যামিতির প্রকৌশলগত ভিত্তি — এটি চালকের জন্য নির্ভরযোগ্য গতিসীমা নয়; সড়কে প্রদর্শিত সীমাই প্রযোজ্য এবং তা কম হতে পারে। সড়কের সাইনবোর্ড অনুসরণ করুন।</p>"}','published'),
(302,'zh','{"heading":"限速","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">尚未公布</span>收费行车道与辅路的公布限速尚未由 DBEDC 提供发布。该走廊按 80 公里/小时标准设计，但设计速度是道路几何的工程依据，并非驾驶人可依据的限速——以路侧标志公布的限速为准，且可能更低。请遵守道路标志。</p>"}','published');

-- 303 — stopping, breakdowns, emergencies. Blocked on the numbers in task 0.13.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(303,'en','{"heading":"Stopping, breakdowns and emergencies","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">Not yet published</span>DBEDC has not yet supplied the rules for stopping on the expressway, the arrangements for breakdown recovery and patrolling, or the numbers to call from the roadside. Until they are published here, use the national emergency number 999.</p>"}','published'),
(303,'bn','{"heading":"থামা, যান্ত্রিক ত্রুটি ও জরুরি অবস্থা","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">এখনও প্রকাশিত হয়নি</span>এক্সপ্রেসওয়েতে থামার নিয়ম, বিকল যান উদ্ধার ও টহলের ব্যবস্থা, কিংবা সড়ক থেকে কোন নম্বরে ফোন করতে হবে — DBEDC এখনও তা সরবরাহ করেনি। এখানে প্রকাশিত না হওয়া পর্যন্ত জাতীয় জরুরি নম্বর ৯৯৯ ব্যবহার করুন।</p>"}','published'),
(303,'zh','{"heading":"停车、故障与紧急情况","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">尚未公布</span>DBEDC 尚未提供高速公路上的停车规定、故障救援与巡逻安排，也未提供路侧求助电话。在此处公布之前，请拨打国家紧急电话 999。</p>"}','published');

-- 304 — lane discipline and overtaking.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(304,'en','{"heading":"Lane discipline and overtaking","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">Not yet published</span>The lane rules for this corridor — which lane heavy vehicles must keep to, where overtaking is restricted, and how the toll plaza lanes are allocated — have not yet been supplied for publication.</p>"}','published'),
(304,'bn','{"heading":"লেন ব্যবহার ও ওভারটেকিং","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">এখনও প্রকাশিত হয়নি</span>এই করিডোরের লেন সংক্রান্ত নিয়ম — ভারী যানবাহনকে কোন লেনে চলতে হবে, কোথায় ওভারটেকিং সীমাবদ্ধ, এবং টোল প্লাজার লেন কীভাবে বরাদ্দ হয় — এখনও প্রকাশের জন্য সরবরাহ করা হয়নি।</p>"}','published'),
(304,'zh','{"heading":"车道使用与超车","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">尚未公布</span>本走廊的车道规定——重型车辆应行驶的车道、限制超车的路段，以及收费广场车道的分配方式——尚未提供发布。</p>"}','published');

-- 305 — onward links. Both targets are live pages.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(305,'en','{"heading":"Before you travel","body":"Check what the journey costs and which sections are open.","primaryLabel":"Toll rates","primaryHref":"travel/toll","secondaryLabel":"What is open","secondaryHref":"travel/status"}','published'),
(305,'bn','{"heading":"যাত্রার আগে","body":"যাত্রার খরচ এবং কোন অংশগুলি খোলা রয়েছে তা দেখে নিন।","primaryLabel":"টোল হার","primaryHref":"travel/toll","secondaryLabel":"কোন অংশ খোলা","secondaryHref":"travel/status"}','published'),
(305,'zh','{"heading":"出行前","body":"请查看行程费用以及哪些路段已通车。","primaryLabel":"通行费","primaryHref":"travel/toll","secondaryLabel":"通车路段","secondaryHref":"travel/status"}','published');

/*!40000 ALTER TABLE `block_translations` ENABLE KEYS */;
