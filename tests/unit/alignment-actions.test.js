// tests/unit/alignment-actions.test.js
//
// The server actions behind /admin/corridor/waypoints and
// /admin/corridor/geometry. Same shape as tests/unit/traffic-actions.test.js:
// the repository and the parsers are mocked, so what is pinned here is the
// order — authorize, then parse, then write, then invalidate — and the fact
// that nothing is invalidated when nothing was written.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../../lib/revalidate', () => ({ revalidateCorridor: vi.fn() }));
vi.mock('../../lib/auth/assert-can', () => ({ assertCan: vi.fn() }));
vi.mock('../../lib/corridor/waypoints-admin', () => ({
  parseWaypoint: vi.fn(), saveWaypoint: vi.fn(), deleteWaypoint: vi.fn(),
}));
vi.mock('../../lib/corridor/geometry-admin', () => ({
  parseAlignment: vi.fn(), replaceGeometry: vi.fn(), clearGeometry: vi.fn(),
}));
vi.mock('../../lib/corridor/traffic', () => ({ listCorridorWaypoints: vi.fn() }));
vi.mock('../../lib/corridor/traffic-admin', () => ({ positiveId: vi.fn((v) => Number(v)) }));

import { assertCan } from '../../lib/auth/assert-can';
import { revalidateCorridor } from '../../lib/revalidate';
import { revalidatePath } from 'next/cache';
import { listCorridorWaypoints } from '../../lib/corridor/traffic';
import { saveWaypoint, deleteWaypoint } from '../../lib/corridor/waypoints-admin';
import { parseAlignment, replaceGeometry, clearGeometry } from '../../lib/corridor/geometry-admin';
import {
  saveWaypointAction, deleteWaypointAction, saveAlignmentAction, clearAlignmentAction,
} from '../../app/admin/(dash)/corridor/alignment-actions';

const form = (values = {}) => new Map(Object.entries(values));

beforeEach(() => {
  vi.resetAllMocks();
  listCorridorWaypoints.mockResolvedValue([{ code: 'S', lat: '23', lng: '90', chainage_m: 0 }]);
  parseAlignment.mockReturnValue({ source: 'survey', attribution: '', points: [1, 2], lengthM: 10 });
});

describe('authorization comes first', () => {
  it.each([
    ['saveWaypointAction', saveWaypointAction],
    ['deleteWaypointAction', deleteWaypointAction],
    ['saveAlignmentAction', saveAlignmentAction],
    ['clearAlignmentAction', clearAlignmentAction],
  ])('%s refuses before touching the database', async (_name, action) => {
    assertCan.mockRejectedValue(new Error('Forbidden'));
    await expect(action(null, form({ id: '4' }))).rejects.toThrow('Forbidden');
    expect(assertCan).toHaveBeenCalledWith('edit_blocks');
    expect(saveWaypoint).not.toHaveBeenCalled();
    expect(deleteWaypoint).not.toHaveBeenCalled();
    expect(replaceGeometry).not.toHaveBeenCalled();
    expect(clearGeometry).not.toHaveBeenCalled();
    expect(revalidateCorridor).not.toHaveBeenCalled();
  });
});

describe('cache invalidation follows a write, and only a write', () => {
  it('invalidates the corridor tag after a waypoint is saved', async () => {
    expect(await saveWaypointAction(null, form())).toHaveProperty('message');
    expect(revalidateCorridor).toHaveBeenCalledOnce();
  });

  it('refreshes the sections screen too, because it labels itself from waypoint names', async () => {
    await saveWaypointAction(null, form());
    const paths = revalidatePath.mock.calls.map(([p]) => p);
    expect(paths).toContain('/admin/corridor/waypoints');
    expect(paths).toContain('/admin/corridor/sections');
  });

  it('invalidates after the alignment is replaced', async () => {
    expect(await saveAlignmentAction(null, form())).toHaveProperty('message');
    expect(replaceGeometry).toHaveBeenCalledOnce();
    expect(revalidateCorridor).toHaveBeenCalledOnce();
  });

  it('invalidates after the alignment is removed', async () => {
    expect(await clearAlignmentAction(null, form({ confirm: 'on' }))).toHaveProperty('message');
    expect(clearGeometry).toHaveBeenCalledOnce();
    expect(revalidateCorridor).toHaveBeenCalledOnce();
  });

  it('leaves the published map alone when the save failed', async () => {
    saveWaypoint.mockRejectedValue(new Error('private database details'));
    expect(await saveWaypointAction(null, form()))
      .toEqual({ error: 'The change could not be saved. Please try again.' });
    expect(revalidateCorridor).not.toHaveBeenCalled();
  });
});

describe('messages an operator can act on', () => {
  it('returns a VALIDATION message unchanged', async () => {
    const err = new Error('Waypoint 4 still defines the corridor section 3-4.');
    err.code = 'VALIDATION';
    deleteWaypoint.mockRejectedValue(err);
    expect(await deleteWaypointAction(null, form({ id: '4' })))
      .toEqual({ error: 'Waypoint 4 still defines the corridor section 3-4.' });
  });

  it('never forwards a raw driver error to the browser', async () => {
    const err = new Error("Duplicate entry '4' for key 'corridor_waypoints.code'");
    err.code = 'ER_DUP_ENTRY';
    saveWaypoint.mockRejectedValue(err);
    const { error } = await saveWaypointAction(null, form());
    expect(error).not.toMatch(/Duplicate entry/);
  });

  it('refuses an alignment it cannot check, rather than accepting it unchecked', async () => {
    // An empty reference list passes every acceptance test vacuously. That is
    // the one way a wrong centreline could be stored silently, so it is refused.
    listCorridorWaypoints.mockResolvedValue([]);
    const { error } = await saveAlignmentAction(null, form());
    expect(error).toMatch(/keeps its current alignment/i);
    expect(replaceGeometry).not.toHaveBeenCalled();
  });

  it('will not remove the imported centreline without the confirmation', async () => {
    const { error } = await clearAlignmentAction(null, form());
    expect(error).toMatch(/confirm/i);
    expect(clearGeometry).not.toHaveBeenCalled();
  });
});
