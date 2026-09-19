/**
 * The snapshot store.
 *
 * The rule worth a test: a failed refresh must never empty a panel. A screen
 * that shows zero because a quota was exceeded tells the operator nobody
 * visited the site, which is the one thing it must not say.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn(), dbEnabled: vi.fn(() => true) }));

import { query } from '../../lib/db.js';
import { readSnapshots, writeSnapshot, noteFailure, PANELS } from '../../lib/insights/repo.js';

beforeEach(() => vi.clearAllMocks());

describe('PANELS', () => {
  it('says which service each panel comes from', () => {
    expect(PANELS['daily-totals']).toBe('ga4');
    expect(PANELS.queries).toBe('search-console');
    expect(Object.keys(PANELS)).toHaveLength(6);
  });
});

describe('readSnapshots', () => {
  it('returns every panel, including ones never collected', async () => {
    query.mockResolvedValue([
      { panel: 'events', source: 'ga4', payload: '[{"eventName":"toll_quote","eventCount":31}]', taken_at: '2026-09-19 03:10:00', failed_at: null, note: '' },
    ]);
    const rows = await readSnapshots();
    expect(rows).toHaveLength(6);
    const events = rows.find((r) => r.panel === 'events');
    expect(events.payload[0].eventCount).toBe(31);
    const queries = rows.find((r) => r.panel === 'queries');
    expect(queries.payload).toBeNull();
    expect(queries.takenAt).toBeNull();
  });

  it('carries the failure note and when it happened', async () => {
    query.mockResolvedValue([
      { panel: 'queries', source: 'search-console', payload: '[]', taken_at: '2026-09-18 03:10:00', failed_at: '2026-09-19 03:10:00', note: 'search console 429' },
    ]);
    const row = (await readSnapshots()).find((r) => r.panel === 'queries');
    expect(row.note).toBe('search console 429');
    expect(row.failedAt).toBeInstanceOf(Date);
    expect(row.takenAt).toBeInstanceOf(Date);
  });
});

describe('writeSnapshot', () => {
  it('replaces the payload and clears any previous failure', async () => {
    query.mockResolvedValue({});
    await writeSnapshot('events', [{ eventName: 'toll_quote', eventCount: 4 }]);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('ON DUPLICATE KEY UPDATE');
    expect(sql).toContain('failed_at = NULL');
    expect(params[0]).toBe('events');
    expect(params[1]).toBe('ga4');
    expect(JSON.parse(params[2])[0].eventCount).toBe(4);
  });

  it('refuses a panel the screens do not know', async () => {
    await expect(writeSnapshot('whatever', [])).rejects.toThrow(/unknown panel/);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('noteFailure', () => {
  it('records why without touching the last good payload', async () => {
    query.mockResolvedValue({});
    await noteFailure('daily-totals', 'ga4 429: quota exhausted');
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('ON DUPLICATE KEY UPDATE failed_at');
    expect(sql).not.toContain('payload = VALUES(payload)');
    expect(params[2]).toContain('429');
  });

  it('clamps a long message rather than failing the write', async () => {
    query.mockResolvedValue({});
    await noteFailure('events', 'x'.repeat(500));
    expect(query.mock.calls[0][1][2].length).toBeLessThanOrEqual(255);
  });
});
