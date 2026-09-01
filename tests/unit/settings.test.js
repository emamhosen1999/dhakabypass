// tests/unit/settings.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({
  query: vi.fn(),
  dbEnabled: vi.fn(),
}));

import { query } from '../../lib/db.js';
import { getSetting, isDataIllustrative } from '../../lib/settings.js';

describe('settings (query failure)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSetting returns the fallback when the underlying query rejects', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));

    expect(await getSetting('corridor.illustrative', 'fallback')).toBe('fallback');
    expect(await getSetting('corridor.illustrative')).toBe(null);
  });

  it('isDataIllustrative returns true when the underlying query rejects', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));

    expect(await isDataIllustrative()).toBe(true);
  });
});
