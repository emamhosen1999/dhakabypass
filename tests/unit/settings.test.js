// tests/unit/settings.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({
  query: vi.fn(),
  dbEnabled: vi.fn(),
}));

import { query } from '../../lib/db.js';
import { getSetting, isDataIllustrative, getProhibitedVehicles } from '../../lib/settings.js';

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

describe('getProhibitedVehicles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the English list when the requested locale is missing', async () => {
    query.mockResolvedValue([{ value: { en: ['Motorcycles', 'Three-wheelers (CNG and auto-rickshaw)'] } }]);

    expect(await getProhibitedVehicles('fr')).toEqual([
      'Motorcycles',
      'Three-wheelers (CNG and auto-rickshaw)',
    ]);
  });

  it('returns [] when the setting is absent', async () => {
    query.mockResolvedValue([]);

    expect(await getProhibitedVehicles('en')).toEqual([]);
  });

  it('tolerates a raw JSON string value', async () => {
    // A future caller may hand this a value that is still a raw JSON
    // string rather than the object getSetting normally hands back —
    // Object.hasOwn on a boxed string must not silently resolve to [].
    const map = { en: ['Motorcycles'], bn: ['মোটরসাইকেল'] };
    query.mockResolvedValue([{ value: JSON.stringify(JSON.stringify(map)) }]);

    expect(await getProhibitedVehicles('bn')).toEqual(['মোটরসাইকেল']);
  });
});
