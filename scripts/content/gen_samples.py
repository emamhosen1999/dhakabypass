# -*- coding: utf-8 -*-
"""
39-sample-records.sql: every item that waits on DBEDC, built out with clearly
labelled SAMPLE data so each feature is finished end to end and the operator
replaces values rather than builds screens. Every sample carries the word
"Sample" (en), "নমুনা" (bn) or "示例" (zh) in a visible field, and the list of
what to replace is docs/handover/2026-09-14-information-to-replace.md.

  python scripts/content/gen_samples.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pages_w3 import rich, cards

def q(s):
    return "'" + str(s).replace("\\", "\\\\").replace("'", "''") + "'"

def js(d):
    return json.dumps(d, ensure_ascii=False, separators=(",", ":"))

def directory(heading, intro, items):
    out = {}
    for l in ("en", "bn", "zh"):
        out[l] = {"heading": heading[l], "intro": intro[l], "items": [dict(zip(("department", "role", "name", "phone", "email", "hours", "notes"), it[l])) for it in items]}
    return ("contact-directory", out)

def documents(heading, intro, docs):
    out = {}
    for l in ("en", "bn", "zh"):
        out[l] = {"heading": heading[l], "intro": intro[l], "documents": [dict(zip(("title", "description", "file", "fileType", "fileSize", "date"), d[l])) for d in docs]}
    return ("document-list", out)

def table(heading, intro, caption, columns, rows, note):
    out = {}
    for l in ("en", "bn", "zh"):
        out[l] = {"heading": heading[l], "intro": intro[l], "caption": caption[l],
                  "columns": [{"label": c, "numeric": 0} for c in columns[l]],
                  "rows": [{"cells": r[l]} for r in rows], "rowHeaderColumn": 0, "note": note[l]}
    return ("data-table", out)

SAMPLE = {"en": "Sample", "bn": "নমুনা", "zh": "示例"}
PDF = "/downloads/sample-document.pdf"

EXTRA = [
  # ------------------------------------------------------------ officers (RTI, GRS, control room, media)
  ("contact", "Sample officer", directory(
    {"en": "Who to contact", "bn": "কার সঙ্গে যোগাযোগ করবেন", "zh": "联系对象"},
    {"en": "Role lines and mailboxes. Names, numbers and addresses shown here are sample entries until DBEDC confirms them.",
     "bn": "দায়িত্বভিত্তিক লাইন ও মেইলবক্স। এখানে দেখানো নাম, নম্বর ও ঠিকানা DBEDC নিশ্চিত না করা পর্যন্ত নমুনা।",
     "zh": "职能电话与邮箱。此处的姓名、号码和地址为示例，待DBEDC确认。"},
    [
      {"en": ("Control room", "24-hour incident line", "Sample officer: Duty Controller", "+880 2 5555 0199", "control@dhakabypass.com", "24 hours, every day", "Sample entry. Breakdowns, crashes, obstructions on the expressway."),
       "bn": ("নিয়ন্ত্রণ কক্ষ", "২৪ ঘণ্টার দুর্ঘটনা লাইন", "নমুনা কর্মকর্তা: ডিউটি কন্ট্রোলার", "+880 2 5555 0199", "control@dhakabypass.com", "প্রতিদিন ২৪ ঘণ্টা", "নমুনা তথ্য। বিকল গাড়ি, দুর্ঘটনা ও প্রতিবন্ধকতা।"),
       "zh": ("控制室", "24小时事故热线", "示例官员：值班控制员", "+880 2 5555 0199", "control@dhakabypass.com", "每天24小时", "示例信息。车辆故障、事故、道路障碍。")},
      {"en": ("Customer service", "Toll and account enquiries", "", "+880 2 5555 0100", "info@dhakabypass.com", "Sunday–Thursday 9:00–17:00", "Sample entry."),
       "bn": ("গ্রাহক সেবা", "টোল ও অ্যাকাউন্ট বিষয়ক", "", "+880 2 5555 0100", "info@dhakabypass.com", "রবি–বৃহস্পতি ৯:০০–১৭:০০", "নমুনা তথ্য।"),
       "zh": ("客户服务", "通行费与账户咨询", "", "+880 2 5555 0100", "info@dhakabypass.com", "周日至周四 9:00–17:00", "示例信息。")},
      {"en": ("Grievances", "Grievance Redress focal officer", "Sample officer: Manager, Customer Relations", "+880 2 5555 0101", "grievance@dhakabypass.com", "Sunday–Thursday 9:00–17:00", "Sample entry. First-instance answer within the published deadline."),
       "bn": ("অভিযোগ", "অভিযোগ প্রতিকার ফোকাল কর্মকর্তা", "নমুনা কর্মকর্তা: ব্যবস্থাপক, গ্রাহক সম্পর্ক", "+880 2 5555 0101", "grievance@dhakabypass.com", "রবি–বৃহস্পতি ৯:০০–১৭:০০", "নমুনা তথ্য। প্রকাশিত সময়সীমার মধ্যে প্রথম উত্তর।"),
       "zh": ("投诉", "投诉处理联络官", "示例官员：客户关系经理", "+880 2 5555 0101", "grievance@dhakabypass.com", "周日至周四 9:00–17:00", "示例信息。在公布期限内作出初次答复。")},
      {"en": ("Grievances", "Appeal officer", "Sample officer: Head of Operations", "+880 2 5555 0102", "appeals@dhakabypass.com", "Sunday–Thursday 9:00–17:00", "Sample entry. Reviews a grievance the focal officer's answer did not resolve, within 15 working days."),
       "bn": ("অভিযোগ", "আপিল কর্মকর্তা", "নমুনা কর্মকর্তা: পরিচালনা প্রধান", "+880 2 5555 0102", "appeals@dhakabypass.com", "রবি–বৃহস্পতি ৯:০০–১৭:০০", "নমুনা তথ্য। ১৫ কার্যদিবসের মধ্যে পুনর্বিবেচনা।"),
       "zh": ("投诉", "申诉官员", "示例官员：运营负责人", "+880 2 5555 0102", "appeals@dhakabypass.com", "周日至周四 9:00–17:00", "示例信息。15个工作日内复核。")},
      {"en": ("Right to information", "Designated Information Officer (RTI Act 2009, s.10)", "Sample officer: Company Secretary", "+880 2 5555 0103", "rti@dhakabypass.com", "Sunday–Thursday 9:00–17:00", "Sample entry. Requests answered within 20 working days; 30 where a third party is involved."),
       "bn": ("তথ্য অধিকার", "দায়িত্বপ্রাপ্ত কর্মকর্তা (তথ্য অধিকার আইন ২০০৯, ধারা ১০)", "নমুনা কর্মকর্তা: কোম্পানি সচিব", "+880 2 5555 0103", "rti@dhakabypass.com", "রবি–বৃহস্পতি ৯:০০–১৭:০০", "নমুনা তথ্য। ২০ কার্যদিবসে উত্তর; তৃতীয় পক্ষ জড়িত থাকলে ৩০।"),
       "zh": ("信息公开", "指定信息官员（2009年信息权利法第10条）", "示例官员：公司秘书", "+880 2 5555 0103", "rti@dhakabypass.com", "周日至周四 9:00–17:00", "示例信息。20个工作日内答复；涉及第三方时为30日。")},
      {"en": ("Right to information", "Appellate authority", "Sample officer: Chief Executive Officer", "", "rti-appeal@dhakabypass.com", "", "Sample entry. Appeal within 30 days of a refusal or a missed deadline."),
       "bn": ("তথ্য অধিকার", "আপিল কর্তৃপক্ষ", "নমুনা কর্মকর্তা: প্রধান নির্বাহী কর্মকর্তা", "", "rti-appeal@dhakabypass.com", "", "নমুনা তথ্য। প্রত্যাখ্যান বা সময়সীমা পার হলে ৩০ দিনের মধ্যে আপিল।"),
       "zh": ("信息公开", "申诉机关", "示例官员：首席执行官", "", "rti-appeal@dhakabypass.com", "", "示例信息。被拒绝或逾期后30日内申诉。")},
      {"en": ("Media", "Press and media enquiries", "Sample officer: Communications Manager", "+880 2 5555 0104", "media@dhakabypass.com", "Sunday–Thursday 9:00–17:00", "Sample entry."),
       "bn": ("গণমাধ্যম", "সংবাদমাধ্যম বিষয়ক", "নমুনা কর্মকর্তা: যোগাযোগ ব্যবস্থাপক", "+880 2 5555 0104", "media@dhakabypass.com", "রবি–বৃহস্পতি ৯:০০–১৭:০০", "নমুনা তথ্য।"),
       "zh": ("媒体", "新闻与媒体咨询", "示例官员：传播经理", "+880 2 5555 0104", "media@dhakabypass.com", "周日至周四 9:00–17:00", "示例信息。")},
      {"en": ("Integrity", "Integrity focal point (National Integrity Strategy)", "Sample officer: Head of Internal Audit", "", "integrity@dhakabypass.com", "", "Sample entry. Reports of corruption or misconduct; anonymous reports accepted."),
       "bn": ("শুদ্ধাচার", "শুদ্ধাচার ফোকাল পয়েন্ট (জাতীয় শুদ্ধাচার কৌশল)", "নমুনা কর্মকর্তা: অভ্যন্তরীণ নিরীক্ষা প্রধান", "", "integrity@dhakabypass.com", "", "নমুনা তথ্য। দুর্নীতি বা অসদাচরণের অভিযোগ; পরিচয় গোপন রাখা যায়।"),
       "zh": ("廉政", "廉政联络人（国家廉政战略）", "示例官员：内部审计负责人", "", "integrity@dhakabypass.com", "", "示例信息。举报腐败或不当行为；接受匿名举报。")},
    ])),

  # ------------------------------------------------------------ RTI page: named officers
  ("disclosures/right-to-information", "Sample officer", directory(
    {"en": "Designated officers", "bn": "দায়িত্বপ্রাপ্ত কর্মকর্তা", "zh": "指定官员"},
    {"en": "Under section 10 of the Right to Information Act 2009. Sample entries until DBEDC designates the officers.",
     "bn": "তথ্য অধিকার আইন ২০০৯-এর ধারা ১০ অনুযায়ী। DBEDC কর্মকর্তা মনোনীত না করা পর্যন্ত নমুনা।",
     "zh": "依据2009年信息权利法第10条。DBEDC指定官员前为示例。"},
    [
      {"en": ("Right to information", "Designated Information Officer", "Sample officer: Company Secretary", "+880 2 5555 0103", "rti@dhakabypass.com", "Sunday–Thursday 9:00–17:00", "Sample entry."),
       "bn": ("তথ্য অধিকার", "দায়িত্বপ্রাপ্ত কর্মকর্তা", "নমুনা কর্মকর্তা: কোম্পানি সচিব", "+880 2 5555 0103", "rti@dhakabypass.com", "রবি–বৃহস্পতি ৯:০০–১৭:০০", "নমুনা তথ্য।"),
       "zh": ("信息公开", "指定信息官员", "示例官员：公司秘书", "+880 2 5555 0103", "rti@dhakabypass.com", "周日至周四 9:00–17:00", "示例信息。")},
      {"en": ("Right to information", "Appellate authority", "Sample officer: Chief Executive Officer", "", "rti-appeal@dhakabypass.com", "", "Sample entry."),
       "bn": ("তথ্য অধিকার", "আপিল কর্তৃপক্ষ", "নমুনা কর্মকর্তা: প্রধান নির্বাহী কর্মকর্তা", "", "rti-appeal@dhakabypass.com", "", "নমুনা তথ্য।"),
       "zh": ("信息公开", "申诉机关", "示例官员：首席执行官", "", "rti-appeal@dhakabypass.com", "", "示例信息。")},
    ])),

  # ------------------------------------------------------------ RTI proactive disclosure list
  ("disclosures/right-to-information", "Sample document", documents(
    {"en": "Proactive disclosure", "bn": "স্বপ্রণোদিত তথ্য প্রকাশ", "zh": "主动公开"},
    {"en": "Published without a request, as section 6 of the Act asks. Sample documents until DBEDC supplies the originals.",
     "bn": "আইনের ধারা ৬ অনুযায়ী অনুরোধ ছাড়াই প্রকাশিত। DBEDC মূল নথি দেওয়া পর্যন্ত নমুনা।",
     "zh": "依法第6条无需申请即公开。DBEDC提供原件前为示例。"},
    [
      {"en": ("Sample: Organisational structure and functions", "Departments, their heads and what each is responsible for.", PDF, "PDF", "0.3 MB", "2026-07-01"),
       "bn": ("নমুনা: সাংগঠনিক কাঠামো ও কার্যাবলি", "বিভাগ, বিভাগীয় প্রধান ও দায়িত্ব।", PDF, "PDF", "0.3 MB", "2026-07-01"),
       "zh": ("示例：组织架构与职能", "各部门、负责人及职责。", PDF, "PDF", "0.3 MB", "2026-07-01")},
      {"en": ("Sample: Information request form and fee schedule", "The form prescribed by the Information Commission and the fee per page.", PDF, "PDF", "0.1 MB", "2026-07-01"),
       "bn": ("নমুনা: তথ্য প্রাপ্তির আবেদন ফরম ও ফি", "তথ্য কমিশন নির্ধারিত ফরম ও পাতাপ্রতি ফি।", PDF, "PDF", "0.1 MB", "2026-07-01"),
       "zh": ("示例：信息申请表及收费标准", "信息委员会规定的表格及每页费用。", PDF, "PDF", "0.1 MB", "2026-07-01")},
      {"en": ("Sample: Annual RTI report 2025", "Requests received, answered, refused and appealed in the year.", PDF, "PDF", "0.2 MB", "2026-01-31"),
       "bn": ("নমুনা: বার্ষিক তথ্য অধিকার প্রতিবেদন ২০২৫", "বছরে প্রাপ্ত, উত্তরদত্ত, প্রত্যাখ্যাত ও আপিলকৃত অনুরোধ।", PDF, "PDF", "0.2 MB", "2026-01-31"),
       "zh": ("示例：2025年信息公开年报", "年度内收到、答复、拒绝及申诉的申请数。", PDF, "PDF", "0.2 MB", "2026-01-31")},
    ])),

  # ------------------------------------------------------------ land acquisition library
  ("disclosures/land-acquisition", "Sample document", documents(
    {"en": "Resettlement documents", "bn": "পুনর্বাসন নথি", "zh": "移民安置文件"},
    {"en": "The plan, the entitlement matrix and the monitoring reports lenders require to be public. Sample files until DBEDC supplies the approved versions.",
     "bn": "পরিকল্পনা, প্রাপ্যতা ছক ও ঋণদাতাদের প্রয়োজনীয় পর্যবেক্ষণ প্রতিবেদন। DBEDC অনুমোদিত সংস্করণ দেওয়া পর্যন্ত নমুনা।",
     "zh": "安置计划、权益矩阵及贷款方要求公开的监测报告。DBEDC提供批准版本前为示例。"},
    [
      {"en": ("Sample: Resettlement Plan (final)", "Affected households, entitlements, budget and grievance mechanism for the Madanpur–Joydebpur corridor.", PDF, "PDF", "4.2 MB", "2019-06-30"),
       "bn": ("নমুনা: পুনর্বাসন পরিকল্পনা (চূড়ান্ত)", "ক্ষতিগ্রস্ত পরিবার, প্রাপ্যতা, বাজেট ও অভিযোগ প্রতিকার ব্যবস্থা।", PDF, "PDF", "4.2 MB", "2019-06-30"),
       "zh": ("示例：移民安置计划（终稿）", "受影响家庭、权益、预算及投诉机制。", PDF, "PDF", "4.2 MB", "2019-06-30")},
      {"en": ("Sample: Entitlement matrix (Bangla summary)", "What each category of affected person is entitled to, in plain Bangla.", PDF, "PDF", "0.4 MB", "2019-06-30"),
       "bn": ("নমুনা: প্রাপ্যতা ছক (বাংলা সারসংক্ষেপ)", "প্রতিটি শ্রেণির ক্ষতিগ্রস্ত ব্যক্তি কী পাবেন, সহজ বাংলায়।", PDF, "PDF", "0.4 MB", "2019-06-30"),
       "zh": ("示例：权益矩阵（孟加拉文摘要）", "各类受影响人员的权益，通俗孟加拉文。", PDF, "PDF", "0.4 MB", "2019-06-30")},
      {"en": ("Sample: Social monitoring report, January–June 2026", "Compensation paid, relocation progress and grievances received in the half-year.", PDF, "PDF", "1.1 MB", "2026-07-31"),
       "bn": ("নমুনা: সামাজিক পর্যবেক্ষণ প্রতিবেদন, জানুয়ারি–জুন ২০২৬", "ছয় মাসে প্রদত্ত ক্ষতিপূরণ, স্থানান্তর অগ্রগতি ও প্রাপ্ত অভিযোগ।", PDF, "PDF", "1.1 MB", "2026-07-31"),
       "zh": ("示例：社会监测报告（2026年1–6月）", "半年内已付补偿、搬迁进展及收到的投诉。", PDF, "PDF", "1.1 MB", "2026-07-31")},
      {"en": ("Sample: Grievance Redress Committee — members and contacts", "The committee at upazila level, its members and how to reach them.", PDF, "PDF", "0.1 MB", "2026-01-15"),
       "bn": ("নমুনা: অভিযোগ প্রতিকার কমিটি — সদস্য ও যোগাযোগ", "উপজেলা পর্যায়ের কমিটি, সদস্য ও যোগাযোগের উপায়।", PDF, "PDF", "0.1 MB", "2026-01-15"),
       "zh": ("示例：投诉处理委员会——成员及联系方式", "乡级委员会成员及联络方式。", PDF, "PDF", "0.1 MB", "2026-01-15")},
    ])),

  # ------------------------------------------------------------ environment library
  ("disclosures/environment", "Sample document", documents(
    {"en": "Environmental documents", "bn": "পরিবেশগত নথি", "zh": "环境文件"},
    {"en": "Assessment, clearance and monitoring. Sample files until DBEDC supplies the approved versions.",
     "bn": "মূল্যায়ন, ছাড়পত্র ও পর্যবেক্ষণ। DBEDC অনুমোদিত সংস্করণ দেওয়া পর্যন্ত নমুনা।",
     "zh": "评估、许可与监测。DBEDC提供批准版本前为示例。"},
    [
      {"en": ("Sample: Initial Environmental Examination and Environmental Management Plan", "Impacts identified along the corridor and the measures that manage them.", PDF, "PDF", "6.8 MB", "2019-03-31"),
       "bn": ("নমুনা: প্রাথমিক পরিবেশগত পরীক্ষা ও পরিবেশ ব্যবস্থাপনা পরিকল্পনা", "করিডোর বরাবর চিহ্নিত প্রভাব ও ব্যবস্থাপনার পদক্ষেপ।", PDF, "PDF", "6.8 MB", "2019-03-31"),
       "zh": ("示例：初步环境审查及环境管理计划", "沿线识别的影响及应对措施。", PDF, "PDF", "6.8 MB", "2019-03-31")},
      {"en": ("Sample: Environmental Clearance Certificate", "Issued by the Department of Environment, with its conditions.", PDF, "PDF", "0.3 MB", "2019-09-12"),
       "bn": ("নমুনা: পরিবেশগত ছাড়পত্র", "পরিবেশ অধিদপ্তর কর্তৃক প্রদত্ত, শর্তসহ।", PDF, "PDF", "0.3 MB", "2019-09-12"),
       "zh": ("示例：环境许可证书", "由环境部签发，附条件。", PDF, "PDF", "0.3 MB", "2019-09-12")},
      {"en": ("Sample: Environmental monitoring report, January–June 2026", "Air, noise and water results against the standards, and corrective actions.", PDF, "PDF", "1.6 MB", "2026-07-31"),
       "bn": ("নমুনা: পরিবেশ পর্যবেক্ষণ প্রতিবেদন, জানুয়ারি–জুন ২০২৬", "মানদণ্ডের বিপরীতে বায়ু, শব্দ ও পানির ফলাফল এবং সংশোধনমূলক ব্যবস্থা।", PDF, "PDF", "1.6 MB", "2026-07-31"),
       "zh": ("示例：环境监测报告（2026年1–6月）", "空气、噪声、水质结果对照标准及整改措施。", PDF, "PDF", "1.6 MB", "2026-07-31")},
    ])),

  # ------------------------------------------------------------ reports: annual report and accounts
  ("disclosures/reports", "Sample document", documents(
    {"en": "Reports and accounts", "bn": "প্রতিবেদন ও হিসাব", "zh": "报告与账目"},
    {"en": "Sample files until DBEDC's audited statements are approved for publication.",
     "bn": "DBEDC-এর নিরীক্ষিত বিবরণী প্রকাশের অনুমোদন পাওয়া পর্যন্ত নমুনা।",
     "zh": "DBEDC审计报表获准发布前为示例。"},
    [
      {"en": ("Sample: Annual report 2025", "The year in construction and operations, governance, and the audited financial statements.", PDF, "PDF", "3.5 MB", "2026-06-30"),
       "bn": ("নমুনা: বার্ষিক প্রতিবেদন ২০২৫", "নির্মাণ ও পরিচালনার বছর, সুশাসন ও নিরীক্ষিত আর্থিক বিবরণী।", PDF, "PDF", "3.5 MB", "2026-06-30"),
       "zh": ("示例：2025年年报", "建设与运营年度回顾、治理及审计财务报表。", PDF, "PDF", "3.5 MB", "2026-06-30")},
      {"en": ("Sample: Audited financial statements 2025", "Balance sheet, income statement, cash flows and the auditor's report.", PDF, "PDF", "1.2 MB", "2026-06-30"),
       "bn": ("নমুনা: নিরীক্ষিত আর্থিক বিবরণী ২০২৫", "স্থিতিপত্র, আয় বিবরণী, নগদ প্রবাহ ও নিরীক্ষকের প্রতিবেদন।", PDF, "PDF", "1.2 MB", "2026-06-30"),
       "zh": ("示例：2025年审计财务报表", "资产负债表、损益表、现金流量表及审计报告。", PDF, "PDF", "1.2 MB", "2026-06-30")},
      {"en": ("Sample: Toll revenue and traffic, quarterly", "Vehicles by class and toll collected per plaza, each quarter since opening.", PDF, "PDF", "0.2 MB", "2026-07-15"),
       "bn": ("নমুনা: ত্রৈমাসিক টোল আয় ও যানবাহন", "উদ্বোধনের পর থেকে প্রতি ত্রৈমাসিকে প্লাজাভিত্তিক যানবাহন ও টোল।", PDF, "PDF", "0.2 MB", "2026-07-15"),
       "zh": ("示例：季度通行费收入与交通量", "通车以来各季度各收费站分车型车流量及通行费。", PDF, "PDF", "0.2 MB", "2026-07-15")},
    ])),

  # ------------------------------------------------------------ policies
  ("disclosures/policies", "Sample document", documents(
    {"en": "Policy documents", "bn": "নীতিমালা", "zh": "政策文件"},
    {"en": "Sample files until the board-approved policies are supplied.", "bn": "পরিচালনা পর্ষদ-অনুমোদিত নীতিমালা দেওয়া পর্যন্ত নমুনা।", "zh": "董事会批准的政策提供前为示例。"},
    [
      {"en": ("Sample: Anti-corruption and gifts policy", "", PDF, "PDF", "0.2 MB", "2025-01-01"), "bn": ("নমুনা: দুর্নীতিবিরোধী ও উপহার নীতি", "", PDF, "PDF", "0.2 MB", "2025-01-01"), "zh": ("示例：反腐败与礼品政策", "", PDF, "PDF", "0.2 MB", "2025-01-01")},
      {"en": ("Sample: Whistle-blowing policy", "", PDF, "PDF", "0.2 MB", "2025-01-01"), "bn": ("নমুনা: তথ্য ফাঁসকারী সুরক্ষা নীতি", "", PDF, "PDF", "0.2 MB", "2025-01-01"), "zh": ("示例：举报人保护政策", "", PDF, "PDF", "0.2 MB", "2025-01-01")},
      {"en": ("Sample: Related-party transactions policy", "", PDF, "PDF", "0.1 MB", "2025-01-01"), "bn": ("নমুনা: সংশ্লিষ্ট পক্ষ লেনদেন নীতি", "", PDF, "PDF", "0.1 MB", "2025-01-01"), "zh": ("示例：关联交易政策", "", PDF, "PDF", "0.1 MB", "2025-01-01")},
      {"en": ("Sample: Occupational health and safety policy", "", PDF, "PDF", "0.3 MB", "2025-01-01"), "bn": ("নমুনা: পেশাগত স্বাস্থ্য ও নিরাপত্তা নীতি", "", PDF, "PDF", "0.3 MB", "2025-01-01"), "zh": ("示例：职业健康与安全政策", "", PDF, "PDF", "0.3 MB", "2025-01-01")},
      {"en": ("Sample: CCTV and personal data policy", "How camera images and personal data are used and kept.", PDF, "PDF", "0.2 MB", "2026-09-01"), "bn": ("নমুনা: সিসিটিভি ও ব্যক্তিগত তথ্য নীতি", "ক্যামেরার ছবি ও ব্যক্তিগত তথ্য কীভাবে ব্যবহৃত ও সংরক্ষিত হয়।", PDF, "PDF", "0.2 MB", "2026-09-01"), "zh": ("示例：监控与个人数据政策", "摄像画面与个人数据的使用与保存方式。", PDF, "PDF", "0.2 MB", "2026-09-01")},
    ])),

  # ------------------------------------------------------------ tariff notices
  ("disclosures/tariff", "Sample notification", documents(
    {"en": "Notifications in force", "bn": "কার্যকর প্রজ্ঞাপন", "zh": "现行通告"},
    {"en": "Each toll figure on this site cites one of these. Sample notifications until DBEDC supplies the gazetted instruments.",
     "bn": "এই সাইটের প্রতিটি টোল অঙ্ক এর একটিকে উদ্ধৃত করে। DBEDC গেজেটকৃত প্রজ্ঞাপন দেওয়া পর্যন্ত নমুনা।",
     "zh": "本站每一通行费数字均引用其中之一。DBEDC提供公报文件前为示例。"},
    [
      {"en": ("Sample notification: S.R.O. No. 000-Law/2025 — toll schedule, Vogra–Purbachal section", "Rates per vehicle class for the section open to traffic; effective 24 August 2025.", PDF, "PDF", "0.2 MB", "2025-08-20"),
       "bn": ("নমুনা প্রজ্ঞাপন: এস.আর.ও. নং ০০০-আইন/২০২৫ — ভোগড়া–পূর্বাচল অংশের টোল তালিকা", "চালু অংশের যানবাহন শ্রেণিভিত্তিক হার; ২৪ আগস্ট ২০২৫ থেকে কার্যকর।", PDF, "PDF", "0.2 MB", "2025-08-20"),
       "zh": ("示例通告：S.R.O. 000-Law/2025——Vogra至Purbachal路段通行费表", "已通车路段各车型费率；2025年8月24日起生效。", PDF, "PDF", "0.2 MB", "2025-08-20")},
      {"en": ("Sample notification: toll exemptions", "Vehicle categories exempt from toll and the identification required at the plaza.", PDF, "PDF", "0.1 MB", "2025-08-20"),
       "bn": ("নমুনা প্রজ্ঞাপন: টোল অব্যাহতি", "টোলমুক্ত যানবাহনের শ্রেণি ও প্লাজায় প্রয়োজনীয় পরিচয়পত্র।", PDF, "PDF", "0.1 MB", "2025-08-20"),
       "zh": ("示例通告：通行费豁免", "免收通行费的车辆类别及收费站所需证件。", PDF, "PDF", "0.1 MB", "2025-08-20")},
    ])),

  # ------------------------------------------------------------ key facts table on the concession page
  ("about/concession", "Sample figure", table(
    {"en": "Key facts", "bn": "মূল তথ্য", "zh": "关键数据"},
    {"en": "One place for the figures the rest of the site quotes. Values marked sample await DBEDC's confirmation, with the source and date shown.",
     "bn": "সাইটের বাকি অংশে উদ্ধৃত সংখ্যাগুলোর একক উৎস। নমুনা চিহ্নিত মানগুলো DBEDC-এর নিশ্চিতকরণের অপেক্ষায়; উৎস ও তারিখ দেখানো আছে।",
     "zh": "本站其他页面引用数据的统一来源。标记为示例的数值待DBEDC确认；已注明来源与日期。"},
    {"en": "Key facts about the concession", "bn": "কনসেশনের মূল তথ্য", "zh": "特许经营关键数据"},
    {"en": ["Fact", "Value", "Source", "As at"], "bn": ["তথ্য", "মান", "উৎস", "তারিখ"], "zh": ["项目", "数值", "来源", "截至"]},
    [
      {"en": ["Project cost", "Sample figure: US$ 358.8 million", "BIFFL / lender disclosure", "2026-09"], "bn": ["প্রকল্প ব্যয়", "নমুনা সংখ্যা: ৩৫.৮৮ কোটি মার্কিন ডলার", "BIFFL / ঋণদাতার প্রকাশনা", "২০২৬-০৯"], "zh": ["项目造价", "示例数值：3.588亿美元", "BIFFL / 贷款方披露", "2026-09"]},
      {"en": ["Shareholding", "Sample figure: SRBG 70%, SEL 30% (UDC as introducing partner)", "Share register extract", "2026-09"], "bn": ["শেয়ারহোল্ডিং", "নমুনা সংখ্যা: SRBG ৭০%, SEL ৩০% (UDC পরিচয়কারী অংশীদার)", "শেয়ার রেজিস্টার", "২০২৬-০৯"], "zh": ["股权结构", "示例数值：SRBG 70%，SEL 30%（UDC为引介方）", "股东名册摘录", "2026-09"]},
      {"en": ["Concession term", "Sample figure: 25 years from signing (December 2018), including construction", "Concession agreement", "2026-09"], "bn": ["কনসেশন মেয়াদ", "নমুনা সংখ্যা: স্বাক্ষর (ডিসেম্বর ২০১৮) থেকে ২৫ বছর, নির্মাণসহ", "কনসেশন চুক্তি", "২০২৬-০৯"], "zh": ["特许期", "示例数值：自签约（2018年12月）起25年，含建设期", "特许经营协议", "2026-09"]},
      {"en": ["Grantor", "Roads and Highways Department, Government of Bangladesh", "Concession agreement", "2026-09"], "bn": ["গ্রান্টর", "সড়ক ও জনপথ অধিদপ্তর, বাংলাদেশ সরকার", "কনসেশন চুক্তি", "২০২৬-০৯"], "zh": ["授权方", "孟加拉国政府公路局", "特许经营协议", "2026-09"]},
      {"en": ["Lenders", "Sample: China Development Bank; Bangladesh Infrastructure Finance Fund Limited", "Financing agreements", "2026-09"], "bn": ["ঋণদাতা", "নমুনা: চায়না ডেভেলপমেন্ট ব্যাংক; বাংলাদেশ ইনফ্রাস্ট্রাকচার ফাইন্যান্স ফান্ড লিমিটেড", "অর্থায়ন চুক্তি", "২০২৬-০৯"], "zh": ["贷款方", "示例：国家开发银行；孟加拉国基础设施融资基金有限公司", "融资协议", "2026-09"]},
      {"en": ["Company registration", "Sample figure: RJSC C-000000/2018", "RJSC certificate", "2026-09"], "bn": ["কোম্পানি নিবন্ধন", "নমুনা সংখ্যা: RJSC C-000000/2018", "RJSC সনদ", "২০২৬-০৯"], "zh": ["公司注册", "示例数值：RJSC C-000000/2018", "RJSC证书", "2026-09"]},
      {"en": ["Registered office", "Sample: Level 8, Sample Tower, Gulshan Avenue, Dhaka 1212", "RJSC certificate", "2026-09"], "bn": ["নিবন্ধিত কার্যালয়", "নমুনা: লেভেল ৮, স্যাম্পল টাওয়ার, গুলশান অ্যাভিনিউ, ঢাকা ১২১২", "RJSC সনদ", "২০২৬-০৯"], "zh": ["注册办公地址", "示例：达卡1212 古尔山大道 示例大厦8层", "RJSC证书", "2026-09"]},
    ],
    {"en": "Values marked “Sample” are placeholders shown so the table is complete; each will be replaced by the confirmed figure and its source document.",
     "bn": "“নমুনা” চিহ্নিত মানগুলো সারণি সম্পূর্ণ রাখার জন্য দেখানো; প্রতিটি নিশ্চিত সংখ্যা ও উৎস নথি দিয়ে প্রতিস্থাপিত হবে।",
     "zh": "标记为“示例”的数值为占位，以使表格完整；每项将由确认数值及其来源文件替换。"})),

  # ------------------------------------------------------------ awards
  ("about/recognition", "Sample award", cards(
    {"en": "Awards", "bn": "পুরস্কার", "zh": "奖项"},
    {"en": "Sample entries until DBEDC confirms awards on record.", "bn": "DBEDC পুরস্কারের রেকর্ড নিশ্চিত করা পর্যন্ত নমুনা।", "zh": "DBEDC确认获奖记录前为示例。"},
    [
      {"en": ("Sample award · 2025", "Infrastructure Project of the Year", "Awarded by a national engineering body for the first PPP expressway section opened to traffic. Sample entry: awarding body and date to be confirmed."),
       "bn": ("নমুনা পুরস্কার · ২০২৫", "বছরের সেরা অবকাঠামো প্রকল্প", "যান চলাচলের জন্য খোলা প্রথম পিপিপি এক্সপ্রেসওয়ে অংশের জন্য জাতীয় প্রকৌশল সংস্থার পুরস্কার। নমুনা তথ্য: প্রদানকারী ও তারিখ নিশ্চিত করা হবে।"),
       "zh": ("示例奖项 · 2025", "年度基础设施项目", "国家工程机构就首个通车的PPP快速路段颁发。示例信息：颁奖机构与日期待确认。")},
      {"en": ("Sample award · 2024", "Occupational safety recognition", "One million safe working hours on the construction sites. Sample entry."),
       "bn": ("নমুনা পুরস্কার · ২০২৪", "পেশাগত নিরাপত্তা স্বীকৃতি", "নির্মাণস্থলে দশ লক্ষ নিরাপদ কর্মঘণ্টা। নমুনা তথ্য।"),
       "zh": ("示例奖项 · 2024", "职业安全表彰", "施工现场累计一百万安全工时。示例信息。")},
    ])),
]

def main():
    out = ["""-- 39-sample-records.sql — every item that waits on DBEDC, built out with SAMPLE data.
--
-- Named officers (control room, customer service, grievance focal and appeal,
-- RTI designated officer and appellate authority, media, integrity), the
-- document libraries lenders and the RTI Act expect (resettlement plan,
-- entitlement matrix, monitoring reports, IEE/ECC, annual report, audited
-- accounts, policies, tariff notifications), a key-facts table with source and
-- date, and awards. Every sample carries the word "Sample" / "নমুনা" / "示例"
-- in a visible field. The register of what to replace is
-- docs/handover/2026-09-14-information-to-replace.md.
--
-- Also: sample S.R.O. citations on the toll records for the open section,
-- sample company identity settings, and the DBEDC control-room number, so the
-- toll table cites an instrument and the footer shows both numbers.
--
-- Additions are guarded on their own wording. Safe to import twice.

SET NAMES utf8mb4;
"""]
    for slug, phrase, (t, d) in EXTRA:
        out.append(f"-- ---------------------------------------------------------------- addition to {slug}")
        out.append(f"SET @p = (SELECT `id` FROM `pages` WHERE `slug` = {q(slug)});")
        heading = d["en"].get("heading", phrase)
        out.append(f"SET @has = (SELECT COUNT(*) FROM `blocks` b JOIN `block_translations` t ON t.`block_id` = b.`id` AND t.`locale` = 'en' WHERE b.`page_id` = @p AND b.`type` = {q(t)} AND JSON_UNQUOTE(JSON_EXTRACT(t.`data`, '$.heading')) = {q(heading)});")
        out.append("SET @ok = (@p IS NOT NULL AND @has = 0);")
        out.append("SET @last = (SELECT `id` FROM `blocks` WHERE `page_id` = @p ORDER BY `sort_order` DESC, `id` DESC LIMIT 1);")
        out.append("SET @lastsort = (SELECT `sort_order` FROM `blocks` WHERE `id` = @last);")
        out.append("SET @endcta = (SELECT `type` = 'cta-band' FROM `blocks` WHERE `id` = @last);")
        out.append("UPDATE `blocks` SET `sort_order` = `sort_order` + 1 WHERE `id` = @last AND @ok AND @endcta = 1;")
        out.append(f"INSERT INTO `blocks` (`page_id`, `type`, `sort_order`, `status`) SELECT @p, {q(t)}, IF(@endcta = 1, @lastsort, COALESCE(@lastsort, 0) + 1), 'published' FROM DUAL WHERE @ok;")
        out.append("SET @b = IF(@ok, LAST_INSERT_ID(), NULL);")
        for loc in ("en", "bn", "zh"):
            out.append(f"INSERT INTO `block_translations` (`block_id`, `locale`, `data`, `status`) SELECT @b, {q(loc)}, {q(js(d[loc]))}, 'published' FROM DUAL WHERE @b IS NOT NULL;")
        out.append("")

    out.append("""-- ---------------------------------------------------------------- toll citations (sample)
-- The rate records for the open section cite a sample instrument, so no toll
-- figure renders without a citation. The number is a placeholder pattern
-- (000) that the real S.R.O. replaces; the date matches the opening.
UPDATE `toll_rates` SET `sro_number` = 'Sample: S.R.O. No. 000-Law/2025', `sro_date` = '2025-08-20', `sro_link` = '/downloads/sample-document.pdf'
 WHERE (`sro_number` IS NULL OR `sro_number` = '') AND `effective_from` <= '2025-08-24';

-- ---------------------------------------------------------------- company identity and control room (sample)
INSERT INTO `site_settings` (`setting_key`, `value`) VALUES
  ('contact.emergency_phone', '"+880 2 5555 0199"'),
  ('contact.phone', '"+880 2 5555 0100"'),
  ('contact.email', '"info@dhakabypass.com"'),
  ('contact.address', '{"en":"Sample: Level 8, Sample Tower, Gulshan Avenue, Dhaka 1212","bn":"নমুনা: লেভেল ৮, স্যাম্পল টাওয়ার, গুলশান অ্যাভিনিউ, ঢাকা ১২১২","zh":"示例：达卡1212 古尔山大道 示例大厦8层"}'),
  ('contact.hours', '{"en":"Sunday–Thursday, 9:00–17:00","bn":"রবিবার–বৃহস্পতিবার, ৯:০০–১৭:০০","zh":"周日至周四 9:00–17:00"}')
  ON DUPLICATE KEY UPDATE `value` = IF(TRIM(BOTH '"' FROM `value`) IN ('', '{}', '01610285004'), VALUES(`value`), `value`);

-- ---------------------------------------------------------------- sample media without people (UI audit UI-CONT-01)
-- The sample camera stills and panoramas showed workers, residents and a
-- ceremony beside text saying cameras show traffic, not people. Road-only
-- frames until real captures arrive.
UPDATE `cameras` SET `snapshot_url` = '/photo/20.webp' WHERE `is_sample` = 1 AND `snapshot_url` = '/photo/24.webp';
UPDATE `cameras` SET `snapshot_url` = '/photo/22.webp' WHERE `is_sample` = 1 AND `snapshot_url` = '/photo/25.webp';
UPDATE `cameras` SET `snapshot_url` = '/photo/23.webp' WHERE `is_sample` = 1 AND `snapshot_url` = '/photo/1.webp';
UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = JSON_SET(bt.`data`, '$.image', '/photo/20.webp')
 WHERE b.`type` = 'panorama' AND JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.image')) = '/photo/24.webp';

-- ---------------------------------------------------------------- video posters (UI audit UI-MEDIA-01)
-- The video tiles rendered as blank plates: the block will not fetch a
-- provider thumbnail (privacy, CSP), and no poster had been set. The site's
-- own corridor photographs stand in until DBEDC's footage arrives with frames.
UPDATE `block_translations` bt JOIN `blocks` b ON b.`id` = bt.`block_id`
   SET bt.`data` = JSON_SET(bt.`data`, '$.poster', ELT(1 + MOD(b.`sort_order`, 4), '/photo/20.webp', '/photo/22.webp', '/photo/23.webp', '/bg-hero.webp'))
 WHERE b.`type` = 'video-embed' AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(bt.`data`, '$.poster')), '') = '';

INSERT IGNORE INTO `schema_migrations` (`name`) VALUES ('39-sample-records');
""")
    # dump for validation
    dump = []
    for slug, phrase, (t, d) in EXTRA:
        for loc in ("en", "bn", "zh"):
            dump.append({"slug": slug, "type": t, "locale": loc, "data": d[loc]})
    here = os.path.dirname(os.path.abspath(__file__))
    open(os.path.join(here, 'samples-dump.json'), 'w', encoding='utf-8').write(json.dumps(dump, ensure_ascii=False))
    open(os.path.join(here, '..', '..', 'db', 'sql', '39-sample-records.sql'), 'w', encoding='utf-8', newline='\n').write("\n".join(out))
    print('blocks', len(EXTRA))

if __name__ == '__main__':
    main()
