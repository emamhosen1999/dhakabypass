import { it, expect, vi, beforeEach } from 'vitest';
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../../lib/revalidate', () => ({ revalidateCorridor: vi.fn() }));
vi.mock('../../lib/auth/assert-can', () => ({ assertCan: vi.fn() }));
vi.mock('../../lib/corridor/traffic-admin', () => ({
  parseSection: vi.fn(), parseMonthly: vi.fn(), positiveId: vi.fn(),
  saveSection: vi.fn(), saveMonthly: vi.fn(), deleteMonthly: vi.fn(), saveSources: vi.fn(),
}));
vi.mock('../../lib/corridor/traffic-refresh', () => ({ refreshTraffic: vi.fn() }));
import { assertCan } from '../../lib/auth/assert-can';
import { revalidateCorridor } from '../../lib/revalidate';
import { saveSection, saveSources } from '../../lib/corridor/traffic-admin';
import { saveSectionAction, saveTrafficSourcesAction } from '../../app/admin/(dash)/corridor/traffic-actions';
beforeEach(() => vi.resetAllMocks());
it('rejects unauthorized section updates before writing data', async () => {
  assertCan.mockRejectedValue(new Error('Forbidden'));
  await expect(saveSectionAction(null,new Map())).rejects.toThrow('Forbidden');
  expect(assertCan).toHaveBeenCalledWith('edit_blocks');
  expect(saveSection).not.toHaveBeenCalled();
  expect(revalidateCorridor).not.toHaveBeenCalled();
});
it('requires administrator capability to remove sample notices', async () => {
  assertCan.mockRejectedValue(new Error('Forbidden'));
  await expect(saveTrafficSourcesAction(null,new Map())).rejects.toThrow('Forbidden');
  expect(assertCan).toHaveBeenCalledWith('manage_users');
  expect(saveSources).not.toHaveBeenCalled();
});
it('invalidates public data only after a successful save', async () => {
  expect(await saveSectionAction(null,new Map())).toHaveProperty('message');
  expect(revalidateCorridor).toHaveBeenCalledOnce();
});
it('sanitizes unexpected database errors and preserves the cached public state', async () => {
  saveSection.mockRejectedValue(new Error('private database details'));
  expect(await saveSectionAction(null,new Map())).toEqual({error:'The change could not be saved. Please try again.'});
  expect(revalidateCorridor).not.toHaveBeenCalled();
});
