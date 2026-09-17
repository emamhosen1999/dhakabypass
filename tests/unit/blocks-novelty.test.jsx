// The five blocks of 17 September, rendered without a byte of JavaScript:
// what a reader with script off, a crawler and the admin preview all see.
// Every reader behind them is mocked so each state can be forced.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { UI } from '../../lib/i18n/ui.js';
import { getBlock, validateBlockData, defaultBlockData } from '../../lib/blocks/registry.js';
import '../../lib/blocks/index.js';

const geometry = vi.fn();
const interchanges = vi.fn();
const summary = vi.fn();
const status = vi.fn();
const history = vi.fn();
const contact = vi.fn();
const weather = vi.fn();

vi.mock('../../lib/corridor/cache', () => ({
  getInterchangesCached: () => interchanges(),
  getCorridorSummaryCached: () => summary(),
}));
vi.mock('../../lib/corridor/traffic-cache', () => ({
  getCorridorGeometryCached: () => geometry(),
  getSectionStatusCached: () => status(),
  getTrafficHistoryCached: () => history(),
}));
vi.mock('../../lib/settings-cache.js', () => ({ getContactDetailsCached: () => contact() }));
vi.mock('../../lib/weather/cache.js', () => ({ getCorridorWeatherCached: () => weather() }));

const { default: KmFinderBlock } = await import('../../components/blocks/KmFinderBlock.jsx');
const { default: TravelTimeHistoryBlock } = await import('../../components/blocks/TravelTimeHistoryBlock.jsx');
const { default: CorridorWeatherBlock } = await import('../../components/blocks/CorridorWeatherBlock.jsx');
const { default: OpenDataBlock } = await import('../../components/blocks/OpenDataBlock.jsx');
const { default: ConcessionScorecardBlock } = await import('../../components/blocks/ConcessionScorecardBlock.jsx');

const LINE = Array.from({ length: 11 }, (_, i) => ({ seq: i, lat: 24 - i * 0.009, lng: 90.4, chainage_m: i * 1000 }));
const FEATURES = [
  { id: 2, chainage_m: 3200, kind: 'toll_plaza', status: 'open', names: { en: 'Plaza A', bn: 'প্লাজা এ' } },
  { id: 3, chainage_m: 4500, kind: 'bridge', status: 'open', names: { en: 'River bridge' } },
  { id: 5, chainage_m: 8500, kind: 'toll_plaza', status: 'construction', names: { en: 'Plaza B' } },
];
const WAYPOINTS = [
  { code: 'S', chainage_m: 0, names: { en: 'Naojor (corridor start)', bn: 'নাওজোড় (করিডোরের শুরু)' } },
  { code: 'E', chainage_m: 10000, names: { en: 'Madanpur (corridor end)' } },
];
const SECTIONS = [{ id: 1, from_code: 'S', to_code: 'E', sort_order: 0, condition_key: 'unknown', avg_speed_kmh: null, measured_at: null }];

beforeEach(() => {
  vi.resetAllMocks();
  geometry.mockResolvedValue(LINE);
  interchanges.mockResolvedValue(FEATURES);
  summary.mockResolvedValue({ segments: [{ from_m: 0, to_m: 6000, status: 'open' }] });
  status.mockResolvedValue({ sections: SECTIONS, waypoints: WAYPOINTS, source: 'operator' });
  history.mockResolvedValue([]);
  contact.mockResolvedValue({ emergency: '', nationalEmergency: '999' });
  weather.mockResolvedValue({ weather: null, thresholds: {} });
});

describe('registry contract', () => {
  it.each(['km-finder', 'travel-time-history', 'corridor-weather', 'open-data', 'concession-scorecard'])('%s is registered with a default record that validates', (type) => {
    const def = getBlock(type);
    expect(def).toBeTruthy();
    expect(validateBlockData(type, defaultBlockData(type)).ok).toBe(true);
    for (const f of def.fields) {
      if (f.type === 'list') expect(f.itemFields || f.itemType, `${type}.${f.name}`).toBeTruthy();
    }
  });
});

describe('km-finder', () => {
  const render = async (props) => renderToStaticMarkup(await KmFinderBlock({ data: {}, locale: 'en', blockId: 7, ...props }));

  it('is a GET form with a labelled field and the pending emergency notice while the number is blank', async () => {
    const html = await render({});
    expect(html).toContain('method="get"');
    expect(html).toContain(`name="km"`);
    expect(html).toContain(UI.en.locateLabel);
    expect(html).toContain(UI.en.locateHint);
    // 999 is set, so the strip renders and the pending notice does not.
    expect(html).toContain('tel:999');
    expect(html).not.toContain(UI.en.locateNoNumbers);
  });

  it('says the numbers are not yet published when both are blank', async () => {
    contact.mockResolvedValue({ emergency: '', nationalEmergency: '' });
    const html = await render({});
    expect(html).toContain(UI.en.locateNoNumbers);
    expect(html).toContain(UI.en.pendingTag);
  });

  it('answers a typed marker with chainage, stretch, plaza and exits', async () => {
    const html = await render({ searchParams: Promise.resolve({ km: 'K4+500' }) });
    expect(html).toContain('K4+500');
    expect(html).toContain(UI.en.statusOpen);
    expect(html).toContain('Plaza A');
    expect(html).toContain('Plaza B');
    expect(html).toContain('River bridge');
    expect(html).toContain(UI.en.locateTowards.replace('{place}', 'Madanpur'));
    expect(html).not.toContain(UI.en.locateTowards.replace('{place}', 'Madanpur (corridor end)'));
    expect(html).toContain(UI.en.statusConstruction);
  });

  it('refuses an unreadable marker with aria-invalid on the field', async () => {
    const html = await render({ searchParams: Promise.resolve({ km: 'zzz' }) });
    expect(html).toContain(UI.en.locateInvalid);
    expect(html).toContain('aria-invalid="true"');
  });

  it('names the place in the reader\'s language and keeps the chainage Latin', async () => {
    const html = await render({ locale: 'bn', searchParams: Promise.resolve({ km: '3' }) });
    expect(html).toContain('প্লাজা এ');
    expect(html).toContain('lang="en">K3+000');
    expect(html).toContain(UI.bn.locateYouAre);
  });

  it('survives every reader failing', async () => {
    geometry.mockRejectedValue(new Error('db'));
    interchanges.mockRejectedValue(new Error('db'));
    summary.mockRejectedValue(new Error('db'));
    status.mockRejectedValue(new Error('db'));
    contact.mockRejectedValue(new Error('db'));
    const html = await render({ searchParams: Promise.resolve({ lat: '24', lng: '90.4' }) });
    expect(html).toContain(UI.en.mapNoGeometry);
  });
});

describe('travel-time-history', () => {
  const render = async (props) => renderToStaticMarkup(await TravelTimeHistoryBlock({ data: {}, locale: 'en', ...props }));

  it('says there is not enough data while there is none', async () => {
    const html = await render({});
    expect(html).toContain(UI.en.historyNotEnough);
    expect(html).not.toContain('<table');
  });

  it('prefers the operator\'s own wording for that state', async () => {
    const html = await render({ data: { emptyMessage: 'Coming in October.' } });
    expect(html).toContain('Coming in October.');
  });

  it('renders 24 cells per day type once a cell has enough measurements', async () => {
    const at = (d) => new Date(Date.UTC(2026, 8, d, 3, 0)); // 09:00 Dhaka, Mon-Wed
    history.mockResolvedValue([14, 15, 16].map((d) => ({ section_id: 1, measured_at: at(d), condition_key: 'free', avg_speed_kmh: 70 })));
    const html = await render({ data: { minSamples: 3 } });
    expect(html).toContain('<table');
    expect(html).toContain(UI.en.historyWeekdays);
    expect(html).toContain(UI.en.historyWeekend);
    expect(html).toContain('>70<');
    expect(html).toContain(UI.en.traffic_free);
    expect((html.match(/db-history-cell/g) || []).length).toBe(48);
    expect(html).toContain('Naojor (corridor start) — Madanpur (corridor end)');
  });
});

describe('corridor-weather', () => {
  const render = async (props) => renderToStaticMarkup(await CorridorWeatherBlock({ data: {}, locale: 'en', ...props }));
  const reading = (over = {}) => ({ time: '2026-09-17T14:15', temperatureC: 31, rainMm: 0, code: 1, windKmh: 10, gustKmh: 15, visibilityM: 20000, ...over });
  const points = (a, b) => ({
    fetchedAt: '2026-09-17T08:20:00Z', attribution: 'Open-Meteo',
    points: [
      { lat: 23.98, lng: 90.36, names: { en: 'Naojor', bn: 'নাওজোড়' }, reading: reading(a) },
      { lat: 23.69, lng: 90.54, names: { en: 'Madanpur' }, reading: reading(b) },
    ],
  });

  it('says the service is unavailable rather than showing nothing', async () => {
    const html = await render({});
    expect(html).toContain(UI.en.wxUnavailable);
    expect(html).not.toContain('<table');
  });

  it('shows no advisory and the readings when nothing crosses a threshold', async () => {
    weather.mockResolvedValue({ weather: points(), thresholds: { fog: 1000, rain: 7.5, wind: 50 } });
    const html = await render({});
    expect(html).toContain(UI.en.wxNoAdvisory);
    expect(html).toContain('Naojor');
    expect(html).toContain('Open-Meteo');
    expect(html).toContain(UI.en.wxModelNote);
    expect(html).toContain(UI.en.wxCloudy);
  });

  it('raises a fog advisory naming the place and the figure, with the advice', async () => {
    weather.mockResolvedValue({ weather: points({ visibilityM: 400, code: 45 }), thresholds: { fog: 1000, rain: 7.5, wind: 50 } });
    const html = await render({ locale: 'bn' });
    expect(html).toContain(UI.bn.wxFogAt.replace('{place}', 'নাওজোড়').replace('{n}', '৪০০'));
    expect(html).toContain(UI.bn.wxAdviceFog);
    expect(html).toContain('role="status"');
  });

  it('lets the operator reword the advice', async () => {
    weather.mockResolvedValue({ weather: points({}, { gustKmh: 80 }), thresholds: { fog: 1000, rain: 7.5, wind: 50 } });
    const html = await render({ data: { adviceWind: 'Trucks: use the left lane.' } });
    expect(html).toContain('Trucks: use the left lane.');
    expect(html).toContain(UI.en.wxWindAt.replace('{place}', 'Madanpur').replace('{n}', '80'));
  });
});

describe('open-data', () => {
  const render = (props) => renderToStaticMarkup(<OpenDataBlock data={{}} locale="en" {...props} />);

  it('lists every feed with its full address and the pending terms', () => {
    const html = render({});
    expect(html).toContain('/api/public/corridor-status');
    expect(html).toContain('/api/public/traffic-monthly.csv');
    expect(html).toContain('/api/public/traffic-history.csv');
    expect(html).toContain('/api/public/advisories.ics?lang=en');
    expect(html).toContain(UI.en.odStatusDesc);
    expect(html).toContain(UI.en.odTermsPending);
  });

  it('renders authored terms in place of the pending notice, with links localised', () => {
    const html = render({ locale: 'zh', data: { terms: '<p>见 <a href="terms">条款</a></p>' } });
    expect(html).not.toContain(UI.zh.odTermsPending);
    expect(html).toContain('href="/zh/terms"');
    expect(html).toContain('lang=zh');
  });
});

describe('concession-scorecard', () => {
  const render = (props) => renderToStaticMarkup(<ConcessionScorecardBlock data={{}} locale="en" {...props} />);

  it('is the pending notice while empty', () => {
    const html = render({});
    expect(html).toContain(UI.en.scorecardEmpty);
    expect(html).toContain(UI.en.pendingTag);
    expect(html).not.toContain('progressbar');
  });

  it('draws the term from two dates and marks a missing figure as not yet published', () => {
    const html = render({ data: {
      termStart: '2018-12-06', termEnd: '2043-12-05', termSource: 'Concession agreement, clause 3',
      rows: [
        { indicator: 'Lane availability', target: '99', actual: '', unit: '%', asOf: '', source: '' },
        { indicator: 'Incident response', target: '30', actual: '24', unit: 'min', asOf: 'Aug 2026', source: 'Monthly report', sourceHref: 'disclosures/reports' },
      ],
    } });
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('Concession agreement, clause 3');
    expect(html).toContain('Lane availability');
    expect(html).toContain('99 %');
    expect(html).toContain('24 min');
    expect(html).toContain('href="/en/disclosures/reports"');
    expect((html.match(new RegExp(UI.en.pendingTag, 'g')) || []).length).toBe(1);
  });

  it('ignores a term whose dates do not parse', () => {
    const html = render({ data: { termStart: '6/12/2018', termEnd: '2043', rows: [{ indicator: 'A', target: '1', actual: '1' }] } });
    expect(html).not.toContain('progressbar');
    expect(html).toContain('<table');
  });
});
