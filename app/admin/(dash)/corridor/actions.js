'use server';

import { validationError } from '../../../../lib/errors';
import { runAction } from '../../../../lib/admin/run-action';

import { revalidatePath } from 'next/cache';
import { assertCan } from '../../../../lib/auth/assert-can';
import { revalidateCorridor } from '../../../../lib/revalidate';
import { parseChainageField, localeMap } from '../../../../lib/corridor/form';
// friendly() is the browser-facing error allowlist; see lib/errors.js before
// touching it. It lives in an ordinary module because a 'use server' file may
// export async functions only.
import { friendly } from '../../../../lib/errors';
import { saveSegment, deleteSegment, listSegments } from '../../../../lib/corridor/segments';
import { saveInterchange, deleteInterchange, listInterchanges } from '../../../../lib/corridor/interchanges';
import { saveTollRate, deleteTollRate, listAllTollRates } from '../../../../lib/corridor/tolls';
import { saveAdvisory, deleteAdvisory, listAllAdvisories } from '../../../../lib/corridor/advisories';
import { setSetting, getSetting, isDataIllustrative, getPublishedLengthKm } from '../../../../lib/settings';
import { LOCALES } from '../../../../lib/i18n/locales';
import { saveCorridorRoad } from '../../../../lib/corridor/roads';

const ADMIN = '/admin/corridor';

/** Operational data is structural: a translator must not change a toll rate. */
const ACTION = 'edit_blocks';

const STATUSES = ['open', 'construction', 'planned'];
const KINDS = ['interchange', 'toll_plaza', 'service_area', 'u_loop', 'pedestrian_overpass', 'bridge'];
const SEVERITIES = ['info', 'warning', 'closure'];

async function listCorridorAction$inner() {
  await assertCan(ACTION);
  const [segments, interchanges, tolls, advisories, illustrative, publishedLengthKm, prohibited, roadCode] = await Promise.all([
    listSegments(), listInterchanges(), listAllTollRates(), listAllAdvisories(), isDataIllustrative(),
    getPublishedLengthKm(), getSetting('corridor.prohibited_vehicles', {}), getSetting('corridor.road_code', ''),
  ]);
  return { segments, interchanges, tolls, advisories, illustrative, publishedLengthKm, prohibited, roadCode };
}

async function saveSegmentAction$inner(formData) {
  await assertCan(ACTION);
  const id = Number(formData.get('id')) || null;
  const from_m = parseChainageField(formData.get('from_m'));
  const to_m = parseChainageField(formData.get('to_m'));
  const status = String(formData.get('status') || 'planned');
  if (!STATUSES.includes(status)) throw validationError('Status must be open, construction or planned');

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

async function deleteSegmentAction$inner(formData) {
  await assertCan(ACTION);
  try {
    await deleteSegment(Number(formData.get('id')));
  } catch { throw validationError('Could not delete the segment. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/segments`);
}

async function saveInterchangeAction$inner(formData) {
  await assertCan(ACTION);
  const chainage_m = parseChainageField(formData.get('chainage_m'));
  const names = localeMap(formData, 'name');
  if (!names.en) throw validationError('An English name is required');

  const kind = String(formData.get('kind') || 'interchange');
  const status = String(formData.get('status') || 'planned');
  if (!KINDS.includes(kind)) throw validationError('That is not a known kind of location');
  if (!STATUSES.includes(status)) throw validationError('Status must be open, construction or planned');

  try {
    await saveInterchange({
      id: Number(formData.get('id')) || null,
      chainage_m, names, kind, status,
      connects_to_labels: localeMap(formData, 'connects_to'),
      facilities: String(formData.get('facilities') || '')
        .split(',').map((s) => s.trim()).filter(Boolean),
      lat: String(formData.get('lat') || '') || null,
      lng: String(formData.get('lng') || '') || null,
    });
  } catch (err) { friendly(err, 'Could not save the interchange. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/interchanges`);
}

async function deleteInterchangeAction$inner(formData) {
  await assertCan(ACTION);
  try {
    await deleteInterchange(Number(formData.get('id')));
  } catch { throw validationError('Could not delete the interchange. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/interchanges`);
}

async function saveTollRateAction$inner(formData) {
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
      sro_number: String(formData.get('sro_number') || ''),
      sro_date: String(formData.get('sro_date') || ''),
      sro_link: String(formData.get('sro_link') || ''),
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
      throw validationError('A rate for that vehicle class already exists on that date.');
    }
    friendly(err, 'Could not save the toll rate. Please try again.');
  }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/tolls`);
}

async function deleteTollRateAction$inner(formData) {
  await assertCan(ACTION);
  try {
    await deleteTollRate(Number(formData.get('id')));
  } catch { throw validationError('Could not delete the toll rate. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/tolls`);
}

async function saveAdvisoryAction$inner(formData) {
  await assertCan(ACTION);
  const severity = String(formData.get('severity') || 'info');
  if (!SEVERITIES.includes(severity)) {
    throw validationError('Severity must be info, warning or closure');
  }
  const messages = localeMap(formData, 'message');
  if (!messages.en) throw validationError('An English message is required');

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

async function deleteAdvisoryAction$inner(formData) {
  await assertCan(ACTION);
  try {
    await deleteAdvisory(Number(formData.get('id')));
  } catch { throw validationError('Could not delete the advisory. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/advisories`);
}

async function setIllustrativeAction$inner(formData) {
  await assertCan(ACTION);
  try {
    await setSetting('corridor.illustrative', Boolean(formData.get('illustrative')));
  } catch { throw validationError('Could not update the setting. Please try again.'); }
  revalidateCorridor();
  revalidatePath(ADMIN);
}

/**
 * The corridor facts that are settings rather than rows (audit 4.4/4.5): the
 * published length every progress bar divides by, and the vehicle classes
 * barred from the expressway, one per line per language.
 */
async function saveCorridorFactsAction$inner(formData) {
  await assertCan(ACTION);
  const rawLength = String(formData.get('published_length_km') ?? '').trim();
  let length = null;
  if (rawLength !== '') {
    length = Number(rawLength);
    if (!Number.isFinite(length) || length <= 0 || length > 1000) {
      throw validationError('Published length must be a number of kilometres greater than 0, for example 48.');
    }
  }
  const roadCode = String(formData.get('road_code') ?? '').trim();
  if (roadCode.length > 16) throw validationError('Road number must be 16 characters or fewer, for example N105.');
  const prohibited = {};
  for (const locale of LOCALES) {
    const lines = String(formData.get(`prohibited_${locale}`) ?? '')
      .split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.some((l) => l.length > 120)) {
      throw validationError(`Each prohibited vehicle class (${locale}) must be 120 characters or fewer, one per line.`);
    }
    if (lines.length) prohibited[locale] = lines;
  }
  try {
    await setSetting('corridor.published_length_km', length);
    await setSetting('corridor.prohibited_vehicles', prohibited);
    await setSetting('corridor.road_code', roadCode);
  } catch { throw validationError('Could not save the corridor facts. Please try again.'); }
  revalidateCorridor();
  revalidatePath(ADMIN);
}

/** One road's names and reference link on the corridor map (audit 2.5/2.6). */
async function saveCorridorRoadAction$inner(formData) {
  await assertCan(ACTION);
  try {
    await saveCorridorRoad({
      key: String(formData.get('road_key') || ''),
      names: localeMap(formData, 'name'),
      source: String(formData.get('source_url') || ''),
    });
  } catch (err) {
    friendly(err, 'Could not save the road name. Please try again.');
  }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/roads`);
}

// ---------------------------------------------------------------------------
// Every exported action runs through runAction(): a thrown validation error
// becomes a redirect back to the form with the sentence in `?notice=`, which
// is the only way a message survives a production build. See
// lib/admin/run-action.js. The bodies above are unchanged.
// ---------------------------------------------------------------------------
export async function listCorridorAction() {
  return runAction(() => listCorridorAction$inner());
}
export async function saveSegmentAction(formData) {
  return runAction(() => saveSegmentAction$inner(formData));
}
export async function deleteSegmentAction(formData) {
  return runAction(() => deleteSegmentAction$inner(formData));
}
export async function saveInterchangeAction(formData) {
  return runAction(() => saveInterchangeAction$inner(formData));
}
export async function deleteInterchangeAction(formData) {
  return runAction(() => deleteInterchangeAction$inner(formData));
}
export async function saveTollRateAction(formData) {
  return runAction(() => saveTollRateAction$inner(formData));
}
export async function deleteTollRateAction(formData) {
  return runAction(() => deleteTollRateAction$inner(formData));
}
export async function saveAdvisoryAction(formData) {
  return runAction(() => saveAdvisoryAction$inner(formData));
}
export async function deleteAdvisoryAction(formData) {
  return runAction(() => deleteAdvisoryAction$inner(formData));
}
export async function saveCorridorRoadAction(formData) {
  return runAction(() => saveCorridorRoadAction$inner(formData));
}
export async function saveCorridorFactsAction(formData) {
  return runAction(() => saveCorridorFactsAction$inner(formData));
}
export async function setIllustrativeAction(formData) {
  return runAction(() => setIllustrativeAction$inner(formData));
}
