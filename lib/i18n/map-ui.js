/**
 * THE FALLBACK COPY of the corridor map's control panel, legend and layer
 * labels — 28 keys in three locales, across 41 call sites in
 * components/corridor/CorridorExplorer.jsx.
 *
 * Since W1.6 these are editable at /admin/translations under the `map.`
 * namespace. As with lib/i18n/ui.js the database can only replace a label,
 * never remove one: `mapUi()` starts from the code table and lays the
 * overrides on top, so a failed query, a missing `ui_strings` table or a row
 * an editor blanked all leave the map legible.
 *
 * The map is a client component, which is the other reason the overrides are
 * read from the synchronous module store in ./overrides.js rather than awaited.
 */
import { MAP_NS, stringKey, readUiOverride } from './overrides.js';
import { DEFAULT_LOCALE } from './locales.js';

const labels = {
  en: { title:'Dhaka Bypass', subtitle:'Corridor map', map:'Map', layers:'Layers', landmarks:'Landmarks', connections:'Crossing & connecting roads', traffic:'Traffic conditions', laneTitle:'Road layout', toll:'Toll carriageways', service:'Service roads', laneNote:'Widths shown diagrammatically', crossing:'Crossing road', connected:'Connecting road', highlight:'Up to 2 km along each approach', north:'N', data:'Map data', details:'Section details', mapNote:'Geographic map · OpenStreetMap' },
  bn: { title:'ঢাকা বাইপাস', subtitle:'করিডোর মানচিত্র', map:'মানচিত্র', layers:'স্তর', landmarks:'গুরুত্বপূর্ণ স্থান', connections:'অতিক্রমকারী ও সংযোগ সড়ক', traffic:'যানবাহনের অবস্থা', laneTitle:'সড়কের বিন্যাস', toll:'টোল সড়ক', service:'সার্ভিস সড়ক', laneNote:'প্রস্থ প্রতীকীভাবে দেখানো হয়েছে', crossing:'অতিক্রমকারী সড়ক', connected:'সংযোগ সড়ক', highlight:'প্রতিটি দিকে সড়ক বরাবর সর্বোচ্চ ২ কিমি', north:'উ', data:'মানচিত্রের তথ্য', details:'সড়কাংশের বিবরণ', mapNote:'ভৌগোলিক মানচিত্র · OpenStreetMap' },
  zh: { title:'达卡绕城公路', subtitle:'走廊地图', map:'地图', layers:'图层', landmarks:'地标', connections:'交叉及连接道路', traffic:'交通状况', laneTitle:'道路布局', toll:'收费车行道', service:'辅路', laneNote:'宽度为示意', crossing:'交叉道路', connected:'连接道路', highlight:'沿每侧道路最多突出显示2公里', north:'北', data:'地图数据', details:'路段详情', mapNote:'地理地图 · OpenStreetMap' },
};
const roadLabels = {
  en: {national:'National highway',regional:'Regional highway',district:'District road',local:'Local road',roadInfo:'Road information',closeRoad:'Close road information',roadSource:'Road reference',roadAccess:'Use signed entries and exits for toll access.',noRoadCode:'No mapped highway code',roadBoth:'Crossing and mapped connections'},
  bn: {national:'জাতীয় মহাসড়ক',regional:'আঞ্চলিক মহাসড়ক',district:'জেলা সড়ক',local:'স্থানীয় সড়ক',roadInfo:'সড়কের তথ্য',closeRoad:'সড়কের তথ্য বন্ধ করুন',roadSource:'সড়কের তথ্যসূত্র',roadAccess:'টোল সড়কে প্রবেশ ও বের হতে নির্ধারিত পথ ব্যবহার করুন।',noRoadCode:'মহাসড়ক কোড দেওয়া নেই',roadBoth:'অতিক্রম ও মানচিত্রে চিহ্নিত সংযোগ'},
  zh: {national:'国道',regional:'区域公路',district:'地区道路',local:'地方道路',roadInfo:'道路信息',closeRoad:'关闭道路信息',roadSource:'道路资料',roadAccess:'请通过有标志的出入口进出收费道路。',noRoadCode:'未标注公路编号',roadBoth:'交叉和地图所示连接'},
};
/** The complete code table per locale: the map's labels plus the road labels. */
export const MAP_UI = {
  en: { ...labels.en, ...roadLabels.en },
  bn: { ...labels.bn, ...roadLabels.bn },
  zh: { ...labels.zh, ...roadLabels.zh },
};

/**
 * Every map label for `locale`, database values laid over the code values.
 *
 * Returns a complete table whatever happens: an unknown locale falls back to
 * English, and an override that is blank or names a key the map does not use is
 * ignored by ./overrides.js before it gets here.
 */
export function mapUi(locale) {
  const base = MAP_UI[locale] || MAP_UI[DEFAULT_LOCALE];
  const out = { ...base };
  for (const key of Object.keys(out)) {
    const override = readUiOverride(locale, stringKey(MAP_NS, key));
    if (override) out[key] = override;
  }
  return out;
}
