import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const refreshTraffic = vi.fn();
vi.mock('../../lib/corridor/traffic-refresh.js', () => ({ refreshTraffic: () => refreshTraffic() }));
const revalidateCorridor = vi.fn();
vi.mock('../../lib/revalidate.js', () => ({ revalidateCorridor: () => revalidateCorridor() }));
vi.mock('../../lib/log.js', () => ({ log: vi.fn(), logError: vi.fn() }));

const SECRET = 'x'.repeat(40);
const req = (auth) => new Request('https://dhakabypass.com/api/cron/traffic', { headers: auth ? { authorization: auth } : {} });
const env = process.env.CRON_SECRET;

beforeEach(() => { vi.clearAllMocks(); process.env.CRON_SECRET = SECRET; });
afterEach(() => { process.env.CRON_SECRET = env; });

describe('/api/cron/traffic', () => {
  it('refreshes and revalidates with the right secret', async () => {
    refreshTraffic.mockResolvedValue(6);
    const { GET } = await import('../../app/api/cron/traffic/route.js');
    const res = await GET(req(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, sections: 6 });
    expect(revalidateCorridor).toHaveBeenCalled();
  });

  it('answers 404 without, or with a wrong, secret — and when none is configured', async () => {
    const { GET } = await import('../../app/api/cron/traffic/route.js');
    expect((await GET(req())).status).toBe(404);
    expect((await GET(req('Bearer nope'))).status).toBe(404);
    process.env.CRON_SECRET = '';
    expect((await GET(req('Bearer '))).status).toBe(404);
    expect(refreshTraffic).not.toHaveBeenCalled();
  });

  it('reports a TomTom failure as 502 and keeps the old measurements', async () => {
    refreshTraffic.mockRejectedValue(Object.assign(new Error('TomTom returned HTTP 403. Existing measurements were kept.'), { code: 'VALIDATION' }));
    const { GET } = await import('../../app/api/cron/traffic/route.js');
    const res = await GET(req(`Bearer ${SECRET}`));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/403/);
    expect(revalidateCorridor).not.toHaveBeenCalled();
  });
});
