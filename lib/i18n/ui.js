import { DEFAULT_LOCALE } from './locales.js';

/**
 * Chrome strings only — navigation, switchers, footer legal. Page content
 * lives in the CMS, never here. Bengali and Chinese are human-written.
 */
export const UI = {
  en: {
    navTravel: 'Travel Info', navProject: 'Project', navImpact: 'Impact',
    navAbout: 'About', navNews: 'News', navContact: 'Contact',
    skipToContent: 'Skip to content', language: 'Language', theme: 'Theme',
    emergency: 'Emergency', allRights: 'All rights reserved.',
    provisional: 'Provisional',
    provisionalBody: 'These figures are awaiting official confirmation and may change.',
    statusOpen: 'Open to traffic', statusConstruction: 'Under construction', statusPlanned: 'Planned',
    kindInterchange: 'Interchange', kindTollPlaza: 'Toll plaza', kindServiceArea: 'Service area',
    kindULoop: 'U-loop', kindPedestrianOverpass: 'Pedestrian overpass',
    colLocation: 'Location', colChainage: 'Chainage', colType: 'Type', colConnects: 'Connects',
    colStatus: 'Status', colVehicle: 'Vehicle class', colToll: 'Toll',
    openToTraffic: 'Open to traffic', noInterchanges: 'No interchanges have been published yet.',
    prohibitedVehicles: 'Prohibited vehicles',
    prohibitedNote: 'These vehicles may not use the expressway.',
    sevInfo: 'Notice', sevWarning: 'Advisory', sevClosure: 'Closure',
  },
  bn: {
    navTravel: 'ভ্রমণ তথ্য', navProject: 'প্রকল্প', navImpact: 'প্রভাব',
    navAbout: 'পরিচিতি', navNews: 'সংবাদ', navContact: 'যোগাযোগ',
    skipToContent: 'মূল বিষয়বস্তুতে যান', language: 'ভাষা', theme: 'থিম',
    emergency: 'জরুরি', allRights: 'সর্বস্বত্ব সংরক্ষিত।',
    provisional: 'অস্থায়ী',
    provisionalBody: 'এই তথ্য সরকারি নিশ্চিতকরণের অপেক্ষায় রয়েছে এবং পরিবর্তিত হতে পারে।',
    statusOpen: 'যান চলাচলের জন্য খোলা', statusConstruction: 'নির্মাণাধীন', statusPlanned: 'পরিকল্পিত',
    kindInterchange: 'ইন্টারচেঞ্জ', kindTollPlaza: 'টোল প্লাজা', kindServiceArea: 'সার্ভিস এরিয়া',
    kindULoop: 'ইউ-লুপ', kindPedestrianOverpass: 'পদচারী সেতু',
    colLocation: 'অবস্থান', colChainage: 'চেইনেজ', colType: 'ধরন', colConnects: 'সংযোগ',
    colStatus: 'অবস্থা', colVehicle: 'যানবাহনের শ্রেণি', colToll: 'টোল',
    openToTraffic: 'যান চলাচলের জন্য খোলা', noInterchanges: 'এখনও কোনও ইন্টারচেঞ্জ প্রকাশ করা হয়নি।',
    prohibitedVehicles: 'নিষিদ্ধ যানবাহন',
    prohibitedNote: 'এই যানবাহনগুলি এক্সপ্রেসওয়ে ব্যবহার করতে পারবে না।',
    sevInfo: 'বিজ্ঞপ্তি', sevWarning: 'সতর্কতা', sevClosure: 'বন্ধ',
  },
  zh: {
    navTravel: '出行信息', navProject: '项目', navImpact: '影响',
    navAbout: '关于我们', navNews: '新闻', navContact: '联系我们',
    skipToContent: '跳到主要内容', language: '语言', theme: '主题',
    emergency: '紧急救援', allRights: '版权所有。',
    provisional: '暂定',
    provisionalBody: '以下数据尚待官方确认，可能会有变动。',
    statusOpen: '已通车', statusConstruction: '在建', statusPlanned: '规划中',
    kindInterchange: '互通立交', kindTollPlaza: '收费站', kindServiceArea: '服务区',
    kindULoop: '掉头匝道', kindPedestrianOverpass: '人行天桥',
    colLocation: '位置', colChainage: '桩号', colType: '类型', colConnects: '衔接',
    colStatus: '状态', colVehicle: '车型', colToll: '通行费',
    openToTraffic: '已通车', noInterchanges: '尚未发布互通立交信息。',
    prohibitedVehicles: '禁止通行车辆',
    prohibitedNote: '上述车辆不得驶入本高速公路。',
    sevInfo: '通知', sevWarning: '提醒', sevClosure: '封闭',
  },
};

export function t(locale, key) {
  const table = UI[locale] || UI[DEFAULT_LOCALE];
  return table[key] || UI[DEFAULT_LOCALE][key] || key;
}
