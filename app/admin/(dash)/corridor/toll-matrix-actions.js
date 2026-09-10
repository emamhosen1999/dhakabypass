'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateCorridor } from '../../../../lib/revalidate';
// friendly() is the browser-facing error allowlist; see lib/errors.js before
// touching it. It lives in an ordinary module because a 'use server' file may
// export async functions only.
import { friendly } from '../../../../lib/errors';
import { listInterchanges } from '../../../../lib/corridor/interchanges';
import {
  saveTollOdRate, deleteTollOdRate, listAllTollOdRates, tollPoints, DIRECTIONS,
} from '../../../../lib/corridor/toll-matrix';

/**
 * The O–D fare matrix admin, at /admin/corridor/toll-matrix.
 *
 * A separate file from corridor/actions.js on purpose: that module is already
 * five record types long, and a 'use server' file exports every function in it
 * as a network endpoint. Keeping the fare matrix's endpoints in their own file
 * keeps that surface readable.
 *
 * `is_provisional` IS NOT READ FROM THE FORM, and there is no field for it.
 * It is a generated column over `sro_number` (db/sql/12-toll-od-matrix.sql),
 * so the database would reject the write in any case — but not sending it is
 * what makes the intent legible: an operator confirms a fare by entering the
 * S.R.O. number and date that make it confirmed, and by no other action.
 */

const ADMIN = '/admin/corridor';

/** Operational data is structural: a translator must not change a toll. */
const ACTION = 'edit_blocks';

export async function listTollMatrixAction() {
  await assertCan(ACTION);
  const [fares, interchanges] = await Promise.all([listAllTollOdRates(), listInterchanges()]);
  // Only `kind = 'toll_plaza'` records may be an origin or a destination, and
  // that is decided by tollPoints() — the same function the public block uses,
  // so the operator cannot pick a plaza the renderer would not recognise.
  return { fares, points: tollPoints(interchanges) };
}

export async function saveTollOdRateAction(formData) {
  await assertCan(ACTION);

  const direction = String(formData.get('direction') || '');
  if (direction && !DIRECTIONS.includes(direction)) {
    throw new Error('Choose which carriageway this fare applies to');
  }

  try {
    await saveTollOdRate({
      id: Number(formData.get('id')) || null,
      // Coerced at the form boundary, so the repository receives ids and not
      // the strings a <select> submits. Number('') is 0, which intField()
      // rejects with "Choose an entry toll plaza" — the message an operator
      // who left the select alone should see.
      origin_interchange_id: Number(formData.get('origin_interchange_id')),
      destination_interchange_id: Number(formData.get('destination_interchange_id')),
      direction: direction || null,
      vehicle_class: String(formData.get('vehicle_class') || '').trim(),
      distance_m: Number(formData.get('distance_m')),
      amount_bdt: Number(formData.get('amount_bdt')),
      effective_from: String(formData.get('effective_from') || ''),
      derivation: String(formData.get('derivation') || 'gazette'),
      sro_number: String(formData.get('sro_number') || ''),
      sro_date: String(formData.get('sro_date') || ''),
      sro_link: String(formData.get('sro_link') || ''),
    });
  } catch (err) {
    // uq_toll_od (origin, destination, class, effective_from). The screen's
    // own help text tells operators to schedule a change by adding a row with
    // a later effective date, so doing that on a date that already has one is
    // the likeliest mistake here — and it is a PERMANENT failure, which the
    // generic "please try again" would invite them to repeat forever. Same
    // treatment saveTollRateAction already gives its own duplicate case.
    if (err?.code === 'ER_DUP_ENTRY') {
      throw new Error('There is already a fare for that pair and vehicle class on that date.');
    }
    friendly(err, 'Could not save the fare. Please try again.');
  }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/toll-matrix`);
}

export async function deleteTollOdRateAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteTollOdRate(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the fare. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/toll-matrix`);
}
