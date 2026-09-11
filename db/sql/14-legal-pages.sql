-- 14-legal-pages.sql — /privacy, /terms and /accessibility.
--
-- WHY THIS FILE EXISTS
--
-- The site runs Google Analytics 4 and shows a cookie consent banner
-- (components/chrome/ConsentBanner.jsx) and has no privacy policy anywhere. A
-- grep for "privacy" across components/chrome and lib/institutional returns
-- nothing. The legacy footer carried Privacy Policy, Terms of Service and
-- Sitemap; all three were dropped at the rebuild. Asking somebody to consent
-- to analytics with no document describing what is collected is the compliance
-- gap this closes.
--
-- WHAT IS STATED AS FACT, AND ON WHAT AUTHORITY
--
-- Everything in the privacy page describing site behaviour was read out of the
-- code, not drafted from a template:
--
--   * Consent defaults to DENIED. `analytics_storage` is only ever set to
--     'granted' after the visitor presses Accept (ConsentBanner.jsx:44-46).
--   * The choice is stored in localStorage, NOT a cookie — so declining
--     cookies does not itself set one (ConsentBanner.jsx:25).
--   * The contact form stores name, email, subject and message. It does NOT
--     store an IP address: see the INSERT at
--     app/[locale]/contact/actions.js:96 and the table at
--     db/sql/01-schema.sql.
--   * The newsletter stores an email address and nothing else.
--   * The rate limiter reads x-forwarded-for in memory to count recent
--     submissions and never writes it anywhere (lib/rate-limit.js).
--
-- WHAT IS NOT STATED
--
-- The legally operative parts — the controller's registered identity, how long
-- records are kept, who to write to for a copy or an erasure, and which law
-- governs — are NOT drafted here. Those are DBEDC's and counsel's to settle,
-- and a plausible-looking retention period invented by a developer is worse
-- than a visible gap. Each is a db-pending callout naming what is owed.
--
-- STATUS: these pages are seeded as PUBLISHED because the factual half closes
-- a live gap and is better than silence, but the file deliberately makes no
-- compliance claim on DBEDC's behalf. Nothing here asserts that the site
-- complies with any particular statute.
--
-- The accessibility page is unusual in being able to state its own failures
-- concretely, because they were measured: see
-- docs/audit/2026-09-06/findings-interactivity.md and the UI-3/UI-5 rows of
-- the traceability checklist.
--
-- Idempotent: INSERT IGNORE throughout, ids above the seeded range.

/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT IGNORE INTO `pages` (`id`, `slug`, `parent_id`, `template`, `nav_order`, `status`, `published_at`, `created_at`, `updated_at`) VALUES
  (310,'privacy',NULL,'default',0,'published',NOW(),NOW(),NOW()),
  (311,'terms',NULL,'default',0,'published',NOW(),NOW(),NOW()),
  (312,'accessibility',NULL,'default',0,'published',NOW(),NOW(),NOW());
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;

/*!40000 ALTER TABLE `blocks` DISABLE KEYS */;
INSERT IGNORE INTO `blocks` (`id`, `page_id`, `type`, `sort_order`, `settings`, `status`) VALUES
  (310,310,'rich-text',0,NULL,'published'),
  (311,310,'rich-text',1,NULL,'published'),
  (312,310,'rich-text',2,NULL,'published'),
  (313,311,'rich-text',0,NULL,'published'),
  (314,312,'rich-text',0,NULL,'published'),
  (315,312,'rich-text',1,NULL,'published');
/*!40000 ALTER TABLE `blocks` ENABLE KEYS */;

/*!40000 ALTER TABLE `block_translations` DISABLE KEYS */;

-- 310 — what this site collects. Every claim read out of the code.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(310,'en','{"heading":"What this website collects","body":"<p>Three things, and nothing else.</p><p><strong>Messages you send us.</strong> The contact form records the name, email address, subject and message you type, so that DBEDC can reply. It does not record your IP address.</p><p><strong>Newsletter subscriptions.</strong> If you subscribe, we store your email address. Nothing else is stored with it.</p><p><strong>Analytics, only if you agree.</strong> This site can use Google Analytics to count visits. It is switched off until you press Accept on the banner — analytics storage starts in the denied state and is only ever granted by that button. Your answer is kept in your own browser&rsquo;s local storage rather than in a cookie, so declining does not itself place a cookie on your device.</p><p>The site briefly counts recent form submissions per network address to stop automated abuse. That address is held in memory only and is never written to the database.</p>"}','published'),
(310,'bn','{"heading":"এই ওয়েবসাইট কী তথ্য সংগ্রহ করে","body":"<p>তিনটি বিষয়, এর বাইরে কিছু নয়।</p><p><strong>আপনার পাঠানো বার্তা।</strong> যোগাযোগ ফরমে আপনি যে নাম, ইমেইল ঠিকানা, বিষয় ও বার্তা লেখেন তা সংরক্ষিত হয়, যাতে DBEDC উত্তর দিতে পারে। আপনার আইপি ঠিকানা সংরক্ষণ করা হয় না।</p><p><strong>নিউজলেটার সাবস্ক্রিপশন।</strong> সাবস্ক্রাইব করলে আমরা কেবল আপনার ইমেইল ঠিকানা সংরক্ষণ করি, আর কিছু নয়।</p><p><strong>অ্যানালিটিক্স, কেবল আপনার সম্মতিতে।</strong> এই সাইট ভিজিট গণনার জন্য Google Analytics ব্যবহার করতে পারে। ব্যানারে Accept না চাপা পর্যন্ত এটি বন্ধ থাকে — অ্যানালিটিক্স স্টোরেজ শুরুতেই নিষিদ্ধ অবস্থায় থাকে এবং কেবল ওই বোতামেই অনুমোদিত হয়। আপনার উত্তর কুকির বদলে আপনার ব্রাউজারের লোকাল স্টোরেজে রাখা হয়, তাই প্রত্যাখ্যান করলে কোনও কুকি বসে না।</p><p>স্বয়ংক্রিয় অপব্যবহার ঠেকাতে সাইটটি নেটওয়ার্ক ঠিকানা অনুযায়ী সাম্প্রতিক ফরম জমা গণনা করে। সেই ঠিকানা কেবল মেমোরিতে থাকে, ডেটাবেসে কখনও লেখা হয় না।</p>"}','published'),
(310,'zh','{"heading":"本网站收集哪些信息","body":"<p>仅以下三项，别无其他。</p><p><strong>您发送的留言。</strong>联系表单会记录您填写的姓名、电子邮箱、主题与留言内容，以便 DBEDC 回复。不会记录您的 IP 地址。</p><p><strong>订阅邮件。</strong>若您订阅，我们仅保存您的电子邮箱，不保存其他信息。</p><p><strong>分析统计，仅在您同意后。</strong>本站可使用 Google Analytics 统计访问量。在您点击横幅上的“接受”之前，该功能处于关闭状态——分析存储默认为拒绝，仅通过该按钮授予。您的选择保存在浏览器本地存储中而非 Cookie，因此拒绝本身不会写入 Cookie。</p><p>为防止自动化滥用，本站会按网络地址短暂统计近期表单提交次数。该地址仅存于内存，绝不写入数据库。</p>"}','published');

-- 311 — the legally operative half. Deliberately not drafted.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(311,'en','{"heading":"Your rights, and who to contact","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">Not yet published</span>The registered identity and address of the data controller, how long messages and subscriptions are kept, how to ask for a copy of what is held about you or to have it deleted, and the law under which these rights are exercised, have not yet been settled with DBEDC and its legal advisers. Until they are published here, write using the contact form and ask for the data protection contact.</p>"}','published'),
(311,'bn','{"heading":"আপনার অধিকার এবং যোগাযোগ","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">এখনও প্রকাশিত হয়নি</span>ডেটা নিয়ন্ত্রকের নিবন্ধিত পরিচয় ও ঠিকানা, বার্তা ও সাবস্ক্রিপশন কত দিন সংরক্ষিত থাকে, আপনার সম্পর্কে রক্ষিত তথ্যের অনুলিপি চাওয়া বা তা মুছে ফেলার অনুরোধের পদ্ধতি, এবং কোন আইনের অধীনে এসব অধিকার প্রযোজ্য — এগুলি DBEDC ও তার আইন উপদেষ্টাদের সঙ্গে এখনও চূড়ান্ত হয়নি। এখানে প্রকাশিত না হওয়া পর্যন্ত যোগাযোগ ফরম ব্যবহার করে ডেটা সুরক্ষা সংক্রান্ত যোগাযোগের ঠিকানা জানতে চান।</p>"}','published'),
(311,'zh','{"heading":"您的权利与联系方式","body":"<p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">尚未公布</span>数据控制者的登记名称与地址、留言与订阅信息的保存期限、如何索取或删除我们持有的您的信息，以及这些权利所依据的法律，尚未与 DBEDC 及其法律顾问确定。在此处公布之前，请通过联系表单索取数据保护联系人。</p>"}','published');

-- 312 — third parties.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(312,'en','{"heading":"Who else sees this data","body":"<p>If you accept analytics, Google receives the usage data that Google Analytics collects, under Google&rsquo;s own terms.</p><p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">Not yet published</span>The hosting arrangements for this site, and any other organisation that processes data on DBEDC&rsquo;s behalf, have not yet been listed here.</p>"}','published'),
(312,'bn','{"heading":"এই তথ্য আর কারা দেখে","body":"<p>আপনি অ্যানালিটিক্সে সম্মতি দিলে Google Analytics-এর সংগৃহীত ব্যবহারের তথ্য Google তাদের নিজস্ব শর্তাবলি অনুযায়ী পায়।</p><p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">এখনও প্রকাশিত হয়নি</span>এই সাইটের হোস্টিং ব্যবস্থা এবং DBEDC-এর পক্ষে তথ্য প্রক্রিয়াকারী অন্য কোনও প্রতিষ্ঠানের তালিকা এখনও এখানে দেওয়া হয়নি।</p>"}','published'),
(312,'zh','{"heading":"还有谁能看到这些数据","body":"<p>若您接受分析统计，Google 将按其自身条款获取 Google Analytics 所收集的使用数据。</p><p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">尚未公布</span>本站的托管安排，以及代表 DBEDC 处理数据的其他机构，尚未在此列出。</p>"}','published');

-- 313 — terms. Almost entirely counsel's to write.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(313,'en','{"heading":"Terms of use","body":"<p>This website is published by Dhaka Bypass Expressway Development Company. Information about tolls, open sections and traffic conditions is published in good faith and may change; the signs and instructions on the road itself always take precedence over anything shown here.</p><p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">Not yet published</span>The formal terms of use — the limits of liability, the rules for reusing text and photographs from this site, and how disputes are handled — have not yet been settled with DBEDC and its legal advisers.</p>"}','published'),
(313,'bn','{"heading":"ব্যবহারের শর্তাবলি","body":"<p>এই ওয়েবসাইটটি প্রকাশ করে ঢাকা বাইপাস এক্সপ্রেসওয়ে ডেভেলপমেন্ট কোম্পানি। টোল, চালু অংশ ও যান চলাচলের অবস্থা সম্পর্কিত তথ্য সরল বিশ্বাসে প্রকাশ করা হয় এবং তা পরিবর্তিত হতে পারে; সড়কে প্রদর্শিত সাইনবোর্ড ও নির্দেশনা সর্বদা এখানে দেখানো যেকোনও তথ্যের চেয়ে অগ্রাধিকার পাবে।</p><p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">এখনও প্রকাশিত হয়নি</span>আনুষ্ঠানিক ব্যবহারের শর্তাবলি — দায়ের সীমা, এই সাইটের লেখা ও ছবি পুনর্ব্যবহারের নিয়ম, এবং বিরোধ নিষ্পত্তির পদ্ধতি — DBEDC ও তার আইন উপদেষ্টাদের সঙ্গে এখনও চূড়ান্ত হয়নি।</p>"}','published'),
(313,'zh','{"heading":"使用条款","body":"<p>本网站由达卡绕城高速公路发展公司发布。有关通行费、通车路段与路况的信息均本着诚信发布，且可能变动；道路现场的标志与指示始终优先于本站所示内容。</p><p class=\\"db-pending\\"><span class=\\"db-pending-tag\\">尚未公布</span>正式使用条款——责任范围、转载本站文字与图片的规则，以及争议处理方式——尚未与 DBEDC 及其法律顾问确定。</p>"}','published');

-- 314 / 315 — accessibility. This page can be specific because the gaps were
-- measured, not guessed. The honest pattern is VINCI Autoroutes', which states
-- "partially compliant" rather than claiming conformance.
INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(314,'en','{"heading":"Accessibility of this website","body":"<p>This site aims to meet WCAG 2.1 level AA, which is the standard the ICT Division&rsquo;s Digital Service and Web Designing Guideline for Inclusive Accessibility 2022 is built on. It is <strong>partially compliant</strong>: parts of it meet that standard and parts of it are known not to.</p><p>What works today: every page can be operated by keyboard alone with a visible focus outline; text contrast is measured rather than estimated, and the colour values are chosen to clear 4.5:1; the corridor map has a text alternative that works without JavaScript; the toll calculator returns an answer without JavaScript; and colour is never the only way information is conveyed.</p>"}','published'),
(314,'bn','{"heading":"এই ওয়েবসাইটের প্রবেশগম্যতা","body":"<p>এই সাইট WCAG 2.1 লেভেল AA মান অর্জনের লক্ষ্য রাখে, যা তথ্য ও যোগাযোগ প্রযুক্তি বিভাগের ২০২২ সালের অন্তর্ভুক্তিমূলক প্রবেশগম্যতা নির্দেশিকার ভিত্তি। সাইটটি <strong>আংশিকভাবে সঙ্গতিপূর্ণ</strong>: কিছু অংশ এই মান পূরণ করে, কিছু অংশ করে না তা জানা আছে।</p><p>বর্তমানে যা কাজ করে: প্রতিটি পৃষ্ঠা কেবল কীবোর্ড দিয়ে ব্যবহার করা যায় এবং ফোকাস দৃশ্যমান; লেখার কনট্রাস্ট অনুমান নয়, পরিমাপ করা এবং ৪.৫:১ অতিক্রম করার জন্য রং নির্বাচিত; করিডোর মানচিত্রের জাভাস্ক্রিপ্ট ছাড়াই কার্যকর টেক্সট বিকল্প রয়েছে; টোল ক্যালকুলেটর জাভাস্ক্রিপ্ট ছাড়াই উত্তর দেয়; এবং কোনও তথ্য কেবল রঙের মাধ্যমে প্রকাশ করা হয় না।</p>"}','published'),
(314,'zh','{"heading":"本网站的无障碍性","body":"<p>本站以达到 WCAG 2.1 AA 级为目标，该标准也是信息通信技术部《2022 年包容性无障碍数字服务与网页设计指南》的基础。本站<strong>部分符合</strong>：部分内容达标，部分已知未达标。</p><p>目前可用的部分：每个页面均可仅用键盘操作并带有可见焦点轮廓；文字对比度经过实测而非估算，取值以超过 4.5:1 为准；走廊地图提供无需 JavaScript 的文字替代；通行费计算器在无 JavaScript 时仍可返回结果；且信息从不仅以颜色传达。</p>"}','published');

INSERT IGNORE INTO `block_translations` (`block_id`, `locale`, `data`, `status`) VALUES
(315,'en','{"heading":"Known problems","body":"<p>Stating these is the point of the page. They are being worked on.</p><p><strong>Chinese pages have no supplied font.</strong> The site ships Latin and Bengali web fonts but no Chinese one, so a reader on a device without a Chinese font installed may see empty boxes instead of characters.</p><p><strong>Some headings are forced to capitals</strong> by the page design. Capitalisation is meaningless in Bengali and Chinese, which have no letter case.</p><p><strong>Images uploaded before this year have no description.</strong> Alt text could not be written from the admin panel until recently; older pictures are still being described.</p><p>If something on this site prevents you from getting information you need, please tell us through the contact form and say which page and what happened.</p>"}','published'),
(315,'bn','{"heading":"জানা সমস্যাসমূহ","body":"<p>এগুলি জানানোই এই পৃষ্ঠার উদ্দেশ্য। সমাধানের কাজ চলছে।</p><p><strong>চীনা পৃষ্ঠার জন্য কোনও ফন্ট সরবরাহ করা হয় না।</strong> সাইটটি ল্যাটিন ও বাংলা ওয়েব ফন্ট সরবরাহ করে, চীনা নয় — তাই যে ডিভাইসে চীনা ফন্ট ইনস্টল করা নেই সেখানে অক্ষরের বদলে খালি বাক্স দেখা যেতে পারে।</p><p><strong>কিছু শিরোনাম বড় হাতের অক্ষরে দেখানো হয়</strong> পৃষ্ঠার নকশার কারণে। বাংলা ও চীনা ভাষায় অক্ষরের বড়-ছোট রূপ নেই, তাই এর কোনও অর্থ হয় না।</p><p><strong>এ বছরের আগে আপলোড করা ছবির বিবরণ নেই।</strong> সম্প্রতি পর্যন্ত অ্যাডমিন প্যানেল থেকে ছবির বিবরণ লেখা যেত না; পুরোনো ছবিগুলির বিবরণ যোগ করার কাজ চলছে।</p><p>এই সাইটের কোনও কিছু আপনার প্রয়োজনীয় তথ্য পেতে বাধা দিলে যোগাযোগ ফরমে জানান — কোন পৃষ্ঠা এবং কী ঘটেছে তা উল্লেখ করুন।</p>"}','published'),
(315,'zh','{"heading":"已知问题","body":"<p>如实说明这些问题正是本页的意义所在。相关改进正在进行。</p><p><strong>中文页面未附带字体。</strong>本站提供拉丁文与孟加拉文网页字体，但未提供中文字体，因此未安装中文字体的设备可能显示空白方框而非文字。</p><p><strong>部分标题被强制大写</strong>，这是页面设计所致。孟加拉文与中文没有大小写之分，此处并无意义。</p><p><strong>今年以前上传的图片没有文字说明。</strong>此前无法在后台撰写图片说明；旧图片的说明正在补充。</p><p>若本站的任何部分妨碍您获取所需信息，请通过联系表单告知我们，并说明是哪个页面以及发生了什么。</p>"}','published');

/*!40000 ALTER TABLE `block_translations` ENABLE KEYS */;
