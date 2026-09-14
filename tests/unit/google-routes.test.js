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
