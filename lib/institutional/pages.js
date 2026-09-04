/**
 * The institutional pages: what DBEDC publishes about itself, its obligations
 * and its corridor, in en / bn / zh.
 *
 * ---------------------------------------------------------------------------
 * Why this structure, and not the old site's
 * ---------------------------------------------------------------------------
 * The site being replaced organises itself around `project`, `economic-impact`,
 * `stakeholders` and `chinese-contribution` — four pages that answer questions
 * about the project's promoters. That is a brochure for investors, published at
 * the address a driver reaches for when they want to know what a truck costs to
 * take through Gazipur.
 *
 * What operators of comparable roads actually lead with is journey planning,
 * road safety, sustainability, governance and procurement — PLUS Malaysia, the
 * closest comparable operator, is organised in exactly those terms. On top of
 * that a PPP toll road in this region carries obligations the brochure model has
 * no place for at all: a published grievance route, land acquisition and
 * resettlement disclosure, tariff notifications, and open tenders.
 *
 * So the shape here is:
 *
 *   travel/*        already built — status, tolls, route, facilities, rules
 *   safety          how to drive the road, and what to do when it goes wrong
 *   project         what is being built, how far it has got
 *   sustainability  environmental and social commitments
 *   about           the company, and about/governance beneath it
 *   procurement     tenders and how to bid
 *   disclosures     the statutory hub: land acquisition, tariff notifications
 *   grievances      how to complain, and what happens when you do
 *
 * ---------------------------------------------------------------------------
 * The rule about facts
 * ---------------------------------------------------------------------------
 * Six of about 116 claims on the old site are confirmed
 * (docs/source-data/2026-09-04-legacy-content-audit.md §1). Those six, plus the
 * client-supplied corridor data, are the only figures published here:
 *
 *   48 km nominal length; 47.611 km measured on the road network
 *   Joydebpur (Gazipur) to Madanpur (Narayanganj)
 *   18.000 km open, K3+218 to K21+218
 *   Motorcycles and three-wheelers prohibited
 *   N1 meets the corridor at Madanpur, the southern terminus
 *   The nine partial-section toll rates (published on /travel/toll, not repeated)
 *
 * Everything else a page of this kind would normally state — the concession
 * term, the board, the hotline, the resettlement figures, the tariff order
 * references — is NOT invented. Each appears as a visible `db-pending` callout
 * naming precisely what DBEDC has to supply. A gap that announces itself is
 * recoverable; a plausible invented figure on a government-linked site is not,
 * and it is the reader who pays for it.
 *
 * That is also why these are database pages rather than code: every callout is
 * a rich-text block an editor replaces with the real answer in the admin, with
 * no deploy.
 *
 * ---------------------------------------------------------------------------
 * Shape
 * ---------------------------------------------------------------------------
 * Each page is `{ slug, blocks: [{ type, data: { en, bn, zh } }] }`.
 *
 * Translations sit beside the English they translate, deliberately. The home
 * page seed keeps them in parallel arrays indexed by position, and its own
 * comments record how easily that goes wrong — a block inserted in the middle
 * silently shifts every translation after it onto the wrong block. Here a
 * translation cannot be attached to the wrong block, because it is written
 * inside it.
 *
 * `href` values carry no locale prefix: `lib/blocks/href.js` localises them per
 * reader. A leading slash means "use exactly this", which is how the few
 * not-yet-localised routes are linked.
 */

/**
 * The awaiting-confirmation callout.
 *
 * Follows the `.db-illustrative` pattern already in the stylesheet: a tag in
 * words as well as a colour, because status is never colour alone here. The tag
 * is translated; the point is that a Bangla reader sees the gap as clearly as an
 * English one, rather than an untranslated English caveat that reads like
 * boilerplate to be skipped.
 */
function pending(locale, text) {
  const tag = { en: 'Not yet published', bn: 'এখনও প্রকাশিত হয়নি', zh: '尚未公布' }[locale];
  return `<p class="db-pending"><span class="db-pending-tag">${tag}</span>${text}</p>`;
}

/**
 * Confirmed corridor figures, so no page can drift from another.
 *
 * `bn` carries the same figures in Bengali numerals. Bangla copy on this site
 * already sets figures in Bengali digits — `lib/i18n/ui.js` writes the corridor
 * length as ৪৮ — and a page mixing ১৮ into one sentence and 18 into the next
 * reads as carelessly assembled to the only readers who would notice.
 *
 * Place names stay Latin throughout, per the recorded decision in
 * docs/source-data/2026-09-03-client-decisions.md §2: well-known cities take
 * their native form, but corridor-specific facility names on DBEDC's own road
 * are our transliteration rather than a source of truth, and getting an
 * operator's own place names subtly wrong is exactly what gets noticed.
 * Gazipur and Narayanganj are districts rather than corridor facilities, so
 * they take their Bangla forms in Bangla copy.
 */
const F = {
  totalKm: '48',
  measuredKm: '47.611',
  openKm: '18',
  from: 'Joydebpur',
  fromDistrict: 'Gazipur',
  to: 'Madanpur',
  toDistrict: 'Narayanganj',
  bn: {
    totalKm: '৪৮',
    measuredKm: '৪৭.৬১১',
    openKm: '১৮',
    fromDistrict: 'গাজীপুর',
    toDistrict: 'নারায়ণগঞ্জ',
  },
};

const ABOUT = {
slug: 'about',
  meta: {
    en: {
      title: 'About DBEDC',
      description:
        'Dhaka Bypass Expressway Development Company builds, operates and maintains the '
        + `${F.totalKm} km Dhaka Bypass Expressway between ${F.from} and ${F.to} under a `
        + 'public–private partnership.',
    },
    bn: {
      title: 'DBEDC পরিচিতি',
      description:
        `Dhaka Bypass Expressway Development Company সরকারি-বেসরকারি অংশীদারিত্বের আওতায় `
        + `${F.from} থেকে ${F.to} পর্যন্ত ${F.bn.totalKm} কিলোমিটার Dhaka Bypass Expressway `
        + 'নির্মাণ, পরিচালনা ও রক্ষণাবেক্ষণ করে।',
    },
    zh: {
      title: '关于 DBEDC',
      description:
        `Dhaka Bypass Expressway Development Company 依据政府与社会资本合作（PPP）模式，`
        + `负责 ${F.from} 至 ${F.to} 全长 ${F.totalKm} 公里 Dhaka Bypass Expressway 的建设、运营与养护。`,
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'About',
          headline: 'Dhaka Bypass Expressway Development Company',
          standfirst:
            `The company responsible for building, operating and maintaining the ${F.totalKm} `
            + `kilometre expressway between ${F.from} in ${F.fromDistrict} and ${F.to} in `
            + `${F.toDistrict}, under a public–private partnership.`,
          primaryLabel: 'How we are governed',
          primaryHref: 'about/governance',
          secondaryLabel: 'The project',
          secondaryHref: 'project',
        },
        bn: {
          eyebrow: 'পরিচিতি',
          headline: 'Dhaka Bypass Expressway Development Company',
          standfirst:
            `সরকারি-বেসরকারি অংশীদারিত্বের আওতায় ${F.bn.fromDistrict}-এর ${F.from} থেকে `
            + `${F.bn.toDistrict}-এর ${F.to} পর্যন্ত ${F.bn.totalKm} কিলোমিটার এক্সপ্রেসওয়ে নির্মাণ, `
            + 'পরিচালনা ও রক্ষণাবেক্ষণের দায়িত্বপ্রাপ্ত প্রতিষ্ঠান।',
          primaryLabel: 'পরিচালনা কাঠামো',
          primaryHref: 'about/governance',
          secondaryLabel: 'প্রকল্প',
          secondaryHref: 'project',
        },
        zh: {
          eyebrow: '关于我们',
          headline: 'Dhaka Bypass Expressway Development Company',
          standfirst:
            `依据政府与社会资本合作（PPP）模式，负责 ${F.fromDistrict} 的 ${F.from} 至 `
            + `${F.toDistrict} 的 ${F.to} 全长 ${F.totalKm} 公里快速路的建设、运营与养护。`,
          primaryLabel: '治理架构',
          primaryHref: 'about/governance',
          secondaryLabel: '项目概况',
          secondaryHref: 'project',
        },
      },
    },
    {
      type: 'stat-row',
      data: {
        en: {
          // Two tiles, not three. A "Districts served: Gazipur — Narayanganj"
          // tile put a long text value into a slot sized for numerals, where it
          // rendered larger than the figures beside it — and it repeated what
          // the standfirst directly above already says.
          stats: [
            { label: 'Corridor length', value: F.totalKm, unit: 'km' },
            { label: 'Open to traffic', value: F.openKm, unit: 'km' },
          ],
        },
        bn: {
          stats: [
            { label: 'করিডোরের দৈর্ঘ্য', value: F.bn.totalKm, unit: 'কিমি' },
            { label: 'যান চলাচলের জন্য খোলা', value: F.bn.openKm, unit: 'কিমি' },
          ],
        },
        zh: {
          stats: [
            { label: '走廊全长', value: F.totalKm, unit: '公里' },
            { label: '已通车', value: F.openKm, unit: '公里' },
          ],
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'What we do',
          body:
            '<p>Dhaka Bypass Expressway Development Company (DBEDC) is the concession company '
            + `for the Dhaka Bypass Expressway — the ${F.totalKm} kilometre route that carries `
            + `traffic around the eastern side of Dhaka between ${F.from} and ${F.to}, `
            + 'connecting the northern and southern national highway corridors without passing '
            + 'through the capital.</p>'
            + '<p>Our responsibilities run for the life of the concession: constructing the '
            + 'expressway, operating it, maintaining the pavement and structures, collecting '
            + 'tolls at the published rates, and handing the asset back to the government at '
            + 'the end of the term.</p>'
            + pending('en',
              'The concession term, the date of financial close and the identity of the '
              + 'contracting authority and the sponsors have not yet been confirmed for '
              + 'publication. They will be published here, and in the governance section, once '
              + 'DBEDC has released them.'),
        },
        bn: {
          heading: 'আমাদের কাজ',
          body:
            '<p>Dhaka Bypass Expressway Development Company (DBEDC) হলো Dhaka Bypass '
            + `Expressway-এর কনসেশন কোম্পানি — ${F.bn.totalKm} কিলোমিটারের এই পথ ঢাকার পূর্ব দিক `
            + `ঘুরে ${F.from} থেকে ${F.to} পর্যন্ত যান চলাচল বহন করে, রাজধানীর ভেতর দিয়ে না `
            + 'গিয়েই উত্তর ও দক্ষিণের জাতীয় মহাসড়ক করিডোরগুলিকে যুক্ত করে।</p>'
            + '<p>কনসেশনের পুরো মেয়াদজুড়ে আমাদের দায়িত্ব: এক্সপ্রেসওয়ে নির্মাণ, পরিচালনা, '
            + 'পেভমেন্ট ও অবকাঠামোর রক্ষণাবেক্ষণ, প্রকাশিত হারে টোল আদায়, এবং মেয়াদ শেষে '
            + 'সরকারের কাছে সম্পদ হস্তান্তর।</p>'
            + pending('bn',
              'কনসেশনের মেয়াদ, আর্থিক সমাপ্তির তারিখ এবং চুক্তিকারী কর্তৃপক্ষ ও স্পনসরদের পরিচয় '
              + 'প্রকাশের জন্য এখনও নিশ্চিত করা হয়নি। DBEDC প্রকাশ করার পর সেগুলি এখানে ও পরিচালনা '
              + 'কাঠামোর অংশে প্রকাশিত হবে।'),
        },
        zh: {
          heading: '我们的职责',
          body:
            '<p>Dhaka Bypass Expressway Development Company（DBEDC）是 Dhaka Bypass '
            + `Expressway 的特许经营公司。这条全长 ${F.totalKm} 公里的通道自 ${F.from} 至 `
            + `${F.to}，沿达卡东侧绕行，使南北向国道走廊无需穿越首都即可衔接。</p>`
            + '<p>在整个特许经营期内，我们负责快速路的建设与运营、路面与构造物的养护、'
            + '按公布标准收取通行费，并在期满时将资产移交政府。</p>'
            + pending('zh',
              '特许经营期限、融资交割日期，以及签约机构与发起人的具体信息尚未获准公布。'
              + 'DBEDC 正式发布后，将在此处及治理架构页面公开。'),
        },
      },
    },
    {
      type: 'card-grid',
      data: {
        en: {
          heading: 'Our obligations to road users',
          intro: 'What you are entitled to expect from us, and where to find it.',
          items: [
            {
              meta: 'Tolling',
              title: 'Published rates, applied consistently',
              body:
                'Every toll in force is published, by vehicle class and by section. No rate is '
                + 'charged that does not appear on this site.',
            },
            {
              meta: 'Availability',
              title: 'An honest account of what is open',
              body:
                `${F.openKm} kilometres are open to traffic today. The status of every section `
                + 'is published and updated as work progresses.',
            },
            {
              meta: 'Grievances',
              title: 'A route for complaints',
              body:
                'A published way to raise a problem — with tolling, with the road surface, with '
                + 'conduct at a plaza — and an account of what happens next.',
            },
            {
              meta: 'Disclosure',
              title: 'Documents in public',
              body:
                'Tariff notifications, land acquisition and resettlement information, and tender '
                + 'notices, published rather than available on request.',
            },
          ],
        },
        bn: {
          heading: 'সড়ক ব্যবহারকারীদের প্রতি আমাদের দায়বদ্ধতা',
          intro: 'আমাদের কাছ থেকে আপনি যা প্রত্যাশা করতে পারেন, এবং তা কোথায় পাবেন।',
          items: [
            {
              meta: 'টোল',
              title: 'প্রকাশিত হার, সমানভাবে প্রযোজ্য',
              body:
                'কার্যকর প্রতিটি টোল যানবাহনের শ্রেণি ও অংশ অনুযায়ী প্রকাশ করা হয়। এই সাইটে নেই '
                + 'এমন কোনও হার আদায় করা হয় না।',
            },
            {
              meta: 'চলাচল',
              title: 'কী খোলা, তার সৎ হিসাব',
              body:
                `আজ ${F.bn.openKm} কিলোমিটার যান চলাচলের জন্য খোলা। প্রতিটি অংশের অবস্থা প্রকাশ করা `
                + 'হয় এবং কাজ এগোনোর সঙ্গে সঙ্গে হালনাগাদ করা হয়।',
            },
            {
              meta: 'অভিযোগ',
              title: 'অভিযোগ জানানোর পথ',
              body:
                'টোল, সড়কের পৃষ্ঠ, কিংবা প্লাজায় আচরণ — যেকোনও সমস্যা জানানোর একটি প্রকাশিত পথ, '
                + 'এবং তারপর কী হয় তার বিবরণ।',
            },
            {
              meta: 'তথ্য প্রকাশ',
              title: 'নথি প্রকাশ্যে',
              body:
                'টোল বিজ্ঞপ্তি, ভূমি অধিগ্রহণ ও পুনর্বাসন সংক্রান্ত তথ্য এবং দরপত্র বিজ্ঞপ্তি — '
                + 'চাহিদার ভিত্তিতে নয়, প্রকাশ্যে।',
            },
          ],
        },
        zh: {
          heading: '我们对道路使用者的承诺',
          intro: '您有权从我们这里得到什么，以及在哪里查到。',
          items: [
            {
              meta: '收费',
              title: '公布标准，一致执行',
              body: '所有现行通行费均按车型与路段公布。凡本网站未列明的费率，一律不予收取。',
            },
            {
              meta: '通行',
              title: '如实公布通车情况',
              body: `目前已有 ${F.openKm} 公里通车。各路段状态均对外公布，并随工程进展更新。`,
            },
            {
              meta: '投诉',
              title: '畅通的投诉渠道',
              body:
                '无论是通行费、路面状况还是收费站的服务态度，都有公开的反映渠道，'
                + '并明确说明后续处理流程。',
            },
            {
              meta: '信息公开',
              title: '文件主动公开',
              body: '通行费公告、征地与安置信息、招标公告，均主动公开，无需申请索取。',
            },
          ],
        },
      },
    },
    {
      type: 'cta-band',
      data: {
        en: {
          heading: 'Looking for something specific?',
          body: 'Tolls and route information are under Travel. Documents are under Disclosures.',
          primaryLabel: 'Travel information',
          primaryHref: 'travel/status',
          secondaryLabel: 'Disclosures',
          secondaryHref: 'disclosures',
        },
        bn: {
          heading: 'নির্দিষ্ট কিছু খুঁজছেন?',
          body: 'টোল ও রুটের তথ্য রয়েছে ভ্রমণ অংশে। নথিপত্র রয়েছে তথ্য প্রকাশ অংশে।',
          primaryLabel: 'ভ্রমণ তথ্য',
          primaryHref: 'travel/status',
          secondaryLabel: 'তথ্য প্রকাশ',
          secondaryHref: 'disclosures',
        },
        zh: {
          heading: '查找特定信息？',
          body: '通行费与路线信息见“出行信息”，各类文件见“信息公开”。',
          primaryLabel: '出行信息',
          primaryHref: 'travel/status',
          secondaryLabel: '信息公开',
          secondaryHref: 'disclosures',
        },
      },
    },
  ],
};

// ===========================================================================
const GOVERNANCE = {
  slug: 'about/governance',
  meta: {
    en: {
      title: 'Governance',
      description:
        'How DBEDC is governed and supervised, the policies it operates under, and the '
        + 'documents it publishes.',
    },
    bn: {
      title: 'পরিচালনা কাঠামো',
      description:
        'DBEDC কীভাবে পরিচালিত ও তদারক হয়, কোন নীতিমালার অধীনে কাজ করে এবং কী কী নথি প্রকাশ করে।',
    },
    zh: {
      title: '治理架构',
      description: 'DBEDC 的治理与监督机制、所遵循的各项政策，以及对外公开的文件。',
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'About',
          headline: 'Governance',
          standfirst:
            'A toll road is a public asset operated under contract. This section sets out who '
            + 'answers for it, under what rules, and which documents are public.',
        },
        bn: {
          eyebrow: 'পরিচিতি',
          headline: 'পরিচালনা কাঠামো',
          standfirst:
            'টোল সড়ক একটি সরকারি সম্পদ, যা চুক্তির আওতায় পরিচালিত হয়। এই অংশে রয়েছে — কে জবাবদিহি '
            + 'করে, কোন নিয়মের অধীনে, এবং কোন নথিগুলি প্রকাশ্য।',
        },
        zh: {
          eyebrow: '关于我们',
          headline: '治理架构',
          standfirst:
            '收费公路是依合同运营的公共资产。本页说明由谁负责、依据何种规则运营，以及哪些文件对外公开。',
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'The contractual structure',
          body:
            '<p>The Dhaka Bypass Expressway is delivered as a public–private partnership. A '
            + 'government contracting authority owns the corridor and sets the terms; DBEDC, as '
            + 'the concession company, finances, builds, operates and maintains it for a fixed '
            + 'term, recovers its investment through tolls, and returns the asset at the end.</p>'
            + '<p>That structure decides everything a road user experiences: who sets the toll, '
            + 'who is accountable for the road surface, and who answers a complaint.</p>'
            + pending('en',
              'The concession agreement, the contracting authority, the concession term, and the '
              + 'shareholding of the concession company have not yet been released for '
              + 'publication. Bangladesh\'s PPP framework provides for the disclosure of executed '
              + 'concession agreements, and this page is where DBEDC\'s will appear.'),
        },
        bn: {
          heading: 'চুক্তিগত কাঠামো',
          body:
            '<p>Dhaka Bypass Expressway সরকারি-বেসরকারি অংশীদারিত্বের (PPP) আওতায় বাস্তবায়িত '
            + 'হচ্ছে। সরকারি চুক্তিকারী কর্তৃপক্ষ করিডোরের মালিক এবং শর্ত নির্ধারণ করে; কনসেশন '
            + 'কোম্পানি হিসেবে DBEDC নির্দিষ্ট মেয়াদের জন্য অর্থায়ন, নির্মাণ, পরিচালনা ও রক্ষণাবেক্ষণ '
            + 'করে, টোলের মাধ্যমে বিনিয়োগ ফিরে পায় এবং মেয়াদ শেষে সম্পদ ফিরিয়ে দেয়।</p>'
            + '<p>সড়ক ব্যবহারকারী যা কিছু অনুভব করেন তার সবই এই কাঠামো নির্ধারণ করে — কে টোল '
            + 'নির্ধারণ করে, সড়কের পৃষ্ঠের জন্য কে দায়ী, এবং অভিযোগের জবাব কে দেয়।</p>'
            + pending('bn',
              'কনসেশন চুক্তি, চুক্তিকারী কর্তৃপক্ষ, কনসেশনের মেয়াদ এবং কনসেশন কোম্পানির শেয়ার-কাঠামো '
              + 'এখনও প্রকাশের জন্য অবমুক্ত করা হয়নি। বাংলাদেশের পিপিপি কাঠামোয় সম্পাদিত কনসেশন চুক্তি '
              + 'প্রকাশের বিধান রয়েছে, এবং DBEDC-এর চুক্তি এই পাতাতেই প্রকাশিত হবে।'),
        },
        zh: {
          heading: '合同架构',
          body:
            '<p>Dhaka Bypass Expressway 采用政府与社会资本合作（PPP）模式实施。'
            + '政府签约机构拥有该走廊并确定各项条件；DBEDC 作为特许经营公司，'
            + '在约定期限内负责融资、建设、运营与养护，通过收取通行费回收投资，期满后移交资产。</p>'
            + '<p>道路使用者所感受到的一切都由这一架构决定：由谁制定收费标准、由谁对路面状况负责、'
            + '以及由谁答复投诉。</p>'
            + pending('zh',
              '特许经营协议、签约机构、特许经营期限以及特许经营公司的股权结构尚未获准公布。'
              + '孟加拉国 PPP 制度规定已签署的特许经营协议应予公开，DBEDC 的协议届时将在本页发布。'),
        },
      },
    },
    {
      type: 'card-grid',
      data: {
        en: {
          heading: 'Oversight',
          intro: 'The layers of supervision a concession of this kind sits under.',
          items: [
            {
              meta: 'Contracting authority',
              title: 'Government supervision',
              body:
                'The corridor is a public asset. The contracting authority approves the tariff, '
                + 'monitors performance against the concession, and takes the road back at the '
                + 'end of the term.',
            },
            {
              meta: 'Board',
              title: 'Company direction',
              body:
                'The board of the concession company is accountable for construction, operations, '
                + 'safety and financial management.',
            },
            {
              meta: 'Independent',
              title: 'Engineer and auditor',
              body:
                'Construction quality and financial statements are reviewed independently of '
                + 'management, as concession agreements of this type require.',
            },
            {
              meta: 'Public',
              title: 'Disclosure and grievance',
              body:
                'Published documents and a working complaints route are the parts of oversight a '
                + 'road user can exercise directly.',
            },
          ],
        },
        bn: {
          heading: 'তদারকি',
          intro: 'এ ধরনের কনসেশন যে স্তরগুলির তদারকিতে চলে।',
          items: [
            {
              meta: 'চুক্তিকারী কর্তৃপক্ষ',
              title: 'সরকারি তদারকি',
              body:
                'করিডোরটি একটি সরকারি সম্পদ। চুক্তিকারী কর্তৃপক্ষ টোলের হার অনুমোদন করে, কনসেশনের '
                + 'শর্তের বিপরীতে কর্মদক্ষতা পর্যবেক্ষণ করে এবং মেয়াদ শেষে সড়কটি ফেরত নেয়।',
            },
            {
              meta: 'পরিচালনা পর্ষদ',
              title: 'কোম্পানির দিকনির্দেশনা',
              body:
                'নির্মাণ, পরিচালনা, নিরাপত্তা ও আর্থিক ব্যবস্থাপনার জন্য কনসেশন কোম্পানির পরিচালনা '
                + 'পর্ষদ দায়বদ্ধ।',
            },
            {
              meta: 'স্বাধীন',
              title: 'প্রকৌশলী ও নিরীক্ষক',
              body:
                'এ ধরনের কনসেশন চুক্তির শর্ত অনুযায়ী নির্মাণের মান ও আর্থিক বিবরণী ব্যবস্থাপনা থেকে '
                + 'স্বাধীনভাবে পর্যালোচিত হয়।',
            },
            {
              meta: 'জনসাধারণ',
              title: 'তথ্য প্রকাশ ও অভিযোগ',
              body:
                'প্রকাশিত নথি ও কার্যকর অভিযোগ ব্যবস্থা — তদারকির এই অংশটুকু একজন সড়ক ব্যবহারকারী '
                + 'সরাসরি প্রয়োগ করতে পারেন।',
            },
          ],
        },
        zh: {
          heading: '监督机制',
          intro: '此类特许经营项目所受的多层监督。',
          items: [
            {
              meta: '签约机构',
              title: '政府监管',
              body:
                '该走廊属于公共资产。签约机构核准收费标准、依据特许经营协议考核履约情况，'
                + '并在期满时收回道路。',
            },
            {
              meta: '董事会',
              title: '公司治理',
              body: '特许经营公司董事会对建设、运营、安全与财务管理负责。',
            },
            {
              meta: '独立第三方',
              title: '工程师与审计',
              body: '按此类特许经营协议的要求，施工质量与财务报表由独立于管理层的第三方进行审查。',
            },
            {
              meta: '公众',
              title: '信息公开与投诉',
              body: '公开文件与畅通的投诉渠道，是道路使用者可以直接行使的监督方式。',
            },
          ],
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Board and senior management',
          body:
            pending('en',
              'DBEDC has not yet confirmed the names and roles of its directors and senior '
              + 'officers for publication. The previous site listed five individuals with titles; '
              + 'that list is years old, unverified, and one name is a romanisation that collides '
              + 'with an internationally known figure — so it is not being carried across. This '
              + 'section will be filled from a list DBEDC confirms.'),
        },
        bn: {
          heading: 'পরিচালনা পর্ষদ ও ঊর্ধ্বতন ব্যবস্থাপনা',
          body:
            pending('bn',
              'DBEDC এখনও তার পরিচালক ও ঊর্ধ্বতন কর্মকর্তাদের নাম ও পদবি প্রকাশের জন্য নিশ্চিত করেনি। '
              + 'আগের সাইটে পদবিসহ পাঁচজনের নাম ছিল; সেই তালিকা কয়েক বছরের পুরনো, অযাচাইকৃত, এবং '
              + 'একটি নামের বানান আন্তর্জাতিকভাবে পরিচিত এক ব্যক্তির নামের সঙ্গে মিলে যায় — তাই সেটি '
              + 'এখানে আনা হয়নি। DBEDC নিশ্চিত করা তালিকা থেকেই এই অংশ পূরণ করা হবে।'),
        },
        zh: {
          heading: '董事会与高级管理层',
          body:
            pending('zh',
              'DBEDC 尚未确认其董事及高级管理人员的姓名与职务可否公布。旧网站曾列出五位人员及其职务，'
              + '但该名单已有数年之久、未经核实，且其中一个罗马化拼写与一位国际知名人士重名，'
              + '因此未予沿用。本栏目将依据 DBEDC 确认的名单填写。'),
        },
      },
    },
    {
      type: 'cta-band',
      data: {
        en: {
          heading: 'Published documents',
          body: 'Tariff notifications, land acquisition and resettlement information, and tenders.',
          primaryLabel: 'Disclosures',
          primaryHref: 'disclosures',
          secondaryLabel: 'Procurement',
          secondaryHref: 'procurement',
        },
        bn: {
          heading: 'প্রকাশিত নথি',
          body: 'টোল বিজ্ঞপ্তি, ভূমি অধিগ্রহণ ও পুনর্বাসন সংক্রান্ত তথ্য এবং দরপত্র।',
          primaryLabel: 'তথ্য প্রকাশ',
          primaryHref: 'disclosures',
          secondaryLabel: 'ক্রয় ও দরপত্র',
          secondaryHref: 'procurement',
        },
        zh: {
          heading: '公开文件',
          body: '通行费公告、征地与安置信息，以及招标公告。',
          primaryLabel: '信息公开',
          primaryHref: 'disclosures',
          secondaryLabel: '采购招标',
          secondaryHref: 'procurement',
        },
      },
    },
  ],
};

// ===========================================================================
const PROJECT = {
  slug: 'project',
  meta: {
    en: {
      title: 'The project',
      description:
        `A ${F.totalKm} kilometre expressway from ${F.from} to ${F.to}, of which ${F.openKm} `
        + 'kilometres are open to traffic and tolling.',
    },
    bn: {
      title: 'প্রকল্প',
      description:
        `${F.from} থেকে ${F.to} পর্যন্ত ${F.bn.totalKm} কিলোমিটার এক্সপ্রেসওয়ে, যার ${F.bn.openKm} `
        + 'কিলোমিটার যান চলাচল ও টোল আদায়ের জন্য খোলা।',
    },
    zh: {
      title: '项目概况',
      description:
        `自 ${F.from} 至 ${F.to} 全长 ${F.totalKm} 公里的快速路，其中 ${F.openKm} 公里已通车并收费。`,
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'The project',
          headline: `${F.totalKm} kilometres around the east of Dhaka`,
          standfirst:
            `From ${F.from} in ${F.fromDistrict} to ${F.to} in ${F.toDistrict}, connecting the `
            + 'northern and southern national highway corridors without routing traffic through '
            + 'the capital.',
          primaryLabel: 'What is open today',
          primaryHref: 'travel/status',
          secondaryLabel: 'Route and interchanges',
          secondaryHref: 'travel/route',
        },
        bn: {
          eyebrow: 'প্রকল্প',
          headline: `ঢাকার পূর্ব দিক ঘিরে ${F.bn.totalKm} কিলোমিটার`,
          standfirst:
            `${F.bn.fromDistrict}-এর ${F.from} থেকে ${F.bn.toDistrict}-এর ${F.to} পর্যন্ত — রাজধানীর `
            + 'ভেতর দিয়ে যান চলাচল না পাঠিয়েই উত্তর ও দক্ষিণের জাতীয় মহাসড়ক করিডোর যুক্ত করে।',
          primaryLabel: 'আজ কী খোলা',
          primaryHref: 'travel/status',
          secondaryLabel: 'রুট ও ইন্টারচেঞ্জ',
          secondaryHref: 'travel/route',
        },
        zh: {
          eyebrow: '项目概况',
          headline: `绕达卡东侧 ${F.totalKm} 公里`,
          standfirst:
            `自 ${F.fromDistrict} 的 ${F.from} 至 ${F.toDistrict} 的 ${F.to}，`
            + '在不引导车流穿越首都的前提下衔接南北向国道走廊。',
          primaryLabel: '今日通车路段',
          primaryHref: 'travel/status',
          secondaryLabel: '路线与互通',
          secondaryHref: 'travel/route',
        },
      },
    },
    {
      type: 'stat-row',
      data: {
        en: {
          stats: [
            { label: 'Nominal length', value: F.totalKm, unit: 'km' },
            { label: 'Measured on the road network', value: F.measuredKm, unit: 'km' },
            { label: 'Open to traffic', value: F.openKm, unit: 'km' },
          ],
        },
        bn: {
          stats: [
            { label: 'নামমাত্র দৈর্ঘ্য', value: F.bn.totalKm, unit: 'কিমি' },
            { label: 'সড়ক নেটওয়ার্কে পরিমাপকৃত', value: F.bn.measuredKm, unit: 'কিমি' },
            { label: 'যান চলাচলের জন্য খোলা', value: F.bn.openKm, unit: 'কিমি' },
          ],
        },
        zh: {
          stats: [
            { label: '名义长度', value: F.totalKm, unit: '公里' },
            { label: '路网实测长度', value: F.measuredKm, unit: '公里' },
            { label: '已通车', value: F.openKm, unit: '公里' },
          ],
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Why two lengths',
          body:
            `<p>The corridor is described officially as ${F.totalKm} kilometres. Measured along `
            + `the road network it is ${F.measuredKm} kilometres. Both figures are correct for `
            + 'different purposes — the first is the nominal project length used in agreements '
            + 'and approvals, the second is what a vehicle actually travels.</p>'
            + '<p>We publish both rather than choosing one, because a reader who compares this '
            + 'site against a document and finds a difference deserves to know it is a difference '
            + 'of definition and not an error.</p>',
        },
        bn: {
          heading: 'দুটি দৈর্ঘ্য কেন',
          body:
            `<p>সরকারিভাবে করিডোরটিকে ${F.bn.totalKm} কিলোমিটার বলা হয়। সড়ক নেটওয়ার্ক বরাবর মাপলে `
            + `এটি ${F.bn.measuredKm} কিলোমিটার। ভিন্ন ভিন্ন উদ্দেশ্যে দুটি সংখ্যাই সঠিক — প্রথমটি `
            + 'চুক্তি ও অনুমোদনে ব্যবহৃত নামমাত্র প্রকল্প-দৈর্ঘ্য, দ্বিতীয়টি একটি যানবাহন প্রকৃতপক্ষে '
            + 'যতটা পথ চলে।</p>'
            + '<p>আমরা একটি বেছে না নিয়ে দুটোই প্রকাশ করি, কারণ কোনও পাঠক যদি এই সাইটের সঙ্গে '
            + 'কোনও নথি মিলিয়ে পার্থক্য দেখেন, তাঁর জানা উচিত যে এটি সংজ্ঞার পার্থক্য, ভুল নয়।</p>',
        },
        zh: {
          heading: '为何有两个长度',
          body:
            `<p>该走廊的官方长度为 ${F.totalKm} 公里，沿路网实测为 ${F.measuredKm} 公里。`
            + '两个数字各有用途、都不算错——前者是协议与审批中采用的名义项目长度，'
            + '后者是车辆实际行驶的距离。</p>'
            + '<p>我们并列公布两者，而不是择一发布。'
            + '如果读者将本网站与其他文件核对后发现差异，理应知道这是定义口径的不同，而非错误。</p>',
        },
      },
    },
    {
      type: 'card-grid',
      data: {
        en: {
          heading: 'Where the project stands',
          items: [
            {
              meta: 'Open',
              title: `${F.openKm} km carrying traffic`,
              body:
                'The section from Vogra is open and tolling at the published rates. Section '
                + 'status is updated as work progresses.',
            },
            {
              meta: 'Under construction',
              title: 'The remainder of the corridor',
              body:
                'Work continues on the sections north and south of the open length. Nothing on '
                + 'this site claims a completion date that has not been confirmed.',
            },
            {
              meta: 'Connections',
              title: 'National highway junctions',
              body:
                `The corridor meets National Highway N1, the Dhaka–Chattogram highway, at ${F.to} `
                + 'at its southern end.',
            },
          ],
        },
        bn: {
          heading: 'প্রকল্প এখন কোথায়',
          items: [
            {
              meta: 'খোলা',
              title: `${F.bn.openKm} কিমি যান চলাচলে`,
              body:
                'Vogra থেকে অংশটি খোলা এবং প্রকাশিত হারে টোল আদায় চলছে। কাজ এগোনোর সঙ্গে সঙ্গে '
                + 'অংশগুলির অবস্থা হালনাগাদ করা হয়।',
            },
            {
              meta: 'নির্মাণাধীন',
              title: 'করিডোরের বাকি অংশ',
              body:
                'খোলা অংশের উত্তর ও দক্ষিণে কাজ চলছে। এই সাইটে এমন কোনও সমাপ্তির তারিখ দাবি করা '
                + 'হয়নি যা নিশ্চিত করা হয়নি।',
            },
            {
              meta: 'সংযোগ',
              title: 'জাতীয় মহাসড়কের সংযোগস্থল',
              body:
                `করিডোরটির দক্ষিণ প্রান্তে ${F.to}-এ ঢাকা–চট্টগ্রাম মহাসড়ক N1-এর সঙ্গে সংযোগ রয়েছে।`,
            },
          ],
        },
        zh: {
          heading: '项目进展',
          items: [
            {
              meta: '已通车',
              title: `${F.openKm} 公里通行中`,
              body: '自 Vogra 起的路段已通车，并按公布标准收费。各路段状态随工程进展更新。',
            },
            {
              meta: '在建',
              title: '走廊其余路段',
              body: '通车路段以北与以南的工程仍在进行。本网站不公布任何未经确认的完工日期。',
            },
            {
              meta: '衔接',
              title: '国道交汇',
              body: `本走廊南端在 ${F.to} 与达卡—吉大港国道 N1 交汇。`,
            },
          ],
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Programme and cost',
          body:
            pending('en',
              'The construction programme, the remaining milestones, the completion date and the '
              + 'project cost have not been confirmed for publication. The previous site carried '
              + 'dates that have since passed and cost figures that could not be corroborated, so '
              + 'none of them has been carried across. This section will be filled from figures '
              + 'DBEDC confirms.'),
        },
        bn: {
          heading: 'কর্মসূচি ও ব্যয়',
          body:
            pending('bn',
              'নির্মাণ কর্মসূচি, অবশিষ্ট মাইলফলক, সমাপ্তির তারিখ ও প্রকল্প ব্যয় প্রকাশের জন্য নিশ্চিত '
              + 'করা হয়নি। আগের সাইটে এমন তারিখ ছিল যা ইতিমধ্যে পেরিয়ে গেছে এবং এমন ব্যয়ের সংখ্যা '
              + 'ছিল যা যাচাই করা যায়নি, তাই সেগুলির কোনওটিই এখানে আনা হয়নি। DBEDC নিশ্চিত করা '
              + 'তথ্য দিয়েই এই অংশ পূরণ করা হবে।'),
        },
        zh: {
          heading: '工期与投资',
          body:
            pending('zh',
              '施工计划、后续里程碑、完工日期及项目投资额尚未获准公布。'
              + '旧网站所载日期现已过期，所载投资数据亦无法核实，因此均未沿用。'
              + '本栏目将依据 DBEDC 确认的数据填写。'),
        },
      },
    },
  ],
};

// ===========================================================================
const SAFETY = {
  slug: 'safety',
  meta: {
    en: {
      title: 'Road safety',
      description:
        'How to travel the Dhaka Bypass Expressway safely — permitted vehicles, what to do if '
        + 'you break down, and how to reach help.',
    },
    bn: {
      title: 'সড়ক নিরাপত্তা',
      description:
        'Dhaka Bypass Expressway-তে নিরাপদে চলাচল — অনুমোদিত যানবাহন, যানবাহন বিকল হলে করণীয়, '
        + 'এবং সহায়তা পাওয়ার উপায়।',
    },
    zh: {
      title: '道路安全',
      description:
        '如何安全通行 Dhaka Bypass Expressway——准许通行车辆、车辆故障时的处理方式，以及如何求助。',
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'Safety',
          headline: 'Travelling the expressway safely',
          standfirst:
            'An expressway is a different road from the one beside it. Traffic is faster, '
            + 'stopping is restricted, and a vehicle that does not belong on it is a hazard to '
            + 'everyone.',
          primaryLabel: 'Rules of the road',
          primaryHref: 'travel/rules',
          secondaryLabel: "What's open today",
          secondaryHref: 'travel/status',
        },
        bn: {
          eyebrow: 'নিরাপত্তা',
          headline: 'এক্সপ্রেসওয়েতে নিরাপদ চলাচল',
          standfirst:
            'এক্সপ্রেসওয়ে পাশের সাধারণ সড়কের মতো নয়। এখানে গতি বেশি, থামা সীমিত, এবং যে যানবাহন '
            + 'এই পথের উপযুক্ত নয় তা সবার জন্যই বিপজ্জনক।',
          primaryLabel: 'সড়ক বিধি',
          primaryHref: 'travel/rules',
          secondaryLabel: 'আজ কী খোলা',
          secondaryHref: 'travel/status',
        },
        zh: {
          eyebrow: '安全',
          headline: '安全通行快速路',
          standfirst:
            '快速路不同于旁边的普通道路：车速更快、停车受限，'
            + '不适合上路的车辆会对所有人构成危险。',
          primaryLabel: '通行规则',
          primaryHref: 'travel/rules',
          secondaryLabel: '今日通车路段',
          secondaryHref: 'travel/status',
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Vehicles that may not use the expressway',
          body:
            '<p><strong>Motorcycles and three-wheelers — CNG auto-rickshaws included — are '
            + 'strictly prohibited on the Dhaka Bypass Expressway.</strong> This is not a '
            + 'guideline. The prohibition exists because the speed difference between these '
            + 'vehicles and expressway traffic is the single largest cause of fatal collisions on '
            + 'roads of this kind.</p>'
            + '<p>If your vehicle is prohibited, the parallel road network remains available and '
            + 'is the correct route.</p>',
        },
        bn: {
          heading: 'যেসব যানবাহন এক্সপ্রেসওয়ে ব্যবহার করতে পারবে না',
          body:
            '<p><strong>Dhaka Bypass Expressway-তে মোটরসাইকেল এবং তিন চাকার যান — সিএনজি '
            + 'অটোরিকশাসহ — কঠোরভাবে নিষিদ্ধ।</strong> এটি কোনও পরামর্শ নয়। এই নিষেধাজ্ঞা রয়েছে '
            + 'কারণ এসব যানবাহন ও এক্সপ্রেসওয়ের যান চলাচলের মধ্যে গতির পার্থক্যই এ ধরনের সড়কে '
            + 'প্রাণঘাতী সংঘর্ষের সবচেয়ে বড় কারণ।</p>'
            + '<p>আপনার যানবাহন নিষিদ্ধ হলে পাশের সাধারণ সড়ক নেটওয়ার্ক খোলা রয়েছে এবং সেটিই সঠিক পথ।</p>',
        },
        zh: {
          heading: '禁止驶入的车辆',
          body:
            '<p><strong>Dhaka Bypass Expressway 严禁摩托车及三轮车（含 CNG 机动三轮车）通行。'
            + '</strong>这并非建议性规定。设此禁令，是因为此类车辆与快速路车流之间的速度差，'
            + '正是同类道路上致命碰撞的首要成因。</p>'
            + '<p>如您的车辆属禁止通行之列，可继续使用并行的普通公路网，那才是正确路线。</p>',
        },
      },
    },
    {
      type: 'card-grid',
      data: {
        en: {
          heading: 'Before you travel',
          items: [
            {
              meta: 'Check',
              title: 'Which sections are open',
              body:
                `${F.openKm} kilometres are open. Confirm your entry and exit points before you `
                + 'set out — the open length does not yet run the whole corridor.',
            },
            {
              meta: 'Check',
              title: 'Tyres, fuel and load',
              body:
                'Stopping on an expressway is restricted and dangerous. A breakdown that could '
                + 'have been prevented before departure is the most common reason vehicles stop '
                + 'on the hard shoulder.',
            },
            {
              meta: 'Check',
              title: 'The toll for your vehicle class',
              body:
                'Rates are published by class and by section, so you can have the correct amount '
                + 'ready at the plaza.',
            },
          ],
        },
        bn: {
          heading: 'যাত্রার আগে',
          items: [
            {
              meta: 'যাচাই',
              title: 'কোন অংশগুলি খোলা',
              body:
                `${F.bn.openKm} কিলোমিটার খোলা। রওনা হওয়ার আগে আপনার প্রবেশ ও প্রস্থানের স্থান নিশ্চিত `
                + 'করুন — খোলা অংশটি এখনও পুরো করিডোরজুড়ে বিস্তৃত নয়।',
            },
            {
              meta: 'যাচাই',
              title: 'টায়ার, জ্বালানি ও বোঝা',
              body:
                'এক্সপ্রেসওয়েতে থামা সীমিত ও বিপজ্জনক। যাত্রার আগেই ঠেকানো যেত এমন বিকল হয়ে পড়াই '
                + 'হার্ড শোল্ডারে যানবাহন থামার সবচেয়ে সাধারণ কারণ।',
            },
            {
              meta: 'যাচাই',
              title: 'আপনার শ্রেণির টোল',
              body:
                'শ্রেণি ও অংশ অনুযায়ী হার প্রকাশ করা আছে, যাতে প্লাজায় সঠিক পরিমাণ অর্থ প্রস্তুত '
                + 'রাখতে পারেন।',
            },
          ],
        },
        zh: {
          heading: '出发之前',
          items: [
            {
              meta: '确认',
              title: '哪些路段已通车',
              body:
                `目前已通车 ${F.openKm} 公里。出发前请确认上下路口——`
                + '通车路段尚未贯通全线。',
            },
            {
              meta: '确认',
              title: '轮胎、燃油与载重',
              body:
                '在快速路上停车受限且危险。出发前本可避免的故障，'
                + '正是车辆停靠应急车道最常见的原因。',
            },
            {
              meta: '确认',
              title: '本车型的通行费',
              body: '费率按车型与路段公布，便于您在收费站备妥相应金额。',
            },
          ],
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'If you break down',
          body:
            '<p>Move the vehicle as far left as you safely can, switch on hazard lights, and get '
            + 'every passenger out on the side away from traffic and behind a barrier where one '
            + 'exists. Do not attempt a repair in a running lane, and do not cross the '
            + 'carriageway on foot.</p>'
            + pending('en',
              'The emergency assistance number for this expressway, and the breakdown recovery '
              + 'procedure, have not been supplied by DBEDC. Until they are, this page cannot tell '
              + 'you who to call, and we will not print a number that has not been confirmed to '
              + 'work — on a page that exists for emergencies, a wrong number is worse than no '
              + 'number. In an emergency use the national emergency service.'),
        },
        bn: {
          heading: 'যানবাহন বিকল হলে',
          body:
            '<p>নিরাপদে যতটা সম্ভব বাঁ দিকে যানবাহনটি সরিয়ে নিন, হ্যাজার্ড লাইট জ্বালান, এবং সব '
            + 'যাত্রীকে যান চলাচলের বিপরীত পাশ দিয়ে নামিয়ে ব্যারিয়ার থাকলে তার পিছনে নিয়ে যান। '
            + 'চলমান লেনে মেরামতের চেষ্টা করবেন না এবং পায়ে হেঁটে ক্যারিজওয়ে পার হবেন না।</p>'
            + pending('bn',
              'এই এক্সপ্রেসওয়ের জরুরি সহায়তার নম্বর এবং বিকল যানবাহন উদ্ধারের প্রক্রিয়া DBEDC এখনও '
              + 'সরবরাহ করেনি। সেগুলি না পাওয়া পর্যন্ত এই পাতা আপনাকে বলতে পারবে না কাকে ফোন করবেন, '
              + 'এবং কার্যকর বলে নিশ্চিত না হওয়া কোনও নম্বর আমরা ছাপব না — জরুরি প্রয়োজনের জন্য তৈরি '
              + 'পাতায় ভুল নম্বর কোনও নম্বর না থাকার চেয়েও খারাপ। জরুরি অবস্থায় জাতীয় জরুরি সেবা '
              + 'ব্যবহার করুন।'),
        },
        zh: {
          heading: '车辆故障时',
          body:
            '<p>在确保安全的前提下尽量将车辆靠左停放，开启危险报警闪光灯，'
            + '并让所有乘员从背离车流的一侧下车，如有护栏应转移至护栏之后。'
            + '切勿在行车道内尝试修车，也不要步行横穿路面。</p>'
            + pending('zh',
              '本快速路的紧急救援电话及故障车辆施救流程，DBEDC 尚未提供。'
              + '在此之前，本页无法告知您应拨打哪个号码；未经确认可用的号码我们不会刊登——'
              + '在一个为紧急情况而设的页面上，错误的号码比没有号码更糟。'
              + '紧急情况下请拨打国家紧急服务电话。'),
        },
      },
    },
  ],
};

// ===========================================================================
const SUSTAINABILITY = {
  slug: 'sustainability',
  meta: {
    en: {
      title: 'Sustainability',
      description:
        'Environmental and social commitments on the Dhaka Bypass Expressway, and the documents '
        + 'DBEDC publishes about them.',
    },
    bn: {
      title: 'টেকসই উন্নয়ন',
      description:
        'Dhaka Bypass Expressway-এর পরিবেশগত ও সামাজিক অঙ্গীকার, এবং সে সম্পর্কে DBEDC যেসব নথি '
        + 'প্রকাশ করে।',
    },
    zh: {
      title: '可持续发展',
      description:
        'Dhaka Bypass Expressway 的环境与社会承诺，以及 DBEDC 就此公开的各项文件。',
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'Sustainability',
          headline: 'Building a road through a living landscape',
          standfirst:
            'A corridor of this length crosses farmland, waterways and settlements. What that '
            + 'costs, and what is done about it, belongs in public.',
        },
        bn: {
          eyebrow: 'টেকসই উন্নয়ন',
          headline: 'জনবসতিপূর্ণ ভূমির মধ্য দিয়ে সড়ক নির্মাণ',
          standfirst:
            'এই দৈর্ঘ্যের একটি করিডোর কৃষিজমি, জলপথ ও জনবসতির মধ্য দিয়ে যায়। তার মূল্য কী, এবং সে '
            + 'বিষয়ে কী করা হচ্ছে — তা প্রকাশ্যে থাকা উচিত।',
        },
        zh: {
          eyebrow: '可持续发展',
          headline: '在有人生活的土地上修路',
          standfirst:
            '这样长度的走廊要穿越农田、水系与村落。为此付出了什么代价、又采取了哪些措施，理应公之于众。',
        },
      },
    },
    {
      type: 'card-grid',
      data: {
        en: {
          heading: 'What sustainability means on this corridor',
          intro:
            'Three areas where an expressway concession has obligations beyond building the road.',
          items: [
            {
              meta: 'Environment',
              title: 'Water, air and land',
              body:
                'The corridor crosses waterways and drainage that farmland depends on. Bridges, '
                + 'culverts and drainage design determine whether that continues to work after '
                + 'the road is built.',
            },
            {
              meta: 'Communities',
              title: 'People along the alignment',
              body:
                'Land was acquired and households were affected. What was paid, to whom, and what '
                + 'resettlement support followed is published under Disclosures.',
            },
            {
              meta: 'Workforce',
              title: 'Safety of the people who build it',
              body:
                'Construction safety, working conditions and contractor standards apply to '
                + 'everyone on site, not only to direct employees.',
            },
          ],
        },
        bn: {
          heading: 'এই করিডোরে টেকসই উন্নয়ন বলতে যা বোঝায়',
          intro: 'সড়ক নির্মাণের বাইরেও এক্সপ্রেসওয়ে কনসেশনের দায়িত্ব রয়েছে এমন তিনটি ক্ষেত্র।',
          items: [
            {
              meta: 'পরিবেশ',
              title: 'পানি, বায়ু ও ভূমি',
              body:
                'করিডোরটি এমন জলপথ ও নিষ্কাশন ব্যবস্থার উপর দিয়ে গেছে যার উপর কৃষিজমি নির্ভরশীল। '
                + 'সড়ক নির্মাণের পরও তা কার্যকর থাকবে কি না, তা নির্ভর করে সেতু, কালভার্ট ও নিষ্কাশন '
                + 'নকশার উপর।',
            },
            {
              meta: 'জনগোষ্ঠী',
              title: 'অ্যালাইনমেন্ট বরাবর মানুষ',
              body:
                'ভূমি অধিগ্রহণ করা হয়েছে এবং পরিবারগুলি ক্ষতিগ্রস্ত হয়েছে। কাকে কত দেওয়া হয়েছে এবং '
                + 'কী পুনর্বাসন সহায়তা দেওয়া হয়েছে, তা তথ্য প্রকাশ অংশে প্রকাশিত হয়।',
            },
            {
              meta: 'কর্মীবাহিনী',
              title: 'যাঁরা নির্মাণ করেন তাঁদের নিরাপত্তা',
              body:
                'নির্মাণ নিরাপত্তা, কাজের পরিবেশ ও ঠিকাদারি মানদণ্ড কেবল সরাসরি কর্মচারীদের নয়, '
                + 'কর্মস্থলের সকলের জন্য প্রযোজ্য।',
            },
          ],
        },
        zh: {
          heading: '本走廊的可持续发展内涵',
          intro: '除修建道路之外，快速路特许经营方还需履行义务的三个方面。',
          items: [
            {
              meta: '环境',
              title: '水、空气与土地',
              body:
                '走廊穿越农田赖以灌溉排水的水系。'
                + '桥梁、涵洞与排水设计决定了道路建成后这些系统能否继续正常运转。',
            },
            {
              meta: '社区',
              title: '沿线居民',
              body:
                '项目征用了土地，也影响了部分家庭。补偿金额、补偿对象及后续安置措施，'
                + '均在“信息公开”栏目发布。',
            },
            {
              meta: '劳动者',
              title: '建设者的安全',
              body: '施工安全、劳动条件与承包商标准适用于所有现场人员，而不仅限于直接雇员。',
            },
          ],
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Environmental and social assessment',
          body:
            pending('en',
              'The environmental and social impact assessment for this project, the environmental '
              + 'management plan, and any monitoring reports have not yet been released for '
              + 'publication. Projects of this scale in Bangladesh are ordinarily assessed before '
              + 'approval, and this page is where DBEDC will publish those documents.'),
        },
        bn: {
          heading: 'পরিবেশগত ও সামাজিক মূল্যায়ন',
          body:
            pending('bn',
              'এই প্রকল্পের পরিবেশগত ও সামাজিক প্রভাব মূল্যায়ন, পরিবেশ ব্যবস্থাপনা পরিকল্পনা এবং '
              + 'পর্যবেক্ষণ প্রতিবেদনগুলি এখনও প্রকাশের জন্য অবমুক্ত করা হয়নি। বাংলাদেশে এই মাপের '
              + 'প্রকল্প সাধারণত অনুমোদনের আগে মূল্যায়িত হয়, এবং DBEDC সেই নথিগুলি এই পাতাতেই প্রকাশ '
              + 'করবে।'),
        },
        zh: {
          heading: '环境与社会影响评估',
          body:
            pending('zh',
              '本项目的环境与社会影响评估、环境管理计划及各期监测报告尚未获准公布。'
              + '在孟加拉国，此等规模的项目通常须在批准前完成评估，'
              + 'DBEDC 将在本页公开上述文件。'),
        },
      },
    },
    {
      type: 'cta-band',
      data: {
        en: {
          heading: 'Land acquisition and resettlement',
          body: 'What was acquired, and what was paid, is published separately.',
          primaryLabel: 'Land acquisition and resettlement',
          primaryHref: 'disclosures/land-acquisition',
          secondaryLabel: 'Raise a concern',
          secondaryHref: 'grievances',
        },
        bn: {
          heading: 'ভূমি অধিগ্রহণ ও পুনর্বাসন',
          body: 'কী অধিগ্রহণ করা হয়েছে এবং কত দেওয়া হয়েছে, তা আলাদাভাবে প্রকাশ করা হয়।',
          primaryLabel: 'ভূমি অধিগ্রহণ ও পুনর্বাসন',
          primaryHref: 'disclosures/land-acquisition',
          secondaryLabel: 'অভিযোগ জানান',
          secondaryHref: 'grievances',
        },
        zh: {
          heading: '征地与安置',
          body: '征用范围与补偿金额另行公布。',
          primaryLabel: '征地与安置',
          primaryHref: 'disclosures/land-acquisition',
          secondaryLabel: '反映问题',
          secondaryHref: 'grievances',
        },
      },
    },
  ],
};

// ===========================================================================
const PROCUREMENT = {
  slug: 'procurement',
  meta: {
    en: {
      title: 'Procurement and tenders',
      description:
        'Open tenders, how DBEDC awards contracts, and how to register as a supplier.',
    },
    bn: {
      title: 'ক্রয় ও দরপত্র',
      description:
        'চলমান দরপত্র, DBEDC কীভাবে চুক্তি প্রদান করে এবং সরবরাহকারী হিসেবে নিবন্ধনের উপায়।',
    },
    zh: {
      title: '采购与招标',
      description: '现行招标公告、DBEDC 的合同授予方式，以及供应商登记办法。',
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'Procurement',
          headline: 'Tenders and suppliers',
          standfirst:
            'Contracts on this corridor are awarded competitively. Notices are published here.',
        },
        bn: {
          eyebrow: 'ক্রয়',
          headline: 'দরপত্র ও সরবরাহকারী',
          standfirst:
            'এই করিডোরের চুক্তিগুলি প্রতিযোগিতামূলকভাবে প্রদান করা হয়। বিজ্ঞপ্তি এখানে প্রকাশিত হয়।',
        },
        zh: {
          eyebrow: '采购',
          headline: '招标与供应商',
          standfirst: '本走廊的各项合同均通过竞争性方式授予，公告在此发布。',
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Open tenders',
          body:
            pending('en',
              'There are no open tender notices published at this time. When DBEDC issues one, it '
              + 'will appear here with its reference number, scope, the deadline for submissions, '
              + 'and where to obtain the documents. Notices are removed only after the deadline '
              + 'has passed, and past notices stay listed so that the award record is traceable.'),
        },
        bn: {
          heading: 'চলমান দরপত্র',
          body:
            pending('bn',
              'এই মুহূর্তে কোনও দরপত্র বিজ্ঞপ্তি প্রকাশিত নেই। DBEDC কোনও দরপত্র আহ্বান করলে তা '
              + 'রেফারেন্স নম্বর, কাজের পরিধি, দাখিলের শেষ তারিখ এবং নথি সংগ্রহের ঠিকানাসহ এখানে '
              + 'প্রকাশিত হবে। শেষ তারিখ পার হওয়ার পরেই কেবল বিজ্ঞপ্তি সরানো হয়, এবং পুরনো বিজ্ঞপ্তিগুলি '
              + 'তালিকাভুক্ত থাকে যাতে চুক্তি প্রদানের নথি অনুসরণযোগ্য থাকে।'),
        },
        zh: {
          heading: '现行招标',
          body:
            pending('zh',
              '目前没有正在发布的招标公告。DBEDC 发布招标时，将在此列出编号、工作范围、'
              + '投标截止日期及文件获取方式。公告仅在截止日期之后撤下，'
              + '既往公告将继续保留，以便合同授予情况可追溯。'),
        },
      },
    },
    {
      type: 'card-grid',
      data: {
        en: {
          heading: 'How contracts are awarded',
          items: [
            {
              meta: 'Open',
              title: 'Notices are public',
              body:
                'Tender notices are published on this page rather than circulated privately, so '
                + 'that any qualified supplier can see them.',
            },
            {
              meta: 'Fair',
              title: 'Evaluated against stated criteria',
              body:
                'Every notice states what will be evaluated and how, before bids are received. '
                + 'The criteria do not change after submission.',
            },
            {
              meta: 'Accountable',
              title: 'Complaints about a process',
              body:
                'A supplier who believes a process was not run properly can raise it through the '
                + 'grievance route, in writing, and receive an answer.',
            },
          ],
        },
        bn: {
          heading: 'চুক্তি কীভাবে প্রদান করা হয়',
          items: [
            {
              meta: 'উন্মুক্ত',
              title: 'বিজ্ঞপ্তি প্রকাশ্য',
              body:
                'দরপত্র বিজ্ঞপ্তি ব্যক্তিগতভাবে না পাঠিয়ে এই পাতায় প্রকাশ করা হয়, যাতে যেকোনও যোগ্য '
                + 'সরবরাহকারী তা দেখতে পান।',
            },
            {
              meta: 'ন্যায্য',
              title: 'ঘোষিত মানদণ্ডে মূল্যায়ন',
              body:
                'দরপত্র জমা নেওয়ার আগেই প্রতিটি বিজ্ঞপ্তিতে বলা থাকে কী এবং কীভাবে মূল্যায়ন করা হবে। '
                + 'জমা দেওয়ার পর মানদণ্ড বদলায় না।',
            },
            {
              meta: 'জবাবদিহি',
              title: 'প্রক্রিয়া নিয়ে অভিযোগ',
              body:
                'কোনও সরবরাহকারী যদি মনে করেন প্রক্রিয়াটি যথাযথভাবে পরিচালিত হয়নি, তিনি অভিযোগ '
                + 'ব্যবস্থার মাধ্যমে লিখিতভাবে তা জানাতে এবং জবাব পেতে পারেন।',
            },
          ],
        },
        zh: {
          heading: '合同授予方式',
          items: [
            {
              meta: '公开',
              title: '公告对外发布',
              body: '招标公告在本页公开发布，而非私下传阅，以便所有合格供应商都能获知。',
            },
            {
              meta: '公平',
              title: '按既定标准评审',
              body: '每则公告在收标前即载明评审内容与方法。标准在投标后不再更改。',
            },
            {
              meta: '问责',
              title: '对流程的申诉',
              body: '供应商如认为流程存在不当，可通过投诉渠道书面提出，并获得答复。',
            },
          ],
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Registering as a supplier',
          body:
            pending('en',
              'The supplier registration process and the address for tender enquiries have not '
              + 'yet been confirmed by DBEDC. Until they are, use the general contact route and '
              + 'your enquiry will be directed.'),
        },
        bn: {
          heading: 'সরবরাহকারী হিসেবে নিবন্ধন',
          body:
            pending('bn',
              'সরবরাহকারী নিবন্ধনের প্রক্রিয়া এবং দরপত্র সংক্রান্ত জিজ্ঞাসার ঠিকানা DBEDC এখনও নিশ্চিত '
              + 'করেনি। সেগুলি না আসা পর্যন্ত সাধারণ যোগাযোগের মাধ্যমটি ব্যবহার করুন, আপনার জিজ্ঞাসা '
              + 'যথাস্থানে পাঠানো হবে।'),
        },
        zh: {
          heading: '供应商登记',
          body:
            pending('zh',
              '供应商登记流程及招标咨询地址，DBEDC 尚未确认。'
              + '在此之前，请通过一般联系方式提交咨询，我们会转交相关部门。'),
        },
      },
    },
  ],
};

// ===========================================================================
const DISCLOSURES = {
  slug: 'disclosures',
  meta: {
    en: {
      title: 'Disclosures',
      description:
        'Documents DBEDC publishes: tariff notifications, land acquisition and resettlement '
        + 'information, governance and tenders.',
    },
    bn: {
      title: 'তথ্য প্রকাশ',
      description:
        'DBEDC যেসব নথি প্রকাশ করে: টোল বিজ্ঞপ্তি, ভূমি অধিগ্রহণ ও পুনর্বাসন সংক্রান্ত তথ্য, '
        + 'পরিচালনা কাঠামো ও দরপত্র।',
    },
    zh: {
      title: '信息公开',
      description:
        'DBEDC 公开的各类文件：通行费公告、征地与安置信息、治理架构及招标公告。',
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'Disclosures',
          headline: 'Documents in public',
          standfirst:
            'A toll road runs on a public asset and charges the public to use it. The documents '
            + 'that govern how belong where anyone can read them.',
        },
        bn: {
          eyebrow: 'তথ্য প্রকাশ',
          headline: 'নথি প্রকাশ্যে',
          standfirst:
            'টোল সড়ক চলে সরকারি সম্পদের উপর এবং ব্যবহারের জন্য জনসাধারণের কাছ থেকে অর্থ নেয়। এটি '
            + 'কীভাবে পরিচালিত হয় সেই নথিগুলি এমন জায়গায় থাকা উচিত যেখানে যে কেউ পড়তে পারেন।',
        },
        zh: {
          eyebrow: '信息公开',
          headline: '文件主动公开',
          standfirst:
            '收费公路运营于公共资产之上，并向公众收费。'
            + '规范其运营的各项文件，理应放在任何人都能查阅的地方。',
        },
      },
    },
    {
      type: 'card-grid',
      data: {
        en: {
          heading: 'What is published here',
          items: [
            {
              meta: 'Tolls',
              title: 'Tariff notifications',
              body:
                'The orders that set and change toll rates, with the rates currently in force and '
                + 'the date each took effect.',
            },
            {
              meta: 'Land',
              title: 'Land acquisition and resettlement',
              body:
                'What was acquired for the corridor, how compensation was assessed, and what '
                + 'support followed for affected households.',
            },
            {
              meta: 'Contracts',
              title: 'Procurement and tenders',
              body: 'Open tender notices, the award process, and past notices kept on the record.',
            },
            {
              meta: 'Company',
              title: 'Governance',
              body:
                'The concession structure, who supervises it, and the company\'s directors and '
                + 'senior officers.',
            },
          ],
        },
        bn: {
          heading: 'এখানে যা প্রকাশ করা হয়',
          items: [
            {
              meta: 'টোল',
              title: 'টোল বিজ্ঞপ্তি',
              body:
                'যেসব আদেশে টোলের হার নির্ধারণ ও পরিবর্তন হয়, বর্তমানে কার্যকর হার এবং প্রতিটি কার্যকর '
                + 'হওয়ার তারিখসহ।',
            },
            {
              meta: 'ভূমি',
              title: 'ভূমি অধিগ্রহণ ও পুনর্বাসন',
              body:
                'করিডোরের জন্য কী অধিগ্রহণ করা হয়েছে, ক্ষতিপূরণ কীভাবে নির্ধারিত হয়েছে এবং ক্ষতিগ্রস্ত '
                + 'পরিবারগুলির জন্য কী সহায়তা দেওয়া হয়েছে।',
            },
            {
              meta: 'চুক্তি',
              title: 'ক্রয় ও দরপত্র',
              body: 'চলমান দরপত্র বিজ্ঞপ্তি, চুক্তি প্রদানের প্রক্রিয়া এবং নথিভুক্ত পুরনো বিজ্ঞপ্তি।',
            },
            {
              meta: 'কোম্পানি',
              title: 'পরিচালনা কাঠামো',
              body:
                'কনসেশনের কাঠামো, কারা তদারক করে, এবং কোম্পানির পরিচালক ও ঊর্ধ্বতন কর্মকর্তারা।',
            },
          ],
        },
        zh: {
          heading: '本栏目公开的内容',
          items: [
            {
              meta: '通行费',
              title: '通行费公告',
              body: '设定与调整通行费标准的各项批文，含现行费率及各自生效日期。',
            },
            {
              meta: '土地',
              title: '征地与安置',
              body: '为建设走廊征用了哪些土地、补偿如何核定，以及为受影响家庭提供了哪些后续支持。',
            },
            {
              meta: '合同',
              title: '采购与招标',
              body: '现行招标公告、合同授予流程，以及存档备查的既往公告。',
            },
            {
              meta: '公司',
              title: '治理架构',
              body: '特许经营结构、监督主体，以及公司董事与高级管理人员。',
            },
          ],
        },
      },
    },
    {
      type: 'cta-band',
      data: {
        en: {
          heading: 'Something missing?',
          body:
            'If a document you expect to find is not here, ask for it — and tell us if you think '
            + 'it should be published.',
          primaryLabel: 'Raise a request or complaint',
          primaryHref: 'grievances',
          secondaryLabel: 'Contact DBEDC',
          secondaryHref: 'contact',
        },
        bn: {
          heading: 'কিছু খুঁজে পাচ্ছেন না?',
          body:
            'আপনি যে নথিটি প্রত্যাশা করছেন তা এখানে না থাকলে চেয়ে নিন — এবং সেটি প্রকাশ করা উচিত '
            + 'মনে করলে আমাদের জানান।',
          primaryLabel: 'অনুরোধ বা অভিযোগ জানান',
          primaryHref: 'grievances',
          secondaryLabel: 'DBEDC-এর সঙ্গে যোগাযোগ',
          secondaryHref: 'contact',
        },
        zh: {
          heading: '没有找到所需文件？',
          body: '如果您期望查到的文件不在此处，欢迎索取；若您认为该文件应予公开，也请告知我们。',
          primaryLabel: '提出请求或投诉',
          primaryHref: 'grievances',
          secondaryLabel: '联系 DBEDC',
          secondaryHref: 'contact',
        },
      },
    },
  ],
};

// ===========================================================================
const LAND_ACQUISITION = {
  slug: 'disclosures/land-acquisition',
  meta: {
    en: {
      title: 'Land acquisition and resettlement',
      description:
        'What was acquired for the Dhaka Bypass Expressway corridor, how compensation was '
        + 'assessed, and what support followed.',
    },
    bn: {
      title: 'ভূমি অধিগ্রহণ ও পুনর্বাসন',
      description:
        'Dhaka Bypass Expressway করিডোরের জন্য কী অধিগ্রহণ করা হয়েছে, ক্ষতিপূরণ কীভাবে নির্ধারিত '
        + 'হয়েছে এবং কী সহায়তা দেওয়া হয়েছে।',
    },
    zh: {
      title: '征地与安置',
      description:
        'Dhaka Bypass Expressway 走廊征用了哪些土地、补偿如何核定，以及提供了哪些后续支持。',
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'Disclosures',
          headline: 'Land acquisition and resettlement',
          standfirst:
            'A road of this length is built on land that belonged to somebody. This page is where '
            + 'that is accounted for.',
        },
        bn: {
          eyebrow: 'তথ্য প্রকাশ',
          headline: 'ভূমি অধিগ্রহণ ও পুনর্বাসন',
          standfirst:
            'এই দৈর্ঘ্যের একটি সড়ক এমন জমির উপর তৈরি হয় যা কারও না কারও ছিল। এই পাতাতেই তার হিসাব '
            + 'দেওয়া হয়।',
        },
        zh: {
          eyebrow: '信息公开',
          headline: '征地与安置',
          standfirst: '这样长度的道路，修建在原本属于他人的土地上。本页即为此作出交代。',
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Why this is published',
          body:
            '<p>Land acquisition is the part of a road project that falls hardest on the fewest '
            + 'people. A household that gave up land for this corridor is entitled to know how '
            + 'its compensation was calculated, on what authority, and what to do if it believes '
            + 'the calculation was wrong — without having to ask.</p>'
            + '<p>That is why this sits in public alongside the toll rates rather than in a file '
            + 'available on request.</p>',
        },
        bn: {
          heading: 'কেন এটি প্রকাশ করা হয়',
          body:
            '<p>ভূমি অধিগ্রহণ সড়ক প্রকল্পের সেই অংশ যা সবচেয়ে কম মানুষের উপর সবচেয়ে ভারী বোঝা '
            + 'চাপায়। এই করিডোরের জন্য যে পরিবার জমি ছেড়েছে, তার জানার অধিকার আছে — ক্ষতিপূরণ '
            + 'কীভাবে হিসাব করা হয়েছে, কোন কর্তৃত্বে, এবং হিসাবটি ভুল মনে হলে কী করণীয় — কিছু '
            + 'জিজ্ঞাসা না করেই।</p>'
            + '<p>এ কারণেই এটি চাহিদার ভিত্তিতে দেওয়া কোনও ফাইলে নয়, টোলের হারের পাশেই প্রকাশ্যে '
            + 'রাখা হয়েছে।</p>',
        },
        zh: {
          heading: '为何公开这些信息',
          body:
            '<p>征地是道路项目中影响人数最少、但对当事人冲击最重的环节。'
            + '为本走廊让出土地的家庭，有权在无需申请的情况下知晓：'
            + '补偿是如何核算的、依据何种权限，以及若认为核算有误应如何处理。</p>'
            + '<p>正因如此，这些内容与通行费标准一并公开，而非存放于需申请调阅的档案中。</p>',
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Acquisition and compensation record',
          body:
            pending('en',
              'The land acquisition record for this corridor — the area acquired, the affected '
              + 'mouzas, the basis on which compensation was assessed, the number of affected '
              + 'households, and the resettlement assistance provided — has not been supplied to '
              + 'us for publication. None of it is being estimated or approximated here: an '
              + 'invented figure on this page in particular would be read as an official statement '
              + 'by people whose claims depend on it.'),
        },
        bn: {
          heading: 'অধিগ্রহণ ও ক্ষতিপূরণের নথি',
          body:
            pending('bn',
              'এই করিডোরের ভূমি অধিগ্রহণের নথি — অধিগৃহীত জমির পরিমাণ, ক্ষতিগ্রস্ত মৌজা, ক্ষতিপূরণ '
              + 'নির্ধারণের ভিত্তি, ক্ষতিগ্রস্ত পরিবারের সংখ্যা এবং প্রদত্ত পুনর্বাসন সহায়তা — প্রকাশের '
              + 'জন্য আমাদের দেওয়া হয়নি। এখানে কোনও কিছুই অনুমান করে বসানো হচ্ছে না: বিশেষ করে এই '
              + 'পাতায় বানানো কোনও সংখ্যা সেই মানুষগুলির কাছে সরকারি বক্তব্য বলে গণ্য হবে যাঁদের দাবি '
              + 'এর উপর নির্ভর করে।'),
        },
        zh: {
          heading: '征地与补偿记录',
          body:
            pending('zh',
              '本走廊的征地记录——征用面积、受影响的行政村、补偿核定依据、受影响家庭数量'
              + '以及所提供的安置援助——尚未提供给我们发布。'
              + '此处不作任何估算或近似：在这一页面上虚构的数字，'
              + '会被那些以此主张权利的人视为官方表述。'),
        },
      },
    },
    {
      type: 'cta-band',
      data: {
        en: {
          heading: 'If your land or property was affected',
          body:
            'You can raise a claim or a complaint in writing, and receive an answer. Do this even '
            + 'if the record above is not yet published.',
          primaryLabel: 'Grievance redressal',
          primaryHref: 'grievances',
          secondaryLabel: 'Contact DBEDC',
          secondaryHref: 'contact',
        },
        bn: {
          heading: 'আপনার জমি বা সম্পত্তি ক্ষতিগ্রস্ত হলে',
          body:
            'আপনি লিখিতভাবে দাবি বা অভিযোগ জানাতে এবং জবাব পেতে পারেন। উপরের নথি প্রকাশিত না হলেও '
            + 'এটি করুন।',
          primaryLabel: 'অভিযোগ নিষ্পত্তি',
          primaryHref: 'grievances',
          secondaryLabel: 'DBEDC-এর সঙ্গে যোগাযোগ',
          secondaryHref: 'contact',
        },
        zh: {
          heading: '如果您的土地或房产受到影响',
          body: '您可以书面提出主张或投诉并获得答复。即使上述记录尚未公布，也请照此办理。',
          primaryLabel: '投诉处理',
          primaryHref: 'grievances',
          secondaryLabel: '联系 DBEDC',
          secondaryHref: 'contact',
        },
      },
    },
  ],
};

// ===========================================================================
const TARIFF = {
  slug: 'disclosures/tariff',
  meta: {
    en: {
      title: 'Tariff notifications',
      description:
        'How tolls on the Dhaka Bypass Expressway are set and changed, and the notifications that '
        + 'put each rate into force.',
    },
    bn: {
      title: 'টোল বিজ্ঞপ্তি',
      description:
        'Dhaka Bypass Expressway-তে টোল কীভাবে নির্ধারিত ও পরিবর্তিত হয়, এবং যেসব বিজ্ঞপ্তির মাধ্যমে '
        + 'প্রতিটি হার কার্যকর হয়।',
    },
    zh: {
      title: '通行费公告',
      description:
        'Dhaka Bypass Expressway 通行费的制定与调整方式，以及使各项费率生效的批文公告。',
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'Disclosures',
          headline: 'Tariff notifications',
          standfirst:
            'Every rate charged on this expressway comes from a notification. This page is where '
            + 'those notifications are published.',
          primaryLabel: 'Current toll rates',
          primaryHref: 'travel/toll',
        },
        bn: {
          eyebrow: 'তথ্য প্রকাশ',
          headline: 'টোল বিজ্ঞপ্তি',
          standfirst:
            'এই এক্সপ্রেসওয়েতে আদায় করা প্রতিটি হার আসে একটি বিজ্ঞপ্তি থেকে। সেই বিজ্ঞপ্তিগুলি এই '
            + 'পাতায় প্রকাশ করা হয়।',
          primaryLabel: 'বর্তমান টোল হার',
          primaryHref: 'travel/toll',
        },
        zh: {
          eyebrow: '信息公开',
          headline: '通行费公告',
          standfirst: '本快速路收取的每一项费率均源自一份公告，这些公告在本页发布。',
          primaryLabel: '现行通行费',
          primaryHref: 'travel/toll',
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'How tolls are set',
          body:
            '<p>Toll rates on a PPP expressway are not set by the operator alone. The concession '
            + 'agreement fixes how rates are determined, the contracting authority approves them, '
            + 'and a notification brings each rate into force from a stated date.</p>'
            + '<p>The rates currently in force for the open section are published in full on the '
            + 'toll page, by vehicle class. No rate is charged on this expressway that does not '
            + 'appear there.</p>',
        },
        bn: {
          heading: 'টোল কীভাবে নির্ধারিত হয়',
          body:
            '<p>পিপিপি এক্সপ্রেসওয়ের টোলের হার কেবল পরিচালনাকারী প্রতিষ্ঠান নির্ধারণ করে না। '
            + 'কনসেশন চুক্তি ঠিক করে দেয় হার কীভাবে নির্ধারিত হবে, চুক্তিকারী কর্তৃপক্ষ তা অনুমোদন করে, '
            + 'এবং একটি বিজ্ঞপ্তির মাধ্যমে নির্দিষ্ট তারিখ থেকে প্রতিটি হার কার্যকর হয়।</p>'
            + '<p>খোলা অংশের জন্য বর্তমানে কার্যকর হারগুলি যানবাহনের শ্রেণি অনুযায়ী টোল পাতায় '
            + 'সম্পূর্ণ প্রকাশ করা আছে। সেখানে নেই এমন কোনও হার এই এক্সপ্রেসওয়েতে আদায় করা হয় না।</p>',
        },
        zh: {
          heading: '通行费如何确定',
          body:
            '<p>PPP 模式快速路的通行费并非由运营方单方面决定。'
            + '特许经营协议规定费率的确定方式，签约机构予以核准，'
            + '并由公告确定各项费率自何日起施行。</p>'
            + '<p>已通车路段的现行费率按车型在通行费页面全文公布。'
            + '凡未在该页列明的费率，本快速路一律不予收取。</p>',
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'Notifications on the record',
          body:
            pending('en',
              'The notification that put the current rates into force — its reference, its date, '
              + 'and the authority that issued it — has not been supplied for publication. The '
              + 'rates themselves are confirmed and published on the toll page; what is missing is '
              + 'the paperwork behind them. Past notifications will be listed here as well, so '
              + 'that a change in rates can be traced rather than merely noticed.'),
        },
        bn: {
          heading: 'নথিভুক্ত বিজ্ঞপ্তি',
          body:
            pending('bn',
              'বর্তমান হারগুলি যে বিজ্ঞপ্তির মাধ্যমে কার্যকর হয়েছে — তার রেফারেন্স, তারিখ এবং জারিকারী '
              + 'কর্তৃপক্ষ — প্রকাশের জন্য সরবরাহ করা হয়নি। হারগুলি নিজেই নিশ্চিত এবং টোল পাতায় '
              + 'প্রকাশিত; যা নেই তা হলো সেগুলির পিছনের কাগজপত্র। পুরনো বিজ্ঞপ্তিগুলিও এখানে তালিকাভুক্ত '
              + 'হবে, যাতে হারের পরিবর্তন কেবল চোখে পড়াই নয়, অনুসরণও করা যায়।'),
        },
        zh: {
          heading: '存档公告',
          body:
            pending('zh',
              '使现行费率生效的公告——其文号、日期及发布机构——尚未提供发布。'
              + '费率本身已经确认并在通行费页面公布，欠缺的是其背后的批文。'
              + '既往公告也将在此列出，使费率变动不仅能被察觉，更可被追溯。'),
        },
      },
    },
    {
      type: 'cta-band',
      data: {
        en: {
          heading: 'Charged the wrong amount?',
          body:
            'Compare what you paid against the published rate for your vehicle class. If they do '
            + 'not match, tell us.',
          primaryLabel: 'Current toll rates',
          primaryHref: 'travel/toll',
          secondaryLabel: 'Raise a complaint',
          secondaryHref: 'grievances',
        },
        bn: {
          heading: 'ভুল অঙ্ক নেওয়া হয়েছে?',
          body:
            'আপনার যানবাহনের শ্রেণির জন্য প্রকাশিত হারের সঙ্গে আপনি যা দিয়েছেন তা মিলিয়ে দেখুন। না '
            + 'মিললে আমাদের জানান।',
          primaryLabel: 'বর্তমান টোল হার',
          primaryHref: 'travel/toll',
          secondaryLabel: 'অভিযোগ জানান',
          secondaryHref: 'grievances',
        },
        zh: {
          heading: '收费金额有误？',
          body: '请将实付金额与本车型的公布费率核对。如不相符，请告知我们。',
          primaryLabel: '现行通行费',
          primaryHref: 'travel/toll',
          secondaryLabel: '提出投诉',
          secondaryHref: 'grievances',
        },
      },
    },
  ],
};

// ===========================================================================
const GRIEVANCES = {
  slug: 'grievances',
  meta: {
    en: {
      title: 'Grievance redressal',
      description:
        'How to raise a complaint about the Dhaka Bypass Expressway — tolling, the road, conduct '
        + 'at a plaza, land acquisition or a tender — and what happens next.',
    },
    bn: {
      title: 'অভিযোগ নিষ্পত্তি',
      description:
        'Dhaka Bypass Expressway সম্পর্কে অভিযোগ জানানোর উপায় — টোল, সড়ক, প্লাজায় আচরণ, ভূমি '
        + 'অধিগ্রহণ বা দরপত্র — এবং তারপর কী হয়।',
    },
    zh: {
      title: '投诉处理',
      description:
        '如何就 Dhaka Bypass Expressway 提出投诉——涉及收费、路况、收费站服务、征地或招标'
        + '——以及后续处理流程。',
    },
  },
  blocks: [
    {
      type: 'hero',
      data: {
        en: {
          eyebrow: 'Grievances',
          headline: 'Raising a complaint',
          standfirst:
            'Anyone can raise a grievance about this expressway — a road user, a neighbour, an '
            + 'affected landowner, a supplier. You do not need a reference number, an account, or '
            + 'a reason to be entitled to an answer.',
        },
        bn: {
          eyebrow: 'অভিযোগ',
          headline: 'অভিযোগ জানানো',
          standfirst:
            'এই এক্সপ্রেসওয়ে সম্পর্কে যে কেউ অভিযোগ জানাতে পারেন — সড়ক ব্যবহারকারী, প্রতিবেশী, '
            + 'ক্ষতিগ্রস্ত জমির মালিক, সরবরাহকারী। জবাব পাওয়ার অধিকারের জন্য আপনার কোনও রেফারেন্স '
            + 'নম্বর, অ্যাকাউন্ট বা কারণ দেখানোর প্রয়োজন নেই।',
        },
        zh: {
          eyebrow: '投诉',
          headline: '提出投诉',
          standfirst:
            '任何人都可以就本快速路提出投诉——道路使用者、周边居民、受影响的土地权利人、供应商。'
            + '您无需编号、无需账户，也无需给出理由，即有权获得答复。',
        },
      },
    },
    {
      type: 'card-grid',
      data: {
        en: {
          heading: 'What you can raise',
          items: [
            {
              meta: 'Tolling',
              title: 'Charges and conduct at a plaza',
              body:
                'Being charged an amount that does not match the published rate, a receipt '
                + 'refused, or the conduct of staff at a toll plaza.',
            },
            {
              meta: 'The road',
              title: 'Surface, lighting, signage, drainage',
              body:
                'Anything about the condition of the expressway that affects safety or the '
                + 'usability of the road.',
            },
            {
              meta: 'Land',
              title: 'Acquisition and compensation',
              body:
                'A claim about land or property acquired for the corridor, compensation assessed, '
                + 'or resettlement support.',
            },
            {
              meta: 'Construction',
              title: 'Noise, dust, access and damage',
              body:
                'The effect of construction work on a neighbouring property, an access route or a '
                + 'watercourse.',
            },
            {
              meta: 'Procurement',
              title: 'A tender process',
              body: 'A supplier\'s complaint about how a tender was run or awarded.',
            },
            {
              meta: 'This site',
              title: 'Information that is wrong or missing',
              body:
                'A figure on this site that you believe to be incorrect, or a document you expect '
                + 'to find published and cannot.',
            },
          ],
        },
        bn: {
          heading: 'যা নিয়ে অভিযোগ করা যায়',
          items: [
            {
              meta: 'টোল',
              title: 'প্লাজায় আদায় ও আচরণ',
              body:
                'প্রকাশিত হারের সঙ্গে না মেলা অঙ্ক আদায়, রসিদ দিতে অস্বীকার, কিংবা টোল প্লাজায় '
                + 'কর্মীদের আচরণ।',
            },
            {
              meta: 'সড়ক',
              title: 'পৃষ্ঠ, আলো, সাইনবোর্ড, নিষ্কাশন',
              body:
                'এক্সপ্রেসওয়ের অবস্থা সংক্রান্ত যেকোনও বিষয় যা নিরাপত্তা বা সড়কের ব্যবহারযোগ্যতাকে '
                + 'প্রভাবিত করে।',
            },
            {
              meta: 'ভূমি',
              title: 'অধিগ্রহণ ও ক্ষতিপূরণ',
              body:
                'করিডোরের জন্য অধিগৃহীত জমি বা সম্পত্তি, নির্ধারিত ক্ষতিপূরণ, কিংবা পুনর্বাসন সহায়তা '
                + 'সংক্রান্ত দাবি।',
            },
            {
              meta: 'নির্মাণ',
              title: 'শব্দ, ধুলা, চলাচল ও ক্ষতি',
              body:
                'পার্শ্ববর্তী সম্পত্তি, চলাচলের পথ বা জলপ্রবাহের উপর নির্মাণকাজের প্রভাব।',
            },
            {
              meta: 'ক্রয়',
              title: 'দরপত্র প্রক্রিয়া',
              body: 'দরপত্র কীভাবে পরিচালিত বা প্রদান করা হয়েছে সে সম্পর্কে সরবরাহকারীর অভিযোগ।',
            },
            {
              meta: 'এই সাইট',
              title: 'ভুল বা অনুপস্থিত তথ্য',
              body:
                'এই সাইটের কোনও তথ্য আপনার ভুল মনে হলে, কিংবা প্রকাশিত থাকার কথা এমন কোনও নথি '
                + 'খুঁজে না পেলে।',
            },
          ],
        },
        zh: {
          heading: '可以投诉的事项',
          items: [
            {
              meta: '收费',
              title: '收费站的收费与服务',
              body: '收取金额与公布费率不符、拒开票据，或收费站工作人员的服务态度。',
            },
            {
              meta: '道路',
              title: '路面、照明、标志、排水',
              body: '任何影响行车安全或道路正常使用的快速路状况问题。',
            },
            {
              meta: '土地',
              title: '征用与补偿',
              body: '关于为本走廊征用的土地或房产、核定补偿或安置支持的主张。',
            },
            {
              meta: '施工',
              title: '噪声、扬尘、通行与损害',
              body: '施工作业对相邻房产、通行道路或水道造成的影响。',
            },
            {
              meta: '采购',
              title: '招标流程',
              body: '供应商就招标的组织或授予方式提出的投诉。',
            },
            {
              meta: '本网站',
              title: '信息有误或缺失',
              body: '您认为本网站某项数据有误，或应当公开却查不到的文件。',
            },
          ],
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'What to include',
          body:
            '<p>A grievance is easier to resolve when it carries the facts that let someone check '
            + 'it. Where you can, include:</p>'
            + '<ul>'
            + '<li>the date and approximate time</li>'
            + '<li>where on the corridor — the toll plaza name, the interchange, or the chainage '
            + 'marker if you noted one</li>'
            + '<li>your vehicle class, and the amount charged, for a tolling complaint</li>'
            + '<li>any receipt, photograph or reference number you hold</li>'
            + '<li>how you would like to be contacted with the answer</li>'
            + '</ul>'
            + '<p>None of these is a condition of being answered. A complaint with no reference '
            + 'number is still a complaint.</p>',
        },
        bn: {
          heading: 'যা যা দেবেন',
          body:
            '<p>অভিযোগের সঙ্গে যাচাই করার মতো তথ্য থাকলে তা নিষ্পত্তি করা সহজ হয়। সম্ভব হলে দিন:</p>'
            + '<ul>'
            + '<li>তারিখ ও আনুমানিক সময়</li>'
            + '<li>করিডোরের কোন জায়গায় — টোল প্লাজার নাম, ইন্টারচেঞ্জ, কিংবা চেইনেজ চিহ্ন যদি খেয়াল '
            + 'করে থাকেন</li>'
            + '<li>টোল সংক্রান্ত অভিযোগের ক্ষেত্রে আপনার যানবাহনের শ্রেণি ও আদায়কৃত অঙ্ক</li>'
            + '<li>আপনার কাছে থাকা রসিদ, ছবি বা রেফারেন্স নম্বর</li>'
            + '<li>জবাব পাওয়ার জন্য আপনি কীভাবে যোগাযোগ চান</li>'
            + '</ul>'
            + '<p>জবাব পাওয়ার জন্য এগুলির কোনওটিই শর্ত নয়। রেফারেন্স নম্বর ছাড়া অভিযোগও অভিযোগ।</p>',
        },
        zh: {
          heading: '请提供的信息',
          body:
            '<p>投诉若附有可供核查的事实，处理起来会更顺畅。如条件允许，请一并提供：</p>'
            + '<ul>'
            + '<li>日期与大致时间</li>'
            + '<li>走廊上的具体位置——收费站名称、互通立交，或您记下的桩号</li>'
            + '<li>如为收费投诉，请注明车型与实收金额</li>'
            + '<li>您持有的票据、照片或编号</li>'
            + '<li>您希望通过何种方式接收答复</li>'
            + '</ul>'
            + '<p>以上均非获得答复的前提条件。没有编号的投诉，同样是投诉。</p>',
        },
      },
    },
    {
      type: 'rich-text',
      data: {
        en: {
          heading: 'How to reach us, and what happens next',
          body:
            pending('en',
              'The grievance channels — a telephone number, an email address, a postal address and '
              + 'the officer responsible — have not yet been confirmed by DBEDC, and neither have '
              + 'the timescales for acknowledgement and response or the route of escalation if you '
              + 'are not satisfied. A grievance page that promises a response time nobody has '
              + 'agreed to would be worse than one that admits the gap. Until these are confirmed, '
              + 'use the general contact route.'),
        },
        bn: {
          heading: 'কীভাবে আমাদের কাছে পৌঁছাবেন, এবং তারপর কী হয়',
          body:
            pending('bn',
              'অভিযোগ জানানোর মাধ্যমগুলি — টেলিফোন নম্বর, ইমেইল ঠিকানা, ডাক ঠিকানা এবং দায়িত্বপ্রাপ্ত '
              + 'কর্মকর্তা — DBEDC এখনও নিশ্চিত করেনি, এবং প্রাপ্তিস্বীকার ও জবাবের সময়সীমা কিংবা '
              + 'সন্তুষ্ট না হলে উচ্চতর পর্যায়ে যাওয়ার পথও নিশ্চিত হয়নি। কেউ সম্মত হয়নি এমন জবাবের '
              + 'সময়সীমার প্রতিশ্রুতি দেওয়া অভিযোগ পাতা, ঘাটতি স্বীকার করা পাতার চেয়েও খারাপ হতো। '
              + 'এগুলি নিশ্চিত না হওয়া পর্যন্ত সাধারণ যোগাযোগের মাধ্যমটি ব্যবহার করুন।'),
        },
        zh: {
          heading: '如何联系我们，以及后续流程',
          body:
            pending('zh',
              '投诉渠道——电话号码、电子邮箱、通信地址及负责人员——DBEDC 尚未确认；'
              + '受理与答复的时限，以及不满意时的升级途径，同样尚未确定。'
              + '若在投诉页面承诺一个无人认可的答复时限，反而不如坦承缺口。'
              + '在确认之前，请使用一般联系方式。'),
        },
      },
    },
    {
      type: 'cta-band',
      data: {
        en: {
          heading: 'Contact DBEDC',
          body: 'Until the dedicated grievance channels are published, use the general contact route.',
          primaryLabel: 'Contact',
          primaryHref: 'contact',
          secondaryLabel: 'Disclosures',
          secondaryHref: 'disclosures',
        },
        bn: {
          heading: 'DBEDC-এর সঙ্গে যোগাযোগ',
          body: 'অভিযোগের নির্দিষ্ট মাধ্যম প্রকাশিত না হওয়া পর্যন্ত সাধারণ যোগাযোগের মাধ্যমটি ব্যবহার করুন।',
          primaryLabel: 'যোগাযোগ',
          primaryHref: 'contact',
          secondaryLabel: 'তথ্য প্রকাশ',
          secondaryHref: 'disclosures',
        },
        zh: {
          heading: '联系 DBEDC',
          body: '在专门投诉渠道公布之前，请使用一般联系方式。',
          primaryLabel: '联系我们',
          primaryHref: 'contact',
          secondaryLabel: '信息公开',
          secondaryHref: 'disclosures',
        },
      },
    },
  ],
};

/**
 * Order matters only for the admin's page list and for anything that walks
 * these in sequence; each page is addressed by slug.
 */
export const INSTITUTIONAL_PAGES = [
  ABOUT,
  GOVERNANCE,
  PROJECT,
  SAFETY,
  SUSTAINABILITY,
  PROCUREMENT,
  DISCLOSURES,
  LAND_ACQUISITION,
  TARIFF,
  GRIEVANCES,
];
