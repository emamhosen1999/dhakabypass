import { parseChainage } from './chainage.js';
import { LOCALES } from '../i18n/locales.js';
import { validationError } from '../errors.js';

/**
 * Reads a chainage from an admin form. Pure and synchronous, so it cannot live
 * in the 'use server' module. Throws a message that tells the editor the format
 * rather than a validation code.
 */
export function parseChainageField(value) {
  const metres = parseChainage(typeof value === 'string' ? value : String(value ?? ''));
  if (metres === null) {
    throw validationError('Enter a chainage like K3+900, or a plain number of metres');
  }
  return metres;
}

/**
 * Collects the per-locale fields a corridor admin form submits as
 * `${prefix}.en`, `${prefix}.bn`, `${prefix}.zh` into one locale map.
 *
 * Empty values are dropped rather than stored as '': the readers
 * (`localeText`, `localeMessage`, `tollClassLabel`) fall back to English on a
 * missing OR empty key, so an empty string would only bloat the JSON column.
 * Callers that need English specifically check `map.en` themselves.
 *
 * Pure and synchronous, so it lives here and not in the 'use server' actions
 * module, which may export async functions only. The locale list comes from
 * lib/i18n/locales.js so adding a fourth locale cannot leave this reader
 * silently ignoring it.
 */
export function localeMap(formData, prefix) {
  const out = {};
  for (const locale of LOCALES) {
    const v = String(formData.get(`${prefix}.${locale}`) ?? '').trim();
    if (v) out[locale] = v;
  }
  return out;
}
