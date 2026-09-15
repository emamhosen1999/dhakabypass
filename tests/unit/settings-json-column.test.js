import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn() }));
vi.mock('../../lib/admin/context.js', () => ({ currentActor: () => '' }));

import { query } from '../../lib/db.js';
import { getContactDetails, getSetting } from '../../lib/settings.js';

/**
 * Every settings reader asks the database for CAST(value AS CHAR), so a JSON
 * column arrives as JSON text on MySQL and MariaDB alike. On 14 September 2026
 * getContactDetails read the raw column: MySQL's driver handed the stored
 * "999" back already parsed, JSON.parse turned it into the NUMBER 999 and
 * threw on "+880 2…", so no emergency number rendered on a MySQL host.
 */
const ROWS = {
  text: [
    { setting_key: 'contact.national_emergency_phone', value: '"999"' },
    { setting_key: 'contact.emergency_phone', value: '"+880 2 5555 0199"' },
    { setting_key: 'contact.address', value: '{"en":"Level 8"}' },
  ],
};

describe('settings survive both JSON column drivers', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each(['text'])('contact details from %s rows', async (shape) => {
    query.mockResolvedValue(ROWS[shape]);
    const d = await getContactDetails('en');
    expect(d.nationalEmergency).toBe('999');
    expect(d.emergency).toBe('+880 2 5555 0199');
    expect(d.address).toBe('Level 8');
  });

  it('asks for the column as text', async () => {
    query.mockResolvedValue([]);
    await getContactDetails('en');
    await getSetting('k', null);
    for (const [sql] of query.mock.calls) expect(sql).toMatch(/CAST\(value AS CHAR\)/);
  });

  it.each([['48', 48], ['"48"', '48'], ['true', true], ['"999"', '999'], ['{"a":1}', { a: 1 }]])('getSetting reads %s as %s', async (stored, expected) => {
    query.mockResolvedValue([{ value: stored }]);
    expect(await getSetting('k', null)).toEqual(expected);
  });
});
