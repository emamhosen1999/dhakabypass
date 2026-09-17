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
import { saveSegment, listSegments } from '../../../../lib/corridor/segments';
import { saveInterchange, listInterchanges } from '../../../../lib/corridor/interchanges';
import { saveTollRate, listAllTollRates } from '../../../../lib/corridor/tolls';
import { saveAdvisory, listAllAdvisories } from '../../../../lib/corridor/advisories';
import { setSetting, getSetting, isDataIllustrative, getPublishedLengthKm } from '../../../../lib/settings';
import { LOCALES } from '../../../../lib/i18n/locales';
import { saveCorridorRoad } from '../../../../lib/corridor/roads';
import { saveRecord, deleteRecord } from '../../../../lib/admin/record-actions';
import { revalidateWeather } from '../../../../lib/revalidate';
import { WEATHER_KEYS, WEATHER_DEFAULTS } from '../../../../lib/weather/advisory';
import { readThresholds } from '../../../../lib/weather/cache';

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

async function listWeatherThresholdsAction$inner() {
  await assertCan(ACTION);
  return readThresholds();
}

/**
 * The three figures that turn an Open-Meteo reading into a fog, rain or
 * wind advisory on the corridor-weather block. Each must be a positive
 * number; a blank goes back to the default rather than switching the
 * hazard off, because there is no honest "never warn about fog".
 */
async function saveWeatherThresholdsAction$inner(formData) {
  await assertCan(ACTION);
  const values = {};
  const bounds = { fog: [50, 20000], rain: [0.5, 200], wind: [10, 200] };
  for (const name of Object.keys(WEATHER_KEYS)) {
    const raw = String(formData.get(`weather_${name}`) ?? '').trim();
    if (raw === '') { values[name] = WEATHER_DEFAULTS[name]; continue; }
    const n = Number(raw);
    const [lo, hi] = bounds[name];
    if (!Number.isFinite(n) || n < lo || n > hi) {
      throw validationError(`The ${name} threshold must be a number between ${lo} and ${hi}.`);
    }
    values[name] = n;
  }
  try {
    for (const [name, key] of Object.entries(WEATHER_KEYS)) await setSetting(key, values[name]);
  } catch { throw validationError('Could not save the weather thresholds. Please try again.'); }
  revalidateWeather();
  revalidatePath(ADMIN);
}

async function saveSegmentAction$inner(formData) {
  await assertCan(ACTION);
  const id = Number(formData.get('id')) || null;
  const from_m = parseChainageField(formData.get('from_m'));
  const to_m = parseChainageField(formData.get('to_m'));
  const status = String(formData.get('status') || 'planned');
  if (!STATUSES.includes(status)) throw validationError('Status must be open, construction or planned');

  try {
    await saveRecord('segment', id, formData, () => saveSegment({
      id, from_m, to_m, status,
      opened_on: String(formData.get('opened_on') || '') || null,
      labels: localeMap(formData, 'label'),
    }));
  } catch (err) { friendly(err, 'Could not save the segment. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/segments`);
}

async function deleteSegmentAction$inner(formData) {
  await assertCan(ACTION);
  try {
    await deleteRecord('segment', Number(formData.get('id')), { formData });
  } catch (err) { friendly(err, 'Could not delete the segment. Please try again.'); }
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

  const id = Number(formData.get('id')) || null;
  try {
    await saveRecord('interchange', id, formData, () => saveInterchange({
      id,
      chainage_m, names, kind, status,
      connects_to_labels: localeMap(formData, 'connects_to'),
      facilities: String(formData.get('facilities') || '')
        .split(',').map((s) => s.trim()).filter(Boolean),
      lat: String(formData.get('lat') || '') || null,
      lng: String(formData.get('lng') || '') || null,
    }));
  } catch (err) { friendly(err, 'Could not save the interchange. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/interchanges`);
}

async function deleteInterchangeAction$inner(formData) {
  await assertCan(ACTION);
  try {
    // Its fares go to the trash with it and come back with it.
    await deleteRecord('interchange', Number(formData.get('id')), { formData });
  } catch (err) { friendly(err, 'Could not delete the interchange. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/interchanges`);
}

async function saveTollRateAction$inner(formData) {
  await assertCan(ACTION);
  const id = Number(formData.get('id')) || null;
  try {
    await saveRecord('toll_rate', id, formData, () => saveTollRate({
      id,
      vehicle_class: String(formData.get('vehicle_class') || '').trim(),
      class_labels: localeMap(formData, 'class'),
      class_order: Number(formData.get('class_order')) || 0,
      section: String(formData.get('section') || ''),
      amount_bdt: Number(formData.get('amount_bdt')),
      effective_from: String(formData.get('effective_from') || ''),
      sro_number: String(formData.get('sro_number') || ''),
      sro_date: String(formData.get('sro_date') || ''),
      sro_link: String(formData.get('sro_link') || ''),
      payment_methods: String(formData.get('payment_methods') || '').split(','),
    }));
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
    await deleteRecord('toll_rate', Number(formData.get('id')), { formData });
  } catch (err) { friendly(err, 'Could not delete the toll rate. Please try again.'); }
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

  const id = Number(formData.get('id')) || null;
  try {
    await saveRecord('advisory', id, formData, () => saveAdvisory({
      id,
      severity, messages,
      starts_at: String(formData.get('starts_at') || '').replace('T', ' ') || null,
      ends_at: String(formData.get('ends_at') || '').replace('T', ' ') || null,
      is_active: formData.get('is_active') ? 1 : 0,
    }));
  } catch (err) { friendly(err, 'Could not save the advisory. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/advisories`);
}

async function deleteAdvisoryAction$inner(formData) {
  await assertCan(ACTION);
  try {
    await deleteRecord('advisory', Number(formData.get('id')), { formData });
  } catch (err) { friendly(err, 'Could not delete the advisory. Please try again.'); }
  revalidateCorridor();
  revalidatePath(`${ADMIN}/advisories`);
}

async function setIllustrativeAction$inner(formData) {
  await assertCan(ACTION);
  const next = Boolean(formData.get('illustrative'));
  if (!next && (await isDataIllustrative()) && !formData.get('confirm_real')) {
    throw validationError('Tick "DBEDC has confirmed this data" to remove the provisional notice from every operational page.');
  }
  try {
    await setSetting('corridor.illustrative', next);
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
  const key = String(formData.get('road_key') || '');
  try {
    await saveRecord('road', key, formData, () => saveCorridorRoad({
      key,
      names: localeMap(formData, 'name'),
      source: String(formData.get('source_url') || ''),
    }));
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
  return runAction(() => listCorridorAction$inner(), { name: 'listCorridorAction' });
}
export async function saveSegmentAction(formData) {
  return runAction(() => saveSegmentAction$inner(formData), { name: 'saveSegmentAction', form: formData });
}
export async function deleteSegmentAction(formData) {
  return runAction(() => deleteSegmentAction$inner(formData), { name: 'deleteSegmentAction', form: formData });
}
export async function saveInterchangeAction(formData) {
  return runAction(() => saveInterchangeAction$inner(formData), { name: 'saveInterchangeAction', form: formData });
}
export async function deleteInterchangeAction(formData) {
  return runAction(() => deleteInterchangeAction$inner(formData), { name: 'deleteInterchangeAction', form: formData });
}
export async function saveTollRateAction(formData) {
  return runAction(() => saveTollRateAction$inner(formData), { name: 'saveTollRateAction', form: formData });
}
export async function deleteTollRateAction(formData) {
  return runAction(() => deleteTollRateAction$inner(formData), { name: 'deleteTollRateAction', form: formData });
}
export async function saveAdvisoryAction(formData) {
  return runAction(() => saveAdvisoryAction$inner(formData), { name: 'saveAdvisoryAction', form: formData });
}
export async function deleteAdvisoryAction(formData) {
  return runAction(() => deleteAdvisoryAction$inner(formData), { name: 'deleteAdvisoryAction', form: formData });
}
export async function saveCorridorRoadAction(formData) {
  return runAction(() => saveCorridorRoadAction$inner(formData), { name: 'saveCorridorRoadAction', form: formData });
}
export async function saveCorridorFactsAction(formData) {
  return runAction(() => saveCorridorFactsAction$inner(formData), { name: 'saveCorridorFactsAction', form: formData });
}
export async function listWeatherThresholdsAction() {
  return runAction(() => listWeatherThresholdsAction$inner(), { name: 'listWeatherThresholdsAction' });
}
export async function saveWeatherThresholdsAction(formData) {
  return runAction(() => saveWeatherThresholdsAction$inner(formData), { name: 'saveWeatherThresholdsAction', form: formData });
}
export async function setIllustrativeAction(formData) {
  return runAction(() => setIllustrativeAction$inner(formData), { name: 'setIllustrativeAction', form: formData });
}
