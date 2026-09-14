# W4 — road-user services.
from pages_w3 import header, rich, cards, cta

def subnav():
    return ("section-subnav", {l: {"menu": "travel"} for l in ("en", "bn", "zh")})

def form(kind, en, bn, zh):
    base = {"kind": kind, "slaDays": 0}
    return ("request-form", {"en": {**base, "heading": en[0], "intro": en[1], "successNote": en[2]},
                             "bn": {**base, "heading": bn[0], "intro": bn[1], "successNote": bn[2]},
                             "zh": {**base, "heading": zh[0], "intro": zh[1], "successNote": zh[2]}})

PAGES = []

PAGES.append({
  "slug": "travel/vehicle-classes",
  "titles": {"en": ("Vehicle classes", "Which toll class your vehicle is in, the edge cases, and the vehicles not allowed on the expressway."),
             "bn": ("যানবাহনের শ্রেণি", "আপনার যানবাহন কোন টোল শ্রেণিতে পড়ে, সীমান্তবর্তী ক্ষেত্র এবং এক্সপ্রেসওয়েতে অনুমোদিত নয় এমন যানবাহন।"),
             "zh": ("车型分类", "您的车辆属于哪个收费类别、特殊情况以及禁止驶入快速路的车辆。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Vehicle classes", "The toll depends on the class of your vehicle. The class is decided by the vehicle's type, size and axles, as recorded on its registration."),
           ("ভ্রমণ তথ্য", "যানবাহনের শ্রেণি", "টোল নির্ভর করে আপনার যানবাহনের শ্রেণির ওপর। শ্রেণি নির্ধারিত হয় নিবন্ধনে লিপিবদ্ধ যানবাহনের ধরন, আকার ও এক্সেল অনুযায়ী।"),
           ("出行信息", "车型分类", "通行费取决于车辆类别。类别按行驶证登记的车辆类型、尺寸和轴数确定。")),
    cards({"en": "Which class am I?", "bn": "আমার শ্রেণি কোনটি?", "zh": "我属于哪一类？"},
          {"en": "The amount for each class is on the toll rates page; the descriptions below help you find your class.", "bn": "প্রতিটি শ্রেণির টোল টোল হার পাতায় আছে; নিচের বর্ণনা আপনার শ্রেণি খুঁজে পেতে সাহায্য করবে।", "zh": "各类别收费金额见通行费标准页面；以下说明帮助您确定所属类别。"}, [
      {"en": ("Light", "Cars and SUVs", "Private cars, jeeps and sport-utility vehicles, including taxis and ride-hailing cars."),
       "bn": ("হালকা", "কার ও এসইউভি", "ব্যক্তিগত গাড়ি, জিপ ও স্পোর্ট ইউটিলিটি যান, ট্যাক্সি ও রাইড শেয়ারিং গাড়িসহ।"),
       "zh": ("轻型", "轿车和SUV", "私家车、吉普车和运动型多用途车，包括出租车和网约车。")},
      {"en": ("Light", "Microbuses and pick-ups", "Microbuses, pick-up vans, and light utility vehicles such as wreckers."),
       "bn": ("হালকা", "মাইক্রোবাস ও পিকআপ", "মাইক্রোবাস, পিকআপ ভ্যান এবং রেকারের মতো হালকা ইউটিলিটি যান।"),
       "zh": ("轻型", "面包车和皮卡", "面包车、皮卡以及清障车等轻型多用途车辆。")},
      {"en": ("Passenger", "Minibuses and coasters", "Buses with up to 30 seats."),
       "bn": ("যাত্রীবাহী", "মিনিবাস ও কোস্টার", "৩০ আসন পর্যন্ত বাস।"),
       "zh": ("客车", "中巴和考斯特", "30座及以下客车。")},
      {"en": ("Passenger", "Large buses", "Buses with 31 or more seats, including double-deckers."),
       "bn": ("যাত্রীবাহী", "বড় বাস", "৩১ বা তার বেশি আসনের বাস, দোতলা বাসসহ।"),
       "zh": ("客车", "大型客车", "31座及以上客车，包括双层巴士。")},
      {"en": ("Goods", "Small trucks", "Two-axle trucks up to about 3 tonnes laden."),
       "bn": ("পণ্যবাহী", "ছোট ট্রাক", "বোঝাই অবস্থায় প্রায় ৩ টন পর্যন্ত দুই এক্সেলের ট্রাক।"),
       "zh": ("货车", "小型货车", "满载约3吨以内的两轴货车。")},
      {"en": ("Goods", "Medium trucks", "Two-axle trucks of about 5 to 7 tonnes laden."),
       "bn": ("পণ্যবাহী", "মাঝারি ট্রাক", "বোঝাই অবস্থায় প্রায় ৫ থেকে ৭ টনের দুই এক্সেলের ট্রাক।"),
       "zh": ("货车", "中型货车", "满载约5至7吨的两轴货车。")},
      {"en": ("Goods", "Heavy trucks", "Trucks with two or three axles over about 7 tonnes laden."),
       "bn": ("পণ্যবাহী", "ভারী ট্রাক", "বোঝাই অবস্থায় প্রায় ৭ টনের বেশি দুই বা তিন এক্সেলের ট্রাক।"),
       "zh": ("货车", "重型货车", "满载约7吨以上的两轴或三轴货车。")},
      {"en": ("Goods", "Trailers and articulated trucks", "Prime movers with trailers, and trucks with more than three axles."),
       "bn": ("পণ্যবাহী", "ট্রেইলার ও আর্টিকুলেটেড ট্রাক", "ট্রেইলারসহ প্রাইম মুভার এবং তিনের বেশি এক্সেলের ট্রাক।"),
       "zh": ("货车", "拖挂车和铰接式货车", "带挂车的牵引车，以及三轴以上货车。")},
    ]),
    rich(("Edge cases", "<ul><li><strong>Covered vans</strong> are classed as trucks by their axles and laden weight, not by their shape.</li><li><strong>A vehicle towing another</strong> pays for each vehicle; a vehicle towed by the patrol after a breakdown does not pay.</li><li><strong>Emergency vehicles on duty</strong> — ambulances and fire service vehicles — pass without charge, as do other vehicles exempted by government notification.</li><li><strong>If you think you were placed in the wrong class</strong>, pay the toll shown, keep the receipt, and raise a <a href=\"travel/toll-dispute\">toll dispute</a>.</li></ul>"),
         ("সীমান্তবর্তী ক্ষেত্র", "<ul><li><strong>কাভার্ড ভ্যান</strong> আকৃতি নয়, এক্সেল ও বোঝাই ওজন অনুযায়ী ট্রাক হিসেবে শ্রেণিভুক্ত।</li><li><strong>অন্য যানবাহন টেনে নেওয়া যানবাহন</strong> প্রতিটি যানবাহনের জন্য টোল দেয়; বিকল হওয়ার পর টহল দল যে যানবাহন টেনে নেয় তার টোল লাগে না।</li><li><strong>দায়িত্বরত জরুরি যানবাহন</strong> — অ্যাম্বুলেন্স ও ফায়ার সার্ভিসের গাড়ি — বিনা টোলে যায়, সরকারি প্রজ্ঞাপনে অব্যাহতিপ্রাপ্ত অন্যান্য যানবাহনও।</li><li><strong>ভুল শ্রেণিতে ধরা হয়েছে মনে হলে</strong> দেখানো টোল পরিশোধ করুন, রসিদ রাখুন এবং <a href=\"travel/toll-dispute\">টোল বিরোধ</a> জানান।</li></ul>"),
         ("特殊情况", "<ul><li><strong>厢式货车</strong>按轴数和满载重量归入货车类别，而非按外形。</li><li><strong>拖带其他车辆的</strong>，每辆车分别缴费；故障后由巡逻车拖离的车辆免费。</li><li><strong>执行任务的应急车辆</strong>——救护车和消防车——免费通行，其他经政府公告免征的车辆同样免费。</li><li><strong>如认为车型归类错误</strong>，请先按显示金额缴费并保留票据，然后提出<a href=\"travel/toll-dispute\">收费争议</a>。</li></ul>")),
    ("prohibited-vehicles", {"en": {"heading": "Not allowed on the expressway", "intro": ""}, "bn": {"heading": "এক্সপ্রেসওয়েতে অনুমোদিত নয়", "intro": ""}, "zh": {"heading": "禁止驶入快速路", "intro": ""}}),
    cta(("What your class pays", "The rates in force, and the fare for any journey.", "Toll rates", "travel/toll", "How to pay", "travel/payment"),
        ("আপনার শ্রেণির টোল", "কার্যকর হার এবং যেকোনো যাত্রার ভাড়া।", "টোল হার", "travel/toll", "কীভাবে পরিশোধ করবেন", "travel/payment"),
        ("您的车型费用", "现行费率及任意行程费用。", "通行费标准", "travel/toll", "支付方式", "travel/payment")),
  ],
})

PAGES.append({
  "slug": "travel/payment",
  "titles": {"en": ("Paying the toll", "How to pay at the toll plazas, receipts, and electronic toll collection."),
             "bn": ("টোল পরিশোধ", "টোল প্লাজায় কীভাবে পরিশোধ করবেন, রসিদ এবং ইলেকট্রনিক টোল আদায়।"),
             "zh": ("缴纳通行费", "如何在收费站缴费、票据以及电子收费。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Paying the toll", "Tolls are paid at the plaza when you join or leave the toll carriageway. Have the amount ready for your vehicle class."),
           ("ভ্রমণ তথ্য", "টোল পরিশোধ", "টোল সড়কে ওঠার বা নামার সময় প্লাজায় টোল পরিশোধ করতে হয়। আপনার যানবাহন শ্রেণির অর্থ প্রস্তুত রাখুন।"),
           ("出行信息", "缴纳通行费", "驶入或驶出收费车道时在收费站缴费。请按车型备好相应金额。")),
    ("toll-table", {"en": {"heading": "Rates in force", "intro": "", "caption": "", "section": "", "sort": "class", "emptyMessage": "", "showInForce": "yes", "revisionMechanism": ""},
                    "bn": {"heading": "কার্যকর হার", "intro": "", "caption": "", "section": "", "sort": "class", "emptyMessage": "", "showInForce": "yes", "revisionMechanism": ""},
                    "zh": {"heading": "现行费率", "intro": "", "caption": "", "section": "", "sort": "class", "emptyMessage": "", "showInForce": "yes", "revisionMechanism": ""}}),
    rich(("At the plaza", "<ul><li>Slow down and follow the lane signs for your vehicle class.</li><li>Pay the amount shown for your class. The payment methods each plaza accepts are listed with the rates above.</li><li>Take your receipt, and keep it until the end of your journey: it is your proof of payment for a dispute or a claim.</li><li>Never pay anyone who is not at a toll booth, and never pay more than the published rate.</li></ul>"),
         ("প্লাজায়", "<ul><li>গতি কমান এবং আপনার যানবাহন শ্রেণির লেন সাইন অনুসরণ করুন।</li><li>আপনার শ্রেণির জন্য দেখানো অর্থ পরিশোধ করুন। প্রতিটি প্লাজায় গৃহীত পরিশোধ পদ্ধতি উপরের হারের সঙ্গে তালিকাভুক্ত।</li><li>রসিদ নিন এবং যাত্রা শেষ হওয়া পর্যন্ত রাখুন: বিরোধ বা দাবির ক্ষেত্রে এটিই পরিশোধের প্রমাণ।</li><li>টোল বুথের বাইরে কাউকে টাকা দেবেন না এবং প্রকাশিত হারের বেশি কখনো দেবেন না।</li></ul>"),
         ("在收费站", "<ul><li>减速并按车型车道标志行驶。</li><li>按车型显示金额缴费。各收费站接受的支付方式列于上方费率表。</li><li>索取并保留票据至行程结束：这是发生争议或索赔时的付款凭证。</li><li>切勿向收费亭以外的人付款，切勿支付超过公布标准的费用。</li></ul>")),
    rich(("Electronic toll collection", "<p>Electronic toll collection lets a vehicle with a registered tag pass a dedicated lane without stopping, with the toll deducted from a prepaid account. It will follow the national electronic toll collection scheme used on other Bangladesh expressways and bridges, so that one tag works across them. When it is introduced on this expressway, the lanes, how to get a tag and how to top up will be published on this page, and the payment methods shown with the rates will change the same day.</p>"),
         ("ইলেকট্রনিক টোল আদায়", "<p>ইলেকট্রনিক টোল আদায় পদ্ধতিতে নিবন্ধিত ট্যাগযুক্ত যানবাহন না থেমে নির্দিষ্ট লেন দিয়ে যেতে পারে এবং প্রিপেইড হিসাব থেকে টোল কেটে নেওয়া হয়। এটি বাংলাদেশের অন্যান্য এক্সপ্রেসওয়ে ও সেতুতে ব্যবহৃত জাতীয় ইলেকট্রনিক টোল আদায় ব্যবস্থা অনুসরণ করবে, যাতে একটি ট্যাগ সব জায়গায় কাজ করে। এই এক্সপ্রেসওয়েতে চালু হলে লেন, ট্যাগ পাওয়ার ও রিচার্জের পদ্ধতি এই পাতায় প্রকাশিত হবে এবং একই দিনে হারের সঙ্গে দেখানো পরিশোধ পদ্ধতিও হালনাগাদ হবে।</p>"),
         ("电子收费", "<p>电子收费允许装有注册标签的车辆通过专用车道不停车通行，通行费从预付账户中扣除。本快速路的电子收费将采用孟加拉国其他快速路和桥梁使用的全国电子收费系统，一张标签通用。在本快速路启用后，相关车道、办理标签和充值方式将在本页公布，费率表中的支付方式也将同日更新。</p>")),
  ],
})

PAGES.append({
  "slug": "travel/advisories",
  "titles": {"en": ("Closures and advisories", "Current and upcoming closures, roadworks and notices on the Dhaka Bypass Expressway, and driving in rain, flood and fog."),
             "bn": ("সড়ক বন্ধ ও বিজ্ঞপ্তি", "ঢাকা বাইপাস এক্সপ্রেসওয়েতে চলমান ও আসন্ন সড়ক বন্ধ, সংস্কারকাজ ও বিজ্ঞপ্তি এবং বৃষ্টি, বন্যা ও কুয়াশায় গাড়ি চালানো।"),
             "zh": ("封闭与通告", "达卡绕城高速公路当前及即将进行的封闭、施工和通告，以及雨天、洪水和雾天行车。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Closures and advisories", "Check before you travel: lane closures, roadworks and weather notices, now and in the days ahead."),
           ("ভ্রমণ তথ্য", "সড়ক বন্ধ ও বিজ্ঞপ্তি", "যাত্রার আগে দেখে নিন: লেন বন্ধ, সংস্কারকাজ ও আবহাওয়া বিজ্ঞপ্তি, এখন ও সামনের দিনগুলোতে।"),
           ("出行信息", "封闭与通告", "出行前请查看：当前及未来几天的车道封闭、施工和天气通告。")),
    ("advisory-list", {"en": {"heading": "Now and ahead", "intro": "", "emptyMessage": ""}, "bn": {"heading": "এখন ও সামনে", "intro": "", "emptyMessage": ""}, "zh": {"heading": "当前与近期", "intro": "", "emptyMessage": ""}}),
    rich(("Rain, flood and fog", "<p>The expressway crosses low-lying land and several rivers, and the monsoon and winter fog are the two conditions that most affect it.</p><ul><li><strong>Heavy rain:</strong> slow down well below the limit, increase your following distance, and switch on dipped headlights. Standing water can cause a vehicle to aquaplane.</li><li><strong>Flooding:</strong> never drive into water across the road. Where a section is closed for flooding it is shown above, with the diversion.</li><li><strong>Fog:</strong> use dipped headlights and fog lights, not full beam; do not stop on the carriageway; leave at the next exit if visibility is too poor to continue.</li></ul><p>The Bangladesh Meteorological Department publishes forecasts and weather warnings at <a href=\"https://live6.bmd.gov.bd\" rel=\"noopener\">bmd.gov.bd</a>.</p>"),
         ("বৃষ্টি, বন্যা ও কুয়াশা", "<p>এক্সপ্রেসওয়েটি নিচু জমি ও কয়েকটি নদী অতিক্রম করে; বর্ষা ও শীতের কুয়াশা এর ওপর সবচেয়ে বেশি প্রভাব ফেলে।</p><ul><li><strong>ভারী বৃষ্টি:</strong> গতিসীমার অনেক নিচে চালান, সামনের গাড়ি থেকে দূরত্ব বাড়ান এবং লো-বিম হেডলাইট জ্বালান। জমে থাকা পানিতে গাড়ি পিছলে যেতে পারে।</li><li><strong>বন্যা:</strong> সড়কের ওপর দিয়ে বয়ে যাওয়া পানিতে কখনো গাড়ি নামাবেন না। বন্যার কারণে কোনো অংশ বন্ধ থাকলে তা বিকল্প পথসহ উপরে দেখানো হয়।</li><li><strong>কুয়াশা:</strong> হাই-বিম নয়, লো-বিম হেডলাইট ও ফগ লাইট ব্যবহার করুন; ক্যারেজওয়েতে থামবেন না; দৃশ্যমানতা খুব কম হলে পরবর্তী প্রস্থান দিয়ে বেরিয়ে যান।</li></ul><p>বাংলাদেশ আবহাওয়া অধিদপ্তর পূর্বাভাস ও সতর্কবার্তা প্রকাশ করে: <a href=\"https://live6.bmd.gov.bd\" rel=\"noopener\">bmd.gov.bd</a>।</p>"),
         ("雨天、洪水与大雾", "<p>快速路穿越低洼地带和多条河流，季风雨季和冬季大雾对其影响最大。</p><ul><li><strong>暴雨：</strong>大幅降低车速，加大跟车距离，开启近光灯。路面积水可能导致车辆打滑。</li><li><strong>洪水：</strong>切勿驶入漫过路面的积水。因洪水封闭的路段及绕行路线见上方。</li><li><strong>大雾：</strong>使用近光灯和雾灯，勿用远光灯；不要在车道上停车；能见度过低时从下一个出口驶离。</li></ul><p>孟加拉国气象局发布天气预报和预警：<a href=\"https://live6.bmd.gov.bd\" rel=\"noopener\">bmd.gov.bd</a>。</p>")),
    ("newsletter-form", {"en": {"heading": "Get notices by email", "intro": "Closures and major roadworks, sent when they are announced.", "note": ""},
                         "bn": {"heading": "ইমেইলে বিজ্ঞপ্তি পান", "intro": "সড়ক বন্ধ ও বড় সংস্কারকাজের ঘোষণা হলে পাঠানো হয়।", "note": ""},
                         "zh": {"heading": "通过电子邮件接收通告", "intro": "封闭和重大施工公布时即发送。", "note": ""}}),
  ],
})

PAGES.append({
  "slug": "travel/freight",
  "titles": {"en": ("Freight and heavy vehicles", "Axle loads, weighbridges, oversize loads and tolls for goods vehicles on the Dhaka Bypass Expressway."),
             "bn": ("পণ্য পরিবহন ও ভারী যানবাহন", "ঢাকা বাইপাস এক্সপ্রেসওয়েতে পণ্যবাহী যানবাহনের এক্সেল লোড, ওজন স্কেল, অতিরিক্ত আকারের মাল ও টোল।"),
             "zh": ("货运与重型车辆", "达卡绕城高速公路货车轴载、称重站、超限运输及通行费。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Freight and heavy vehicles", "The expressway exists to move freight between the industrial north and the southern ports without crossing Dhaka. These are the rules for goods vehicles."),
           ("ভ্রমণ তথ্য", "পণ্য পরিবহন ও ভারী যানবাহন", "ঢাকা পার না হয়ে উত্তরের শিল্পাঞ্চল ও দক্ষিণের বন্দরের মধ্যে পণ্য পরিবহনের জন্যই এক্সপ্রেসওয়েটি। পণ্যবাহী যানবাহনের নিয়ম এখানে।"),
           ("出行信息", "货运与重型车辆", "快速路的建设目的，是让货物在北部工业区与南部港口之间运输时无需穿越达卡。以下为货车通行规则。")),
    cards({"en": "Rules for goods vehicles", "bn": "পণ্যবাহী যানবাহনের নিয়ম", "zh": "货车规则"}, None, [
      {"en": ("Loads", "Axle load limits", "Goods vehicles must stay within the legal axle load limits enforced by the Roads and Highways Department under its axle load control policy and the Road Transport Act 2018. Overloading destroys pavement and bridges."),
       "bn": ("ভার", "এক্সেল লোড সীমা", "সড়ক ও জনপথ অধিদপ্তরের এক্সেল লোড নিয়ন্ত্রণ নীতিমালা ও সড়ক পরিবহন আইন ২০১৮ অনুযায়ী প্রয়োগকৃত আইনি এক্সেল লোড সীমার মধ্যে পণ্যবাহী যানবাহন চলতে হবে। অতিরিক্ত ভার পেভমেন্ট ও সেতু নষ্ট করে।"),
       "zh": ("载重", "轴载限值", "货车须遵守公路局轴载控制政策及《2018年道路运输法》规定的法定轴载限值。超载会严重损坏路面和桥梁。")},
      {"en": ("Loads", "Weighbridges", "Vehicles may be directed to a weighbridge. An overloaded vehicle can be refused entry, required to unload the excess, and fined."),
       "bn": ("ভার", "ওজন স্কেল", "যানবাহনকে ওজন স্কেলে পাঠানো হতে পারে। অতিরিক্ত ভারবাহী যানবাহনকে প্রবেশে বাধা, অতিরিক্ত মাল নামাতে বাধ্য এবং জরিমানা করা যেতে পারে।"),
       "zh": ("载重", "称重站", "车辆可能被引导至称重站。超载车辆可能被拒绝驶入、责令卸载超出部分并处以罚款。")},
      {"en": ("Size", "Oversize and abnormal loads", "Loads wider, longer or taller than the legal dimensions need a movement permit from the Roads and Highways Department before travel, and may be escorted or limited to set hours."),
       "bn": ("আকার", "অতিরিক্ত আকারের ও অস্বাভাবিক মাল", "আইনি মাপের চেয়ে চওড়া, লম্বা বা উঁচু মাল পরিবহনের আগে সড়ক ও জনপথ অধিদপ্তরের চলাচল অনুমতি প্রয়োজন; এসকর্ট বা নির্দিষ্ট সময়ে সীমাবদ্ধ করা হতে পারে।"),
       "zh": ("尺寸", "超限及大件运输", "宽度、长度或高度超过法定尺寸的货物，须事先取得公路局通行许可，并可能需要护送或限定通行时段。")},
      {"en": ("Lanes", "Keep left", "Heavy vehicles use the left lane except to overtake, and must not overtake on bridges or at interchanges."),
       "bn": ("লেন", "বাম দিকে থাকুন", "ভারী যানবাহন ওভারটেক ছাড়া বাম লেন ব্যবহার করবে এবং সেতু বা ইন্টারচেঞ্জে ওভারটেক করবে না।"),
       "zh": ("车道", "靠左行驶", "重型车辆除超车外须使用左侧车道，不得在桥梁或互通立交处超车。")},
      {"en": ("Safety", "Secure the load", "Loads must be covered and secured. Loose material falling on the carriageway is a danger to every vehicle behind."),
       "bn": ("নিরাপত্তা", "মাল সুরক্ষিত রাখুন", "মাল ঢেকে ও সুরক্ষিতভাবে বাঁধতে হবে। ক্যারেজওয়েতে পড়া খোলা মাল পেছনের প্রতিটি যানবাহনের জন্য বিপজ্জনক।"),
       "zh": ("安全", "固定货物", "货物须覆盖并固定。散落在车道上的物料会危及后方所有车辆。")},
      {"en": ("Tolls", "Classes for goods vehicles", "Goods vehicles pay by class, from small trucks to trailers; see vehicle classes and the fare between any two plazas."),
       "bn": ("টোল", "পণ্যবাহী যানবাহনের শ্রেণি", "ছোট ট্রাক থেকে ট্রেইলার পর্যন্ত পণ্যবাহী যানবাহন শ্রেণি অনুযায়ী টোল দেয়; দেখুন যানবাহনের শ্রেণি এবং যেকোনো দুই প্লাজার মধ্যকার ভাড়া।"),
       "zh": ("收费", "货车类别", "货车按类别缴费，从小型货车到拖挂车；详见车型分类及任意两个收费站之间的费用。")},
    ]),
    ("toll-calculator", {"en": {"heading": "Fare for a journey", "intro": ""}, "bn": {"heading": "যাত্রার ভাড়া", "intro": ""}, "zh": {"heading": "行程费用", "intro": ""}}),
  ],
})

PAGES.append({
  "slug": "travel/breakdown",
  "titles": {"en": ("Breakdown assistance", "What to do if your vehicle breaks down on the expressway, and how to request recovery."),
             "bn": ("বিকল যানবাহনে সহায়তা", "এক্সপ্রেসওয়েতে গাড়ি বিকল হলে কী করবেন এবং কীভাবে উদ্ধারের অনুরোধ করবেন।"),
             "zh": ("故障救援", "车辆在快速路上发生故障时怎么办，以及如何申请救援。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Breakdown assistance", "If you are on the expressway now and need help, call — do not use a form."),
           ("ভ্রমণ তথ্য", "বিকল যানবাহনে সহায়তা", "এখন এক্সপ্রেসওয়েতে থেকে সাহায্য প্রয়োজন হলে ফোন করুন — ফরম ব্যবহার করবেন না।"),
           ("出行信息", "故障救援", "如果您正在快速路上并需要帮助，请直接拨打电话——不要填写表单。")),
    ("emergency-strip", {"en": {"heading": "", "note": "Give the nearest kilometre marker and your direction of travel."}, "bn": {"heading": "", "note": "নিকটতম কিলোমিটার ফলক ও আপনার যাত্রার দিক জানান।"}, "zh": {"heading": "", "note": "请告知最近的公里桩号和行驶方向。"}}),
    rich(("If you break down", "<ol><li>Move as far left as you can onto the hard shoulder, switch on your hazard lights and place the warning triangle well behind the vehicle.</li><li>Get everyone out on the side away from traffic and stand behind the barrier. Never walk on the carriageway.</li><li>Call the emergency number above. Tell the operator the kilometre marker, your direction and your vehicle.</li><li>Wait for the patrol. Recovery to the nearest safe exit is arranged by DBEDC; onward towing is at the owner's cost.</li></ol>"),
         ("গাড়ি বিকল হলে", "<ol><li>যতটা সম্ভব বাম দিকে হার্ড শোল্ডারে সরে যান, হ্যাজার্ড লাইট জ্বালান এবং গাড়ির অনেক পেছনে সতর্কীকরণ ত্রিভুজ রাখুন।</li><li>সবাইকে যানবাহনের উল্টো দিক দিয়ে নামিয়ে ব্যারিয়ারের পেছনে দাঁড়ান। কখনো ক্যারেজওয়েতে হাঁটবেন না।</li><li>উপরের জরুরি নম্বরে কল করুন। কিলোমিটার ফলক, আপনার দিক ও যানবাহনের তথ্য জানান।</li><li>টহল দলের জন্য অপেক্ষা করুন। নিকটতম নিরাপদ প্রস্থান পর্যন্ত উদ্ধারের ব্যবস্থা DBEDC করে; এরপর টোয়িংয়ের খরচ মালিকের।</li></ol>"),
         ("车辆故障时", "<ol><li>尽量靠左驶入硬路肩，打开危险警示灯，并在车后足够远处放置警示三角牌。</li><li>所有人从远离车流一侧下车，站到护栏后方。切勿在车道上行走。</li><li>拨打上方紧急电话，告知公里桩号、行驶方向和车辆信息。</li><li>等待巡逻车。DBEDC负责将车辆拖至最近的安全出口；后续拖车费用由车主承担。</li></ol>")),
    form("breakdown", ("Report a breakdown after the event", "For a recovery that has already happened — a claim, a complaint about the response, or a request for the incident record.", "Keep this number to follow up."),
         ("ঘটনার পরে বিকল হওয়ার তথ্য জানান", "ইতিমধ্যে সম্পন্ন উদ্ধারের জন্য — দাবি, সাড়ার বিষয়ে অভিযোগ বা ঘটনার রেকর্ডের অনুরোধ।", "পরবর্তী যোগাযোগের জন্য এই নম্বর রাখুন।"),
         ("事后报告故障", "适用于已完成的救援——索赔、对响应的投诉或申请事故记录。", "请保留此编号以便跟进。")),
  ],
})

PAGES.append({
  "slug": "travel/lost-found",
  "titles": {"en": ("Lost and found", "Report property lost on the Dhaka Bypass Expressway or at a toll plaza."),
             "bn": ("হারানো ও প্রাপ্তি", "ঢাকা বাইপাস এক্সপ্রেসওয়েতে বা টোল প্লাজায় হারানো জিনিসের তথ্য জানান।"),
             "zh": ("失物招领", "报告在达卡绕城高速公路或收费站遗失的物品。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Lost and found", "Items found on the expressway and at the toll plazas are logged and kept. Tell us what you lost, and where."),
           ("ভ্রমণ তথ্য", "হারানো ও প্রাপ্তি", "এক্সপ্রেসওয়ে ও টোল প্লাজায় পাওয়া জিনিস লিপিবদ্ধ করে রাখা হয়। কী ও কোথায় হারিয়েছেন জানান।"),
           ("出行信息", "失物招领", "在快速路和收费站拾获的物品会登记保管。请告诉我们您遗失了什么以及地点。")),
    form("lost_found", ("Report lost property", "Describe the item, when and roughly where you lost it, and how to reach you.", "If a matching item is found you will be contacted; bring identification to collect it."),
         ("হারানো জিনিসের তথ্য দিন", "জিনিসটির বর্ণনা, কখন ও মোটামুটি কোথায় হারিয়েছেন এবং আপনার সঙ্গে যোগাযোগের উপায় জানান।", "মিল পাওয়া গেলে আপনার সঙ্গে যোগাযোগ করা হবে; সংগ্রহের সময় পরিচয়পত্র আনুন।"),
         ("报告遗失物品", "请描述物品、遗失时间和大致地点，以及联系方式。", "找到匹配物品后将与您联系；领取时请携带身份证件。")),
  ],
})

PAGES.append({
  "slug": "travel/toll-dispute",
  "titles": {"en": ("Toll disputes", "Challenge a toll charge or a vehicle classification, and how disputes are reviewed."),
             "bn": ("টোল বিরোধ", "টোল চার্জ বা যানবাহনের শ্রেণি নির্ধারণ নিয়ে আপত্তি এবং বিরোধ কীভাবে পর্যালোচনা করা হয়।"),
             "zh": ("收费争议", "对收费或车型分类提出异议，以及争议复核方式。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Toll disputes", "If you were charged the wrong amount, placed in the wrong class, or charged twice, tell us. Pay the toll shown at the plaza first, and keep the receipt."),
           ("ভ্রমণ তথ্য", "টোল বিরোধ", "ভুল পরিমাণ নেওয়া হলে, ভুল শ্রেণিতে ধরা হলে বা দুবার নেওয়া হলে জানান। আগে প্লাজায় দেখানো টোল পরিশোধ করুন এবং রসিদ রাখুন।"),
           ("出行信息", "收费争议", "如被收取错误金额、归入错误车型或重复收费，请告诉我们。请先按收费站显示金额缴费并保留票据。")),
    rich(("How a dispute is reviewed", "<ol><li>The charge is checked against the plaza's transaction record and camera record for the time on your receipt.</li><li>Your vehicle's class is checked against its registration.</li><li>If you were overcharged, the difference is refunded and you are told how it will be paid.</li><li>If the charge was correct, the reply explains why. You may ask for the decision to be reviewed through the <a href=\"grievances\">grievance process</a>.</li></ol>"),
         ("বিরোধ কীভাবে পর্যালোচনা করা হয়", "<ol><li>আপনার রসিদের সময় অনুযায়ী প্লাজার লেনদেন রেকর্ড ও ক্যামেরা রেকর্ডের সঙ্গে চার্জ মিলিয়ে দেখা হয়।</li><li>নিবন্ধন অনুযায়ী আপনার যানবাহনের শ্রেণি যাচাই করা হয়।</li><li>বেশি নেওয়া হলে পার্থক্য ফেরত দেওয়া হয় এবং কীভাবে দেওয়া হবে তা জানানো হয়।</li><li>চার্জ সঠিক হলে উত্তরে কারণ ব্যাখ্যা করা হয়। <a href=\"grievances\">অভিযোগ প্রক্রিয়ার</a> মাধ্যমে সিদ্ধান্ত পুনর্বিবেচনার অনুরোধ করতে পারেন।</li></ol>"),
         ("争议复核流程", "<ol><li>按票据时间核对收费站交易记录和监控录像。</li><li>对照行驶证核实车辆类别。</li><li>如确属多收，退还差额并告知退款方式。</li><li>如收费无误，答复中说明理由。您可通过<a href=\"grievances\">投诉程序</a>申请复核。</li></ol>")),
    form("toll_dispute", ("Raise a toll dispute", "Give the plaza, the date and time on your receipt, your vehicle number and what went wrong.", "Keep your receipt until the dispute is closed."),
         ("টোল বিরোধ জানান", "প্লাজা, রসিদে থাকা তারিখ ও সময়, যানবাহনের নম্বর এবং কী ভুল হয়েছে তা জানান।", "বিরোধ নিষ্পত্তি না হওয়া পর্যন্ত রসিদ রাখুন।"),
         ("提出收费争议", "请提供收费站、票据上的日期和时间、车牌号以及问题描述。", "争议处理完毕前请保留票据。")),
  ],
})
