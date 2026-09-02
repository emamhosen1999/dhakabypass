'use server';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateCorridor } from '../../../../lib/revalidate';
import { parseChainageField } from '../../../../lib/corridor/form';
import { saveSegment, deleteSegment, listSegments } from '../../../../lib/corridor/segments';
import { saveInterchange, deleteInterchange, listInterchanges } from '../../../../lib/corridor/interchanges';
import { saveTollRate, deleteTollRate, listAllTollRates } from '../../../../lib/corridor/tolls';
import { saveAdvisory, deleteAdvisory, listAllAdvisories } from '../../../../lib/corridor/advisories';
import { setSetting, isDataIllustrative } from '../../../../lib/settings';

const ADMIN = '/admin/corridor';

/** Operational data is structural: a translator must not change a toll rate. */
const ACTION = 'edit_blocks';

const STATUSES = ['open', 'construction', 'planned'];
const KINDS = ['interchange', 'toll_plaza', 'service_area', 'u_loop', 'pedestrian_overpass', 'bridge'];
const SEVERITIES = ['info', 'warning', 'closure'];

function localeMap(formData, prefix) {
  const out = {};
  for (const locale of ['en', 'bn', 'zh']) {
    const v = String(formData.get(`${prefix}.${locale}`) ?? '').trim();
    if (v) out[locale] = v;
  }
  return out;
}

/**
 * Allowlist, not a denylist: only errors WE recognise as safe -- our own
 * validation from lib/corridor/* and lib/corridor/form.js, each marked with
 * `.code = 'VALIDATION'` by their own `validationError()` helper -- are
 * shown to the browser unchanged. Everything else (a raw driver error such
 * as ER_DUP_ENTRY, a misconfiguration message naming DB_HOST/DB_NAME/DB_USER,
 * or an internal TypeError) becomes the caller's generic fallback instead. A
 * new failure mode added later defaults to hidden, not to leaking.
 */
function friendly(err, fallback) {
  if (err?.code === 'VALIDATION') throw err;
  throw new Error(fallback);
}

export async function listCorridorAction() {
  await assertCan(ACTION);
  const [segments, interchanges, tolls, advisories, illustrative] = await Promise.all([
    listSegments(), listInterchanges(), listAllTollRates(), listAllAdvisories(), isDataIllustrative(),
  ]);
  return { segments, interchanges, tolls, advisories, illustrative };
}

export async function saveSegmentAction(formData) {
  await assertCan(ACTION);
  const id = Number(formData.get('id')) || null;
  const from_m = parseChainageField(formData.get('from_m'));
  const to_m = parseChainageField(formData.get('to_m'));
  const status = String(formData.get('status') || 'planned');
  if (!STATUSES.includes(status)) throw new Error('Status must be open, construction or planned');

  try {
    await saveSegment({
      id, from_m, to_m, status,
      opened_on: String(formData.get('opened_on') || '') || null,
      labels: localeMap(formData, 'label'),
    });
  } catch (err) { friendly(err, 'Could not save the segment. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/segments`);
}

export async function deleteSegmentAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteSegment(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the segment. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/segments`);
}

export async function saveInterchangeAction(formData) {
  await assertCan(ACTION);
  const chainage_m = parseChainageField(formData.get('chainage_m'));
  const names = localeMap(formData, 'name');
  if (!names.en) throw new Error('An English name is required');

  const kind = String(formData.get('kind') || 'interchange');
  const status = String(formData.get('status') || 'planned');
  if (!KINDS.includes(kind)) throw new Error('That is not a known kind of location');
  if (!STATUSES.includes(status)) throw new Error('Status must be open, construction or planned');

  try {
    await saveInterchange({
      id: Number(formData.get('id')) || null,
      chainage_m, names, kind, status,
      connects_to: String(formData.get('connects_to') || ''),
      facilities: String(formData.get('facilities') || '')
        .split(',').map((s) => s.trim()).filter(Boolean),
      lat: String(formData.get('lat') || '') || null,
      lng: String(formData.get('lng') || '') || null,
    });
  } catch (err) { friendly(err, 'Could not save the interchange. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/interchanges`);
}

export async function deleteInterchangeAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteInterchange(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the interchange. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/interchanges`);
}

export async function saveTollRateAction(formData) {
  await assertCan(ACTION);
  try {
    await saveTollRate({
      id: Number(formData.get('id')) || null,
      vehicle_class: String(formData.get('vehicle_class') || '').trim(),
      class_labels: localeMap(formData, 'class'),
      class_order: Number(formData.get('class_order')) || 0,
      section: String(formData.get('section') || ''),
      amount_bdt: Number(formData.get('amount_bdt')),
      effective_from: String(formData.get('effective_from') || ''),
    });
  } catch (err) {
    // toll_rates has UNIQUE KEY uq_class_effective (vehicle_class, effective_from).
    // The admin's own help text tells operators to schedule a change by adding a
    // new row for the same class with a future effective date -- doing that on a
    // date that already has a row for that class is the most likely mistake on
    // this screen, and it is a PERMANENT failure: the generic "please try again"
    // fallback tells the operator to retry something that will fail forever.
    // Give it a specific, actionable message instead, same as
    // app/admin/(dash)/pages-v2/actions.js does for its own ER_DUP_ENTRY case.
    if (err?.code === 'ER_DUP_ENTRY') {
      throw new Error('A rate for that vehicle class already exists on that date.');
    }
    friendly(err, 'Could not save the toll rate. Please try again.');
  }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/tolls`);
}

export async function deleteTollRateAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteTollRate(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the toll rate. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/tolls`);
}

export async function saveAdvisoryAction(formData) {
  await assertCan(ACTION);
  const severity = String(formData.get('severity') || 'info');
  if (!SEVERITIES.includes(severity)) {
    throw new Error('Severity must be info, warning or closure');
  }
  const messages = localeMap(formData, 'message');
  if (!messages.en) throw new Error('An English message is required');

  try {
    await saveAdvisory({
      id: Number(formData.get('id')) || null,
      severity, messages,
      starts_at: String(formData.get('starts_at') || '').replace('T', ' ') || null,
      ends_at: String(formData.get('ends_at') || '').replace('T', ' ') || null,
      is_active: formData.get('is_active') ? 1 : 0,
    });
  } catch (err) { friendly(err, 'Could not save the advisory. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/advisories`);
}

export async function deleteAdvisoryAction(formData) {
  await assertCan(ACTION);
  try {
    await deleteAdvisory(Number(formData.get('id')));
  } catch { throw new Error('Could not delete the advisory. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/advisories`);
}

export async function setIllustrativeAction(formData) {
  await assertCan(ACTION);
  try {
    await setSetting('corridor.illustrative', Boolean(formData.get('illustrative')));
  } catch { throw new Error('Could not update the setting. Please try again.'); }
  revalidateCorridor();
  revalidatePath(ADMIN);
}
