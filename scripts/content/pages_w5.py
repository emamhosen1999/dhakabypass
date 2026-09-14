# W5 — media, downloads & engagement.
from pages_w3 import header, rich, cards, cta

def doc(title, desc, file, ftype="", size=""):
    return {"title": title, "description": desc, "file": file, "fileType": ftype, "fileSize": size, "date": ""}

PAGES = []

def qa(q, a):
    return {"question": q, "answer": a}

PAGES.append({
  "slug": "faq",
  "titles": {"en": ("Frequently asked questions", "Answers to the questions road users ask most about the Dhaka Bypass Expressway."),
             "bn": ("সচরাচর জিজ্ঞাসা", "ঢাকা বাইপাস এক্সপ্রেসওয়ে সম্পর্কে সড়ক ব্যবহারকারীদের সবচেয়ে বেশি জিজ্ঞাসার উত্তর।"),
             "zh": ("常见问题", "道路使用者关于达卡绕城高速公路最常见问题的解答。")},
  "blocks": [
    header(("Help", "Frequently asked questions", "Short answers, with a link to the full information for each."),
           ("সহায়তা", "সচরাচর জিজ্ঞাসা", "সংক্ষিপ্ত উত্তর, প্রতিটির পূর্ণ তথ্যের লিংকসহ।"),
           ("帮助", "常见问题", "简要解答，并附完整信息链接。")),
    ("faq", {
      "en": {"heading": "", "intro": "", "showFilter": "yes", "items": [
        qa("Which parts of the expressway are open?", "<p>The sections open to traffic, and those still under construction, are shown on <a href=\"travel/status\">what's open</a>, which is updated as sections open.</p>"),
        qa("How much is the toll?", "<p>It depends on your vehicle class and where you join and leave. See <a href=\"travel/toll\">toll rates</a> and the fare calculator on that page.</p>"),
        qa("Can motorcycles and CNG auto-rickshaws use the expressway?", "<p>No. Motorcycles, three-wheelers and non-motorised vehicles are not allowed on the toll carriageways. See <a href=\"travel/rules\">rules of the road</a>.</p>"),
        qa("What is the speed limit?", "<p>80 km/h for cars, buses and microbuses and 50 km/h for trucks on the toll carriageways, unless signs show a lower limit. See <a href=\"travel/rules\">rules of the road</a>.</p>"),
        qa("How do I pay?", "<p>At the toll plaza when you join or leave the toll carriageway. See <a href=\"travel/payment\">paying the toll</a>.</p>"),
        qa("I think I was charged the wrong toll. What can I do?", "<p>Keep your receipt and raise a <a href=\"travel/toll-dispute\">toll dispute</a>. Any overcharge is refunded.</p>"),
        qa("My vehicle broke down. Who do I call?", "<p>The emergency number at the foot of every page. See <a href=\"travel/breakdown\">breakdown assistance</a> for what to do while you wait.</p>"),
        qa("I lost something on the expressway.", "<p>Report it on <a href=\"travel/lost-found\">lost and found</a>.</p>"),
        qa("Is any part of the road closed today?", "<p>Current and planned closures are listed on <a href=\"travel/advisories\">closures and advisories</a>, and the most serious one appears at the top of every page.</p>"),
        qa("How do I complain?", "<p>Through the <a href=\"grievances\">grievance form</a>. You get a tracking number and an answer within the published response time.</p>"),
        qa("Who owns the expressway?", "<p>The Government of Bangladesh. DBEDC builds, finances, operates and maintains it under a 25-year concession and then hands it back. See <a href=\"about/concession\">concession and financing</a>.</p>"),
        qa("How can I get information that is not on the website?", "<p>Make a request under the Right to Information Act 2009. See <a href=\"disclosures/right-to-information\">right to information</a>.</p>")]},
      "bn": {"heading": "", "intro": "", "showFilter": "yes", "items": [
        qa("এক্সপ্রেসওয়ের কোন অংশ খোলা?", "<p>যান চলাচলের জন্য খোলা এবং নির্মাণাধীন অংশগুলো <a href=\"travel/status\">কী খোলা আছে</a> পাতায় দেখানো হয়, যা অংশ খোলার সঙ্গে সঙ্গে হালনাগাদ হয়।</p>"),
        qa("টোল কত?", "<p>আপনার যানবাহনের শ্রেণি এবং কোথায় উঠবেন ও নামবেন তার ওপর নির্ভর করে। দেখুন <a href=\"travel/toll\">টোল হার</a> ও সেই পাতার ভাড়া হিসাবকারী।</p>"),
        qa("মোটরসাইকেল ও সিএনজি অটোরিকশা কি এক্সপ্রেসওয়ে ব্যবহার করতে পারে?", "<p>না। টোল সড়কে মোটরসাইকেল, থ্রি-হুইলার ও অযান্ত্রিক যানবাহন অনুমোদিত নয়। দেখুন <a href=\"travel/rules\">সড়ক বিধি</a>।</p>"),
        qa("গতিসীমা কত?", "<p>টোল সড়কে কার, বাস ও মাইক্রোবাসের জন্য ঘণ্টায় ৮০ কিমি এবং ট্রাকের জন্য ঘণ্টায় ৫০ কিমি, সাইনে কম সীমা দেখানো না থাকলে। দেখুন <a href=\"travel/rules\">সড়ক বিধি</a>।</p>"),
        qa("কীভাবে পরিশোধ করব?", "<p>টোল সড়কে ওঠার বা নামার সময় টোল প্লাজায়। দেখুন <a href=\"travel/payment\">টোল পরিশোধ</a>।</p>"),
        qa("মনে হচ্ছে ভুল টোল নেওয়া হয়েছে। কী করব?", "<p>রসিদ রাখুন এবং <a href=\"travel/toll-dispute\">টোল বিরোধ</a> জানান। বেশি নেওয়া অর্থ ফেরত দেওয়া হয়।</p>"),
        qa("গাড়ি বিকল হয়েছে। কাকে ফোন করব?", "<p>প্রতিটি পাতার নিচে দেওয়া জরুরি নম্বরে। অপেক্ষার সময় কী করবেন তা <a href=\"travel/breakdown\">বিকল যানবাহনে সহায়তা</a> পাতায় দেখুন।</p>"),
        qa("এক্সপ্রেসওয়েতে কিছু হারিয়েছি।", "<p><a href=\"travel/lost-found\">হারানো ও প্রাপ্তি</a> পাতায় জানান।</p>"),
        qa("আজ সড়কের কোনো অংশ বন্ধ কি?", "<p>চলমান ও পরিকল্পিত সড়ক বন্ধ <a href=\"travel/advisories\">সড়ক বন্ধ ও বিজ্ঞপ্তি</a> পাতায় তালিকাভুক্ত, এবং সবচেয়ে গুরুতরটি প্রতিটি পাতার ওপরে দেখানো হয়।</p>"),
        qa("কীভাবে অভিযোগ করব?", "<p><a href=\"grievances\">অভিযোগ ফরমের</a> মাধ্যমে। আপনি একটি ট্র্যাকিং নম্বর এবং প্রকাশিত সময়ের মধ্যে উত্তর পাবেন।</p>"),
        qa("এক্সপ্রেসওয়ের মালিক কে?", "<p>বাংলাদেশ সরকার। DBEDC ২৫ বছরের কনসেশনের আওতায় এটি নির্মাণ, অর্থায়ন, পরিচালনা ও রক্ষণাবেক্ষণ করে এবং পরে ফেরত দেয়। দেখুন <a href=\"about/concession\">কনসেশন ও অর্থায়ন</a>।</p>"),
        qa("ওয়েবসাইটে নেই এমন তথ্য কীভাবে পাব?", "<p>তথ্য অধিকার আইন ২০০৯-এর অধীনে অনুরোধ করুন। দেখুন <a href=\"disclosures/right-to-information\">তথ্য অধিকার</a>।</p>")]},
      "zh": {"heading": "", "intro": "", "showFilter": "yes", "items": [
        qa("快速路哪些路段已通车？", "<p>已通车和在建路段见<a href=\"travel/status\">通车路段</a>页面，随路段通车及时更新。</p>"),
        qa("通行费是多少？", "<p>取决于车型以及驶入和驶出的位置。详见<a href=\"travel/toll\">通行费标准</a>及该页面的费用计算器。</p>"),
        qa("摩托车和CNG三轮车可以使用快速路吗？", "<p>不可以。收费车道禁止摩托车、三轮车和非机动车通行。详见<a href=\"travel/rules\">道路规则</a>。</p>"),
        qa("限速是多少？", "<p>收费车道上轿车、客车和面包车限速80公里/小时，货车50公里/小时，另有标志的除外。详见<a href=\"travel/rules\">道路规则</a>。</p>"),
        qa("如何缴费？", "<p>驶入或驶出收费车道时在收费站缴费。详见<a href=\"travel/payment\">缴纳通行费</a>。</p>"),
        qa("我认为收费有误，怎么办？", "<p>保留票据并提出<a href=\"travel/toll-dispute\">收费争议</a>。多收部分将予退还。</p>"),
        qa("车辆发生故障，该打谁的电话？", "<p>拨打每页底部的紧急电话。等待期间的注意事项见<a href=\"travel/breakdown\">故障救援</a>。</p>"),
        qa("我在快速路上丢了东西。", "<p>请在<a href=\"travel/lost-found\">失物招领</a>页面报告。</p>"),
        qa("今天有路段封闭吗？", "<p>当前及计划中的封闭见<a href=\"travel/advisories\">封闭与通告</a>，最重要的一条会显示在每个页面顶部。</p>"),
        qa("如何投诉？", "<p>通过<a href=\"grievances\">投诉表单</a>。您将获得跟踪编号，并在公布的时限内得到答复。</p>"),
        qa("快速路归谁所有？", "<p>归孟加拉国政府所有。DBEDC依据25年特许经营协议负责建设、融资、运营和养护，期满后移交。详见<a href=\"about/concession\">特许经营与融资</a>。</p>"),
        qa("如何获取网站上没有的信息？", "<p>依据《2009年信息权法》提出申请。详见<a href=\"disclosures/right-to-information\">信息公开</a>。</p>")]},
    }),
    cta(("Still need help?", "Send a question and it will be answered.", "Contact DBEDC", "contact", "Search the site", "search"),
        ("আরও সাহায্য প্রয়োজন?", "প্রশ্ন পাঠান, উত্তর দেওয়া হবে।", "যোগাযোগ", "contact", "সাইটে খুঁজুন", "search"),
        ("仍需帮助？", "提交问题，我们将予以答复。", "联系DBEDC", "contact", "搜索本站", "search")),
  ],
})

PAGES.append({
  "slug": "downloads",
  "titles": {"en": ("Downloads", "Maps, route data, logos and printable information about the Dhaka Bypass Expressway."),
             "bn": ("ডাউনলোড", "ঢাকা বাইপাস এক্সপ্রেসওয়ের মানচিত্র, রুটের ডেটা, লোগো ও প্রিন্টযোগ্য তথ্য।"),
             "zh": ("下载", "达卡绕城高速公路地图、路线数据、标识及可打印资料。")},
  "blocks": [
    header(("Resources", "Downloads", "Files you can save, print or use — with their size, so you know what a download will cost before you tap it."),
           ("সম্পদ", "ডাউনলোড", "যেসব ফাইল সংরক্ষণ, প্রিন্ট বা ব্যবহার করতে পারেন — আকারসহ, যাতে ট্যাপ করার আগেই জানেন ডাউনলোডে কত খরচ হবে।"),
           ("资源", "下载", "可保存、打印或使用的文件——附文件大小，下载前即可了解流量消耗。")),
    ("document-list", {
      "en": {"heading": "Maps and route data", "intro": "", "documents": [
        doc("Corridor map", "The expressway and the roads around it, for printing at large sizes.", "/maps/corridor-geography.svg", "SVG", "3.6 MB"),
        doc("Corridor alignment", "The centreline of the expressway as geographic data, for GIS and mapping applications.", "/maps/corridor-alignment.geojson", "GeoJSON", "4 KB"),
        doc("Surrounding road network", "The roads that cross and connect to the corridor, from OpenStreetMap (© OpenStreetMap contributors, ODbL).", "/maps/corridor-geography.geojson", "GeoJSON", "13.7 MB")]},
      "bn": {"heading": "মানচিত্র ও রুটের ডেটা", "intro": "", "documents": [
        doc("করিডোরের মানচিত্র", "এক্সপ্রেসওয়ে ও চারপাশের সড়ক, বড় আকারে প্রিন্টের জন্য।", "/maps/corridor-geography.svg", "SVG", "৩.৬ মেগাবাইট"),
        doc("করিডোরের অ্যালাইনমেন্ট", "জিআইএস ও মানচিত্র অ্যাপ্লিকেশনের জন্য ভৌগোলিক ডেটা হিসেবে এক্সপ্রেসওয়ের কেন্দ্ররেখা।", "/maps/corridor-alignment.geojson", "GeoJSON", "৪ কিলোবাইট"),
        doc("আশপাশের সড়ক নেটওয়ার্ক", "করিডোর অতিক্রমকারী ও সংযুক্ত সড়ক, ওপেনস্ট্রিটম্যাপ থেকে (© OpenStreetMap contributors, ODbL)।", "/maps/corridor-geography.geojson", "GeoJSON", "১৩.৭ মেগাবাইট")]},
      "zh": {"heading": "地图与路线数据", "intro": "", "documents": [
        doc("走廊地图", "快速路及周边道路，适合大尺寸打印。", "/maps/corridor-geography.svg", "SVG", "3.6 MB"),
        doc("走廊线位", "快速路中心线地理数据，适用于GIS和地图应用。", "/maps/corridor-alignment.geojson", "GeoJSON", "4 KB"),
        doc("周边路网", "与走廊相交和连接的道路，数据来自OpenStreetMap（© OpenStreetMap contributors，ODbL）。", "/maps/corridor-geography.geojson", "GeoJSON", "13.7 MB")]},
    }),
    ("document-list", {
      "en": {"heading": "Printable information", "intro": "Each of these pages prints cleanly from your browser.", "documents": [
        doc("Toll rate card", "Rates in force by vehicle class; use Print on the page.", "travel/toll", "Web page"),
        doc("Rules of the road", "Speed limits, prohibited vehicles and conduct.", "travel/rules", "Web page"),
        doc("Breakdown procedure", "What to do if your vehicle breaks down.", "travel/breakdown", "Web page")]},
      "bn": {"heading": "প্রিন্টযোগ্য তথ্য", "intro": "এই পাতাগুলো ব্রাউজার থেকে পরিষ্কারভাবে প্রিন্ট হয়।", "documents": [
        doc("টোল হারের কার্ড", "যানবাহন শ্রেণি অনুযায়ী কার্যকর হার; পাতার প্রিন্ট বোতাম ব্যবহার করুন।", "travel/toll", "ওয়েব পাতা"),
        doc("সড়ক বিধি", "গতিসীমা, নিষিদ্ধ যানবাহন ও আচরণ।", "travel/rules", "ওয়েব পাতা"),
        doc("বিকল হলে করণীয়", "গাড়ি বিকল হলে কী করবেন।", "travel/breakdown", "ওয়েব পাতা")]},
      "zh": {"heading": "可打印资料", "intro": "以下页面可直接从浏览器清晰打印。", "documents": [
        doc("通行费卡", "按车型列出的现行费率；请使用页面上的打印按钮。", "travel/toll", "网页"),
        doc("道路规则", "限速、禁行车辆及行驶规范。", "travel/rules", "网页"),
        doc("故障处置流程", "车辆故障时的处置方法。", "travel/breakdown", "网页")]},
    }),
    ("document-list", {
      "en": {"heading": "Logos", "intro": "For use in news reporting; see the media page for how the marks may be used.", "documents": [
        doc("DBEDC logo", "Full logo, PNG with transparent background.", "/brand/dbedc.png", "PNG", "148 KB"),
        doc("DBEDC emblem", "The emblem alone, for small spaces.", "/brand/dbedc-mark.png", "PNG", "102 KB")]},
      "bn": {"heading": "লোগো", "intro": "সংবাদ প্রতিবেদনে ব্যবহারের জন্য; চিহ্নগুলো কীভাবে ব্যবহার করা যাবে তা মিডিয়া পাতায় দেখুন।", "documents": [
        doc("DBEDC লোগো", "পূর্ণ লোগো, স্বচ্ছ পটভূমির PNG।", "/brand/dbedc.png", "PNG", "১৪৮ কিলোবাইট"),
        doc("DBEDC প্রতীক", "শুধু প্রতীক, ছোট জায়গার জন্য।", "/brand/dbedc-mark.png", "PNG", "১০২ কিলোবাইট")]},
      "zh": {"heading": "标识", "intro": "供新闻报道使用；标识使用规范见媒体页面。", "documents": [
        doc("DBEDC标识", "完整标识，透明背景PNG。", "/brand/dbedc.png", "PNG", "148 KB"),
        doc("DBEDC徽标", "单独徽标，适用于小尺寸场景。", "/brand/dbedc-mark.png", "PNG", "102 KB")]},
    }),
  ],
})

PAGES.append({
  "slug": "media",
  "titles": {"en": ("Media", "Press contact, a fact sheet, logos and the rules for using them, for journalists covering the Dhaka Bypass Expressway."),
             "bn": ("মিডিয়া", "ঢাকা বাইপাস এক্সপ্রেসওয়ে নিয়ে কাজ করা সাংবাদিকদের জন্য প্রেস যোগাযোগ, তথ্যপত্র, লোগো ও তার ব্যবহারবিধি।"),
             "zh": ("媒体", "为报道达卡绕城高速公路的记者提供媒体联系方式、概况资料、标识及使用规范。")},
  "blocks": [
    header(("Resources", "Media", "For journalists: who to contact, the essential facts, and material you may use."),
           ("সম্পদ", "মিডিয়া", "সাংবাদিকদের জন্য: কার সঙ্গে যোগাযোগ করবেন, মূল তথ্য এবং ব্যবহারযোগ্য উপকরণ।"),
           ("资源", "媒体", "面向记者：联系人、基本事实及可使用的素材。")),
    ("stat-row", {
      "en": {"stats": [{"source": "corridor-published-length", "unit": "km", "label": "Corridor length"}, {"source": "corridor-open-length", "unit": "km", "label": "Open to traffic"}, {"source": "interchange-count", "unit": "", "label": "Interchanges, plazas and structures"}, {"source": "toll-class-count", "unit": "", "label": "Vehicle classes tolled"}]},
      "bn": {"stats": [{"source": "corridor-published-length", "unit": "কিমি", "label": "করিডোরের দৈর্ঘ্য"}, {"source": "corridor-open-length", "unit": "কিমি", "label": "যান চলাচলের জন্য খোলা"}, {"source": "interchange-count", "unit": "", "label": "ইন্টারচেঞ্জ, প্লাজা ও অবকাঠামো"}, {"source": "toll-class-count", "unit": "", "label": "টোলভুক্ত যানবাহন শ্রেণি"}]},
      "zh": {"stats": [{"source": "corridor-published-length", "unit": "公里", "label": "走廊全长"}, {"source": "corridor-open-length", "unit": "公里", "label": "已通车里程"}, {"source": "interchange-count", "unit": "", "label": "互通、收费站及构造物"}, {"source": "toll-class-count", "unit": "", "label": "收费车型数"}]},
    }),
    rich(("About DBEDC — for publication", "<p>Dhaka Bypass Expressway Development Company Limited (DBEDC) is the concession company for the Dhaka Bypass Expressway, an access-controlled toll road around the eastern side of Dhaka between Joydebpur in Gazipur and Madanpur in Narayanganj, linking the N1, N2, N3 and N4 national highways. It is Bangladesh's first road project delivered as a public–private partnership, under a 25-year design, build, finance, operate, maintain and transfer concession granted by the Roads and Highways Department in December 2018. DBEDC's shareholders are Sichuan Road &amp; Bridge Group, Shamim Enterprise Ltd and UDC Construction Ltd.</p>"),
         ("DBEDC সম্পর্কে — প্রকাশের জন্য", "<p>ঢাকা বাইপাস এক্সপ্রেসওয়ে ডেভেলপমেন্ট কোম্পানি লিমিটেড (DBEDC) ঢাকা বাইপাস এক্সপ্রেসওয়ের কনসেশন কোম্পানি। এক্সপ্রেসওয়েটি গাজীপুরের জয়দেবপুর থেকে নারায়ণগঞ্জের মদনপুর পর্যন্ত ঢাকার পূর্ব দিক ঘিরে একটি নিয়ন্ত্রিত-প্রবেশ টোল সড়ক, যা N1, N2, N3 ও N4 জাতীয় মহাসড়ককে যুক্ত করে। এটি বাংলাদেশে সরকারি-বেসরকারি অংশীদারিত্বে বাস্তবায়িত প্রথম সড়ক প্রকল্প, যা ডিসেম্বর ২০১৮-এ সড়ক ও জনপথ অধিদপ্তর প্রদত্ত ২৫ বছরের নকশা, নির্মাণ, অর্থায়ন, পরিচালনা, রক্ষণাবেক্ষণ ও হস্তান্তর কনসেশনের আওতায় চলছে। DBEDC-এর শেয়ারহোল্ডার সিচুয়ান রোড অ্যান্ড ব্রিজ গ্রুপ, শামীম এন্টারপ্রাইজ লিমিটেড ও ইউডিসি কনস্ট্রাকশন লিমিটেড।</p>"),
         ("关于DBEDC——供发布", "<p>达卡绕城高速公路开发有限公司（DBEDC）是达卡绕城高速公路的特许经营公司。该快速路是一条环绕达卡东侧的封闭式收费公路，北起加济普尔的Joydebpur，南至纳拉扬甘杰的Madanpur，连接N1、N2、N3和N4国道。它是孟加拉国首个以政府与社会资本合作模式实施的公路项目，依据孟加拉国公路局于2018年12月授予的25年设计、建设、融资、运营、维护、移交特许经营权实施。DBEDC的股东为四川路桥集团、Shamim Enterprise Ltd和UDC Construction Ltd。</p>")),
    rich(("Press enquiries", "<p>Send enquiries through the <a href=\"contact\">contact form</a> with the subject “Media”, giving your publication and deadline. Requests to film or photograph on the expressway need written permission in advance: stopping on the carriageway is prohibited for everyone, including crews.</p>"),
         ("প্রেস জিজ্ঞাসা", "<p><a href=\"contact\">যোগাযোগ ফরমে</a> “মিডিয়া” বিষয় বেছে আপনার প্রতিষ্ঠান ও সময়সীমা উল্লেখ করে জিজ্ঞাসা পাঠান। এক্সপ্রেসওয়েতে ভিডিও বা ছবি ধারণের জন্য আগে লিখিত অনুমতি প্রয়োজন: ক্যারেজওয়েতে থামা সবার জন্য নিষিদ্ধ, ক্রুসহ।</p>"),
         ("媒体咨询", "<p>请通过<a href=\"contact\">联系表单</a>选择“媒体”主题提交咨询，并注明所属媒体和截稿时间。在快速路上拍摄视频或照片须事先取得书面许可：任何人（包括摄制组）均不得在车道上停车。</p>")),
    rich(("Using our logo and photographs", "<ul><li>The DBEDC logo may be used to identify DBEDC in news reporting. Do not change its colours or proportions, add effects, or place it on a busy background.</li><li>Do not use the logo in a way that suggests DBEDC endorses a product, service or organisation.</li><li>Photographs from the <a href=\"gallery\">gallery</a> may be used in news reporting about the expressway, credited “DBEDC”.</li></ul><p>Logos are on the <a href=\"downloads\">downloads</a> page.</p>"),
         ("আমাদের লোগো ও ছবি ব্যবহার", "<ul><li>সংবাদ প্রতিবেদনে DBEDC-কে চিহ্নিত করতে DBEDC লোগো ব্যবহার করা যাবে। এর রং বা অনুপাত পরিবর্তন, ইফেক্ট যোগ বা ব্যস্ত পটভূমিতে স্থাপন করবেন না।</li><li>DBEDC কোনো পণ্য, সেবা বা প্রতিষ্ঠানকে সমর্থন করে এমন ধারণা দেয় এমনভাবে লোগো ব্যবহার করবেন না।</li><li><a href=\"gallery\">গ্যালারির</a> ছবি এক্সপ্রেসওয়ে বিষয়ক সংবাদে “DBEDC” কৃতিত্ব দিয়ে ব্যবহার করা যাবে।</li></ul><p>লোগো <a href=\"downloads\">ডাউনলোড</a> পাতায় আছে।</p>"),
         ("标识和图片使用", "<ul><li>DBEDC标识可在新闻报道中用于指代DBEDC。不得更改其颜色或比例、添加效果或置于杂乱背景上。</li><li>不得以暗示DBEDC为任何产品、服务或机构背书的方式使用标识。</li><li><a href=\"gallery\">图片库</a>中的照片可用于有关快速路的新闻报道，署名“DBEDC”。</li></ul><p>标识文件见<a href=\"downloads\">下载</a>页面。</p>")),
    ("news-list", {"en": {"heading": "Press releases", "intro": "", "category": "Press release", "limit": 12, "emptyMessage": "There are no press releases yet."},
                   "bn": {"heading": "প্রেস বিজ্ঞপ্তি", "intro": "", "category": "Press release", "limit": 12, "emptyMessage": "এখনও কোনো প্রেস বিজ্ঞপ্তি নেই।"},
                   "zh": {"heading": "新闻稿", "intro": "", "category": "Press release", "limit": 12, "emptyMessage": "暂无新闻稿。"}}),
  ],
})

PAGES.append({
  "slug": "press-releases",
  "titles": {"en": ("Press releases", "DBEDC's press releases, newest first."),
             "bn": ("প্রেস বিজ্ঞপ্তি", "DBEDC-এর প্রেস বিজ্ঞপ্তি, নতুনগুলো আগে।"),
             "zh": ("新闻稿", "DBEDC新闻稿，按时间倒序排列。")},
  "blocks": [
    header(("Newsroom", "Press releases", "Official statements issued by DBEDC, kept as a dated archive."),
           ("সংবাদকক্ষ", "প্রেস বিজ্ঞপ্তি", "DBEDC-এর জারি করা দাপ্তরিক বিবৃতি, তারিখসহ সংরক্ষিত।"),
           ("新闻中心", "新闻稿", "DBEDC发布的官方声明，按日期存档。")),
    ("news-list", {"en": {"heading": "", "intro": "", "category": "Press release", "limit": 100, "showFilter": "no", "emptyMessage": "There are no press releases yet."},
                   "bn": {"heading": "", "intro": "", "category": "Press release", "limit": 100, "showFilter": "no", "emptyMessage": "এখনও কোনো প্রেস বিজ্ঞপ্তি নেই।"},
                   "zh": {"heading": "", "intro": "", "category": "Press release", "limit": 100, "showFilter": "no", "emptyMessage": "暂无新闻稿。"}}),
  ],
})

PAGES.append({
  "slug": "project/structures",
  "titles": {"en": ("Structures register", "Every interchange, toll plaza and bridge on the Dhaka Bypass Expressway, with its chainage and status."),
             "bn": ("অবকাঠামো তালিকা", "ঢাকা বাইপাস এক্সপ্রেসওয়ের প্রতিটি ইন্টারচেঞ্জ, টোল প্লাজা ও সেতু, চেইনেজ ও অবস্থাসহ।"),
             "zh": ("构造物清单", "达卡绕城高速公路每座互通立交、收费站和桥梁及其桩号和状态。")},
  "blocks": [
    header(("The project", "Structures register", "The corridor's interchanges, toll plazas and bridges, north to south, from the corridor records."),
           ("প্রকল্প", "অবকাঠামো তালিকা", "করিডোরের রেকর্ড অনুযায়ী উত্তর থেকে দক্ষিণে ইন্টারচেঞ্জ, টোল প্লাজা ও সেতু।"),
           ("项目概况", "构造物清单", "根据走廊记录，由北向南列出互通立交、收费站和桥梁。")),
    ("interchange-table", {"en": {"heading": "", "intro": "", "caption": "Structures along the corridor", "sort": "chainage", "limit": 0, "linkLabel": "", "linkHref": "", "emptyMessage": ""},
                           "bn": {"heading": "", "intro": "", "caption": "করিডোর বরাবর অবকাঠামো", "sort": "chainage", "limit": 0, "linkLabel": "", "linkHref": "", "emptyMessage": ""},
                           "zh": {"heading": "", "intro": "", "caption": "走廊沿线构造物", "sort": "chainage", "limit": 0, "linkLabel": "", "linkHref": "", "emptyMessage": ""}}),
    ("corridor-map", {"en": {"heading": "On the map", "intro": "", "showLegend": "yes"}, "bn": {"heading": "মানচিত্রে", "intro": "", "showLegend": "yes"}, "zh": {"heading": "地图", "intro": "", "showLegend": "yes"}}),
  ],
})

PAGES.append({
  "slug": "safety/education",
  "titles": {"en": ("Road safety education", "Safe driving on an expressway: speed, following distance, fatigue, lane discipline and what never to do."),
             "bn": ("সড়ক নিরাপত্তা শিক্ষা", "এক্সপ্রেসওয়েতে নিরাপদে গাড়ি চালানো: গতি, দূরত্ব, ক্লান্তি, লেন শৃঙ্খলা এবং কখনো যা করবেন না।"),
             "zh": ("道路安全教育", "高速公路安全驾驶：车速、跟车距离、疲劳驾驶、车道纪律及绝对禁止的行为。")},
  "blocks": [
    header(("Safety", "Road safety education", "An expressway is faster and safer than an ordinary road — for drivers who treat it differently. Most serious crashes on expressways come from a few avoidable mistakes."),
           ("নিরাপত্তা", "সড়ক নিরাপত্তা শিক্ষা", "এক্সপ্রেসওয়ে সাধারণ সড়কের চেয়ে দ্রুত ও নিরাপদ — যারা এটিকে ভিন্নভাবে ব্যবহার করেন তাদের জন্য। এক্সপ্রেসওয়ের বেশির ভাগ গুরুতর দুর্ঘটনা কয়েকটি এড়ানো সম্ভব ভুল থেকে ঘটে।"),
           ("安全", "道路安全教育", "高速公路比普通道路更快、更安全——前提是驾驶人区别对待。高速公路上大多数严重事故源于少数可避免的错误。")),
    cards({"en": "Six habits that prevent crashes", "bn": "দুর্ঘটনা প্রতিরোধের ছয়টি অভ্যাস", "zh": "预防事故的六个习惯"}, None, [
      {"en": ("1", "Keep your distance", "At expressway speed a car needs far longer to stop than drivers expect. Leave at least a three-second gap to the vehicle ahead, and more in rain or fog."),
       "bn": ("১", "দূরত্ব বজায় রাখুন", "এক্সপ্রেসওয়ের গতিতে গাড়ি থামাতে চালকদের ধারণার চেয়ে অনেক বেশি পথ লাগে। সামনের যানবাহন থেকে কমপক্ষে তিন সেকেন্ডের দূরত্ব রাখুন, বৃষ্টি বা কুয়াশায় আরও বেশি।"),
       "zh": ("1", "保持车距", "在高速公路车速下，制动距离远超驾驶人预期。与前车至少保持三秒间隔，雨雾天气应更大。")},
      {"en": ("2", "Keep to the limit", "The speed limit is a maximum, not a target. Slow down where signs show a lower limit — at plazas, interchanges and works."),
       "bn": ("২", "গতিসীমা মানুন", "গতিসীমা সর্বোচ্চ সীমা, লক্ষ্য নয়। সাইনে কম সীমা দেখানো জায়গায় — প্লাজা, ইন্টারচেঞ্জ ও কাজের এলাকায় — গতি কমান।"),
       "zh": ("2", "遵守限速", "限速是上限而非目标。在标志显示更低限速的地方——收费站、互通立交和施工区——应减速。")},
      {"en": ("3", "Stay awake", "Fatigue causes crashes that happen without braking. Stop at a safe place every two hours, and never drive when drowsy."),
       "bn": ("৩", "সজাগ থাকুন", "ক্লান্তির কারণে এমন দুর্ঘটনা ঘটে যেখানে ব্রেকই চাপা হয় না। প্রতি দুই ঘণ্টায় নিরাপদ জায়গায় থামুন, ঘুম ঘুম ভাব নিয়ে কখনো চালাবেন না।"),
       "zh": ("3", "保持清醒", "疲劳会导致来不及制动的事故。每两小时在安全地点休息一次，困倦时切勿驾驶。")},
      {"en": ("4", "Use lanes properly", "Keep left unless overtaking; overtake on the right only; signal early; never weave between lanes."),
       "bn": ("৪", "লেন সঠিকভাবে ব্যবহার করুন", "ওভারটেক ছাড়া বাম দিকে থাকুন; শুধু ডান দিক দিয়ে ওভারটেক করুন; আগে সংকেত দিন; কখনো লেনের মধ্যে এঁকেবেঁকে চালাবেন না।"),
       "zh": ("4", "规范使用车道", "除超车外靠左行驶；只从右侧超车；提前打转向灯；切勿频繁变道穿插。")},
      {"en": ("5", "Everyone belted", "Every person in the vehicle wears a seat belt, front and back. Children travel in the back."),
       "bn": ("৫", "সবাই সিটবেল্ট পরুন", "গাড়ির সামনে-পেছনে প্রত্যেকে সিটবেল্ট পরবেন। শিশুরা পেছনে বসবে।"),
       "zh": ("5", "全员系安全带", "车内前后排所有人均须系好安全带。儿童乘坐后排。")},
      {"en": ("6", "Phone away", "Using a hand-held phone while driving is an offence and takes your eyes off the road for seconds that matter."),
       "bn": ("৬", "ফোন দূরে রাখুন", "গাড়ি চালানোর সময় হাতে ফোন ব্যবহার অপরাধ এবং গুরুত্বপূর্ণ কয়েক সেকেন্ড আপনার চোখ সড়ক থেকে সরিয়ে দেয়।"),
       "zh": ("6", "放下手机", "驾驶时手持使用手机属于违法行为，会让您的视线在关键几秒内离开道路。")},
    ]),
    rich(("Never on an expressway", "<ul><li>Never stop on the carriageway, reverse, or make a U-turn.</li><li>Never walk on the carriageway or cross it on foot.</li><li>Never pick up or set down passengers except at a proper bus stop off the expressway.</li><li>Never drive a motorcycle, three-wheeler or non-motorised vehicle onto the toll carriageways.</li></ul>"),
         ("এক্সপ্রেসওয়েতে কখনো নয়", "<ul><li>ক্যারেজওয়েতে কখনো থামবেন না, পেছনে যাবেন না বা ইউ-টার্ন নেবেন না।</li><li>ক্যারেজওয়েতে কখনো হাঁটবেন না বা পায়ে হেঁটে পার হবেন না।</li><li>এক্সপ্রেসওয়ের বাইরে নির্ধারিত বাসস্টপ ছাড়া যাত্রী ওঠানামা করাবেন না।</li><li>টোল সড়কে মোটরসাইকেল, থ্রি-হুইলার বা অযান্ত্রিক যানবাহন চালাবেন না।</li></ul>"),
         ("高速公路上绝对禁止", "<ul><li>禁止在车道上停车、倒车或掉头。</li><li>禁止在车道上行走或步行横穿。</li><li>禁止在快速路外正规公交站以外的地点上下客。</li><li>禁止驾驶摩托车、三轮车或非机动车驶入收费车道。</li></ul>")),
    rich(("For schools and communities", "<p>Schools, driver training centres and community groups near the corridor can ask for a road-safety session on crossing safely near the expressway and on expressway driving. Ask through the <a href=\"contact\">contact form</a> with the subject “Road safety session”.</p>"),
         ("বিদ্যালয় ও জনগোষ্ঠীর জন্য", "<p>করিডোরের কাছের বিদ্যালয়, চালক প্রশিক্ষণ কেন্দ্র ও সামাজিক সংগঠন এক্সপ্রেসওয়ের কাছে নিরাপদে পারাপার ও এক্সপ্রেসওয়েতে গাড়ি চালানো নিয়ে সড়ক নিরাপত্তা সেশনের অনুরোধ করতে পারে। <a href=\"contact\">যোগাযোগ ফরমে</a> “সড়ক নিরাপত্তা সেশন” বিষয় বেছে অনুরোধ করুন।</p>"),
         ("面向学校和社区", "<p>走廊附近的学校、驾驶培训机构和社区团体可申请道路安全讲座，内容包括快速路附近安全过街和高速公路驾驶。请通过<a href=\"contact\">联系表单</a>选择“道路安全讲座”主题申请。</p>")),
  ],
})

PAGES.append({
  "slug": "search",
  "titles": {"en": ("Search", "Search the Dhaka Bypass Expressway website."),
             "bn": ("অনুসন্ধান", "ঢাকা বাইপাস এক্সপ্রেসওয়ে ওয়েবসাইটে খুঁজুন।"),
             "zh": ("搜索", "搜索达卡绕城高速公路网站。")},
  "blocks": [
    header(("", "Search", ""), ("", "অনুসন্ধান", ""), ("", "搜索", "")),
    ("site-search", {"en": {"heading": "", "intro": "", "limit": 30}, "bn": {"heading": "", "intro": "", "limit": 30}, "zh": {"heading": "", "intro": "", "limit": 30}}),
  ],
})

PAGES.append({
  "slug": "sitemap",
  "titles": {"en": ("Site map", "Every page on the Dhaka Bypass Expressway website."),
             "bn": ("সাইট ম্যাপ", "ঢাকা বাইপাস এক্সপ্রেসওয়ে ওয়েবসাইটের প্রতিটি পাতা।"),
             "zh": ("网站地图", "达卡绕城高速公路网站所有页面。")},
  "blocks": [
    header(("", "Site map", "Every published page, grouped by section."), ("", "সাইট ম্যাপ", "প্রকাশিত প্রতিটি পাতা, বিভাগ অনুযায়ী।"), ("", "网站地图", "所有已发布页面，按栏目分组。")),
    ("sitemap-list", {"en": {"heading": "", "intro": "", "group": "sections"}, "bn": {"heading": "", "intro": "", "group": "sections"}, "zh": {"heading": "", "intro": "", "group": "sections"}}),
  ],
})
