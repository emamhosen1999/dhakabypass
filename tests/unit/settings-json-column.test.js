import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/db.js', () => ({ query: vi.fn() }));
vi.mock('../../lib/admin/context.js', () => ({ currentActor: () => '' }));

import { query } from '../../lib/db.js';
import { getContactDetails, getSetting } from '../../lib/settings.js';

/**
 * A JSON column reaches the app already parsed from MySQL 8's driver (the
 * stored "999" arrives as the string 999) but as JSON text from MariaDB
 * (arrives as "\"999\""). Both must read as the phone number 999: on
 * 14 September 2026 the first form parsed to the NUMBER 999 and "+880 2…"
 * threw, so no emergency number rendered on a MySQL host at all.
 */
const ROWS = {
  parsed: [
    { setting_key: 'contact.national_emergency_phone', value: '999' },
    { setting_key: 'contact.emergency_phone', value: '+880 2 5555 0199' },
    { setting_key: 'contact.address', value: { en: 'Level 8' } },
  ],
  text: [
    { setting_key: 'contact.national_emergency_phone', value: '"999"' },
    { setting_key: 'contact.emergency_phone', value: '"+880 2 5555 0199"' },
    { setting_key: 'contact.address', value: '{"en":"Level 8"}' },
  ],
};

describe('settings survive both JSON column drivers', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each(['parsed', 'text'])('contact details from %s rows', async (shape) => {
    query.mockResolvedValue(ROWS[shape]);
    const d = await getContactDetails('en');
    expect(d.nationalEmergency).toBe('999');
    expect(d.emergency).toBe('+880 2 5555 0199');
    expect(d.address).toBe('Level 8');
  });

  it.each([[48, 48], ['"48"', '48'], [true, true], ['"999"', '999'], ['999', '999'], ['{"a":1}', { a: 1 }]])('getSetting reads %s as %s', async (stored, expected) => {
    query.mockResolvedValue([{ value: stored }]);
    expect(await getSetting('k', null)).toEqual(expected);
  });
});
