'use server';

/**
 * The corridor's ALIGNMENT: the surveyed waypoints and the drawn centreline.
 *
 * Separate from traffic-actions.js (how the road is behaving) and from
 * actions.js (segments, interchanges, tolls, advisories) because it is a
 * different fact on a different clock — the alignment changes when the road is
 * re-surveyed, not when the traffic does.
 *
 * Both screens use the useActionState shape that the sections and monthly
 * screens already use (components/admin/TrafficForm), so a validation message
 * lands next to the field an operator got wrong instead of replacing the page
 * with an error boundary. That matters more here than anywhere else in the
 * corridor admin: a refused alignment has to be able to EXPLAIN itself.
 */

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateCorridor } from '../../../../lib/revalidate';
// validationError() BUILDS an error and returns it -- it never throws on its
// own. Always `throw validationError(...)`; see lib/errors.js.
import { validationError } from '../../../../lib/errors';
import { positiveId } from '../../../../lib/corridor/traffic-admin';
import { listCorridorWaypoints } from '../../../../lib/corridor/traffic';
import { parseWaypoint, saveWaypoint, deleteWaypointWithin } from '../../../../lib/corridor/waypoints-admin';
import { runInActionContext, actionContext } from '../../../../lib/admin/context';
import { recordHistory, logAudit } from '../../../../lib/admin/history';
import { saveRecord, deleteRecord } from '../../../../lib/admin/record-actions';
import { parseAlignment, replaceGeometry, clearGeometry } from '../../../../lib/corridor/geometry-admin';

/** Operational data is structural: a translator must not move the road. */
const ACTION = 'edit_blocks';

/**
 * Every screen a waypoint name reaches. `/admin/corridor/sections` is on the
 * list because it titles each of its forms "Naojor → Waypoint 2" from these
 * same rows, so renaming a waypoint here and finding the old wording there
 * would look exactly like the save not working.
 */
const PATHS = [
  '/admin/corridor',
  '/admin/corridor/waypoints',
  '/admin/corridor/geometry',
  '/admin/corridor/sections',
];

/**
 * Runs one unit of work and turns its outcome into form state.
 *
 * Nothing is invalidated unless the write succeeded: a failed save must leave
 * the published map exactly as it was, cache included.
 */
async function run(operation, fallback, message) {
  return runInActionContext(async () => {
    // Refusal to an unauthorised caller throws, as before; only the work's own
    // failures become form state.
    await assertCan(ACTION);
    try {
      await operation();
    } catch (err) {
      if (err?.code === 'VALIDATION') return { error: err.message };
      return { error: fallback };
    }
    revalidateCorridor();
    for (const path of PATHS) revalidatePath(path);
    const flash = actionContext()?.flash;
    return { message: flash?.t || message, undo: flash?.u || null, at: Date.now() };
  });
}

export async function saveWaypointAction(_state, form) {
  return run(
    () => {
      const input = parseWaypoint(form);
      return saveRecord('waypoint', input?.id || null, form, () => saveWaypoint(input));
    },
    'The change could not be saved. Please try again.',
    'Saved. The corridor map and the traffic status table now use this name.',
  );
}

export async function deleteWaypointAction(_state, form) {
  return run(
    () => {
      const id = positiveId(form.get('id'));
      return deleteRecord('waypoint', id, { formData: form, remove: (q) => deleteWaypointWithin(q, id) });
    },
    'The waypoint could not be removed. Please try again.',
    'Waypoint removed.',
  );
}

export async function saveAlignmentAction(_state, form) {
  return run(
    async () => {
      // Read the waypoints INSIDE the operation so a database outage becomes a
      // refusal to replace the alignment, not a replacement judged against an
      // empty reference list — which would pass every acceptance test.
      const waypoints = await listCorridorWaypoints();
      if (!waypoints.length) {
        throw validationError(
          'The surveyed waypoints could not be read, so this alignment cannot be checked '
          + 'against them. The corridor keeps its current alignment.',
        );
      }
      const { points, source, attribution, lengthM } = parseAlignment(form, waypoints);
      // The line being replaced goes into history, restorable from this screen.
      await recordHistory('alignment', 1, { action: 'replace' });
      await replaceGeometry({ points, source, attribution, lengthM });
      await logAudit({ action: 'alignment.replace', type: 'alignment', id: 1, label: `alignment (${points.length} points, ${source})` });
    },
    'The alignment could not be stored. The corridor keeps its current alignment.',
    'Stored. The public corridor map now draws this alignment.',
  );
}

export async function clearAlignmentAction(_state, form) {
  return run(
    async () => {
      if (form.get('confirm') !== 'on') {
        throw validationError(
          'Tick the confirmation. Removing the centreline makes the public map fall back '
          + 'to the surveyed waypoints and label itself a schematic.',
        );
      }
      await recordHistory('alignment', 1, { action: 'remove' });
      await clearGeometry();
      await logAudit({ action: 'alignment.remove', type: 'alignment', id: 1, label: 'alignment' });
    },
    'The alignment could not be removed. Please try again.',
    'Removed. The map now draws the surveyed waypoint polyline and labels itself a schematic.',
  );
}
