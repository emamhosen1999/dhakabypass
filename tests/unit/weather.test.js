import { describe, it, expect, vi } from 'vitest';
import { assess, combine, normaliseThresholds, weatherWordKey, WEATHER_DEFAULTS } from '../../lib/weather/advisory.js';
import { weatherUrl, visibilityAt, shapeReading, fetchCorridorWeather } from '../../lib/weather/open-meteo.js';
import { samplePoints } from '../../lib/weather/cache.js';

describe('thresholds', () => {
  it('falls back to the defaults for anything unusable', () => {
    expect(normaliseThresholds({})).toEqual(WEATHER_DEFAULTS);
    expect(normaliseThresholds({ fog: '500', rain: -1, wind: 'x' })).toEqual({ fog: 500, rain: 7.5, wind: 50 });
  });
});

describe('assess', () => {
  it('raises fog below the visibility threshold and not above it', () => {
    expect(assess({ visibilityM: 800 }, { fog: 1000 }).flags).toEqual(['fog']);
    expect(assess({ visibilityM: 1000 }, { fog: 1000 }).flags).toEqual([]);
  });
  it('does not read a missing visibility as fog, but does trust a fog code', () => {
    expect(assess({ visibilityM: null, code: 1 }, {}).flags).toEqual([]);
    expect(assess({ visibilityM: null, code: 45 }, {}).flags).toEqual(['fog']);
  });
  it('grades rain by the hour and wind by the gust', () => {
    expect(assess({ rainMm: 7.5 }, {}).flags).toEqual(['rain']);
    expect(assess({ rainMm: 7.4 }, {}).flags).toEqual([]);
    expect(assess({ windKmh: 30, gustKmh: 55 }, {}).flags).toEqual(['wind']);
    expect(assess({ visibilityM: 200, rainMm: 20, gustKmh: 80 }, {}).level).toBe('advisory');
  });
  it('combines several points into the corridor advisory, in a fixed order', () => {
    const c = combine([assess({ gustKmh: 80 }, {}), assess({ visibilityM: 100 }, {}), assess({}, {})]);
    expect(c).toEqual({ level: 'advisory', flags: ['fog', 'wind'] });
    expect(combine([]).level).toBe('clear');
  });
});

describe('weatherWordKey', () => {
  it('reduces WMO codes to the words a driver needs', () => {
    expect(weatherWordKey(0)).toBe('wxClear');
    expect(weatherWordKey(2)).toBe('wxCloudy');
    expect(weatherWordKey(48)).toBe('wxFog');
    expect(weatherWordKey(53)).toBe('wxDrizzle');
    expect(weatherWordKey(63)).toBe('wxRain');
    expect(weatherWordKey(81)).toBe('wxRain');
    expect(weatherWordKey(95)).toBe('wxThunder');
    expect(weatherWordKey(null)).toBe('wxUnknown');
    expect(weatherWordKey(40)).toBe('wxUnknown');
  });
});

describe('open-meteo', () => {
  const points = [{ lat: 23.98, lng: 90.36 }, { lat: 23.69, lng: 90.55 }];

  it('asks for every point in one request, in Dhaka time', () => {
    const u = new URL(weatherUrl(points));
    expect(u.searchParams.get('latitude')).toBe('23.9800,23.6900');
    expect(u.searchParams.get('longitude')).toBe('90.3600,90.5500');
    expect(u.searchParams.get('timezone')).toBe('Asia/Dhaka');
    expect(u.searchParams.get('hourly')).toBe('visibility');
  });

  it('picks the visibility for the current hour', () => {
    const hourly = { time: ['2026-09-17T13:00', '2026-09-17T14:00'], visibility: [24140, 800] };
    expect(visibilityAt(hourly, '2026-09-17T14:15')).toBe(800);
    expect(visibilityAt(hourly, '2026-09-17T16:15')).toBeNull();
    expect(visibilityAt(null, '2026-09-17T14:15')).toBeNull();
  });

  it('shapes one result into a reading, with nulls for what is missing', () => {
    const r = shapeReading({ current: { time: '2026-09-17T14:15', temperature_2m: 31.2, precipitation: 0, weather_code: 3, wind_speed_10m: 12.5 } });
    expect(r).toEqual({ time: '2026-09-17T14:15', temperatureC: 31.2, rainMm: 0, code: 3, windKmh: 12.5, gustKmh: null, visibilityM: null });
  });

  it('returns null on any failure rather than throwing', async () => {
    const failing = vi.fn(async () => ({ ok: false }));
    expect(await fetchCorridorWeather(points, { fetchImpl: failing })).toBeNull();
    const throwing = vi.fn(async () => { throw new Error('network'); });
    expect(await fetchCorridorWeather(points, { fetchImpl: throwing })).toBeNull();
    const short = vi.fn(async () => ({ ok: true, json: async () => [{}] }));
    expect(await fetchCorridorWeather(points, { fetchImpl: short })).toBeNull();
    expect(await fetchCorridorWeather([], { fetchImpl: short })).toBeNull();
  });

  it('returns one reading per point on success, with the attribution', async () => {
    const ok = vi.fn(async () => ({
      ok: true,
      json: async () => [
        { current: { time: '2026-09-17T14:15', precipitation: 1 }, hourly: { time: ['2026-09-17T14:00'], visibility: [500] } },
        { current: { time: '2026-09-17T14:15', precipitation: 0 } },
      ],
    }));
    const w = await fetchCorridorWeather(points, { fetchImpl: ok });
    expect(w.attribution).toBe('Open-Meteo');
    expect(w.points).toHaveLength(2);
    expect(w.points[0].reading.visibilityM).toBe(500);
    expect(w.points[1].reading.visibilityM).toBeNull();
  });
});

describe('samplePoints', () => {
  const waypoints = [
    { code: 'S', lat: 23.98, lng: 90.36, chainage_m: 0, names: '{"en":"Naojor"}' },
    { code: '4', lat: 23.93, lng: 90.45, chainage_m: 12090, names: null },
    { code: 'E', lat: 23.69, lng: 90.54, chainage_m: 47611, names: { en: 'Madanpur', bn: 'মদনপুর' } },
  ];
  const interchanges = [
    { kind: 'toll_plaza', chainage_m: 24522, lat: 23.85, lng: 90.52, names: { en: 'Purbachal Toll Plaza' } },
    { kind: 'bridge', chainage_m: 23800, lat: 23.86, lng: 90.52, names: { en: 'A bridge' } },
    { kind: 'toll_plaza', chainage_m: 3218, lat: 23.97, lng: 90.38, names: { en: 'Vogra' } },
  ];

  it('takes the two ends and the plaza nearest the middle, with their names', () => {
    const p = samplePoints(waypoints, interchanges);
    expect(p.map((x) => x.names.en)).toEqual(['Naojor', 'Purbachal Toll Plaza', 'Madanpur']);
    expect(p[2].names.bn).toBe('মদনপুর');
  });

  it('copes with one waypoint and with none', () => {
    expect(samplePoints([waypoints[0]], interchanges)).toHaveLength(1);
    expect(samplePoints([], interchanges)).toEqual([]);
  });
});
