import { parseChainage } from './chainage.js';

/**
 * Marks an error as one of our own deliberate, user-facing validation
 * messages rather than a driver failure or a misconfiguration message. Kept
 * consistent with the same helper in lib/corridor/segments.js,
 * interchanges.js, tolls.js and advisories.js — the admin action layer
 * allowlists on this `code` to decide what may reach the browser unchanged.
 * parseChainageField's throw happens before the actions' try/catch, so it
 * always reaches the caller regardless, but it is marked anyway so the rule
 * holds uniformly across every validation throw in lib/corridor/.
 */
function validationError(message) {
  const err = new Error(message);
  err.code = 'VALIDATION';
  return err;
}

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
