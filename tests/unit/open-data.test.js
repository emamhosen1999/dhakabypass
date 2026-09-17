import { describe, it, expect, vi } from 'vitest';
import {
  corridorStatusPayload, toCsv, monthlyCsv, historyCsv, advisoriesIcs, OPEN_DATA_ENDPOINTS,
} from '../../lib/open-data/format.js';
import { respondOpenData, OPEN_DATA_LIMIT } from '../../lib/open-data/respond.js';
import { UI } from '../../lib/i18n/ui.js';

const SECTIONS = [
  { id: 1, from_code: 'S', to_code: '2', condition_key: 'free', avg_speed_kmh: 72, measured_at: new Date('2026-09-17T08:00:00Z') },
  { id: 2, from_code: '2', to_code: '3', condition_key: 'nonsense', avg_speed_kmh: 0, measured_at: null },
];
const WAYPOINTS = [
  { code: 'S', chainage_m: 0, names: { en: 'Naojor (corridor start)', bn: 'নাওজোড় (করিডোরের শুরু)' } },
  { code: '2', chainage_m: 2314, names: null },
  { code: '3', chainage_m: 7554, names: '{"en":"Three"}' },
];

describe('corridorStatusPayload', () => {
  it('carries the source flag and every section with its names', () => {
    const p = corridorStatusPayload({ sections: SECTIONS, waypoints: WAYPOINTS, source: 'sample' });
    expect(p.traffic_source).toBe('sample');
    expect(p.sections[0]).toMatchObject({ code: 'S-2', condition: 'free', avg_speed_kmh: 72, measured_at: '2026-09-17T08:00:00.000Z' });
    expect(p.sections[0].from.names.bn).toBe('নাওজোড় (করিডোরের শুরু)');
    expect(p.sections[0].to.chainage_m).toBe(2314);
    // An unrecognised condition and a zero speed are "unknown" and null, as on the page.
    expect(p.sections[1]).toMatchObject({ condition: 'unknown', avg_speed_kmh: null, measured_at: null });
    expect(typeof p.generated_at).toBe('string');
  });

  it('lists facilities with chainage in both forms and advisories in three languages', () => {
    const p = corridorStatusPayload({
      interchanges: [{ id: 89, kind: 'toll_plaza', status: 'open', chainage_m: 3218, names: { en: 'Vogra' }, lat: '23.9', lng: null }],
      advisories: [{ id: 5, severity: 'closure', starts_at: '2026-09-20 22:00:00', ends_at: null, messages: { en: 'Lane closed', bn: 'লেন বন্ধ' } }],
    });
    expect(p.facilities[0]).toMatchObject({ id: 89, chainage: 'K3+218', lat: 23.9, lng: null });
    expect(p.advisories[0].messages).toEqual({ en: 'Lane closed', bn: 'লেন বন্ধ', zh: 'Lane closed' });
  });
});

describe('csv', () => {
  it('quotes what needs quoting and ends every line with CRLF', () => {
    const out = toCsv(['a', 'b'], [{ a: 'plain', b: 'has, comma' }, { a: 'say "hi"', b: null }]);
    expect(out).toBe('a,b\r\nplain,"has, comma"\r\n"say ""hi""",\r\n');
  });
  it('writes the monthly rows with their source flag', () => {
    expect(monthlyCsv([{ month: '2026-08', plaza: 'all', vehicles: 1200 }], 'sample'))
      .toBe('month,plaza,vehicles,source\r\n2026-08,all,1200,sample\r\n');
  });
  it('names the section in the history rows from the section list', () => {
    const out = historyCsv(
      [{ section_id: 1, measured_at: new Date('2026-09-17T08:00:00Z'), condition_key: 'free', avg_speed_kmh: 72, source: 'google' },
        { section_id: 9, measured_at: new Date('2026-09-17T08:00:00Z'), condition_key: 'slow', avg_speed_kmh: 30, source: 'google' }],
      SECTIONS,
    );
    const lines = out.trim().split('\r\n');
    expect(lines[0]).toBe('measured_at,section,from,to,condition,avg_speed_kmh,source');
    expect(lines[1]).toBe('2026-09-17T08:00:00.000Z,S-2,S,2,free,72,google');
    expect(lines[2]).toBe('2026-09-17T08:00:00.000Z,9,,,slow,30,google');
  });
});

describe('advisoriesIcs', () => {
  const now = new Date('2026-09-17T09:00:00Z');
  it('writes one event per dated advisory, in Dhaka time converted to UTC', () => {
    const ics = advisoriesIcs([
      { id: 5, severity: 'closure', starts_at: '2026-09-20 22:00:00', ends_at: '2026-09-21 05:00:00', messages: { en: 'Lane closed, K12; K14', bn: 'লেন বন্ধ' } },
      { id: 6, severity: 'info', starts_at: null, ends_at: null, messages: { en: 'Standing notice' } },
    ], { locale: 'bn', host: 'dhakabypass.com', name: 'ঢাকা বাইপাস', now });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('X-WR-CALNAME:ঢাকা বাইপাস');
    expect(ics).toContain('UID:advisory-5@dhakabypass.com');
    expect(ics).toContain('DTSTART:20260920T160000Z');
    expect(ics).toContain('DTEND:20260920T230000Z');
    expect(ics).toContain('SUMMARY:লেন বন্ধ');
    expect(ics).not.toContain('advisory-6');
    expect(ics.split('BEGIN:VEVENT')).toHaveLength(2);
  });
  it('escapes commas and semicolons in the summary', () => {
    const ics = advisoriesIcs([{ id: 1, severity: 'info', starts_at: new Date('2026-09-20T16:00:00Z'), messages: { en: 'A, B; C' } }], { now });
    expect(ics).toContain('SUMMARY:A\\, B\\; C');
  });
});

describe('the endpoint list', () => {
  it('names four feeds whose strings exist in every language', () => {
    expect(OPEN_DATA_ENDPOINTS.map((e) => e.id)).toEqual(['status', 'monthly', 'history', 'advisories']);
    for (const e of OPEN_DATA_ENDPOINTS) {
      for (const locale of ['en', 'bn', 'zh']) {
        expect(UI[locale][e.nameKey], `${locale} ${e.nameKey}`).toBeTruthy();
        expect(UI[locale][e.descKey], `${locale} ${e.descKey}`).toBeTruthy();
      }
    }
  });
});

describe('respondOpenData', () => {
  const request = (ip) => ({ headers: new Headers({ 'x-forwarded-for': ip }) });

  it('answers with a public cache header and CORS', async () => {
    const res = await respondOpenData(request('10.0.0.1'), async () => ({ body: '{}', contentType: 'application/json' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('public');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(await res.text()).toBe('{}');
  });

  it('turns a failing reader into a 503, never a stack trace', async () => {
    const res = await respondOpenData(request('10.0.0.2'), async () => { throw new Error('db down'); });
    expect(res.status).toBe(503);
    expect(await res.text()).toBe('');
  });

  it('limits one address to the published rate', async () => {
    const produce = vi.fn(async () => ({ body: 'x', contentType: 'text/plain' }));
    let last;
    for (let i = 0; i <= OPEN_DATA_LIMIT; i += 1) last = await respondOpenData(request('10.0.0.3'), produce);
    expect(last.status).toBe(429);
    expect(Number(last.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(produce).toHaveBeenCalledTimes(OPEN_DATA_LIMIT);
  });
});
