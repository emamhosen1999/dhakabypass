import { describe, it, expect, vi } from 'vitest';
import { routeCondition, parseRoute, fetchSectionRoutes, sectionEndpoints } from '../../lib/corridor/google-routes.js';
import { trafficProvider } from '../../lib/corridor/traffic-refresh.js';

vi.mock('../../lib/db.js', () => ({ withTransaction: vi.fn(), query: vi.fn(), dbEnabled: () => false }));

describe('Google Routes traffic provider', () => {
  it('turns live against free-flow drive time into a condition', () => {
    expect(routeCondition(100, 100)).toBe('free');
    expect(routeCondition(130, 100)).toBe('moderate');
    expect(routeCondition(170, 100)).toBe('slow');
    expect(routeCondition(300, 100)).toBe('heavy');
    expect(routeCondition(0, 100)).toBe('unknown');
  });

  it('reads speed from distance over live duration, and refuses a broken answer', () => {
    expect(parseRoute({ routes: [{ duration: '600s', staticDuration: '500s', distanceMeters: 10000 }] })).toEqual({ condition: 'moderate', speed: 60 });
    expect(() => parseRoute({ routes: [] })).toThrow(/usable drive time/);
  });

  it('asks once per section with the key in a header and traffic-aware routing', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ routes: [{ duration: '100s', staticDuration: '100s', distanceMeters: 2000 }] }) }));
    const ends = sectionEndpoints([{ id: 7, from_code: 'S', to_code: 'E' }], [{ code: 'S', lat: 23.9, lng: 90.3 }, { code: 'E', lat: 23.7, lng: 90.5 }]);
    const out = await fetchSectionRoutes(ends, { key: 'k', fetchImpl });
    expect(out).toEqual([{ id: 7, condition: 'free', speed: 72 }]);
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers['X-Goog-Api-Key']).toBe('k');
    expect(JSON.parse(init.body).routingPreference).toBe('TRAFFIC_AWARE');
  });

  it('prefers Google when its key is set, then TomTom, else nothing', () => {
    expect(trafficProvider({ GOOGLE_ROUTES_API_KEY: 'g', TOMTOM_API_KEY: 't' }).name).toBe('google');
    expect(trafficProvider({ TOMTOM_API_KEY: 't' }).name).toBe('tomtom');
    expect(trafficProvider({})).toBeNull();
  });
});

describe('the toll carriageway, not the service road', () => {
  const waypoints = [{ code: 'S', lat: 23.90, lng: 90.30 }, { code: 'E', lat: 23.80, lng: 90.40 }];
  // A straight surveyed centreline between the two ends, five points.
  const geometry = [0, 0.25, 0.5, 0.75, 1].map((f, seq) => ({ seq, lat: 23.90 - 0.10 * f, lng: 90.30 + 0.10 * f }));

  it('sends via points from the surveyed alignment and the surveyed length', () => {
    const [e] = sectionEndpoints([{ id: 1, from_code: 'S', to_code: 'E' }], waypoints, geometry);
    expect(e.via).toHaveLength(3);
    expect(e.expectedMeters).toBeGreaterThan(10000);
    // the middle via point sits mid-way along the line
    expect(e.via[1].lat).toBeCloseTo(23.85, 2);
    expect(e.via[1].lng).toBeCloseTo(90.35, 2);
  });

  it('asks Google to pass through them and never to avoid tolls', async () => {
    let body;
    const fetchImpl = async (_url, init) => { body = JSON.parse(init.body); return { ok: true, json: async () => ({ routes: [{ duration: '600s', staticDuration: '580s', distanceMeters: 15000 }] }) }; };
    const ends = sectionEndpoints([{ id: 1, from_code: 'S', to_code: 'E' }], waypoints, geometry);
    await fetchSectionRoutes(ends, { key: 'k', fetchImpl });
    expect(body.intermediates).toHaveLength(3);
    expect(body.intermediates.every((i) => i.via === true)).toBe(true);
    expect(body.routeModifiers.avoidTolls).toBe(false);
  });

  it('publishes "not measured" when the answered distance is not this section', () => {
    // 15 km surveyed; Google drove 19 km — a service-road detour, not the expressway.
    expect(parseRoute({ routes: [{ duration: '900s', staticDuration: '600s', distanceMeters: 19000 }] }, { expectedMeters: 15000 }))
      .toMatchObject({ condition: 'unknown', speed: null, offCorridor: true });
    // Within tolerance it is a reading.
    expect(parseRoute({ routes: [{ duration: '900s', staticDuration: '600s', distanceMeters: 15400 }] }, { expectedMeters: 15000 }).condition).toBe('slow');
  });

  it('still measures A to B when no alignment has been imported', () => {
    const [e] = sectionEndpoints([{ id: 1, from_code: 'S', to_code: 'E' }], waypoints, []);
    expect(e.via).toEqual([]);
    expect(e.expectedMeters).toBeNull();
  });
});
