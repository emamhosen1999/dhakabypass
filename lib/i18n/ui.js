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
  },
  bn: {
    navTravel: 'ভ্রমণ তথ্য', navProject: 'প্রকল্প', navImpact: 'প্রভাব',
    navAbout: 'পরিচিতি', navNews: 'সংবাদ', navContact: 'যোগাযোগ',
    skipToContent: 'মূল বিষয়বস্তুতে যান', language: 'ভাষা', theme: 'থিম',
    emergency: 'জরুরি', allRights: 'সর্বস্বত্ব সংরক্ষিত।',
  },
  zh: {
    navTravel: '出行信息', navProject: '项目', navImpact: '影响',
    navAbout: '关于我们', navNews: '新闻', navContact: '联系我们',
    skipToContent: '跳到主要内容', language: '语言', theme: '主题',
    emergency: '紧急救援', allRights: '版权所有。',
  },
};

export function t(locale, key) {
  const table = UI[locale] || UI[DEFAULT_LOCALE];
  return table[key] || UI[DEFAULT_LOCALE][key] || key;
}
