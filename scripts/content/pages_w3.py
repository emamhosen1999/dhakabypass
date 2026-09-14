# W3 — corporate & statutory pages. Every block in en, bn, zh.

def header(en, bn, zh):
    return ("page-header", {"en": {"eyebrow": en[0], "heading": en[1], "lede": en[2]},
                            "bn": {"eyebrow": bn[0], "heading": bn[1], "lede": bn[2]},
                            "zh": {"eyebrow": zh[0], "heading": zh[1], "lede": zh[2]}})

def rich(en, bn, zh):
    return ("rich-text", {"en": {"heading": en[0], "body": en[1]}, "bn": {"heading": bn[0], "body": bn[1]}, "zh": {"heading": zh[0], "body": zh[1]}})

def cards(heading, intro, items):
    # heading/intro: {en,bn,zh}; items: list of {en:(meta,title,body),bn:..,zh:..}
    out = {}
    for l in ("en", "bn", "zh"):
        out[l] = {"heading": heading[l], "intro": intro[l] if intro else "",
                  "items": [{"meta": it[l][0], "title": it[l][1], "body": it[l][2]} for it in items]}
    return ("card-grid", out)

def cta(en, bn, zh):
    keys = ("heading", "body", "primaryLabel", "primaryHref", "secondaryLabel", "secondaryHref")
    return ("cta-band", {"en": dict(zip(keys, en)), "bn": dict(zip(keys, bn)), "zh": dict(zip(keys, zh))})

PAGES = []

# ---------------------------------------------------------------- concession
PAGES.append({
  "slug": "about/concession",
  "titles": {"en": ("Concession and financing", "The terms under which DBEDC builds, operates and hands back the Dhaka Bypass Expressway, and how it is financed."),
             "bn": ("কনসেশন ও অর্থায়ন", "যে শর্তে DBEDC ঢাকা বাইপাস এক্সপ্রেসওয়ে নির্মাণ, পরিচালনা ও হস্তান্তর করে এবং এর অর্থায়ন কীভাবে হয়।"),
             "zh": ("特许经营与融资", "DBEDC建设、运营并移交达卡绕城高速公路所依据的条款及其融资方式。")},
  "blocks": [
    header(("About DBEDC", "Concession and financing", "The Dhaka Bypass Expressway is a public–private partnership: the Government grants the concession, DBEDC builds, finances, operates and maintains the road, and hands it back at the end of the term."),
           ("DBEDC পরিচিতি", "কনসেশন ও অর্থায়ন", "ঢাকা বাইপাস এক্সপ্রেসওয়ে একটি সরকারি-বেসরকারি অংশীদারিত্ব প্রকল্প: সরকার কনসেশন দেয়, DBEDC সড়কটি নির্মাণ, অর্থায়ন, পরিচালনা ও রক্ষণাবেক্ষণ করে এবং মেয়াদ শেষে তা ফেরত দেয়।"),
           ("关于DBEDC", "特许经营与融资", "达卡绕城高速公路是政府与社会资本合作项目：政府授予特许经营权，DBEDC负责建设、融资、运营和养护，期满后移交。")),
    cards({"en": "Key terms", "bn": "মূল শর্তাবলি", "zh": "主要条款"}, None, [
      {"en": ("Signed", "6 December 2018", "Concession agreement between the Roads and Highways Department and the concessionaire."),
       "bn": ("স্বাক্ষর", "৬ ডিসেম্বর ২০১৮", "সড়ক ও জনপথ অধিদপ্তর এবং কনসেশনগ্রহীতার মধ্যে কনসেশন চুক্তি।"),
       "zh": ("签署", "2018年12月6日", "孟加拉国公路局与特许经营方签订特许经营协议。")},
      {"en": ("Model", "DBFOMT", "Design, build, finance, operate, maintain and transfer."),
       "bn": ("মডেল", "DBFOMT", "নকশা, নির্মাণ, অর্থায়ন, পরিচালনা, রক্ষণাবেক্ষণ ও হস্তান্তর।"),
       "zh": ("模式", "DBFOMT", "设计、建设、融资、运营、维护和移交。")},
      {"en": ("Term", "25 years", "The concession period set by the agreement, including construction and operation."),
       "bn": ("মেয়াদ", "২৫ বছর", "চুক্তিতে নির্ধারিত কনসেশন মেয়াদ, নির্মাণ ও পরিচালনাসহ।"),
       "zh": ("期限", "25年", "协议规定的特许经营期，含建设期和运营期。")},
      {"en": ("Grantor", "Roads and Highways Department", "The contracting authority under the Road Transport and Highways Division; it monitors compliance through its Project Director."),
       "bn": ("প্রদানকারী", "সড়ক ও জনপথ অধিদপ্তর", "সড়ক পরিবহন ও মহাসড়ক বিভাগের অধীন চুক্তিকারী কর্তৃপক্ষ; প্রকল্প পরিচালকের মাধ্যমে চুক্তি পরিপালন তদারক করে।"),
       "zh": ("授予方", "孟加拉国公路局", "道路交通与公路司下属的合同授予机构，通过项目主任监督协议履行。")},
      {"en": ("Concessionaire", "DBEDC", "The project company formed by Sichuan Road & Bridge Group, Shamim Enterprise and UDC Construction."),
       "bn": ("কনসেশনগ্রহীতা", "DBEDC", "সিচুয়ান রোড অ্যান্ড ব্রিজ গ্রুপ, শামীম এন্টারপ্রাইজ ও ইউডিসি কনস্ট্রাকশনের গঠিত প্রকল্প কোম্পানি।"),
       "zh": ("特许经营方", "DBEDC", "由四川路桥集团、Shamim Enterprise和UDC Construction组建的项目公司。")},
      {"en": ("Handback", "To the Government", "At the end of the term the expressway returns to the Roads and Highways Department in the condition the agreement requires."),
       "bn": ("হস্তান্তর", "সরকারের কাছে", "মেয়াদ শেষে এক্সপ্রেসওয়েটি চুক্তিতে নির্ধারিত অবস্থায় সড়ক ও জনপথ অধিদপ্তরের কাছে ফেরত যায়।"),
       "zh": ("移交", "移交政府", "期满后，高速公路按协议要求的状态移交孟加拉国公路局。")},
    ]),
    rich(("How tolls are set and revised", "<p>Toll rates on the expressway are fixed by government notification, not by DBEDC. DBEDC collects the rates in force and publishes them, by vehicle class, on the <a href=\"travel/toll\">toll rates</a> page. A revision takes effect only when a new notification is issued; the date each rate took effect is shown with the schedule, and the notifications themselves are listed on the <a href=\"disclosures/tariff\">tariff notifications</a> page.</p>"),
         ("টোল কীভাবে নির্ধারণ ও সংশোধন হয়", "<p>এক্সপ্রেসওয়ের টোল হার DBEDC নয়, সরকারি প্রজ্ঞাপনের মাধ্যমে নির্ধারিত হয়। DBEDC কার্যকর হার আদায় করে এবং যানবাহনের শ্রেণি অনুযায়ী <a href=\"travel/toll\">টোল হার</a> পাতায় প্রকাশ করে। নতুন প্রজ্ঞাপন জারি হলেই কেবল সংশোধন কার্যকর হয়; প্রতিটি হার কবে থেকে কার্যকর তা তালিকার সঙ্গে দেখানো হয় এবং প্রজ্ঞাপনগুলো <a href=\"disclosures/tariff\">টোল প্রজ্ঞাপন</a> পাতায় তালিকাভুক্ত।</p>"),
         ("通行费如何制定和调整", "<p>快速路通行费标准由政府公告确定，而非由DBEDC自行制定。DBEDC按现行标准收费，并在<a href=\"travel/toll\">通行费标准</a>页面按车型公布。只有新公告发布后调整才生效；每项费率的生效日期随收费表显示，相关公告列于<a href=\"disclosures/tariff\">收费公告</a>页面。</p>")),
    rich(("Financing and the PPPA record", "<p>The project is financed by the shareholders' equity, loans from China Development Bank and Bangladesh Infrastructure Finance Fund Limited, and viability gap funding from the Government. The amounts and the lenders are set out on the <a href=\"about/governance\">governance</a> page.</p><p>The Public-Private Partnership Authority maintains the official project profile, including the project's place in the national PPP pipeline: <a href=\"https://www.pppo.gov.bd/projects-dhaka-bypass.php\" rel=\"noopener\">PPPA — Dhaka Bypass</a>.</p>"),
         ("অর্থায়ন ও PPPA-র নথি", "<p>প্রকল্পটির অর্থায়ন হয়েছে শেয়ারহোল্ডারদের ইকুইটি, চায়না ডেভেলপমেন্ট ব্যাংক ও বাংলাদেশ ইনফ্রাস্ট্রাকচার ফাইন্যান্স ফান্ড লিমিটেডের ঋণ এবং সরকারের ভায়াবিলিটি গ্যাপ ফান্ডিং থেকে। অর্থের পরিমাণ ও ঋণদাতাদের বিবরণ <a href=\"about/governance\">পরিচালনা কাঠামো</a> পাতায় দেওয়া আছে।</p><p>পাবলিক-প্রাইভেট পার্টনারশিপ কর্তৃপক্ষ প্রকল্পের দাপ্তরিক পরিচিতি সংরক্ষণ করে, জাতীয় পিপিপি তালিকায় প্রকল্পের অবস্থানসহ: <a href=\"https://www.pppo.gov.bd/projects-dhaka-bypass.php\" rel=\"noopener\">PPPA — ঢাকা বাইপাস</a>।</p>"),
         ("融资与PPPA记录", "<p>项目资金来源包括股东股本、国家开发银行和孟加拉国基础设施融资基金有限公司的贷款，以及政府的可行性缺口补助。具体金额和贷款方见<a href=\"about/governance\">治理结构</a>页面。</p><p>政府与社会资本合作管理局维护项目官方资料，包括项目在国家PPP项目库中的情况：<a href=\"https://www.pppo.gov.bd/projects-dhaka-bypass.php\" rel=\"noopener\">PPPA——达卡绕城公路</a>。</p>")),
    cta(("Who does what", "The partners, lenders and the governance structure.", "Governance", "about/governance", "Tariff notifications", "disclosures/tariff"),
        ("কে কী করে", "অংশীদার, ঋণদাতা ও পরিচালনা কাঠামো।", "পরিচালনা কাঠামো", "about/governance", "টোল প্রজ্ঞাপন", "disclosures/tariff"),
        ("各方职责", "合作伙伴、贷款方和治理结构。", "治理结构", "about/governance", "收费公告", "disclosures/tariff")),
  ],
})

# ------------------------------------------------------------- organisation
PAGES.append({
  "slug": "about/organisation",
  "titles": {"en": ("How DBEDC is organised", "DBEDC's board, management and departments, and who is responsible for what."),
             "bn": ("DBEDC-এর সাংগঠনিক কাঠামো", "DBEDC-এর পর্ষদ, ব্যবস্থাপনা ও বিভাগসমূহ এবং কে কিসের দায়িত্বে।"),
             "zh": ("DBEDC组织架构", "DBEDC的董事会、管理层和各部门及其职责。")},
  "blocks": [
    header(("About DBEDC", "How DBEDC is organised", "Who is responsible for building, running and maintaining the expressway, from the board to the teams on the road."),
           ("DBEDC পরিচিতি", "DBEDC-এর সাংগঠনিক কাঠামো", "পর্ষদ থেকে সড়কের দল পর্যন্ত — এক্সপ্রেসওয়ে নির্মাণ, পরিচালনা ও রক্ষণাবেক্ষণের দায়িত্ব কার।"),
           ("关于DBEDC", "DBEDC组织架构", "从董事会到一线团队，谁负责快速路的建设、运营和养护。")),
    cards({"en": "Departments", "bn": "বিভাগসমূহ", "zh": "部门设置"},
          {"en": "Each department reports to the Chief Executive Officer, who is accountable to the Board of Directors.", "bn": "প্রতিটি বিভাগ প্রধান নির্বাহী কর্মকর্তার কাছে জবাবদিহি করে, যিনি পরিচালনা পর্ষদের কাছে দায়বদ্ধ।", "zh": "各部门向首席执行官汇报，首席执行官对董事会负责。"}, [
      {"en": ("Operations", "Toll operations", "Toll plazas, collection, receipts, disputes at the barrier and the accuracy of vehicle classification."),
       "bn": ("পরিচালনা", "টোল পরিচালনা", "টোল প্লাজা, টোল আদায়, রসিদ, প্লাজায় বিরোধ এবং যানবাহনের শ্রেণি নির্ধারণের নির্ভুলতা।"),
       "zh": ("运营", "收费运营", "收费站、收费、票据、收费口争议及车型分类准确性。")},
      {"en": ("Operations", "Traffic management and patrol", "Incident response, breakdown recovery, lane closures, advisories and the control room."),
       "bn": ("পরিচালনা", "ট্রাফিক ব্যবস্থাপনা ও টহল", "দুর্ঘটনায় সাড়া, বিকল যানবাহন উদ্ধার, লেন বন্ধ, বিজ্ঞপ্তি ও নিয়ন্ত্রণকক্ষ।"),
       "zh": ("运营", "交通管理与巡逻", "事故处置、故障车救援、车道封闭、通告发布和监控中心。")},
      {"en": ("Engineering", "Maintenance", "Pavement, structures, drainage, lighting, signs and barriers, to the standards the concession sets."),
       "bn": ("প্রকৌশল", "রক্ষণাবেক্ষণ", "কনসেশনে নির্ধারিত মান অনুযায়ী পেভমেন্ট, অবকাঠামো, নিষ্কাশন, আলো, সাইন ও ব্যারিয়ার।"),
       "zh": ("工程", "养护", "按特许经营标准养护路面、构造物、排水、照明、标志和护栏。")},
      {"en": ("Engineering", "Construction and quality", "Delivery of the sections still under construction and quality assurance on every section."),
       "bn": ("প্রকৌশল", "নির্মাণ ও মাননিয়ন্ত্রণ", "নির্মাণাধীন অংশগুলোর কাজ সম্পন্ন করা এবং প্রতিটি অংশে মান নিশ্চিত করা।"),
       "zh": ("工程", "建设与质量", "推进在建路段施工，并对各路段进行质量保证。")},
      {"en": ("Safeguards", "Environment, health and safety", "Workforce safety, environmental management and monitoring along the corridor."),
       "bn": ("সুরক্ষা", "পরিবেশ, স্বাস্থ্য ও নিরাপত্তা", "কর্মীদের নিরাপত্তা, পরিবেশ ব্যবস্থাপনা ও করিডোরজুড়ে পর্যবেক্ষণ।"),
       "zh": ("保障", "环境、健康与安全", "员工安全、环境管理和走廊沿线监测。")},
      {"en": ("Corporate", "Finance and accounts", "Financial management, lender reporting and the audited accounts."),
       "bn": ("কর্পোরেট", "অর্থ ও হিসাব", "আর্থিক ব্যবস্থাপনা, ঋণদাতাদের কাছে প্রতিবেদন ও নিরীক্ষিত হিসাব।"),
       "zh": ("综合", "财务", "财务管理、向贷款方报告和经审计的财务报表。")},
      {"en": ("Corporate", "Procurement", "Tenders, supplier registration and contract management."),
       "bn": ("কর্পোরেট", "ক্রয়", "দরপত্র, সরবরাহকারী নিবন্ধন ও চুক্তি ব্যবস্থাপনা।"),
       "zh": ("综合", "采购", "招标、供应商登记和合同管理。")},
      {"en": ("Corporate", "Administration, HR and legal", "Recruitment, staff welfare, compliance with the concession and the law, and information requests."),
       "bn": ("কর্পোরেট", "প্রশাসন, মানবসম্পদ ও আইন", "নিয়োগ, কর্মী কল্যাণ, কনসেশন ও আইন পরিপালন এবং তথ্যের অনুরোধ।"),
       "zh": ("综合", "行政、人力资源与法务", "招聘、员工福利、特许经营协议和法律合规以及信息公开申请。")},
      {"en": ("Public", "Customer service and grievances", "Enquiries, complaints, lost property and the public response times set out in the citizen charter."),
       "bn": ("জনসেবা", "গ্রাহকসেবা ও অভিযোগ", "জিজ্ঞাসা, অভিযোগ, হারানো জিনিস এবং নাগরিক সনদে নির্ধারিত সাড়া দেওয়ার সময়।"),
       "zh": ("公众", "客户服务与投诉", "咨询、投诉、失物招领以及公民宪章规定的答复时限。")},
    ]),
    rich(("Organisation chart", "<ul><li><strong>Board of Directors</strong> — representatives of SRBG, SEL and UDC<ul><li><strong>Chief Executive Officer</strong><ul><li>Chief Operating Officer — toll operations; traffic management and patrol; maintenance; customer service</li><li>Engineering — construction and quality; environment, health and safety</li><li>Corporate — finance and accounts; procurement; administration, HR and legal</li></ul></li></ul></li><li><strong>Roads and Highways Department</strong> — Project Director (oversight on behalf of the Government)</li></ul>"),
         ("সাংগঠনিক চিত্র", "<ul><li><strong>পরিচালনা পর্ষদ</strong> — SRBG, SEL ও UDC-এর প্রতিনিধি<ul><li><strong>প্রধান নির্বাহী কর্মকর্তা</strong><ul><li>প্রধান পরিচালন কর্মকর্তা — টোল পরিচালনা; ট্রাফিক ব্যবস্থাপনা ও টহল; রক্ষণাবেক্ষণ; গ্রাহকসেবা</li><li>প্রকৌশল — নির্মাণ ও মাননিয়ন্ত্রণ; পরিবেশ, স্বাস্থ্য ও নিরাপত্তা</li><li>কর্পোরেট — অর্থ ও হিসাব; ক্রয়; প্রশাসন, মানবসম্পদ ও আইন</li></ul></li></ul></li><li><strong>সড়ক ও জনপথ অধিদপ্তর</strong> — প্রকল্প পরিচালক (সরকারের পক্ষে তদারকি)</li></ul>"),
         ("组织结构图", "<ul><li><strong>董事会</strong>——SRBG、SEL和UDC的代表<ul><li><strong>首席执行官</strong><ul><li>首席运营官——收费运营；交通管理与巡逻；养护；客户服务</li><li>工程——建设与质量；环境、健康与安全</li><li>综合——财务；采购；行政、人力资源与法务</li></ul></li></ul></li><li><strong>孟加拉国公路局</strong>——项目主任（代表政府监督）</li></ul>")),
    cta(("Work with us", "Open positions and how DBEDC recruits.", "Careers", "about/careers", "Contact DBEDC", "contact"),
        ("আমাদের সঙ্গে কাজ করুন", "খালি পদ ও DBEDC-এর নিয়োগ প্রক্রিয়া।", "ক্যারিয়ার", "about/careers", "যোগাযোগ", "contact"),
        ("加入我们", "空缺职位及DBEDC招聘方式。", "招聘", "about/careers", "联系DBEDC", "contact")),
  ],
})

# ------------------------------------------------------------------ careers
PAGES.append({
  "slug": "about/careers",
  "titles": {"en": ("Careers", "Working at DBEDC: how positions are advertised, how to apply, and how to recognise a fake job offer."),
             "bn": ("ক্যারিয়ার", "DBEDC-এ কাজ: পদ কীভাবে বিজ্ঞাপিত হয়, কীভাবে আবেদন করবেন এবং ভুয়া চাকরির প্রস্তাব কীভাবে চিনবেন।"),
             "zh": ("招聘", "在DBEDC工作：职位如何发布、如何申请以及如何识别虚假招聘。")},
  "blocks": [
    header(("About DBEDC", "Careers", "Operating a 24-hour expressway takes toll staff, patrol crews, engineers, safety officers and corporate teams."),
           ("DBEDC পরিচিতি", "ক্যারিয়ার", "২৪ ঘণ্টা চালু একটি এক্সপ্রেসওয়ে পরিচালনায় টোলকর্মী, টহল দল, প্রকৌশলী, নিরাপত্তা কর্মকর্তা ও কর্পোরেট দল প্রয়োজন।"),
           ("关于DBEDC", "招聘", "全天候运营一条高速公路，需要收费员、巡逻队、工程师、安全员和综合管理团队。")),
    rich(("How we recruit", "<p>Every open position is advertised on this page and in national newspapers, with the closing date and how to apply. Selection is by written application, assessment and interview, on merit. DBEDC is an equal-opportunity employer, and people from the communities along the corridor are encouraged to apply.</p><p>When there are no open positions, nothing is listed here. Send a speculative application through the <a href=\"contact\">contact form</a> and it will be kept on file for twelve months.</p>"),
         ("আমরা কীভাবে নিয়োগ দিই", "<p>প্রতিটি খালি পদ এই পাতায় ও জাতীয় দৈনিকে বিজ্ঞাপিত হয়, আবেদনের শেষ তারিখ ও আবেদনের পদ্ধতিসহ। লিখিত আবেদন, মূল্যায়ন ও সাক্ষাৎকারের মাধ্যমে মেধার ভিত্তিতে বাছাই করা হয়। DBEDC সমান সুযোগ প্রদানকারী নিয়োগকর্তা; করিডোর সংলগ্ন এলাকার মানুষদের আবেদন করতে উৎসাহিত করা হয়।</p><p>কোনো খালি পদ না থাকলে এখানে কিছু তালিকাভুক্ত থাকে না। <a href=\"contact\">যোগাযোগ ফরম</a> দিয়ে আগ্রহপত্র পাঠালে তা বারো মাস সংরক্ষিত থাকবে।</p>"),
         ("招聘方式", "<p>所有空缺职位均在本页面及全国性报纸上发布，注明截止日期和申请方式。通过书面申请、测评和面试择优录用。DBEDC是平等机会雇主，欢迎走廊沿线社区居民申请。</p><p>无空缺职位时本页不列出职位。可通过<a href=\"contact\">联系表单</a>投递自荐申请，资料将保存十二个月。</p>")),
    rich(("Beware of fake job offers", "<p>DBEDC never asks for money at any stage of recruitment — not for an application form, a test, a medical check or an appointment letter — and never recruits through agents or mobile-money payments. If anyone asks you to pay for a job with DBEDC, do not pay, and report it through the <a href=\"about/integrity\">integrity</a> page.</p>"),
         ("ভুয়া চাকরির প্রস্তাব থেকে সাবধান", "<p>DBEDC নিয়োগের কোনো ধাপে টাকা চায় না — আবেদনপত্র, পরীক্ষা, স্বাস্থ্য পরীক্ষা বা নিয়োগপত্র কোনোটির জন্যই নয় — এবং দালাল বা মোবাইল ব্যাংকিংয়ে টাকা নিয়ে নিয়োগ দেয় না। DBEDC-এ চাকরির জন্য কেউ টাকা চাইলে দেবেন না এবং <a href=\"about/integrity\">শুদ্ধাচার</a> পাতার মাধ্যমে জানান।</p>"),
         ("谨防虚假招聘", "<p>DBEDC在招聘的任何环节都不收取任何费用——无论是申请表、考试、体检还是录用通知——也从不通过中介或移动支付招聘。如有人以DBEDC职位名义向您收费，请勿付款，并通过<a href=\"about/integrity\">廉洁建设</a>页面举报。</p>")),
  ],
})

# ---------------------------------------------------------------- integrity
PAGES.append({
  "slug": "about/integrity",
  "titles": {"en": ("Integrity", "DBEDC's commitments under the National Integrity Strategy, and how to report bribery, fraud or misconduct."),
             "bn": ("শুদ্ধাচার", "জাতীয় শুদ্ধাচার কৌশলের আওতায় DBEDC-এর অঙ্গীকার এবং ঘুষ, প্রতারণা বা অসদাচরণ কীভাবে জানাবেন।"),
             "zh": ("廉洁建设", "DBEDC依据国家廉洁战略作出的承诺，以及如何举报贿赂、欺诈或不当行为。")},
  "blocks": [
    header(("About DBEDC", "Integrity", "No one should pay more than the published toll, and no one should pay anything to get a job, a contract or a decision from DBEDC."),
           ("DBEDC পরিচিতি", "শুদ্ধাচার", "প্রকাশিত টোলের বেশি কাউকে দিতে হবে না, আর DBEDC-এর কাছ থেকে চাকরি, চুক্তি বা সিদ্ধান্ত পেতে কাউকে কিছু দিতে হবে না।"),
           ("关于DBEDC", "廉洁建设", "任何人都不应支付超过公布标准的通行费，也不应为获得DBEDC的工作、合同或决定支付任何费用。")),
    rich(("Our commitments", "<p>DBEDC works in line with the National Integrity Strategy adopted by the Government of Bangladesh in 2012, which asks public bodies and the private sector alike to adopt integrity practices. In practice that means:</p><ul><li>a published toll for every vehicle class, and a receipt for every payment;</li><li>open tenders for goods, works and services, published on the <a href=\"procurement\">procurement</a> page;</li><li>recruitment on merit, with no fees at any stage;</li><li>a code of conduct for every employee, including toll and patrol staff, with no gifts or cash accepted;</li><li>an integrity focal point who receives reports and follows them up, and an annual integrity action plan.</li></ul>"),
         ("আমাদের অঙ্গীকার", "<p>DBEDC বাংলাদেশ সরকারের ২০১২ সালে গৃহীত জাতীয় শুদ্ধাচার কৌশল অনুসরণ করে, যা সরকারি প্রতিষ্ঠান ও বেসরকারি খাত উভয়কে শুদ্ধাচার চর্চা গ্রহণের আহ্বান জানায়। বাস্তবে এর অর্থ:</p><ul><li>প্রতিটি যানবাহন শ্রেণির জন্য প্রকাশিত টোল এবং প্রতিটি পরিশোধের রসিদ;</li><li>পণ্য, কাজ ও সেবার জন্য উন্মুক্ত দরপত্র, <a href=\"procurement\">ক্রয়</a> পাতায় প্রকাশিত;</li><li>মেধার ভিত্তিতে নিয়োগ, কোনো ধাপে কোনো ফি নেই;</li><li>টোল ও টহলকর্মীসহ প্রত্যেক কর্মীর জন্য আচরণবিধি, কোনো উপহার বা নগদ গ্রহণ নয়;</li><li>একজন শুদ্ধাচার ফোকাল পয়েন্ট, যিনি অভিযোগ গ্রহণ ও অনুসরণ করেন, এবং বার্ষিক শুদ্ধাচার কর্মপরিকল্পনা।</li></ul>"),
         ("我们的承诺", "<p>DBEDC遵循孟加拉国政府2012年通过的《国家廉洁战略》，该战略要求公共机构和私营部门共同践行廉洁。具体包括：</p><ul><li>每类车型公布通行费标准，每笔付款提供票据；</li><li>货物、工程和服务公开招标，并在<a href=\"procurement\">采购</a>页面公布；</li><li>择优招聘，任何环节不收费；</li><li>全体员工（包括收费和巡逻人员）遵守行为准则，不收受礼品或现金；</li><li>设立廉洁联络人受理和跟进举报，并制定年度廉洁行动计划。</li></ul>")),
    rich(("Report a concern", "<p>If you were asked for money at a toll plaza, overcharged, offered or asked for a bribe, or saw fraud or misconduct by anyone working for DBEDC, report it through the <a href=\"grievances\">grievance form</a>. Choose the category that fits and say what happened, when and where. You will receive a tracking number, and the report is handled by someone independent of the team involved.</p><p>You can also report corruption directly to the Anti-Corruption Commission of Bangladesh on its hotline, 106.</p>"),
         ("উদ্বেগ জানান", "<p>টোল প্লাজায় আপনার কাছে টাকা চাওয়া হলে, বেশি টোল নেওয়া হলে, ঘুষ চাওয়া বা প্রস্তাব করা হলে, অথবা DBEDC-এর কোনো কর্মীর প্রতারণা বা অসদাচরণ দেখলে <a href=\"grievances\">অভিযোগ ফরম</a> দিয়ে জানান। উপযুক্ত শ্রেণি বেছে নিয়ে কী, কখন ও কোথায় ঘটেছে তা লিখুন। আপনি একটি ট্র্যাকিং নম্বর পাবেন এবং সংশ্লিষ্ট দলের বাইরের একজন অভিযোগটি দেখবেন।</p><p>দুর্নীতির অভিযোগ সরাসরি দুর্নীতি দমন কমিশনের হটলাইন ১০৬-এও জানাতে পারেন।</p>"),
         ("举报问题", "<p>如在收费站被索要钱款、被多收费、被索贿或被行贿，或发现DBEDC任何工作人员有欺诈或不当行为，请通过<a href=\"grievances\">投诉表单</a>举报。选择相应类别，说明事件经过、时间和地点。您将获得跟踪编号，举报由与涉事团队无关的人员处理。</p><p>您也可以直接拨打孟加拉国反腐败委员会热线106举报腐败。</p>")),
  ],
})

# ---------------------------------------------------------------------- RTI
PAGES.append({
  "slug": "disclosures/right-to-information",
  "titles": {"en": ("Right to information", "How to request information from DBEDC, how long a reply takes, and how to appeal."),
             "bn": ("তথ্য অধিকার", "DBEDC-এর কাছে কীভাবে তথ্য চাইবেন, উত্তর পেতে কত সময় লাগে এবং কীভাবে আপিল করবেন।"),
             "zh": ("信息公开", "如何向DBEDC申请信息、答复时限以及如何申诉。")},
  "blocks": [
    header(("Disclosures", "Right to information", "The Right to Information Act 2009 gives every citizen the right to ask for information. This is how to ask DBEDC, and what happens next."),
           ("তথ্য প্রকাশ", "তথ্য অধিকার", "তথ্য অধিকার আইন ২০০৯ প্রত্যেক নাগরিককে তথ্য চাওয়ার অধিকার দেয়। DBEDC-এর কাছে কীভাবে চাইবেন এবং তারপর কী হয়, তা এখানে।"),
           ("信息公开", "信息公开", "《2009年信息权法》赋予每位公民申请信息的权利。以下说明如何向DBEDC申请以及后续流程。")),
    rich(("Information already published", "<p>Much of what people ask for is already public, and you do not need to make a request to see it: <a href=\"travel/toll\">toll rates</a>, <a href=\"disclosures/tariff\">tariff notifications</a>, <a href=\"about/concession\">the concession</a>, <a href=\"about/governance\">governance and financing</a>, <a href=\"disclosures/land-acquisition\">land acquisition</a>, <a href=\"procurement\">tenders</a>, <a href=\"disclosures/reports\">reports</a> and <a href=\"disclosures/policies\">policies</a>.</p>"),
         ("ইতিমধ্যে প্রকাশিত তথ্য", "<p>মানুষ যা জানতে চান তার অনেকটাই ইতিমধ্যে প্রকাশিত; দেখতে অনুরোধ করার প্রয়োজন নেই: <a href=\"travel/toll\">টোল হার</a>, <a href=\"disclosures/tariff\">টোল প্রজ্ঞাপন</a>, <a href=\"about/concession\">কনসেশন</a>, <a href=\"about/governance\">পরিচালনা ও অর্থায়ন</a>, <a href=\"disclosures/land-acquisition\">ভূমি অধিগ্রহণ</a>, <a href=\"procurement\">দরপত্র</a>, <a href=\"disclosures/reports\">প্রতিবেদন</a> ও <a href=\"disclosures/policies\">নীতিমালা</a>।</p>"),
         ("已公开的信息", "<p>许多常见问题的信息已经公开，无需申请即可查看：<a href=\"travel/toll\">通行费标准</a>、<a href=\"disclosures/tariff\">收费公告</a>、<a href=\"about/concession\">特许经营</a>、<a href=\"about/governance\">治理与融资</a>、<a href=\"disclosures/land-acquisition\">征地</a>、<a href=\"procurement\">招标</a>、<a href=\"disclosures/reports\">报告</a>和<a href=\"disclosures/policies\">政策</a>。</p>")),
    ("faq", {
      "en": {"heading": "Making a request", "intro": "", "items": [
        {"question": "How do I ask for information?", "answer": "<p>Write to DBEDC's designated information officer through the <a href=\"contact\">contact form</a>, choosing the subject “Information request”, or in writing to the office. Give your name and address, describe the information you want as precisely as you can, and say how you would like to receive it (copy, email or inspection). The application form prescribed by the Information Commission may be used but is not required.</p>"},
        {"question": "How long does a reply take?", "answer": "<p>The Act allows up to 20 working days from receipt of the request, or 30 working days when the information concerns a third party, and 24 hours when it concerns a person's life or liberty. If a request cannot be met, you will be told why in writing.</p>"},
        {"question": "Is there a fee?", "answer": "<p>There is no fee for making a request. Where information is supplied as copies, the reasonable cost of copying set by the Information Commission may be charged, and you will be told the amount before it is incurred.</p>"},
        {"question": "What if I am refused or receive no reply?", "answer": "<p>You may appeal to DBEDC's appeal authority within 30 days of the refusal or of the deadline passing; the appeal is decided within 15 days. If you remain dissatisfied, you may complain to the Information Commission of Bangladesh.</p>"},
        {"question": "What can be withheld?", "answer": "<p>Only information the Act exempts, such as commercially confidential information whose disclosure would harm a third party's competitive position, personal information, or information that would affect security or an investigation. Everything else is disclosable.</p>"}]},
      "bn": {"heading": "অনুরোধ করা", "intro": "", "items": [
        {"question": "কীভাবে তথ্য চাইব?", "answer": "<p><a href=\"contact\">যোগাযোগ ফরমে</a> “তথ্যের অনুরোধ” বিষয় বেছে বা অফিসে লিখিতভাবে DBEDC-এর দায়িত্বপ্রাপ্ত তথ্য কর্মকর্তার কাছে লিখুন। আপনার নাম ও ঠিকানা দিন, কী তথ্য চান যতটা সম্ভব সুনির্দিষ্টভাবে বলুন এবং কীভাবে পেতে চান (অনুলিপি, ইমেইল বা পরিদর্শন) জানান। তথ্য কমিশন নির্ধারিত আবেদন ফরম ব্যবহার করা যায়, তবে তা বাধ্যতামূলক নয়।</p>"},
        {"question": "উত্তর পেতে কত সময় লাগে?", "answer": "<p>আইন অনুযায়ী অনুরোধ পাওয়ার পর সর্বোচ্চ ২০ কার্যদিবস, তৃতীয় পক্ষ সংশ্লিষ্ট হলে ৩০ কার্যদিবস, এবং কারও জীবন-মৃত্যু বা স্বাধীনতার বিষয় হলে ২৪ ঘণ্টা। অনুরোধ পূরণ করা না গেলে কারণ লিখিতভাবে জানানো হবে।</p>"},
        {"question": "কোনো ফি আছে কি?", "answer": "<p>অনুরোধ করতে কোনো ফি নেই। অনুলিপি সরবরাহ করা হলে তথ্য কমিশন নির্ধারিত যুক্তিসংগত অনুলিপি খরচ নেওয়া হতে পারে, এবং খরচ হওয়ার আগেই পরিমাণ জানানো হবে।</p>"},
        {"question": "প্রত্যাখ্যাত হলে বা উত্তর না পেলে?", "answer": "<p>প্রত্যাখ্যানের বা সময়সীমা পেরোনোর ৩০ দিনের মধ্যে DBEDC-এর আপিল কর্তৃপক্ষের কাছে আপিল করতে পারেন; ১৫ দিনের মধ্যে আপিল নিষ্পত্তি হয়। তাতেও সন্তুষ্ট না হলে বাংলাদেশ তথ্য কমিশনে অভিযোগ করতে পারেন।</p>"},
        {"question": "কোন তথ্য দেওয়া না-ও হতে পারে?", "answer": "<p>কেবল আইনে অব্যাহতিপ্রাপ্ত তথ্য, যেমন প্রকাশ করলে তৃতীয় পক্ষের প্রতিযোগিতামূলক অবস্থান ক্ষতিগ্রস্ত হবে এমন বাণিজ্যিক গোপন তথ্য, ব্যক্তিগত তথ্য, অথবা নিরাপত্তা বা তদন্তে প্রভাব ফেলবে এমন তথ্য। বাকি সব তথ্য প্রকাশযোগ্য।</p>"}]},
      "zh": {"heading": "提出申请", "intro": "", "items": [
        {"question": "如何申请信息？", "answer": "<p>通过<a href=\"contact\">联系表单</a>选择“信息申请”主题，或以书面形式向DBEDC指定信息官提出。请提供姓名和地址，尽量准确描述所需信息，并说明获取方式（复印件、电子邮件或查阅）。可使用信息委员会规定的申请表，但并非必需。</p>"},
        {"question": "多久答复？", "answer": "<p>法律规定自收到申请之日起最长20个工作日；涉及第三方的为30个工作日；涉及人身生命或自由的为24小时。无法满足申请的，将书面说明理由。</p>"},
        {"question": "是否收费？", "answer": "<p>提出申请不收费。以复印件形式提供信息的，可能按信息委员会规定收取合理复印费用，并会事先告知金额。</p>"},
        {"question": "被拒绝或未获答复怎么办？", "answer": "<p>可在被拒绝或期限届满后30日内向DBEDC申诉机构提出申诉，申诉在15日内作出决定。仍不满意的，可向孟加拉国信息委员会投诉。</p>"},
        {"question": "哪些信息可以不公开？", "answer": "<p>仅限法律豁免的信息，例如公开后会损害第三方竞争地位的商业秘密、个人信息，或影响安全或调查的信息。其他信息均可公开。</p>"}]},
    }),
  ],
})

# ----------------------------------------------------------- citizen charter
PAGES.append({
  "slug": "disclosures/citizen-charter",
  "titles": {"en": ("Citizen charter", "The services DBEDC provides to road users, the standard for each, and what to do if a standard is not met."),
             "bn": ("নাগরিক সনদ", "DBEDC সড়ক ব্যবহারকারীদের যে সেবা দেয়, প্রতিটির মান এবং মান পূরণ না হলে কী করবেন।"),
             "zh": ("公民宪章", "DBEDC为道路使用者提供的服务、各项服务标准以及未达标时的处理方式。")},
  "blocks": [
    header(("Disclosures", "Citizen charter", "What you can expect from DBEDC as a road user, and how to hold us to it."),
           ("তথ্য প্রকাশ", "নাগরিক সনদ", "সড়ক ব্যবহারকারী হিসেবে DBEDC-এর কাছ থেকে আপনি কী আশা করতে পারেন এবং কীভাবে তা আদায় করবেন।"),
           ("信息公开", "公民宪章", "作为道路使用者您可以期待DBEDC提供什么，以及如何监督我们兑现承诺。")),
    cards({"en": "Our services and standards", "bn": "আমাদের সেবা ও মান", "zh": "服务与标准"},
          {"en": "Every written request made through this website receives a tracking number, and the date by which you will get an answer is shown when you submit it.", "bn": "এই ওয়েবসাইটের মাধ্যমে করা প্রতিটি লিখিত অনুরোধ একটি ট্র্যাকিং নম্বর পায়, এবং জমা দেওয়ার সময়ই কোন তারিখের মধ্যে উত্তর পাবেন তা দেখানো হয়।", "zh": "通过本网站提交的每项书面请求都会获得跟踪编号，提交时即显示答复截止日期。"}, [
      {"en": ("At the plaza", "Paying a toll", "The published rate for your vehicle class, a receipt for every payment, and no charge beyond the published rate."),
       "bn": ("প্লাজায়", "টোল পরিশোধ", "আপনার যানবাহন শ্রেণির প্রকাশিত হার, প্রতিটি পরিশোধের রসিদ এবং প্রকাশিত হারের বেশি কোনো অর্থ নয়।"),
       "zh": ("收费站", "缴纳通行费", "按公布的车型标准收费，每笔付款提供票据，不收取超出公布标准的费用。")},
      {"en": ("On the road", "Breakdowns and emergencies", "Patrol response on the open section at any hour; recovery of a broken-down vehicle to the nearest safe exit."),
       "bn": ("সড়কে", "বিকল যানবাহন ও জরুরি অবস্থা", "খোলা অংশে যেকোনো সময় টহল দলের সাড়া; বিকল যানবাহন নিকটতম নিরাপদ প্রস্থানে সরিয়ে নেওয়া।"),
       "zh": ("道路上", "故障与紧急情况", "已通车路段全天候巡逻响应；将故障车辆拖至最近的安全出口。")},
      {"en": ("In writing", "Complaints", "An acknowledgement with a tracking number at once, and an answer within the published response time."),
       "bn": ("লিখিতভাবে", "অভিযোগ", "সঙ্গে সঙ্গে ট্র্যাকিং নম্বরসহ প্রাপ্তিস্বীকার এবং প্রকাশিত সময়ের মধ্যে উত্তর।"),
       "zh": ("书面", "投诉", "立即确认并提供跟踪编号，在公布的时限内答复。")},
      {"en": ("In writing", "Toll disputes", "A review of the charge against the plaza record, and a refund of any overcharge."),
       "bn": ("লিখিতভাবে", "টোল বিরোধ", "প্লাজার রেকর্ডের সঙ্গে মিলিয়ে চার্জ পর্যালোচনা এবং বেশি নেওয়া অর্থ ফেরত।"),
       "zh": ("书面", "收费争议", "对照收费站记录复核收费，多收部分予以退还。")},
      {"en": ("In writing", "Lost property", "Items found on the expressway are logged and held; you are contacted if a match is found."),
       "bn": ("লিখিতভাবে", "হারানো জিনিস", "এক্সপ্রেসওয়েতে পাওয়া জিনিস লিপিবদ্ধ করে সংরক্ষণ করা হয়; মিল পাওয়া গেলে আপনার সঙ্গে যোগাযোগ করা হয়।"),
       "zh": ("书面", "失物招领", "在快速路上拾获的物品登记保管，找到匹配物品时与您联系。")},
      {"en": ("In writing", "Information requests", "A reply within the time the Right to Information Act 2009 allows."),
       "bn": ("লিখিতভাবে", "তথ্যের অনুরোধ", "তথ্য অধিকার আইন ২০০৯-এ নির্ধারিত সময়ের মধ্যে উত্তর।"),
       "zh": ("书面", "信息公开申请", "在《2009年信息权法》规定的时限内答复。")},
    ]),
    rich(("If we do not meet a standard", "<p>Use the <a href=\"grievances\">grievance form</a> and quote your tracking number if you have one. If the answer does not resolve the matter, ask for it to be reviewed by the appeal officer named in the reply. You may also use the Government's Grievance Redress System at <a href=\"https://www.grs.gov.bd\" rel=\"noopener\">grs.gov.bd</a>.</p>"),
         ("মান পূরণ না হলে", "<p><a href=\"grievances\">অভিযোগ ফরম</a> ব্যবহার করুন এবং ট্র্যাকিং নম্বর থাকলে তা উল্লেখ করুন। উত্তরে সমস্যার সমাধান না হলে উত্তরে নাম দেওয়া আপিল কর্মকর্তার কাছে পুনর্বিবেচনার অনুরোধ করুন। সরকারের অভিযোগ প্রতিকার ব্যবস্থাও ব্যবহার করতে পারেন: <a href=\"https://www.grs.gov.bd\" rel=\"noopener\">grs.gov.bd</a>।</p>"),
         ("未达到标准时", "<p>请使用<a href=\"grievances\">投诉表单</a>，如有跟踪编号请注明。若答复未能解决问题，可请求答复中指定的申诉官员复核。您也可以使用政府投诉处理系统：<a href=\"https://www.grs.gov.bd\" rel=\"noopener\">grs.gov.bd</a>。</p>")),
  ],
})

# ----------------------------------------------------------------- reports
PAGES.append({
  "slug": "disclosures/reports",
  "titles": {"en": ("Reports and statistics", "DBEDC's annual reports, audited financial statements and traffic on the corridor."),
             "bn": ("প্রতিবেদন ও পরিসংখ্যান", "DBEDC-এর বার্ষিক প্রতিবেদন, নিরীক্ষিত আর্থিক বিবরণী ও করিডোরের যান চলাচল।"),
             "zh": ("报告与统计", "DBEDC年度报告、经审计的财务报表及走廊交通情况。")},
  "blocks": [
    header(("Disclosures", "Reports and statistics", "How the expressway is performing: progress, traffic, and the company's reports and accounts."),
           ("তথ্য প্রকাশ", "প্রতিবেদন ও পরিসংখ্যান", "এক্সপ্রেসওয়ে কেমন চলছে: অগ্রগতি, যান চলাচল এবং কোম্পানির প্রতিবেদন ও হিসাব।"),
           ("信息公开", "报告与统计", "快速路运行情况：进度、交通及公司报告和财务报表。")),
    ("progress-bar", {"en": {"heading": "Progress", "intro": ""}, "bn": {"heading": "অগ্রগতি", "intro": ""}, "zh": {"heading": "进度", "intro": ""}}),
    ("traffic-status", {"en": {"heading": "Traffic now", "intro": "Conditions by section, from the corridor records.", "caption": "Traffic conditions by section", "sort": "corridor", "showLegend": "yes", "sections": []},
                        "bn": {"heading": "এখনকার যান চলাচল", "intro": "করিডোরের রেকর্ড অনুযায়ী অংশভিত্তিক অবস্থা।", "caption": "অংশভিত্তিক যান চলাচলের অবস্থা", "sort": "corridor", "showLegend": "yes", "sections": []},
                        "zh": {"heading": "当前交通", "intro": "来自走廊记录的分路段路况。", "caption": "分路段交通状况", "sort": "corridor", "showLegend": "yes", "sections": []}}),
    rich(("Annual reports and audited accounts", "<p>DBEDC's annual report and its financial statements, audited by an independent firm of chartered accountants, are published here after they are approved at the company's annual general meeting. Monthly traffic counts at the toll plazas are published with the traffic figures above once they have been reviewed.</p>"),
         ("বার্ষিক প্রতিবেদন ও নিরীক্ষিত হিসাব", "<p>DBEDC-এর বার্ষিক প্রতিবেদন এবং স্বাধীন চার্টার্ড অ্যাকাউন্ট্যান্ট প্রতিষ্ঠান কর্তৃক নিরীক্ষিত আর্থিক বিবরণী কোম্পানির বার্ষিক সাধারণ সভায় অনুমোদনের পর এখানে প্রকাশ করা হয়। টোল প্লাজার মাসিক যানবাহন গণনা পর্যালোচনার পর উপরের যান চলাচলের তথ্যের সঙ্গে প্রকাশ করা হয়।</p>"),
         ("年度报告与经审计的财务报表", "<p>DBEDC年度报告及经独立特许会计师事务所审计的财务报表，在公司股东年会批准后于此公布。收费站月度车流量数据经审核后与上方交通数据一并公布。</p>")),
  ],
})

# ----------------------------------------------------------------- policies
def doc(title, desc, file, ftype=""):
    return {"title": title, "description": desc, "file": file, "fileType": ftype, "fileSize": "", "date": ""}

PAGES.append({
  "slug": "disclosures/policies",
  "titles": {"en": ("Policies", "The policies DBEDC works to, in one place."),
             "bn": ("নীতিমালা", "DBEDC যেসব নীতিমালা অনুসরণ করে, এক জায়গায়।"),
             "zh": ("政策", "DBEDC遵循的各项政策汇总。")},
  "blocks": [
    header(("Disclosures", "Policies", "The rules DBEDC holds itself to, and the pages where each one is set out in full."),
           ("তথ্য প্রকাশ", "নীতিমালা", "DBEDC যে নিয়ম মেনে চলে এবং প্রতিটির পূর্ণ বিবরণ যে পাতায় আছে।"),
           ("信息公开", "政策", "DBEDC自我约束的规则，以及每项规则的完整说明页面。")),
    ("document-list", {
      "en": {"heading": "Policy library", "intro": "", "documents": [
        doc("Integrity and anti-corruption", "Commitments under the National Integrity Strategy and how to report a concern.", "about/integrity"),
        doc("Grievance redress", "How complaints are received, answered and escalated.", "grievances"),
        doc("Citizen charter", "Service standards for road users.", "disclosures/citizen-charter"),
        doc("Right to information", "How to request information and appeal.", "disclosures/right-to-information"),
        doc("Environmental and social safeguards", "How the corridor's environmental and social impacts are managed.", "disclosures/environment"),
        doc("Procurement", "How DBEDC buys goods, works and services.", "procurement"),
        doc("Privacy", "How personal information is handled on this website.", "privacy"),
        doc("Accessibility", "The accessibility standard this website meets and its known gaps.", "accessibility"),
        doc("Rules of the road", "Speed limits, prohibited vehicles and conduct on the expressway.", "travel/rules")]},
      "bn": {"heading": "নীতিমালা সংগ্রহ", "intro": "", "documents": [
        doc("শুদ্ধাচার ও দুর্নীতিবিরোধী", "জাতীয় শুদ্ধাচার কৌশলের আওতায় অঙ্গীকার এবং উদ্বেগ জানানোর পদ্ধতি।", "about/integrity"),
        doc("অভিযোগ প্রতিকার", "অভিযোগ কীভাবে গ্রহণ, উত্তর ও ঊর্ধ্বতন পর্যায়ে পাঠানো হয়।", "grievances"),
        doc("নাগরিক সনদ", "সড়ক ব্যবহারকারীদের জন্য সেবার মান।", "disclosures/citizen-charter"),
        doc("তথ্য অধিকার", "তথ্য চাওয়া ও আপিলের পদ্ধতি।", "disclosures/right-to-information"),
        doc("পরিবেশগত ও সামাজিক সুরক্ষা", "করিডোরের পরিবেশগত ও সামাজিক প্রভাব কীভাবে ব্যবস্থাপনা করা হয়।", "disclosures/environment"),
        doc("ক্রয়", "DBEDC কীভাবে পণ্য, কাজ ও সেবা ক্রয় করে।", "procurement"),
        doc("গোপনীয়তা", "এই ওয়েবসাইটে ব্যক্তিগত তথ্য কীভাবে ব্যবস্থাপনা করা হয়।", "privacy"),
        doc("প্রবেশগম্যতা", "এই ওয়েবসাইট যে প্রবেশগম্যতার মান পূরণ করে এবং জানা ঘাটতি।", "accessibility"),
        doc("সড়কের নিয়ম", "গতিসীমা, নিষিদ্ধ যানবাহন ও এক্সপ্রেসওয়েতে আচরণ।", "travel/rules")]},
      "zh": {"heading": "政策汇总", "intro": "", "documents": [
        doc("廉洁与反腐败", "依据国家廉洁战略作出的承诺及举报方式。", "about/integrity"),
        doc("投诉处理", "投诉的受理、答复和升级处理方式。", "grievances"),
        doc("公民宪章", "面向道路使用者的服务标准。", "disclosures/citizen-charter"),
        doc("信息公开", "信息申请及申诉方式。", "disclosures/right-to-information"),
        doc("环境与社会保障", "走廊环境和社会影响的管理方式。", "disclosures/environment"),
        doc("采购", "DBEDC如何采购货物、工程和服务。", "procurement"),
        doc("隐私", "本网站如何处理个人信息。", "privacy"),
        doc("无障碍", "本网站达到的无障碍标准及已知不足。", "accessibility"),
        doc("道路规则", "限速、禁行车辆及快速路行驶规范。", "travel/rules")]},
    }),
  ],
})

# -------------------------------------------------------------- environment
PAGES.append({
  "slug": "disclosures/environment",
  "titles": {"en": ("Environmental and social safeguards", "How the Dhaka Bypass Expressway's environmental and social impacts are assessed, managed and monitored."),
             "bn": ("পরিবেশগত ও সামাজিক সুরক্ষা", "ঢাকা বাইপাস এক্সপ্রেসওয়ের পরিবেশগত ও সামাজিক প্রভাব কীভাবে মূল্যায়ন, ব্যবস্থাপনা ও পর্যবেক্ষণ করা হয়।"),
             "zh": ("环境与社会保障", "达卡绕城高速公路环境和社会影响的评估、管理和监测。")},
  "blocks": [
    header(("Disclosures", "Environmental and social safeguards", "A 48-kilometre road through farmland, rivers and growing towns changes the places it passes. This is how those changes are managed."),
           ("তথ্য প্রকাশ", "পরিবেশগত ও সামাজিক সুরক্ষা", "কৃষিজমি, নদী ও বেড়ে ওঠা শহরের মধ্য দিয়ে যাওয়া একটি সড়ক আশপাশের এলাকা বদলে দেয়। সেই পরিবর্তন কীভাবে ব্যবস্থাপনা করা হয়, তা এখানে।"),
           ("信息公开", "环境与社会保障", "一条穿越农田、河流和发展中城镇的道路会改变沿线地区。以下说明如何管理这些变化。")),
    rich(("The legal framework", "<p>Road projects of this size are classed as “Red” under the Environment Conservation Rules 2023 made under the Bangladesh Environment Conservation Act 1995. They require an environmental impact assessment and an environmental management plan approved by the Department of Environment, and an environmental clearance certificate that is renewed during construction and operation. Land for the project is acquired by the Government under the Acquisition and Requisition of Immovable Property Act 2017; see <a href=\"disclosures/land-acquisition\">land acquisition</a>.</p>"),
         ("আইনি কাঠামো", "<p>বাংলাদেশ পরিবেশ সংরক্ষণ আইন ১৯৯৫-এর অধীনে প্রণীত পরিবেশ সংরক্ষণ বিধিমালা ২০২৩ অনুযায়ী এই আকারের সড়ক প্রকল্প “লাল” শ্রেণিভুক্ত। এর জন্য পরিবেশ অধিদপ্তর কর্তৃক অনুমোদিত পরিবেশগত প্রভাব নিরূপণ ও পরিবেশ ব্যবস্থাপনা পরিকল্পনা এবং নির্মাণ ও পরিচালনাকালে নবায়নযোগ্য পরিবেশ ছাড়পত্র প্রয়োজন। প্রকল্পের ভূমি স্থাবর সম্পত্তি অধিগ্রহণ ও হুকুমদখল আইন ২০১৭-এর অধীনে সরকার অধিগ্রহণ করে; দেখুন <a href=\"disclosures/land-acquisition\">ভূমি অধিগ্রহণ</a>।</p>"),
         ("法律框架", "<p>根据《1995年孟加拉国环境保护法》制定的《2023年环境保护规则》，此类规模的道路项目属于“红色”类别，须编制经环境局批准的环境影响评价和环境管理计划，并取得在建设和运营期间定期更新的环境许可证。项目用地由政府依据《2017年不动产征收征用法》征收，详见<a href=\"disclosures/land-acquisition\">征地</a>。</p>")),
    cards({"en": "What is managed, and how", "bn": "কী ব্যবস্থাপনা করা হয় এবং কীভাবে", "zh": "管理内容与方式"}, None, [
      {"en": ("Air", "Dust and emissions", "Watering of haul roads and stockpiles, covered transport of loose material, and maintained plant."),
       "bn": ("বায়ু", "ধুলা ও নির্গমন", "পরিবহন পথ ও মজুদে পানি ছিটানো, খোলা সামগ্রী ঢেকে পরিবহন এবং রক্ষণাবেক্ষিত যন্ত্রপাতি।"),
       "zh": ("空气", "扬尘与排放", "对运输道路和堆料洒水，散装材料覆盖运输，机械设备定期维护。")},
      {"en": ("Water", "Rivers, canals and drainage", "Cross-drainage culverts and bridges sized to keep floodwater moving, and no discharge of construction waste into watercourses."),
       "bn": ("পানি", "নদী, খাল ও নিষ্কাশন", "বন্যার পানি প্রবাহ বজায় রাখতে উপযুক্ত আকারের কালভার্ট ও সেতু, এবং জলাধারে নির্মাণ বর্জ্য না ফেলা।"),
       "zh": ("水", "河流、运河与排水", "按保持洪水畅通的要求设置涵洞和桥梁，严禁向水体排放施工废弃物。")},
      {"en": ("Noise", "Communities near the road", "Limits on night work near homes and schools, and monitoring at sensitive locations."),
       "bn": ("শব্দ", "সড়কের কাছের জনবসতি", "বাড়ি ও বিদ্যালয়ের কাছে রাতের কাজে সীমাবদ্ধতা এবং সংবেদনশীল স্থানে পর্যবেক্ষণ।"),
       "zh": ("噪声", "道路附近社区", "限制住宅和学校附近夜间施工，并在敏感点开展监测。")},
      {"en": ("Nature", "Trees and green cover", "Compensatory planting along the corridor for trees removed during construction."),
       "bn": ("প্রকৃতি", "গাছ ও সবুজ আচ্ছাদন", "নির্মাণকালে কাটা গাছের পরিবর্তে করিডোর বরাবর ক্ষতিপূরণমূলক বৃক্ষরোপণ।"),
       "zh": ("自然", "树木与绿化", "对施工中移除的树木，沿走廊进行补偿性种植。")},
      {"en": ("People", "Safety and access", "Safe crossings and service roads so communities stay connected, and a safety plan for workers and the public."),
       "bn": ("মানুষ", "নিরাপত্তা ও চলাচল", "জনবসতি যাতে সংযুক্ত থাকে সে জন্য নিরাপদ পারাপার ও সার্ভিস রোড, এবং কর্মী ও জনসাধারণের জন্য নিরাপত্তা পরিকল্পনা।"),
       "zh": ("人", "安全与通行", "设置安全过街设施和辅路，保持社区连通，并制定工人和公众安全计划。")},
      {"en": ("People", "Grievances", "Anyone affected by construction or operation can complain through the grievance form and receives a tracking number."),
       "bn": ("মানুষ", "অভিযোগ", "নির্মাণ বা পরিচালনায় ক্ষতিগ্রস্ত যে কেউ অভিযোগ ফরমের মাধ্যমে অভিযোগ করতে পারেন এবং একটি ট্র্যাকিং নম্বর পান।"),
       "zh": ("人", "投诉", "受施工或运营影响的任何人都可通过投诉表单投诉，并获得跟踪编号。")},
    ]),
    rich(("Monitoring and documents", "<p>Environmental monitoring results are reported to the Department of Environment and the Roads and Highways Department. The environmental clearance, the approved assessment and management plan, and monitoring summaries are listed on this page as they are released for publication.</p>"),
         ("পর্যবেক্ষণ ও নথি", "<p>পরিবেশ পর্যবেক্ষণের ফলাফল পরিবেশ অধিদপ্তর ও সড়ক ও জনপথ অধিদপ্তরে জমা দেওয়া হয়। পরিবেশ ছাড়পত্র, অনুমোদিত নিরূপণ ও ব্যবস্থাপনা পরিকল্পনা এবং পর্যবেক্ষণের সারসংক্ষেপ প্রকাশের জন্য ছাড় পাওয়ার পর এই পাতায় তালিকাভুক্ত করা হয়।</p>"),
         ("监测与文件", "<p>环境监测结果报送环境局和孟加拉国公路局。环境许可证、经批准的评价报告和管理计划以及监测摘要，在获准公开后列于本页。</p>")),
  ],
})

# ------------------------------------------------------------ consultations
PAGES.append({
  "slug": "disclosures/consultations",
  "titles": {"en": ("Public consultations", "Notices of public consultations and meetings about the expressway."),
             "bn": ("জনপরামর্শ", "এক্সপ্রেসওয়ে সম্পর্কিত জনপরামর্শ ও সভার বিজ্ঞপ্তি।"),
             "zh": ("公众咨询", "有关快速路的公众咨询和会议通知。")},
  "blocks": [
    header(("Disclosures", "Public consultations", "When DBEDC or the Roads and Highways Department asks people along the corridor for their views — on a new interchange, a closure or a change to access — the notice is published here."),
           ("তথ্য প্রকাশ", "জনপরামর্শ", "নতুন ইন্টারচেঞ্জ, সড়ক বন্ধ বা প্রবেশপথ পরিবর্তন নিয়ে DBEDC বা সড়ক ও জনপথ অধিদপ্তর করিডোর সংলগ্ন মানুষের মতামত চাইলে বিজ্ঞপ্তি এখানে প্রকাশিত হয়।"),
           ("信息公开", "公众咨询", "当DBEDC或孟加拉国公路局就新建互通、封闭或出入口调整征求沿线群众意见时，通知在此发布。")),
    ("news-list", {"en": {"heading": "Consultation notices", "intro": "", "category": "Consultation", "limit": 50, "emptyMessage": "There is no open consultation at present."},
                   "bn": {"heading": "পরামর্শ বিজ্ঞপ্তি", "intro": "", "category": "Consultation", "limit": 50, "emptyMessage": "এই মুহূর্তে কোনো জনপরামর্শ চলছে না।"},
                   "zh": {"heading": "咨询通知", "intro": "", "category": "Consultation", "limit": 50, "emptyMessage": "目前没有正在进行的公众咨询。"}}),
    rich(("Taking part", "<p>Each notice gives the date, place and subject of the meeting and how to send written comments if you cannot attend. Comments can also be sent at any time through the <a href=\"contact\">contact form</a>.</p>"),
         ("অংশগ্রহণ", "<p>প্রতিটি বিজ্ঞপ্তিতে সভার তারিখ, স্থান ও বিষয় এবং উপস্থিত থাকতে না পারলে লিখিত মতামত পাঠানোর পদ্ধতি দেওয়া থাকে। মতামত যেকোনো সময় <a href=\"contact\">যোগাযোগ ফরম</a> দিয়েও পাঠানো যায়।</p>"),
         ("如何参与", "<p>每份通知均列明会议日期、地点和议题，以及无法出席时提交书面意见的方式。也可随时通过<a href=\"contact\">联系表单</a>提交意见。</p>")),
  ],
})

# ---------------------------------------------------------------- standards
PAGES.append({
  "slug": "project/standards",
  "titles": {"en": ("Standards and design", "The design standards, specifications and regulations the Dhaka Bypass Expressway is built and operated to."),
             "bn": ("মান ও নকশা", "ঢাকা বাইপাস এক্সপ্রেসওয়ে যে নকশা মান, স্পেসিফিকেশন ও বিধিমালা অনুযায়ী নির্মিত ও পরিচালিত হয়।"),
             "zh": ("标准与设计", "达卡绕城高速公路建设和运营所依据的设计标准、技术规范和法规。")},
  "blocks": [
    header(("The project", "Standards and design", "What the expressway is designed to, who checks it, and the rules it operates under."),
           ("প্রকল্প", "মান ও নকশা", "এক্সপ্রেসওয়ে কোন মানে নকশা করা, কে যাচাই করে এবং কোন নিয়মে পরিচালিত হয়।"),
           ("项目概况", "标准与设计", "快速路的设计标准、审查主体及运营所遵循的规则。")),
    cards({"en": "Standards applied", "bn": "প্রযোজ্য মান", "zh": "适用标准"}, None, [
      {"en": ("Design", "Roads and Highways Department standards", "Geometric design, pavement and structures to RHD's standards and specifications for national highways, reviewed by RHD for each section."),
       "bn": ("নকশা", "সড়ক ও জনপথ অধিদপ্তরের মান", "জাতীয় মহাসড়কের জন্য সওজ-এর মান ও স্পেসিফিকেশন অনুযায়ী জ্যামিতিক নকশা, পেভমেন্ট ও অবকাঠামো; প্রতিটি অংশ সওজ কর্তৃক পর্যালোচিত।"),
       "zh": ("设计", "孟加拉国公路局标准", "几何设计、路面和构造物按公路局国道标准与规范执行，每个路段均经公路局审查。")},
      {"en": ("Structures", "Bridge design codes", "Bridges and flyovers designed to the loading and design codes adopted by RHD, including provision for heavy freight vehicles."),
       "bn": ("অবকাঠামো", "সেতু নকশা কোড", "ভারী পণ্যবাহী যানবাহনের ব্যবস্থাসহ সওজ গৃহীত লোডিং ও নকশা কোড অনুযায়ী সেতু ও ফ্লাইওভার নকশা।"),
       "zh": ("构造物", "桥梁设计规范", "桥梁和高架桥按公路局采用的荷载和设计规范设计，并考虑重型货车通行。")},
      {"en": ("Traffic", "Signs, markings and speed", "Road signs and markings to the Bangladesh road sign manual; speed limits under the Motor Vehicle Speed Limit Guideline 2024."),
       "bn": ("ট্রাফিক", "সাইন, মার্কিং ও গতি", "বাংলাদেশ সড়ক সাইন ম্যানুয়াল অনুযায়ী সাইন ও মার্কিং; মোটরযানের গতিসীমা নির্দেশিকা ২০২৪ অনুযায়ী গতিসীমা।"),
       "zh": ("交通", "标志、标线与限速", "交通标志和标线符合孟加拉国道路标志手册；限速依据《2024年机动车限速指南》。")},
      {"en": ("Law", "Road Transport Act 2018", "The rules of the road, vehicle fitness, loads and penalties that apply on the expressway."),
       "bn": ("আইন", "সড়ক পরিবহন আইন ২০১৮", "এক্সপ্রেসওয়েতে প্রযোজ্য সড়কের নিয়ম, যানবাহনের ফিটনেস, ভার ও দণ্ড।"),
       "zh": ("法律", "《2018年道路运输法》", "快速路适用的道路规则、车辆技术状况、载重及处罚规定。")},
      {"en": ("Tolls", "Toll Policy", "Tolls set by government notification under the national toll policy for bridges and roads."),
       "bn": ("টোল", "টোল নীতিমালা", "সেতু ও সড়কের জাতীয় টোল নীতিমালার আওতায় সরকারি প্রজ্ঞাপনে নির্ধারিত টোল।"),
       "zh": ("收费", "收费政策", "依据国家桥梁和道路收费政策，由政府公告确定通行费。")},
      {"en": ("Safeguards", "Environment Conservation Rules 2023", "Environmental assessment, management and monitoring; see environmental and social safeguards."),
       "bn": ("সুরক্ষা", "পরিবেশ সংরক্ষণ বিধিমালা ২০২৩", "পরিবেশগত নিরূপণ, ব্যবস্থাপনা ও পর্যবেক্ষণ; দেখুন পরিবেশগত ও সামাজিক সুরক্ষা।"),
       "zh": ("保障", "《2023年环境保护规则》", "环境评价、管理和监测；详见环境与社会保障。")},
    ]),
    rich(("Management systems", "<p>DBEDC is working towards certification of its management systems for quality (ISO 9001), environment (ISO 14001), occupational health and safety (ISO 45001) and road traffic safety (ISO 39001). A certificate is listed here only once it has been issued by an accredited certification body.</p>"),
         ("ব্যবস্থাপনা পদ্ধতি", "<p>DBEDC তার মান (ISO 9001), পরিবেশ (ISO 14001), পেশাগত স্বাস্থ্য ও নিরাপত্তা (ISO 45001) এবং সড়ক ট্রাফিক নিরাপত্তা (ISO 39001) ব্যবস্থাপনা পদ্ধতির সনদ অর্জনের দিকে কাজ করছে। স্বীকৃত সনদ প্রদানকারী প্রতিষ্ঠান সনদ ইস্যু করার পরই কেবল তা এখানে তালিকাভুক্ত হয়।</p>"),
         ("管理体系", "<p>DBEDC正在推进质量（ISO 9001）、环境（ISO 14001）、职业健康安全（ISO 45001）和道路交通安全（ISO 39001）管理体系认证。证书仅在获认可认证机构颁发后才在此列出。</p>")),
    cta(("The corridor in detail", "Every bridge, toll plaza and interchange, with its chainage.", "Structures register", "project/structures", "Specifications", "project"),
        ("করিডোরের বিস্তারিত", "প্রতিটি সেতু, টোল প্লাজা ও ইন্টারচেঞ্জ, চেইনেজসহ।", "অবকাঠামো তালিকা", "project/structures", "বৈশিষ্ট্য", "project"),
        ("走廊详情", "每座桥梁、收费站和互通立交及其桩号。", "构造物清单", "project/structures", "技术指标", "project")),
  ],
})
