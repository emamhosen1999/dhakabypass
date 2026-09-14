# Pages for the services built on 14 September 2026: cameras, alerts, fleet,
# toll tags, frequent travellers, videos, 360° tour, recognition; plus an
# office map on the contact page.
from pages_w3 import header, rich, cards, cta
from pages_w4 import subnav, form

PAGES = []

PAGES.append({
  "slug": "travel/cameras",
  "titles": {"en": ("Traffic cameras", "Live views of the Dhaka Bypass Expressway from the corridor's traffic cameras."),
             "bn": ("ট্রাফিক ক্যামেরা", "করিডোরের ট্রাফিক ক্যামেরা থেকে ঢাকা বাইপাস এক্সপ্রেসওয়ের সরাসরি দৃশ্য।"),
             "zh": ("交通摄像头", "来自走廊交通摄像头的达卡绕城高速公路实时画面。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Traffic cameras", "See the plazas and bridges before you set out. Stills refresh on their own; press “Watch live” for a moving picture."),
           ("ভ্রমণ তথ্য", "ট্রাফিক ক্যামেরা", "রওনা হওয়ার আগে প্লাজা ও সেতুর অবস্থা দেখুন। স্থির ছবি নিজে থেকেই হালনাগাদ হয়; চলমান দৃশ্যের জন্য “সরাসরি দেখুন” চাপুন।"),
           ("出行信息", "交通摄像头", "出发前查看收费站和桥梁状况。静态画面自动刷新；点击“观看直播”查看实时视频。")),
    ("camera-grid", {"en": {"heading": "", "intro": "", "emptyMessage": ""}, "bn": {"heading": "", "intro": "", "emptyMessage": ""}, "zh": {"heading": "", "intro": "", "emptyMessage": ""}}),
    rich(("About the cameras", "<p>The cameras show traffic conditions, not people: views are wide, and images are not recorded or kept for this website. Live video uses mobile data — a still image uses far less. If a camera shows “Offline”, its feed is interrupted; conditions for every section are also on <a href=\"travel/status\">what's open</a>.</p>"),
         ("ক্যামেরা সম্পর্কে", "<p>ক্যামেরাগুলো মানুষ নয়, যান চলাচলের অবস্থা দেখায়: দৃশ্য প্রশস্ত, এবং এই ওয়েবসাইটের জন্য ছবি রেকর্ড বা সংরক্ষণ করা হয় না। সরাসরি ভিডিওতে মোবাইল ডেটা খরচ হয় — স্থির ছবিতে অনেক কম। কোনো ক্যামেরা “বন্ধ” দেখালে তার ফিড বিঘ্নিত; প্রতিটি অংশের অবস্থা <a href=\"travel/status\">কী খোলা আছে</a> পাতাতেও দেখানো হয়।</p>"),
         ("关于摄像头", "<p>摄像头显示的是交通状况而非个人：画面为广角，本网站不录制或保存图像。实时视频会消耗移动数据——静态画面消耗少得多。如摄像头显示“离线”，表示其画面中断；各路段状况也可在<a href=\"travel/status\">通车路段</a>页面查看。</p>")),
  ],
})

PAGES.append({
  "slug": "travel/alerts",
  "titles": {"en": ("Road alerts", "Get closures and major roadworks on the Dhaka Bypass Expressway by SMS, WhatsApp or email."),
             "bn": ("সড়ক সতর্কবার্তা", "ঢাকা বাইপাস এক্সপ্রেসওয়ের সড়ক বন্ধ ও বড় সংস্কারকাজের খবর এসএমএস, হোয়াটসঅ্যাপ বা ইমেইলে পান।"),
             "zh": ("道路提醒", "通过短信、WhatsApp或电子邮件接收达卡绕城高速公路封闭和重大施工信息。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Road alerts", "A short message when a lane or section closes, a toll plaza is affected, or major roadworks are planned — in the language you choose."),
           ("ভ্রমণ তথ্য", "সড়ক সতর্কবার্তা", "কোনো লেন বা অংশ বন্ধ হলে, টোল প্লাজা প্রভাবিত হলে বা বড় সংস্কারকাজ পরিকল্পিত হলে একটি সংক্ষিপ্ত বার্তা — আপনার পছন্দের ভাষায়।"),
           ("出行信息", "道路提醒", "当车道或路段封闭、收费站受影响或计划重大施工时，以您选择的语言发送简短消息。")),
    ("alert-signup", {"en": {"heading": "", "intro": "Alerts are free to receive. Your number is used only for road alerts and is never shared."},
                      "bn": {"heading": "", "intro": "সতর্কবার্তা পেতে কোনো খরচ নেই। আপনার নম্বর শুধু সড়ক সতর্কবার্তার জন্য ব্যবহৃত হয় এবং কখনো কারও সঙ্গে শেয়ার করা হয় না।"},
                      "zh": {"heading": "", "intro": "接收提醒免费。您的号码仅用于道路提醒，绝不会共享。"}}),
    ("newsletter-form", {"en": {"heading": "Or by email", "intro": "", "note": ""}, "bn": {"heading": "অথবা ইমেইলে", "intro": "", "note": ""}, "zh": {"heading": "或通过电子邮件", "intro": "", "note": ""}}),
    ("advisory-list", {"en": {"heading": "Current and upcoming", "intro": "", "emptyMessage": ""}, "bn": {"heading": "চলমান ও আসন্ন", "intro": "", "emptyMessage": ""}, "zh": {"heading": "当前与近期", "intro": "", "emptyMessage": ""}}),
  ],
})

PAGES.append({
  "slug": "travel/etc",
  "titles": {"en": ("Electronic toll tags", "Apply for an electronic toll tag to pass the Dhaka Bypass Expressway plazas without stopping."),
             "bn": ("ইলেকট্রনিক টোল ট্যাগ", "না থেমে ঢাকা বাইপাস এক্সপ্রেসওয়ের প্লাজা পার হতে ইলেকট্রনিক টোল ট্যাগের জন্য আবেদন করুন।"),
             "zh": ("电子收费标签", "申请电子收费标签，不停车通过达卡绕城高速公路收费站。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Electronic toll tags", "A tag on your windscreen, linked to a prepaid account: the barrier opens as you reach it, and the toll is deducted automatically."),
           ("ভ্রমণ তথ্য", "ইলেকট্রনিক টোল ট্যাগ", "উইন্ডস্ক্রিনে একটি ট্যাগ, প্রিপেইড হিসাবের সঙ্গে যুক্ত: কাছে পৌঁছালেই ব্যারিয়ার খুলে যায় এবং টোল স্বয়ংক্রিয়ভাবে কেটে নেওয়া হয়।"),
           ("出行信息", "电子收费标签", "挡风玻璃上贴一枚标签并关联预付账户：到达时栏杆自动抬起，通行费自动扣除。")),
    cards({"en": "How it works", "bn": "কীভাবে কাজ করে", "zh": "使用方式"}, None, [
      {"en": ("1", "Apply", "Apply below with your vehicle's registration number. You will be told where and when to collect and fit the tag."),
       "bn": ("১", "আবেদন", "যানবাহনের নিবন্ধন নম্বর দিয়ে নিচে আবেদন করুন। কোথায় ও কখন ট্যাগ সংগ্রহ ও লাগাতে হবে তা জানানো হবে।"),
       "zh": ("1", "申请", "填写车牌号在下方申请。我们会通知您领取和安装标签的时间和地点。")},
      {"en": ("2", "Top up", "Add credit to the tag's prepaid account; the balance is shown after every passage."),
       "bn": ("২", "রিচার্জ", "ট্যাগের প্রিপেইড হিসাবে টাকা যোগ করুন; প্রতিবার পার হওয়ার পর ব্যালান্স দেখানো হয়।"),
       "zh": ("2", "充值", "为标签预付账户充值；每次通行后显示余额。")},
      {"en": ("3", "Drive through", "Use the lanes marked for electronic toll collection and keep to their speed limit. The toll for your class is deducted."),
       "bn": ("৩", "চলে যান", "ইলেকট্রনিক টোল আদায়ের জন্য চিহ্নিত লেন ব্যবহার করুন এবং তার গতিসীমা মানুন। আপনার শ্রেণির টোল কেটে নেওয়া হবে।"),
       "zh": ("3", "直接通行", "使用电子收费专用车道并遵守限速，系统按车型扣费。")},
    ]),
    rich(("One tag for every tolled road", "<p>Tags follow the national electronic toll collection scheme, so the tag fitted for this expressway is intended to work on other Bangladesh expressways and bridges that use the same scheme. Until electronic lanes open here, applications are registered in order and applicants are contacted first.</p>"),
         ("সব টোল সড়কে একটি ট্যাগ", "<p>ট্যাগগুলো জাতীয় ইলেকট্রনিক টোল আদায় ব্যবস্থা অনুসরণ করে, তাই এই এক্সপ্রেসওয়ের জন্য লাগানো ট্যাগ একই ব্যবস্থা ব্যবহারকারী বাংলাদেশের অন্যান্য এক্সপ্রেসওয়ে ও সেতুতেও কাজ করবে বলে নির্ধারিত। এখানে ইলেকট্রনিক লেন চালু না হওয়া পর্যন্ত আবেদনগুলো ক্রমানুসারে নিবন্ধিত হয় এবং আবেদনকারীদের সঙ্গে আগে যোগাযোগ করা হয়।</p>"),
         ("一张标签通行所有收费道路", "<p>标签遵循全国电子收费系统，因此为本快速路安装的标签也可用于孟加拉国采用同一系统的其他快速路和桥梁。本快速路电子车道开通前，申请按顺序登记，申请人将优先获得通知。</p>")),
    form("etc_tag", ("Apply for a tag", "Give the vehicle's registration number and class, and how to reach you.", "Keep this number: you will be contacted when tags are issued."),
         ("ট্যাগের জন্য আবেদন", "যানবাহনের নিবন্ধন নম্বর ও শ্রেণি এবং আপনার সঙ্গে যোগাযোগের উপায় জানান।", "এই নম্বর রাখুন: ট্যাগ দেওয়ার সময় আপনার সঙ্গে যোগাযোগ করা হবে।"),
         ("申请标签", "请提供车牌号、车型和联系方式。", "请保留此编号：发放标签时将与您联系。")),
  ],
})

PAGES.append({
  "slug": "travel/fleet",
  "titles": {"en": ("Fleet accounts", "One account for a company's vehicles on the Dhaka Bypass Expressway: tags, monthly statements and trip records."),
             "bn": ("ফ্লিট অ্যাকাউন্ট", "ঢাকা বাইপাস এক্সপ্রেসওয়েতে প্রতিষ্ঠানের যানবাহনের জন্য একটি অ্যাকাউন্ট: ট্যাগ, মাসিক বিবরণী ও যাত্রার রেকর্ড।"),
             "zh": ("车队账户", "企业车辆在达卡绕城高速公路的统一账户：标签、月结账单和行程记录。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Fleet accounts", "For transport operators, logistics companies and bus operators that use the expressway every day."),
           ("ভ্রমণ তথ্য", "ফ্লিট অ্যাকাউন্ট", "প্রতিদিন এক্সপ্রেসওয়ে ব্যবহারকারী পরিবহন, লজিস্টিকস ও বাস পরিচালনাকারী প্রতিষ্ঠানের জন্য।"),
           ("出行信息", "车队账户", "面向每日使用快速路的运输企业、物流公司和客运企业。")),
    cards({"en": "What a fleet account gives you", "bn": "ফ্লিট অ্যাকাউন্টে যা পাবেন", "zh": "车队账户提供"}, None, [
      {"en": ("Tags", "Every vehicle tagged", "Electronic toll tags for each vehicle, all drawing on one company balance."),
       "bn": ("ট্যাগ", "প্রতিটি যানবাহনে ট্যাগ", "প্রতিটি যানবাহনের জন্য ইলেকট্রনিক টোল ট্যাগ, সবগুলো প্রতিষ্ঠানের একটি ব্যালান্স থেকে।"),
       "zh": ("标签", "每辆车配发标签", "为每辆车配发电子收费标签，统一从企业余额扣费。")},
      {"en": ("Billing", "Monthly statement", "One statement per month listing every passage by vehicle, plaza, date and class, for your accounts."),
       "bn": ("বিল", "মাসিক বিবরণী", "হিসাবের জন্য প্রতি মাসে একটি বিবরণী, যানবাহন, প্লাজা, তারিখ ও শ্রেণি অনুযায়ী প্রতিটি পারাপারসহ।"),
       "zh": ("结算", "月结账单", "每月一份账单，按车辆、收费站、日期和车型列出每次通行，便于财务核算。")},
      {"en": ("Control", "Vehicles added and removed", "Add a new vehicle or withdraw a sold one through your account manager."),
       "bn": ("নিয়ন্ত্রণ", "যানবাহন যোগ ও বাদ", "অ্যাকাউন্ট ম্যানেজারের মাধ্যমে নতুন যানবাহন যোগ করুন বা বিক্রি হওয়া যানবাহন বাদ দিন।"),
       "zh": ("管理", "车辆增减", "通过客户经理新增车辆或注销已出售车辆。")},
      {"en": ("Planning", "Journey costs in advance", "Use the fare calculator to price regular routes for your vehicle classes."),
       "bn": ("পরিকল্পনা", "আগেই যাত্রার খরচ", "আপনার যানবাহন শ্রেণির নিয়মিত রুটের খরচ জানতে ভাড়া হিসাবকারী ব্যবহার করুন।"),
       "zh": ("规划", "提前核算行程成本", "使用费用计算器为各车型的常用线路估算费用。")},
    ]),
    ("toll-calculator", {"en": {"heading": "Price a regular route", "intro": ""}, "bn": {"heading": "নিয়মিত রুটের খরচ", "intro": ""}, "zh": {"heading": "常用线路计费", "intro": ""}}),
    form("fleet_account", ("Apply for a fleet account", "Give the company name, a contact person, the number of vehicles by class, and the routes you use.", "An account manager will contact you with the agreement and the next steps."),
         ("ফ্লিট অ্যাকাউন্টের জন্য আবেদন", "প্রতিষ্ঠানের নাম, একজন যোগাযোগকারী, শ্রেণি অনুযায়ী যানবাহনের সংখ্যা এবং ব্যবহৃত রুট জানান।", "একজন অ্যাকাউন্ট ম্যানেজার চুক্তি ও পরবর্তী ধাপ নিয়ে আপনার সঙ্গে যোগাযোগ করবেন।"),
         ("申请车队账户", "请提供公司名称、联系人、各车型车辆数量及常用线路。", "客户经理将与您联系，说明协议及后续步骤。")),
  ],
})

PAGES.append({
  "slug": "travel/frequent-traveller",
  "titles": {"en": ("Frequent travellers", "Register as a frequent traveller on the Dhaka Bypass Expressway."),
             "bn": ("নিয়মিত যাত্রী", "ঢাকা বাইপাস এক্সপ্রেসওয়েতে নিয়মিত যাত্রী হিসেবে নিবন্ধন করুন।"),
             "zh": ("常用出行者", "注册成为达卡绕城高速公路常用出行者。")},
  "blocks": [
    subnav(),
    header(("Travel information", "Frequent travellers", "For people who use the expressway to commute or trade every day. Registered travellers are the first to hear about commuter passes and offers."),
           ("ভ্রমণ তথ্য", "নিয়মিত যাত্রী", "যাঁরা প্রতিদিন যাতায়াত বা ব্যবসার জন্য এক্সপ্রেসওয়ে ব্যবহার করেন তাঁদের জন্য। নিবন্ধিত যাত্রীরা যাত্রী পাস ও সুবিধার খবর সবার আগে পান।"),
           ("出行信息", "常用出行者", "面向每天通勤或经商使用快速路的人士。注册用户将最先获知通勤卡和优惠信息。")),
    cards({"en": "What registration brings", "bn": "নিবন্ধনে যা পাবেন", "zh": "注册后可享"}, None, [
      {"en": ("First", "Commuter passes", "When monthly or multi-trip passes are introduced for a route, registered travellers are offered them first."),
       "bn": ("প্রথম", "যাত্রী পাস", "কোনো রুটে মাসিক বা একাধিক যাত্রার পাস চালু হলে নিবন্ধিত যাত্রীদের প্রথমে দেওয়া হয়।"),
       "zh": ("优先", "通勤卡", "某线路推出月卡或多次卡时，优先向注册用户提供。")},
      {"en": ("Updates", "Notices for your route", "Closures and roadworks on the sections you use, by SMS or email."),
       "bn": ("খবর", "আপনার রুটের বিজ্ঞপ্তি", "আপনি যে অংশ ব্যবহার করেন সেখানে সড়ক বন্ধ ও সংস্কারকাজের খবর, এসএমএস বা ইমেইলে।"),
       "zh": ("动态", "线路通知", "通过短信或电子邮件接收您常用路段的封闭和施工信息。")},
      {"en": ("Feedback", "A say in services", "Registered travellers are asked first when new services, lanes and facilities are planned."),
       "bn": ("মতামত", "সেবায় মতামত", "নতুন সেবা, লেন ও সুবিধা পরিকল্পনার সময় নিবন্ধিত যাত্রীদের মতামত প্রথমে নেওয়া হয়।"),
       "zh": ("意见", "参与服务规划", "规划新服务、车道和设施时优先征求注册用户意见。")},
    ]),
    form("loyalty", ("Register", "Give your vehicle number, the journey you make most often and how often you make it.", "You will be contacted when a pass or offer is available for your route."),
         ("নিবন্ধন", "আপনার যানবাহনের নম্বর, সবচেয়ে বেশি যে যাত্রা করেন এবং কত ঘন ঘন করেন তা জানান।", "আপনার রুটে পাস বা সুবিধা চালু হলে আপনার সঙ্গে যোগাযোগ করা হবে।"),
         ("注册", "请提供车牌号、最常走的行程及频率。", "您的线路推出通勤卡或优惠时，我们将与您联系。")),
  ],
})

def video(ref, en, bn, zh, poster=""):
    return ("video-embed", {l: {"heading": d[0], "intro": "", "provider": "youtube", "reference": ref, "poster": poster, "caption": d[1], "transcriptHref": ""}
                            for l, d in (("en", en), ("bn", bn), ("zh", zh))})

PAGES.append({
  "slug": "gallery/videos",
  "titles": {"en": ("Videos", "Video of the Dhaka Bypass Expressway: the opening, the Eid trial and driving the open section."),
             "bn": ("ভিডিও", "ঢাকা বাইপাস এক্সপ্রেসওয়ের ভিডিও: উদ্বোধন, ঈদের পরীক্ষামূলক চলাচল এবং খোলা অংশে গাড়ি চালানো।"),
             "zh": ("视频", "达卡绕城高速公路视频：通车仪式、开斋节试运行及已通车路段驾驶实录。")},
  "blocks": [
    header(("Gallery", "Videos", "News coverage and footage of the expressway. A video loads only when you press play."),
           ("গ্যালারি", "ভিডিও", "এক্সপ্রেসওয়ের সংবাদ ও ভিডিওচিত্র। প্লে চাপলেই কেবল ভিডিও লোড হয়।"),
           ("图片库", "视频", "快速路相关新闻报道和影像。点击播放后才会加载视频。")),
    video("https://www.youtube.com/watch?v=r6BVgEcNXY4", ("Opening of the expressway", "Somoy TV report on the opening, August 2025."), ("এক্সপ্রেসওয়ের উদ্বোধন", "উদ্বোধন নিয়ে সময় টিভির প্রতিবেদন, আগস্ট ২০২৫।"), ("快速路通车", "Somoy TV关于通车的报道，2025年8月。")),
    video("https://www.youtube.com/watch?v=2-JoK8RfAWc", ("Part of the expressway opens", "Ekhon TV report, August 2025."), ("এক্সপ্রেসওয়ের একাংশ চালু", "এখন টিভির প্রতিবেদন, আগস্ট ২০২৫।"), ("快速路部分路段通车", "Ekhon TV报道，2025年8月。")),
    video("https://www.youtube.com/watch?v=TXBvzXKEWFs", ("The Eid journey", "Somoy TV on the section's use during Eid travel."), ("ঈদযাত্রা", "ঈদযাত্রায় অংশটির ব্যবহার নিয়ে সময় টিভি।"), ("开斋节出行", "Somoy TV关于开斋节期间路段使用情况的报道。")),
    video("https://www.youtube.com/watch?v=4RyBKQB99ww", ("Driving the open section", "A driver's-eye view along the open section, recorded by a road user."), ("খোলা অংশে গাড়ি চালানো", "খোলা অংশ বরাবর চালকের চোখে দৃশ্য, একজন সড়ক ব্যবহারকারীর ধারণকৃত।"), ("驾驶已通车路段", "道路使用者拍摄的已通车路段驾驶视角。")),
  ],
})

PAGES.append({
  "slug": "project/virtual-tour",
  "titles": {"en": ("360° tour", "Look around the Dhaka Bypass Expressway in panoramic views."),
             "bn": ("৩৬০° ভ্রমণ", "প্যানোরামিক দৃশ্যে ঢাকা বাইপাস এক্সপ্রেসওয়ে ঘুরে দেখুন।"),
             "zh": ("360°全景", "通过全景画面环视达卡绕城高速公路。")},
  "blocks": [
    header(("The project", "360° tour", "Drag or swipe to look along the expressway."),
           ("প্রকল্প", "৩৬০° ভ্রমণ", "এক্সপ্রেসওয়ে বরাবর দেখতে টানুন বা সোয়াইপ করুন।"),
           ("项目概况", "360°全景", "拖动或滑动沿快速路浏览。")),
    ("panorama", {"en": {"heading": "The toll carriageway", "intro": "", "image": "/photo/21.webp", "caption": "Sample view from a wide photograph; a full 360° capture will replace it.", "autoRotate": "yes"},
                  "bn": {"heading": "টোল ক্যারেজওয়ে", "intro": "", "image": "/photo/21.webp", "caption": "প্রশস্ত আলোকচিত্র থেকে নমুনা দৃশ্য; পূর্ণ ৩৬০° ধারণ দিয়ে এটি প্রতিস্থাপিত হবে।", "autoRotate": "yes"},
                  "zh": {"heading": "收费车道", "intro": "", "image": "/photo/21.webp", "caption": "由宽幅照片生成的示例画面，将由完整360°拍摄替换。", "autoRotate": "yes"}}),
    ("panorama", {"en": {"heading": "Along the corridor", "intro": "", "image": "/photo/24.webp", "caption": "Sample view from a wide photograph; a full 360° capture will replace it.", "autoRotate": "no"},
                  "bn": {"heading": "করিডোর বরাবর", "intro": "", "image": "/photo/24.webp", "caption": "প্রশস্ত আলোকচিত্র থেকে নমুনা দৃশ্য; পূর্ণ ৩৬০° ধারণ দিয়ে এটি প্রতিস্থাপিত হবে।", "autoRotate": "no"},
                  "zh": {"heading": "走廊沿线", "intro": "", "image": "/photo/24.webp", "caption": "由宽幅照片生成的示例画面，将由完整360°拍摄替换。", "autoRotate": "no"}}),
  ],
})

PAGES.append({
  "slug": "about/recognition",
  "titles": {"en": ("Recognition", "Firsts and recognition for the Dhaka Bypass Expressway."),
             "bn": ("স্বীকৃতি", "ঢাকা বাইপাস এক্সপ্রেসওয়ের প্রথম অর্জন ও স্বীকৃতি।"),
             "zh": ("荣誉与认可", "达卡绕城高速公路的首创成果与认可。")},
  "blocks": [
    header(("About DBEDC", "Recognition", "What the project has been recognised for, and the firsts it brought to Bangladesh."),
           ("DBEDC পরিচিতি", "স্বীকৃতি", "প্রকল্পটি যেসব কারণে স্বীকৃতি পেয়েছে এবং বাংলাদেশে যেসব প্রথম এনেছে।"),
           ("关于DBEDC", "荣誉与认可", "项目获得的认可及其为孟加拉国带来的首创。")),
    cards({"en": "Recognition and firsts", "bn": "স্বীকৃতি ও প্রথম অর্জন", "zh": "认可与首创"}, None, [
      {"en": ("2018", "Bangladesh's first road PPP", "The first road project in Bangladesh delivered as a public–private partnership, signed with the Roads and Highways Department in December 2018."),
       "bn": ("২০১৮", "বাংলাদেশের প্রথম সড়ক পিপিপি", "বাংলাদেশে সরকারি-বেসরকারি অংশীদারিত্বে বাস্তবায়িত প্রথম সড়ক প্রকল্প, ডিসেম্বর ২০১৮-এ সড়ক ও জনপথ অধিদপ্তরের সঙ্গে স্বাক্ষরিত।"),
       "zh": ("2018", "孟加拉国首个公路PPP项目", "孟加拉国首个以政府与社会资本合作模式实施的公路项目，于2018年12月与孟加拉国公路局签约。")},
      {"en": ("2023", "Belt and Road Forum", "Presented as a practical cooperation project at the Third Belt and Road Forum for International Cooperation."),
       "bn": ("২০২৩", "বেল্ট অ্যান্ড রোড ফোরাম", "তৃতীয় বেল্ট অ্যান্ড রোড আন্তর্জাতিক সহযোগিতা ফোরামে বাস্তব সহযোগিতা প্রকল্প হিসেবে উপস্থাপিত।"),
       "zh": ("2023", "“一带一路”国际合作高峰论坛", "作为务实合作项目亮相第三届“一带一路”国际合作高峰论坛。")},
      {"en": ("Engineering", "First semi-rigid pavement", "The first use in Bangladesh of semi-rigid pavement and reinforced retaining walls on a highway."),
       "bn": ("প্রকৌশল", "প্রথম সেমি-রিজিড পেভমেন্ট", "বাংলাদেশে মহাসড়কে প্রথমবার সেমি-রিজিড পেভমেন্ট ও রিইনফোর্সড রিটেইনিং ওয়ালের ব্যবহার।"),
       "zh": ("工程", "首次采用半刚性路面", "在孟加拉国公路上首次采用半刚性路面和加筋挡土墙。")},
      {"en": ("Operations", "First fully access-controlled expressway section", "An access-controlled toll carriageway with separate service roads, opened to traffic in 2025."),
       "bn": ("পরিচালনা", "প্রথম পূর্ণ নিয়ন্ত্রিত-প্রবেশ এক্সপ্রেসওয়ে অংশ", "পৃথক সার্ভিস রোডসহ নিয়ন্ত্রিত-প্রবেশ টোল সড়ক, ২০২৫ সালে যান চলাচলের জন্য খোলা।"),
       "zh": ("运营", "首个全封闭式快速路段", "配备独立辅路的封闭式收费车道，于2025年通车。")},
    ]),
    rich(("Awards", "<p>Awards received by DBEDC and the project are listed here with the awarding body and date.</p>"),
         ("পুরস্কার", "<p>DBEDC ও প্রকল্পের প্রাপ্ত পুরস্কারগুলো প্রদানকারী প্রতিষ্ঠান ও তারিখসহ এখানে তালিকাভুক্ত করা হয়।</p>"),
         ("奖项", "<p>DBEDC及本项目获得的奖项将在此列出，并注明颁奖机构和日期。</p>")),
  ],
})

EXTRA = [
  ("contact", "Sample location", ("map-pin-list", {
    "en": {"heading": "Where to find us", "intro": "", "showFilter": "no", "items": [
      {"name": "DBEDC operations office", "type": "Office", "address": "Vogra Toll Plaza, Dhaka Bypass Expressway, Gazipur", "lat": 23.9753672, "lng": 90.38928, "hours": "Sunday–Thursday, 9:00–17:00", "amenities": [], "notes": "Sample location — to be confirmed.", "mapHref": "https://www.openstreetmap.org/?mlat=23.9753672&mlon=90.38928#map=16/23.9753672/90.38928"}]},
    "bn": {"heading": "আমাদের কোথায় পাবেন", "intro": "", "showFilter": "no", "items": [
      {"name": "DBEDC পরিচালনা কার্যালয়", "type": "কার্যালয়", "address": "ভোগড়া টোল প্লাজা, ঢাকা বাইপাস এক্সপ্রেসওয়ে, গাজীপুর", "lat": 23.9753672, "lng": 90.38928, "hours": "রবিবার–বৃহস্পতিবার, ৯:০০–১৭:০০", "amenities": [], "notes": "নমুনা অবস্থান — নিশ্চিত করা হবে।", "mapHref": "https://www.openstreetmap.org/?mlat=23.9753672&mlon=90.38928#map=16/23.9753672/90.38928"}]},
    "zh": {"heading": "我们的位置", "intro": "", "showFilter": "no", "items": [
      {"name": "DBEDC运营办公室", "type": "办公室", "address": "达卡绕城高速公路Vogra收费站，加济普尔", "lat": 23.9753672, "lng": 90.38928, "hours": "周日至周四 9:00–17:00", "amenities": [], "notes": "示例位置——待确认。", "mapHref": "https://www.openstreetmap.org/?mlat=23.9753672&mlon=90.38928#map=16/23.9753672/90.38928"}]},
  })),
]
