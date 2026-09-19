import { describe, it, expect, vi, beforeEach } from 'vitest';

const status = vi.fn();
const advisories = vi.fn();
const scheduled = vi.fn();
const interchanges = vi.fn();
const monthly = vi.fn();
const historyRows = vi.fn();
const sections = vi.fn();

vi.mock('../../lib/corridor/traffic-cache.js', () => ({ getSectionStatusCached: () => status() }));
vi.mock('../../lib/corridor/cache.js', () => ({
  getActiveAdvisoriesCached: () => advisories(),
  getScheduledAdvisoriesCached: () => scheduled(),
  getInterchangesCached: () => interchanges(),
}));
vi.mock('../../lib/corridor/traffic.js', () => ({
  listMonthlyTrafficAll: () => monthly(),
  getMonthlyTrafficSource: async () => 'sample',
  listCorridorSections: () => sections(),
}));
vi.mock('../../lib/corridor/history.js', () => ({ listTrafficHistory: (o) => historyRows(o) }));
vi.mock('../../lib/seo/cache.js', () => ({ getSeoSettingsCached: async (locale) => ({ siteTitle: locale === 'bn' ? 'ঢাকা বাইপাস এক্সপ্রেসওয়ে' : 'Dhaka Bypass Expressway' }) }));
vi.mock('../../lib/log.js', () => ({
  log: vi.fn(), logError: vi.fn(),
  orLog: (_event, fallback) => () => fallback,
}));

const req = (path, ip = '203.0.113.9') => new Request(`https://dhakabypass.com${path}`, { headers: { 'x-forwarded-for': ip } });

beforeEach(() => {
  vi.clearAllMocks();
  // The calendar's UIDs and PRODID carry the site's host, from SITE_URL.
  process.env.SITE_URL = 'https://dhakabypass.com';
  status.mockResolvedValue({
    sections: [{ id: 1, from_code: 'S', to_code: '2', condition_key: 'free', avg_speed_kmh: 70, measured_at: new Date('2026-09-17T08:00:00Z') }],
    waypoints: [{ code: 'S', chainage_m: 0, names: { en: 'Naojor' } }, { code: '2', chainage_m: 2314, names: null }],
    source: 'google',
  });
  advisories.mockResolvedValue([]);
  scheduled.mockResolvedValue([{ id: 3, severity: 'warning', starts_at: '2026-09-20 22:00:00', ends_at: null, messages: { en: 'Roadworks K12', bn: 'রাস্তার কাজ K12' } }]);
  interchanges.mockResolvedValue([]);
  monthly.mockResolvedValue([{ month: '2026-08', plaza: 'all', vehicles: 100 }]);
  historyRows.mockResolvedValue([]);
  sections.mockResolvedValue([]);
});

describe('/api/public/corridor-status', () => {
  it('answers JSON with the source flag and a public cache header', async () => {
    const { GET } = await import('../../app/api/public/corridor-status/route.js');
    const res = await GET(req('/api/public/corridor-status'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('cache-control')).toContain('max-age=60');
    const body = await res.json();
    expect(body.traffic_source).toBe('google');
    expect(body.sections[0].code).toBe('S-2');
  });

  it('degrades to 503 when the status reader fails', async () => {
    status.mockRejectedValue(new Error('down'));
    const { GET } = await import('../../app/api/public/corridor-status/route.js');
    expect((await GET(req('/api/public/corridor-status', '203.0.113.10'))).status).toBe(503);
  });
});

describe('the CSV and calendar feeds', () => {
  it('serves the monthly counts as CSV with the sample flag', async () => {
    const { GET } = await import('../../app/api/public/traffic-monthly.csv/route.js');
    const res = await GET(req('/api/public/traffic-monthly.csv', '203.0.113.11'));
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(await res.text()).toBe('month,plaza,vehicles,source\r\n2026-08,all,100,sample\r\n');
  });

  it('narrows the history window from the query string', async () => {
    const { GET } = await import('../../app/api/public/traffic-history.csv/route.js');
    const res = await GET(req('/api/public/traffic-history.csv?days=30', '203.0.113.12'));
    expect(res.status).toBe(200);
    expect(historyRows).toHaveBeenCalledWith({ days: 30 });
    expect((await res.text()).startsWith('measured_at,section,')).toBe(true);
  });

  it('writes the calendar in the asked language, named after the site', async () => {
    const { GET } = await import('../../app/api/public/advisories.ics/route.js');
    const res = await GET(req('/api/public/advisories.ics?lang=bn', '203.0.113.13'));
    expect(res.headers.get('content-type')).toContain('text/calendar');
    const ics = await res.text();
    expect(ics).toContain('SUMMARY:রাস্তার কাজ K12');
    expect(ics).toContain('X-WR-CALNAME:ঢাকা বাইপাস এক্সপ্রেসওয়ে');
    expect(ics).toContain('UID:advisory-3@dhakabypass.com');
    const en = await (await GET(req('/api/public/advisories.ics?lang=xx', '203.0.113.14'))).text();
    expect(en).toContain('SUMMARY:Roadworks K12');
  });
});
