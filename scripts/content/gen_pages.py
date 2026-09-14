import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import argparse
from pages_w3 import PAGES as W3, rich
from pages_w4 import PAGES as W4
from pages_w5 import PAGES as W5
import pages_services

SERVICES = '--services' in sys.argv
ALL = pages_services.PAGES if SERVICES else W3 + W4 + W5

# fix the one copied length in prose
for p in ALL:
    for i, (t, d) in enumerate(p["blocks"]):
        for loc in d:
            s = json.dumps(d[loc], ensure_ascii=False)
            s = s.replace("A 48-kilometre road through", "A road through")
            s = s.replace(' rel=\\"noopener\\"', "")
            d[loc] = json.loads(s)

if SERVICES:
    EXTRA = pages_services.EXTRA
else:
    # Additions to existing pages: (slug, locator phrase that must NOT already exist in en, block)
    EXTRA = [
      ("grievances", "grs.gov.bd", rich(
        ("If you are not satisfied with the answer", "<p>Every reply names the officer who handled your grievance. If the answer does not resolve it, reply quoting your tracking number and ask for a review by DBEDC's appeal officer, who was not involved in the first decision; the review is answered within 15 working days.</p><p>You can also lodge a grievance through the Government's Grievance Redress System at <a href=\"https://www.grs.gov.bd\" rel=\"noopener\">grs.gov.bd</a>, which reaches the Roads and Highways Department. Land acquisition compensation is handled by the Deputy Commissioner's office; see <a href=\"disclosures/land-acquisition\">land acquisition</a>.</p>"),
        ("উত্তরে সন্তুষ্ট না হলে", "<p>প্রতিটি উত্তরে আপনার অভিযোগ দেখেছেন এমন কর্মকর্তার নাম থাকে। উত্তরে সমাধান না হলে ট্র্যাকিং নম্বর উল্লেখ করে উত্তর দিন এবং DBEDC-এর আপিল কর্মকর্তার কাছে পুনর্বিবেচনার অনুরোধ করুন, যিনি প্রথম সিদ্ধান্তে যুক্ত ছিলেন না; ১৫ কার্যদিবসের মধ্যে পুনর্বিবেচনার উত্তর দেওয়া হয়।</p><p>সরকারের অভিযোগ প্রতিকার ব্যবস্থার মাধ্যমেও অভিযোগ করতে পারেন: <a href=\"https://www.grs.gov.bd\" rel=\"noopener\">grs.gov.bd</a>, যা সড়ক ও জনপথ অধিদপ্তরে পৌঁছায়। ভূমি অধিগ্রহণের ক্ষতিপূরণ জেলা প্রশাসকের কার্যালয় দেখে; দেখুন <a href=\"disclosures/land-acquisition\">ভূমি অধিগ্রহণ</a>।</p>"),
        ("如对答复不满意", "<p>每份答复都会注明处理您投诉的官员。若答复未能解决问题，请引用跟踪编号回复，申请由未参与初次决定的DBEDC申诉官员复核；复核在15个工作日内答复。</p><p>您也可以通过政府投诉处理系统<a href=\"https://www.grs.gov.bd\" rel=\"noopener\">grs.gov.bd</a>提交投诉，该系统直达孟加拉国公路局。征地补偿由县专员办公室负责，详见<a href=\"disclosures/land-acquisition\">征地</a>。</p>"))),
      ("accessibility", "axe-core", rich(
        ("How this website is tested", "<p>The pages road users rely on — the home page, toll rates and the fare calculator, the corridor map, traffic status, route, rules, contact, grievances and search — are tested automatically against WCAG 2.1 level AA with the axe-core rule set, in English, Bangla and Chinese, before every release. A release with a serious or critical failure is not published.</p><p>Automated testing finds only part of real barriers. Known limits: the corridor map is a visual diagram, and the same information is given as a table beside it; documents uploaded as PDFs may not all be tagged for screen readers. If you meet a barrier, tell us through the <a href=\"contact\">contact form</a> and it will be answered within 10 working days.</p>"),
        ("এই ওয়েবসাইট কীভাবে পরীক্ষা করা হয়", "<p>সড়ক ব্যবহারকারীরা যেসব পাতার ওপর নির্ভর করেন — হোম পেজ, টোল হার ও ভাড়া হিসাবকারী, করিডোরের মানচিত্র, যান চলাচলের অবস্থা, রুট, সড়ক বিধি, যোগাযোগ, অভিযোগ ও অনুসন্ধান — প্রতিটি রিলিজের আগে ইংরেজি, বাংলা ও চীনা ভাষায় axe-core নিয়মাবলি দিয়ে WCAG 2.1 AA মানে স্বয়ংক্রিয়ভাবে পরীক্ষা করা হয়। গুরুতর বা সংকটপূর্ণ ত্রুটিসহ কোনো রিলিজ প্রকাশ করা হয় না।</p><p>স্বয়ংক্রিয় পরীক্ষা বাস্তব বাধার একটি অংশই খুঁজে পায়। জানা সীমাবদ্ধতা: করিডোরের মানচিত্র একটি দৃশ্যমান চিত্র, একই তথ্য পাশে সারণিতে দেওয়া আছে; PDF হিসেবে আপলোড করা সব নথি স্ক্রিন রিডারের জন্য ট্যাগ করা না-ও থাকতে পারে। কোনো বাধার সম্মুখীন হলে <a href=\"contact\">যোগাযোগ ফরমে</a> জানান, ১০ কার্যদিবসের মধ্যে উত্তর দেওয়া হবে।</p>"),
        ("本网站如何测试", "<p>道路使用者依赖的页面——首页、通行费标准和费用计算器、走廊地图、交通状况、路线、道路规则、联系、投诉和搜索——在每次发布前均以英文、孟加拉文和中文，使用axe-core规则集按WCAG 2.1 AA级进行自动测试。存在严重或关键问题的版本不予发布。</p><p>自动测试只能发现部分实际障碍。已知局限：走廊地图为可视化图示，旁边以表格形式提供相同信息；以PDF上传的文件可能并非全部带有屏幕阅读器标签。如遇访问障碍，请通过<a href=\"contact\">联系表单</a>告知，我们将在10个工作日内答复。</p>"))),
    ]


def q(s):
    return "'" + str(s).replace("\\", "\\\\").replace("'", "''") + "'"

def js(d):
    return json.dumps(d, ensure_ascii=False, separators=(",", ":"))

# dump for validation
dump = []
for p in ALL:
    for t, d in p["blocks"]:
        for loc in ("en", "bn", "zh"):
            dump.append({"slug": p["slug"], "type": t, "locale": loc, "data": d[loc]})
for slug, phrase, (t, d) in EXTRA:
    for loc in ("en", "bn", "zh"):
        d[loc] = json.loads(json.dumps(d[loc], ensure_ascii=False).replace(' rel=\\"noopener\\"', ''))
        dump.append({"slug": slug, "type": t, "locale": loc, "data": d[loc]})
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages-dump.json'), 'w', encoding='utf-8').write(json.dumps(dump, ensure_ascii=False))

HEADER_34 = """-- 34-remaining-pages.sql — the master plan's W3, W4 and W5 pages, in English, Bangla and Chinese.
--
-- Corporate and statutory (W3): concession and financing, organisation,
-- careers, integrity (National Integrity Strategy), right to information,
-- citizen charter, reports and statistics, policies, environmental and social
-- safeguards, public consultations, standards and design.
-- Road-user services (W4): vehicle classes, paying the toll and electronic
-- toll collection, closures and advisories (live), freight and heavy
-- vehicles, breakdown assistance, lost and found, toll disputes.
-- Media and engagement (W5): FAQ, downloads, media kit, press releases,
-- structures register (live), road safety education, search, site map.
-- Plus: GRS escalation on /grievances and the testing method on /accessibility.
--
-- Drafted from public sources — the Right to Information Act 2009, the
-- National Integrity Strategy 2012, the Environment Conservation Rules 2023,
-- the Road Transport Act 2018, the BRTA Speed Limit Guideline 2024 and the
-- PPPA project profile — for DBEDC to correct in the editor. Facts that are
-- records (lengths, rates, plazas, advisories, contact numbers) are rendered
-- by live blocks, never typed.
--
-- Pages are located by slug. A page's blocks are inserted only when the page
-- has none, so an operator's edits are never duplicated or overwritten; the
-- additions to existing pages are guarded on their own wording. Safe to
-- import twice.
"""
HEADER_36 = """-- 36-service-pages.sql — pages for the services added on 14 September 2026, in English, Bangla and Chinese.
--
-- Traffic cameras (live camera-grid), road alerts (SMS/WhatsApp sign-up), electronic
-- toll tags, fleet accounts and frequent travellers (applications with tracking
-- numbers), videos (broadcast coverage embedded from YouTube), a 360° tour
-- (panorama, from wide photographs as samples), recognition (the project's
-- documented firsts), and an office pin on the contact page (sample location).
-- Same rules as 34: located by slug, blocks only into an empty page, additions
-- guarded on their own wording. Safe to import twice.
"""
out = [HEADER_36 if SERVICES else HEADER_34]

for p in ALL:
    slug = p["slug"]
    out.append(f"-- ---------------------------------------------------------------- {slug}")
    out.append(f"INSERT IGNORE INTO `pages` (`slug`, `template`, `nav_order`, `status`, `published_at`) VALUES ({q(slug)}, 'default', 0, 'published', CURRENT_TIMESTAMP);")
    out.append(f"SET @p = (SELECT `id` FROM `pages` WHERE `slug` = {q(slug)});")
    for loc, (title, desc) in p["titles"].items():
        out.append(f"INSERT IGNORE INTO `page_translations` (`page_id`, `locale`, `title`, `seo_description`, `status`) VALUES (@p, {q(loc)}, {q(title)}, {q(desc)}, 'published');")
    out.append("SET @fresh = (SELECT COUNT(*) = 0 FROM `blocks` WHERE `page_id` = @p);")
    for i, (t, d) in enumerate(p["blocks"]):
        out.append(f"INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, {q(t)}, {i}, 'published' FROM DUAL WHERE @fresh = 1;")
        out.append("SET @b = IF(@fresh = 1, LAST_INSERT_ID(), NULL);")
        vals = ", ".join(f"(@b, {q(loc)}, {q(js(d[loc]))}, 'published')" for loc in ("en", "bn", "zh"))
        out.append(f"INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT * FROM (SELECT @b AS a, 'x' AS l, '' AS d, '' AS s) z WHERE 1 = 0;")
        for loc in ("en", "bn", "zh"):
            out.append(f"INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, {q(loc)}, {q(js(d[loc]))}, 'published' FROM DUAL WHERE @b IS NOT NULL;")
    out.append("")

for slug, phrase, (t, d) in EXTRA:
    out.append(f"-- ---------------------------------------------------------------- addition to {slug}")
    out.append(f"SET @p = (SELECT `id` FROM `pages` WHERE `slug` = {q(slug)});")
    out.append(f"SET @has = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en' WHERE b.`page_id` = @p AND CAST(t.`data` AS CHAR) LIKE {q('%' + phrase + '%')});")
    out.append("SET @ok = (@p IS NOT NULL AND @has = 0);")
    # Before a closing call-to-action band, if the page ends with one.
    out.append("SET @last = (SELECT `id` FROM `blocks` WHERE `page_id` = @p ORDER BY `sort_order` DESC, `id` DESC LIMIT 1);")
    out.append("SET @lastsort = (SELECT `sort_order` FROM `blocks` WHERE `id` = @last);")
    out.append("SET @endcta = (SELECT `type` = 'cta-band' FROM `blocks` WHERE `id` = @last);")
    out.append("UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `id` = @last AND @ok AND @endcta = 1;")
    out.append(f"INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, {q(t)}, IF(@endcta = 1, @lastsort, COALESCE(@lastsort, 0) + 1), 'published' FROM DUAL WHERE @ok;")
    out.append("SET @b = IF(@ok, LAST_INSERT_ID(), NULL);")
    for loc in ("en", "bn", "zh"):
        out.append(f"INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, {q(loc)}, {q(js(d[loc]))}, 'published' FROM DUAL WHERE @b IS NOT NULL;")
    out.append("")

out.append("INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('" + ('36-service-pages' if SERVICES else '34-remaining-pages') + "');")
sql = "\n".join(line for line in out if "WHERE 1 = 0" not in line) + "\n"
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'db', 'sql', ('36-service-pages.sql' if SERVICES else '34-remaining-pages.sql')), 'w', encoding='utf-8', newline='\n').write(sql)
print('pages', len(ALL), 'blocks', sum(len(p['blocks']) for p in ALL))
