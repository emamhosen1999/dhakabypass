/**
 * The home page content.
 *
 * Every line here is newly written for a road that is OPEN and tolling. The
 * old site's prose described a project awaiting completion in July 2025; none
 * of it survives. Where a number came from the old site it is unverified, and
 * the block copy says so in the reader's own words rather than hiding it in a
 * footnote.
 *
 * Re-running replaces the home page's blocks wholesale. It does not touch any
 * other page.
 */
import { loadEnv } from './load-env.mjs';

loadEnv();
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

const BLOCKS = [
  {
    type: 'hero',
    data: {
      image: '/bg-hero.webp',
      eyebrow: 'Dhaka Bypass Expressway',
      headline: 'Eighteen kilometres open, and tolling',
      standfirst:
        'The first section of the bypass carries traffic between Vogra and Mirer Bazar today. '
        + 'The rest of the 48-kilometre corridor is still under construction.',
      primaryLabel: 'Toll rates',
      primaryHref: 'travel/toll',
      secondaryLabel: 'What is open',
      secondaryHref: 'travel/status',
    },
  },
  {
    type: 'toll-preview',
    data: {
      heading: 'What it costs',
      intro: 'Rates in force on the open section. Motorcycles and three-wheelers may not use the expressway.',
      classes: ['car', 'microbus', 'large_bus', 'heavy_truck'],
      linkLabel: 'All nine vehicle classes',
      linkHref: 'travel/toll',
    },
  },
  {
    type: 'media-prose',
    data: {
      image: '/bypass-ex.webp',
      side: 'right',
      heading: 'A road around the city, not through it',
      body:
        '<p>The Dhaka Bypass runs 48 kilometres down the eastern edge of the capital, from Gazipur in '
        + 'the north to Narayanganj in the south. It exists so that freight moving between the northern '
        + 'industrial belt and the southern ports does not have to cross Dhaka to get there.</p>'
        + '<p>It is access-controlled: traffic joins and leaves only at built interchanges, and every '
        + 'crossing is grade-separated. That is what separates it from the national highways it connects '
        + 'to, and it is why a journey that takes two hours through the city is meant to take a fraction '
        + 'of that once the full corridor opens.</p>',
      caption: 'The completed carriageway on the open section.',
      linkLabel: 'Where to join and leave',
      linkHref: 'travel/route',
    },
  },
  {
    type: 'card-grid',
    data: {
      heading: 'What it connects',
      intro: 'Four national highways meet the corridor along its length.',
      // Ordered along the corridor, north to south, because the meta label
      // states WHERE on the corridor each highway is met. The first draft of
      // this block had N1 at the north end and N4 at the south -- exactly
      // inverted. N1 is the Dhaka-Chattogram highway and meets this corridor
      // at Madanpur, the SOUTHERN terminus; N3 is Dhaka-Mymensingh and meets
      // it at Joydebpur, the NORTHERN one. interchanges.connects_to is empty
      // for every row, so nothing in the database settles this -- if DBEDC
      // corrects any junction, fix it here and fill connects_to at the same
      // time so the data can settle it next time.
      items: [
        { meta: 'North end', title: 'N3', body: 'The Dhaka–Mymensingh highway at Joydebpur, toward the north.' },
        { meta: 'North', title: 'N4', body: 'The Tangail and Jamuna bridge corridor, toward the north-west.' },
        { meta: 'Mid-corridor', title: 'N2', body: 'The Dhaka–Sylhet highway, toward the north-east.' },
        { meta: 'South end', title: 'N1', body: 'The Dhaka–Chattogram highway at Madanpur, toward the southern ports.' },
      ],
    },
  },
  {
    // Only figures we can derive or have confirmed. The concession term, the
    // investment total and the structure counts all came from the old site and
    // are unverified — they do NOT belong in a stat row, which reads as a row
    // of established facts. They stay in prose, marked, until DBEDC confirms.
    type: 'stat-row',
    data: {
      stats: [
        { label: 'Corridor length', value: '48', unit: 'km' },
        { label: 'Open to traffic', value: '18', unit: 'km' },
        { label: 'Vehicle classes tolled', value: '9', unit: '' },
        { label: 'National highways joined', value: '4', unit: '' },
      ],
    },
  },
  {
    type: 'media-prose',
    data: {
      // eco-eff.webp was the obvious pick and is disqualified: it is a Google Maps
      // screenshot with a visible 2015 copyright line. A finished-road frame is
      // the right subject here anyway: this section is about the road in use.
      image: '/photo/16.webp',
      side: 'left',
      heading: 'What the open section changes now',
      body:
        '<p>Traffic that used to queue through Gazipur can now run the tolled section instead. For a '
        + 'freight operator that is measured in fuel burned while stationary and in drivers’ hours, '
        + 'not in kilometres saved.</p>'
        + '<p>The corridor is built and operated under a public–private partnership covering design, '
        + 'construction, finance, operation and maintenance. Tolls are what pays for it.</p>'
        + '<p class="db-provisional-inline">Figures published for this project during construction — '
        + 'total investment, jobs created, bridges and underpasses built, the length of the concession — '
        + 'have not been reconfirmed since the road opened. They are not republished here until DBEDC '
        + 'has verified them.</p>',
      caption: 'The finished wearing course on the open section.',
      linkLabel: 'The corridor today',
      linkHref: 'travel/status',
    },
  },
  {
    // The four aerials are the strongest images DBEDC holds and none of them
    // appear anywhere else on the page. Road subjects only: the CSR library is
    // cleared for use but belongs on an About page, not on a road operator's
    // front door.
    //
    // No link. There is no localised gallery route yet, and pointing a Bangla
    // reader at the legacy English /gallery is worse than offering nothing.
    type: 'figure-grid',
    data: {
      heading: 'The corridor',
      intro: 'The alignment during construction and since opening.',
      items: [
        { image: '/photo/22.webp', caption: 'The viaduct crossing the river.' },
        { image: '/photo/20.webp', caption: 'Traffic on the open section.' },
        { image: '/photo/21.webp', caption: 'Bridge construction over open water.' },
        { image: '/photo/18.webp', caption: 'Surfacing at dusk.' },
        { image: '/photo/17.webp', caption: 'Compacting the wearing course.' },
        { image: '/photo/23.webp', caption: 'Looking south along the deck.' },
      ],
      linkLabel: '',
      linkHref: '',
    },
  },
  {
    type: 'partner-row',
    data: {
      heading: 'Who builds and runs it',
      intro: 'The Dhaka Bypass Expressway Development Company holds the concession.',
      items: [
        { name: 'SRBG', role: 'Sichuan Road & Bridge Group, lead partner', share: '60%' },
        { name: 'SEL', role: 'Shamim Enterprise Ltd', share: '' },
        { name: 'UDC', role: 'UDC Construction Ltd', share: '' },
      ],
    },
  },
  {
    type: 'cta-band',
    data: {
      // NOT a "report a problem" call to action, which is what a road operator's
      // front page should close on. There is no localised contact route yet and
      // DBEDC has not supplied an emergency hotline, so that CTA would either
      // send a Bangla reader to the legacy English page or publish a number we
      // do not have. Closing on what the site can actually deliver today is the
      // honest version; the operator swaps this block in the admin the moment
      // the hotline and a localised contact page exist.
      heading: 'Before you drive it',
      body:
        'Motorcycles and three-wheelers are prohibited. Know the limits and the '
        + 'closures before you set off.',
      primaryLabel: 'Rules of the road',
      primaryHref: 'travel/rules',
      secondaryLabel: 'What is open today',
      secondaryHref: 'travel/status',
    },
  },
];

/**
 * Bangla and Chinese, keyed by the index of the block in BLOCKS above.
 *
 * These are translations of the MEANING, not of the words. The register is the
 * same as lib/i18n/ui.js: plain, factual, what a driver or a freight operator
 * needs. Nothing here is promotional.
 *
 * What deliberately does NOT translate:
 *   - `image`, `side`, `classes` — not language, structure.
 *   - `linkHref`, `primaryHref`, `secondaryHref` — authored without a locale
 *     prefix, so localeHref() turns 'travel/toll' into '/bn/travel/toll' at
 *     render time. Copying them through unchanged is the correct thing to do.
 *   - Corridor facility names: Vogra, Mirer Bazar, Purbachal, Naojor,
 *     Madanpur, Joydebpur. See the script rule below.
 *   - The road's published name and the concession company's legal name:
 *     components/chrome/SiteHeaderV2.jsx and SiteFooterV2.jsx already render
 *     both in Latin on every locale, and the page must not disagree with its
 *     own masthead.
 *   - Highway numbers N1–N4, and the toll amounts, which come from toll_rates
 *     and are already localised there (class_labels carries bn and zh).
 *
 * ---------------------------------------------------------------------------
 * SCRIPT RULE FOR PLACE NAMES — read this before "fixing" anything below.
 * Settled with the client on 2026-09-03. It cuts BOTH ways, so please do not
 * make it uniform in either direction.
 *
 *   NATIVE SCRIPT in bn and zh. Well-known cities and districts that already
 *   have a standard, widely-used native spelling. A Bangla or Chinese reader
 *   expects to see these in their own script, and there is a single accepted
 *   form to use:
 *     Dhaka       ঢাকা        达卡
 *     Chattogram  চট্টগ্রাম     吉大港
 *     Sylhet      সিলেট       锡尔赫特
 *     Mymensingh  ময়মনসিংহ    迈门辛
 *     Tangail     টাঙ্গাইল      丹盖尔
 *     Jamuna      যমুনা        贾木纳
 *     Gazipur     গাজীপুর      加济普尔
 *     Narayanganj নারায়ণগঞ্জ   纳拉扬甘杰
 *
 *   LATIN in every locale. Corridor facility names — Vogra, Mirer Bazar,
 *   Purbachal, Naojor, Madanpur, Joydebpur. DBEDC has NOT supplied official
 *   Bangla or Chinese spellings for its own interchanges and toll plazas, so
 *   anything we wrote would be our invention presented as signage. A driver
 *   looking for the gantry needs the string that is on the gantry. Where a
 *   Bangla record already carried a native form for one of these before this
 *   rule was written, it was left exactly as it stood rather than churned;
 *   the whole set gets settled at once when DBEDC supplies the official list.
 *
 *   LATIN in every locale. Highway designations N1, N2, N3, N4 — these are
 *   signage, not words. Chainage (K3+218) likewise.
 * ---------------------------------------------------------------------------
 *
 * Bengali digits are used in the Bangla records, matching the hand-written
 * Bangla already in lib/i18n/ui.js. Chinese uses Arabic numerals, as Chinese
 * technical writing does.
 */
const TRANSLATIONS = {
  bn: [
    {
      image: '/bg-hero.webp',
      eyebrow: 'Dhaka Bypass Expressway',
      headline: 'আঠারো কিলোমিটার খোলা, টোল আদায় চালু',
      standfirst:
        'বাইপাসের প্রথম অংশ আজ ভোগড়া ও মীরের বাজার-এর মধ্যে যান চলাচল বহন করছে। '
        + '৪৮ কিলোমিটার করিডোরের বাকি অংশ এখনও নির্মাণাধীন।',
      primaryLabel: 'টোল হার',
      primaryHref: 'travel/toll',
      secondaryLabel: 'কী খোলা আছে',
      secondaryHref: 'travel/status',
    },
    {
      heading: 'খরচ কত',
      intro: 'খোলা অংশে বর্তমানে কার্যকর টোল হার। মোটরসাইকেল ও তিন চাকার যানবাহন এক্সপ্রেসওয়ে ব্যবহার করতে পারবে না।',
      classes: ['car', 'microbus', 'large_bus', 'heavy_truck'],
      linkLabel: 'নয়টি শ্রেণির সবগুলি',
      linkHref: 'travel/toll',
    },
    {
      image: '/bypass-ex.webp',
      side: 'right',
      heading: 'শহরের ভেতর দিয়ে নয়, শহরকে ঘিরে',
      body:
        '<p>Dhaka Bypass রাজধানীর পূর্ব প্রান্ত ধরে উত্তরে গাজীপুর থেকে দক্ষিণে নারায়ণগঞ্জ পর্যন্ত '
        + '৪৮ কিলোমিটার বিস্তৃত। উত্তরের শিল্পাঞ্চল ও দক্ষিণের বন্দরগুলির মধ্যে চলাচলকারী পণ্যবাহী '
        + 'যানবাহনকে যাতে ঢাকা পার হয়ে যেতে না হয়, সে জন্যই এই সড়ক।</p>'
        + '<p>এটি নিয়ন্ত্রিত-প্রবেশ সড়ক: যানবাহন কেবল নির্মিত ইন্টারচেঞ্জ দিয়েই ওঠে ও নামে, আর প্রতিটি '
        + 'ক্রসিং আলাদা স্তরে করা। এখানেই এটি সংযুক্ত জাতীয় মহাসড়কগুলির থেকে আলাদা, এবং এ কারণেই '
        + 'শহরের ভেতর দিয়ে যে যাত্রায় দুই ঘণ্টা লাগে, সম্পূর্ণ করিডোর খুলে গেলে তা তার সামান্য সময়েই '
        + 'শেষ হওয়ার কথা।</p>',
      caption: 'খোলা অংশের নির্মিত ক্যারেজওয়ে।',
      linkLabel: 'কোথায় উঠবেন ও নামবেন',
      linkHref: 'travel/route',
    },
    {
      heading: 'কীসের সঙ্গে সংযোগ',
      intro: 'করিডোর বরাবর চারটি জাতীয় মহাসড়ক এসে মিলেছে।',
      items: [
        { meta: 'উত্তর প্রান্ত', title: 'N3', body: 'Joydebpur-এ ঢাকা–ময়মনসিংহ মহাসড়ক, উত্তর দিকে।' },
        { meta: 'উত্তর', title: 'N4', body: 'টাঙ্গাইল ও যমুনা সেতু করিডোর, উত্তর-পশ্চিম দিকে।' },
        { meta: 'করিডোরের মাঝামাঝি', title: 'N2', body: 'ঢাকা–সিলেট মহাসড়ক, উত্তর-পূর্ব দিকে।' },
        { meta: 'দক্ষিণ প্রান্ত', title: 'N1', body: 'Madanpur-এ ঢাকা–চট্টগ্রাম মহাসড়ক, দক্ষিণের বন্দরের দিকে।' },
      ],
    },
    {
      stats: [
        { label: 'করিডোরের দৈর্ঘ্য', value: '৪৮', unit: 'কিমি' },
        { label: 'যান চলাচলের জন্য খোলা', value: '১৮', unit: 'কিমি' },
        { label: 'টোলভুক্ত যানবাহন শ্রেণি', value: '৯', unit: '' },
        { label: 'সংযুক্ত জাতীয় মহাসড়ক', value: '৪', unit: '' },
      ],
    },
    {
      image: '/photo/16.webp',
      side: 'left',
      heading: 'খোলা অংশ এখন কী বদলাচ্ছে',
      body:
        '<p>আগে যে যানবাহনকে গাজীপুরের ভেতর দিয়ে যানজটে দাঁড়িয়ে থাকতে হতো, তা এখন টোল দিয়ে খোলা '
        + 'অংশ ব্যবহার করতে পারে। পণ্যপরিবহন সংস্থার কাছে এর হিসাব কিলোমিটার সাশ্রয়ে নয় — দাঁড়িয়ে '
        + 'থাকা অবস্থায় পুড়ে যাওয়া জ্বালানি আর চালকের কর্মঘণ্টায়।</p>'
        + '<p>করিডোরটি নির্মিত ও পরিচালিত হচ্ছে একটি সরকারি–বেসরকারি অংশীদারত্বের অধীনে, যার আওতায় '
        + 'রয়েছে নকশা, নির্মাণ, অর্থায়ন, পরিচালনা ও রক্ষণাবেক্ষণ। এর খরচ ওঠে টোল থেকেই।</p>'
        + '<p class="db-provisional-inline">নির্মাণকালে এই প্রকল্প নিয়ে যেসব হিসাব প্রকাশিত হয়েছিল — '
        + 'মোট বিনিয়োগ, সৃষ্ট কর্মসংস্থান, নির্মিত সেতু ও আন্ডারপাসের সংখ্যা, কনসেশনের মেয়াদ — সড়ক '
        + 'খুলে দেওয়ার পর সেগুলি আর নিশ্চিত করা হয়নি। DBEDC যাচাই না করা পর্যন্ত সেগুলি এখানে '
        + 'পুনঃপ্রকাশ করা হচ্ছে না।</p>',
      caption: 'খোলা অংশের চূড়ান্ত পৃষ্ঠস্তর।',
      linkLabel: 'আজকের করিডোর',
      linkHref: 'travel/status',
    },
    {
      heading: 'করিডোর',
      intro: 'নির্মাণকালে এবং খুলে দেওয়ার পর অ্যালাইনমেন্ট।',
      items: [
        { image: '/photo/22.webp', caption: 'নদী পার হওয়া ভায়াডাক্ট।' },
        { image: '/photo/20.webp', caption: 'খোলা অংশে যান চলাচল।' },
        { image: '/photo/21.webp', caption: 'উন্মুক্ত জলের উপর সেতু নির্মাণ।' },
        { image: '/photo/18.webp', caption: 'সন্ধ্যায় পৃষ্ঠস্তর বসানো।' },
        { image: '/photo/17.webp', caption: 'পৃষ্ঠস্তর কম্প্যাক্ট করা হচ্ছে।' },
        { image: '/photo/23.webp', caption: 'ডেক বরাবর দক্ষিণ দিকে।' },
      ],
      linkLabel: '',
      linkHref: '',
    },
    {
      heading: 'কারা নির্মাণ ও পরিচালনা করে',
      intro: 'কনসেশনের দায়িত্বে রয়েছে Dhaka Bypass Expressway Development Company।',
      items: [
        { name: 'SRBG', role: 'Sichuan Road & Bridge Group, প্রধান অংশীদার', share: '৬০%' },
        { name: 'SEL', role: 'Shamim Enterprise Ltd', share: '' },
        { name: 'UDC', role: 'UDC Construction Ltd', share: '' },
      ],
    },
    {
      heading: 'যাত্রার আগে',
      body:
        'মোটরসাইকেল ও তিন চাকার যানবাহন নিষিদ্ধ। রওনা হওয়ার আগে গতিসীমা ও বন্ধ থাকা '
        + 'অংশ সম্পর্কে জেনে নিন।',
      primaryLabel: 'সড়ক বিধি',
      primaryHref: 'travel/rules',
      secondaryLabel: 'আজ কী খোলা আছে',
      secondaryHref: 'travel/status',
    },
  ],
  zh: [
    {
      image: '/bg-hero.webp',
      eyebrow: 'Dhaka Bypass Expressway',
      headline: '18公里已通车并开始收费',
      standfirst:
        '快速路首段目前在 Vogra 至 Mirer Bazar 之间承担通行。'
        + '全长48公里走廊的其余路段仍在建设中。',
      primaryLabel: '通行费标准',
      primaryHref: 'travel/toll',
      secondaryLabel: '通车路段',
      secondaryHref: 'travel/status',
    },
    {
      heading: '通行费用',
      intro: '已通车路段现行的通行费标准。摩托车和三轮车不得驶入本快速路。',
      classes: ['car', 'microbus', 'large_bus', 'heavy_truck'],
      linkLabel: '全部九类车型',
      linkHref: 'travel/toll',
    },
    {
      image: '/bypass-ex.webp',
      side: 'right',
      heading: '绕开城市，而不是穿城而过',
      body:
        '<p>Dhaka Bypass 沿首都东缘延伸48公里，北起加济普尔，南至纳拉扬甘杰。'
        + '修建它，是为了让往返于北部工业带与南部港口之间的货运车辆不必穿越达卡。</p>'
        + '<p>本路实行出入控制：车辆只能在已建成的互通立交上下，所有交叉均为立体交叉。'
        + '这正是它与所衔接的各条国道的区别所在，也是全线通车之后，原本穿城需要两小时的行程'
        + '有望大幅缩短的原因。</p>',
      caption: '已通车路段建成的行车道。',
      linkLabel: '上下路的位置',
      linkHref: 'travel/route',
    },
    {
      heading: '衔接哪些道路',
      intro: '沿线共有四条国道与本走廊相交。',
      items: [
        { meta: '北端', title: 'N3', body: '在 Joydebpur 衔接达卡–迈门辛国道，通往北方。' },
        { meta: '北段', title: 'N4', body: '丹盖尔与贾木纳大桥走廊，通往西北方向。' },
        { meta: '走廊中段', title: 'N2', body: '达卡–锡尔赫特国道，通往东北方向。' },
        { meta: '南端', title: 'N1', body: '在 Madanpur 衔接达卡–吉大港国道，通往南部港口。' },
      ],
    },
    {
      stats: [
        { label: '走廊全长', value: '48', unit: '公里' },
        { label: '已通车里程', value: '18', unit: '公里' },
        { label: '收费车型数', value: '9', unit: '' },
        { label: '衔接国道数', value: '4', unit: '' },
      ],
    },
    {
      image: '/photo/16.webp',
      side: 'left',
      heading: '已通车路段带来的改变',
      body:
        '<p>过去必须在加济普尔排队通行的车辆，如今可以改走收费路段。对货运企业来说，'
        + '这笔账不是省下多少公里，而是怠速中烧掉的燃油和司机的工时。</p>'
        + '<p>本走廊在政府与社会资本合作（PPP）模式下建设和运营，涵盖设计、施工、融资、'
        + '运营与养护。通行费是其资金来源。</p>'
        + '<p class="db-provisional-inline">施工期间就本项目公布过的数据——总投资、创造的就业岗位、'
        + '建成的桥梁与地下通道数量、特许经营期限——在道路通车后均未重新确认。在 DBEDC 核实之前，'
        + '这些数据不会在此重新发布。</p>',
      caption: '已通车路段建成的沥青面层。',
      linkLabel: '今日通行状况',
      linkHref: 'travel/status',
    },
    {
      heading: '走廊沿线',
      intro: '施工期间与通车之后的线路。',
      items: [
        { image: '/photo/22.webp', caption: '跨河高架桥。' },
        { image: '/photo/20.webp', caption: '已通车路段的车流。' },
        { image: '/photo/21.webp', caption: '开阔水面上的桥梁施工。' },
        { image: '/photo/18.webp', caption: '傍晚摊铺沥青面层。' },
        { image: '/photo/17.webp', caption: '碾压面层。' },
        { image: '/photo/23.webp', caption: '沿桥面向南望。' },
      ],
      linkLabel: '',
      linkHref: '',
    },
    {
      heading: '建设与运营方',
      intro: '特许经营权由 Dhaka Bypass Expressway Development Company 持有。',
      items: [
        { name: 'SRBG', role: '四川路桥集团，牵头方', share: '60%' },
        { name: 'SEL', role: 'Shamim Enterprise Ltd', share: '' },
        { name: 'UDC', role: 'UDC Construction Ltd', share: '' },
      ],
    },
    {
      heading: '出发之前',
      body:
        '摩托车和三轮车禁止通行。出发前请先了解限速与封闭路段。',
      primaryLabel: '通行规则',
      primaryHref: 'travel/rules',
      secondaryLabel: '今日通车路段',
      secondaryHref: 'travel/status',
    },
  ],
};

const [pageRows] = await db.execute('SELECT id FROM pages WHERE slug = ?', ['home']);
let pageId;
if (pageRows.length) {
  pageId = pageRows[0].id;
  await db.execute('UPDATE pages SET status = ? WHERE id = ?', ['published', pageId]);
  const [old] = await db.execute('SELECT id FROM blocks WHERE page_id = ?', [pageId]);
  for (const b of old) await db.execute('DELETE FROM block_translations WHERE block_id = ?', [b.id]);
  await db.execute('DELETE FROM blocks WHERE page_id = ?', [pageId]);
} else {
  const [ins] = await db.execute("INSERT INTO pages (slug, status) VALUES ('home', 'published')");
  pageId = ins.insertId;
}

/**
 * The browser tab and the search result, per locale.
 *
 * app/[locale]/page.jsx's generateMetadata reads page.translations, runs them
 * through resolveTranslation(), and uses `seo_title || title` for the title and
 * `seo_description` for the description. resolveTranslation only accepts a row
 * whose status is 'published', and falls back to en otherwise — so until these
 * bn and zh rows existed, /bn and /zh served an English tab title and no
 * description at all.
 *
 * seo_title is left empty on purpose: `seo_title || title` already falls
 * through to `title`, and one field to edit in the admin is better than two
 * that must be kept in agreement.
 *
 * The road's name stays Latin in all three, per the script rule above.
 *
 * page_translations is keyed on (page_id, locale) and has NO surrogate id, so
 * the upsert is the whole read-modify-write. The plan's SELECT id / UPDATE ...
 * WHERE id = ? pair cannot work against this schema — it fails with
 * ER_BAD_FIELD_ERROR.
 */
const PAGE_META = {
  en: {
    title: 'Dhaka Bypass Expressway',
    description:
      'The Dhaka Bypass Expressway is open and tolling on 18 kilometres between Vogra and '
      + 'Mirer Bazar — toll rates, the route, and what is open today.',
  },
  bn: {
    title: 'Dhaka Bypass Expressway — টোল, রুট ও যান চলাচলের তথ্য',
    description:
      'Dhaka Bypass Expressway-এর ভোগড়া থেকে মীরের বাজার পর্যন্ত ১৮ কিলোমিটার খোলা ও টোল আদায় '
      + 'চালু — টোল হার, রুট এবং আজ কী খোলা আছে, সবই এক জায়গায়।',
  },
  zh: {
    title: 'Dhaka Bypass Expressway — 通行费、路线与通行信息',
    description:
      'Dhaka Bypass Expressway 目前在 Vogra 至 Mirer Bazar 之间的18公里路段通车并收费——'
      + '通行费标准、路线走向以及今日通行状况，均可在此查询。',
  },
};

for (const [locale, meta] of Object.entries(PAGE_META)) {
  await db.execute(
    `INSERT INTO page_translations (page_id, locale, title, seo_description, status)
     VALUES (?, ?, ?, ?, 'published')
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), seo_description = VALUES(seo_description),
       status = VALUES(status)`,
    [pageId, locale, meta.title, meta.description],
  );
}

for (const [i, block] of BLOCKS.entries()) {
  const [ins] = await db.execute(
    'INSERT INTO blocks (page_id, type, sort_order) VALUES (?, ?, ?)',
    [pageId, block.type, i],
  );
  for (const locale of ['en', 'bn', 'zh']) {
    const data = locale === 'en' ? block.data : TRANSLATIONS[locale][i];
    if (!data) continue; // no translation yet: BlockRenderer falls back to en
    await db.execute(
      'INSERT INTO block_translations (block_id, locale, data, status) VALUES (?, ?, ?, ?)',
      [ins.insertId, locale, JSON.stringify(data), 'published'],
    );
  }
}

console.log(`seeded page titles + meta for ${Object.keys(PAGE_META).join(', ')}`);
console.log(`seeded ${BLOCKS.length} home blocks (en)`);
for (const locale of ['bn', 'zh']) {
  console.log(`  + ${TRANSLATIONS[locale].filter(Boolean).length} ${locale} translations`);
}
await db.end();
